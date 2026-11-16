import { redirect } from 'next/navigation';
import { isSetupDone } from '@/lib/auth';
import SetupForm from './SetupForm';

export const dynamic = 'force-dynamic';

export default function SetupPage() {
  if (isSetupDone()) redirect('/login');
  return <SetupForm />;
}
