/**
 * readinessControls — Kontrollen, bei denen ein FEHLENDES Ereignis die
 * Anforderung nicht aufhebt.
 *
 * K2 (Codex-Pruefbericht 2026-09-12): „Die Antwort ‚kein Vorfall\u2018 darf eine
 * Vorbereitungskontrolle nicht automatisch aus dem Anwendungsbereich nehmen."
 * Katalogvertrag `no_event_readiness`: „Absence of an event does not exclude an
 * applicable readiness outcome or mandatory ISMS requirement."
 *
 * Beispiel: Es gab im Zeitraum keine Rollenaenderung. Dann ist
 * ISO-ASSET-CHANGE NICHT „nicht anwendbar" — geprueft werden die definierten
 * Rueckgabe- und Abgleichsregelungen, die Zustaendigkeiten und ein
 * angemessener Durchgang. Was fehlt, ist eine Ausfuehrungsstichprobe, nicht
 * die Pflicht.
 *
 * Die Liste ist aus dem Katalog abgeleitet (Kontrollen mit einer
 * Kein-Ereignis-Klausel in Beschreibung oder Nachweis) und um
 * ISO-ISMS-MEASUREMENT-DESIGN ergaenzt: eine Entwurfspflicht, die
 * ereignisunabhaengig gilt. Die Datei ist GENERIERT - bei Katalogwechsel neu
 * erzeugen.
 */

export interface ReadinessControl {
  /** Name der Kontrolle (Katalogwortlaut). */
  name: string;
  /** Die Kein-Ereignis-Klausel des Katalogs - im Hinweis woertlich zitiert. */
  clause: string;
}

const READINESS: Record<string, ReadinessControl> = {
  "C12.1": { name: "NIS2 Applicability Is Reassessed After Relevant Changes", clause: "Where no relevant change occurred, existing change information and an explanation of the reassessment trigger can establish that position." },
  "C19.6": { name: "Domain Data Access Requests Receive Replies Without Undue Delay and Within 72 Hours (Applies only to TLD name registries and domain name registration service providers.)", clause: "if no requests occurred, inspect readiness without claiming demonstrated response performance." },
  "C40.9": { name: "A Lawful, Communicated Disciplinary Process Addresses Security-Policy Violations", clause: "The requirement applies regardless of whether a case occurred; assess the defined arrangements and responsibilities instead of excluding the control." },
  "C67.1": { name: "Significant Incidents Can Be Reported to the CSIRT or Competent Authority at Any Time", clause: "The requirement applies regardless of whether a case occurred; assess the defined arrangements and responsibilities instead of excluding the control." },
  "ISO-ACCESS-COORDINATION": { name: "Relevant Access-Control Arrangements Are Coordinated", clause: "Where no relevant change occurred, inspect the implemented arrangements and use a safe scenario rather than inventing an event." },
  "ISO-ASSET-CHANGE": { name: "Assets No Longer Authorised After a Role or Contract Change Are Returned", clause: "If no relevant change occurred in the period, assess the defined reconciliation and return arrangements, assigned responsibilities and a proportionate walkthrough or safe scenario using the existing asset records." },
  "ISO-EMERGENCY-AUTHORISATION": { name: "Exceptional Privileged Access Has Authorised Scope and Expiry", clause: "Where exceptional access is needed but has not been used, assess the defined authorisation route, authorised scope and expiry arrangements through a proportionate walkthrough or safe test." },
  "ISO-EMERGENCY-REVIEW": { name: "Exceptional Privileged Sessions Receive Post-Use Review", clause: "Where exceptional access is needed but has not been used, assess post-use review readiness without representing a scenario as an actual session review." },
  "ISO-NC-CORRECTION": { name: "ISMS Process Nonconformities Are Controlled and Their Consequences Addressed", clause: "If no relevant process nonconformity occurred, assess response readiness through the defined responsibilities and arrangements for control, correction and consequence handling, using a proportionate walkthrough or safe scenario." },
  "ISO-NC-EFFECTIVENESS": { name: "ISMS Process Corrective Actions Are Verified for Effectiveness", clause: "Where no relevant action exists, review the arrangements for determining and evaluating effectiveness and record that no actual effectiveness result is available." },
  "ISO-REVIEW-CHANGE": { name: "Significant Changes Receive an Independent Security Review", clause: "If no significant change occurred, assess the defined review triggers, responsibility for recognising and referring changes, and arrangements for an impartial review through a proportionate walkthrough or safe scenario." },
  "REC-METRIC": { name: "Actual Recovery Times Are Measured and Reviewed (MTTR)", clause: "Where no events occurred: prepared measurement method and separately identified exercise results." },
  "ISO-ISMS-MEASUREMENT-DESIGN": { name: "ISMS Process Measurements Have Defined Methods, Timing and Responsibilities", clause: "The requirement applies regardless of whether a case occurred; assess the defined arrangements and responsibilities instead of excluding the control." },
};

/** true = fehlendes Ereignis hebt diese Anforderung NICHT auf. */
export function isReadinessControl(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(READINESS, id);
}

/** Katalogklausel zur Kontrolle; undefined = keine Bereitschaftskontrolle. */
export function readinessControl(id: string): ReadinessControl | undefined {
  return READINESS[id];
}

/** Anzahl der Bereitschaftskontrollen - Sollwert 13. */
export const READINESS_CONTROL_COUNT = Object.keys(READINESS).length;
