'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Bell, LogOut, Settings, User, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

interface HeaderProps {
  userName: string;
  userRole: string;
  alertCount?: number;
}

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/funnel': 'Funil',
  '/leads': 'Leads',
  '/calendar': 'Calendário',
  '/campaigns': 'Campanhas',
  '/reports': 'Relatórios',
  '/alerts': 'Alertas',
  '/settings': 'Configurações',
  '/settings/channels': 'Canais',
  '/settings/alerts': 'Alertas',
};

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs: { label: string; href: string }[] = [];
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: currentPath });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-gray-300" />}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Header({ userName, userRole, alertCount = 0 }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* Left: Breadcrumbs (with space for mobile hamburger) */}
      <div className="pl-12 lg:pl-0">
        <Breadcrumbs />
      </div>

      {/* Right: Notifications + User Menu */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Link href="/alerts">
          <Button variant="ghost" size="icon" className="relative" aria-label="Alertas">
            <Bell size={18} />
            {alertCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-4 min-w-4 justify-center px-1 text-[10px]"
              >
                {alertCount > 9 ? '9+' : alertCount}
              </Badge>
            )}
          </Button>
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center cursor-pointer">
                <User size={14} className="mr-2" /> Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/channels" className="flex items-center cursor-pointer">
                <Settings size={14} className="mr-2" /> Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut size={14} className="mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
