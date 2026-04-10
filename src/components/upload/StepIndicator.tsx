interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: 'Bilder' },
    { number: 2, label: 'Detaljer' },
    { number: 3, label: 'Samling' },
  ];

  return (
    <div className="flex items-center justify-center gap-8 py-6 border-b border-slate-200/70">
      {steps.map((step, idx) => (
        <div key={step.number} className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
              currentStep === step.number
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : currentStep > step.number
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-400'
            }`}
          >
            {currentStep > step.number ? '✓' : step.number}
          </div>
          <span
            className={`text-sm font-medium ${
              currentStep >= step.number ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div className="w-8 h-0.5 bg-slate-200 ml-3" />
          )}
        </div>
      ))}
    </div>
  );
}
