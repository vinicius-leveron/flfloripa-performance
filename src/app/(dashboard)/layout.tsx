import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/shared/components/sidebar';
import { Header } from '@/shared/components/header';
import { SessionProvider } from '@/shared/components/session-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { name, role } = session.user;

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar userName={name} userRole={role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header userName={name} userRole={role} />
          <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
