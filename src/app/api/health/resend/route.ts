import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM;

  const base = {
    keyPresent: Boolean(apiKey),
    emailFromPresent: Boolean(emailFrom),
    resendReachable: false,
    resendOk: false,
    resendStatus: null as number | null,
    message: ''
  };

  if (!apiKey) {
    return NextResponse.json(
      {
        ...base,
        message: 'RESEND_API_KEY saknas i runtime.'
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json(
        {
          ...base,
          resendReachable: true,
          resendOk: false,
          resendStatus: response.status,
          message: `Resend svarade ${response.status}: ${details.slice(0, 250)}`
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ...base,
      resendReachable: true,
      resendOk: true,
      resendStatus: response.status,
      message: 'Resend API-nyckeln accepteras i denna runtime.'
    });
  } catch (error) {
    return NextResponse.json(
      {
        ...base,
        resendReachable: false,
        resendOk: false,
        resendStatus: null,
        message: error instanceof Error ? error.message : 'Okänt fel vid kontakt med Resend API.'
      },
      { status: 500 }
    );
  }
}
