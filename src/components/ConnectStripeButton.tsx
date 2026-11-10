'use client';

import { useState } from 'react';

export default function ConnectStripeButton({ label = 'Koppla Stripe-konto' }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConnect() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/connect/onboard', { method: 'POST' });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || 'Något gick fel');
    } catch {
      setError('Kunde inte ansluta till Stripe');
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Ansluter…' : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
