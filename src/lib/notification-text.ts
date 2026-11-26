// Shared by the server (which stores the Swedish text) and the notifications page
// (which shows the text in the reader's language). Keep it free of server imports.

export type NotificationValues = Record<string, string | number>;

type Translate = (key: string, values?: NotificationValues) => string;

/**
 * A notification text from messages → notification_texts. `name` is the person
 * who did something; when they have no name the text says "Someone".
 */
export function renderNotificationText(t: Translate, key: string, values: NotificationValues = {}): string {
  return t(key, values.name === '' ? { ...values, name: t('someone') } : values);
}
