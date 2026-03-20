"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Artwork {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string;
  category: string;
  isPublished: boolean;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function EditArtworkPage() {
  const router = useRouter();
  const params = useParams();
  const artworkId = params.id as string;
  const t = useTranslations('artworks');

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('malningar');
  const [isPublished, setIsPublished] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchArtwork();
  }, [artworkId]);

  const fetchArtwork = async () => {
    try {
      const response = await fetch(`/api/artworks/${artworkId}`);
      if (response.ok) {
        const data = await response.json();
        setArtwork(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setPrice(data.price.toString());
        setCategory(data.category);
        setIsPublished(data.isPublished);
      } else if (response.status === 404) {
        alert(t('artwork_not_found'));
        router.push('/artworks');
      }
    } catch (error) {
      console.error('Error fetching artwork:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !price) {
      alert(t('fill_required'));
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/artworks/${artworkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          price: parseInt(price),
          category,
          isPublished,
        }),
      });

      if (response.ok) {
        alert(t('artwork_updated'));
        router.push(`/artworks/${artworkId}`);
      } else if (response.status === 403) {
        alert(t('owner_only'));
      } else {
        alert(t('update_failed'));
      }
    } catch (error) {
      console.error('Error updating artwork:', error);
      alert(t('error_generic'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('delete_confirm_artwork'))) {
      return;
    }

    try {
      const response = await fetch(`/api/artworks/${artworkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert(t('artwork_deleted'));
        router.push('/profile');
      } else {
        const data = await response.json();
        alert(data.error || t('delete_failed'));
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert(t('error_generic'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">{t('edit_title')}</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-600">{t('saving')}…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">{t('edit_title')}</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-600 mb-4">{t('not_found_text')}</p>
            <Button asChild>
              <Link href="/artworks">{t('back_to_artworks')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('edit_title')}</h1>
        <Button variant="outline" asChild>
          <Link href={`/artworks/${artworkId}`}>{t('back')}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('artwork_info')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('title_label')}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('title_edit_placeholder')}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('description')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description_edit_placeholder')}
                className="w-full px-3 py-2 border rounded min-h-[100px] text-sm"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('price_label')}</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t('price_placeholder')}
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('category')}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="malningar">{t('paintings')}</option>
                <option value="skulpturer">{t('sculptures')}</option>
                <option value="fotografi">{t('photography')}</option>
                <option value="digital">{t('digital')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isPublished" className="text-sm">
                {t('published_label')}
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                {isSaving ? t('saving') : t('save_changes')}
              </button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/artworks/${artworkId}`}>{t('cancel')}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">{t('danger_zone')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            {t('delete_permanent')}
          </p>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            {t('delete_artwork')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
