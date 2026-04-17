import { auth } from '@/lib/auth';
import { WebinarDashboard } from './webinar-dashboard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WebinarDetailPage({ params }: PageProps) {
  await auth();
  const { id } = await params;

  return <WebinarDashboard webinarId={id} />;
}
