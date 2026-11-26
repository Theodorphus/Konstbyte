// The names are translated: messages → shipping.type_<value>.
export const SHIPPING_OPTIONS = [
  { value: 'overenskommes', icon: '🤝' },
  { value: 'fixed',         icon: '📦' },
  { value: 'pickup',        icon: '🏠' },
  { value: 'postnord',      icon: '📮' },
  { value: 'dhl',           icon: '🚚' },
  { value: 'schenker',      icon: '🚛' },
  { value: 'other',         icon: '📬' },
] as const;

export type ShippingType = (typeof SHIPPING_OPTIONS)[number]['value'];

/** Message key for a shipping type (unknown or missing → "by agreement"). */
export function shippingTypeKey(type: string | null | undefined): `type_${ShippingType}` {
  const found = SHIPPING_OPTIONS.find((o) => o.value === type);
  return `type_${found ? found.value : 'overenskommes'}`;
}

/**
 * Normalises seller-supplied tracking info. Only http(s) URLs are accepted so a
 * `javascript:` link can never end up in the buyer's order page or emails.
 */
export function sanitizeTracking(input: { trackingNumber?: unknown; trackingUrl?: unknown }): {
  trackingNumber: string | null;
  trackingUrl: string | null;
  error?: string;
} {
  const trackingNumber =
    typeof input.trackingNumber === 'string' && input.trackingNumber.trim()
      ? input.trackingNumber.trim().slice(0, 100)
      : null;

  let trackingUrl: string | null = null;
  if (typeof input.trackingUrl === 'string' && input.trackingUrl.trim()) {
    try {
      const url = new URL(input.trackingUrl.trim());
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return { trackingNumber, trackingUrl: null, error: 'Spårningslänken måste börja med https://' };
      }
      trackingUrl = url.toString().slice(0, 500);
    } catch {
      return { trackingNumber, trackingUrl: null, error: 'Ogiltig spårningslänk' };
    }
  }
  return { trackingNumber, trackingUrl };
}
