'use client';

import React, { useState } from 'react';

type Props = {
  artworkId: string;
};

export default function CheckoutButton({ artworkId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId })
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-60"
    >
      {loading ? 'Laddar…' : 'Gå till betalning'}
    </button>
  );
}
