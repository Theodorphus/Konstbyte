// TrackingInfo — displays tracking number and external link when available.

interface Props {
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingMethod: string | null;
}

export default function TrackingInfo({ trackingNumber, trackingUrl, shippingMethod }: Props) {
  if (!trackingNumber) return null;

  const carrier =
    shippingMethod === 'postnord' ? 'PostNord' :
    shippingMethod === 'dhl' ? 'DHL' :
    shippingMethod === 'schenker' ? 'Schenker' :
    null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Spårning</p>
      {carrier && (
        <p className="text-xs text-stone-500">Skickat med {carrier}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-sm text-slate-800 bg-stone-50 border border-stone-200 px-3 py-1 rounded-lg">
          {trackingNumber}
        </span>
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
          >
            Spåra paket
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
