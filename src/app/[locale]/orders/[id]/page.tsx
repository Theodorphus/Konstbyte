import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { formatSek } from '@/lib/currency';
import { PLATFORM_FEE_PERCENT } from '@/lib/payout';
import { getShippingLabel } from '@/lib/shipping';
import ShippingStatusTimeline from '@/components/shipping/ShippingStatusTimeline';
import TrackingInfo from '@/components/shipping/TrackingInfo';
import SellerShippingPanel from '@/components/shipping/SellerShippingPanel';
import ConfirmReceivedButton from '@/components/shipping/ConfirmReceivedButton';
import { getTranslations } from 'next-intl/server';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, t, tSeller] = await Promise.all([
    getCurrentUser(),
    getTranslations('orders'),
    getTranslations('seller_type'),
  ]);
  if (!user) redirect('/auth/signin');

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'asc' } },
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, businessName: true, businessOrgNr: true } },
      artwork: true,
    },
  });

  if (!order) return notFound();
  // Admins can look at any order (the links in their alert emails point here).
  const viewerIsAdmin = isAdmin(user.email);
  if (order.buyerId !== user.id && order.sellerId !== user.id && !viewerIsAdmin) return notFound();

  const item = order.items[0];
  const isSeller = order.sellerId === user.id;
  const isBuyer = order.buyerId === user.id;
  const isRefunded = order.status === 'refunded';
  const isPaid = ['completed', 'paid', 'delivered'].includes(order.status);
  const canReceive = isBuyer && isPaid && order.shippingStatus === 'shipped';
  const payoutState = order.sellerPayoutStatus;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      {/* Header */}
      <div>
        <Link href="/profile/orders" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
          {t('back_link')}
        </Link>
        <div className="flex items-start justify-between mt-3 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order #{id.slice(-8).toUpperCase()}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}{order.paymentMethod === 'swish' ? t('paid_swish') : t('paid_card')}
            </p>
          </div>
        </div>
      </div>

      {viewerIsAdmin && !isBuyer && !isSeller && (
        <p className="text-xs rounded-lg px-3 py-2 bg-slate-100 text-slate-600">{t('admin_view')}</p>
      )}

      {isRefunded && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <p className="font-semibold">↩️ {t('refunded_title')}</p>
          <p className="mt-1">{isSeller ? t('refunded_desc_seller') : t('refunded_desc_buyer')}</p>
        </div>
      )}

      {!isRefunded && !isPaid && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">{t('not_paid_title')}</p>
          <p className="mt-1">{t('not_paid_desc')}</p>
        </div>
      )}

      {/* Product summary */}
      {item && (
        <div className="flex gap-4 p-4 rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
            <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{item.title}</p>
            <p className="text-sm text-slate-500 mt-0.5">av {order.seller?.name || 'Konstnären'}</p>
            <p className="font-bold text-slate-900 mt-2">{formatSek(item.price)}</p>
          </div>
          {order.shippingCost > 0 && (
            <div className="text-right text-xs text-stone-500 flex-shrink-0">
              <p>{t('plus_shipping')}</p>
              <p className="font-semibold text-slate-700">{formatSek(order.shippingCost)}</p>
            </div>
          )}
        </div>
      )}

      {/* Shipping status + actions */}
      {isPaid && (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{t('delivery_status_label')}</p>

        <ShippingStatusTimeline
          shippingStatus={order.shippingStatus}
          createdAt={order.createdAt.toISOString()}
        />

        {order.trackingNumber && (
          <div className="border-t border-stone-100 pt-4">
            <TrackingInfo
              trackingNumber={order.trackingNumber}
              trackingUrl={order.trackingUrl}
              shippingMethod={order.shippingMethod}
            />
          </div>
        )}

        {isSeller && (
          <div className="border-t border-stone-100 pt-4">
            <SellerShippingPanel
              orderId={id}
              shippingStatus={order.shippingStatus}
              trackingNumber={order.trackingNumber}
              trackingUrl={order.trackingUrl}
            />
          </div>
        )}

        {canReceive && (
          <div className="border-t border-stone-100 pt-4">
            <ConfirmReceivedButton orderId={id} />
          </div>
        )}
      </div>
      )}

      {/* Shipping method summary */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm space-y-2">
        <p className="font-semibold text-stone-500 text-xs uppercase tracking-wide">{t('shipping_info_label')}</p>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">{t('shipping_method_label')}</span>
          <span className="font-medium text-slate-800">{getShippingLabel(order.shippingMethod)}</span>
        </div>
        {order.shippingCost > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-stone-500">{t('shipping_cost_label')}</span>
            <span className="font-medium text-slate-800">{formatSek(order.shippingCost)}</span>
          </div>
        )}
        {(!order.shippingMethod || order.shippingMethod === 'overenskommes') && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-1">
            {t('agreed_shipping')}
          </p>
        )}
      </div>

      {/* Shipping address */}
      {order.shippingStreet && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">{t('delivery_address_label')}</p>
          <p className="text-sm text-slate-800">{order.shippingName}</p>
          <p className="text-sm text-slate-600">{order.shippingStreet}</p>
          <p className="text-sm text-slate-600">{order.shippingPostalCode} {order.shippingCity}</p>
          <p className="text-xs text-stone-400">
            {order.shippingCountry}{order.shippingPhone ? ` · ${order.shippingPhone}` : ''}
          </p>
        </div>
      )}

      {/* Payout info — seller only */}
      {isSeller && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">💰 {t('payout_title')}</p>
          <p>{t('payout_desc', { fee: PLATFORM_FEE_PERCENT })}</p>
          {payoutState === 'paid' && <p className="mt-2 text-green-700 font-medium">✓ {t('payout_done')}</p>}
          {payoutState === 'awaiting_stripe' && <p className="mt-2 font-medium">{t('payout_awaiting_stripe')}</p>}
          {payoutState === 'on_hold' && <p className="mt-2 text-red-700 font-medium">{t('payout_on_hold')}</p>}
          {payoutState === 'cancelled' && <p className="mt-2 text-red-700 font-medium">{t('payout_cancelled')}</p>}
        </div>
      )}

      {/* Who the buyer bought from, and where their rights lie — buyer only */}
      {isBuyer && order.seller && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-1 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">{tSeller('seller_label')}</p>
          <p className="text-slate-800">
            {order.sellerType === 'business'
              ? tSeller('seller_business', {
                  // As it was at purchase; the profile only for older orders.
                  company: order.sellerBusinessName || order.seller.businessName || order.seller.name || '',
                  orgNr: order.sellerBusinessOrgNr || order.seller.businessOrgNr || '–',
                })
              : order.sellerType === 'private'
                ? tSeller('seller_private', { name: order.seller.name || '' })
                : order.seller.name}
          </p>
          {order.sellerType && (
            <p className="text-slate-600">
              {tSeller(order.sellerType === 'business' ? 'order_rights_business' : 'order_rights_private')}
            </p>
          )}
          <Link href={`/messages/${order.seller.id}`} className="inline-block pt-1 text-slate-700 underline underline-offset-2 hover:text-slate-900">
            {t('message_seller')}
          </Link>
        </div>
      )}

      {/* Contact info — buyer only */}
      {isBuyer && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-slate-500">
          <p>
            {t('contact_support')}{' '}
            <a href="mailto:webbdevstudio@gmail.com" className="underline hover:text-slate-900 transition-colors">
              webbdevstudio@gmail.com
            </a>.
          </p>
        </div>
      )}
      <p className="text-xs text-stone-400 text-center pb-2">{t('disclaimer')}</p>
    </div>
  );
}
