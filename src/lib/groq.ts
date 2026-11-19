import { adminEmails } from './admin';
import { sendEmail } from './email';
import { hitLimit, DAY } from './rate-limit';

// One place for the AI models, so a model Groq retires can be swapped without
// touching the tools. Override with GROQ_TEXT_MODEL / GROQ_VISION_MODEL in Vercel.
// (llama-3.3-70b-versatile and llama-4-scout were shut down in 2026, which broke
// every AI tool on the site.)
const DEFAULT_TEXT_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_VISION_MODEL = 'qwen/qwen3.8-27b';

type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
export type GroqMessage = { role: 'system' | 'user' | 'assistant'; content: string | ContentPart[] };

export type GroqResult = { ok: true; text: string } | { ok: false; status: number };

/** Reasoning models think before answering; only the final answer belongs on the page. */
function reasoningParams(model: string): Record<string, string | boolean> {
  if (model.startsWith('openai/gpt-oss')) return { include_reasoning: false, reasoning_effort: 'low' };
  if (model.startsWith('qwen/')) return { reasoning_format: 'hidden' };
  return {};
}

export function groqModel(kind: 'text' | 'vision') {
  return kind === 'vision'
    ? process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL
    : process.env.GROQ_TEXT_MODEL || DEFAULT_TEXT_MODEL;
}

export async function groqChat(opts: {
  kind: 'text' | 'vision';
  messages: GroqMessage[];
  maxTokens: number;
  temperature?: number;
  tag: string;
}): Promise<GroqResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { ok: false, status: 503 };

  const model = groqModel(opts.kind);
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      // Reasoning tokens count toward this, so leave room for them.
      max_completion_tokens: opts.maxTokens + 1000,
      ...reasoningParams(model),
    }),
  });
  const completion = await res.json().catch(() => null);

  if (!res.ok) {
    const message: string = completion?.error?.message ?? '';
    const code: string = completion?.error?.code ?? '';
    console.error(`[${opts.tag}] Groq error`, res.status, model, code, message);
    // A retired or unknown model breaks the tool for everyone: tell the admins (once a day).
    const modelProblem = res.status === 404 || /decommission|deprecat|model_not_found|does not exist/i.test(`${code} ${message}`);
    if (modelProblem && !hitLimit('groq-model-alert', 1, DAY)) {
      const html = `<p>AI-verktygen på Konstbyte fungerar inte: Groq svarar att modellen <strong>${model}</strong> inte finns längre.</p>
        <p>Välj en ny modell på <a href="https://console.groq.com/docs/models">console.groq.com/docs/models</a> och sätt den i Vercel som
        <code>${opts.kind === 'vision' ? 'GROQ_VISION_MODEL' : 'GROQ_TEXT_MODEL'}</code>${opts.kind === 'vision' ? ' (den måste kunna läsa bilder)' : ''}. Publicera sedan om sajten.</p>`;
      await Promise.allSettled(
        adminEmails().map((to) => sendEmail({ to, subject: 'AI-verktygen på Konstbyte har slutat fungera', html })),
      );
    }
    return { ok: false, status: 502 };
  }

  const raw: string = completion?.choices?.[0]?.message?.content ?? '';
  // Belt and braces: never show the model's thinking.
  const text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return { ok: true, text };
}

/** The language the answer should be written in, from the page's locale. */
export function answerLanguage(locale: unknown) {
  return locale === 'en' ? 'English' : 'svenska';
}
