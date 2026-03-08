import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import prisma from '../../lib/prisma';

async function SuccessContent({ orderId }: { orderId: string }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      artwork: { select: { title: true, imageUrl: true } },
      seller: { select: { name: true, email: true } },
    },
  });

  if (!order) return <GenericSuccess />;

  const amount = order.amount.toLocaleString('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
  });

  const isSwish = order.paymentMethod === 'swish';

  return (
    <div className="max-w-lg mx-auto py-16 px-4 space-y-6">
      {/* Success header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Betalning genomförd!</h1>
        <p className="text-slate-500 text-sm">
          Order #{order.id.slice(-8).toUpperCase()}
          {isSwish ? ' · Betalat med Swish' : ' · Betalat med kort'}
        </p>
      </div>

      {/* Artwork summary */}
      {order.artwork && (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 p-4">
            {order.artwork.imageUrl && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
                <Image
                  src={order.artwork.imageUrl}
                  alt={order.artwork.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{order.artwork.title}</p>
              {order.seller?.name && (
                <p className="text-sm text-slate-500">av {order.seller.name}</p>
              )}
              <p className="text-lg font-bold text-amber-700 mt-1">{amount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Shipping address */}
      {order.shippingStreet && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Din leveransadress</p>
          <p className="text-sm text-slate-800">{order.shippingName}</p>
          <p className="text-sm text-slate-600">{order.shippingStreet}</p>
          <p className="text-sm text-slate-600">{order.shippingPostalCode} {order.shippingCity}</p>
          <p className="text-xs text-stone-400">{order.shippingCountry}</p>
        </div>
      )}

      {/* Next steps */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <p className="font-semibold text-amber-900 text-sm flex items-center gap-2">
          <span>📦</span> Nästa steg
        </p>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-500">✓</span>
            Konstnären packar och skickar ditt konstverk inom 1–2 arbetsdagar.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-500">✓</span>
            Du får ett e-postmeddelande med spårningsinformation när verket är skickat.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-500">✓</span>
            Vid frågor — kontakta oss på{' '}
            <a href="mailto:konstbyte@gmail.com" className="underline underline-offset-2">
              konstbyte@gmail.com
            </a>
            .
          </li>
        </ul>
      </div>

      {/* Legal */}
      <p className="text-xs text-slate-400 text-center leading-relaxed">
        Ditt köp är bindande. Ångerrätt gäller ej för original konstverk enligt distansavtalslagen 2 kap. 11 § p. 10.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href="/profile/orders"
          className="px-5 py-2.5 rounded-md bg-slate-900 text-white font-semibold text-sm text-center hover:bg-slate-700 transition-colors"
        >
          Visa mina beställningar
        </Link>
        <Link
          href="/artworks"
          className="px-5 py-2.5 rounded-md border border-stone-300 text-slate-700 font-semibold text-sm text-center hover:bg-stone-50 transition-colors"
        >
          Fortsätt utforska
        </Link>
      </div>
    </div>
  );
}

function GenericSuccess() {
  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Betalning genomförd!</h1>
      <p className="text-slate-600">
        Tack för ditt köp. Konstnären kommer att packa och skicka ditt konstverk inom 1–2 arbetsdagar.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href="/profile/orders"
          className="px-5 py-2.5 rounded-md bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors"
        >
          Visa mina beställningar
        </Link>
        <Link
          href="/artworks"
          className="px-5 py-2.5 rounded-md border border-stone-300 text-slate-700 font-semibold hover:bg-stone-50 transition-colors"
        >
          Fortsätt handla
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  return (
    <Suspense fallback={<GenericSuccess />}>
      <SuccessPageInner searchParams={searchParams} />
    </Suspense>
  );
}

async function SuccessPageInner({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) return <GenericSuccess />;
  return <SuccessContent orderId={orderId} />;
}
