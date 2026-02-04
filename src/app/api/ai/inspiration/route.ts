import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// POST /api/ai/inspiration
// Accepts JSON { prompt?: string } and returns creative painting ideas
export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ 
        error: 'GROQ API-nyckel saknas. Lägg till GROQ_API_KEY i .env' 
      }, { status: 503 });
    }

    const body = await request.json();
    const {
      prompt,
      style,
      medium,
      theme,
      difficulty,
      imageUrl
    } = body as {
      prompt?: string;
      style?: string;
      medium?: string;
      theme?: string;
      difficulty?: string;
      imageUrl?: string;
    };

    const userPrompt = prompt ?? 'Generera kreativa idéer för målning';
    const context = [
      style ? `Stil: ${style}` : null,
      medium ? `Medium: ${medium}` : null,
      theme ? `Tema: ${theme}` : null,
      difficulty ? `Svårighetsgrad: ${difficulty}` : null
    ].filter(Boolean).join('\n');

    const completion = await groq.chat.completions.create({
      model: imageUrl ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Du är en kreativ konstassistent som ger korta, inspirerande prompts.' },
        imageUrl
          ? {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: [
                    'Analysera bilden och ge:',
                    '1) Förbättringar, 2) Stilförslag, 3) Färgpaletter, 4) Liknande idéer, 5) Känsla och komposition.',
                    'Svara kort i punktlista på svenska.',
                    context ? `Parametrar:\n${context}` : null,
                    `Användarens önskemål: ${userPrompt}`
                  ].filter(Boolean).join('\n')
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl }
                }
              ]
            }
          : {
              role: 'user',
              content: [
                'Skapa 5–7 konkreta och varierade konstidéer på svenska.',
                context ? `Parametrar:\n${context}` : null,
                `Användarens önskemål: ${userPrompt}`
              ].filter(Boolean).join('\n\n')
            }
      ],
      temperature: 0.9,
      max_tokens: 450
    });

    const text = completion.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ inspiration: text });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
