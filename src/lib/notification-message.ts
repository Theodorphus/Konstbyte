import { createTranslator } from 'next-intl';
import sv from '../../messages/sv.json';
import { renderNotificationText, type NotificationValues } from './notification-text';

export type NotificationTextKey = Exclude<keyof typeof sv.notification_texts, 'someone'>;

const tSv = createTranslator({ locale: 'sv', messages: sv, namespace: 'notification_texts' });

/**
 * The text fields of a new notification. `message` is the Swedish text (older
 * notifications only have that); the key and values let the notifications page
 * show it in the reader's language.
 */
export function notificationText(key: NotificationTextKey, values: NotificationValues = {}) {
  return {
    message: renderNotificationText(tSv as (k: string, v?: NotificationValues) => string, key, values),
    messageKey: key,
    messageValues: values,
  };
}
