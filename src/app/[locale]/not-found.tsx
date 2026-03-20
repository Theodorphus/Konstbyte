import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-6">🎨</div>
      <h1 className="font-display text-5xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-xl text-slate-600 mb-2">Sidan hittades inte</p>
      <p className="text-slate-500 mb-8 max-w-md">
        Det verkar som att den här sidan inte finns. Kanske har den flyttats eller tagits bort?
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
        >
          Till startsidan
        </Link>
        <Link
          href="/artworks"
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          Bläddra bland konst
        </Link>
      </div>
    </div>
  );
}
