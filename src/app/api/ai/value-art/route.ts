import { NextResponse } from "next/server";
import openai from "../../../../lib/openai";
import prisma from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

// Ny funktion för att hämta och base64-konvertera en bild från URL
async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Could not fetch image");
  const arrayBuffer = await response.arrayBuffer();
  // För enkelhetens skull, gissa mime från filändelse eller force jpeg om osäkert
  const ext = imageUrl.split('.').pop()?.toLowerCase() || "";
  let mimeType = "image/jpeg";
  if (ext === "png") mimeType = "image/png";
  if (ext === "webp") mimeType = "image/webp";
  // (Justera ovan för fler format om så behövs)
  return {
    base64: Buffer.from(arrayBuffer).toString("base64"),
    mimeType,
  };
}

// POST /api/ai/value-art
// Accepts JSON with art info fields and returns a valuation object.
export async function POST(request: Request) {
  try {
    if (!openai) {
      return NextResponse.json({ 
        error: "OpenAI API-nyckel saknas. Lägg till OPENAI_API_KEY i .env",
      }, { status: 503 });
    }

    // AUTH: Bara inloggade användare tillåts
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Du måste vara inloggad för att värdera konstverk." }, { status: 401 });
    }

    // LIMIT: En värdering per dygn per användare
    const lastValuation = await prisma.artValuationLog.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (
      lastValuation &&
      (new Date().getTime() - new Date(lastValuation.createdAt).getTime() < 1000 * 60 * 60 * 24)
    ) {
      return NextResponse.json(
        { error: "Du kan bara värdera ett konstverk per dag. Försök igen imorgon." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      imageUrl,
      artist,
      artType,
      style,
      sizeMaterial,
      provenance,
      other,
    } = body;
    if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

    // Hämta och konvertera bild till Base64
    let visionImage;
    try {
      const { base64, mimeType } = await fetchImageAsBase64(imageUrl);
      visionImage = { type: "image_url" as const, image_url: { url: `data:${mimeType};base64,${base64}` } };
    } catch (e) {
      return NextResponse.json(
        { error: "Det gick inte att hämta eller läsa bilduppladdningen." },
        { status: 400 }
      );
    }
    // Kombinera inskickade fält till en tydlig prompt
    const infoText = `
- Konstnär: ${artist || "Okänd"}
- Typ av konstverk: ${artType || "Ej angivet"}
- Stil/teknik: ${style || "Ej angivet"}
- Storlek/material: ${sizeMaterial || "Ej angivet"}
- Historik/proveniens: ${provenance || "Ej angivet"}
- Övrigt: ${other || "Ingen ytterligare info"}
    `;

    // Gör anrop till gpt-4o (vision multimodal)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Du är en erfaren konstvärderare. Värdera konstverket på bifogad bild och utgå även från informationen:\n${infoText}\nSvara på svenska och ge gärna en motivering och ett uppskattat prisintervall.` },
            visionImage,
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    // LOG: att användaren gjorde en värdering
    await prisma.artValuationLog.create({
      data: {
        userId: user.id,
      },
    });

    const valuation = completion.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ valuation });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}



