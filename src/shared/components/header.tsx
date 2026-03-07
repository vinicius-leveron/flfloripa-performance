'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/shared/components/ui/button';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  userName: string;
  userRole: string;
}

export function Header({ userName, userRole }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500">{userRole}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: '/login' })}
          title="Sair"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
