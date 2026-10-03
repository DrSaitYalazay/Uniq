// ============================================================================
// cy — Passwortrichtlinie (A-15) + bcrypt-Kostenfaktor (A-16)
// ----------------------------------------------------------------------------
// Vorher gab es KEINE Regel: `/auth/signup`, `PUT /auth/user`, der Reset über
// `/auth/recover/confirm` und die Einladung nahmen jedes Passwort an, auch `a`.
// Ein einzelnes Zeichen ist auch mit Anmeldebremse in Sekunden geraten — die
// Bremse begrenzt die Versuchsrate, nicht die Ratewahrscheinlichkeit.
//
// WARUM Länge statt Zeichenklassen-Mischung: BSI (IT-Grundschutz ORP.4.A8 in der
// Fassung seit 2020) und NIST SP 800-63B raten von erzwungenen Groß-/Klein-/
// Ziffern-/Sonderzeichen-Regeln und turnusmäßigem Wechsel ausdrücklich ab. Sie
// erzeugen vorhersehbare Muster („Passwort1!", „Sommer2026!") und drängen Nutzer
// zum Aufschreiben, ohne die Entropie nennenswert zu erhöhen. Wirksam sind: eine
// echte Mindestlänge, eine Sperrliste bekannter Passwörter und keine willkürliche
// Obergrenze. Genau das steht hier.
//
// Diese Datei ist die EINZIGE Quelle der Regel; alle vier Setz-Stellen rufen
// passwordPolicyError() auf. Das Frontend spiegelt die Regel nur als Hinweis —
// verbindlich ist ausschliesslich diese serverseitige Prüfung.
// ============================================================================

export const PASSWORD_MIN_LENGTH = 12;
// Obergrenze aus der Technik, nicht aus Schikane: bcrypt verarbeitet nur die
// ersten 72 Bytes. Ohne Deckel wären zwei verschiedene lange Passwörter mit
// gleichem 72-Byte-Anfang derselbe Hash — der Nutzer glaubte an mehr Sicherheit,
// als er bekommt. Lieber ablehnen als stillschweigend abschneiden.
export const PASSWORD_MAX_LENGTH = 72;

// A-16: bcrypt-Kosten 10 → 12. Der Kostenfaktor ist der Zweierlogarithmus der
// Runden: 12 kostet VIERMAL so viel Rechenzeit je Versuch wie 10. Auf heutiger
// Hardware liegt 10 im Bereich weniger Millisekunden — eine gestohlene
// Hash-Tabelle liesse sich damit auf einer einzelnen GPU-Maschine massenhaft
// durchprobieren. 12 landet bei rund 200–300 ms je Hash: für die Anmeldung
// unmerklich, für den Angreifer der Faktor 4 auf jeden einzelnen Rateversuch.
// Altbestand bleibt gültig: der Kostenfaktor steht IM Hash ($2a$10$… / $2b$12$…),
// bcrypt.compare liest ihn von dort. Nirgends im Code wird ein Präfix oder eine
// Länge des Hashes angenommen, und die Spalte auth.users.encrypted_password ist
// `text` ohne Beschränkung — alte Hashes mit Kosten 10 (und die per pgcrypto
// gesetzten Demo-Hashes) verifizieren also unverändert weiter.
export const BCRYPT_COST = 12;

