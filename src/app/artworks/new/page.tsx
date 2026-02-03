"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import UploadImageButton from '../../../components/UploadImageButton';

export default function NewArtworkPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('malningar');
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
      setError('Fyll i alla obligatoriska fält.');
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
          category
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Ett fel inträffade');
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      router.push(`/artworks/${result.id}`);
    } catch (err) {
      setError('Nätverksfel. Försök igen senare.');
      setIsLoading(false);
    }
  }

  if (!ownerId) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-slate-600">Du måste vara inloggad för att ladda upp konst.</p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/auth/signin">Logga in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/register">Skapa konto</Link>
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
          ← Tillbaka till marknadsplats
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lägg upp nytt konstverk</CardTitle>
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
                Titel *
              </label>
              <Input
                required
                placeholder="T.ex. 'Blå himmel'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Beskrivning
              </label>
              <textarea
                placeholder="Beskriv ditt verk, teknik, inspiration..."
                className="w-full p-2 border rounded text-sm"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pris (SEK) *
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
                Kategori
              </label>
              <select
                className="w-full p-2 border rounded text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="malningar">Målningar</option>
                <option value="skulpturer">Skulpturer</option>
                <option value="fotografi">Fotografi</option>
                <option value="digital">Digital konst</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Bild *
              </label>
              <UploadImageButton onUploaded={setImageUrl} />
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Förhandsvisning"
                    className="w-full max-h-64 object-cover rounded border"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sparar...' : 'Publicera konstverk'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Avbryt
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
