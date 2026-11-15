export function isAdmin(email: string | null | undefined): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return email ? adminEmails.includes(email.trim().toLowerCase()) : false;
}
