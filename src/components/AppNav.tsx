'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { U2FLogo } from '@/components/U2FLogo';
import { useNavPreference } from '@/context/NavPreferenceContext';

const ITEMS = [
  {
    href: '/dashboard',
    label: 'Percorso',
    icon: (a: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    href: '/scopri',
    label: 'Scopri',
    icon: (a: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    href: '/preferiti',
    label: 'Salvati',
    icon: (a: boolean) => (
      <svg width="22" height="22" fill={a ? '#1B5E52' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  {
    href: '/persone',
    label: 'Persone',
    icon: (a: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/esplora',
    label: 'Cerca',
    icon: (a: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
    ),
  },
];

function ToggleIcon({ side }: { side: boolean }) {
  return side ? (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ) : (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3v18" />
    </svg>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const { navMode, toggle } = useNavPreference();
  const isSide = navMode === 'side';

  return (
    <>
      {/* Sidebar destra */}
      <nav style={{
        display: isSide ? 'flex' : 'none',
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '220px',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: '1.5rem 0.75rem',
        zIndex: 100,
        gap: '0.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0 0.5rem', marginBottom: '1.75rem' }}>
          <U2FLogo size={32} color="#1B5E52" />
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-1)', letterSpacing: '-0.02em' }}>U2F</span>
        </div>

        {ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '10px',
              color: active ? '#1B5E52' : 'var(--text-2)',
              background: active ? '#E4F0ED' : 'transparent',
              textDecoration: 'none',
              fontWeight: active ? 600 : 400,
              fontSize: '14px',
              transition: 'background 0.15s, color 0.15s',
            }}>
              {item.icon(active)}
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button onClick={toggle} title="Passa alla barra in basso" style={{
          marginTop: 'auto',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.6rem 0.75rem',
          borderRadius: '10px',
          color: 'var(--text-3)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          transition: 'color 0.15s',
          width: '100%',
        }}>
          <ToggleIcon side={isSide} />
          <span>Barra in basso</span>
        </button>
      </nav>

      {/* Bottom bar */}
      <nav style={{
        display: isSide ? 'none' : 'flex',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100,
      }}>
        {ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '2px', padding: '0.5rem 0',
              color: active ? 'var(--accent)' : 'var(--text-3)',
              textDecoration: 'none', transition: 'color 0.15s',
            }}>
              {item.icon(active)}
              <span style={{ fontSize: '9px', fontWeight: active ? 600 : 400, letterSpacing: '-0.01em' }}>
                {item.label}
              </span>
            </Link>
          );
        })}

        <button onClick={toggle} title="Passa alla sidebar" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '2px', padding: '0.5rem 0',
          color: 'var(--text-3)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}>
          <ToggleIcon side={isSide} />
          <span style={{ fontSize: '9px', letterSpacing: '-0.01em' }}>Layout</span>
        </button>
      </nav>
    </>
  );
}
