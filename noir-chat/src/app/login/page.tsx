import { redirect } from 'next/navigation';
import { isAuthenticated, isSetupDone } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (!isSetupDone()) redirect('/setup');
  if (await isAuthenticated()) redirect('/');
  return <LoginForm />;
}
