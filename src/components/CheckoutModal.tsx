'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import ShippingAddressForm, { type ShippingAddress } from './checkout/ShippingAddressForm';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  artworkId: string;
  title: string;
  imageUrl: string;
  price: number;
  ownerName: string;
  /** Whether the seller sells as a private person or a business (their own declaration). */
  sellerType: 'private' | 'business';
  businessName?: string;
  shippingType?: string;
  shippingCost?: number;
  shippingArea?: string;
  shippingCarrier?: string;
}

type Step =
  | 'method_select'   // Review the order and continue
  | 'address_form'    // Collect shipping address
  | 'stripe_loading'  // Creating Stripe session, about to redirect
  | 'error';          // Something went wrong

type T = ReturnType<typeof useTranslations>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useFormatSek() {
  const locale = useLocale();
  return (amount: number) =>
    new Intl.NumberFormat(locale === 'en' ? 'en-SE' : 'sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(amount);
}

function shippingLine(
  t: T,
  formatSek: (n: number) => string,
  shippingType: string,
  shippingCost: number,
  shippingArea: string,
  shippingCarrier: string,
): string {
  switch (shippingType) {
    case 'fixed': return shippingCost > 0 ? formatSek(shippingCost) : t('shipping_included');
    case 'pickup': return shippingArea ? t('shipping_pickup_area', { area: shippingArea }) : t('shipping_pickup');
    case 'postnord': return 'PostNord';
    case 'dhl': return 'DHL';
    case 'schenker': return 'Schenker';
    case 'other': return shippingCarrier || t('shipping_other');
    default: return t('shipping_agreed');
  }
}

// ─── Order Summary ────────────────────────────────────────────────────────────

function OrderSummary({
  title,
  imageUrl,
  price,
  ownerName,
  sellerType,
  businessName,
  shippingType,
  shippingCost,
  shippingArea,
  shippingCarrier,
}: Required<Omit<Props, 'artworkId'>>) {
  const t = useTranslations('checkout');
  const formatSek = useFormatSek();
  const isFixed = shippingType === 'fixed' && shippingCost > 0;
  const total = price + (isFixed ? shippingCost : 0);
  const sellerNote =
    sellerType === 'business'
      ? t('seller_business', { name: businessName || ownerName })
      : t('seller_private');

  return (
    <div className="rounded-xl bg-stone-50 border border-stone-200 overflow-hidden">
      {/* Artwork row */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0 relative">
          <Image src={imageUrl} alt={title} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
          <p className="text-xs text-stone-500 mt-0.5">{t('by_artist', { name: ownerName })}</p>
          <p className="text-xs text-stone-500 mt-0.5">{sellerNote}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-semibold text-slate-900">{formatSek(price)}</p>
        </div>
      </div>

      {/* Shipping row + total */}
      <div className="border-t border-stone-200 px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>{t('shipping')}</span>
          <span>{shippingLine(t, formatSek, shippingType, shippingCost, shippingArea, shippingCarrier)}</span>
        </div>
        {isFixed && (
          <div className="flex items-center justify-between text-sm font-bold text-slate-900 border-t border-stone-200 pt-2">
            <span>{t('total')}</span>
            <span>{formatSek(total)}</span>
          </div>
        )}
      </div>

      {shippingType === 'overenskommes' && (
        <div className="bg-amber-50 border-t border-amber-100 px-4 py-2.5">
          <p className="text-xs text-amber-700">{t('shipping_agreed_note')}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function CheckoutModal({
  artworkId, title, imageUrl, price, ownerName,
  sellerType,
  businessName = '',
  shippingType = 'overenskommes',
  shippingCost = 0,
  shippingArea = '',
  shippingCarrier = '',
}: Props) {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('method_select');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Escape key + body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    setIsOpen(false);
    // Reset after animation
    setTimeout(() => {
      setStep('method_select');
      setError('');
      setLoading(false);
    }, 200);
  }

  async function handleStripe(address: ShippingAddress) {
    setLoading(true);
    setError('');
    setStep('stripe_loading');
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId, shippingAddress: address, locale }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? t('error_generic'));
        setStep('error');
        return;
      }
      window.location.href = data.url; // Redirect to Stripe hosted checkout
    } catch {
      setError(t('error_connect'));
      setStep('error');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 active:bg-slate-800 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
        {t('buy_button')}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('dialog_label')}
    >
      {/* Backdrop close */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-slate-900">
            {step === 'address_form' ? t('title_address') : t('title_checkout')}
          </h2>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors"
            aria-label={t('close')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">

          {/* Order summary — hidden on address form to save space */}
          {step !== 'address_form' && (
            <OrderSummary
              title={title}
              imageUrl={imageUrl}
              price={price}
              ownerName={ownerName}
              sellerType={sellerType}
              businessName={businessName}
              shippingType={shippingType}
              shippingCost={shippingCost}
              shippingArea={shippingArea}
              shippingCarrier={shippingCarrier}
            />
          )}

          {/* ── method_select ── */}
          {step === 'method_select' && (
            <div className="space-y-3">
              <button
                onClick={() => setStep('address_form')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 bg-white hover:border-slate-400 hover:shadow-sm active:scale-[0.99] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-slate-900">{t('pay_title')}</span>
                  <p className="text-xs text-stone-500 mt-0.5">{t('pay_methods')}</p>
                </div>
                <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>

              <p className="text-xs text-stone-400 text-center leading-relaxed">{t('legal_note')}</p>
            </div>
          )}

          {/* ── address_form ── */}
          {step === 'address_form' && (
            <ShippingAddressForm
              onSubmit={handleStripe}
              onBack={() => setStep('method_select')}
              loading={loading}
            />
          )}

          {/* ── stripe_loading ── */}
          {step === 'stripe_loading' && (
            <div className="py-8 flex flex-col items-center gap-3">
              <svg className="animate-spin w-7 h-7 text-slate-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-stone-500">{t('connecting')}</p>
            </div>
          )}

          {/* ── error ── */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {error}
              </div>
              <button
                onClick={() => { setStep('method_select'); setError(''); }}
                className="w-full py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
              >
                {t('try_again')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
