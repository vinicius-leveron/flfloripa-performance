import { auth } from '@/lib/auth';
import { FormsClient } from './forms-client';

export default async function FormsPage() {
  await auth();

  return <FormsClient />;
}
