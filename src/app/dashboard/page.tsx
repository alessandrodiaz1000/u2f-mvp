'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { MILAN_COURSES, resolveUniversity, uniSlug } from '@/lib/data';
import { scoreCourse } from '@/lib/scoring';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { U2FLogo } from '@/components/U2FLogo';
import type { Course } from '@/lib/data';
import type { UserProfile } from '@/context/AuthContext';

const TIPO_STYLE: Record<string, { text: string; bg: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF' },
};

const PRIVATE_KEYWORDS = ['Bocconi', 'Cattolica', 'San Raffaele', 'IULM'];

// 5 pentagon scores: [geo, costo, interessi, attitudine, accesso]
function computeCourseScores(course: Course, user: UserProfile): [number, number, number, number, number] {
  const geo = 100;

  const isPrivate = PRIVATE_KEYWORDS.some(k => course.universita.includes(k));
  const pref = user.uniPreference;
  const costo = pref === 'pubblica'
    ? (isPrivate ? 15 : 95)
    : pref === 'privata'
    ? (isPrivate ? 90 : 30)
    : (isPrivate ? 40 : 75);

  const areaRaw = user.areas.reduce((sum, a) => sum + ((course.areaScores ?? {})[a] ?? 0), 0);
  const areaMax = Math.max(user.areas.length * 10, 1);
  const interessi = Math.min(100, Math.round((areaRaw / areaMax) * 100));

  const { softScore } = scoreCourse(course, user);
  const attitudine = Math.min(100, Math.round((softScore / 50) * 100));

  const acc = (course.accesso ?? '').toLowerCase();
  const accesso = acc.includes('libero') ? 85 : acc.includes('locale') ? 40 : 55;

  return [geo, costo, interessi, attitudine, accesso];
}

function getMatchPct(course: Course, user: UserProfile): number {
  if (user.areas.length === 0) return 50;
  const areaRaw = user.areas.reduce((sum, a) => sum + ((course.areaScores ?? {})[a] ?? 0), 0);
  const areaMax = Math.max(user.areas.length * 10, 1);
  return Math.min(100, Math.round((areaRaw / areaMax) * 100));
}

function computeClarity(user: UserProfile): number {
  const exploration = Math.min(25, Math.round(Math.sqrt(Math.min(user.swipedIds.length, 30) / 30) * 25));

  const favCourses = MILAN_COURSES.filter(c => user.favorites.includes(c.id));
  let consistency = 0;
  if (favCourses.length > 0 && user.areas.length > 0) {
    const counts: Record<string, number> = {};
    for (const c of favCourses) {
      const topArea = user.areas.reduce((best, a) =>
        ((c.areaScores[a] ?? 0) > (c.areaScores[best] ?? -1)) ? a : best
      , user.areas[0]);
      counts[topArea] = (counts[topArea] ?? 0) + 1;
    }
    const maxCount = Math.max(...Object.values(counts), 0);
    consistency = Math.round((maxCount / favCourses.length) * 25);
  }

  const comparison = Math.min(25, Math.round(((user.comparisonsCount ?? 0) / 3) * 25));

  const filled = Object.keys(user.scores ?? {}).length;
  const depth = Math.round((filled / 10) * 25);

  return exploration + consistency + comparison + depth;
}

