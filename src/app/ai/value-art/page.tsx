"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import Link from "next/link";
import Image from "next/image";
import UploadImageButton from "../../../components/UploadImageButton";
import WallPreview from "../../../components/WallPreview";

// ─── Helper components ────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 leading-none">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function TipsBox({ tips }: { tips: string[] }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 border-l-4 border-l-amber-400 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-amber-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.354a15.055 15.055 0 0 1-4.5 0M8.25 11.25v-1.5a3.75 3.75 0 1 1 7.5 0v1.5"
          />
        </svg>
        <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
          Tips för bättre värdering
        </span>
      </div>
      <ul className="space-y-2">
        {tips.map((tip) => (
          <li key={tip} className="flex items-start gap-2 text-sm text-amber-900">
            <svg
              className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageUrl.trim()) {
      setError("Ange en bild-URL eller ladda upp en bild");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai/value-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, artist, artType, style, sizeMaterial, provenance, other }),
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
    } catch (err) {
      console.error(err);
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

  const tips = [
    "Använd en tydlig bild i bra ljus",
    "Visa hela verket utan reflexer eller skuggor",
    "Inkludera information om storlek och teknik",
    "Tänk på att AI-värderingen är en uppskattning",
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Back link */}
      <Link
        href="/ai"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        AI-verktyg
      </Link>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white space-y-2 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase text-amber-100">Konstbyte AI</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">AI-värdering av konstverk</h1>
        <p className="text-sm text-amber-100 leading-relaxed">
          Ladda upp eller länka till ett konstverk — och få en AI-baserad prisuppskattning på sekunder.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Image card ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm space-y-4">
          <SectionHeader
            icon={
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            }
            title="Konstverkets bild"
            subtitle="Ladda upp eller klistra in en länk"
          />

          {!imageUrl ? (
            /* Upload area */
            <div className="rounded-xl border-2 border-dashed border-amber-200 bg-stone-50 min-h-[220px] flex flex-col items-center justify-center gap-4 p-6 transition-colors hover:border-amber-300 hover:bg-amber-50/50">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div className="text-center space-y-1 w-full max-w-xs">
                <Input
                  type="url"
                  placeholder="https://exempel.com/bild.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-white border-amber-200 focus:border-amber-400 focus:ring-amber-100 rounded-xl h-10 text-sm placeholder:text-slate-300 text-center"
                />
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-stone-200" />
                  <span className="text-xs text-slate-400">eller ladda upp</span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>
                <UploadImageButton onUploaded={setImageUrl} />
              </div>
            </div>
          ) : (
            /* Image preview */
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm">
                <div className="relative w-full max-h-72 min-h-[180px]">
                  <Image
                    src={imageUrl}
                    alt="Förhandsvisning"
                    width={800}
                    height={600}
                    className="w-full h-full object-contain max-h-72"
                    style={{ display: "block" }}
                  />
                </div>
              </div>

              {/* Actions below image */}
              <div className="flex items-center gap-3">
                <WallPreview artworkUrl={imageUrl} artworkTitle="Ditt konstverk" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="flex-shrink-0 text-xs text-slate-400 hover:text-slate-700 underline underline-offset-2 transition-colors"
                >
                  Byt bild
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Details card ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm space-y-5">

          {/* Grundinfo */}
          <SectionHeader
            icon={
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            }
            title="Grundinfo"
            subtitle="Konstnär och typ av verk"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput label="Konstnärens namn" value={artist} onChange={setArtist} placeholder="Ex: Hilma af Klint" />
            <FieldInput label="Typ av konstverk" value={artType} onChange={setArtType} placeholder="Ex: Målning, skulptur, foto" />
          </div>

          <div className="border-t border-stone-200" />

          {/* Material & Teknik */}
          <SectionHeader
            icon={
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
            }
            title="Material & Teknik"
            subtitle="Stil, teknik, storlek och material"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput label="Stil eller teknik" value={style} onChange={setStyle} placeholder="Ex: Abstrakt, olja på duk" />
            <FieldInput label="Storlek och material" value={sizeMaterial} onChange={setSizeMaterial} placeholder="Ex: 50×70 cm, trä, brons" />
          </div>

          <div className="border-t border-stone-200" />

          {/* Historik */}
          <SectionHeader
            icon={
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            }
            title="Historik & Proveniens"
            subtitle="Utställningar, tidigare ägare, certifikat"
          />
          <FieldInput
            label="Proveniens"
            value={provenance}
            onChange={setProvenance}
            placeholder="Ex: Utställd på Moderna Museet 2018, köpt från konstnären direkt"
          />

          <div className="border-t border-stone-200" />

          {/* Övrigt */}
          <SectionHeader
            icon={
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            }
            title="Övrig information"
            subtitle="Annan relevant information"
          />
          <FieldInput
            label="Övrigt"
            value={other}
            onChange={setOther}
            placeholder="Ex: Signerad baksida, ram medföljer, konserverad 2020"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 active:bg-amber-700 transition-colors duration-150 disabled:opacity-50 shadow-sm shadow-amber-200"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 opacity-80" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Värderar konstverk…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Värdera konstverk
            </>
          )}
        </button>
      </form>

      {/* ── Example images + Tips ──────────────────────────────────────────── */}
      {!result && !loading && (
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">
              Prova ett exempelverk
            </p>
            <div className="grid grid-cols-3 gap-3">
              {exampleImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImageUrl(img)}
                  className="aspect-square rounded-xl overflow-hidden relative border-2 border-transparent hover:border-amber-400 transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <Image
                    src={img}
                    alt={`Exempelverk ${i + 1}`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/200x200?text=Bild+saknas";
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <TipsBox tips={tips} />
        </div>
      )}

      {/* ── Result ────────────────────────────────────────────────────────── */}
      {result && (
        <div
          ref={resultRef}
          className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 space-y-4 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Värderingsresultat</p>
                <p className="text-xs text-amber-600 mt-0.5">Genererad av Konstbyte AI</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setResult("");
                setImageUrl("");
              }}
              className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Ny värdering
            </Button>
          </div>

          <div className="h-px bg-amber-200" />

          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{result}</p>

          <p className="text-xs text-amber-700/60 pt-1 border-t border-amber-100">
            Värderingen är en AI-baserad uppskattning och ersätter inte en professionell bedömning.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Field input helper ───────────────────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white border-stone-200 rounded-lg h-10 text-sm placeholder:text-slate-300"
      />
    </div>
  );
}
