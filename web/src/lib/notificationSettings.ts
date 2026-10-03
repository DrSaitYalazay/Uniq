/**
 * Frist-Benachrichtigungen — Tenant-weite Einstellungen für E-Mail-Erinnerungen
 * an Maßnahmen-Verantwortliche.
 *
 * Storage: useToolData("nis2-notification-settings") — org-shared row,
 * 3s debounced auto-save (same contract as all other tool states).
 *
 * Trigger logic (executed daily 08:00 UTC by edge function notify-frist-deadlines):
 *  - daysUntilDue === reminderDaysBefore → reminder mail to owner only
 *  - daysUntilDue === -overdueGraceDays  → overdue mail to owner + escalation CC
 * Each (measure, trigger, recipient) is sent at most once (idempotency log).
 */

export interface NotificationSettings {
  /** Master switch — when false, the cron skips this tenant entirely. */
  enabled: boolean;
  /** Reply-To header for outgoing notifications.
   *  Empty → falls back to the tenant owner's account e-mail. */
  senderReplyTo: string;
  /** Days before due date to send the first reminder. Default 30. */
  reminderDaysBefore: number;
  /** Days after due date to send the overdue escalation. Fixed at 3. */
  overdueGraceDays: number;
  /** Additional recipients that receive a copy of overdue alerts only. */
  overdueCcEmails: string[];
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  senderReplyTo: "",
  reminderDaysBefore: 30,
  overdueGraceDays: 3,
  overdueCcEmails: [],
};

export const NOTIFICATION_SETTINGS_TOOL_KEY = "nis2-notification-settings";
export const NOTIFICATION_SETTINGS_LS_KEY = "nis2-notification-settings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}
