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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buyerConfirmationEmail(opts: {
  orderId: string;
  artworkTitle: string;
  imageUrl: string;
  artistName: string;
  amountSek: number;
  shippingCost: number;
  appUrl: string;
}) {
  const { orderId, amountSek, shippingCost, appUrl } = opts;
  const artworkTitle = escapeHtml(opts.artworkTitle);
  const artistName = escapeHtml(opts.artistName);
  const imageUrl = escapeHtml(opts.imageUrl);
  return {
    subject: `Orderbekräftelse – ${opts.artworkTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <h2 style="margin-bottom:4px">Tack för ditt köp! 🎉</h2>
        <p style="color:#64748b;margin-top:0">Order #${orderId.slice(-8).toUpperCase()}</p>

        <img src="${imageUrl}" alt="${artworkTitle}"
          style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin:16px 0" />

        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#64748b">Konstverk</td><td style="padding:6px 0;font-weight:600">${artworkTitle}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Konstnär</td><td style="padding:6px 0">${artistName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Frakt</td><td style="padding:6px 0">${shippingCost > 0 ? `${Math.round(shippingCost).toLocaleString('sv-SE')} kr` : 'Ingår'}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Totalt betalt</td><td style="padding:6px 0;font-weight:700">${amountSek.toLocaleString('sv-SE')} kr</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Leverans</td><td style="padding:6px 0">3–5 arbetsdagar</td></tr>
        </table>

        <p style="margin-top:20px;font-size:14px;color:#475569">
          Konstnären packar och skickar ditt konstverk omsorgsfullt. Du får ett mejl med
          spårningsnummer när verket är skickat. När det har kommit fram, bekräfta mottagandet
          på ordersidan så får konstnären sin betalning.
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
  imageUrl?: string;
  buyerName: string;
  amountSek: number;
  sellerPayoutSek: number;
  /** False when the seller hasn't connected Stripe yet; the email then asks them to. */
  sellerStripeReady?: boolean;
  appUrl: string;
}) {
  const { orderId, appUrl } = opts;
  const title = escapeHtml(opts.artworkTitle);
  const buyerName = escapeHtml(opts.buyerName);
  const payout = Math.round(opts.sellerPayoutSek).toLocaleString('sv-SE');
  return {
    // Subject is plain text, so the raw title is fine here.
    subject: `Sålt! "${opts.artworkTitle}" har en köpare 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <h2 style="margin-bottom:4px">Grattis, ditt konstverk är sålt! 🎉</h2>
        <p style="color:#64748b;margin-top:0">Order #${orderId.slice(-8).toUpperCase()}</p>

        ${opts.imageUrl ? `<img src="${escapeHtml(opts.imageUrl)}" alt="${title}"
          style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin:16px 0" />` : ''}

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          <tr><td style="padding:6px 0;color:#64748b">Konstverk</td><td style="padding:6px 0;font-weight:600">${title}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Köpare</td><td style="padding:6px 0">${buyerName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Köparen betalade</td><td style="padding:6px 0">${opts.amountSek.toLocaleString('sv-SE')} kr</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Du får</td><td style="padding:6px 0"><strong>${payout} kr</strong> <span style="color:#64748b;font-size:12px">efter provision och Stripes avgift</span></td></tr>
        </table>

        <p style="font-size:14px;color:#475569;margin-top:12px;padding:12px;background:#fef3c7;border-radius:6px">
          📦 <strong>Nästa steg:</strong> packa verket omsorgsfullt och skicka det inom 1–2 arbetsdagar.
          Markera ordern som skickad och lägg in spårningsnumret, så får köparen besked.
        </p>
        <p style="font-size:14px;color:#475569;margin-top:12px;padding:12px;background:#f1f5f9;border-radius:6px">
          💰 <strong>Utbetalning:</strong> pengarna skickas till ditt Stripe-konto när köparen har bekräftat
          att verket har kommit fram, eller automatiskt 14 dagar efter att du skickat det.
        </p>
        ${opts.sellerStripeReady === false ? `
        <p style="font-size:14px;color:#475569;margin-top:12px;padding:12px;background:#eef2ff;border-radius:6px">
          💳 <strong>Koppla Stripe nu</strong> så att pengarna kan skickas till ditt bankkonto. Det tar
          ungefär 5–10 minuter och du behöver BankID.
          <a href="${appUrl}/seller/payouts" style="color:#4f46e5;font-weight:600">Koppla Stripe →</a>
        </p>` : ''}

        <a href="${appUrl}/seller/orders"
          style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0f172a;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">
          Gå till dina försäljningar
        </a>
      </div>
    `,
  };
}

export function shippedEmail(opts: {
  orderId: string;
  artworkTitle: string;
  sellerName: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  appUrl: string;
}) {
  const { orderId, appUrl } = opts;
  const artworkTitle = escapeHtml(opts.artworkTitle);
  const sellerName = escapeHtml(opts.sellerName);
  const trackingNumber = opts.trackingNumber ? escapeHtml(opts.trackingNumber) : null;
  const trackingUrl = opts.trackingUrl ? escapeHtml(opts.trackingUrl) : null;
  return {
    subject: `Ditt konstverk är på väg! 📦 — ${opts.artworkTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <h2 style="margin-bottom:4px">Ditt konstverk är skickat! 📦</h2>
        <p style="color:#64748b;margin-top:0">Order #${orderId.slice(-8).toUpperCase()}</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          <tr><td style="padding:6px 0;color:#64748b">Konstverk</td><td style="padding:6px 0;font-weight:600">${artworkTitle}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Konstnär</td><td style="padding:6px 0">${sellerName}</td></tr>
          ${trackingNumber ? `<tr><td style="padding:6px 0;color:#64748b">Spårningsnummer</td><td style="padding:6px 0;font-family:monospace;font-weight:600">${trackingNumber}</td></tr>` : ''}
        </table>

        ${trackingUrl ? `
        <a href="${trackingUrl}" style="display:inline-block;margin-bottom:16px;padding:10px 20px;background:#f59e0b;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
          Spåra ditt paket →
        </a>
        ` : ''}

        <a href="${appUrl}/orders/${orderId}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#0f172a;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">
          Visa order
        </a>

        <p style="margin-top:24px;font-size:12px;color:#94a3b8">
          När verket har kommit fram: bekräfta mottagandet på ordersidan. Har det skadats under frakten
          eller dröjer det? Kontakta oss på konstbyte@gmail.com innan du bekräftar.
        </p>
      </div>
    `,
  };
}

export function payoutWaitingEmail(opts: {
  artworkTitle: string;
  sellerPayoutSek: number;
  appUrl: string;
}) {
  const title = escapeHtml(opts.artworkTitle);
  const amount = Math.round(opts.sellerPayoutSek).toLocaleString('sv-SE');
  return {
    subject: `${amount} kr väntar på dig – koppla Stripe för att få dem`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <h2 style="margin-bottom:4px">Köparen har fått ditt konstverk 🎉</h2>
        <p style="font-size:14px;color:#475569">
          <strong>${title}</strong> har kommit fram. Du har <strong>${amount} kr</strong> som väntar på dig.
        </p>
        <p style="font-size:14px;color:#475569;margin-top:12px;padding:12px;background:#eef2ff;border-radius:6px">
          💳 <strong>Koppla Stripe för att få pengarna.</strong> Det tar ungefär 5–10 minuter och du behöver
          BankID och ditt kontonummer. När du är klar skickas pengarna automatiskt till ditt bankkonto.
        </p>
        <a href="${opts.appUrl}/seller/payouts"
          style="display:inline-block;margin-top:16px;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
          Koppla Stripe och få betalt
        </a>
      </div>
    `,
  };
}
