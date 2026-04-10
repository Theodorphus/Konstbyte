'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SHIPPING_OPTIONS } from '@/lib/shipping';
import { AlertCircle } from 'lucide-react';

const artworkDetailsSchema = z.object({
  title: z.string().min(1, 'Titel är obligatorisk').min(3, 'Minimum 3 tecken'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Priset måste vara 0 eller högre'),
  category: z.string().min(1, 'Kategori är obligatorisk'),
  technique: z.string().optional(),
  dimensions: z.string().optional(),
  shippingType: z.string().min(1, 'Fraktmetod är obligatorisk'),
  shippingCost: z.coerce.number().optional(),
  shippingArea: z.string().optional(),
  shippingCarrier: z.string().optional(),
});

export type ArtworkDetailsFormValues = z.infer<typeof artworkDetailsSchema>;

interface Step2DetailsProps {
  defaultValues?: Partial<ArtworkDetailsFormValues>;
  onBack: () => void;
  onNext: (data: ArtworkDetailsFormValues) => void;
}

const categories = [
  { value: 'malningar', label: 'Målningar' },
  { value: 'skulpturer', label: 'Skulpturer' },
  { value: 'fotografi', label: 'Fotografi' },
  { value: 'digital', label: 'Digital konst' },
];

export function Step2Details({
  defaultValues,
  onBack,
  onNext,
}: Step2DetailsProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ArtworkDetailsFormValues>({
    resolver: zodResolver(artworkDetailsSchema),
    defaultValues: {
      category: 'malningar',
      shippingType: 'overenskommes',
      ...defaultValues,
    },
  });

  const shippingType = watch('shippingType');

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Konstverkets detaljer</h2>
        <p className="text-slate-600">Fyll i information om ditt konstverk.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Titel *
          </label>
          <Input
            {...register('title')}
            placeholder="T.ex. Blå himmel"
            className="rounded-xl"
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors.title.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Beskrivning
          </label>
          <textarea
            {...register('description')}
            placeholder="Beskriv ditt verk, inspirationen, tekniken..."
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Pris (SEK) *
          </label>
          <Input
            {...register('price')}
            type="number"
            placeholder="0"
            className="rounded-xl"
          />
          {errors.price && (
            <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Kategori *
          </label>
          <select
            {...register('category')}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 bg-white text-sm"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Technique */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Teknik
          </label>
          <Input
            {...register('technique')}
            placeholder="T.ex. Olja på duk"
            className="rounded-xl"
          />
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mått
          </label>
          <Input
            {...register('dimensions')}
            placeholder="T.ex. 60 × 80 cm"
            className="rounded-xl"
          />
        </div>

        {/* Shipping Type */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Fraktmetod *
          </label>
          <select
            {...register('shippingType')}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 bg-white text-sm"
          >
            {SHIPPING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Conditional Shipping Fields */}
        {shippingType === 'fixed' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fraktkostnad (SEK)
            </label>
            <Input
              {...register('shippingCost')}
              type="number"
              placeholder="0"
              className="rounded-xl"
            />
          </div>
        )}

        {shippingType === 'pickup' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hämtningsplats/stad
            </label>
            <Input
              {...register('shippingArea')}
              placeholder="T.ex. Stockholm"
              className="rounded-xl"
            />
          </div>
        )}

        {shippingType === 'other' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fraktföretag
            </label>
            <Input
              {...register('shippingCarrier')}
              placeholder="T.ex. DHL"
              className="rounded-xl"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="border-slate-200"
        >
          ← Tillbaka
        </Button>
        <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">
          Nästa →
        </Button>
      </div>
    </form>
  );
}
