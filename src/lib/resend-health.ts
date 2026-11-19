// Is the Resend API key accepted in this runtime? Used by the admin panel and
// /api/health/resend. Never returns the key itself.
export type ResendHealth = {
  ok: boolean;
  status: number;
  keyPresent: boolean;
  emailFromPresent: boolean;
  message: string;
};

export async function checkResend(): Promise<ResendHealth> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const base = { keyPresent: Boolean(apiKey), emailFromPresent: Boolean(process.env.EMAIL_FROM) };

  if (!apiKey) return { ...base, ok: false, status: 400, message: 'RESEND_API_KEY saknas i runtime.' };

  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    if (!response.ok) {
      const details = await response.text();
      return { ...base, ok: false, status: response.status, message: `Resend svarade ${response.status}: ${details.slice(0, 250)}` };
    }
    if (!base.emailFromPresent) {
      return { ...base, ok: false, status: 200, message: 'Nyckeln fungerar, men EMAIL_FROM saknas.' };
    }
    return { ...base, ok: true, status: 200, message: 'Resend API-nyckeln accepteras i denna runtime.' };
  } catch (error) {
    return { ...base, ok: false, status: 500, message: error instanceof Error ? error.message : 'Okänt fel vid kontakt med Resend API.' };
  }
}
