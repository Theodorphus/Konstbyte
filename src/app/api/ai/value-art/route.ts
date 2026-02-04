import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// POST /api/ai/value-art
// Accepts JSON { imageUrl: string } and returns a valuation object.
export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ 
        error: 'GROQ API-nyckel saknas. Lägg till GROQ_API_KEY i .env' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { imageUrl, medium, dimensions, year, condition, artist } = body as {
      imageUrl?: string;
      medium?: string;
      dimensions?: string;
      year?: string;
      condition?: string;
      artist?: string;
    };
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });

    // Call Groq to produce an estimated valuation.
    const prompt = [
      'Du är en professionell konstvärderare. Ge en kort och konkret värdering på svenska.',
      'Anta att bilden på URL:en går att se. Undvik att nämna begränsningar eller att du inte kan öppna länken.',
      'Svara med: Prisintervall (SEK), Kort motivering, och 3–5 faktorer som påverkar priset.',
      `Bild-URL: ${imageUrl}`,
      medium ? `Medium: ${medium}` : null,
      dimensions ? `Mått: ${dimensions}` : null,
      year ? `Årtal: ${year}` : null,
      condition ? `Skick: ${condition}` : null,
      artist ? `Konstnär: ${artist}` : null
    ].filter(Boolean).join('\n');
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const valuation = completion.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ valuation });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
