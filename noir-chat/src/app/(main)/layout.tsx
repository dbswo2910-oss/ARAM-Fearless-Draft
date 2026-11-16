import { requirePageAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  await requirePageAuth();
  return <>{children}</>;
}
