// ShippingOptionsCard — displayed on the artwork detail page.
// Shows the seller's configured shipping option with an icon and label.

interface ShippingProps {
  shippingType: string;
  shippingCost?: number | null;
  shippingArea?: string | null;
  shippingCarrier?: string | null;
}

function formatSek(amount: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(amount);
}

function shippingLabel({ shippingType, shippingCost, shippingArea, shippingCarrier }: ShippingProps): {
  icon: string;
  text: string;
} {
  switch (shippingType) {
    case 'fixed':
      return {
        icon: '📦',
        text: shippingCost ? `Fast frakt — ${formatSek(shippingCost)}` : 'Fast fraktkostnad',
      };
    case 'pickup':
      return {
        icon: '📍',
        text: shippingArea ? `Upphämtning — ${shippingArea}` : 'Upphämtning på plats',
      };
    case 'postnord':
      return { icon: '🚚', text: 'Skickas med PostNord' };
    case 'dhl':
      return { icon: '🚚', text: 'Skickas med DHL' };
    case 'schenker':
      return { icon: '🚚', text: 'Skickas med Schenker' };
    case 'other':
      return {
        icon: '🚚',
        text: shippingCarrier ? `Skickas med ${shippingCarrier}` : 'Annat fraktbolag',
      };
    default:
      return { icon: '🤝', text: 'Frakt överenskommes med säljaren' };
  }
}

export default function ShippingOptionsCard(props: ShippingProps) {
  const { icon, text } = shippingLabel(props);
  const isOverenskommes = props.shippingType === 'overenskommes' || !props.shippingType;

  return (
    <div className="rounded-xl border-l-4 border-l-amber-300 border border-stone-200 bg-stone-50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Frakt</p>

      <div className="flex items-center gap-3">
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-sm font-medium text-slate-800">{text}</span>
      </div>

      {isOverenskommes && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Du och säljaren kommer överens om frakt direkt efter köpet.
        </p>
      )}

    </div>
  );
}
