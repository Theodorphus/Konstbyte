import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendEmail } = vi.hoisted(() => ({ sendEmail: vi.fn(() => Promise.resolve()) }));
vi.mock('@/lib/email', () => ({ sendEmail }));

import { groqChat } from '@/lib/groq';

const fetchMock = vi.fn();

function reply(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: () => Promise.resolve(body) });
}
const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.GROQ_API_KEY = 'test';
  process.env.ADMIN_EMAILS = 'admin@example.com';
  delete process.env.GROQ_TEXT_MODEL;
  delete process.env.GROQ_VISION_MODEL;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe('groqChat', () => {
  it('uses a current text model and hides its reasoning', async () => {
    reply(200, { choices: [{ message: { content: 'Idéer' } }] });

    const result = await groqChat({ kind: 'text', tag: 't', maxTokens: 300, messages: [{ role: 'user', content: 'hej' }] });

    expect(result).toEqual({ ok: true, text: 'Idéer' });
    expect(sentBody()).toMatchObject({ model: 'openai/gpt-oss-120b', include_reasoning: false });
    expect(sentBody()).not.toHaveProperty('reasoning_format');
  });

  it('uses a vision model for images and strips any <think> block', async () => {
    reply(200, { choices: [{ message: { content: '<think>hmm</think>\nCirka 2 000 kr' } }] });

    const result = await groqChat({ kind: 'vision', tag: 't', maxTokens: 300, messages: [{ role: 'user', content: 'x' }] });

    expect(result).toEqual({ ok: true, text: 'Cirka 2 000 kr' });
    expect(sentBody()).toMatchObject({ model: 'qwen/qwen3.8-27b', reasoning_format: 'hidden' });
  });

  it('lets Vercel override the model', async () => {
    process.env.GROQ_TEXT_MODEL = 'some/new-model';
    reply(200, { choices: [{ message: { content: 'ok' } }] });

    await groqChat({ kind: 'text', tag: 't', maxTokens: 300, messages: [] });

    expect(sentBody().model).toBe('some/new-model');
    expect(sentBody()).not.toHaveProperty('include_reasoning');
  });

  it('emails the admins (once) when Groq has retired the model', async () => {
    reply(404, { error: { code: 'model_decommissioned', message: 'The model has been decommissioned' } });
    reply(404, { error: { code: 'model_decommissioned', message: 'The model has been decommissioned' } });

    expect(await groqChat({ kind: 'text', tag: 't', maxTokens: 1, messages: [] })).toEqual({ ok: false, status: 502 });
    await groqChat({ kind: 'text', tag: 't', maxTokens: 1, messages: [] });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com' }));
  });

  it('reports 503 without calling Groq when no API key is set', async () => {
    delete process.env.GROQ_API_KEY;
    expect(await groqChat({ kind: 'text', tag: 't', maxTokens: 1, messages: [] })).toEqual({ ok: false, status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
