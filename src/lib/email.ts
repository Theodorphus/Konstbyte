type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM || 'Konstbyte <no-reply@konstbyte.se>';

  if (!apiKey) {
    console.warn('sendEmail: RESEND_API_KEY missing, skipping email to', to);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('sendEmail failed:', res.status, text);
  }
}

export function buyerConfirmationEmail(opts: {
  orderId: string;
  artworkTitle: string;
  imageUrl: string;
  artistName: string;
  amountSek: number;
  appUrl: string;
}) {
  const { orderId, artworkTitle, imageUrl, artistName, amountSek, appUrl } = opts;
  return {
    subject: `Orderbekräftelse – ${artworkTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <h2 style="margin-bottom:4px">Tack för ditt köp! 🎉</h2>
        <p style="color:#64748b;margin-top:0">Order #${orderId.slice(0, 8)}</p>

        <img src="${imageUrl}" alt="${artworkTitle}"
          style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin:16px 0" />

        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#64748b">Konstverk</td><td style="padding:6px 0;font-weight:600">${artworkTitle}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Konstnär</td><td style="padding:6px 0">${artistName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Pris</td><td style="padding:6px 0;font-weight:700">${amountSek.toLocaleString('sv-SE')} kr</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Frakt</td><td style="padding:6px 0">49 kr (Sverige)</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Leverans</td><td style="padding:6px 0">3–5 arbetsdagar</td></tr>
        </table>

        <p style="margin-top:20px;font-size:14px;color:#475569">
          Konstnären packar och skickar ditt konstverk omsorgsfullt. Du får inget separat
          fraktkvitto — verket är på väg när konstnären bekräftar.
        </p>

        <a href="${appUrl}/orders/${orderId}"
          style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0f172a;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">
          Visa order
        </a>

        <p style="margin-top:32px;font-size:12px;color:#94a3b8">
          Konstbyte · 14 dagars ångerrätt enligt lag · Säker betalning via Stripe
        </p>
      </div>
    `,
  };
}

export function sellerNotificationEmail(opts: {
  orderId: string;
  artworkTitle: string;
  buyerName: string;
  amountSek: number;
  appUrl: string;
}) {
  const { orderId, artworkTitle, buyerName, amountSek, appUrl } = opts;
  return {
    subject: `Du har sålt "${artworkTitle}"! 🎨`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <h2 style="margin-bottom:4px">Grattis till försäljningen!</h2>
        <p style="color:#64748b;margin-top:0">Order #${orderId.slice(0, 8)}</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          <tr><td style="padding:6px 0;color:#64748b">Konstverk</td><td style="padding:6px 0;font-weight:600">${artworkTitle}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Köpare</td><td style="padding:6px 0">${buyerName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Belopp</td><td style="padding:6px 0;font-weight:700">${amountSek.toLocaleString('sv-SE')} kr</td></tr>
        </table>

        <p style="font-size:14px;color:#475569">
          Packa verket omsorgsfullt och skicka det till köparen så snart som möjligt.
        </p>
        <p style="font-size:14px;color:#475569;margin-top:12px;padding:12px;background:#f1f5f9;border-radius:6px">
          💰 <strong>Utbetalning:</strong> Konstbyte hanterar utbetalningen till dig via Swish eller banköverföring
          inom 3–5 arbetsdagar efter att köparen bekräftat mottagandet. Plattformens provision är 5%.
        </p>

        <a href="${appUrl}/orders/${orderId}"
          style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0f172a;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">
          Visa order
        </a>
      </div>
    `,
  };
}
