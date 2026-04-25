'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNavPreference } from '@/context/NavPreferenceContext';
import { BottomNav } from '@/components/BottomNav';
import { AppNav } from '@/components/AppNav';

const NO_NAV = ['/login', '/onboarding'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { navMode } = useNavPreference();

  const hideNav = NO_NAV.some(p => pathname.startsWith(p));
  const loggedIn = !!user?.onboarded;
  const isSide = loggedIn && !hideNav && navMode === 'side';

  return (
    <>
      <div
        className={loggedIn && !hideNav ? 'app-nav-transition' : undefined}
        style={{
          paddingBottom: hideNav || isSide ? 0 : 'calc(4.25rem + env(safe-area-inset-bottom))',
          marginRight: isSide ? '220px' : 0,
        }}
      >
        {children}
      </div>
      {!hideNav && (loggedIn ? <AppNav /> : <BottomNav />)}
    </>
  );
}
