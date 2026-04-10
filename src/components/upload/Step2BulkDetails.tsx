'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  ArtworkSlotCard,
  type ArtworkSlotDetails,
} from './ArtworkSlotCard';
import { SHIPPING_OPTIONS } from '@/lib/shipping';

interface ArtworkSlot {
  url: string;
  sortOrder: number;
  details: ArtworkSlotDetails | null;
}

interface SharedShippingValues {
  shippingType: string;
  shippingCost?: number;
  shippingArea?: string;
  shippingCarrier?: string;
}

interface Step2BulkDetailsProps {
  slots: ArtworkSlot[];
  onBack: () => void;
  onNext: (slots: ArtworkSlot[], shipping: SharedShippingValues) => void;
  defaultShipping?: SharedShippingValues;
}

export function Step2BulkDetails({
  slots,
  onBack,
  onNext,
  defaultShipping,
}: Step2BulkDetailsProps) {
  const t = useTranslations('artworks');
  const [shippingType, setShippingType] = useState(defaultShipping?.shippingType || 'overenskommes');
  const [shippingCost, setShippingCost] = useState(defaultShipping?.shippingCost || 0);
  const [shippingArea, setShippingArea] = useState(defaultShipping?.shippingArea || '');
  const [shippingCarrier, setShippingCarrier] = useState(defaultShipping?.shippingCarrier || '');
  const [completedCount, setCompletedCount] = useState(0);

  // Track completion state per slot
  const [slotDetails, setSlotDetails] = useState<Map<number, ArtworkSlotDetails | null>>(
    new Map(slots.map((s, i) => [i, s.details]))
  );

  const handleSlotComplete = useCallback((index: number, details: ArtworkSlotDetails) => {
    setSlotDetails((prev) => {
      const newDetails = new Map(prev);
      newDetails.set(index, details);
      const completed = Array.from(newDetails.values()).filter((d) => d !== null).length;
      setCompletedCount(completed);
      return newDetails;
    });
  }, []);

  const handleSlotIncomplete = useCallback((index: number) => {
    setSlotDetails((prev) => {
      const newDetails = new Map(prev);
      newDetails.delete(index);
      const completed = Array.from(newDetails.values()).filter((d) => d !== null).length;
      setCompletedCount(completed);
      return newDetails;
    });
  }, []);

  const isAllComplete = completedCount === slots.length;

  const handleNext = () => {
    if (!isAllComplete) return;

    // Build updated slots with details
    const updatedSlots = slots.map((slot, idx) => ({
      ...slot,
      details: slotDetails.get(idx) || null,
    }));

    const shipping: SharedShippingValues = {
      shippingType,
      shippingCost: shippingType === 'fixed' ? shippingCost : undefined,
      shippingArea: shippingType === 'pickup' ? shippingArea : undefined,
      shippingCarrier: shippingType === 'other' ? shippingCarrier : undefined,
    };

    onNext(updatedSlots, shipping);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleNext();
      }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          {t('bulk_upload_title')}
        </h2>
        <p className="text-slate-600">
          {t('bulk_upload_instruction')}
        </p>
      </div>

      {/* Shared Shipping Section */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
        <h3 className="font-semibold text-slate-900">{t('shared_shipping_label')}</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('shipping_options_label')}
          </label>
          <select
            value={shippingType}
            onChange={(e) => setShippingType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          >
            {SHIPPING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fixed shipping cost */}
        {shippingType === 'fixed' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('shipping_cost_label')}
            </label>
            <Input
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              placeholder={t('shipping_cost_placeholder')}
              className="text-sm"
            />
          </div>
        )}

        {/* Pickup area */}
        {shippingType === 'pickup' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('pickup_area_label')}
            </label>
            <Input
              value={shippingArea}
              onChange={(e) => setShippingArea(e.target.value)}
              placeholder={t('pickup_area_placeholder')}
              className="text-sm"
            />
          </div>
        )}

        {/* Shipping carrier */}
        {shippingType === 'other' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('carrier_label')}
            </label>
            <Input
              value={shippingCarrier}
              onChange={(e) => setShippingCarrier(e.target.value)}
              placeholder={t('carrier_placeholder')}
              className="text-sm"
            />
          </div>
        )}
      </div>

      {/* Artwork Cards */}
      <div className="space-y-3">
        {slots.map((slot, idx) => (
          <ArtworkSlotCard
            key={idx}
            index={idx}
            imageUrl={slot.url}
            onComplete={(details) => handleSlotComplete(idx, details)}
            onIncomplete={() => handleSlotIncomplete(idx)}
            defaultValues={slot.details || undefined}
          />
        ))}
      </div>

      {/* Completion indicator */}
      {!isAllComplete && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {t('completion_status', { total: slots.length, completed: completedCount })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2 pt-4">
        <Button type="button" onClick={onBack} variant="outline" className="border-slate-200">
          {t('back')}
        </Button>
        <Button
          type="submit"
          disabled={!isAllComplete}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          Nästa →
        </Button>
      </div>
    </form>
  );
}
