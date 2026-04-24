'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { U2FLogo } from '@/components/U2FLogo';

export default function OrientamentoPage() {
  const { t } = useLanguage();

  const FEATURE_ICONS = [
    <svg key="a" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>,
    <svg key="b" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>,
    <svg key="c" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>,
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <U2FLogo size={28} />
          <span style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--accent)',
          }}>
            {t.orientamento.badge}
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* ── Hero ── */}
      <section style={{ padding: '2.5rem 1.25rem 2rem' }}>
        <h1 className="fade-up" style={{
          fontSize: '1.875rem', fontWeight: 700,
          letterSpacing: '-0.04em', lineHeight: 1.1,
          color: 'var(--text-1)', marginBottom: '1rem',
        }}>
          {t.orientamento.title}
        </h1>
        <p className="fade-up fade-up-d1" style={{
          fontSize: '0.9375rem', color: 'var(--text-2)',
          lineHeight: 1.65, marginBottom: '2rem', maxWidth: '320px',
        }}>
          {t.orientamento.body}
        </p>
        <Link href="/" className="fade-up fade-up-d2">
          <button style={{
            background: 'transparent', color: 'var(--text-2)',
            border: '1px solid var(--border)', borderRadius: '10px',
            padding: '0.75rem 1.25rem', fontSize: '14px', fontWeight: 400,
            cursor: 'pointer', letterSpacing: '-0.01em',
          }}>
            {t.orientamento.backHome}
          </button>
        </Link>
      </section>

      {/* ── Upcoming features ── */}
      <section style={{ padding: '0 1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {t.orientamento.features.map((f, i) => (
          <div key={i} style={{
            background: 'var(--surface)', borderRadius: '14px',
            border: '1px solid var(--border)', padding: '1.125rem',
            display: 'flex', alignItems: 'flex-start', gap: '1rem',
            opacity: 1 - i * 0.15,
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--accent-bg)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {FEATURE_ICONS[i]}
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55 }}>{f.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Coming soon banner ── */}
      <section style={{ padding: '0 1.25rem 2rem' }}>
        <div style={{
          background: 'var(--accent)', borderRadius: '16px',
          padding: '1.5rem 1.25rem', textAlign: 'center',
        }}>
          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.75rem' }}>🔜</span>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
            {t.orientamento.body}
          </p>
        </div>
      </section>

    </div>
  );
}
