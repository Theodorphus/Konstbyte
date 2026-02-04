'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import Link from 'next/link';

export default function InspirationPage() {
  const [prompt, setPrompt] = useState('');
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
        body: JSON.stringify({ prompt: prompt || 'Generera kreativa idéer för målning' })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setError('AI-tjänsten är inte konfigurerad. OpenAI API-nyckel saknas.');
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
