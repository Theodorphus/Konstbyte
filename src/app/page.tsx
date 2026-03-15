import Link from 'next/link';
import Image from 'next/image';
import prisma from '../lib/prisma';
import { formatSek } from '../lib/currency';
import SafeImage from '../components/SafeImage';
import HomepageCommunityPreview from '../components/HomepageCommunityPreview';

// --- Typning ---
type Artwork = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string;
  isPublished: boolean;
  owner: { name: string | null };
};

export const dynamic = "force-dynamic";

// --- Metadata ---
export const metadata = {
  title: 'Konstbyte — Marknadsplats för konst',
  description: 'Upptäck, köp och sälj konst från oberoende konstnärer. Skapa konto och börja handla idag.',
  openGraph: {
    title: 'Konstbyte — Marknadsplats för konst',
    description: 'Upptäck, köp och sälj konst från oberoende konstnärer.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_METADATA_BASE || 'http://localhost:3000'),
};

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

const thumbBlurDataURL = `data:image/svg+xml;base64,${toBase64(shimmer(400, 400))}`;

function HomeArtworksGrid({ artworks }: { artworks: Artwork[] }) {
  return (
    <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {artworks.map((art) => (
        <Link key={art.id} href={`/artworks/${art.id}`} className="group">
          <div className="rounded-3xl bg-white/90 shadow-md shadow-slate-900/5 ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1.5 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10 overflow-hidden">
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-50">
              <SafeImage
                src={art.imageUrl}
                alt={art.title}
                fill
                className="object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
                placeholder="blur"
                blurDataURL={thumbBlurDataURL}
              />
            </div>
            <div className="p-5">
              <div className="font-semibold text-base text-slate-900 truncate leading-snug">{art.title}</div>
              <div className="mt-1 text-xs text-slate-400 truncate">{art.owner.name ?? 'Okänd konstnär'}</div>
              <div className="mt-3 flex items-center justify-between">
                <div className="font-display text-sm font-semibold text-slate-800">{formatSek(art.price)}</div>
                <span className="text-xs text-slate-400 group-hover:text-amber-700 transition-colors duration-200">Visa →</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

type CurrentChallenge = {
  id: string;
  title: string;
  themePrompt: string;
  imageUrl: string | null;
  weekNumber: number;
  year: number;
  endsAt: Date;
  isActive: boolean;
};

export default async function HomePage() {
  let artworks: Artwork[] = [];
  let loadError = false;
  let currentChallenge: CurrentChallenge | null = null;
  try {
    const now = new Date();
    artworks = await prisma.artwork.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { owner: { select: { name: true } } },
    });
    const challenge = await prisma.challenge.findFirst({
      where: { startsAt: { lte: now } },
      orderBy: { startsAt: 'desc' },
      select: { id: true, title: true, themePrompt: true, imageUrl: true, weekNumber: true, year: true, endsAt: true },
    });
    if (challenge) {
      currentChallenge = { ...challenge, isActive: challenge.endsAt > now };
    }
  } catch (e) {
    loadError = true;
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-amber-300 via-rose-300 to-sky-300 shadow-2xl shadow-rose-300/30">

        {/* White bloom top-right — matches CTA section */}
        <div className="absolute -right-12 -top-12 z-10 h-64 w-64 rounded-full bg-white/30 blur-3xl pointer-events-none" />

        {/* White bloom bottom-center — matches CTA section */}
        <div className="absolute left-1/2 bottom-0 z-10 h-32 w-80 -translate-x-1/2 rounded-full bg-white/20 blur-2xl pointer-events-none" />

        <div className="relative z-20 flex min-h-[520px] items-center px-8 py-16 md:min-h-[640px] md:px-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/20 bg-white/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-600/80 font-medium backdrop-blur-sm animate-fade-up">
              Skapa. Dela. Tillsammans.
            </span>
            <h1 className="font-display mt-7 text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.05] text-slate-900 animate-fade-up-delay">
              Här möts svenska konstnärer som vill utvecklas.
            </h1>
            <p className="mt-6 max-w-lg text-base md:text-lg text-slate-700/90 leading-[1.75] animate-fade-up-delay">
              Visa upp dina verk, inspirera andra och hitta ett community drivet av skaparglädje — oavsett nivå.
            </p>

            <div className="mt-12 flex flex-wrap gap-4 animate-fade-up-delay-2">
              <Link
                href="/artworks/new"
                aria-label="Bli konstnär på Konstbyte"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-900/40"
              >
                Bli konstnär
              </Link>
              <Link
                href="/artworks"
                aria-label="Utforska konstverk"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/25 bg-white/50 px-8 py-3.5 text-sm font-semibold text-slate-900 backdrop-blur-sm transition-all duration-300 hover:bg-white/75 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              >
                Utforska konst
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Challenge */}
      {currentChallenge && (
        <section className="mt-16">
          <Link href="/utmaning" className="group block">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900 shadow-xl shadow-violet-900/20 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-violet-900/30">
              {/* Color accents */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_5%_90%,_rgba(251,191,36,0.45),_transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_95%_5%,_rgba(232,72,142,0.35),_transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_55%,_rgba(99,102,241,0.22),_transparent_50%)]" />

              <div className="relative flex flex-col md:flex-row">
                {/* Image */}
                {currentChallenge.imageUrl && (
                  <div className="md:w-64 lg:w-80 flex-shrink-0 relative aspect-video md:aspect-auto md:min-h-[220px] overflow-hidden">
                    <SafeImage
                      src={currentChallenge.imageUrl}
                      alt={currentChallenge.title}
                      fill
                      className="object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-violet-950/60 hidden md:block" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-7 md:p-9 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-300 font-semibold">
                      🎨 Veckans utmaning
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/35">
                      Vecka {currentChallenge.weekNumber} · {currentChallenge.year}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl text-white leading-tight mb-3">
                    {currentChallenge.title}
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed max-w-lg mb-6">
                    {currentChallenge.themePrompt}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-300 text-slate-950 text-sm font-semibold group-hover:bg-amber-200 transition-colors">
                      {currentChallenge.isActive ? 'Delta nu' : 'Se resultaten'} →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className="mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Senaste</p>
            <h2 className="font-display mt-1 text-3xl md:text-4xl">Nya konstverk i flödet</h2>
          </div>
          <Link
            href="/artworks"
            aria-label="Visa alla konstverk"
            className="text-sm font-semibold text-slate-900 underline-offset-2 hover:text-slate-600 hover:underline transition-colors"
          >
            Visa alla konstverk →
          </Link>
        </div>

        {loadError ? (
          <div className="mt-10 rounded-2xl border border-red-100 bg-red-50/80 p-8 text-center text-red-700 font-medium">
            Tekniskt fel — kunde inte hämta konstverk. Försök igen senare.
          </div>
        ) : artworks.length > 0 ? (
          <HomeArtworksGrid artworks={artworks} />
        ) : (
          <div className="mt-10 rounded-2xl border border-slate-200/70 bg-white/80 p-10 text-center">
            <p className="text-slate-700 font-medium text-base">Inga publicerade konstverk ännu.</p>
            <p className="mt-2 text-sm text-slate-500">Titta in snart igen — eller bli den första att publicera ett verk.</p>
            <Link
              href="/artworks/new"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-amber-300 transition-colors"
            >
              Publicera ditt första verk
            </Link>
          </div>
        )}
      </section>

      <HomepageCommunityPreview />

      <section className="mt-28">
        <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 md:p-10 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Hur det fungerar</p>
              <h2 className="font-display mt-3 text-3xl md:text-4xl">Från uppladdning till leverans på tre steg.</h2>
            </div>
            <Link href="/hur-det-fungerar" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
              Läs guiden →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: (
                  <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                title: 'Bygg din konstnärssida',
                text: 'Skapa din profil, lägg till bio och presentera vem du är som konstnär.',
              },
              {
                step: '02',
                icon: (
                  <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Lägg upp dina verk på minuter',
                text: 'Ladda upp bild, sätt pris och välj fraktsätt — allt på under fem minuter.',
              },
              {
                step: '03',
                icon: (
                  <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                ),
                title: 'Sälj tryggt & få betalt',
                text: 'Stripe hanterar betalningen. Du spårar ordern och pengarna landar direkt hos dig.',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-slate-200/60 bg-amber-50/60 p-7 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 ring-1 ring-amber-200/70">
                    {item.icon}
                  </div>
                  <span className="text-3xl font-bold tracking-[0.25em] text-slate-200">{item.step}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-24">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 px-8 py-9 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tryggt & transparent</p>
              <h2 className="font-display mt-2 text-2xl md:text-3xl">En plattform byggd för tydlighet.</h2>
            </div>
            <Link href="/avgifter" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
              Se alla avgifter →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: (
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                value: 'Bara 5%',
                label: 'Plattformsavgift — ingen dolda kostnader',
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                value: 'Stripe',
                label: 'Trygg & krypterad betalning',
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                ),
                value: 'Handplockat',
                label: 'Kuraterade verk av riktiga konstnärer',
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                ),
                value: 'Spårbar',
                label: 'Leverans med full spårning',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-amber-50/50 p-5">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 ring-1 ring-amber-200/70">
                  {item.icon}
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900">{item.value}</div>
                  <div className="mt-0.5 text-xs text-slate-500 leading-snug">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-28 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-300 via-rose-300 to-sky-300 p-10 md:p-14">
          <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/30 blur-3xl pointer-events-none" />
          <div className="absolute left-1/2 bottom-0 h-32 w-80 -translate-x-1/2 rounded-full bg-white/20 blur-2xl pointer-events-none" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-600/80 font-medium">Redo att skapa?</p>
              <h2 className="font-display mt-3 text-3xl md:text-4xl lg:text-5xl text-slate-900 leading-tight">
                Starta din konstnärssida idag.
              </h2>
              <p className="mt-3 text-sm md:text-base text-slate-700/90 max-w-md leading-relaxed">
                Bygg din publik, visa upp dina verk och börja sälja — allt på ett ställe, med bara 5% i avgift.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link
                href="/artworks/new"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
              >
                Kom igång gratis
              </Link>
              <Link
                href="/hur-det-fungerar"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/25 bg-white/50 px-7 py-3.5 text-sm font-semibold text-slate-900 hover:bg-white/75 backdrop-blur-sm transition-colors"
              >
                Hur det fungerar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

