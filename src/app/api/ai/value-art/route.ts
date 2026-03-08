import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Could not fetch image");
  const arrayBuffer = await response.arrayBuffer();
  const ext = imageUrl.split('.').pop()?.toLowerCase() || "";
  let mimeType = "image/jpeg";
  if (ext === "png") mimeType = "image/png";
  if (ext === "webp") mimeType = "image/webp";
  return { base64: Buffer.from(arrayBuffer).toString("base64"), mimeType };
}

// POST /api/ai/value-art
export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI-tjänsten är inte konfigurerad." }, { status: 503 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Du måste vara inloggad för att värdera konstverk." }, { status: 401 });
    }

    const lastValuation = await prisma.artValuationLog.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (lastValuation && (new Date().getTime() - new Date(lastValuation.createdAt).getTime() < 1000 * 60 * 60 * 24)) {
      return NextResponse.json({ error: "Du kan bara värdera ett konstverk per dag. Försök igen imorgon." }, { status: 429 });
    }

    const body = await request.json();
    const { imageUrl, artist, artType, style, sizeMaterial, provenance, other } = body;
    if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

    let base64: string;
    let mimeType: string;
    try {
      ({ base64, mimeType } = await fetchImageAsBase64(imageUrl));
    } catch {
      return NextResponse.json({ error: "Det gick inte att hämta eller läsa bilduppladdningen." }, { status: 400 });
    }

    const infoText = `
- Konstnär: ${artist || "Okänd"}
- Typ av konstverk: ${artType || "Ej angivet"}
- Stil/teknik: ${style || "Ej angivet"}
- Storlek/material: ${sizeMaterial || "Ej angivet"}
- Historik/proveniens: ${provenance || "Ej angivet"}
- Övrigt: ${other || "Ingen ytterligare info"}
    `;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Du är en erfaren konstvärderare. Värdera konstverket på bifogad bild och utgå även från informationen:\n${infoText}\nSvara på svenska och ge gärna en motivering och ett uppskattat prisintervall.` },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const completion = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: completion?.error?.message ?? "AI-anrop misslyckades." }, { status: res.status });
    }

    await prisma.artValuationLog.create({ data: { userId: user.id } });

    const valuation = completion.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ valuation });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
