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
};

// Revalidate homepage artworks every 60 seconds (ISR)
export const revalidate = 60;

import Link from 'next/link';
import Image from 'next/image';
import prisma from '../lib/prisma';

export default async function HomePage() {
  const artworks = await prisma.artwork.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold">Konstbyte</h1>
              <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl">
                En trygg plats för konstälskare — upptäck unika verk, följ dina favoritkonstnärer och handla tryggt.
              </p>

              <div className="mt-8 flex justify-center md:justify-start gap-4 flex-wrap">
                <Link href="/artworks" aria-label="Utforska konstverk" className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg shadow hover:opacity-95">Utforska konst</Link>
                <Link href="/artworks/new" aria-label="Lägg upp nytt konstverk" className="inline-block border-2 border-white/40 text-white px-6 py-3 rounded-lg hover:bg-white/10">Lägg upp konst</Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Populärt: Målningar</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Nyinkommet</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Fotografi</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Skulpturer</span>
              </div>
            </div>

            <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="/weinstock-brush-96240.jpg"
                  alt="Konstverk exempel"
                  fill
                  className="object-cover"
                  priority
                />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-6">Senaste konstverk</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {artworks.map((art) => (
              <Link key={art.id} href={`/artworks/${art.id}`} className="group">
                <div className="aspect-square bg-slate-100 rounded overflow-hidden relative">
                  <Image src={art.imageUrl} alt={art.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="mt-2">
                  <div className="font-medium text-sm truncate">{art.title}</div>
                  <div className="text-xs text-slate-500">{art.price} SEK</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link href="/artworks" aria-label="Visa alla konstverk" className="inline-block text-sm text-orange-600 font-medium hover:underline">Visa alla konstverk</Link>
          </div>
          <h2 className="text-2xl font-semibold mb-6">Vad du kan göra</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold">Upptäck unik konst</h3>
              <p className="text-sm text-slate-600 mt-2">Bläddra bland handplockade verk från konstnärer över hela världen.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold">Sälj och nå nya köpare</h3>
              <p className="text-sm text-slate-600 mt-2">Publicera dina verk enkelt och nå en målgrupp som uppskattar konst.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold">Följ och få uppdateringar</h3>
              <p className="text-sm text-slate-600 mt-2">Följ konstnärer, få notiser och bygg din egen samling.</p>
            </div>
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Vad andra säger</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 bg-white rounded-lg shadow">
                <p className="text-sm text-slate-700">&quot;Fantastisk plats att hitta unika verk — enkel att använda och säkra betalningar.&quot;</p>
                <div className="mt-4 text-xs text-slate-500">— Anna, samlare</div>
              </div>
              <div className="p-6 bg-white rounded-lg shadow">
                <p className="text-sm text-slate-700">&quot;Så enkelt att sälja mina målningar här. Supporten var hjälpsam och snabb.&quot;</p>
                <div className="mt-4 text-xs text-slate-500">— Lars, konstnär</div>
              </div>
              <div className="p-6 bg-white rounded-lg shadow">
                <p className="text-sm text-slate-700">&quot;Bra community och jag upptäckte flera intressanta konstnärer.&quot;</p>
                <div className="mt-4 text-xs text-slate-500">— Sofia, köpare</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600">© {new Date().getFullYear()} Konstbyte</div>
          <div className="flex gap-4">
            <a href="/om-oss" className="text-sm text-slate-600 hover:underline">Om oss</a>
            <a href="/kontakt" className="text-sm text-slate-600 hover:underline">Kontakt</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
