"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { UploadButton } from '@uploadthing/react';
import type { UploadRouter } from '@/lib/uploadthing';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  instagram: string | null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const t = useTranslations('profile');
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: User) => {
        setUser(data);
        setName(data.name || '');
        setBio(data.bio || '');
        setInstagram(data.instagram || '');
        setImageUrl(data.image || null);
      })
      .catch(status => { if (status === 401) router.push('/auth/signin'); })
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleImageUploaded = async (url: string) => {
    setImageUrl(url);
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: url }),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: imageUrl, bio, instagram }),
      });
      if (res.ok) router.push('/profile');
      else alert(t('update_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-40 bg-white/80 rounded-2xl animate-pulse" />
        <div className="h-60 bg-white/80 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-slate-600">{t('sign_in_required')}</p>
            <Button asChild><Link href="/auth/signin">{t('sign_in_btn')}</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initial = (user.name || user.email || '?')[0].toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-slate-900">{t('edit_profile')}</h1>
        <Button variant="outline" asChild><Link href="/profile">{t('back')}</Link></Button>
      </div>

      {/* Profilbild */}
      <Card>
        <CardHeader><CardTitle>{t('profile_picture_title')}</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-rose-100 flex-shrink-0 flex items-center justify-center relative ring-4 ring-white shadow-md">
            {imageUrl ? (
              <Image src={imageUrl} alt={t('profile_picture_alt')} fill className="object-cover" />
            ) : (
              <span className="font-display text-3xl font-semibold text-stone-500">{initial}</span>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full">
            <UploadButton<UploadRouter, 'profileImage'>
              endpoint="profileImage"
              content={{
                button() { return <span>{t('choose_image')}</span>; },
                allowedContent({ isUploading }) { return isUploading ? t('uploading') : t('image_hint'); },
              }}
              appearance={{ button: '!bg-slate-800 hover:!bg-slate-700 !text-white !rounded-lg' }}
              onClientUploadComplete={(res) => { const url = res?.[0]?.url; if (url) handleImageUploaded(url); }}
              onUploadError={(error) => alert(error.message)}
            />
            {imageUrl && (
              <button type="button" className="text-xs text-slate-500 hover:text-red-500 underline text-left"
                onClick={() => handleImageUploaded('')}>
                {t('remove_picture')}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profilinformation */}
      <Card>
        <CardHeader><CardTitle>{t('profile_info_title')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('email_label')}</label>
              <Input value={user.email} disabled className="bg-slate-50 text-slate-400" />
              <p className="text-xs text-slate-400">{t('email_hint')}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('name_label')}</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('name_placeholder')} maxLength={50} />
              <p className="text-xs text-slate-400">{t('name_hint')}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('bio_label')}</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={t('bio_placeholder')}
                maxLength={280}
                rows={4}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-colors resize-none"
              />
              <p className="text-xs text-slate-400">{t('bio_chars', { count: bio.length })}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Instagram</label>
              <Input
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                placeholder="@yourusername"
                maxLength={100}
              />
              <p className="text-xs text-slate-400">Ditt Instagram-användarnamn (valfritt)</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t('saving') : t('save_changes')}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/profile">{t('cancel')}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardHeader><CardTitle className="text-red-600">{t('danger_zone_title')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">{t('delete_account_desc')}</p>
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => alert(t('delete_account_not_implemented'))}>
            {t('delete_account_title')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
