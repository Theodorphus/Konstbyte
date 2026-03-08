import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-6 px-4">
      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Betalning avbruten</h1>
      <p className="text-slate-600">
        Ingen betalning har genomförts. Du kan gå tillbaka och försöka igen när du är redo.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href="/artworks"
          className="px-5 py-2.5 rounded-md bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors"
        >
          Tillbaka till konstverken
        </Link>
      </div>
    </div>
  );
}
