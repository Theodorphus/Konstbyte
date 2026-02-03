import { NextResponse } from 'next/server';
import openai from '../../../../lib/openai';

// POST /api/ai/value-art
// Accepts JSON { imageUrl: string } and returns a valuation object.
export async function POST(request: Request) {
  try {
    if (!openai) {
      return NextResponse.json({ 
        error: 'OpenAI API-nyckel saknas. Lägg till OPENAI_API_KEY i .env' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { imageUrl } = body;
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });

    // Call OpenAI to produce an estimated valuation.
    const prompt = `Värdera konstverket vid följande URL: ${imageUrl} — ge prisintervall och motivering på svenska.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const valuation = completion.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ valuation });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
