'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils/cn';
import {
  LayoutDashboard,
  Calendar,
  Filter,
  Users,
  Megaphone,
  FileText,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Separator } from '@/shared/components/ui/separator';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/funnel', label: 'Funil', icon: Filter },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/webinars', label: 'Webinars', icon: Video },
  { href: '/calendar', label: 'Calendário', icon: Calendar },
  { href: '/campaigns', label: 'Campanhas', icon: Megaphone },
];

const secondaryNavItems = [
  { href: '/alerts', label: 'Alertas', icon: Bell, badge: true },
  { href: '/reports', label: 'Relatórios', icon: FileText },
];

const bottomNavItems = [
  { href: '/settings', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  userName: string;
  userRole: string;
  alertCount?: number;
}

function NavItem({
  item,
  isActive,
  collapsed,
  alertCount,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ size?: number }>; badge?: boolean };
  isActive: boolean;
  collapsed: boolean;
  alertCount?: number;
}) {
  const content = (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-[#E8792A]/15 text-[#E8792A]'
          : 'text-gray-300 hover:bg-white/10 hover:text-white',
        collapsed && 'justify-center px-2'
      )}
    >
      <item.icon size={20} />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && alertCount && alertCount > 0 ? (
            <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">
              {alertCount > 99 ? '99+' : alertCount}
            </Badge>
          ) : null}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.badge && alertCount && alertCount > 0 ? (
            <Badge variant="destructive" className="h-4 min-w-4 justify-center px-1 text-[10px]">
              {alertCount}
            </Badge>
          ) : null}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function SidebarContent({
  userName,
  userRole,
  collapsed,
  setCollapsed,
  alertCount,
  showCollapse = true,
}: SidebarProps & {
  collapsed: boolean;
  setCollapsed?: (v: boolean) => void;
  showCollapse?: boolean;
  alertCount?: number;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#1B2A4A]">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8792A] text-sm font-bold text-white">
              FL
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">FLFloripa</p>
              <p className="truncate text-[10px] text-gray-400">Performance</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8792A] text-sm font-bold text-white">
            FL
          </div>
        )}
        {showCollapse && setCollapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 px-2 py-4" role="navigation" aria-label="Menu principal">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
              collapsed={collapsed}
              alertCount={alertCount}
            />
          ))}

          <Separator className="my-2 bg-white/10" />

          {secondaryNavItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
              collapsed={collapsed}
              alertCount={alertCount}
            />
          ))}

          <Separator className="my-2 bg-white/10" />

          {bottomNavItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
              collapsed={collapsed}
              alertCount={alertCount}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* User Card */}
      <div className="border-t border-white/10 p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#E8792A]/20 text-xs font-medium text-[#E8792A]">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-gray-400">{userRole}</p>
            </div>
          )}
          {!collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                  aria-label="Sair"
                >
                  <LogOut size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ userName, userRole, alertCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden h-screen flex-col transition-all duration-200 lg:flex',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent
          userName={userName}
          userRole={userRole}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          alertCount={alertCount}
        />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-4 top-3.5 z-40 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-[#1B2A4A] border-[#2A3F6A]">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <SidebarContent
              userName={userName}
              userRole={userRole}
              collapsed={false}
              showCollapse={false}
              alertCount={alertCount}
            />
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
