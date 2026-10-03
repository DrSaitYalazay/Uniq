// Basit e-posta şablon render'ı. Gerçek HTML şablonları buraya eklenebilir.
// (Orijinal projedeki supabase/functions/_shared/*-email-templates içerikleri
//  buraya taşınabilir; şimdilik güvenli, minimal sürüm.)
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const TEMPLATES = {
  recovery: (v) => ({
    subject: 'Passwort zurücksetzen',
    html: `<p>Passwort zurücksetzen:</p><p><a href="${esc(v.reset_link)}">${esc(v.reset_link)}</a></p>`
      + `<p>Der Link ist ${esc(v.ttl_minutes || 60)} Minuten gültig.</p>`,
  }),
  // E-Mail-Wechsel: Bestätigung geht an die NEUE Adresse — erst dieser Klick
  // schreibt die Adresse um.
  'email-change-confirm': (v) => ({
    subject: 'Neue E-Mail-Adresse bestätigen',
    html: `<p>Bestätigen Sie die neue Adresse <strong>${esc(v.new_email)}</strong>:</p>`
      + `<p><a href="${esc(v.confirm_link)}">${esc(v.confirm_link)}</a></p>`
      + `<p>Der Link ist ${esc(v.ttl_minutes || 60)} Minuten gültig.</p>`,
  }),
  // Hinweis an die ALTE Adresse: der bisherige Inhaber erfährt vom Versuch,
  // auch wenn er die neue Mailbox nicht sieht.
  'email-change-notice': (v) => ({
    subject: 'Änderung Ihrer E-Mail-Adresse angefordert',
    html: `<p>Für Ihr Konto wurde die neue Adresse <strong>${esc(v.new_email)}</strong> angefordert.</p>`
      + `<p>Waren Sie das nicht, ändern Sie bitte sofort Ihr Passwort — die Änderung wird erst nach Bestätigung über die neue Adresse wirksam.</p>`,
  }),
  // A-18: beide Registrierungs-Ausgänge schicken eine Mail, damit die HTTP-Antwort
  // in beiden Fällen dieselbe sein kann und trotzdem niemand im Dunkeln steht.
  'signup-welcome': (v) => ({
    subject: 'Ihr Konto ist angelegt',
    html: `<p>Ihr Konto für <strong>${esc(v.email)}</strong> ist angelegt.</p>`
      + `<p><a href="${esc(v.login_link)}">${esc(v.login_link)}</a></p>`
      + '<p>Bitte melden Sie sich mit Ihrem Passwort an.</p>',
  }),
  // Gegenstück: die Adresse war schon vergeben. Die Registrierung wird ignoriert,
  // aber der rechtmässige Inhaber erfährt vom Versuch — wie beim E-Mail-Wechsel.
  'signup-existing-notice': (v) => ({
    subject: 'Registrierungsversuch mit Ihrer E-Mail-Adresse',
    html: `<p>Für <strong>${esc(v.email)}</strong> wurde eine Registrierung versucht. Es besteht bereits ein Konto mit dieser Adresse; ein zweites wurde NICHT angelegt.</p>`
      + `<p>Waren Sie das? Dann melden Sie sich einfach an — oder nutzen Sie „Passwort vergessen": <a href="${esc(v.reset_link)}">${esc(v.reset_link)}</a></p>`
      + '<p>Waren Sie das nicht, ist nichts geschehen; ändern Sie im Zweifel Ihr Passwort.</p>',
  }),
  // A-14: MFA wurde von einem Berechtigten zurückgesetzt. Der Betroffene muss
  // seinen zweiten Faktor neu einrichten — und erfährt es, falls der Reset NICHT
  // von ihm angestossen wurde.
  'mfa-reset-notice': (v) => ({
    subject: 'Ihr zweiter Faktor (MFA) wurde zurückgesetzt',
    html: `<p>Für <strong>${esc(v.email)}</strong> wurde die Zwei-Faktor-Anmeldung zurückgesetzt. Alle Ihre Sitzungen wurden beendet.</p>`
      + `<p>Begründung: ${esc(v.reason)}</p>`
      + `<p>Bitte melden Sie sich neu an und richten Sie Ihren zweiten Faktor umgehend erneut ein: <a href="${esc(v.login_link)}">${esc(v.login_link)}</a></p>`
      + '<p>Haben Sie das nicht veranlasst, wenden Sie sich sofort an Ihren Administrator.</p>',
  }),
  'org-invitation': (v) => ({
    subject: v.lang === 'en' ? `Invitation to ${esc(v.orgName)}` : `Einladung zu ${esc(v.orgName)}`,
    html: `<p><strong>${esc(v.inviterName)}</strong> — <a href="${esc(v.acceptUrl)}">${esc(v.acceptUrl)}</a></p>`,
  }),
  'org-invite-accepted': (v) => ({
    subject: v.lang === 'en' ? 'Invitation accepted' : 'Einladung angenommen',
    html: `<p>${esc(v.memberName || v.memberEmail)} — ${esc(v.orgName)}</p><p><a href="${esc(v.manageUrl)}">${esc(v.manageUrl)}</a></p>`,
  }),
};

export function renderTemplate(name, variables) {
  const t = TEMPLATES[name];
  if (t) return t(variables || {});
  return {
    subject: `[cy] ${name || 'Benachrichtigung'}`,
    html: `<pre>${esc(JSON.stringify(variables || {}, null, 2))}</pre>`,
  };
}
