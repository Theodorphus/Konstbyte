import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

// The three "how it works" steps with their illustrations. Used on the
// homepage and on /hur-det-fungerar.
const STEPS = [
  { key: 'step1', image: '/images/step-1.webp' },
  { key: 'step2', image: '/images/step-2.webp' },
  { key: 'step3', image: '/images/step-3.webp' },
] as const;

export default async function HowItWorksSteps({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
          <div className="relative aspect-[4/3] bg-white">
            <Image
              src={step.image}
              alt=""
              fill
              sizes="(min-width: 768px) 30vw, 100vw"
              className="object-contain p-4"
            />
            <span className="absolute left-4 top-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold tracking-widest text-amber-800 ring-1 ring-amber-200/70">
              0{i + 1}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2 border-t border-slate-100 bg-amber-50/60 p-6">
            <h3 className="text-base font-semibold text-slate-900">{t(`${step.key}_title`)}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{t(`${step.key}_text`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
