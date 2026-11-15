/** Admin addresses from ADMIN_EMAILS (comma-separated) or ADMIN_EMAIL, lower-cased. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(email: string | null | undefined): boolean {
  return email ? adminEmails().includes(email.trim().toLowerCase()) : false;
}
