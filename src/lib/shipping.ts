export const SHIPPING_OPTIONS = [
  { value: 'overenskommes', label: '🤝 Frakt överenskommes' },
  { value: 'fixed',         label: '📦 Fast fraktkostnad' },
  { value: 'pickup',        label: '🏠 Upphämtning' },
  { value: 'postnord',      label: '📮 PostNord' },
  { value: 'dhl',           label: '🚚 DHL' },
  { value: 'schenker',      label: '🚛 Schenker' },
  { value: 'other',         label: '📬 Annat fraktbolag' },
] as const;

export type ShippingType = (typeof SHIPPING_OPTIONS)[number]['value'];

export function getShippingLabel(type: string | null | undefined): string {
  const found = SHIPPING_OPTIONS.find((o) => o.value === type);
  return found ? found.label.replace(/^\S+\s/, '') : 'Överenskommes';
}
