'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { MILAN_COURSES, resolveUniversity, uniSlug } from '@/lib/data';

const TIPO_STYLE: Record<string, { text: string; bg: string; border: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
};

export default function PreferitiPage() {
  const { user, removeFavorite } = useAuth();
  const { t } = useLanguage();
  const tp = t.app.preferiti;
  const router = useRouter();
  const [comparing, setComparing] = useState<Set<number>>(new Set());

  if (!user) { router.replace("/"); return null; }
  if (!user.onboarded) { router.replace("/onboarding"); return null; }

  const favoriteCourses = MILAN_COURSES.filter(c => user.favorites.includes(c.id));

  const toggleCompare = (id: number) => {
    setComparing(prev => {
      const s = new Set(prev);
      if (s.has(id)) { s.delete(id); return s; }
      if (s.size >= 3) return s;
      s.add(id);
      return s;
    });
  };

  const byUniversity = favoriteCourses.reduce<Record<string, typeof favoriteCourses>>((acc, c) => {
    const key = c.universita;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: comparing.size >= 2 ? '6rem' : 0 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{tp.title}</h1>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{favoriteCourses.length}</span> {favoriteCourses.length === 1 ? tp.course : tp.courses}
          </span>
        </div>
        <Link href="/scopri" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
          {tp.addMore}
        </Link>
      </header>

      {favoriteCourses.length === 0 ? (
        <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#CCC' }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.625rem', letterSpacing: '-0.03em' }}>
            {tp.noSavedTitle}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '2rem' }}>
            {tp.noSavedBody}
          </p>
          <Link href="/scopri">
            <button style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: '12px', padding: '0.875rem 2rem',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            }}>
              {tp.startExploring}
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Compare instruction */}
          <div style={{ padding: '0.875rem 1.25rem 0' }}>
            <div style={{
              background: 'var(--accent-bg)', borderRadius: '14px',
              border: '1px solid rgba(27,94,82,0.15)',
              padding: '0.875rem 1rem',
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '3px', letterSpacing: '-0.01em' }}>
                  Come confrontare i corsi
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.55 }}>
                  {tp.compareHint}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(byUniversity).map(([uniName, courses]) => {
              const mur = resolveUniversity(uniName);
              const slug = mur ? uniSlug(mur.name) : null;
              return (
                <div key={uniName}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                    {slug ? (
                      <Link href={`/universita/${slug}`} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', letterSpacing: '-0.02em', flex: 1, marginRight: '0.5rem' }}>
                        {uniName.length > 48 ? uniName.slice(0, 46) + '…' : uniName}
                      </Link>
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{uniName}</span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>{courses.length} {courses.length === 1 ? tp.course : tp.courses}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                    {courses.map(c => {
                      const ts = TIPO_STYLE[c.tipo] ?? TIPO_STYLE.Triennale;
                      const isSelected = comparing.has(c.id);
                      const isDisabled = !isSelected && comparing.size >= 3;
                      return (
                        <div key={c.id} style={{
                          background: isSelected ? 'var(--accent-bg)' : 'var(--surface)',
                          padding: '0.875rem 1rem',
                          display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                          borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                          transition: 'all 0.15s',
                        }}>
                          {/* Compare checkbox */}
                          <button
                            onClick={() => toggleCompare(c.id)}
                            disabled={isDisabled}
                            style={{
                              flexShrink: 0, width: '20px', height: '20px', borderRadius: '6px',
                              border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-2)'}`,
                              background: isSelected ? 'var(--accent)' : '#fff',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              marginTop: '2px', opacity: isDisabled ? 0.35 : 1,
                              transition: 'all 0.15s', flexDirection: 'column',
                            }}
                          >
                            {isSelected && (
                              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '10px', fontWeight: 500, padding: '0.15rem 0.45rem', borderRadius: '5px', flexShrink: 0, background: ts.bg, color: ts.text, border: `1px solid ${ts.border}`, marginTop: '1px' }}>
                                {c.tipo}
                              </span>
                              <Link href={`/corso/${c.id}`} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.35, textDecoration: 'none' }}>
                                {c.nome}
                              </Link>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                              {c.durata && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.durata} {tp.years}</span>}
                              {c.lingua && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.lingua}</span>}
                              {c.url && (
                                <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                                  {tp.site}
                                </a>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => removeFavorite(c.id)}
                            style={{
                              flexShrink: 0, background: 'none', border: 'none',
                              cursor: 'pointer', color: 'var(--text-3)',
                              padding: '0.25rem', fontSize: '16px', lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Floating compare button */}
      {comparing.size >= 2 && (
        <div style={{
          position: 'fixed', bottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
          left: '1.25rem', right: '1.25rem', zIndex: 60,
        }}>
          <Link href={`/confronta?ids=${Array.from(comparing).join(',')}`} style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', padding: '1rem',
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: '16px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(27,94,82,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              {tp.compareBtn(comparing.size)}
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
