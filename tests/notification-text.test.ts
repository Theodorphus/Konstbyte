import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import sv from '../messages/sv.json';
import en from '../messages/en.json';
import { notificationText } from '@/lib/notification-message';
import { renderNotificationText, type NotificationValues } from '@/lib/notification-text';

type Translate = (key: string, values?: NotificationValues) => string;

function translator(locale: 'sv' | 'en') {
  const errors: unknown[] = [];
  const t = createTranslator({
    locale,
    messages: locale === 'sv' ? sv : en,
    namespace: 'notification_texts',
    onError: (e) => errors.push(e),
  }) as unknown as Translate;
  return { t, errors };
}

// Every value any notification text uses, so each text can be rendered.
const SAMPLE: NotificationValues = {
  title: 'Hav', reason: 'Upphovsrätt', amount: 1234, days: 14, stripe: 'missing', payout: 'reclaimed', name: 'Anna', emoji: '❤️',
};

describe('notificationText', () => {
  it('stores the Swedish text the notifications had before, plus the key and values', () => {
    expect(notificationText('artwork_sold', { title: 'Hav', amount: 953, stripe: 'ready' })).toEqual({
      message: 'Du har sålt "Hav"! Packa och skicka verket till köparen. Du får 953 kr när köparen har tagit emot det.',
      messageKey: 'artwork_sold',
      messageValues: { title: 'Hav', amount: 953, stripe: 'ready' },
    });
    expect(notificationText('artwork_sold', { title: 'Hav', amount: 953, stripe: 'missing' }).message).toBe(
      'Du har sålt "Hav"! Packa och skicka verket till köparen. Du får 953 kr när köparen har tagit emot det. Koppla Stripe under Utbetalningar så att pengarna kan skickas till dig.',
    );
    expect(notificationText('order_refunded_seller', { title: 'Hav', payout: 'none' }).message).toBe(
      'Köpet av "Hav" har återbetalats till köparen. Ingen utbetalning görs.',
    );
    expect(notificationText('order_refunded_seller', { title: 'Hav', payout: 'reclaimed', amount: 953.2 }).message).toBe(
      'Köpet av "Hav" har återbetalats till köparen. Utbetalningen (953,2 kr) har dragits tillbaka från ditt Stripe-konto.',
    );
    expect(notificationText('order_auto_delivered', { title: 'Hav', days: 14 }).message).toBe(
      '"Hav" har markerats som mottagen 14 dagar efter leverans. Hör av dig till oss om något inte stämmer.',
    );
    expect(notificationText('payout_sent', { title: 'Hav', amount: 1234 }).message).toBe(
      `${(1234).toLocaleString('sv-SE')} kr för "Hav" har skickats till ditt Stripe-konto.`,
    );
  });

  it('says "Någon" / "Someone" when the person has no name', () => {
    expect(notificationText('follow', { name: '' }).message).toBe('Någon började följa dig');
    const { t } = translator('en');
    expect(renderNotificationText(t, 'follow', { name: '' })).toBe('Someone started following you');
  });

  it('shows the text in English for English readers', () => {
    const { t } = translator('en');
    expect(renderNotificationText(t, 'payout_waiting', { title: 'Hav', amount: 1234 })).toBe(
      '1,234 SEK for "Hav" is waiting for you. Connect Stripe and the money will be sent to your bank account.',
    );
  });

  it('has every text in both languages, and each one renders', () => {
    const keys = Object.keys(sv.notification_texts);
    expect(Object.keys(en.notification_texts).sort()).toEqual([...keys].sort());
    for (const locale of ['sv', 'en'] as const) {
      const { t, errors } = translator(locale);
      for (const key of keys) {
        const text = renderNotificationText(t, key, SAMPLE);
        expect(text, `${locale}.${key}`).not.toMatch(/[{}]/);
      }
      expect(errors, locale).toEqual([]);
    }
  });
});
