'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SafeImage from '@/components/SafeImage';
import { Input } from '@/components/ui/input';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

const artworkSlotSchema = z.object({
  title: z.string().min(3, 'Titel måste vara minst 3 tecken'),
  price: z.coerce.number().min(0, 'Pris kan inte vara negativt'),
  category: z.string().min(1, 'Välj en kategori'),
  description: z.string().optional(),
  technique: z.string().optional(),
  dimensions: z.string().optional(),
});

export type ArtworkSlotDetails = z.infer<typeof artworkSlotSchema>;

const CATEGORIES = ['malningar', 'skulpturer', 'fotografi', 'digital'];

interface ArtworkSlotCardProps {
  index: number;
  imageUrl: string;
  onComplete: (details: ArtworkSlotDetails) => void;
  onIncomplete: () => void;
  defaultValues?: Partial<ArtworkSlotDetails>;
}

export function ArtworkSlotCard({
  index,
  imageUrl,
  onComplete,
  onIncomplete,
  defaultValues,
}: ArtworkSlotCardProps) {
  const t = useTranslations('artworks');
  const [isExpanded, setIsExpanded] = useState(false);
  const prevValidRef = useRef<boolean>(false);
  // Use refs for callbacks to avoid stale closures without adding them to dep array
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onIncompleteRef = useRef(onIncomplete);
  onIncompleteRef.current = onIncomplete;

  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<ArtworkSlotDetails>({
    resolver: zodResolver(artworkSlotSchema),
    mode: 'onChange',
    defaultValues: defaultValues || {
      category: 'malningar',
      description: '',
      technique: '',
      dimensions: '',
    },
  });

  const values = watch();

  // Notify parent whenever form is valid (with current values), or when it becomes invalid
  useEffect(() => {
    if (isValid) {
      onCompleteRef.current(values as ArtworkSlotDetails);
    } else if (prevValidRef.current) {
      // Became invalid
      onIncompleteRef.current();
    }
    prevValidRef.current = isValid;
  }, [isValid, values]);

  return (
    <div
      className={`border-2 rounded-xl p-4 transition-all ${
        isValid ? 'border-green-300 bg-green-50/30' : 'border-amber-300 bg-amber-50/30'
      }`}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-slate-100 overflow-hidden relative">
          <SafeImage src={imageUrl} alt={`Artwork ${index + 1}`} fill className="object-cover" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Header with number and status */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              {t('artwork_slot_label', { number: index + 1 })}
            </h3>
            {isValid && <Check className="w-5 h-5 text-green-600" />}
          </div>

          {/* Title and Price Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('title_label')}
              </label>
              <Input
                {...register('title')}
                placeholder={t('title_placeholder')}
                className={`text-sm ${errors.title ? 'border-red-300' : ''}`}
              />
              {errors.title && (
                <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('price_label')}
              </label>
              <Input
                {...register('price')}
                type="number"
                placeholder="0"
                className={`text-sm ${errors.price ? 'border-red-300' : ''}`}
              />
              {errors.price && (
                <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t('category')}
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* More Details Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
            {t('more_details_toggle')}
          </button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('description')}
                </label>
                <textarea
                  {...register('description')}
                  placeholder={t('description_placeholder')}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('technique_label')}
                  </label>
                  <Input
                    {...register('technique')}
                    placeholder={t('technique_placeholder')}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('dimensions_label')}
                  </label>
                  <Input
                    {...register('dimensions')}
                    placeholder={t('dimensions_placeholder')}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
