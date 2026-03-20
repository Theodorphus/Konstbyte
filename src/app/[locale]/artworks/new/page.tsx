"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UploadImageButton from '@/components/UploadImageButton';
import SafeImage from '@/components/SafeImage';
import { SHIPPING_OPTIONS } from '@/lib/shipping';
import { useTranslations } from 'next-intl';

export default function NewArtworkPage() {
  const router = useRouter();
  const t = useTranslations('artworks');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('malningar');
  const [shippingType, setShippingType] = useState('overenskommes');
  const [shippingCost, setShippingCost] = useState('');
  const [shippingArea, setShippingArea] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => setOwnerId(data?.user?.id ?? null))
      .catch(() => setOwnerId(null));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageUrl || !ownerId || !title || !price) {
      setError(t('fill_required'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          imageUrl,
          ownerId,
          category,
          shippingType,
          shippingCost: shippingType === 'fixed' ? Number(shippingCost) : null,
          shippingArea: shippingType === 'pickup' ? shippingArea : null,
          shippingCarrier: shippingType === 'other' ? shippingCarrier : null,
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t('error_generic'));
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      router.push(`/artworks/${result.id}`);
    } catch (error) {
      console.error('Error creating artwork:', error);
      setError(t('network_error_upload'));
      setIsLoading(false);
    }
  }

  if (!ownerId) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-slate-600">{t('sign_in_to_upload')}</p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/auth/signin">{t('sign_in_btn')}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/register">{t('register_btn')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="mb-8">
        <Link href="/artworks" className="text-sm text-slate-600 hover:text-slate-900">
          {t('back_to_marketplace')}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('new_artwork_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('title_label')}
              </label>
              <Input
                required
                placeholder={t('title_placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('description')}
              </label>
              <textarea
                placeholder={t('description_placeholder')}
                className="w-full p-2 border rounded text-sm"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('price_label')}
              </label>
              <Input
                type="number"
                required
                placeholder="1000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('category')}
              </label>
              <select
                className="w-full p-2 border rounded text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="malningar">{t('paintings')}</option>
                <option value="skulpturer">{t('sculptures')}</option>
                <option value="fotografi">{t('photography')}</option>
                <option value="digital">{t('digital')}</option>
              </select>
            </div>

            {/* Shipping settings */}
            <div className="space-y-3 border border-stone-200 rounded-xl p-4 bg-stone-50">
              <p className="text-sm font-semibold text-slate-800">{t('shipping_settings')}</p>

              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">{t('shipping_options_label')}</label>
                <select
                  className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={shippingType}
                  onChange={(e) => setShippingType(e.target.value)}
                >
                  {SHIPPING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {shippingType === 'fixed' && (
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">{t('shipping_cost_label')}</label>
                  <Input
                    type="number"
                    placeholder={t('shipping_cost_placeholder')}
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    min="0"
                  />
                </div>
              )}

              {shippingType === 'pickup' && (
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">{t('pickup_area_label')}</label>
                  <Input
                    placeholder={t('pickup_area_placeholder')}
                    value={shippingArea}
                    onChange={(e) => setShippingArea(e.target.value)}
                  />
                </div>
              )}

              {shippingType === 'other' && (
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">{t('carrier_label')}</label>
                  <Input
                    placeholder={t('carrier_placeholder')}
                    value={shippingCarrier}
                    onChange={(e) => setShippingCarrier(e.target.value)}
                  />
                </div>
              )}

              {shippingType === 'overenskommes' && (
                <p className="text-xs text-stone-400">
                  {t('shipping_agreement')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('image_label')}
              </label>
              <UploadImageButton onUploaded={setImageUrl} />
              {imageUrl && (
                <div className="mt-2 relative w-full h-64">
                  <SafeImage src={imageUrl} alt={t('preview')} fill className="object-cover rounded border" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-slate-900 text-white hover:bg-slate-700 border border-slate-900 px-6 font-semibold shadow-sm"
              >
                {isLoading ? t('saving') : t('publish_artwork')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
