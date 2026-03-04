'use client';

import { useState } from 'react';

export default function ConnectStripeButton() {
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
      } else {
        setError(data.error || 'Något gick fel');
      }
    } catch {
      setError('Kunde inte ansluta till Stripe');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Ansluter…' : '🔗 Koppla Stripe-konto'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
