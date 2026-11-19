'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

/**
 * Deletes an artwork through DELETE /api/artworks/[id], which applies all the
 * rules (orders block deletion, abandoned checkouts only hide it, favourites
 * are cleaned up) and explains the outcome.
 */
export default function DeleteArtworkButton({ artworkId, label }: { artworkId: string; label: string }) {
  const t = useTranslations('artworks');
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!confirm(t('delete_confirm_artwork'))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/artworks/${artworkId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(data.hidden ? t('artwork_hidden') : t('artwork_deleted'));
        router.refresh();
      } else {
        alert(typeof data.error === 'string' ? data.error : t('error_generic'));
      }
    } catch {
      alert(t('error_generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={busy}
      className="text-red-600 border-red-200 hover:bg-red-50"
    >
      {busy ? '…' : label}
    </Button>
  );
}
