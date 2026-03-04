'use client';

import React, { useState } from 'react';

type Props = {
  artworkId: string;
};

export default function CheckoutButton({ artworkId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId })
      });
      const data = await res.json();
      if (res.status === 402) {
        setError('Konstnären har inte kopplat sitt betalningskonto än.');
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.error || 'Något gick fel');
      }
    } catch {
      setError('Kunde inte ansluta till betalningssystemet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-slate-900 text-white px-4 py-2 rounded font-medium hover:bg-slate-700 transition-colors disabled:opacity-60"
      >
        {loading ? 'Laddar…' : 'Gå till betalning'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
