// Root admin layout — wraps all /admin/* pages with auth guard and admin layout shell
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal — LegacyFX',
  robots: 'noindex, nofollow',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Auth guard and layout wrapper are applied per-page to allow login/register
  // to bypass the guard (they render their own auth-free shell)
  return <>{children}</>;
}
