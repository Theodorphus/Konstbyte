import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export const revalidate = 60;
import Image from 'next/image';
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;
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
  params: { id: string };
}) {
  const { id } = await params;
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
          <div className="bg-slate-100 rounded-lg overflow-hidden aspect-square relative">
            <Image src={artwork.imageUrl} alt={artwork.title} fill className="object-cover" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">Konstverk</p>
            <h1 className="text-3xl font-bold mt-1">{artwork.title}</h1>
          </div>

          <Card>
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Om verket</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700">{artwork.description}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-50">
            <CardContent>
              {isOwner ? (
                <>
                  <Button asChild className="w-full mb-3">
                    <Link href={`/artworks/${artwork.id}/edit`}>
                      Redigera konstverk
                    </Link>
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    Du är ägare av detta konstverk
                  </p>
                </>
              ) : (
                <>
                  <Button asChild className="w-full mb-3">
                    <Link href={`/cart?artworkId=${artwork.id}`}>
                      Lägg i varukorg
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full">
                    Dela
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
