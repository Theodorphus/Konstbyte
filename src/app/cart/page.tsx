import prisma from '../../lib/prisma';
import CheckoutButton from '../../components/CheckoutButton';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import SafeImage from '../../components/SafeImage';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { formatSek } from '../../lib/currency';
import StatusCard from '../../components/StatusCard';
import { PageHeader } from '../../components/PageHeader';

export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ artworkId?: string }> }) {
  const { artworkId } = await searchParams;
  const artwork = artworkId
    ? await prisma.artwork.findUnique({
        where: { id: artworkId },
        include: { owner: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Varukorg" className="mb-2">
        <Button variant="outline" asChild>
          <Link href="/artworks">Fortsätt handla</Link>
        </Button>
      </PageHeader>
      {!artwork ? (
        <StatusCard
          className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md"
          icon="🛒"
          title="Din varukorg är tom"
          message="Lägg till ett konstverk för att gå vidare till betalning."
          actions={
            <Button asChild>
              <Link href="/artworks">Utforska konstverk</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>Din order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-slate-100 rounded overflow-hidden flex-shrink-0 relative">
                    <SafeImage src={artwork.imageUrl} alt={artwork.title} fill className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none" />
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
            <Card className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>Sammanfattning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Pris</span>
                  <span className="font-semibold">{formatSek(artwork.price)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Totalt</span>
                  <span className="font-bold text-lg">{formatSek(artwork.price)}</span>
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