// Kleine eingebaute Sperrliste offensichtlicher Passwörter (deutsche und
// türkische Klassiker inbegriffen, weil die Oberfläche beide Sprachen bedient).
// Bewusst KEINE Millionenliste als Abhängigkeit: die soll später ein Dienst
// (HIBP-Range-API) übernehmen; hier geht es darum, die naheliegendsten Griffe
// abzufangen, die ein Nutzer nach dem Sprung auf 12 Zeichen tut.
// Einträge unter 12 Zeichen scheitern schon an der Längenregel; sie bleiben in
// der Liste, damit sie auch bei einer künftigen anderen Mindestlänge greift.
const COMMON_PASSWORDS = new Set([
  // international
  '123456', '1234567', '12345678', '123456789', '1234567890', '123456789012',
  'password', 'password1', 'password123', 'password1234', 'passw0rd123',
  'qwerty', 'qwertyuiop', 'qwertyuiop123', '1q2w3e4r5t6y', 'asdfghjkl123',
  'iloveyou', 'letmein', 'welcome', 'welcome123', 'monkey', 'dragon',
  'administrator', 'admin123456', 'sunshine', 'football', 'aaaaaaaaaaaa',
  // deutsch
  'passwort', 'passwort1', 'passwort123', 'passwort1234', 'geheim123456',
  'qwertzuiop', 'qwertzuiop12', 'willkommen', 'willkommen123', 'hallowelt123',
  'deutschland1', 'sommer2026', 'winter2026', 'schatzi12345', 'fussball123',
  // türkisch
  'sifre123456', 'parola123456', 'merhaba12345', 'istanbul1453', 'ankara123456',
  'galatasaray1905', 'fenerbahce1907', 'besiktas1903', 'trabzonspor1967',
  'canimbenim123', 'askimsevgilim',
]);

// Meldungen deutsch + türkisch, wie die übrigen Auth-Meldungen. Jede nennt die
// VERLETZTE Regel konkret — sonst probiert der Nutzer blind weiter und landet
// am Ende beim Support.
const MESSAGES = {
  tooShort: `Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein. / Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`,
  tooLong: `Passwort darf höchstens ${PASSWORD_MAX_LENGTH} Zeichen lang sein. / Şifre en fazla ${PASSWORD_MAX_LENGTH} karakter olabilir.`,
  isEmail: 'Passwort darf nicht Ihre E-Mail-Adresse oder deren Teil vor dem @ sein. / Şifre e-posta adresiniz veya @ işaretinden önceki kısmı olamaz.',
  tooCommon: 'Dieses Passwort ist zu bekannt und wird abgelehnt. Bitte wählen Sie ein anderes. / Bu şifre çok yaygın olduğu için kabul edilmiyor. Lütfen başka bir şifre seçin.',
};

export const PASSWORD_RULE_TEXT = {
  de: `Mindestens ${PASSWORD_MIN_LENGTH} Zeichen. Keine Vorgabe zu Groß-/Kleinschreibung oder Sonderzeichen — Länge zählt. Nicht die eigene E-Mail-Adresse und kein allgemein bekanntes Passwort.`,
  tr: `En az ${PASSWORD_MIN_LENGTH} karakter. Büyük/küçük harf veya özel karakter zorunluluğu yok — uzunluk önemlidir. E-posta adresiniz veya yaygın bir şifre olamaz.`,
};

/**
 * Prüft ein Passwort gegen die Richtlinie.
 * @param {string} password rohes Passwort
 * @param {{email?: string}} [opts] E-Mail des Kontos, für die Gleichheitsregel
 * @returns {string|null} Fehlermeldung (deutsch + türkisch) oder null, wenn ok
 */
export function passwordPolicyError(password, { email } = {}) {
  const pw = String(password ?? '');
  if (pw.length < PASSWORD_MIN_LENGTH) return MESSAGES.tooShort;
  // Nicht pw.length, sondern die Byte-Länge: bcrypt zählt Bytes, und ein Umlaut
  // oder Emoji belegt mehrere. Sonst hiesse „72 Zeichen ok" und bcrypt schnitte
  // trotzdem ab.
  if (Buffer.byteLength(pw, 'utf8') > PASSWORD_MAX_LENGTH) return MESSAGES.tooLong;

  const pwLower = pw.toLowerCase();
  const mail = String(email ?? '').trim().toLowerCase();
  if (mail) {
    const local = mail.split('@')[0];
    if (pwLower === mail || (local && pwLower === local)) return MESSAGES.isEmail;
  }

  if (COMMON_PASSWORDS.has(pwLower)) return MESSAGES.tooCommon;
  return null;
}
