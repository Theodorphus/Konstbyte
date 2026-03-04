import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { formatSek } from '../../../lib/currency';

export const dynamic = 'force-dynamic';

const EVENT_LABELS: Record<string, { label: string; icon: string }> = {
  payment_completed: { label: 'Betalning mottagen', icon: '💳' },
  processing:        { label: 'Förbereds för leverans', icon: '📦' },
  shipped:           { label: 'Skickat', icon: '🚚' },
  delivered:         { label: 'Levererat', icon: '✅' },
};

const STATUS_STEPS = ['payment_completed', 'processing', 'shipped', 'delivered'];

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'asc' } },
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true } },
      artwork: true,
    },
  });

  if (!order) return notFound();
  if (order.buyerId !== user.id && order.sellerId !== user.id) return notFound();

  const item = order.items[0];
  const completedTypes = new Set(order.events.map(e => e.type));
  let currentStep = -1;
  for (let i = 0; i < STATUS_STEPS.length; i++) { if (completedTypes.has(STATUS_STEPS[i])) currentStep = i; }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div>
        <Link href="/profile/orders" className="text-sm text-slate-500 hover:text-slate-800">
          ← Tillbaka till mina beställningar
        </Link>
        <h1 className="text-2xl font-bold mt-3">Order #{id.slice(0, 8)}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date(order.createdAt).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Product summary */}
      {item && (
        <div className="flex gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
          <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-slate-200">
            <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-slate-500">av {order.seller?.name || 'Konstnären'}</p>
            <p className="font-bold mt-1">{formatSek(item.price)}</p>
          </div>
        </div>
      )}

      {/* Progress steps */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Orderstatus</h2>
        <ol className="space-y-3">
          {STATUS_STEPS.map((type, i) => {
            const done = completedTypes.has(type);
            const active = i === currentStep + 1 && !done;
            const meta = EVENT_LABELS[type];
            const event = order.events.find(e => e.type === type);
            return (
              <li key={type} className={`flex gap-3 items-start ${!done && !active ? 'opacity-40' : ''}`}>
                <span className={`mt-0.5 text-lg ${done ? '' : 'grayscale'}`}>{meta.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${done ? 'text-slate-900' : 'text-slate-500'}`}>
                    {meta.label}
                  </p>
                  {event && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(event.createdAt).toLocaleString('sv-SE')} — {event.message}
                    </p>
                  )}
                </div>
                {done && <span className="text-green-500 text-sm font-medium">✓</span>}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Action buttons */}
      {order.sellerId === user.id && completedTypes.has('processing') && !completedTypes.has('shipped') && (
        <form action={`/api/orders/${id}/ship`} method="POST">
          <button type="submit" className="w-full px-4 py-3 rounded-md bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors">
            Markera som skickat 🚚
          </button>
        </form>
      )}
      {order.buyerId === user.id && completedTypes.has('shipped') && !completedTypes.has('delivered') && (
        <form action={`/api/orders/${id}/receive`} method="POST">
          <button type="submit" className="w-full px-4 py-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors">
            Bekräfta mottagande ✅
          </button>
        </form>
      )}

      {/* Shipping info */}
      <div className="rounded-lg border border-slate-200 p-4 text-sm space-y-1.5 text-slate-600">
        <p className="font-semibold text-slate-800 mb-2">Leveransinformation</p>
        <p>📦 Frakt: 49 kr inom Sverige</p>
        <p>🚚 Beräknad leverans: 3–5 arbetsdagar från avsändning</p>
        <p>🔒 Säker betalning via Stripe</p>
        <p>↩️ 14 dagars ångerrätt enligt svensk lag</p>
      </div>

      {/* Payout info for seller */}
      {order.sellerId === user.id && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">💰 Utbetalning</p>
          <p>Konstbyte kontaktar konstnären och hanterar utbetalning via Swish eller banköverföring inom 3–5 arbetsdagar efter att köparen bekräftat mottagandet.</p>
        </div>
      )}

      {/* Info for buyer */}
      {order.buyerId === user.id && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p>Konstnären kontaktas för leverans. Vid frågor, kontakta <a href="mailto:hej@konstbyte.se" className="underline">hej@konstbyte.se</a>.</p>
        </div>
      )}
    </div>
  );
}
