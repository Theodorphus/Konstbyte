import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { formatSek } from '@/lib/currency';
import SellerShippingPanel from '@/components/shipping/SellerShippingPanel';
import TrackingInfo from '@/components/shipping/TrackingInfo';
import CopyAddressButton from '@/components/checkout/CopyAddressButton';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function SellerOrdersPage() {
  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations('seller'),
  ]);
  if (!user) redirect('/auth/signin');

  const orders = await prisma.order.findMany({
    where: {
      sellerId: user.id,
      status: { in: ['paid', 'completed', 'delivered', 'awaiting_swish'] },
    },
    include: {
      buyer: { select: { name: true, email: true } },
      artwork: { select: { title: true, imageUrl: true } },
      items: { take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusMap: Record<string, { label: string; classes: string }> = {
    not_shipped: { label: t('status_not_shipped'), classes: 'bg-orange-100 text-orange-700 border-orange-200' },
    shipped:     { label: t('status_shipped'),     classes: 'bg-amber-100 text-amber-700 border-amber-200' },
    delivered:   { label: t('status_delivered'),   classes: 'bg-green-100 text-green-700 border-green-200' },
  };

  function StatusPill({ status }: { status: string }) {
    const { label, classes } = statusMap[status] ?? statusMap.not_shipped;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
        {label}
      </span>
    );
  }

  const shippingMethodLabel = (method: string | null): string => {
    switch (method) {
      case 'fixed': return t('fixed_label');
      case 'pickup': return t('pickup_label');
      case 'postnord': return 'PostNord';
      case 'dhl': return 'DHL';
      case 'schenker': return 'Schenker';
      case 'other': return t('other_label');
      default: return t('agreed_label');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('sold_artworks_title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('manage_shipping_desc')}</p>
        </div>
        <Link href="/profile" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          {t('back_profile')}
        </Link>
      </div>

      {/* Summary badges */}
      {orders.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {(() => {
            const notShipped = orders.filter(o => o.shippingStatus === 'not_shipped').length;
            const shipped = orders.filter(o => o.shippingStatus === 'shipped').length;
            const delivered = orders.filter(o => o.shippingStatus === 'delivered').length;
            return (
              <>
                {notShipped > 0 && (
                  <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold border border-orange-200">
                    {t('to_send', { count: notShipped })}
                  </span>
                )}
                {shipped > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200">
                    {t('in_delivery', { count: shipped })}
                  </span>
                )}
                {delivered > 0 && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
                    {t('delivered_count', { count: delivered })}
                  </span>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="py-20 text-center space-y-3">
          <div className="text-4xl">📭</div>
          <p className="text-slate-500">{t('no_orders_msg')}</p>
          <Link
            href="/artworks/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            {t('publish_artwork')}
          </Link>
        </div>
      )}

      {/* Order cards */}
      <div className="space-y-4">
        {orders.map((order) => {
          const item = order.items[0];
          const thumbnail = item?.imageUrl ?? order.artwork.imageUrl;

          return (
            <div
              key={order.id}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Order header row */}
              <div className="flex items-start gap-4 p-5">
                {thumbnail && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
                    <Image src={thumbnail} alt={order.artwork.title} fill className="object-cover" />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 truncate">{order.artwork.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Order #{order.id.slice(-8).toUpperCase()} ·{' '}
                        {new Date(order.createdAt).toLocaleDateString('sv-SE', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </p>
                    </div>
                    <StatusPill status={order.shippingStatus} />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 text-sm pt-1">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{t('buyer_label')}</p>
                      <p className="text-slate-700">{order.buyer?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{order.buyer?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{t('amount_label')}</p>
                      <p className="text-slate-700 font-semibold">{formatSek(order.amount)}</p>
                      <p className="text-xs text-slate-400">{shippingMethodLabel(order.shippingMethod)}</p>
                    </div>
                  </div>

                  {order.shippingStreet && (
                    <div className="border-t border-stone-100 pt-3 mt-1 space-y-0.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1">{t('delivery_address_label')}</p>
                      <p className="text-sm text-slate-700">{order.shippingName}</p>
                      <p className="text-sm text-slate-600">{order.shippingStreet}</p>
                      <p className="text-sm text-slate-600">{order.shippingPostalCode} {order.shippingCity}</p>
                      <p className="text-xs text-stone-400">
                        {order.shippingCountry}
                        {order.shippingPhone ? ` · ${order.shippingPhone}` : ''}
                      </p>
                      <CopyAddressButton
                        address={[
                          order.shippingName,
                          order.shippingStreet,
                          `${order.shippingPostalCode} ${order.shippingCity}`,
                          order.shippingCountry,
                          order.shippingPhone,
                        ].filter(Boolean).join('\n')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping actions / info */}
              <div className="border-t border-stone-100 px-5 py-4 space-y-3">
                {order.shippingStatus === 'delivered' ? (
                  <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                    <span>✅</span> {t('delivered_msg')}
                  </p>
                ) : (
                  <>
                    {order.trackingNumber && (
                      <TrackingInfo
                        trackingNumber={order.trackingNumber}
                        trackingUrl={order.trackingUrl ?? null}
                        shippingMethod={order.shippingMethod}
                      />
                    )}
                    <SellerShippingPanel
                      orderId={order.id}
                      shippingStatus={order.shippingStatus}
                      trackingNumber={order.trackingNumber}
                      trackingUrl={order.trackingUrl}
                    />
                  </>
                )}

                <Link
                  href={`/orders/${order.id}`}
                  className="text-xs text-slate-400 hover:text-slate-700 transition-colors underline underline-offset-2"
                >
                  {t('full_order_link')}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
