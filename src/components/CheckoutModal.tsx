'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import ShippingAddressForm, { type ShippingAddress } from './checkout/ShippingAddressForm';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  artworkId: string;
  title: string;
  imageUrl: string;
  price: number;
  ownerName: string;
  shippingType?: string;
  shippingCost?: number;
  shippingArea?: string;
  shippingCarrier?: string;
}

type Step =
  | 'method_select'   // Choose payment method
  | 'address_form'    // Collect shipping address
  | 'stripe_loading'  // Creating Stripe session, about to redirect
  | 'swish_qr'        // Showing Swish QR code + polling
  | 'swish_paid'      // Swish payment confirmed
  | 'error';          // Something went wrong

type SwishData = {
  orderId: string;
  qrCodeUrl: string;
  swishDeepLink: string;
  amount: number;
  isMock: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSek(amount: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(amount);
}

// ─── Legal Disclaimer ─────────────────────────────────────────────────────────

function LegalNote() {
  return (
    <p className="text-xs text-stone-400 text-center leading-relaxed">
      Konstbyte är en teknisk plattform och ansvarar inte för transaktioner, frakt eller skador.
    </p>
  );
}

// ─── Payment option card ──────────────────────────────────────────────────────

function PaymentOptionCard({
  icon,
  title,
  subtitle,
  badge,
  onClick,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 bg-white hover:border-slate-400 hover:shadow-sm active:scale-[0.99] transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
      </div>
      <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
      </svg>
    </button>
  );
}

// ─── Swish QR Panel ───────────────────────────────────────────────────────────

function SwishQRPanel({
  data,
  onBack,
  onPaid,
}: {
  data: SwishData;
  onBack: () => void;
  onPaid: () => void;
}) {
  const [pollCount, setPollCount] = useState(0);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const MAX_POLLS = 60; // 3 min timeout at 3s interval

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/checkout/swish/${data.orderId}`);
      const json = await res.json() as { paymentStatus: string };

      if (json.paymentStatus === 'paid') {
        clearInterval(intervalRef.current!);
        onPaid();
        return;
      }
      if (json.paymentStatus === 'failed' || json.paymentStatus === 'cancelled') {
        clearInterval(intervalRef.current!);
        setExpired(true);
        return;
      }
    } catch {
      // network error — keep polling
    }

    setPollCount((n) => {
      if (n + 1 >= MAX_POLLS) {
        clearInterval(intervalRef.current!);
        setExpired(true);
      }
      return n + 1;
    });
  }, [data.orderId, onPaid]);

  useEffect(() => {
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current!);
  }, [poll]);

  // Detect mobile for deep link button
  const isMobile = typeof navigator !== 'undefined' && /iPhone|Android/i.test(navigator.userAgent);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Byt betalningsmetod
      </button>

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-slate-800">Betala med Swish</p>
        <p className="text-xs text-stone-500">
          {isMobile ? 'Tryck på knappen nedan för att öppna Swish' : 'Skanna QR-koden med din mobiltelefon'}
        </p>
      </div>

      {/* QR code */}
      {!isMobile && !expired && (
        <div className="flex justify-center">
          <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-white p-2">
            <Image
              src={data.qrCodeUrl}
              alt="Swish QR-kod"
              width={220}
              height={220}
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Mobile deep link */}
      {isMobile && !expired && (
        <a
          href={data.swishDeepLink}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#00B064] text-white text-sm font-semibold hover:bg-[#009a56] transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.07c1.4-.07 2.38.61 3.2.64.94-.03 1.88-.78 3.1-.84C18.46 6.8 20.41 8.08 21 9.8c-2.7 1.45-2.17 5.11.44 6.23-.44 1.45-1.04 2.87-2.39 4.25z"/>
            <path d="M12.03 6.9c-.22-2.74 2.04-5.07 4.84-5.17.27 2.8-2.3 5.23-4.84 5.17z"/>
          </svg>
          Öppna Swish
        </a>
      )}

      {/* Expired */}
      {expired && (
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-red-600">Betalningsförfrågan har gått ut.</p>
          <button onClick={onBack} className="text-xs text-slate-600 underline">Försök igen</button>
        </div>
      )}

      {/* Polling indicator */}
      {!expired && (
        <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Väntar på betalning…
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-stone-400">Belopp: <span className="font-semibold text-stone-600">{formatSek(data.amount)}</span></p>
        {data.isMock && (
          <p className="text-xs text-amber-600 mt-1">⚠️ Testläge — Swish Handel ej konfigurerat</p>
        )}
      </div>
    </div>
  );
}

// ─── Order Summary ────────────────────────────────────────────────────────────

function shippingLine(shippingType: string, shippingCost: number, shippingArea: string, shippingCarrier: string): string {
  switch (shippingType) {
    case 'fixed': return shippingCost > 0 ? formatSek(shippingCost) : 'Ingår';
    case 'pickup': return shippingArea ? `Upphämtning — ${shippingArea}` : 'Upphämtning';
    case 'postnord': return 'PostNord';
    case 'dhl': return 'DHL';
    case 'schenker': return 'Schenker';
    case 'other': return shippingCarrier || 'Annat fraktbolag';
    default: return 'Överenskommes';
  }
}

function OrderSummary({
  title,
  imageUrl,
  price,
  ownerName,
  shippingType = 'overenskommes',
  shippingCost = 0,
  shippingArea = '',
  shippingCarrier = '',
}: {
  title: string;
  imageUrl: string;
  price: number;
  ownerName: string;
  shippingType?: string;
  shippingCost?: number;
  shippingArea?: string;
  shippingCarrier?: string;
}) {
  const isFixed = shippingType === 'fixed' && shippingCost > 0;
  const total = price + (isFixed ? shippingCost : 0);

  return (
    <div className="rounded-xl bg-stone-50 border border-stone-200 overflow-hidden">
      {/* Artwork row */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0 relative">
          <Image src={imageUrl} alt={title} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
          <p className="text-xs text-stone-500 mt-0.5">av {ownerName}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-semibold text-slate-900">{formatSek(price)}</p>
        </div>
      </div>

      {/* Shipping row + total */}
      <div className="border-t border-stone-200 px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>Frakt</span>
          <span>{shippingLine(shippingType, shippingCost, shippingArea, shippingCarrier)}</span>
        </div>
        {isFixed && (
          <div className="flex items-center justify-between text-sm font-bold text-slate-900 border-t border-stone-200 pt-2">
            <span>Totalt</span>
            <span>{formatSek(total)}</span>
          </div>
        )}
      </div>

      {/* Overenskommes note */}
      {shippingType === 'overenskommes' && (
        <div className="bg-amber-50 border-t border-amber-100 px-4 py-2.5">
          <p className="text-xs text-amber-700">
            Frakt överenskommes separat med säljaren efter köpet.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function CheckoutModal({
  artworkId, title, imageUrl, price, ownerName,
  shippingType = 'overenskommes',
  shippingCost = 0,
  shippingArea = '',
  shippingCarrier = '',
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('method_select');
  const [error, setError] = useState('');
  const [loadingMethod, setLoadingMethod] = useState<'stripe' | 'swish' | null>(null);
  const [swishData, setSwishData] = useState<SwishData | null>(null);
  const [pendingMethod, setPendingMethod] = useState<'stripe' | 'swish' | null>(null);

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
      setLoadingMethod(null);
      setSwishData(null);
      setPendingMethod(null);
    }, 200);
  }

  // ── Step 1: select method → go to address form ─────────────────────────────

  function selectStripe() { setPendingMethod('stripe'); setStep('address_form'); }
  function selectSwish()  { setPendingMethod('swish');  setStep('address_form'); }

  async function onAddressSubmit(address: ShippingAddress) {
    if (pendingMethod === 'stripe') await handleStripe(address);
    if (pendingMethod === 'swish')  await handleSwish(address);
  }

  // ── Stripe ────────────────────────────────────────────────────────────────

  async function handleStripe(address: ShippingAddress) {
    setLoadingMethod('stripe');
    setError('');
    setStep('stripe_loading');
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId, shippingAddress: address }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Något gick fel');
        setStep('error');
        return;
      }
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe hosted checkout
      }
    } catch {
      setError('Kunde inte ansluta till betalningssystemet');
      setStep('error');
    } finally {
      setLoadingMethod(null);
    }
  }

  // ── Swish ─────────────────────────────────────────────────────────────────

  async function handleSwish(address: ShippingAddress) {
    setLoadingMethod('swish');
    setError('');
    try {
      const res = await fetch('/api/checkout/swish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId, shippingAddress: address }),
      });
      const data = await res.json() as SwishData & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Något gick fel');
        setStep('error');
        return;
      }
      setSwishData(data);
      setStep('swish_qr');
    } catch {
      setError('Kunde inte ansluta till Swish');
      setStep('error');
    } finally {
      setLoadingMethod(null);
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
        Köp konstverk
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      {/* Backdrop close */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-slate-900">
            {step === 'swish_qr' ? 'Betala med Swish' : step === 'address_form' ? 'Leveransadress' : 'Genomför köp'}
          </h2>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors"
            aria-label="Stäng"
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
              shippingType={shippingType}
              shippingCost={shippingCost}
              shippingArea={shippingArea}
              shippingCarrier={shippingCarrier}
            />
          )}

          {/* ── method_select ── */}
          {step === 'method_select' && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-stone-500">Välj betalningsmetod</p>

              <PaymentOptionCard
                icon={
                  <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                }
                title="Betalkort"
                subtitle="Visa, Mastercard — säkert via Stripe"
                badge="Rekommenderas"
                onClick={selectStripe}
                loading={loadingMethod === 'stripe'}
              />

              {/* Swish: disabled until production mTLS is configured */}

              <LegalNote />
            </div>
          )}

          {/* ── address_form ── */}
          {step === 'address_form' && (
            <ShippingAddressForm
              onSubmit={onAddressSubmit}
              onBack={() => setStep('method_select')}
              loading={loadingMethod !== null}
            />
          )}

          {/* ── stripe_loading ── */}
          {step === 'stripe_loading' && (
            <div className="py-8 flex flex-col items-center gap-3">
              <svg className="animate-spin w-7 h-7 text-slate-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-stone-500">Ansluter till Stripe…</p>
            </div>
          )}

          {/* ── swish_qr ── */}
          {step === 'swish_qr' && swishData && (
            <SwishQRPanel
              data={swishData}
              onBack={() => setStep('method_select')}
              onPaid={() => setStep('swish_paid')}
            />
          )}

          {/* ── swish_paid ── */}
          {step === 'swish_paid' && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-900">Betalning mottagen!</p>
              <p className="text-sm text-stone-500">Konstnären kontaktas och ditt konstverk är på väg.</p>
              <a
                href="/profile/orders"
                className="inline-block mt-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Se mina beställningar
              </a>
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
                Försök igen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
