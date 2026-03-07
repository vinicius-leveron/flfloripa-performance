import { auth } from '@/lib/auth';
import { ReportsClient } from './reports-client';

export default async function ReportsPage() {
  await auth();

  return <ReportsClient />;
}
