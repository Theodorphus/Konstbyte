'use client';

import { useState } from 'react';

export default function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs text-stone-400 hover:text-slate-700 underline underline-offset-2 transition-colors"
    >
      {copied ? 'Kopierat!' : 'Kopiera adress'}
    </button>
  );
}