function computeDirection(user: UserProfile): { area: string; pct: number }[] {
  const favCourses = MILAN_COURSES.filter(c => user.favorites.includes(c.id));
  if (favCourses.length === 0 || user.areas.length === 0) return [];

  const totals: Record<string, number> = {};
  for (const a of user.areas) {
    totals[a] = favCourses.reduce((sum, c) => sum + ((c.areaScores[a] ?? 0)), 0);
  }
  const max = Math.max(...Object.values(totals), 1);
  return Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([area, score]) => ({ area, pct: Math.round((score / max) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);
}

function getNextStep(user: UserProfile): { icon: string; title: string; sub: string; href: string } {
  if (user.swipedIds.length === 0)
    return { icon: '❤️', title: 'Inizia a esplorare', sub: 'Scorri i corsi e salva quelli che ti interessano', href: '/scopri' };
  if (user.favorites.length < 2)
    return { icon: '🔖', title: 'Salva altri corsi', sub: 'Ti servono almeno 2 corsi salvati per confrontarli', href: '/scopri' };
  if ((user.comparisonsCount ?? 0) === 0)
    return { icon: '⚖️', title: 'Confronta i tuoi corsi', sub: 'Metti fianco a fianco i corsi salvati e chiedilo all\'AI', href: '/preferiti' };
  if (Object.keys(user.scores ?? {}).length === 0)
    return { icon: '🧭', title: 'Scopri chi sei', sub: 'Fai il test di orientamento per affinare il tuo profilo', href: '/orientamento' };
  return { icon: '📅', title: 'Segna le scadenze', sub: 'Controlla le date di ammissione che ti interessano', href: '/esplora' };
}

// ── Pentagon SVG ──────────────────────────────────────────────────────
// Internal coords: cx=55 cy=55, pentagon r=36, labels at r=50
// viewBox="-10 -10 130 130" gives room for labels on all sides
const PENTAGON_LABELS    = ['📍', '💰', '🎯', '🧠', '🚪'];
const PENTAGON_ANCHORS   = ['middle', 'start', 'start', 'end', 'end'] as const;
const PENTAGON_BASELINES = ['auto', 'middle', 'hanging', 'hanging', 'middle'] as const;

function PentagonChart({ scores }: { scores: [number, number, number, number, number] }) {
  const cx = 55; const cy = 55;
  const r = 36;  const labelR = 51;
  const minR = 6; // score=0 stays as a small pentagon, not a dot

  const pt = (i: number, len: number): [number, number] => {
    const a = (i * 72 - 90) * (Math.PI / 180);
    return [cx + len * Math.cos(a), cy + len * Math.sin(a)];
  };

  const ring = (pct: number) => Array.from({ length: 5 }, (_, i) => pt(i, minR + pct * (r - minR)));
  const bgPts    = ring(1);
  const scorePts = scores.map((s, i) => pt(i, minR + (s / 100) * (r - minR)));
  const labelPts = Array.from({ length: 5 }, (_, i) => pt(i, labelR));

  const path = (pts: [number, number][]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';

  return (
    <svg width="110" height="110" viewBox="-10 -10 130 130">
      {/* 1. Outer bg — first, so everything else renders on top */}
      <path d={path(bgPts)} fill="#F5F5F5" stroke="#C8C8C8" strokeWidth={0.75} />
      {/* 2. Concentric rings at 25 / 50 / 75% — dashed, visible on bg */}
      <path d={path(ring(0.25))} fill="none" stroke="#C0C0C0" strokeWidth={0.75} strokeDasharray="2 2" />
      <path d={path(ring(0.50))} fill="none" stroke="#B0B0B0" strokeWidth={0.75} strokeDasharray="2 2" />
      <path d={path(ring(0.75))} fill="none" stroke="#A0A0A0" strokeWidth={0.75} strokeDasharray="2 2" />
      {/* 3. Radial axis lines */}
      {bgPts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="#C0C0C0" strokeWidth={0.75} />
      ))}
      {/* 4. Score polygon — explicit hex, never CSS var inside SVG */}
      <path d={path(scorePts)} fill="rgba(27,94,82,0.22)" stroke="#1B5E52" strokeWidth={1.75} />
      {/* 5. Dots */}
      {scorePts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill="#1B5E52" />
      ))}
      {/* 6. Labels at each vertex */}
      {labelPts.map((p, i) => (
        <text
          key={i}
          x={p[0]} y={p[1]}
          textAnchor={PENTAGON_ANCHORS[i]}
          dominantBaseline={PENTAGON_BASELINES[i]}
          fontSize="12"
          fontFamily="system-ui, sans-serif"
        >
          {PENTAGON_LABELS[i]}
        </text>
      ))}
    </svg>
  );
}

