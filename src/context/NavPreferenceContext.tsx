'use client';
import { createContext, useContext, useState, useEffect } from 'react';

type NavMode = 'bottom' | 'side';

interface NavPreferenceContextType {
  navMode: NavMode;
  toggle: () => void;
}

const NavPreferenceContext = createContext<NavPreferenceContextType>({
  navMode: 'bottom',
  toggle: () => {},
});

export function NavPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [navMode, setNavMode] = useState<NavMode>('bottom');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('u2f-nav-mode') as NavMode | null;
    if (saved === 'bottom' || saved === 'side') setNavMode(saved);

    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggle = () => {
    setNavMode(prev => {
      const next = prev === 'bottom' ? 'side' : 'bottom';
      localStorage.setItem('u2f-nav-mode', next);
      return next;
    });
  };

  return (
    <NavPreferenceContext.Provider value={{ navMode: isMobile ? 'bottom' : navMode, toggle }}>
      {children}
    </NavPreferenceContext.Provider>
  );
}

export const useNavPreference = () => useContext(NavPreferenceContext);
