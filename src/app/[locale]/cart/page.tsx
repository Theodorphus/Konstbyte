import prisma from '@/lib/prisma';
import CheckoutButton from '@/components/CheckoutButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SafeImage from '@/components/SafeImage';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { formatSek } from '@/lib/currency';
import StatusCard from '@/components/StatusCard';
import { PageHeader } from '@/components/PageHeader';
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ artworkId?: string }> }) {
  const [{ artworkId }, t] = await Promise.all([
    searchParams,
    getTranslations('cart'),
  ]);
  const artwork = artworkId
    ? await prisma.artwork.findUnique({
        where: { id: artworkId },
        include: { owner: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} className="mb-2">
        <Button variant="outline" asChild>
          <Link href="/artworks">{t('continue_shopping')}</Link>
        </Button>
      </PageHeader>
      {!artwork ? (
        <StatusCard
          className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md"
          icon="🛒"
          title={t('empty')}
          message={t('empty_msg')}
          actions={
            <Button asChild>
              <Link href="/artworks">{t('explore_artworks')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>{t('your_order')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-slate-100 rounded overflow-hidden flex-shrink-0 relative">
                    <SafeImage src={artwork.imageUrl} alt={artwork.title} fill className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{artwork.title}</h3>
                    <p className="text-sm text-slate-600">{artwork.owner.name || t('anonymous_artist')}</p>
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
                <CardTitle>{t('summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('price')}</span>
                  <span className="font-semibold">{formatSek(artwork.price)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">{t('total')}</span>
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