// ── Clarity Score ring ────────────────────────────────────────────────
function ClarityRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? '#22c55e' : score >= 35 ? 'var(--accent)' : '#F59E0B';

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#EBEBEB" strokeWidth="7" />
      <circle
        cx="44" cy="44" r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
      />
      <text x="44" y="41" textAnchor="middle" fontSize="17" fontWeight="700" fill="#111" fontFamily="Inter,sans-serif">{score}</text>
      <text x="44" y="56" textAnchor="middle" fontSize="8"  fill="#AAA"  fontFamily="Inter,sans-serif">/100</text>
    </svg>
  );
}

// ── Profile fields config ─────────────────────────────────────────────
// To add a new field: add an entry here + add the field to UserProfile + migrate in AuthContext.
const PROFILE_FIELDS = [
  {
    key: 'uniPreference' as const,
    icon: '🏛',
    label: 'Preferenza università',
    options: [
      { value: 'pubblica',      label: 'Pubblica',      sub: 'Polimi, Statale, Bicocca…' },
      { value: 'privata',       label: 'Privata',       sub: 'Bocconi, Cattolica, IULM…' },
      { value: 'indifferente',  label: 'Indifferente',  sub: 'Valuto entrambe' },
    ],
  },
  {
    key: 'langPreference' as const,
    icon: '🌐',
    label: 'Lingua dei corsi',
    options: [
      { value: 'italiano',     label: 'Italiano',     sub: 'Preferisco corsi in italiano' },
      { value: 'inglese',      label: 'Inglese',      sub: 'Preferisco corsi in inglese' },
      { value: 'indifferente', label: 'Indifferente', sub: 'Entrambe vanno bene' },
    ],
  },
  {
    key: 'gradeAvg' as const,
    icon: '📊',
    label: 'Media 3ª–4ª liceo',
    options: [
      { value: 'lt7',   label: '< 7',    sub: 'Approssimativa' },
      { value: '7to8',  label: '7 – 8',  sub: 'Approssimativa' },
      { value: '8to9',  label: '8 – 9',  sub: 'Approssimativa' },
      { value: '9to10', label: '9 – 10', sub: 'Approssimativa' },
    ],
  },
] as const;

type ProfileFieldKey = typeof PROFILE_FIELDS[number]['key'];

const GRADE_LABELS: Record<string, string> = { lt7: '< 7', '7to8': '7–8', '8to9': '8–9', '9to10': '9–10' };

