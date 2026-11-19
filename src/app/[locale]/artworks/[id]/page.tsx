import { alternatesFor, canonicalUrl } from '@/lib/seo';
import { SITE_URL } from '@/lib/urls';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import SafeImage from '@/components/SafeImage';
import WallPreview from '@/components/WallPreview';
import ArtworkCheckoutButton from '@/components/ArtworkCheckoutButton';
import ShippingOptionsCard from '@/components/shipping/ShippingOptionsCard';
import { getTranslations } from 'next-intl/server';
import ReportButton from '@/components/ReportButton';
import ArtworkActions from '@/components/ArtworkActions';
import { isAdmin } from '@/lib/admin';

export async function generateMetadata({ params }: { params: Promise<{ id?: string; locale: string }> }) {
  const { id, locale } = await params;
  if (!id) return {};
  const artwork = await prisma.artwork.findUnique({ where: { id }, include: { owner: true } });
  // Hidden artworks (unpublished by the artist or removed by an admin) aren't indexed.
  if (!artwork || !artwork.isPublished) return { robots: { index: false } };
  const base = SITE_URL;
  return {
    title: artwork.title,
    description: artwork.description || 'Konstverk på Konstbyte',
    alternates: alternatesFor(locale, `/artworks/${artwork.id}`),
    openGraph: {
      url: canonicalUrl(locale, `/artworks/${artwork.id}`),
      images: [
        {
          url: `${base}/api/og/${artwork.id}`,
          width: 1200,
          height: 630,
          alt: artwork.title,
        },
      ],
    },
    twitter: { card: 'summary_large_image', images: [`${base}/api/og/${artwork.id}`] },
  };
}

