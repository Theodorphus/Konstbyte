'use client';

// SellerShippingPanel — client component for sellers to mark orders as shipped
// and add/update tracking information.

import { useState } from 'react';

interface Props {
  orderId: string;
  shippingStatus: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  onUpdate?: () => void; // optional callback to refresh parent
}

export default function SellerShippingPanel({
  orderId,
  shippingStatus,
  trackingNumber: initialTracking,
  trackingUrl: initialUrl,
  onUpdate,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(initialTracking ?? '');
  const [trackingUrl, setTrackingUrl] = useState(initialUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const isShipped = shippingStatus === 'shipped' || shippingStatus === 'delivered';

  async function handleMarkShipped() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: trackingNumber || null, trackingUrl: trackingUrl || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Något gick fel'); return; }
      setSuccess('Ordern markerad som skickad! Köparen har fått ett mejl.');
      setExpanded(false);
      onUpdate?.();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateTracking() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderId}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: trackingNumber || null, trackingUrl: trackingUrl || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Något gick fel'); return; }
      setSuccess('Spårningsinformation uppdaterad.');
      setExpanded(false);
      onUpdate?.();
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        {success}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!isShipped && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          <span>🚚</span> Markera som skickat
        </button>
      )}

      {isShipped && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors"
        >
          Uppdatera spårningsinformation
        </button>
      )}

      {expanded && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-4">
          <p className="text-sm font-semibold text-slate-800">
            {isShipped ? 'Uppdatera spårning' : 'Markera som skickat'}
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Spårningsnummer <span className="font-normal">(valfritt)</span>
              </label>
              <input
                type="text"
                placeholder="T.ex. AB123456789SE"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Spårningslänk <span className="font-normal">(valfritt)</span>
              </label>
              <input
                type="url"
                placeholder="https://www.postnord.se/..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={isShipped ? handleUpdateTracking : handleMarkShipped}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Sparar…' : isShipped ? 'Spara spårning' : 'Markera som skickat'}
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="px-4 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
