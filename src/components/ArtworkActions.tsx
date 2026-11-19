'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/** Save-as-favourite and share buttons for the artwork page. */
export default function ArtworkActions({
  artworkId,
  title,
  initialFavorited,
  signedIn,
  canFavorite,
}: {
  artworkId: string;
  title: string;
  initialFavorited: boolean;
  signedIn: boolean;
  canFavorite: boolean;
}) {
  const t = useTranslations('artworks');
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggleFavorite() {
    setBusy(true);
    try {
      const res = favorited
        ? await fetch(`/api/favorites?artworkId=${artworkId}`, { method: 'DELETE' })
        : await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ artworkId }),
          });
      // "Already in favourites" (400) also means it is saved.
      if (res.ok || (!favorited && res.status === 400)) setFavorited(!favorited);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // The user closed the share sheet — nothing to do.
    }
  }

  const buttonClass =
    'inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:border-stone-300 hover:bg-stone-50 transition-colors disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canFavorite &&
        (signedIn ? (
          <button type="button" onClick={toggleFavorite} disabled={busy} aria-pressed={favorited} className={buttonClass}>
            <span aria-hidden="true">{favorited ? '❤️' : '🤍'}</span>
            {favorited ? t('favorite_saved') : t('favorite_add')}
          </button>
        ) : (
          <Link href="/auth/signin" className={buttonClass}>
            <span aria-hidden="true">🤍</span>
            {t('favorite_add')}
          </Link>
        ))}
      <button type="button" onClick={share} className={buttonClass}>
        <span aria-hidden="true">↗</span>
        {copied ? t('link_copied') : t('share')}
      </button>
    </div>
  );
}
