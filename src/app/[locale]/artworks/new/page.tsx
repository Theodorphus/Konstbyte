'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { StepIndicator } from '@/components/upload/StepIndicator';
import { Step1Images } from '@/components/upload/Step1Images';
import { Step2Details, type ArtworkDetailsFormValues } from '@/components/upload/Step2Details';
import { Step3Collections } from '@/components/upload/Step3Collections';
import { createArtworkWithImages, type UploadedImage } from '@/app/actions/artwork-actions';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

export default function NewArtworkPage() {
  const router = useRouter();
  const t = useTranslations('artworks');

  // Auth check
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [details, setDetails] = useState<ArtworkDetailsFormValues | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
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

  const handleStep1Next = () => {
    if (images.length === 0) {
      setError('Du måste ladda upp minst en bild');
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const handleStep2Next = (formData: ArtworkDetailsFormValues) => {
    setDetails(formData);
    setError(null);
    setCurrentStep(3);
  };

  const handleStep3Submit = async (collectionId: string | null) => {
    if (!details) {
      setError('Form data is missing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createArtworkWithImages({
        images,
        ...details,
        collectionId,
      });

      if (result.success && result.artworkId) {
        router.push(`/artworks/${result.artworkId}`);
      } else {
        throw new Error('Failed to create artwork');
      }
    } catch (err) {
      console.error('Error creating artwork:', err);
      setError(
        err instanceof Error ? err.message : 'Kunde inte skapa konstverket. Försök igen senare.'
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
            <p className="text-slate-600">Du måste vara inloggad för att ladda upp konst.</p>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/auth/signin" className="inline-flex justify-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                Logga in
              </Link>
              <Link href="/auth/register" className="inline-flex justify-center px-4 py-2 border border-slate-200 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors">
                Registrera dig
              </Link>
            </div>
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
                images={images}
                onChange={setImages}
                onNext={handleStep1Next}
              />
            )}

            {currentStep === 2 && details === null && (
              <Step2Details
                onBack={() => setCurrentStep(1)}
                onNext={handleStep2Next}
              />
            )}

            {currentStep === 2 && details !== null && (
              <Step2Details
                defaultValues={details}
                onBack={() => setCurrentStep(1)}
                onNext={handleStep2Next}
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
