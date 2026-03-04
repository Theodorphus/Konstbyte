import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-6">
      <div className="text-6xl">↩️</div>
      <h1 className="text-2xl font-bold text-slate-900">Betalningen avbröts</h1>
      <p className="text-slate-600">
        Inga pengar har dragits. Du kan gå tillbaka och försöka igen när du vill.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href="/artworks"
          className="px-5 py-2.5 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-700 transition-colors"
        >
          Tillbaka till marknadsplatsen
        </Link>
      </div>
    </div>
  );
}
