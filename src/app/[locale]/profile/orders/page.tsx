import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SafeImage from '@/components/SafeImage';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { formatSek } from '@/lib/currency';
import StatusCard from '@/components/StatusCard';
import { PageHeader } from '@/components/PageHeader';
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations('orders'),
  ]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12">
        <PageHeader title={t('my_orders_title')} className="mb-4" />
        <StatusCard
          icon="🔐"
          title={t('sign_in_required_title')}
          message={t('sign_in_required_msg')}
          actions={
            <>
              <Button asChild>
                <Link href="/auth/signin">{t('sign_in')}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/register">{t('create_account')}</Link>
              </Button>
            </>
          }
        />
      </div>
    );
  }

  // Abandoned or failed checkouts aren't purchases, so they aren't listed.
  const orders = await prisma.order.findMany({
    where: { buyerId: user.id, status: { notIn: ['pending', 'expired', 'payment_failed'] } },
    include: {
      artwork: { select: { id: true, title: true, imageUrl: true, owner: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' }
  });

  // One label per order that tells the buyer where it is, including shipping.
  function orderState(order: { status: string; shippingStatus: string }) {
    if (order.status === 'payment_processing') return { label: t('state_processing'), classes: 'bg-yellow-100 text-yellow-700' };
    if (order.status === 'refunded') return { label: t('state_refunded'), classes: 'bg-slate-100 text-slate-700' };
    if (order.status === 'delivered' || order.shippingStatus === 'delivered') return { label: t('state_delivered'), classes: 'bg-green-100 text-green-700' };
    if (order.shippingStatus === 'shipped') return { label: t('state_shipped'), classes: 'bg-amber-100 text-amber-700' };
    return { label: t('state_paid'), classes: 'bg-blue-100 text-blue-700' };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('my_orders_title')}
        description={t('my_orders_desc')}
        className="mb-2"
      >
        <Button variant="outline" asChild>
          <Link href="/artworks">{t('continue_shopping')}</Link>
        </Button>
      </PageHeader>
      {orders.length === 0 ? (
        <StatusCard
          icon="🧾"
          title={t('no_orders_title')}
          message={t('no_orders_msg')}
          actions={
            <Button asChild>
              <Link href="/artworks">{t('explore_artworks')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Order #{order.id.slice(-8).toUpperCase()}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded ${orderState(order).classes}`}>
                    {orderState(order).label}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString('sv-SE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-slate-100 rounded overflow-hidden flex-shrink-0 relative">
                    <SafeImage
                      src={order.artwork.imageUrl}
                      alt={order.artwork.title}
                      fill
                      className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{order.artwork.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      {t('by_artist', { name: order.artwork.owner.name || t('anonymous_artist') })}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">{formatSek(order.amount)}</span>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/artworks/${order.artwork.id}`}>
                            {t('view_artwork')}
                          </Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/orders/${order.id}`}>
                            {order.shippingStatus === 'shipped' && order.status !== 'delivered'
                              ? t('confirm_receipt_cta')
                              : t('view_order')}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
