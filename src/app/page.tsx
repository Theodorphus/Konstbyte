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
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.35),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.35),_transparent_40%)]" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-rose-400/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-amber-300/50 blur-[120px]" />

        <div className="relative px-6 py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
                Kuraterad marknadsplats
              </span>
              <h1 className="font-display mt-6 text-4xl md:text-6xl leading-tight">
                Konst som känns personlig, direkt från konstnären.
              </h1>
              <p className="mt-6 text-lg text-white/80 max-w-xl">
                Upptäck nya röster, bygg din samling och sälj verk med en trygg betalning och en publik som älskar original.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/artworks"
                  aria-label="Utforska konstverk"
                  className="inline-flex items-center justify-center rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-400/30 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-white/70"
                >
                  Utforska konst
                </Link>
                <Link
                  href="/artworks/new"
                  aria-label="Sälj din konst"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  Bli konstnär
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Plattformsavgift', value: '3%' },
                  { label: 'Trygg betalning', value: 'Stripe' },
                  { label: 'Kuraterade verk', value: 'Handplockat' },
                  { label: 'Leverans', value: 'Spårbar' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-white/10 p-4 text-center">
                    <div className="text-lg font-semibold text-white">{item.value}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/60">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
                <Image
                  src="/weinstock-brush-96240.jpg"
                  alt="Färgstarkt penseldrag i ateljé"
                  fill
                  className="object-cover"
                  priority
                  placeholder="blur"
                  blurDataURL={heroBlurDataURL}
                />
              </div>
              <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Utvald konstnär</p>
                <p className="font-semibold">Sofia Lind</p>
                <p className="text-xs text-slate-500">Blandteknik · 2025</p>
              </div>
              <div className="absolute -top-6 right-6 rounded-full bg-slate-900/80 px-4 py-2 text-xs text-white">Ny kollektion</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Senaste</p>
            <h2 className="font-display text-3xl md:text-4xl">Nya konstverk i flödet</h2>
          </div>
          <Link href="/artworks" aria-label="Visa alla konstverk" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
            Visa alla konstverk →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((art) => (
            <Link key={art.id} href={`/artworks/${art.id}`} className="group">
              <div className="rounded-2xl bg-white p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/70 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src={art.imageUrl}
                    alt={art.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={thumbBlurDataURL}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 truncate">{art.title}</div>
                    <div className="text-sm text-slate-500">{art.price} SEK</div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Ny</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Varför Konstbyte</p>
            <h2 className="font-display mt-4 text-3xl md:text-4xl">En plats att upptäcka, skapa och växa.</h2>
            <p className="mt-4 text-slate-600 max-w-xl">
              Vi kombinerar en kuraterad marknadsplats med community och verktyg som gör det enkelt att bygga ett konstnärsliv online.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: 'Kuraterade utställningar',
                  text: 'Nya släpp varje vecka, handplockade av vårt team.',
                },
                {
                  title: 'Trygg frakt',
                  text: 'Försäkring, spårning och tydliga leveranssteg.',
                },
                {
                  title: 'Betalning på dina villkor',
                  text: 'Säkra utbetalningar via Stripe med transparenta avgifter.',
                },
                {
                  title: 'Konstnärsverktyg',
                  text: 'Hantera lager, kampanjer och kundrelationer på ett ställe.',
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
            <div className="rounded-3xl bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Trendspaning</p>
              <p className="font-display mt-3 text-2xl text-slate-900">Mjuk minimalism och organiska former toppar.</p>
              <p className="mt-3 text-sm text-slate-600">Upptäck nya uttryck från konstnärer i Norden.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                <span className="rounded-full bg-white/70 px-3 py-1">Textil</span>
                <span className="rounded-full bg-white/70 px-3 py-1">Grafik</span>
                <span className="rounded-full bg-white/70 px-3 py-1">Fotografi</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Kommande live</p>
              <p className="font-display mt-3 text-2xl text-slate-900">Ateljébesök med Lina Grönberg.</p>
              <p className="mt-3 text-sm text-slate-600">En live-session om akvarell och ljus.</p>
              <Link href="/community" className="mt-4 inline-flex items-center text-sm font-semibold text-slate-900 hover:text-slate-700">
                Boka plats →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20">
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

      <section className="mt-20 pb-20">
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
