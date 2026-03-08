import Link from 'next/link';

export const metadata = {
  title: 'Om Konstbyte',
  description: 'Konstbyte är en plats där kreativitet får ta plats och där konst får leva vidare i nya hem.',
};

const pillars = [
  {
    icon: '🛍️',
    text: 'Göra det lättare att sälja och köpa konst utan krångel',
  },
  {
    icon: '🌱',
    text: 'Lyfta fram både nya och erfarna kreatörer',
  },
  {
    icon: '✨',
    text: 'Skapa en community där inspiration och kreativitet får flöda',
  },
  {
    icon: '♻️',
    text: 'Ge konstverk ett längre liv och nya sammanhang',
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Startsidan
      </Link>

      {/* Hero */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Om oss</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-snug">
          En plats där konst<br className="hidden sm:block" /> får leva vidare
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Konstbyte är en plats där kreativitet får ta plats och där konst får leva vidare i nya hem.
          Vi tror att konst ska vara tillgängligt, inspirerande och enkelt — både att upptäcka och att dela med sig av.
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100" />

      {/* Community paragraph */}
      <p className="text-sm text-slate-600 leading-relaxed">
        Här samlas etablerade konstnärer, hobbykreatörer och nyfikna köpare i en trygg och varm miljö.
        Vår vision är att skapa en marknadsplats som känns personlig, mänsklig och fri från onödiga hinder.
        En plats där du kan hitta något unikt, eller låta ditt eget skapande nå ut till fler.
      </p>

      {/* Pillars */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-800">Vi bygger Konstbyte för att:</p>
        <ul className="space-y-3">
          {pillars.map(({ icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">{icon}</span>
              <span className="text-sm text-slate-600 leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Closing */}
      <div className="rounded-2xl bg-stone-50 border border-stone-200 p-6 space-y-3">
        <p className="text-sm text-slate-700 leading-relaxed">
          Oavsett om du målar, fotar, skulpterar eller bara älskar att omge dig med vackra saker är du välkommen här.
        </p>
        <p className="text-sm font-medium text-slate-900">
          Konstbyte är för dig som vill upptäcka, skapa, inspireras — och dela det vidare.
        </p>
        <div className="pt-1">
          <Link
            href="/artworks"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
          >
            Utforska marknadsplatsen
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

    </div>
  );
}
