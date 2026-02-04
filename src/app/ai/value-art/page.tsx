'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

export default function ValueArtPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageUrl.trim()) {
      setError('Ange en bild-URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch('/api/ai/value-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setError('AI-tjänsten är inte konfigurerad. OpenAI API-nyckel saknas.');
        } else {
          setError(data.error || 'Ett fel inträffade vid värdering');
        }
      } else {
        setResult(data.valuation || 'Ingen värdering kunde genereras.');
      }
    } catch (error) {
      console.error(error);
      setError('Nätverksfel. Kontrollera din anslutning.');
    } finally {
      setLoading(false);
    }
  }

  const exampleImages = [
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200',
    'https://images.unsplash.com/photo-1582201957119-cb3fce6c8f30?w=200',
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=200'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/ai" className="text-sm text-slate-600 hover:text-slate-900">
          ← Tillbaka till AI-verktyg
        </Link>
        <h1 className="text-2xl font-semibold mt-2">AI-värdering av konstverk</h1>
        <p className="text-slate-600 mt-1">Få en uppskattad värdering av ditt konstverk med hjälp av AI</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bild-URL</label>
              <Input
                type="url"
                placeholder="https://exempel.com/bild.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
              />
            </div>

            {imageUrl && (
              <div>
                <p className="text-xs text-slate-600 mb-2">Förhandsvisning:</p>
                <div className="w-full h-48 relative rounded border overflow-hidden">
                  <Image src={imageUrl} alt="Preview" fill className="object-contain" />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Värderar konstverk...
                </span>
              ) : (
                'Värdera konstverk'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!result && !loading && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exempel på konstverk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {exampleImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImageUrl(img)}
                    className="aspect-square rounded bg-slate-100 overflow-hidden hover:ring-2 ring-slate-300 transition relative"
                  >
                    <Image src={img} alt={`Exempel ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips för bättre värdering</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>✓ Använd en tydlig bild i bra ljus</p>
              <p>✓ Visa hela verket utan reflexer eller skuggor</p>
              <p>✓ Inkludera information om storlek och teknik</p>
              <p>✓ Tänk på att AI-värderingen är en uppskattning</p>
            </CardContent>
          </Card>
        </>
      )}

      {result && (
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">Värderingsresultat</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {result}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
