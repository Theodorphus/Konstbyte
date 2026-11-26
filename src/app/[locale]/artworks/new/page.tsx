'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { StepIndicator } from '@/components/upload/StepIndicator';
import { Step1Images } from '@/components/upload/Step1Images';
import { Step2BulkDetails } from '@/components/upload/Step2BulkDetails';
import { Step3Collections } from '@/components/upload/Step3Collections';
import {
  createMultipleArtworks,
  type UploadedImage,
  type ArtworkSlotDetails,
} from '@/app/actions/artwork-actions';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import SellerTypeFields, {
  emptySellerForm,
  sellerFormError,
  type SellerFormValues,
} from '@/components/seller/SellerTypeFields';
import { isSellerType, type SellerDetailsError } from '@/lib/seller';

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

export default function NewArtworkPage() {
  const router = useRouter();
  const t = useTranslations('artworks');
  const tUp = useTranslations('upload');

  // Auth check
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Sellers need a display name, and must say whether they sell as a private
  // person or a business, before their first upload.
  const [hasName, setHasName] = useState(false);
  const [hasSellerType, setHasSellerType] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [sellerForm, setSellerForm] = useState<SellerFormValues>(emptySellerForm);
  const [sellerError, setSellerError] = useState<SellerDetailsError | 'generic' | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [artworkSlots, setArtworkSlots] = useState<ArtworkSlot[]>([]);
  const [sharedShipping, setSharedShipping] = useState<SharedShippingValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/me');
        if (response.ok) {
          const data = await response.json();
          setOwnerId(data?.user?.id || null);
          setHasName(Boolean(data?.user?.name?.trim()));
          setHasSellerType(isSellerType(data?.user?.sellerType));
        } else {
          setOwnerId(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setOwnerId(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const saveSellerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!hasName && name.length < 2) {
      setNameError(t('artist_name_too_short'));
      return;
    }
    const formError = hasSellerType ? null : sellerFormError(sellerForm);
    setNameError(null);
    setSellerError(formError);
    if (formError) return;

    setNameSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(hasName ? {} : { name }),
          ...(hasSellerType ? {} : sellerForm),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setHasName(true);
        setHasSellerType(true);
      } else if (data?.code) {
        setSellerError(data.code);
      } else if (!hasName) {
        setNameError(t('artist_name_error'));
      } else {
        setSellerError('generic');
      }
    } catch {
      if (!hasName) setNameError(t('artist_name_error'));
      else setSellerError('generic');
    } finally {
      setNameSaving(false);
    }
  };

  const handleStep1Next = () => {
    if (artworkSlots.length === 0) {
      setError(tUp('need_image'));
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const handleStep1ImagesChange = (images: UploadedImage[]) => {
    setArtworkSlots((prev) => {
      const prevByUrl = new Map(prev.map((s) => [s.url, s.details]));
      return images.map((img, idx) => ({
        url: img.url,
        sortOrder: idx,
        details: prevByUrl.get(img.url) ?? null,
      }));
    });
  };

  const handleStep2Next = (
    slots: ArtworkSlot[],
    shipping: SharedShippingValues
  ) => {
    setArtworkSlots(slots);
    setSharedShipping(shipping);
    setError(null);
    setCurrentStep(3);
  };

  const handleStep3Submit = async (collectionId: string | null) => {
    if (!sharedShipping || artworkSlots.length === 0) {
      setError('Form data is missing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createMultipleArtworks({
        slots: artworkSlots.map((slot) => ({
          url: slot.url,
          details: slot.details!,
        })),
        shippingType: sharedShipping.shippingType,
        shippingCost: sharedShipping.shippingCost,
        shippingArea: sharedShipping.shippingArea,
        shippingCarrier: sharedShipping.shippingCarrier,
        collectionId,
      });

      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }
      router.push('/my-artworks');
    } catch (err) {
      console.error('Error creating artworks:', err);
      setError(
        err instanceof Error ? err.message : tUp('create_error')
      );
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-40 bg-white/80 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Not authenticated
  if (!ownerId) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <h1 className="text-xl font-semibold text-slate-900">{t('sign_in_to_upload')}</h1>
            <p className="text-slate-600">{tUp('sign_in_desc')}</p>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/auth/signin" className="inline-flex justify-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                {tUp('sign_in')}
              </Link>
              <Link href="/auth/register" className="inline-flex justify-center px-4 py-2 border border-slate-200 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors">
                {tUp('register')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Signed in but no display name or seller type yet: ask before the upload wizard.
  if (!hasName || !hasSellerType) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={saveSellerDetails} className="space-y-6">
              {!hasName && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-xl font-semibold text-slate-900">{t('artist_name_title')}</h1>
                    <p className="text-sm text-slate-600 leading-relaxed">{t('artist_name_desc')}</p>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">{t('artist_name_label')}</span>
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder={t('artist_name_placeholder')}
                      maxLength={80}
                      autoFocus
                      autoComplete="name"
                      className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    />
                  </label>
                  {nameError && <p className="text-sm text-red-600">{nameError}</p>}
                </div>
              )}
              {!hasSellerType && (
                <SellerTypeFields values={sellerForm} onChange={setSellerForm} error={sellerError} />
              )}
              <button
                type="submit"
                disabled={nameSaving || (!hasName && nameInput.trim().length < 2)}
                className="w-full px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {nameSaving ? t('artist_name_saving') : t('artist_name_save')}
              </button>
              <p className="text-xs text-slate-400">{t('artist_name_hint')}</p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          {t('new_artwork_title')}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8 space-y-8">
          {/* Step indicator */}
          <StepIndicator currentStep={currentStep} />

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Step content */}
          <div>
            {currentStep === 1 && (
              <Step1Images
                images={artworkSlots.map((s) => ({ url: s.url, isMain: false, sortOrder: s.sortOrder }))}
                onChange={handleStep1ImagesChange}
                onNext={handleStep1Next}
              />
            )}

            {currentStep === 2 && (
              <Step2BulkDetails
                slots={artworkSlots}
                onBack={() => setCurrentStep(1)}
                onNext={handleStep2Next}
                defaultShipping={sharedShipping || undefined}
              />
            )}

            {currentStep === 3 && (
              <Step3Collections
                onBack={() => setCurrentStep(2)}
                onSubmit={handleStep3Submit}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress indicator text */}
      <div className="text-center text-sm text-slate-500">
        Steg {currentStep} av 3
      </div>
    </div>
  );
}
