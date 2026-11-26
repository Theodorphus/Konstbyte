// ShippingOptionsCard — displayed on the artwork detail page.
// Shows the seller's configured shipping option with an icon and label.
import { useTranslations } from 'next-intl';
import { formatSek } from '@/lib/currency';

interface ShippingProps {
  shippingType: string;
  shippingCost?: number | null;
  shippingArea?: string | null;
  shippingCarrier?: string | null;
}

type T = (key: string, values?: Record<string, string | number>) => string;

function shippingLabel(t: T, { shippingType, shippingCost, shippingArea, shippingCarrier }: ShippingProps): {
  icon: string;
  text: string;
} {
  switch (shippingType) {
    case 'fixed':
      return { icon: '📦', text: shippingCost ? t('card_fixed', { cost: formatSek(shippingCost) }) : t('type_fixed') };
    case 'pickup':
      return { icon: '📍', text: shippingArea ? t('card_pickup', { area: shippingArea }) : t('card_pickup_any') };
    case 'postnord':
      return { icon: '🚚', text: t('card_carrier', { carrier: 'PostNord' }) };
    case 'dhl':
      return { icon: '🚚', text: t('card_carrier', { carrier: 'DHL' }) };
    case 'schenker':
      return { icon: '🚚', text: t('card_carrier', { carrier: 'Schenker' }) };
    case 'other':
      return { icon: '🚚', text: shippingCarrier ? t('card_carrier', { carrier: shippingCarrier }) : t('type_other') };
    default:
      return { icon: '🤝', text: t('card_agreed') };
  }
}

export default function ShippingOptionsCard(props: ShippingProps) {
  const t = useTranslations('shipping');
  const { icon, text } = shippingLabel(t, props);
  const isOverenskommes = props.shippingType === 'overenskommes' || !props.shippingType;

  return (
    <div className="rounded-xl border-l-4 border-l-amber-300 border border-stone-200 bg-stone-50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{t('card_title')}</p>

      <div className="flex items-center gap-3">
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-sm font-medium text-slate-800">{text}</span>
      </div>

      {isOverenskommes && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {t('card_agreed_note')}
        </p>
      )}

    </div>
  );
}
