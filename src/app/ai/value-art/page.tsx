"use client";

import React, { useState } from "react";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import Link from "next/link";
import Image from "next/image";
import UploadImageButton from "../../../components/UploadImageButton";

export default function ValueArtPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [artist, setArtist] = useState("");
  const [artType, setArtType] = useState("");
  const [style, setStyle] = useState("");
  const [sizeMaterial, setSizeMaterial] = useState("");
  const [provenance, setProvenance] = useState("");
  const [other, setOther] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageUrl.trim()) {
      setError("Ange en bild-URL");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai/value-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          artist,
          artType,
          style,
          sizeMaterial,
          provenance,
          other,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          setError("AI-tjänsten är inte konfigurerad. OpenAI API-nyckel saknas.");
        } else {
          setError(data.error || "Ett fel inträffade vid värdering");
        }
      } else {
        setResult(data.valuation || "Ingen värdering kunde genereras.");
      }
    } catch (error) {
      console.error(error);
      setError("Nätverksfel. Kontrollera din anslutning.");
    } finally {
      setLoading(false);
    }
  }

  const exampleImages = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=400",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
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
              <label className="block text-sm font-medium mb-2">Din konstbild</label>
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://exempel.com/bild.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mb-1"
                />
                <div className="flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="mx-3 text-xs text-slate-400">eller</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>
                <UploadImageButton onUploaded={setImageUrl} />
              </div>
            </div>

            {imageUrl && (
              <div>
                <p className="text-xs text-slate-600 mb-2">Förhandsvisning:</p>
                <div className="w-full h-48 relative rounded border overflow-hidden">
                  <Image src={imageUrl} alt="Preview" fill className="object-contain" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 bg-slate-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm mb-1">Konstnärens namn</label>
                <Input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Ex: Hilma af Klint"/>
              </div>
              <div>
                <label className="block text-sm mb-1">Typ av konstverk</label>
                <Input value={artType} onChange={e => setArtType(e.target.value)} placeholder="Ex: Målning, skulptur, foto"/>
              </div>
              <div>
                <label className="block text-sm mb-1">Stil eller teknik</label>
                <Input value={style} onChange={e => setStyle(e.target.value)} placeholder="Ex: Abstrakt, olja på duk"/>
              </div>
              <div>
                <label className="block text-sm mb-1">Storlek och material</label>
                <Input value={sizeMaterial} onChange={e => setSizeMaterial(e.target.value)} placeholder="Ex: 50x70 cm, trä, brons"/>
              </div>
              <div>
                <label className="block text-sm mb-1">Historik / Proveniens</label>
                <Input value={provenance} onChange={e => setProvenance(e.target.value)} placeholder="Ex: Utställningar, tidigare ägare"/>
              </div>
              <div>
                <label className="block text-sm mb-1">Övrig information</label>
                <Input value={other} onChange={e => setOther(e.target.value)} placeholder="Annan info..."/>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Värderar konstverk...
                </span>
              ) : (
                "Värdera konstverk"
              )}
            </button>
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
                    type="button"
                    onClick={() => setImageUrl(img)}
                    className="aspect-square rounded bg-slate-100 overflow-hidden hover:ring-2 ring-slate-300 transition relative"
                  >
                    <Image
                      src={img}
                      alt={`Exempel ${i + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x200?text=Kunde+inte+ladda";
                      }}
                    />
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
          <CardContent className="text-sm whitespace-pre-wrap">{result}</CardContent>
        </Card>
      )}
    </div>
  );
}
