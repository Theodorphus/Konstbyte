import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gå med i Konstbyte — Marknadsplats för svenska konstnärer',
  description: 'Skapa ett gratis konto och börja sälja din konst, delta i veckoutmaningar och träffa Sveriges nya konstcommunity.',
  openGraph: {
    title: 'Gå med i Konstbyte',
    description: 'Sälj din konst, delta i tävlingar och hitta ditt community. Bara 5% i avgift.',
    images: ['/weinstock-brush-96240.jpg'],
  },
};

const benefits = [
  {
    icon: '🎨',
    title: 'Sälj din konst enkelt',
    desc: 'Ladda upp verk på under fem minuter. Stripe hanterar betalningen — du får pengarna direkt.',
  },
  {
    icon: '🏆',
    title: 'Delta i veckoutmaningar',
    desc: 'Tävla om att bli veckans vinnare, samla poäng och bygg ditt rykte som konstnär.',
  },
  {
    icon: '👥',
    title: 'Hitta ditt community',
    desc: 'Diskutera, inspireras och följ andra konstnärer. Väx tillsammans med likasinnade.',
  },
  {
    icon: '💰',
    title: 'Bara 5% i avgift',
    desc: 'Ingen månadsavgift, inga dolda kostnader. Vi tar bara 5% vid försäljning — det är allt.',
  },
  {
    icon: '📦',
    title: 'Trygg leverans',
    desc: 'Full spårning på varje order. Köparen betalar frakten — du sköter paketeringen.',
  },
  {
    icon: '🤖',
    title: 'AI-värdering',
    desc: 'Osäker på priset? Låt vår AI-verktyg hjälpa dig att sätta rätt pris på ditt verk.',
  },
];

const steps = [
  { num: '01', title: 'Skapa konto', desc: 'Registrera dig gratis med e-post. Tar under en minut.' },
  { num: '02', title: 'Ladda upp ditt verk', desc: 'Välj bild, lägg till titel och pris, välj fraktsätt.' },
  { num: '03', title: 'Sälj & få betalt', desc: 'Köpare hittar dig, betalar via Stripe, du skickar verket.' },
];

const testimonials = [
  {
    quote: 'Konstbyte har gjort det möjligt för mig att nå kunder jag aldrig annars hade hittat. Superenkelt att komma igång!',
    name: 'Hanna L.',
    role: 'Akvarellkonstnär, Göteborg',
    color: 'from-amber-100 to-rose-100',
  },
  {
    quote: 'Jag sålde mitt första verk inom en vecka. Avgiften är rättvis och plattformen känns proffsig.',
    name: 'Mikael S.',
    role: 'Grafiker, Stockholm',
    color: 'from-sky-100 to-indigo-100',
  },
  {
    quote: 'Utmaningarna är det bästa — det ger mig motivation att måla varje vecka och feedbacken är guld värd.',
    name: 'Fatima R.',
    role: 'Mixed media-konstnär, Malmö',
    color: 'from-violet-100 to-fuchsia-100',
  },
];

export default function JoinPage() {
  return (
    <div className="space-y-24 pb-24">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-amber-300 via-rose-300 to-sky-300 shadow-2xl shadow-rose-300/30 -mx-0">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/30 blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 h-32 w-80 -translate-x-1/2 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="relative px-8 py-20 md:px-16 md:py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/20 bg-white/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-700 font-medium backdrop-blur-sm mb-6">
            Gratis att gå med
          </span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-slate-900 leading-[1.05] mb-6">
            Skapa, dela och sälj<br className="hidden md:block" /> din konst.
          </h1>
          <p className="text-lg md:text-xl text-slate-700/90 max-w-2xl mx-auto leading-relaxed mb-10">
            Gå med i Sveriges nya konstcommunity. Visa upp dina verk, tävla i veckans utmaning och börja sälja — allt på ett ställe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-9 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Skapa gratis konto →
            </Link>
            <Link
              href="/artworks"
              className="inline-flex items-center justify-center rounded-full border border-slate-900/25 bg-white/50 px-9 py-4 text-base font-semibold text-slate-900 backdrop-blur-sm hover:bg-white/75 transition-all"
            >
              Utforska konst
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-600/80">Bara 5% vid försäljning — inga dolda avgifter.</p>
        </div>
      </section>

      {/* Benefits */}
      <section>
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Varför Konstbyte?</p>
          <h2 className="font-display text-3xl md:text-4xl text-slate-900">Allt du behöver på ett ställe.</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(b => (
            <div key={b.title} className="rounded-2xl bg-white/90 border border-stone-200/80 p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="text-3xl mb-4">{b.icon}</div>
              <h3 className="font-semibold text-base text-slate-900 mb-2">{b.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl bg-white/90 border border-stone-200/70 p-8 md:p-12 shadow-sm">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Kom igång</p>
          <h2 className="font-display text-3xl md:text-4xl text-slate-900">Tre steg — det är allt.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map(s => (
            <div key={s.num} className="flex flex-col gap-3">
              <span className="font-display text-5xl font-bold text-slate-100 leading-none">{s.num}</span>
              <h3 className="font-semibold text-lg text-slate-900">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Konstnärer om Konstbyte</p>
          <h2 className="font-display text-3xl md:text-4xl text-slate-900">Vad säger de som redan säljer?</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map(t => (
            <div key={t.name} className={`rounded-2xl bg-gradient-to-br ${t.color} p-7 border border-white/60 shadow-sm`}>
              <p className="text-slate-700 leading-relaxed text-sm mb-5">"{t.quote}"</p>
              <div>
                <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-300 via-rose-300 to-sky-300 p-10 md:p-16 text-center shadow-xl shadow-rose-300/20">
          <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/30 blur-3xl pointer-events-none" />
          <div className="absolute left-1/2 bottom-0 h-32 w-80 -translate-x-1/2 rounded-full bg-white/20 blur-2xl pointer-events-none" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-600/80 mb-3">Redo att börja?</p>
            <h2 className="font-display text-3xl md:text-5xl text-slate-900 mb-4 leading-tight">
              Bli konstnär på Konstbyte idag.
            </h2>
            <p className="text-slate-700 max-w-lg mx-auto text-base mb-8">
              Registrera dig gratis och ladda upp ditt första verk på under fem minuter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-9 py-4 text-base font-semibold text-white shadow-lg hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Kom igång gratis →
              </Link>
              <Link
                href="/utmaning"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/25 bg-white/50 px-9 py-4 text-base font-semibold text-slate-900 backdrop-blur-sm hover:bg-white/75 transition-all"
              >
                Se veckans utmaning
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
