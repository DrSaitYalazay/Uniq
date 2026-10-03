// ============================================================================
// Passwortrichtlinie — Spiegel von api/src/lib/password-policy.js (A-15).
// ----------------------------------------------------------------------------
// WICHTIG: verbindlich ist ausschliesslich die SERVERSEITIGE Prüfung. Das hier
// ist Bedienkomfort — der Nutzer soll die Regel lesen und den Verstoss sofort
// sehen, statt das Formular abzuschicken und eine Fehlermeldung zurückzubekommen.
// Wer diese Datei umgeht (Konsole, eigener Client), kommt trotzdem nicht an der
// Prüfung in auth.js vorbei.
//
// Keine erzwungene Zeichenklassen-Mischung: BSI und NIST raten davon ab, weil
// sie nur vorhersehbare Muster erzeugt. Wirksam ist die Länge.
// Bei Änderungen hier IMMER api/src/lib/password-policy.js mitziehen.
// ============================================================================

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 72;

// Gekürzte Fassung der Server-Sperrliste: hier reicht, was ein Nutzer nach dem
// Sprung auf 12 Zeichen naheliegend tippt. Die vollständige Liste (und damit die
// verbindliche Ablehnung) steht serverseitig.
const COMMON_PASSWORDS = new Set([
  '123456789012', 'password1234', 'passw0rd123', 'qwertyuiop123', '1q2w3e4r5t6y',
  'asdfghjkl123', 'welcome123', 'administrator', 'admin123456', 'aaaaaaaaaaaa',
  'passwort1234', 'passwort123', 'geheim123456', 'qwertzuiop12', 'willkommen123',
  'hallowelt123', 'deutschland1', 'schatzi12345', 'fussball123',
  'sifre123456', 'parola123456', 'merhaba12345', 'istanbul1453', 'ankara123456',
  'galatasaray1905', 'fenerbahce1907', 'besiktas1903', 'trabzonspor1967',
  'canimbenim123', 'askimsevgilim',
]);

/** Hinweistext für die Formulare (deutsch/englisch wie die übrige Oberfläche). */
export function passwordRuleHint(de: boolean): string {
  return de
    ? `Mindestens ${PASSWORD_MIN_LENGTH} Zeichen (max. ${PASSWORD_MAX_LENGTH}). Keine Vorgabe zu Groß-/Kleinschreibung oder Sonderzeichen — die Länge zählt. Nicht Ihre E-Mail-Adresse und kein allgemein bekanntes Passwort.`
    : `At least ${PASSWORD_MIN_LENGTH} characters (max ${PASSWORD_MAX_LENGTH}). No upper/lower/special-character requirement — length is what counts. Must not be your email address or a well-known password.`;
}

/**
 * @returns Fehlermeldung oder null. Bewusst dieselbe Reihenfolge der Regeln wie
 * auf dem Server, damit Nutzer nicht erst die eine und dann die andere Meldung
 * bekommen.
 */
export function passwordPolicyError(password: string, opts: { email?: string; de: boolean }): string | null {
  const pw = String(password ?? '');
  const { de } = opts;

  if (pw.length < PASSWORD_MIN_LENGTH) {
    return de
      ? `Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`
      : `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  // Byte-Länge, nicht Zeichenzahl: bcrypt zählt Bytes und schneidet nach 72 ab.
  if (new TextEncoder().encode(pw).length > PASSWORD_MAX_LENGTH) {
    return de
      ? `Passwort darf höchstens ${PASSWORD_MAX_LENGTH} Zeichen lang sein.`
      : `Password must be at most ${PASSWORD_MAX_LENGTH} characters long.`;
  }

  const pwLower = pw.toLowerCase();
  const mail = String(opts.email ?? '').trim().toLowerCase();
  if (mail) {
    const local = mail.split('@')[0];
    if (pwLower === mail || (local && pwLower === local)) {
      return de
        ? 'Passwort darf nicht Ihre E-Mail-Adresse oder deren Teil vor dem @ sein.'
        : 'The password must not be your email address or the part before the @.';
    }
  }

  if (COMMON_PASSWORDS.has(pwLower)) {
    return de
      ? 'Dieses Passwort ist zu bekannt. Bitte wählen Sie ein anderes.'
      : 'This password is too well known. Please choose another one.';
  }
  return null;
}
