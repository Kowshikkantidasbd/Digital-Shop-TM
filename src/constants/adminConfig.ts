/**
 * Super Admin configuration
 * Allows configuring super admin emails via environment variables (VITE_ADMIN_EMAILS / ADMIN_EMAILS)
 * with the owner's email abhimanyudey952@gmail.com working by default.
 */
export const DEFAULT_SUPER_ADMIN_EMAILS: string[] = [
  'digitalshoptm.admin@gmail.com',
  'abhimanyudey952@gmail.com',
  'kowshikkantidas@gmail.com'
];

export const getSuperAdminEmails = (): string[] => {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const envEmails = metaEnv?.VITE_ADMIN_EMAILS
    ? String(metaEnv.VITE_ADMIN_EMAILS).split(',')
    : [];
  
  return Array.from(new Set([
    ...DEFAULT_SUPER_ADMIN_EMAILS,
    ...envEmails.map(e => e.trim().toLowerCase()).filter(Boolean)
  ]));
};

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return getSuperAdminEmails().includes(email.trim().toLowerCase());
};
