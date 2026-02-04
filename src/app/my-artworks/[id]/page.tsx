'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditArtworkPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetch(`/api/artworks/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setPrice(String((data.price ?? 0) / 100));
        setIsPublished(Boolean(data.isPublished));
      });
  }, [params.id]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetch(`/api/artworks/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        price: Math.round(Number(price) * 100),
        isPublished
      })
    });
    router.push('/my-artworks');
  }

  async function handleDelete() {
    await fetch(`/api/artworks/${params.id}`, { method: 'DELETE' });
    router.push('/my-artworks');
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Redigera konstverk</h1>
      <form onSubmit={handleSave} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full border rounded px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" value={price} onChange={(e) => setPrice(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          Publicerad
        </label>
        <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded">Spara</button>
        <button type="button" onClick={handleDelete} className="ml-2 text-red-600">Ta bort</button>
      </form>
    </div>
  );
}
