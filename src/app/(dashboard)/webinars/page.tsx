import { auth } from '@/lib/auth';
import { WebinarsClient } from './webinars-client';

export default async function WebinarsPage() {
  await auth();

  return <WebinarsClient />;
}
