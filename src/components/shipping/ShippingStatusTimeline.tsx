// ShippingStatusTimeline — vertical 3-step timeline on the order page.
// Steps: Beställt → Skickat → Mottaget

interface Props {
  shippingStatus: string; // "not_shipped" | "shipped" | "delivered"
  createdAt: string;
}

const STEPS = [
  { key: 'ordered', label: 'Beställt', sublabel: 'Betalning genomförd' },
  { key: 'shipped', label: 'Skickat', sublabel: 'Säljaren har skickat paketet' },
  { key: 'delivered', label: 'Mottaget', sublabel: 'Köparen har bekräftat leveransen' },
];

function stepDone(stepKey: string, shippingStatus: string): boolean {
  if (stepKey === 'ordered') return true;
  if (stepKey === 'shipped') return shippingStatus === 'shipped' || shippingStatus === 'delivered';
  if (stepKey === 'delivered') return shippingStatus === 'delivered';
  return false;
}

export default function ShippingStatusTimeline({ shippingStatus }: Props) {
  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = stepDone(step.key, shippingStatus);
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className="flex gap-4">
            {/* Left — circle + connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  done
                    ? 'bg-amber-400 text-white'
                    : 'bg-stone-100 border-2 border-stone-200 text-stone-300'
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-stone-300" />
                )}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 my-1 ${done ? 'bg-amber-200' : 'bg-stone-100'}`} style={{ minHeight: 28 }} />
              )}
            </div>

            {/* Right — text */}
            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
              <p className={`text-sm font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                {step.label}
              </p>
              <p className={`text-xs mt-0.5 ${done ? 'text-slate-500' : 'text-slate-300'}`}>
                {step.sublabel}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
