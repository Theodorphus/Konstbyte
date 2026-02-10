export const metadata = {
  title: 'Konstbyte — Marknadsplats för konst',
  description: 'Upptäck, köp och sälj konst från oberoende konstnärer. Skapa konto och börja handla idag.',
  openGraph: {
    title: 'Konstbyte — Marknadsplats för konst',
    description: 'Upptäck, köp och sälj konst från oberoende konstnärer.',
    images: ['/weinstock-brush-96240.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_METADATA_BASE || 'http://localhost:3000'),
};

// Revalidate homepage artworks every 60 seconds (ISR)
export const revalidate = 60;
export const dynamic = "force-dynamic";

import Link from 'next/link';
import Image from 'next/image';
import prisma from '../lib/prisma';
import TestimonialsClient from '../components/TestimonialsClient';

function toBase64(str: string) {
  try {
    return Buffer.from(str).toString('base64');
  } catch {
    return '';
  }
}

function shimmer(w = 700, h = 475) {
  return `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#f3f4f6" offset="0%" />
        <stop stop-color="#e5e7eb" offset="50%" />
        <stop stop-color="#f3f4f6" offset="100%" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="#f3f4f6" />
    <rect width="100%" height="100%" fill="url(#g)" />
  </svg>`;
}

const heroBlurDataURL = `data:image/svg+xml;base64,${toBase64(shimmer(1200,800))}`;
const thumbBlurDataURL = `data:image/svg+xml;base64,${toBase64(shimmer(400,400))}`;

export default async function HomePage() {
  const artworks = await prisma.artwork.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden rounded-[36px] bg-slate-950 text-white shadow-xl shadow-slate-900/20 ring-1 ring-white/10">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-35">
          <Image
            src="/weinstock-brush-96240.jpg"
            alt="Färgstarkt penseldrag i ateljé"
            fill
            className="object-cover object-center"
            priority
            placeholder="blur"
            blurDataURL={heroBlurDataURL}
          />
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-950/50 via-slate-900/45 to-slate-950/75" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(120%_120%_at_50%_0%,_rgba(255,255,255,0.14),_transparent_48%),radial-gradient(85%_85%_at_50%_100%,_rgba(0,0,0,0.55),_transparent_64%)]" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_18%_22%,_rgba(251,191,36,0.12),_transparent_52%),radial-gradient(circle_at_78%_80%,_rgba(251,113,133,0.18),_transparent_56%)]" />
        <div className="absolute -top-20 -right-24 z-10 h-72 w-72 rounded-full bg-amber-300/15 blur-[140px]" />
        <div className="absolute -bottom-44 -left-20 z-10 h-96 w-96 rounded-full bg-rose-300/15 blur-[160px]" />

        <div className="relative z-20 flex min-h-[360px] items-center px-6 py-12 md:min-h-[460px] md:px-10 md:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-wide text-white/70 animate-fade-up">
              Skapa. Dela. Tillsammans.
            </span>
            <h1 className="font-display mt-6 text-4xl md:text-5xl lg:text-6xl leading-tight text-white/95 animate-fade-up-delay">
              Här möts svenska konstnärer som vill utvecklas.
            </h1>
            <p className="mt-5 max-w-xl text-base md:text-lg text-white/80 leading-relaxed animate-fade-up-delay">
              Visa upp dina verk, inspirera andra och upptäck ett community som drivs av skaparglädje och nyfikenhet.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/artworks"
                aria-label="Utforska konstverk"
                className="inline-flex items-center justify-center rounded-full bg-amber-200 px-7 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-200/35 transition duration-300 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                Utforska konst
              </Link>
              <Link
                href="/artworks/new"
                aria-label="Sälj din konst"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white/90 transition duration-300 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                Bli konstnär
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Senaste</p>
            <h2 className="font-display text-3xl md:text-4xl">Nya konstverk i flödet</h2>
          </div>
          <Link href="/artworks" aria-label="Visa alla konstverk" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
            Visa alla konstverk →
          </Link>
        </div>

        <div className="mt-10 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((art) => (
            <Link key={art.id} href={`/artworks/${art.id}`} className="group">
              <div className="rounded-2xl bg-white/90 p-6 shadow-md shadow-slate-900/5 ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10">
                <div className="relative w-full overflow-hidden rounded-2xl bg-slate-50/80 ring-1 ring-slate-200/60">
                  <div className="relative mx-auto aspect-[4/3] w-full max-w-[320px]">
                    <Image
                      src={art.imageUrl}
                      alt={art.title}
                      fill
                      className="object-contain transition duration-700 ease-out group-hover:scale-[1.03]"
                      placeholder="blur"
                      blurDataURL={thumbBlurDataURL}
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-base text-slate-900 truncate">{art.title}</div>
                    <div className="text-sm text-slate-500">{art.price} SEK</div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/60">Ny</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <div className="grid gap-6 lg:grid-cols-[0.65fr_1fr]">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Kuratorns val</p>
            <h3 className="font-display mt-3 text-2xl">Tre riktningar att upptäcka</h3>
            <p className="mt-3 text-sm text-slate-600">Varje vecka handplockar vi verk som speglar vad som rör sig i ateljéerna just nu.</p>
            <div className="mt-6 space-y-3">
              {[
                { title: 'Mjuka pigment', text: 'Pastell, textil och taktila ytor.' },
                { title: 'Grafisk rytm', text: 'Monokroma serier och tryck.' },
                { title: 'Nordiskt ljus', text: 'Fotografi med känsla av stillhet.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200/70 bg-white/85 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: 'Ateljé: Linn Ek', tag: 'Nysläppt', tone: 'bg-amber-200/70' },
              { title: 'Samlare väljer', tag: 'Topplista', tone: 'bg-rose-200/70' },
              { title: 'Skulptur i fokus', tag: 'Tema', tone: 'bg-sky-200/70' },
              { title: 'Minimalistiskt collage', tag: 'Trend', tone: 'bg-amber-100/70' },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-slate-700 ${item.tone}`}>
                  {item.tag}
                </span>
                <p className="font-display mt-4 text-xl text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">Kuraterade verk med tydlig form och känsla.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-28">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Community</p>
            <h2 className="font-display mt-4 text-3xl md:text-4xl">Ett community för dig som skapar.</h2>
            <p className="mt-4 text-slate-600 max-w-xl">
              Bygg relationer, dela din process och hitta nya samarbeten i ett varmt, nyfiket sammanhang.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: '🎥 Dela din process',
                  text: 'Visa skisser, tankar och bakom kulisserna.',
                },
                {
                  title: '💬 Få feedback',
                  text: 'Utvecklas genom konstruktiva samtal.',
                },
                {
                  title: '🎙️ Delta i live-sessioner',
                  text: 'Möt konstnärer och gäster i realtid.',
                },
                {
                  title: '🤝 Hitta andra kreatörer',
                  text: 'Skapa kontakter och samarbeta över genrer.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-amber-200/80 via-orange-200/70 to-rose-200/70 p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Veckans möten</p>
              <p className="font-display mt-3 text-2xl text-slate-900">Skaparkväll med öppna ateljéer.</p>
              <p className="mt-3 text-sm text-slate-600">Dela arbetsprocesser och få nya perspektiv.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                <span className="rounded-full bg-white/70 px-3 py-1">Öppet samtal</span>
                <span className="rounded-full bg-white/70 px-3 py-1">Portföljtips</span>
                <span className="rounded-full bg-white/70 px-3 py-1">Nya vänner</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Community live</p>
              <p className="font-display mt-3 text-2xl text-slate-900">Få feedback på din senaste serie.</p>
              <p className="mt-3 text-sm text-slate-600">Små grupper, varm stämning och kreativt fokus.</p>
              <Link href="/community" className="mt-4 inline-flex items-center text-sm font-semibold text-slate-900 hover:text-slate-700">
                Gå till communityt →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-28">
        <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Hur det fungerar</p>
              <h2 className="font-display mt-3 text-3xl md:text-4xl">Från uppladdning till leverans på tre steg.</h2>
            </div>
            <Link href="/hur-det-fungerar" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
              Läs guiden →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: '🖌️ Skapa profil', text: 'Bygg en konstnärssida och samla dina verk.' },
              { step: '02', title: '🖼️ Publicera verk', text: 'Lägg upp konst, priser och frakt på minuter.' },
              { step: '03', title: '💫 Sälj tryggt', text: 'Få betalt direkt och följ leveransen.' },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-slate-200/70 bg-amber-100/50 p-6">
                <span className="text-2xl font-semibold tracking-[0.3em] text-slate-400">{item.step}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-24">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tryggt & transparent</p>
              <h2 className="font-display mt-3 text-3xl md:text-4xl">En plattform byggd för tydlighet.</h2>
            </div>
            <Link href="/avgifter" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
              Se avgifter →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Plattformsavgift', value: '3%' },
              { label: 'Trygg betalning', value: 'Stripe' },
              { label: 'Kuraterade verk', value: 'Handplockat' },
              { label: 'Leverans', value: 'Spårbar' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200/70 bg-amber-100/50 p-4 text-center">
                <div className="text-lg font-semibold text-slate-900">{item.value}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-28">
        <div className="rounded-3xl bg-white/80 p-8 shadow-xl ring-1 ring-amber-100">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Omdömen</p>
              <h2 className="font-display mt-3 text-3xl md:text-4xl">Konstnärer och samlare om Konstbyte</h2>
            </div>
            <Link href="/community" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
              Läs fler berättelser →
            </Link>
          </div>
          <div className="mt-8">
            <TestimonialsClient />
          </div>
        </div>
      </section>

      <section className="mt-28 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-300 via-rose-300 to-sky-300 p-10 md:p-14">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-600">Redo att skapa?</p>
              <h2 className="font-display mt-3 text-3xl md:text-4xl text-slate-900">Starta din butik på Konstbyte.</h2>
              <p className="mt-3 text-sm text-slate-700 max-w-xl">Bygg din publik, få verktyg för leverans och betalt, och lansera din nästa kollektion med oss.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/artworks/new" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800">
                Skapa butik
              </Link>
              <Link href="/hur-det-fungerar" className="inline-flex items-center justify-center rounded-full border border-slate-900/30 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white/60">
                Hur det fungerar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
