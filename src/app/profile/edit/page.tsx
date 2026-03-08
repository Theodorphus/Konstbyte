"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UploadButton } from '@uploadthing/react';
import type { UploadRouter } from '../../../lib/uploadthing';
import Image from 'next/image';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setName(data.name || '');
        setImageUrl(data.image || null);
      } else if (response.status === 401) {
        router.push('/auth/signin');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUploaded = async (url: string) => {
    setImageUrl(url);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      });
    } catch (error) {
      console.error('Error saving profile image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: imageUrl }),
      });

      if (response.ok) {
        alert('Profil uppdaterad!');
        router.push('/profile');
      } else {
        alert('Misslyckades att uppdatera profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Ett fel inträffade');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Redigera profil</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-600">Laddar...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Redigera profil</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-600 mb-4">Du måste vara inloggad för att redigera din profil.</p>
            <Button asChild>
              <Link href="/auth/signin">Logga in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initial = (user.name || user.email || '?')[0].toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Redigera profil</h1>
        <Button variant="outline" asChild>
          <Link href="/profile">Tillbaka</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profilbild</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center relative">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Profilbild"
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-slate-500">{initial}</span>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full">
            <UploadButton<UploadRouter, 'profileImage'>
              endpoint="profileImage"
              content={{
                button() {
                  return <span>Välj bild</span>;
                },
                allowedContent({ isUploading }) {
                  if (isUploading) return 'Laddar upp...';
                  return 'PNG, JPG, max 4MB';
                },
              }}
              appearance={{
                button: '!bg-slate-800 hover:!bg-slate-700 !text-white !rounded-lg',
              }}
              onClientUploadComplete={(res) => {
                const url = res?.[0]?.url;
                if (url) handleImageUploaded(url);
              }}
              onUploadError={(error) => alert(error.message)}
            />
            {imageUrl && (
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-red-500 underline text-left"
                onClick={() => handleImageUploaded('')}
              >
                Ta bort profilbild
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profilinformation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-post</label>
              <Input
                value={user.email}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">
                E-postadressen kan inte ändras
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Namn</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ditt namn"
                maxLength={50}
              />
              <p className="text-xs text-slate-500">
                Detta namn visas på dina inlägg och konstverk
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Sparar...' : 'Spara ändringar'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/profile">Avbryt</Link>
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
            Radera ditt konto och all tillhörande data. Detta kan inte ångras.
          </p>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => alert('Kontoborttagning är inte implementerad ännu')}
          >
            Radera konto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