export default async function ArtworkDetail({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  if (!id) return notFound();
  const [artwork, currentUser, t] = await Promise.all([
    prisma.artwork.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, image: true } } },
    }),
    getCurrentUser(),
    getTranslations('artworks'),
  ]);

  if (!artwork) return notFound();
  const isOwner = currentUser?.id === artwork.ownerId;
  // Hidden artworks are only visible to the artist and admins.
  if (!artwork.isPublished && !isOwner && !isAdmin(currentUser?.email)) return notFound();

  const [favorite, moreByArtist] = await Promise.all([
    currentUser
      ? prisma.favorite.findUnique({ where: { userId_artworkId: { userId: currentUser.id, artworkId: artwork.id } }, select: { id: true } })
      : null,
    prisma.artwork.findMany({
      where: { ownerId: artwork.ownerId, isPublished: true, id: { not: artwork.id } },
      orderBy: [{ isSold: 'asc' }, { createdAt: 'desc' }],
      take: 4,
      select: { id: true, title: true, price: true, imageUrl: true, isSold: true },
    }),
  ]);

  const categoryMap: Record<string, string> = {
    malningar: t('paintings'),
    skulpturer: t('sculptures'),
    fotografi: t('photography'),
    digital: t('digital'),
  };
  const categoryLabel = artwork.category
    ? (categoryMap[artwork.category] || artwork.category)
    : t('artwork_fallback');

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            // Product as well, so search engines can show price and availability.
            '@type': ['VisualArtwork', 'Product'],
            name: artwork.title,
            description: artwork.description || undefined,
            image: artwork.imageUrl,
            author: {
              '@type': 'Person',
              name: artwork.owner?.name || 'Anonym',
            },
            url: `${SITE_URL}/artworks/${artwork.id}`,
            datePublished: artwork.createdAt?.toISOString(),
            offers: {
              '@type': 'Offer',
              priceCurrency: 'SEK',
              price: artwork.price?.toString(),
              url: `${SITE_URL}/artworks/${artwork.id}`,
              // Tells search engines sold artworks can no longer be bought.
              availability: artwork.isSold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            },
            // Escaping every "<" keeps user text from closing the script tag.
          }).replace(/</g, '\\u003c'),
        }}
      />

      <div className="space-y-8">
        {/* Back nav */}
        <Link
          href="/artworks"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors duration-150 group"
        >
          <svg
            className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
          </svg>
          {t('marketplace')}
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden aspect-square relative bg-slate-100 ring-1 ring-slate-200/70 shadow-lg shadow-slate-900/8">
            <SafeImage
              src={artwork.imageUrl}
              alt={artwork.title}
              fill
              className="object-cover transition-transform duration-500 ease-out hover:scale-[1.03]"
            />
          </div>

          {/* Details panel */}
          <div className="flex flex-col gap-5">
            {/* Title + artist */}
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-2.5">
                {categoryLabel}
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-slate-900 leading-tight">
                {artwork.title}
              </h1>
              <div className="flex items-center gap-2.5 mt-3">
                {artwork.owner.image && (
                  <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-slate-200">
                    <Image
                      src={artwork.owner.image}
                      alt={artwork.owner.name || t('artwork_fallback')}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-slate-500">
                  {t('by')}{' '}
                  <Link
                    href={`/users/${artwork.ownerId}`}
                    className="font-semibold text-slate-700 hover:text-amber-800 transition-colors"
                  >
                    {artwork.owner.name || 'Anonym'}
                  </Link>
                </p>
              </div>
              <div className="mt-4">
                <ArtworkActions
                  artworkId={artwork.id}
                  title={artwork.title}
                  initialFavorited={Boolean(favorite)}
                  signedIn={Boolean(currentUser)}
                  canFavorite={!isOwner && artwork.isPublished}
                />
              </div>
            </div>

            {/* Price + status badge */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-4xl font-semibold text-slate-900">
                {artwork.price
                  ? artwork.price.toLocaleString('sv-SE') + '\u00a0kr'
                  : t('not_for_sale')}
              </span>
              {artwork.isSold ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                  {t('sold')}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  {t('original')}
                </span>
              )}
            </div>

            {/* Facts buyers ask about first */}
            {(artwork.technique || artwork.dimensions) && (
              <dl className="grid grid-cols-2 gap-3 rounded-xl border border-stone-200/80 bg-stone-50/60 p-4 text-sm">
                {artwork.dimensions && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">{t('dimensions_label')}</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">{artwork.dimensions}</dd>
                  </div>
                )}
                {artwork.technique && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">{t('technique_label')}</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">{artwork.technique}</dd>
                  </div>
                )}
              </dl>
            )}

            {/* Description */}
            {artwork.description && (
              <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-amber-200 pl-4">
                {artwork.description}
              </p>
            )}

            {/* Wall preview */}
            <WallPreview artworkUrl={artwork.imageUrl} artworkTitle={artwork.title} />

            {/* CTAs */}
            {isOwner ? (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href={`/artworks/${artwork.id}/edit`}>{t('edit')}</Link>
                </Button>
                <p className="text-xs text-slate-500 text-center">{t('owner')}</p>
              </div>
            ) : artwork.isSold ? (
              <div className="w-full px-4 py-3 rounded-xl bg-slate-100 text-slate-500 font-semibold text-center text-sm">
                {t('sold_unavailable')}
              </div>
            ) : (
              <div className="space-y-2.5">
                <ArtworkCheckoutButton
                  artworkId={artwork.id}
                  title={artwork.title}
                  imageUrl={artwork.imageUrl ?? ''}
                  price={artwork.price ?? 0}
                  ownerName={artwork.owner.name ?? 'Konstnären'}
                  shippingType={artwork.shippingType}
                  shippingCost={artwork.shippingCost ?? 0}
                  shippingArea={artwork.shippingArea ?? ''}
                  shippingCarrier={artwork.shippingCarrier ?? ''}
                />
                <Link
                  href={`/messages/${artwork.ownerId}`}
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-center text-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                >
                  {t('ask_artist')}
                </Link>
              </div>
            )}

            {!isOwner && (
              <div className="flex justify-end">
                <ReportButton type="artwork" id={artwork.id} />
              </div>
            )}

            {/* Shipping options */}
            {!isOwner && !artwork.isSold && (
              <ShippingOptionsCard
                shippingType={artwork.shippingType}
                shippingCost={artwork.shippingCost}
                shippingArea={artwork.shippingArea}
                shippingCarrier={artwork.shippingCarrier}
              />
            )}

            {/* Trust signals */}
            {!isOwner && !artwork.isSold && (
              <div className="space-y-2.5 text-xs text-slate-500 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  {t('secure_payment')}
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  {t('return_policy')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* More by the same artist */}
        {moreByArtist.length > 0 && (
          <section className="border-t border-stone-200/80 pt-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl text-slate-900">
                {t('more_from_artist', { name: artwork.owner.name || 'Anonym' })}
              </h2>
              <Link href={`/users/${artwork.ownerId}`} className="text-sm font-semibold text-slate-700 hover:text-amber-800">
                {t('see_artist_profile')}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {moreByArtist.map((art) => (
                <Link key={art.id} href={`/artworks/${art.id}`} className="group">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-stone-200/70">
                    <SafeImage
                      src={art.imageUrl}
                      alt={art.title}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    {art.isSold && (
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-red-700">
                        {t('sold')}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-slate-900">{art.title}</p>
                  <p className="text-sm text-slate-500">{art.price.toLocaleString('sv-SE')}&nbsp;kr</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