// ── Main Page ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [openField, setOpenField] = useState<ProfileFieldKey | null>(null);

  if (!user?.onboarded) { router.replace('/login'); return null; }

  const firstName    = user.name.split(' ')[0];
  const favCourses   = MILAN_COURSES.filter(c => user.favorites.includes(c.id));
  const clarityScore = computeClarity(user);
  const direction    = computeDirection(user);
  const nextStep     = getNextStep(user);

  const clarityLabel =
    clarityScore >= 70 ? 'Ottima chiarezza!' :
    clarityScore >= 35 ? 'Buon inizio' :
    'Stai iniziando';

  return (
    <div style={{ background: '#F5F5F5', minHeight: '100svh', paddingBottom: '2.5rem' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#fff', borderBottom: '1px solid #EBEBEB',
        padding: '0.875rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <U2FLogo size={26} />
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <LanguageSwitcher />
          <Link href="/profilo" style={{ display: 'flex', alignItems: 'center', color: '#AAA', padding: '0.25rem' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* ── Clarity Score card ── */}
      <section style={{ padding: '1rem 1.25rem 0' }}>
        <div style={{
          background: '#fff', borderRadius: '20px', border: '1px solid #EBEBEB',
          padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '1.25rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <ClarityRing score={clarityScore} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', color: '#BBB', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              CLARITY SCORE
            </p>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111', letterSpacing: '-0.03em', marginBottom: '0.25rem', lineHeight: 1.2 }}>
              {clarityLabel}
            </h2>
            <p style={{ fontSize: '12px', color: '#999', lineHeight: 1.5 }}>
              Ciao {firstName} — esplora, salva e confronta per aumentarlo.
            </p>
          </div>
        </div>
      </section>

      {/* ── La tua direzione ── */}
      {direction.length > 0 && (
        <section style={{ padding: '0.875rem 1.25rem 0' }}>
          <div style={{
            background: '#fff', borderRadius: '20px', border: '1px solid #EBEBEB',
            padding: '1.25rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              La tua direzione
            </h2>
            {direction.map(({ area, pct }) => (
              <div key={area} style={{ marginBottom: '0.625rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', color: '#555', fontWeight: 500 }}>{area}</span>
                  <span style={{ fontSize: '10px', color: '#BBB', fontWeight: 500 }}>{pct}%</span>
                </div>
                <div style={{ height: '5px', background: '#F0F0F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: 'var(--accent)', borderRadius: '3px',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Corsi salvati carousel ── */}
      <section style={{ padding: '0.875rem 0 0' }}>
        <div style={{
          padding: '0 1.25rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '0.75rem',
        }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>
            Corsi salvati{favCourses.length > 0 && (
              <span style={{ color: '#BBB', fontWeight: 400, marginLeft: '0.375rem' }}>
                ({favCourses.length})
              </span>
            )}
          </h2>
          {favCourses.length > 0 && (
            <Link href="/preferiti" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
              Vedi tutti →
            </Link>
          )}
        </div>

        {favCourses.length === 0 ? (
          <div style={{
            margin: '0 1.25rem', background: '#fff', borderRadius: '16px',
            border: '1.5px dashed #E5E5E5', padding: '2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔖</div>
            <p style={{ fontSize: '13px', color: '#AAA', marginBottom: '1rem' }}>Nessun corso salvato ancora.</p>
            <Link href="/scopri">
              <button style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '0.625rem 1.25rem',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                Inizia a scoprire →
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Scrollable cards */}
            <div style={{
              display: 'flex', gap: '0.75rem',
              paddingLeft: '1.25rem', paddingRight: '1.25rem',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties}>
              {favCourses.slice(0, 8).map(c => {
                const scores   = computeCourseScores(c, user);
                const matchPct = getMatchPct(c, user);
                const ts       = TIPO_STYLE[c.tipo] ?? TIPO_STYLE.Triennale;
                const mur      = resolveUniversity(c.universita);
                const slug     = mur ? uniSlug(mur.name) : null;

                return (
                  <div key={c.id} style={{
                    flexShrink: 0, width: '175px',
                    background: '#fff', borderRadius: '16px',
                    border: '1px solid #EBEBEB',
                    padding: '0.875rem',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '9px', fontWeight: 600,
                        padding: '0.1rem 0.4rem', borderRadius: '20px',
                        background: ts.bg, color: ts.text,
                      }}>
                        {c.tipo}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                        {matchPct}%
                      </span>
                    </div>

                    {/* Course name */}
                    <div style={{
                      fontSize: '11px', fontWeight: 600, color: '#111',
                      lineHeight: 1.3, minHeight: '2.4em',
                      display: '-webkit-box', WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    } as React.CSSProperties}>
                      {c.nome}
                    </div>

                    {/* Pentagon */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <PentagonChart scores={scores} />
                    </div>

                    {/* University link */}
                    {slug && (
                      <Link href={`/universita/${slug}`} style={{
                        fontSize: '10px', color: 'var(--accent)',
                        textDecoration: 'none', fontWeight: 500,
                        whiteSpace: 'nowrap', overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        🏛 {mur?.short_name?.slice(0, 18) ?? c.universita.slice(0, 18)}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

          </>
        )}
      </section>

      {/* ── Prossimo step ── */}
      <section style={{ padding: '0.875rem 1.25rem 0' }}>
        <Link href={nextStep.href} style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--accent)', borderRadius: '20px',
            padding: '1.25rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
            boxShadow: '0 4px 20px rgba(27,94,82,0.25)',
          }}>
            <div style={{ fontSize: '1.875rem', flexShrink: 0 }}>{nextStep.icon}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' }}>
                PROSSIMO STEP
              </p>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: '2px' }}>
                {nextStep.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                {nextStep.sub}
              </p>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px', flexShrink: 0 }}>→</div>
          </div>
        </Link>
      </section>

      {/* ── Completa il profilo ── */}
      <section style={{ padding: '0.875rem 1.25rem 0' }}>
        <div style={{
          background: '#fff', borderRadius: '20px', border: '1px solid #EBEBEB',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          {/* Header */}
          <div style={{ padding: '1.125rem 1.25rem 0.875rem', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>Completa il profilo</h2>
              <p style={{ fontSize: '11px', color: '#BBB', marginTop: '1px' }}>
                {[user.uniPreference, user.langPreference, user.gradeAvg].filter(Boolean).length} / {PROFILE_FIELDS.length} compilati
              </p>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {PROFILE_FIELDS.map(f => (
                <div key={f.key} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: user[f.key] ? '#1B5E52' : '#E5E5E5',
                }} />
              ))}
            </div>
          </div>

          {/* Fields */}
          {PROFILE_FIELDS.map((field, fi) => {
            const currentVal = user[field.key];
            const isOpen = openField === field.key;
            const displayLabel = field.key === 'gradeAvg'
              ? (currentVal ? GRADE_LABELS[currentVal] ?? currentVal : null)
              : field.options.find(o => o.value === currentVal)?.label ?? null;

            return (
              <div key={field.key} style={{ borderBottom: fi < PROFILE_FIELDS.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                {/* Row */}
                <button
                  onClick={() => setOpenField(isOpen ? null : field.key)}
                  style={{
                    width: '100%', padding: '0.875rem 1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{field.icon}</span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#333' }}>{field.label}</span>
                  {displayLabel ? (
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '0.2rem 0.625rem',
                      borderRadius: '20px', background: '#E4F0ED', color: '#1B5E52',
                    }}>
                      {displayLabel}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#CCC' }}>Aggiungi</span>
                  )}
                  <span style={{ fontSize: '12px', color: '#CCC', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                </button>

                {/* Inline picker */}
                {isOpen && (
                  <div style={{ padding: '0 1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {field.options.map(opt => {
                      const selected = currentVal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            updateProfile({ [field.key]: opt.value } as Partial<typeof user>);
                            setOpenField(null);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.625rem 0.875rem', borderRadius: '12px',
                            border: `1.5px solid ${selected ? '#1B5E52' : '#EBEBEB'}`,
                            background: selected ? '#E4F0ED' : '#FAFAFA',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: selected ? '#1B5E52' : '#222' }}>{opt.label}</div>
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>{opt.sub}</div>
                          </div>
                          {selected && <span style={{ fontSize: '14px', color: '#1B5E52' }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Studenti come te ── */}
      <section style={{ padding: '0.875rem 1.25rem 0' }}>
        <div style={{
          background: '#fff', borderRadius: '20px', border: '1px solid #EBEBEB',
          padding: '1.25rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em', marginBottom: '0.875rem' }}>
            Studenti come te
          </h2>
          <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
            <p style={{ fontSize: '13px', color: '#BBB', lineHeight: 1.6 }}>
              Non ci sono ancora studenti del tuo tipo.
            </p>
            <p style={{ fontSize: '12px', color: '#999', lineHeight: 1.5, marginTop: '0.25rem' }}>
              Presto troverai qui chi ha scelto percorsi simili al tuo.
            </p>
          </div>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section style={{ padding: '0.875rem 1.25rem 0', display: 'flex', gap: '0.625rem' }}>
        {[
          { href: '/scopri',      icon: '❤️', label: 'Scopri' },
          { href: '/esplora',     icon: '🔍', label: 'Esplora' },
          { href: '/orientamento',icon: '🧭', label: 'Test' },
        ].map(({ href, icon, label }) => (
          <Link key={href} href={href} style={{ flex: 1, textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: '14px',
              border: '1px solid #EBEBEB', padding: '1rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.375rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{label}</div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
