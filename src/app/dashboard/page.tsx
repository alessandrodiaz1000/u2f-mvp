'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { MILAN_COURSES, getMurBySlug, uniSlug, resolveUniversity } from '@/lib/data';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { U2FLogo } from '@/components/U2FLogo';

const TIPO_STYLE: Record<string, { text: string; bg: string; border: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
};

const STEP_IDS = ['explore', 'save', 'compare', 'connect', 'deadline', 'apply'] as const;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const ta = t.app;

  if (!user?.onboarded) { router.replace('/login'); return null; }

  const favoriteCourses = MILAN_COURSES.filter(c => user.favorites.includes(c.id));
  const firstName = user.name.split(' ')[0];

  const JOURNEY_STEPS = ta.dashboard.journeySteps.map((s, i) => ({
    ...s,
    id: STEP_IDS[i],
    done: i === 0,
  }));

  const completedSteps = JOURNEY_STEPS.filter(s => s.done || (s.id === 'save' && favoriteCourses.length > 0)).length;
  const progress = Math.round((completedSteps / JOURNEY_STEPS.length) * 100);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <U2FLogo size={26} />
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <LanguageSwitcher />
          <Link href="/profilo" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)', padding: '0.25rem' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* ── Profile pill ── */}
      <section style={{ padding: '1.25rem 1.25rem 0' }}>
        <div style={{
          background: 'var(--surface)', borderRadius: '16px',
          border: '1px solid var(--border)', padding: '1.125rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          {/* Avatar */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '2px' }}>
              {user.name}
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {[...user.areas, user.diploma, user.city].filter(Boolean).map(tag => (
                <span key={tag} style={{
                  fontSize: '10px', color: 'var(--text-3)', fontWeight: 500,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '4px', padding: '0.1rem 0.375rem',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Your Journey ── */}
      <section style={{ padding: '1.5rem 1.25rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
            {ta.dashboard.journey}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
            {completedSteps}/{JOURNEY_STEPS.length} {ta.dashboard.steps}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '5px', background: 'var(--border)', borderRadius: '3px',
          marginBottom: '1.5rem', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'var(--accent)', borderRadius: '3px',
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {JOURNEY_STEPS.map((s, i) => {
            const isDone = s.done || (s.id === 'save' && favoriteCourses.length > 0);
            const isNext = !isDone && JOURNEY_STEPS.slice(0, i).every(prev =>
              prev.done || (prev.id === 'save' && favoriteCourses.length > 0)
            );
            return (
              <div key={s.id} style={{ display: 'flex', gap: '0.875rem', paddingBottom: '1.25rem', position: 'relative' }}>
                {/* Connector line */}
                {i < JOURNEY_STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute', left: '16px', top: '34px',
                    width: '2px', height: 'calc(100% - 10px)',
                    background: isDone ? 'var(--accent)' : 'var(--border)',
                    transition: 'background 0.3s',
                  }} />
                )}
                {/* Step circle */}
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone ? 'var(--accent)' : isNext ? 'var(--accent-bg)' : 'var(--surface)',
                  border: `2px solid ${isDone ? 'var(--accent)' : isNext ? 'var(--accent)' : 'var(--border)'}`,
                  fontSize: isDone ? '14px' : '14px',
                  zIndex: 1,
                  transition: 'all 0.3s',
                }}>
                  {isDone
                    ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <span style={{ fontSize: '14px' }}>{s.icon}</span>
                  }
                </div>
                {/* Step content */}
                <div style={{ flex: 1, paddingTop: '0.375rem' }}>
                  <div style={{
                    fontSize: '14px', fontWeight: isDone ? 500 : isNext ? 600 : 400,
                    color: isDone ? 'var(--text-3)' : isNext ? 'var(--text-1)' : 'var(--text-2)',
                    marginBottom: '2px', letterSpacing: '-0.01em',
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}>
                    {s.label}
                  </div>
                  {isNext && (
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.45 }}>
                      {s.sub}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Corsi Salvati (preview) ── */}
      <section style={{ padding: '0.5rem 1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
            {ta.dashboard.savedCourses}
          </h2>
          <Link href="/preferiti" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
            {ta.dashboard.seeAll}
          </Link>
        </div>

        {favoriteCourses.length === 0 ? (
          <div style={{
            background: 'var(--surface)', borderRadius: '16px',
            border: '1.5px dashed var(--border)', padding: '2rem 1.25rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔖</div>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '1rem', lineHeight: 1.5 }}>
              {ta.dashboard.noSaved}
            </p>
            <Link href="/scopri">
              <button style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '0.625rem 1.25rem',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                {ta.dashboard.startExploring}
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {favoriteCourses.slice(0, 3).map(c => {
              const ts = TIPO_STYLE[c.tipo] ?? TIPO_STYLE.Triennale;
              const mur = resolveUniversity(c.universita);
              const slug = mur ? uniSlug(mur.name) : null;
              return (
                <div key={c.id} style={{
                  background: 'var(--surface)', borderRadius: '12px',
                  border: '1px solid var(--border)', padding: '0.875rem 1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.35, flex: 1 }}>{c.nome}</span>
                    <span style={{ fontSize: '10px', padding: '0.15rem 0.45rem', borderRadius: '5px', flexShrink: 0, fontWeight: 500, background: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}>
                      {c.tipo}
                    </span>
                  </div>
                  {slug ? (
                    <Link href={`/universita/${slug}`} style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                      {c.universita.length > 45 ? c.universita.slice(0, 43) + '…' : c.universita}
                    </Link>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.universita}</span>
                  )}
                </div>
              );
            })}
            {favoriteCourses.length > 3 && (
              <Link href="/preferiti" style={{ textAlign: 'center', fontSize: '13px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none', padding: '0.5rem' }}>
                {ta.dashboard.moreSaved(favoriteCourses.length - 3)}
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── Quick actions ── */}
      <section style={{ padding: '0 1.25rem 2rem', display: 'flex', gap: '0.75rem' }}>
        <Link href="/scopri" style={{ flex: 1, textDecoration: 'none' }}>
          <div style={{
            background: 'var(--accent)', borderRadius: '14px',
            padding: '1.125rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>❤️</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{ta.dashboard.quickActions.scopri}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{ta.dashboard.quickActions.scopriSub}</div>
          </div>
        </Link>
        <Link href="/persone" style={{ flex: 1, textDecoration: 'none' }}>
          <div style={{
            background: 'var(--surface)', borderRadius: '14px',
            border: '1px solid var(--border)', padding: '1.125rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>💬</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{ta.dashboard.quickActions.persone}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{ta.dashboard.quickActions.personeSub}</div>
          </div>
        </Link>
        <Link href="/orientamento" style={{ flex: 1, textDecoration: 'none' }}>
          <div style={{
            background: 'var(--surface)', borderRadius: '14px',
            border: '1px solid var(--border)', padding: '1.125rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>🧭</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{ta.dashboard.quickActions.test}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{ta.dashboard.quickActions.testSub}</div>
          </div>
        </Link>
      </section>
    </div>
  );
}
