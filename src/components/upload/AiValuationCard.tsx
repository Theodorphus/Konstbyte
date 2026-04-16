import { Link } from '@/i18n/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';

export function AiValuationCard() {
  return (
    <Link href="/ai/value-art">
      <div className="h-full bg-white/90 border border-amber-200/50 rounded-2xl p-6 hover:shadow-lg hover:border-amber-300 transition-all duration-200 cursor-pointer group">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900">Vet du värdet?</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Använd vår AI-värdering för att få en uppskattning baserad på teknik, storlek och marknad.
        </p>
        <div className="inline-flex items-center gap-2 text-amber-600 group-hover:text-amber-700 text-sm font-medium transition-colors">
          Prova AI-värdering
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
