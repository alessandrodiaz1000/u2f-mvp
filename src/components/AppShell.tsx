'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { AppNav } from '@/components/AppNav';

// Pages that don't show any nav
const NO_NAV = ['/login', '/onboarding'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const hideNav = NO_NAV.some(p => pathname.startsWith(p));
  const loggedIn = user?.onboarded;

  return (
    <>
      <div style={{ paddingBottom: hideNav ? 0 : 'calc(4.25rem + env(safe-area-inset-bottom))' }}>
        {children}
      </div>
      {!hideNav && (loggedIn ? <AppNav /> : <BottomNav />)}
    </>
  );
}
