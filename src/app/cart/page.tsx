import prisma from '../../lib/prisma';
import CheckoutButton from '../../components/CheckoutButton';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../../components/ui/button';

export const dynamic = "force-dynamic";

export default async function CartPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ artworkId?: string }>;
}) {
  const params = await searchParams;
  const artworkId = params.artworkId;
  const artwork = artworkId
    ? await prisma.artwork.findUnique({ 
        where: { id: artworkId },
        include: { owner: true }
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Varukorg</h1>
        <Button variant="outline" asChild>
          <Link href="/artworks">Fortsätt handla</Link>
        </Button>
      </div>

      {!artwork ? (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-slate-600">Din varukorg är tom.</p>
            <Button asChild>
              <Link href="/artworks">Utforska konstverk</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Din order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-slate-100 rounded overflow-hidden flex-shrink-0 relative">
                    <Image src={artwork.imageUrl} alt={artwork.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{artwork.title}</h3>
                    <p className="text-sm text-slate-600">{artwork.owner.name || 'Anonym konstnär'}</p>
                    {artwork.description && (
                      <p className="text-sm text-slate-500 mt-2">{artwork.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Sammanfattning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Pris</span>
                  <span className="font-semibold">{artwork.price} SEK</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Totalt</span>
                  <span className="font-bold text-lg">{artwork.price} SEK</span>
                </div>
                <CheckoutButton artworkId={artwork.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
