import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import SafeImage from '../../../components/SafeImage';

export async function generateMetadata({ params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params;
  if (!id) return {};
  const artwork = await prisma.artwork.findUnique({ where: { id }, include: { owner: true } });
  if (!artwork) return {};
  const base = process.env.NEXT_PUBLIC_METADATA_BASE || 'http://localhost:3000';
  return {
    title: `${artwork.title} — Konstbyte`,
    description: artwork.description || 'Konstverk på Konstbyte',
    openGraph: {
      images: [
        {
          url: `${base}/api/og/${artwork.id}`,
          width: 1200,
          height: 630,
          alt: artwork.title,
        },
      ],
    },
  };
}

export default async function ArtworkDetail({
  params
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  if (!id) return notFound();
  const [artwork, currentUser] = await Promise.all([
    prisma.artwork.findUnique({ 
      where: { id },
      include: { owner: true }
    }),
    getCurrentUser()
  ]);
  
  if (!artwork) return notFound();
  const isOwner = currentUser?.id === artwork.ownerId;

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VisualArtwork",
          "name": artwork.title,
          "description": artwork.description || undefined,
          "image": artwork.imageUrl,
          "author": {
            "@type": "Person",
            "name": artwork.owner?.name || 'Anonym'
          },
          "url": `${process.env.NEXT_PUBLIC_METADATA_BASE || 'http://localhost:3000'}/artworks/${artwork.id}`,
          "datePublished": artwork.createdAt?.toISOString(),
          "offers": {
            "@type": "Offer",
            "priceCurrency": "SEK",
            "price": artwork.price?.toString()
          }
        }) }}
      />
    <div className="space-y-6">
      <Link href="/artworks" className="text-sm text-slate-600 hover:text-slate-900">
        ← Tillbaka till marknadsplats
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="bg-slate-100 rounded-lg overflow-hidden aspect-square relative transition-all duration-200 ease-out motion-reduce:transition-none hover:shadow-md">
            <SafeImage src={artwork.imageUrl} alt={artwork.title} fill className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none hover:scale-[1.02]" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">Konstverk</p>
            <h1 className="text-3xl font-bold mt-1">{artwork.title}</h1>
          </div>

          <Card className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Konstnär</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{artwork.owner.name || 'Anonym'}</p>
              {artwork.owner.image && (
                <Image src={artwork.owner.image} alt={artwork.owner.name || 'Artist'} width={48} height={48} className="rounded-full mt-2" />
              )}
            </CardContent>
          </Card>

          {artwork.description && (
            <Card className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Om verket</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700">{artwork.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4">
            {/* Title + artist */}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{artwork.title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                av <span className="font-medium text-slate-700">{artwork.owner.name || 'Anonym'}</span>
              </p>
            </div>

            {/* Price + badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold text-slate-900">
                {artwork.price ? artwork.price.toLocaleString('sv-SE') + ' kr' : 'Ej till salu'}
              </span>
              {artwork.isSold ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                  Sålt
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  Originalverk
                </span>
              )}
            </div>

            {isOwner ? (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href={`/artworks/${artwork.id}/edit`}>Redigera konstverk</Link>
                </Button>
                <p className="text-xs text-slate-500 text-center">Du är ägare av detta konstverk</p>
              </div>
            ) : artwork.isSold ? (
              <div className="w-full px-4 py-3 rounded-md bg-slate-100 text-slate-500 font-semibold text-center cursor-not-allowed">
                Sålt — ej tillgängligt
              </div>
            ) : (
              <div className="space-y-2">
                {/* Primary CTA */}
                <Link
                  href={`/cart?artworkId=${artwork.id}`}
                  className="block w-full px-4 py-3 rounded-md bg-blue-600 text-white font-semibold text-center hover:bg-blue-700 transition-colors"
                >
                  Lägg i varukorg
                </Link>

                {/* Secondary */}
                <Link
                  href={`/users/${artwork.ownerId}`}
                  className="block w-full px-4 py-2.5 rounded-md border border-slate-300 text-slate-700 font-medium text-center text-sm hover:bg-slate-100 transition-colors"
                >
                  Ställ en fråga till konstnären
                </Link>
              </div>
            )}

            {/* Shipping info */}
            {!isOwner && !artwork.isSold && (
              <ul className="space-y-1 text-sm text-slate-600 border-t border-slate-200 pt-3">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">📦</span> Frakt: 49 kr inom Sverige
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">🚚</span> Leverans: 3–5 arbetsdagar
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">🎨</span> Packas omsorgsfullt av konstnären
                </li>
              </ul>
            )}

            {/* Trust signals */}
            {!isOwner && !artwork.isSold && (
              <ul className="space-y-1 text-xs text-slate-500 border-t border-slate-200 pt-3">
                <li className="flex items-center gap-1.5">
                  <span>🔒</span> Säker betalning via Stripe
                </li>
                <li className="flex items-center gap-1.5">
                  <span>↩️</span> 14 dagars ångerrätt enligt svensk lag
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

