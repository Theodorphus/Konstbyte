'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Must match PLATFORM_FEE_PERCENT env var
const COMMISSION_RATE = 0.03;

interface Order {
  id: string;
  amount: number;
  createdAt: string;
  paymentMethod: string;
  artwork: { id: string; title: string; imageUrl: string } | null;
  buyer: { name: string | null; email: string } | null;
  seller: { id: string; name: string | null; email: string } | null;
}

interface CompletedPayout {
  id: string;
  amount: number;
  commissionAmount: number;
  commissionVat: number;
  sellerPayoutAmount: number;
  method: string;
  adminNote: string | null;
  completedAt: string;
  seller: { name: string | null; email: string } | null;
  order: {
    id: string;
    createdAt: string;
    paymentMethod: string;
    artwork: { title: string; imageUrl: string } | null;
    buyer: { name: string | null; email: string } | null;
  };
}

function formatAmount(amount: number) {
  return amount.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function CommissionBreakdown({ amount }: { amount: number }) {
  const t = useTranslations('admin');
  const commission = amount * COMMISSION_RATE;
  const sellerAmount = amount - commission;
  return (
    <div className="grid grid-cols-3 gap-2 text-xs mt-3 pt-3 border-t border-stone-100">
      <div>
        <p className="text-stone-400 mb-0.5">{t('order_total')}</p>
        <p className="font-semibold text-slate-800">{formatAmount(amount)}</p>
      </div>
      <div>
        <p className="text-stone-400 mb-0.5">{t('commission')}</p>
        <p className="font-semibold text-red-600">−{formatAmount(commission)}</p>
      </div>
      <div>
        <p className="text-stone-400 mb-0.5">{t('to_seller')}</p>
        <p className="font-bold text-green-700">{formatAmount(sellerAmount)}</p>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  actionLabel,
  actionColor,
  note,
  onNoteChange,
  onAction,
  loading,
  showNote,
  showCommission,
  method,
  onMethodChange,
}: {
  order: Order;
  actionLabel: string;
  actionColor: string;
  note: string;
  onNoteChange: (v: string) => void;
  onAction: () => void;
  loading: boolean;
  showNote: boolean;
  showCommission: boolean;
  method?: 'swish' | 'bank';
  onMethodChange?: (m: 'swish' | 'bank') => void;
}) {
  const t = useTranslations('admin');
  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-start gap-4 p-5">
        {order.artwork?.imageUrl ? (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
            <Image src={order.artwork.imageUrl} alt={order.artwork.title ?? ''} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl bg-stone-100 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900 truncate">{order.artwork?.title ?? t('unknown_artwork')}</p>
              <p className="text-xs text-slate-400">
                Order #{order.id.slice(-8).toUpperCase()} · {formatDate(order.createdAt)}
              </p>
            </div>
            <p className="text-lg font-bold text-slate-900 flex-shrink-0">{formatAmount(order.amount)}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 text-sm pt-1">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{t('buyer_label')}</p>
              <p className="text-slate-700">{order.buyer?.name ?? '—'}</p>
              <p className="text-xs text-slate-400">{order.buyer?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{t('seller_label')}</p>
              <p className="text-slate-700">{order.seller?.name ?? '—'}</p>
              <p className="text-xs text-slate-400">{order.seller?.email}</p>
            </div>
          </div>

          {showCommission && <CommissionBreakdown amount={order.amount} />}

          {onMethodChange && method && (
            <div className="flex items-center gap-4 pt-3 text-sm">
              <span className="text-xs text-stone-500 font-medium">{t('pay_via')}</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`method-${order.id}`}
                  value="swish"
                  checked={method === 'swish'}
                  onChange={() => onMethodChange('swish')}
                  className="accent-green-600"
                />
                <span className="text-slate-700">Swish</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`method-${order.id}`}
                  value="bank"
                  checked={method === 'bank'}
                  onChange={() => onMethodChange('bank')}
                  className="accent-green-600"
                />
                <span className="text-slate-700">{t('bank_transfer')}</span>
              </label>
            </div>
          )}

          <div className="flex items-center gap-3 pt-3">
            {showNote && (
              <input
                type="text"
                placeholder={t('note_placeholder')}
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                className="flex-1 text-sm border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            )}
            <button
              onClick={onAction}
              disabled={loading}
              className={`flex-shrink-0 px-4 py-1.5 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors ${actionColor}`}
            >
              {loading ? t('saving') : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletedPayoutCard({ payout }: { payout: CompletedPayout }) {
  const t = useTranslations('admin');
  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-start gap-4 p-5">
        {payout.order.artwork?.imageUrl ? (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
            <Image src={payout.order.artwork.imageUrl} alt={payout.order.artwork.title ?? ''} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900 truncate text-sm">{payout.order.artwork?.title ?? '—'}</p>
              <p className="text-xs text-slate-400">
                Order #{payout.order.id.slice(-8).toUpperCase()} · {formatDate(payout.order.createdAt)}
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 flex-shrink-0">
              {t('paid_badge')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs mt-3 pt-3 border-t border-stone-100">
            <div>
              <p className="text-stone-400 mb-0.5">{t('order_total')}</p>
              <p className="font-semibold text-slate-800">{formatAmount(payout.amount)}</p>
            </div>
            <div>
              <p className="text-stone-400 mb-0.5">{t('provision_label')}</p>
              <p className="font-semibold text-red-600">−{formatAmount(payout.commissionAmount)}</p>
            </div>
            <div>
              <p className="text-stone-400 mb-0.5">{t('paid_out_label')}</p>
              <p className="font-bold text-green-700">{formatAmount(payout.sellerPayoutAmount)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
            <span>{payout.seller?.name ?? payout.seller?.email ?? '—'}</span>
            <span>·</span>
            <span>{payout.method === 'bank' ? t('bank_transfer') : 'Swish'}</span>
            {payout.completedAt && (
              <>
                <span>·</span>
                <span>{formatDate(payout.completedAt)}</span>
              </>
            )}
            {payout.adminNote && (
              <>
                <span>·</span>
                <span className="italic">{payout.adminNote}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPayoutsPage() {
  const t = useTranslations('admin');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [pendingSwish, setPendingSwish] = useState<Order[]>([]);
  const [unpaidPayouts, setUnpaidPayouts] = useState<Order[]>([]);
  const [completedPayouts, setCompletedPayouts] = useState<CompletedPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [methods, setMethods] = useState<Record<string, 'swish' | 'bank'>>({});

  useEffect(() => {
    fetch('/api/admin/payouts')
      .then((r) => r.json())
      .then((data) => {
        if (data.pendingSwish) {
          setPendingSwish(data.pendingSwish);
          setUnpaidPayouts(data.unpaidPayouts);
        } else {
          setError(data.error ?? t('error_unknown'));
        }
      })
      .catch(() => setError(t('error_fetch')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'completed') return;
    if (completedPayouts.length > 0) return;
    setCompletedLoading(true);
    fetch('/api/admin/payouts?filter=completed')
      .then((r) => r.json())
      .then((data) => { if (data.completedPayouts) setCompletedPayouts(data.completedPayouts); })
      .catch(() => {})
      .finally(() => setCompletedLoading(false));
  }, [activeTab, completedPayouts.length]);

  async function doAction(orderId: string, action: 'confirm_swish' | 'payout') {
    setActingId(orderId);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action,
          note: notes[orderId] ?? '',
          method: methods[orderId] ?? 'swish',
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? 'Fel'); return; }
      if (action === 'confirm_swish') {
        setPendingSwish((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setUnpaidPayouts((prev) => prev.filter((o) => o.id !== orderId));
        // Reset completed cache so it reloads if user switches tab
        setCompletedPayouts([]);
      }
    } finally {
      setActingId(null);
    }
  }

  const totalPayout = unpaidPayouts.reduce((s, o) => s + (o.amount * (1 - COMMISSION_RATE)), 0);
  const isEmpty = pendingSwish.length === 0 && unpaidPayouts.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('payouts_title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('payouts_desc')}</p>
        </div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">{t('back_admin')}</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-800'}`}
        >
          {t('tab_pending')}
          {(pendingSwish.length + unpaidPayouts.length) > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
              {pendingSwish.length + unpaidPayouts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-800'}`}
        >
          {t('tab_completed')}
        </button>
      </div>

      {/* Pending tab */}
      {activeTab === 'pending' && (
        <>
          {loading && <div className="py-20 text-center text-slate-400 text-sm">{t('loading')}</div>}
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}
          {!loading && !error && isEmpty && (
            <div className="py-20 text-center space-y-2">
              <div className="text-3xl">✓</div>
              <p className="text-slate-500">{t('all_done')}</p>
            </div>
          )}

          {pendingSwish.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <h2 className="font-semibold text-slate-900">{t('swish_section_title')}</h2>
                <span className="ml-auto text-xs text-slate-400">{t('orders_count', { count: pendingSwish.length })}</span>
              </div>
              <p className="text-xs text-slate-500 -mt-1">
                {t('swish_desc')}
              </p>
              {pendingSwish.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  actionLabel={t('confirm_payment')}
                  actionColor="bg-orange-500 hover:bg-orange-600"
                  note={notes[order.id] ?? ''}
                  onNoteChange={(v) => setNotes((p) => ({ ...p, [order.id]: v }))}
                  onAction={() => doAction(order.id, 'confirm_swish')}
                  loading={actingId === order.id}
                  showNote={false}
                  showCommission={false}
                />
              ))}
            </section>
          )}

          {unpaidPayouts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <h2 className="font-semibold text-slate-900">{t('payout_section_title')}</h2>
                <span className="ml-auto text-xs text-slate-400">{t('orders_count', { count: unpaidPayouts.length })}</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium">{t('total_to_pay')}</p>
                  <p className="text-2xl font-bold text-amber-900">{formatAmount(totalPayout)}</p>
                </div>
                <p className="text-xs text-amber-600 text-right">{t('pay_separately')}</p>
              </div>

              {unpaidPayouts.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  actionLabel={t('mark_paid')}
                  actionColor="bg-green-600 hover:bg-green-700"
                  note={notes[order.id] ?? ''}
                  onNoteChange={(v) => setNotes((p) => ({ ...p, [order.id]: v }))}
                  onAction={() => doAction(order.id, 'payout')}
                  loading={actingId === order.id}
                  showNote={true}
                  showCommission={true}
                  method={methods[order.id] ?? 'swish'}
                  onMethodChange={(m) => setMethods((p) => ({ ...p, [order.id]: m }))}
                />
              ))}
            </section>
          )}
        </>
      )}

      {/* Completed tab */}
      {activeTab === 'completed' && (
        <section className="space-y-4">
          {completedLoading && <div className="py-10 text-center text-slate-400 text-sm">{t('loading')}</div>}
          {!completedLoading && completedPayouts.length === 0 && (
            <div className="py-20 text-center space-y-2">
              <p className="text-slate-400 text-sm">{t('no_completed')}</p>
            </div>
          )}
          {completedPayouts.map((payout) => (
            <CompletedPayoutCard key={payout.id} payout={payout} />
          ))}
        </section>
      )}
    </div>
  );
}
