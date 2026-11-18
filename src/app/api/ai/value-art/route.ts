import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";
import sharp from "sharp";
import { isAllowedImageUrl } from "../../../../lib/image-url";
import { answerLanguage, groqChat } from "../../../../lib/groq";

// POST /api/ai/value-art
export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "AI-tjänsten är inte konfigurerad." }, { status: 503 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "login_required" }, { status: 401 });
    }

    const valuationsToday = await prisma.artValuationLog.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
        },
      },
    });
    if (valuationsToday >= 3) {
      return NextResponse.json({ error: "Du kan bara värdera 3 konstverk per dag. Försök igen imorgon." }, { status: 429 });
    }

    const body = await request.json();
    const { imageUrl, locale } = body;
    // Free text from the form, kept short so it can't crowd out the instructions.
    const field = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 500) : "");
    const [artist, artType, style, sizeMaterial, provenance, other] = [
      body.artist, body.artType, body.style, body.sizeMaterial, body.provenance, body.other,
    ].map(field);
    const language = answerLanguage(locale);
    if (!isAllowedImageUrl(imageUrl)) return NextResponse.json({ error: "Ladda upp bilden via formuläret." }, { status: 400 });

    // Fetch image and convert to base64 for Groq vision
    const imgRes = await fetch(imageUrl, { redirect: "error" });
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Kunde inte hämta bilden för analys." }, { status: 400 });
    }
    const contentLength = imgRes.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Bilden är för stor för analys (max 10 MB)." }, { status: 400 });
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Bilden är för stor för analys (max 10 MB)." }, { status: 400 });
    }
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

    const result = await groqChat({
      kind: "vision",
      tag: "ai/value-art",
      temperature: 0.4,
      maxTokens: 900,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Du är en erfaren konstvärderare. Bedöm konstverket på bilden och utgå även från informationen nedan.
${infoText}
Beskriv kort vad du ser (motiv, teknik, skick), ge ett uppskattat prisintervall i SEK för andrahandsmarknaden i Sverige och motivera det. Var tydlig med att det är en grov uppskattning utifrån en bild och inte en formell värdering. Svara på ${language}.`,
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });
    if (!result.ok) {
      return NextResponse.json({ error: "AI-anrop misslyckades." }, { status: result.status });
    }

    await prisma.artValuationLog.create({ data: { userId: user.id } });

    return NextResponse.json({ valuation: result.text });
  } catch (err) {
    console.error("[ai/value-art]", err);
    return NextResponse.json({ error: "Värderingen misslyckades." }, { status: 500 });
  }
}
