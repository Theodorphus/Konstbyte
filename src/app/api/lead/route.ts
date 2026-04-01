import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Email transporter (using Gmail or your email service)
// Configure in .env: EMAIL_USER, EMAIL_PASSWORD
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendNotificationEmail(websiteUrl: string, email: string) {
  try {
    const subject = `🎯 Ny lead från hemsidor-sidan | ${email}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e293b; margin-top: 0;">Ny lead från hemsidor-tjänster</h2>

        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0;"><strong>Hemsida:</strong> ${websiteUrl}</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">Mottagen: ${new Date().toLocaleString('sv-SE')}</p>
        </div>

        <p style="color: #475569; line-height: 1.6;">
          En potentiell kund har begärt en gratis analys av sin hemsida.
        </p>

        <div style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin-top: 0; color: #1e40af; font-weight: 500;">💡 Nästa steg:</p>
          <ul style="margin: 10px 0; padding-left: 20px; color: #475569;">
            <li>Kontakta kunden på <strong>${email}</strong></li>
            <li>Presentera dig själv och dina tjänster</li>
            <li>Erbjud en tid för den gratis analysen</li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          Detta är ett automatiserat meddelande från hemsidor.konstbyte.se
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'konstbyte@gmail.com',
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't fail the request if email fails - the lead is still saved
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteUrl, email } = body;

    // Validate input
    if (!websiteUrl || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          website_url: websiteUrl,
          email: email,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      );
    }

    // Send notification email (non-blocking)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      sendNotificationEmail(websiteUrl, email).catch(err =>
        console.error('Failed to send notification email:', err)
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
