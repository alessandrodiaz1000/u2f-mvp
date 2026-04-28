'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { U2FLogo } from '@/components/U2FLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';
import { MILAN_UNIVERSITIES, MILAN_COURSES, DOCTORAL_ONLY, UNI_COURSE_COUNT } from '@/lib/data';

const MILAN_UNI_COUNT   = MILAN_UNIVERSITIES.filter(u => !DOCTORAL_ONLY.has(u.mur_code)).length;
const MILAN_COURSE_COUNT = MILAN_COURSES.length;

// ─── Fade-in on scroll hook ───────────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.55s ease, transform 0.55s ease' } };
}

function FadeSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { ref, style: fadeStyle } = useFadeIn();
  return <div ref={ref} style={{ ...fadeStyle, ...style }}>{children}</div>;
}

export default function HomePage() {
  const { t } = useLanguage();
  const heroLines = t.home.heroTitle.split('\n');

  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* ── Sticky top bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(237,232,220,0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
        padding: '0.875rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <U2FLogo size={30} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: 'var(--accent)',
            background: 'var(--accent-bg)', border: '1px solid rgba(27,94,82,0.2)',
            borderRadius: '20px', padding: '0.2rem 0.625rem',
          }}>
            {t.home.badge}
          </span>
          <LanguageSwitcher />
          <Link href="/login">
            <button style={{
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: '8px',
              padding: '0.4rem 0.875rem',
              fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', letterSpacing: '-0.01em',
            }}>
              Accedi
            </button>
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          1. HERO — full viewport, tagline + CTA
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: 'calc(100svh - 53px)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem 1.5rem 4rem',
        background: 'var(--bg)',
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <U2FLogo size={52} />
        </div>
        <h1 className="fade-up" style={{
          fontSize: 'clamp(2.25rem, 9vw, 3rem)',
          fontWeight: 700, letterSpacing: '-0.045em',
          lineHeight: 1.05, color: 'var(--text-1)',
          marginBottom: '1.25rem',
        }}>
          {heroLines[0]}<br />
          <span style={{ color: 'var(--accent)' }}>{heroLines[1]}</span>
        </h1>
        <p className="fade-up fade-up-d1" style={{
          fontSize: '1rem', color: 'var(--text-2)',
          lineHeight: 1.65, marginBottom: '2.5rem', maxWidth: '320px',
        }}>
          {t.home.heroSubtitle}
        </p>
        <div className="fade-up fade-up-d2" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/esplora">
            <button style={{
              width: '100%', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: '14px',
              padding: '1rem 1.5rem', fontSize: '16px', fontWeight: 600,
              cursor: 'pointer', letterSpacing: '-0.02em',
            }}>
              {t.home.ctaExplore} →
            </button>
          </Link>
          <Link href="/corsi">
            <button style={{
              width: '100%', background: 'transparent', color: 'var(--text-1)',
              border: '1.5px solid var(--border-2)', borderRadius: '14px',
              padding: '1rem 1.5rem', fontSize: '16px', fontWeight: 500,
              cursor: 'pointer', letterSpacing: '-0.02em',
            }}>
              {t.home.ctaCourses}
            </button>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
          opacity: 0.4,
        }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            scroll
          </span>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-3)" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. IL PROBLEMA — dati, numeri grossi, nessuna fioritura
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--text-1)',
        padding: '3.5rem 1.5rem',
      }}>
        <FadeSection>
          <span style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
            display: 'block', marginBottom: '2rem',
          }}>
            {t.home.problemLabel}
          </span>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 7vw, 2.5rem)', fontWeight: 700,
            letterSpacing: '-0.04em', lineHeight: 1.1,
            color: '#fff', marginBottom: '2.5rem',
          }}>
            {t.home.problemTitle}
          </h2>

          {/* Big stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '1.25rem' }}>
              <div style={{
                fontSize: 'clamp(3rem, 14vw, 4.5rem)', fontWeight: 700,
                letterSpacing: '-0.05em', lineHeight: 1, color: '#fff',
                marginBottom: '0.375rem',
              }}>
                63%
              </div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
                {t.home.stat63}
              </p>
            </div>
            <div style={{ borderLeft: '3px solid rgba(255,255,255,0.2)', paddingLeft: '1.25rem' }}>
              <div style={{
                fontSize: 'clamp(3rem, 14vw, 4.5rem)', fontWeight: 700,
                letterSpacing: '-0.05em', lineHeight: 1, color: 'rgba(255,255,255,0.6)',
                marginBottom: '0.375rem',
              }}>
                4/5
              </div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>
                {t.home.stat62}
              </p>
            </div>
          </div>

          <p style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.3)',
            fontStyle: 'italic', lineHeight: 1.5,
          }}>
            {t.home.surveyBadge}
          </p>
        </FadeSection>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. LA SOLUZIONE — cosa è U2F
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '3.5rem 1.5rem', background: 'var(--bg)' }}>
        <FadeSection>
          <span style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--accent)',
            display: 'block', marginBottom: '1.25rem',
          }}>
            {t.home.solutionLabel}
          </span>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 7vw, 2.5rem)', fontWeight: 700,
            letterSpacing: '-0.04em', lineHeight: 1.1,
            color: 'var(--text-1)', marginBottom: '1.25rem',
          }}>
            {t.home.solutionTitle}
          </h2>
          <p style={{
            fontSize: '1rem', color: 'var(--text-2)',
            lineHeight: 1.7, marginBottom: '2rem',
          }}>
            {t.home.solutionBody}
          </p>

        </FadeSection>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. LE TRE FASI — Rifletti / Esplora / Decidi
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '3.5rem 1.5rem' }}>
        <FadeSection>
          <span style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-3)',
            display: 'block', marginBottom: '1.25rem',
          }}>
            {t.home.howItWorksLabel}
          </span>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 700,
            letterSpacing: '-0.04em', color: 'var(--text-1)',
            marginBottom: '2.5rem', lineHeight: 1.15,
          }}>
            {t.home.howItWorksTitle}
          </h2>
        </FadeSection>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Phase 1 — Rifletti */}
          <FadeSection>
            <div style={{
              background: 'var(--bg)', borderRadius: '18px',
              border: '1px solid var(--border)', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.05em' }}>01</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                    {t.home.phase1Title}
                  </h3>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                {t.home.phase1Body}
              </p>
              <div style={{
                marginTop: '1rem', fontSize: '11px', fontWeight: 500,
                color: 'var(--text-3)', background: 'var(--surface)',
                borderRadius: '8px', padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                display: 'inline-block',
              }}>
                {t.home.phase1Chip}
              </div>
            </div>
          </FadeSection>

          {/* Phase 2 — Esplora (interactive preview) */}
          <FadeSection>
            <div style={{
              background: 'var(--accent)', borderRadius: '18px',
              padding: '1.5rem', overflow: 'hidden', position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.15)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.05em' }}>02</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                    {t.home.phase2Title}
                  </h3>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                {t.home.phase2Body}
              </p>

              {/* Mini university preview */}
              <div style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: '12px',
                padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                marginBottom: '1.25rem',
              }}>
                {MILAN_UNIVERSITIES.filter(u => !DOCTORAL_ONLY.has(u.mur_code)).slice(0, 3).map(u => (
                  <div key={u.mur_code} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.08)', borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                  }}>
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 500, flex: 1, marginRight: '0.5rem' }}>
                      {u.short_name || u.name.split(' ').slice(0, 3).join(' ')}
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}>
                      {UNI_COURSE_COUNT.get(u.mur_code) ?? 0} corsi
                    </span>
                  </div>
                ))}
                <div style={{ textAlign: 'center', paddingTop: '0.25rem' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    + {MILAN_UNI_COUNT - 3} altre università
                  </span>
                </div>
              </div>

              <Link href="/esplora">
                <button style={{
                  width: '100%', background: '#fff', color: 'var(--accent)',
                  border: 'none', borderRadius: '10px',
                  padding: '0.75rem', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', letterSpacing: '-0.01em',
                }}>
                  {t.home.phase2Cta}
                </button>
              </Link>
            </div>
          </FadeSection>

          {/* Phase 3 — Decidi */}
          <FadeSection>
            <div style={{
              background: 'var(--bg)', borderRadius: '18px',
              border: '1px solid var(--border)', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.05em' }}>03</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                    {t.home.phase3Title}
                  </h3>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                {t.home.phase3Body}
              </p>
              <div style={{
                marginTop: '1rem', fontSize: '11px', fontWeight: 500,
                color: 'var(--text-3)', background: 'var(--surface)',
                borderRadius: '8px', padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                display: 'inline-block',
              }}>
                {t.home.phase3Chip}
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. NUMERI — stats Milano
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '3.5rem 1.5rem', background: 'var(--bg)' }}>
        <FadeSection>
          <span style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-3)',
            display: 'block', marginBottom: '2rem',
          }}>
            {t.home.statsTitle}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <StatRow value={String(MILAN_UNI_COUNT)} label={t.home.statUni} sub={t.home.statUniSub} />
            <div style={{ height: '1px', background: 'var(--border)' }} />
            <StatRow value={String(MILAN_COURSE_COUNT)} label={t.home.statCourses} sub={t.home.statCoursesSub} />
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--text-1)',
        padding: '3.5rem 1.5rem 4rem',
      }}>
        <FadeSection>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 7vw, 2.5rem)', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#fff',
            lineHeight: 1.1, marginBottom: '1rem',
          }}>
            {t.home.ctaTitle}
          </h2>
          <p style={{
            fontSize: '0.9375rem', color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.65, marginBottom: '2rem',
          }}>
            {t.home.ctaSubtitle}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link href="/esplora">
              <button style={{
                width: '100%', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: '14px',
                padding: '1rem 1.5rem', fontSize: '16px', fontWeight: 600,
                cursor: 'pointer', letterSpacing: '-0.02em',
              }}>
                {t.home.ctaExplore} →
              </button>
            </Link>
            <Link href="/corsi">
              <button style={{
                width: '100%', background: 'transparent', color: 'rgba(255,255,255,0.6)',
                border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '14px',
                padding: '1rem 1.5rem', fontSize: '16px', fontWeight: 400,
                cursor: 'pointer', letterSpacing: '-0.02em',
              }}>
                {t.home.ctaCourses}
              </button>
            </Link>
          </div>
        </FadeSection>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: 'var(--text-1)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '1.25rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <U2FLogo size={22} color="rgba(255,255,255,0.3)" />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{t.home.footerTagline}</span>
      </footer>

    </div>
  );
}

function StatRow({ value, label, sub, accent }: {
  value: string; label: string; sub: string; accent?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
      <div style={{
        fontSize: 'clamp(2.5rem, 11vw, 3.5rem)', fontWeight: 700,
        letterSpacing: '-0.05em', lineHeight: 1,
        color: accent ? 'var(--accent)' : 'var(--text-1)',
      }}>
        {value}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{sub}</div>
      </div>
    </div>
  );
}
