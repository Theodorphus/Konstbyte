import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import StatusCard from '@/components/StatusCard';
import SafeImage from '@/components/SafeImage';
import DeleteArtworkButton from '@/components/DeleteArtworkButton';
import { formatSek } from '@/lib/currency';
import { getTranslations } from 'next-intl/server';
import { isSellerType } from '@/lib/seller';
import { canOwnerRemove } from '@/lib/artwork-removal';

export const dynamic = 'force-dynamic';

export default async function MyArtworksPage() {
  const [user, t, tSeller] = await Promise.all([
    getCurrentUser(),
    getTranslations('my_artworks'),
    getTranslations('seller'),
  ]);

  if (!user) {
    return (
      <StatusCard
        title={t('title')}
        message={t('sign_in_required')}
        actions={
          <Button asChild>
            <Link href="/auth/signin">{t('sign_in')}</Link>
          </Button>
        }
      />
    );
  }

  const artworks = await prisma.artwork.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      price: true,
      imageUrl: true,
      isPublished: true,
      isSold: true,
      removedByAdmin: true,
      orders: { select: { status: true, createdAt: true } },
      _count: { select: { favorites: true } },
    },
  });

  // A "sold" artwork whose sale was refunded: the artist may take it down.
  const refunded = (art: (typeof artworks)[number]) =>
    art.isSold && art.orders.length > 0 && art.orders.every((o) => o.status === 'refunded' || o.status === 'expired');
  // Same rule as DELETE /api/artworks/[id]. An artwork with orders is only
  // hidden, so there is nothing more to do once it is.
  const removable = (art: (typeof artworks)[number]) =>
    !art.removedByAdmin && canOwnerRemove(art.orders) && (art.isPublished || art.orders.length === 0);

  const status = (art: (typeof artworks)[number]) =>
    art.removedByAdmin
      ? { label: t('status_removed'), className: 'bg-red-50 text-red-700 ring-red-200' }
      : refunded(art)
        ? { label: t('status_refunded'), className: 'bg-slate-100 text-slate-600 ring-slate-200' }
        : art.isSold
          ? { label: t('status_sold'), className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
          : art.isPublished
            ? { label: t('status_published'), className: 'bg-amber-50 text-amber-800 ring-amber-200' }
            : { label: t('status_hidden'), className: 'bg-slate-100 text-slate-600 ring-slate-200' };

  return (
    <div className="space-y-4">
      <PageHeader title={t('title')} className="mb-2">
        <div>
          <Button asChild>
            <Link href="/artworks/new">{t('upload_new')}</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Buyers can't check out until the seller has said who they sell as. */}
      {artworks.length > 0 && !isSellerType(user.sellerType) && (
        <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 space-y-2">
          <p className="font-semibold text-amber-950">{tSeller('missing_title')}</p>
          <p className="text-sm text-amber-900">{tSeller('missing_desc')}</p>
          <Button asChild size="sm">
            <Link href="/profile/edit#seller">{tSeller('missing_cta')}</Link>
          </Button>
        </div>
      )}

      {artworks.length === 0 ? (
        <StatusCard
          icon="🎨"
          title={t('no_artworks')}
          message={t('no_artworks_msg')}
          actions={
            <Button asChild>
              <Link href="/artworks/new">{t('upload')}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {artworks.map((art) => {
            const s = status(art);
            return (
              <li key={art.id}>
                <Card>
                  <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Link href={`/artworks/${art.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        <SafeImage src={art.imageUrl} alt={art.title} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{art.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <span className="font-medium text-slate-700">{formatSek(art.price)}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${s.className}`}>{s.label}</span>
                          <span>{t('favorites', { count: art._count.favorites })}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      {!art.isSold && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/artworks/${art.id}/edit`}>{t('edit')}</Link>
                        </Button>
                      )}
                      {removable(art) && <DeleteArtworkButton artworkId={art.id} label={t('delete')} />}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
