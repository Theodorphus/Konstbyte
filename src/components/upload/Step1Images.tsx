'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { MultiImageDropzone, type UploadedImage } from './MultiImageDropzone';
import { AiValuationCard } from './AiValuationCard';

interface Step1ImagesProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  onNext: () => void;
}

export function Step1Images({ images, onChange, onNext }: Step1ImagesProps) {
  const t = useTranslations('upload');
  const isValid = images.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">{t('step1_title')}</h2>
        <p className="text-slate-600">
          {t('step1_desc')}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Dropzone - left side, wider */}
        <div className="lg:col-span-2">
          <MultiImageDropzone images={images} onChange={onChange} />
        </div>

        {/* AI Valuation Card - right side */}
        <div>
          <AiValuationCard />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          {t('next')}
        </Button>
      </div>

      {!isValid && (
        <p className="text-sm text-red-600 font-medium">{t('need_image')}</p>
      )}
    </div>
  );
}
