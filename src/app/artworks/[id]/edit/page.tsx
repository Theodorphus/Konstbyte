"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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
        alert('Konstverk hittades inte');
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
      alert('Titel och pris är obligatoriska');
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
        alert('Konstverk uppdaterat!');
        router.push(`/artworks/${artworkId}`);
      } else if (response.status === 403) {
        alert('Du kan bara redigera dina egna konstverk');
      } else {
        alert('Misslyckades att uppdatera konstverk');
      }
    } catch (error) {
      console.error('Error updating artwork:', error);
      alert('Ett fel inträffade');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Är du säker på att du vill ta bort detta konstverk? Detta kan inte ångras.')) {
      return;
    }

    try {
      const response = await fetch(`/api/artworks/${artworkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Konstverk raderat!');
        router.push('/profile');
      } else {
        const data = await response.json();
        alert(data.error || 'Misslyckades att radera konstverk');
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert('Ett fel inträffade');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Redigera konstverk</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-600">Laddar...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Redigera konstverk</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-600 mb-4">Konstverk hittades inte.</p>
            <Button asChild>
              <Link href="/artworks">Tillbaka till konstverk</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Redigera konstverk</h1>
        <Button variant="outline" asChild>
          <Link href={`/artworks/${artworkId}`}>Tillbaka</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Konstverksinformation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titel *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="T.ex. Solnedgång över havet"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Beskrivning</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv ditt konstverk..."
                className="w-full px-3 py-2 border rounded min-h-[100px] text-sm"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pris (SEK) *</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2000"
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="malningar">Målningar</option>
                <option value="skulpturer">Skulpturer</option>
                <option value="fotografi">Fotografi</option>
                <option value="digital">Digital konst</option>
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
                Publicerat (synligt för andra)
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Sparar...' : 'Spara ändringar'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/artworks/${artworkId}`}>Avbryt</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Farlig zon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Radera detta konstverk permanent. Detta kan inte ångras.
          </p>
          <Button 
            variant="outline" 
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            Radera konstverk
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
