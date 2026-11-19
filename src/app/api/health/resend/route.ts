import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { checkResend } from '@/lib/resend-health';

// Diagnostic for admins: is the Resend API key accepted in this runtime?
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const health = await checkResend();
  return NextResponse.json(health, { status: health.ok ? 200 : health.status === 200 ? 500 : health.status });
}
