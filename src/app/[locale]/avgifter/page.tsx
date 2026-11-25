import { alternatesFor } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';
import { PLATFORM_FEE_PERCENT } from '@/lib/payout';

const fee = PLATFORM_FEE_PERCENT;

// Example sale on the page. Stripe's EU card fee is 1.5 % + 1.80 SEK.
const EXAMPLE_PRICE = 1000;
const exampleFee = (EXAMPLE_PRICE * fee) / 100;
const exampleStripe = EXAMPLE_PRICE * 0.015 + 1.8;
const examplePayout = EXAMPLE_PRICE - exampleFee - exampleStripe;

const kr = (n: number) =>
  `${n.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isSv = locale !== 'en';
  return {
    title: isSv ? 'Avgifter' : 'Fees',
    description: isSv
      ? `Konstbyte tar ${fee} % provision på försäljningar. Se fullständig prisöversikt med Stripe-avgifter och exempelberäkning.`
      : `Konstbyte charges ${fee}% on sales. See full pricing overview including Stripe fees and an example calculation.`,
    alternates: alternatesFor(locale, '/avgifter'),
    openGraph: { images: ['/og-image.png'] },
  };
}

export default async function FeesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isSv = locale !== 'en';

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-16">

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {isSv ? 'Transparenta priser' : 'Transparent pricing'}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {isSv ? 'Avgifter & kostnader' : 'Fees & costs'}
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          {isSv
            ? 'Vi tror på transparens. Nedan ser du exakt vad det kostar att sälja konst på Konstbyte.'
            : 'We believe in transparency. Below you can see exactly what it costs to sell art on Konstbyte.'}
        </p>
      </div>

      {/* Fee breakdown */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 divide-y divide-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 bg-amber-50/60">
          <h2 className="font-semibold text-slate-900">
            {isSv ? 'Avgiftsöversikt' : 'Fee overview'}
          </h2>
        </div>

        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-medium text-slate-900">
              {isSv ? 'Plattformsavgift' : 'Platform fee'}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {isSv
                ? 'Tas ut som en procentsats av försäljningspriset.'
                : 'Charged as a percentage of the sale price.'}
            </div>
          </div>
          <div className="text-xl font-bold text-amber-700 whitespace-nowrap">{fee} %</div>
        </div>

        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-medium text-slate-900">
              {isSv ? 'Stripe betalningsavgift (EU-kort)' : 'Stripe payment fee (EU cards)'}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {isSv
                ? 'Stripes standardavgift för europeiska kort. Dras från betalningen innan utbetalning.'
                : "Stripe's standard fee for European cards. Deducted from the payment before payout."}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-700 whitespace-nowrap">1,5 % + 1,80 kr</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {isSv ? 'per transaktion' : 'per transaction'}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-medium text-slate-900">
              {isSv ? 'Registrering & listning' : 'Registration & listing'}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {isSv
                ? 'Det är helt gratis att skapa konto och publicera konstverk.'
                : 'Creating an account and listing artworks is completely free.'}
            </div>
          </div>
          <div className="text-xl font-bold text-green-600 whitespace-nowrap">
            {isSv ? 'Gratis' : 'Free'}
          </div>
        </div>

        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-medium text-slate-900">
              {isSv ? 'Månadsavgift / prenumeration' : 'Monthly fee / subscription'}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {isSv
                ? 'Inga fasta kostnader — du betalar bara när du säljer.'
                : 'No fixed costs — you only pay when you sell.'}
            </div>
          </div>
          <div className="text-xl font-bold text-green-600 whitespace-nowrap">
            {isSv ? 'Ingen' : 'None'}
          </div>
        </div>
      </div>

      {/* Example calculation */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm overflow-hidden">
        <div className="px-6 py-5 bg-slate-50/60">
          <h2 className="font-semibold text-slate-900">
            {isSv ? 'Exempelberäkning' : 'Example calculation'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isSv ? 'Försäljningspris: 1 000 kr' : 'Sale price: 1 000 SEK'}
          </p>
        </div>
        <div className="px-6 py-5 space-y-3 text-sm">
          <div className="flex justify-between text-slate-700">
            <span>{isSv ? 'Försäljningspris' : 'Sale price'}</span>
            <span className="font-medium">{kr(EXAMPLE_PRICE)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>{isSv ? `− Plattformsavgift (${fee} %)` : `− Platform fee (${fee}%)`}</span>
            <span>−{kr(exampleFee)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>{isSv ? '− Stripe (1,5% + 1,80 kr)' : '− Stripe (1.5% + 1.80 SEK)'}</span>
            <span>−{kr(exampleStripe)}</span>
          </div>
          <div className="h-px bg-slate-100" />
          <div className="flex justify-between font-bold text-slate-900 text-base">
            <span>{isSv ? 'Utbetalning till dig' : 'Payout to you'}</span>
            <span>{kr(examplePayout)}</span>
          </div>
          <p className="text-xs text-slate-400 pt-1">
            {isSv
              ? '* Stripe-avgiften varierar beroende på betalsätt, korttyp och land. Klarna är till exempel dyrare än kort. Den faktiska avgiften för varje köp dras från din utbetalning, som sker via Stripe Connect.'
              : '* The Stripe fee varies by payment method, card type and country. Klarna, for example, costs more than cards. The actual fee for each sale is deducted from your payout, which is made via Stripe Connect.'}
          </p>
        </div>
      </div>

      {/* Payout info */}
      <div className="rounded-2xl border border-slate-200/70 bg-amber-50/60 p-6 space-y-2">
        <h2 className="font-semibold text-slate-900">
          {isSv ? 'Utbetalningar' : 'Payouts'}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {isSv
            ? 'Utbetalningar hanteras via Stripe Connect. När en köpare genomför ett köp hålls beloppet av Stripe och betalas ut till ditt kopplade Stripe-konto. Utbetalningstiden beror på ditt lands Stripe-inställningar, men är normalt 2–7 bankdagar.'
            : "Payouts are handled via Stripe Connect. When a buyer completes a purchase, the amount is held by Stripe and paid out to your connected Stripe account. Payout timing depends on your country's Stripe settings, but is typically 2–7 business days."}
        </p>
      </div>

      {/* CTA */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Link
          href="/join"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          {isSv ? 'Bli konstnär — kostnadsfritt' : 'Become an artist — free'}
        </Link>
        <Link
          href="/hur-det-fungerar"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        >
          {isSv ? 'Hur det fungerar' : 'How it works'}
        </Link>
      </div>
    </div>
  );
}
