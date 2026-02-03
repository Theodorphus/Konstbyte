import { NextResponse } from 'next/server';
import openai from '../../../../lib/openai';

// POST /api/ai/inspiration
// Accepts JSON { prompt?: string } and returns creative painting ideas
export async function POST(request: Request) {
  try {
    if (!openai) {
      return NextResponse.json({ 
        error: 'OpenAI API-nyckel saknas. Lägg till OPENAI_API_KEY i .env' 
      }, { status: 503 });
    }

    const body = await request.json();
    const userPrompt = body?.prompt ?? 'Generera kreativa idéer för målning';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Du är en kreativ konstassistent som ger korta, inspirerande prompts.' },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 300
    });

    const text = completion.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ inspiration: text });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
