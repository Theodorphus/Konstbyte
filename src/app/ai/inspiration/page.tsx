'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import UploadImageButton from '../../../components/UploadImageButton';

export default function InspirationPage() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [style, setStyle] = useState('');
  const [medium, setMedium] = useState('');
  const [theme, setTheme] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const examplePrompts = [
    'Abstrakt natur i kvällsljus',
    'Minimalistisk stadsvy i regn',
    'Porträtt med neonfärger',
    'Surrealistisk trädgård',
    'Geometriska former i varma toner',
    'Dynamisk rörelse och energi'
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch('/api/ai/inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || 'Generera kreativa idéer för målning',
          style,
          medium,
          theme,
          difficulty,
          imageUrl: imageUrl || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setError('AI-tjänsten är inte konfigurerad. GROQ API-nyckel saknas.');
        } else {
          setError(data.error || 'Ett fel inträffade');
        }
      } else {
        setResult(data.inspiration || 'Ingen inspiration kunde genereras.');
      }
    } catch (error) {
      console.error(error);
      setError('Nätverksfel. Kontrollera din anslutning.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/ai" className="text-sm text-slate-600 hover:text-slate-900">
          ← Tillbaka till AI-verktyg
        </Link>
        <h1 className="text-2xl font-semibold mt-2">AI-inspiration för konst</h1>
        <p className="text-slate-600 mt-1">Få kreativa idéer och förslag för ditt nästa konstverk</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Stil</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Valfri</option>
                  <option value="surrealism">Surrealism</option>
                  <option value="minimalism">Minimalism</option>
                  <option value="pop art">Pop art</option>
                  <option value="expressionism">Expressionism</option>
                  <option value="impressionism">Impressionism</option>
                  <option value="realism">Realism</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Medium</label>
                <select
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Valfri</option>
                  <option value="olja">Olja</option>
                  <option value="akryl">Akryl</option>
                  <option value="akvarell">Akvarell</option>
                  <option value="digital">Digitalt</option>
                  <option value="foto">Foto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tema</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Valfri</option>
                  <option value="natur">Natur</option>
                  <option value="kanslor">Känslor</option>
                  <option value="portratt">Porträtt</option>
                  <option value="abstrakt">Abstrakt</option>
                  <option value="stad">Stad</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Svårighetsgrad</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Valfri</option>
                  <option value="enkel">Enkel</option>
                  <option value="mellan">Mellan</option>
                  <option value="avancerad">Avancerad</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bild‑inspiration (valfritt)</label>
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <div className="mb-3 text-sm text-slate-600">Ladda upp en bild för mer träffsäkra idéer</div>
                <div className="flex justify-center">
                  <UploadImageButton onUploaded={(url) => setImageUrl(url)} />
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Bilden används för stil- och kompositionsanalys.
                </p>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">…eller klistra in bild‑URL</label>
                <Input
                  type="url"
                  placeholder="https://exempel.com/bild.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              {imageUrl && (
                <div className="mt-4">
                  <p className="text-xs text-slate-600 mb-2">Förhandsvisning:</p>
                  <div className="w-full h-48 relative rounded border overflow-hidden bg-white">
                    <Image src={imageUrl} alt="Preview" fill className="object-contain" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Beskriv din idé eller stil (valfritt)
              </label>
              <Input
                placeholder="Ex: Abstrakt natur i kvällsljus"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Lämna tomt för generella inspirationsidéer
              </p>
            </div>

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
                  Genererar inspiration...
                </span>
              ) : (
                'Skapa inspirationsidéer'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!result && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exempelprompter - Klicka för att använda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {examplePrompts.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  className="p-3 text-left text-sm border rounded hover:bg-slate-50 hover:border-slate-300 transition"
                >
                  {example}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="bg-slate-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Dina inspirationsidéer</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setResult('');
                  setPrompt('');
                }}
              >
                Ny sökning
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap space-y-4">
            {result}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
