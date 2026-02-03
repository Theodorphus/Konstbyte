import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export default async function ArtworkDetail({ 
  params 
}: { 
  params: Promise<{ id: string }>;
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
    <div className="space-y-6">
      <Link href="/artworks" className="text-sm text-slate-600 hover:text-slate-900">
        ← Tillbaka till marknadsplats
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="bg-slate-100 rounded-lg overflow-hidden aspect-square">
            <img 
              src={artwork.imageUrl} 
              alt={artwork.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e2e8f0" width="100" height="100"/%3E%3C/svg%3E';
              }}
            />
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
              <p className="font-semibold">{artwork.owner.name || 'Anonyme'}</p>
              {artwork.owner.image && (
                <img src={artwork.owner.image} alt={artwork.owner.name || 'Artist'} className="w-12 h-12 rounded-full mt-2" />
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
            <C{isOwner ? (
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
              )}ariant="outline" className="w-full">
                Dela
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
