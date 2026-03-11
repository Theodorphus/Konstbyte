import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";
import sharp from "sharp";

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

    // Fetch image and convert to base64 for Groq vision
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Kunde inte hämta bilden för analys." }, { status: 400 });
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    // Resize to max 1024px and convert to JPEG to keep payload small for Groq
    const resized = await sharp(Buffer.from(arrayBuffer))
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const base64 = resized.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

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
              { type: "image_url", image_url: { url: dataUrl } },
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
