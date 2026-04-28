'use client';
import type { ReactNode } from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { MILAN_COURSES, resolveUniversity, uniSlug } from '@/lib/data';
import { scoreCourse } from '@/lib/scoring';
import { getAdmissionInfo, formatDeadline } from '@/lib/admissions';
import type { Course } from '@/lib/data';
import type { UserProfile } from '@/context/AuthContext';

const TIPO_COLORS: Record<string, { text: string; bg: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF' },
};

const PRIVATE_KEYWORDS = ['Bocconi', 'Cattolica', 'San Raffaele', 'IULM'];

function computeScoreValues(course: Course, user: UserProfile): [number, number, number, number, number] {
  const { areaScore, softScore } = scoreCourse(course, user);
  const isPrivate = PRIVATE_KEYWORDS.some(k => course.universita.includes(k));
  const pref = user.uniPreference;
  const costo = pref === 'pubblica' ? (isPrivate ? 15 : 95)
    : pref === 'privata' ? (isPrivate ? 90 : 20)
    : (isPrivate ? 40 : 75);
  const areaMax = Math.max(user.areas.length * 10, 1);
  const interessi = Math.min(100, Math.round((areaScore / areaMax) * 100));
  const attitudine = Math.min(100, Math.round((softScore / 50) * 100));
  const acc = (course.accesso ?? '').toLowerCase();
  const accesso = acc.includes('libero') ? 85 : acc.includes('locale') ? 40 : 55;
  return [100, costo, interessi, attitudine, accesso];
}

function getMatchPct(course: Course, user: UserProfile): number {
  if (user.areas.length === 0) return 50;
  const { areaScore } = scoreCourse(course, user);
  return Math.min(100, Math.round((areaScore / Math.max(user.areas.length * 10, 1)) * 100));
}

function getSimilarCourses(course: Course, count = 10): Course[] {
  const keys = Object.keys(course.areaScores);
  const norm = Math.sqrt(keys.reduce((s, k) => s + (course.areaScores[k] ?? 0) ** 2, 0));
  if (norm === 0) return MILAN_COURSES.filter(c => c.id !== course.id && c.area === course.area).slice(0, count);
  return MILAN_COURSES
    .filter(c => c.id !== course.id)
    .map(c => {
      const dot = keys.reduce((s, k) => s + (course.areaScores[k] ?? 0) * (c.areaScores[k] ?? 0), 0);
      const cn = Math.sqrt(keys.reduce((s, k) => s + (c.areaScores[k] ?? 0) ** 2, 0));
      return { course: c, sim: cn ? dot / (norm * cn) : 0 };
    })
    .sort((a, b) => b.sim - a.sim)
    .slice(0, count)
    .map(({ course }) => course);
}

// Pentagon con etichette complete — per la sezione Matching principale
function PentagonFull({ values, size = 200 }: { values: number[]; size?: number }) {
  const cx = 100, cy = 100, r = 62;
  const angles = Array.from({ length: 5 }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5);
  const outline = angles.map(a => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }));
  const filled = values.map((v, i) => ({
    x: cx + r * (v / 100) * Math.cos(angles[i]),
    y: cy + r * (v / 100) * Math.sin(angles[i]),
  }));
  const outlinePts = outline.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const filledPts = filled.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const labelR = r + 22;
  const labels = ['Posizione', 'Costo', 'Interessi', 'Attitudine', 'Accesso'];
  return (
    <svg viewBox="0 0 200 200" width={size} height={size}>
      {[0.33, 0.66, 1].map((f, i) => (
        <polygon key={i}
          points={outline.map(p => `${(cx + (p.x - cx) * f).toFixed(1)},${(cy + (p.y - cy) * f).toFixed(1)}`).join(' ')}
          fill="none" stroke="#D4CEC2" strokeWidth="0.7"
        />
      ))}
      {outline.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#D4CEC2" strokeWidth="0.6" />
      ))}
      <polygon points={filledPts} fill="#1B5E52" fillOpacity="0.2" stroke="#1B5E52" strokeWidth="2" />
      {filled.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="#1B5E52" />
      ))}
      {angles.map((a, i) => {
        const lx = (cx + labelR * Math.cos(a)).toFixed(1);
        const ly = (cy + labelR * Math.sin(a)).toFixed(1);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fontWeight="600" fill="#1C2B26" fontFamily="Inter, sans-serif">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// Pentagon piccolo per le card corsi simili
function PentagonSmall({ values, size = 95 }: { values: number[]; size?: number }) {
  const cx = 50, cy = 50, r = 32;
  const angles = Array.from({ length: 5 }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5);
  const outline = angles.map(a => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }));
  const filled = values.map((v, i) => ({
    x: cx + r * (v / 100) * Math.cos(angles[i]),
    y: cy + r * (v / 100) * Math.sin(angles[i]),
  }));
  const outlinePts = outline.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const filledPts = filled.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const labelR = r + 10;
  const labels = ['Geo', 'Cos', 'Int', 'Att', 'Acc'];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {[0.33, 0.66, 1].map((f, i) => (
        <polygon key={i}
          points={outline.map(p => `${(cx + (p.x - cx) * f).toFixed(1)},${(cy + (p.y - cy) * f).toFixed(1)}`).join(' ')}
          fill="none" stroke="#D4CEC2" strokeWidth="0.6"
        />
      ))}
      {outline.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#D4CEC2" strokeWidth="0.5" />
      ))}
      <polygon points={filledPts} fill="#1B5E52" fillOpacity="0.18" stroke="#1B5E52" strokeWidth="1.5" />
      {filled.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5" fill="#1B5E52" />
      ))}
      {angles.map((a, i) => {
        const lx = (cx + labelR * Math.cos(a)).toFixed(1);
        const ly = (cy + labelR * Math.sin(a)).toFixed(1);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="6" fill="#8A9D95" fontFamily="Inter, sans-serif">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
      stroke="#B0A898" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  );
}

function Section({ label, title, children, comingSoon }: {
  label: string; title: string; children?: ReactNode; comingSoon?: boolean;
}) {
  return (
    <div style={{ borderTop: '1px solid #D4CEC2', paddingTop: '2rem', marginBottom: '2.5rem' }}>
      <div style={{
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#1B5E52', marginBottom: '0.4rem',
      }}>
        {label}
      </div>
      <h2 style={{
        fontSize: '1.375rem', fontWeight: 700, color: '#1C2B26',
        letterSpacing: '-0.035em', marginBottom: comingSoon ? '1.25rem' : '1.5rem',
        lineHeight: 1.2,
      }}>
        {title}
      </h2>
      {comingSoon ? (
        <div style={{
          background: '#F5F1E8', borderRadius: '12px', padding: '2rem 1.5rem',
          border: '1px solid #E4DDD0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
        }}>
          <HourglassIcon />
          <span style={{ fontSize: '13px', color: '#8A9D95', fontWeight: 500 }}>
            Disponibile prossimamente
          </span>
        </div>
      ) : children}
    </div>
  );
}

export default function CorsoPage() {
  const params = useParams();
  const router = useRouter();
  const { user, addFavorite, removeFavorite } = useAuth();
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  // Wheel → scroll orizzontale
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    dragScrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grabbing';
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    const walk = x - dragStartX.current;
    if (Math.abs(walk) > 5) hasDragged.current = true;
    if (scrollRef.current) scrollRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const id = Number(params.id);
  const course = MILAN_COURSES.find(c => c.id === id);

  const isFaved = user ? (user.favorites ?? []).includes(id) : false;

  const generateOverview = useCallback(async () => {
    if (!course || aiLoading || aiText) return;
    const cacheKey = `u2f_ai_overview_${id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setAiText(cached); return; }
    setAiLoading(true);
    try {
      const res = await fetch('/api/corso-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: course.nome, universita: course.universita,
          tipo: course.tipo, classe: course.classe,
          lingua: course.lingua, area: course.area,
        }),
      });
      const data = await res.json();
      if (data.text) { setAiText(data.text); localStorage.setItem(cacheKey, data.text); }
    } catch { /* silently fail */ }
    finally { setAiLoading(false); }
  }, [course, id, aiLoading, aiText]);

  if (!course) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#8A9D95', marginBottom: '1rem' }}>Corso non trovato.</p>
        <Link href="/" style={{ color: '#1B5E52', fontWeight: 600, textDecoration: 'none' }}>Torna alla home</Link>
      </div>
    );
  }

  const mur = resolveUniversity(course.universita);
  const slug = mur ? uniSlug(mur.name) : null;
  const admission = getAdmissionInfo(course.universita, course.classe, user?.startYear || undefined);
  const similar = getSimilarCourses(course);
  const ts = TIPO_COLORS[course.tipo] ?? { text: '#666', bg: '#F5F5F5' };
  const scoreValues = user?.onboarded
    ? computeScoreValues(course, user)
    : [70, 55, 50, 30, 55] as [number, number, number, number, number];
  const matchPct = user?.onboarded ? getMatchPct(course, user) : null;

  const descParts: string[] = [
    `Corso di laurea ${course.tipo.toLowerCase()} in ${course.nome}, erogato da ${course.universita}${course.citta ? ` nella sede di ${course.citta}` : ''}.`,
    `La durata è di ${course.durata} ${course.durata === 1 ? 'anno' : 'anni'}${course.cfu ? ` per un totale di ${course.cfu} CFU` : ''}.`,
    course.classe ? `Appartiene alla classe di laurea ${course.classe}.` : '',
  ].filter(Boolean);
  const description = descParts.join(' ');

  // Bullet list items per Dettagli del corso
  const detailItems: ({ label: string; value: ReactNode } | null)[] = [
    {
      label: 'Durata',
      value: `${course.durata} ${course.durata === 1 ? 'anno' : 'anni'}${course.cfu ? ` · ${course.cfu} CFU` : ''}`,
    },
    course.classe ? { label: 'Classe di laurea', value: course.classe } : null,
    course.lingua ? { label: 'Lingua', value: course.lingua } : null,
    {
      label: 'Ammissione',
      value: (() => {
        if (!admission) {
          const isPrivate = PRIVATE_KEYWORDS.some(k => course.universita.includes(k));
          if (isPrivate) return <span style={{ color: '#8A9D95' }}>Università privata — processo di selezione interno, consulta il sito ufficiale</span>;
          return <span style={{ color: '#8A9D95' }}>Dati non ancora disponibili per questo ateneo</span>;
        }
        const hasNoDate = !admission.rounds[0]?.application_close;
        const isDistantYear = user?.startYear && parseInt(user.startYear) >= 2027;
        return (
          <span>
            {admission.test}
            {hasNoDate && (
              <span style={{ fontWeight: 400, color: '#8A9D95' }}>
                {isDistantYear
                  ? ` — il bando per il ${user!.startYear}/${String(parseInt(user!.startYear) + 1).slice(2)} non è ancora uscito`
                  : ' — verifica le date sul bando ufficiale'}
              </span>
            )}
            {!hasNoDate && (
              <span style={{ fontWeight: 400, color: '#5C6B64' }}>
                {' '}· scadenza {formatDeadline(admission.rounds[0].application_close)}
                {admission.estimated ? ' (stimata)' : ''}
              </span>
            )}
            {admission.bando_url && (
              <> {' '}<a href={admission.bando_url} target="_blank" rel="noopener noreferrer"
                style={{ color: '#1B5E52', textDecoration: 'none', fontWeight: 500 }}>Bando</a></>
            )}
          </span>
        );
      })(),
    },
    {
      label: 'Sito ufficiale',
      value: course.url ? (
        <a href={course.url} target="_blank" rel="noopener noreferrer"
          style={{ color: '#1B5E52', textDecoration: 'none', fontWeight: 600 }}>
          Apri sito
        </a>
      ) : <span style={{ color: '#8A9D95' }}>Non presente nel nostro database — cerca il corso su Google</span>,
    },
    {
      label: 'Sbocchi lavorativi',
      value: course.url ? (
        <a href={course.url} target="_blank" rel="noopener noreferrer"
          style={{ color: '#1B5E52', textDecoration: 'none', fontWeight: 500 }}>
          Vedi sul sito del corso →
        </a>
      ) : <span style={{ color: '#8A9D95' }}>Disponibile prossimamente</span>,
    },
  ].filter(Boolean) as { label: string; value: ReactNode }[];

  return (
    <>
      <style>{`
        .similar-scroll::-webkit-scrollbar { display: none; }
        .similar-scroll { -ms-overflow-style: none; scrollbar-width: none; cursor: grab; user-select: none; }
        .similar-scroll:active { cursor: grabbing; }
      `}</style>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1.25rem 4rem' }}>

        {/* Back + Save row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.75rem' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#8A9D95', fontSize: '13px', padding: 0,
            display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A9D95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Indietro
        </button>
        {user && (
          <button
            onClick={() => isFaved ? removeFavorite(id) : addFavorite(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.875rem', borderRadius: '20px',
              fontSize: '12px', fontWeight: 600,
              background: isFaved ? '#1B5E52' : '#F5F1E8',
              color: isFaved ? '#fff' : '#1B5E52',
              border: `1.5px solid ${isFaved ? '#1B5E52' : '#C4BDB0'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <svg width="13" height="13" fill={isFaved ? '#fff' : 'none'} viewBox="0 0 24 24" stroke={isFaved ? '#fff' : '#1B5E52'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {isFaved ? 'Salvato' : 'Salva'}
          </button>
        )}
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          {slug ? (
            <Link href={`/universita/${slug}`} style={{
              fontSize: '11px', fontWeight: 700, color: '#1B5E52',
              textDecoration: 'none', letterSpacing: '0.06em',
              textTransform: 'uppercase', display: 'block', marginBottom: '0.6rem',
            }}>
              {course.universita}
            </Link>
          ) : (
            <div style={{ fontSize: '11px', color: '#8A9D95', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {course.universita}
            </div>
          )}
          <h1 style={{
            fontSize: 'clamp(1.75rem, 6vw, 3rem)', fontWeight: 700,
            color: '#1C2B26', letterSpacing: '-0.04em',
            lineHeight: 1.1, marginBottom: '1rem',
          }}>
            {course.nome}
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '20px', background: ts.bg, color: ts.text }}>
              {course.tipo}
            </span>
            {course.lingua && course.lingua !== 'Italiano' && (
              <span style={{ fontSize: '11px', padding: '0.3rem 0.75rem', borderRadius: '20px', background: '#F0F0F0', color: '#666' }}>
                {course.lingua}
              </span>
            )}
            {course.area && (
              <span style={{ fontSize: '11px', padding: '0.3rem 0.75rem', borderRadius: '20px', background: '#F0F0F0', color: '#666' }}>
                {course.area}
              </span>
            )}
          </div>
        </div>

        {/* AI OVERVIEW */}
        <div style={{ borderTop: '1px solid #D4CEC2', paddingTop: '2rem', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1B5E52', marginBottom: '0.4rem' }}>
            AI
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1C2B26', letterSpacing: '-0.035em', marginBottom: '1.25rem', lineHeight: 1.2 }}>
            Panoramica del corso
          </h2>
          {aiText ? (
            <p style={{ fontSize: '14px', color: '#3A4A42', lineHeight: 1.75, margin: 0 }}>{aiText}</p>
          ) : (
            <button
              onClick={generateOverview}
              disabled={aiLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.75rem 1.25rem', borderRadius: '12px',
                background: aiLoading ? '#F5F1E8' : '#1B5E52',
                color: aiLoading ? '#8A9D95' : '#fff',
                border: 'none', cursor: aiLoading ? 'default' : 'pointer',
                fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              {aiLoading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Generazione in corso…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 0 1 10 10H12V2z" /><path d="M12 12 2.5 21" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  Genera panoramica AI
                </>
              )}
            </button>
          )}
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* INFORMAZIONI PRINCIPALI */}
        <Section label="Informazioni principali" title="Dettagli del corso">
          {/* Bullet list */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {detailItems.map(item => { const { label, value } = item as { label: string; value: ReactNode }; return (
              <li key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', fontSize: '14px' }}>
                <span style={{ color: '#C4BDB0', flexShrink: 0, fontSize: '12px' }}>—</span>
                <span style={{ color: '#5C6B64', fontWeight: 500, flexShrink: 0 }}>{label}:</span>
                <span style={{ color: '#1C2B26', fontWeight: 600 }}>{value}</span>
              </li>
            ); })}
          </ul>

          {/* Descrizione */}
          <div>
            <div style={{
              fontSize: '15px', fontWeight: 700, color: '#1C2B26',
              letterSpacing: '-0.02em', marginBottom: '0.6rem',
            }}>
              Descrizione
            </div>
            <p style={{ fontSize: '14px', color: '#3A4A42', lineHeight: 1.7, margin: 0 }}>
              {description}
            </p>
          </div>
        </Section>

        {/* OVERVIEW */}
        <Section label="Overview" title="Università e dipartimento">
          <div style={{ background: '#F5F1E8', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #E4DDD0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <HourglassIcon />
              <span style={{ fontSize: '11px', color: '#B0A898', fontStyle: 'italic' }}>Disponibile prossimamente</span>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li style={{ fontSize: '13px', color: '#8A9D95' }}>Ranking e riconoscimenti internazionali</li>
              <li style={{ fontSize: '13px', color: '#8A9D95' }}>Professori e corsi caratterizzanti</li>
              <li style={{ fontSize: '13px', color: '#8A9D95' }}>Notorietà e reputazione nel settore</li>
            </ul>
          </div>
        </Section>

        {/* POSIZIONE */}
        <Section label="Posizione" title="Dove si studia">
          <div style={{ background: '#F5F1E8', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #E4DDD0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <HourglassIcon />
              <span style={{ fontSize: '11px', color: '#B0A898', fontStyle: 'italic' }}>Disponibile prossimamente</span>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li style={{ fontSize: '13px', color: '#8A9D95' }}>Tratta da pendolare dalla tua città</li>
              <li style={{ fontSize: '13px', color: '#8A9D95' }}>Affitti e situazione immobiliare nella zona</li>
            </ul>
          </div>
        </Section>

        {/* MATCHING */}
        <Section label="Matching" title="Compatibilita con il tuo profilo">
          {!user?.onboarded ? (
            <div style={{
              background: '#F5F1E8', borderRadius: '12px', padding: '1.5rem',
              border: '1px solid #E4DDD0', fontSize: '14px', color: '#5C6B64', textAlign: 'center',
            }}>
              <Link href="/login" style={{ color: '#1B5E52', fontWeight: 700, textDecoration: 'none' }}>Accedi</Link>
              {' '}per vedere la compatibilita con il tuo profilo.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

              {/* Pentagon centrato */}
              <PentagonFull values={scoreValues} size={220} />

              {/* Spiegazione vertici */}
              <ul style={{ fontSize: '12px', color: '#8A9D95', lineHeight: 1.9, margin: 0, padding: '0 0 0 1.1rem', alignSelf: 'flex-start', maxWidth: '380px' }}>
                <li><strong style={{ color: '#5C6B64' }}>Posizione</strong> — sede del corso a Milano</li>
                <li><strong style={{ color: '#5C6B64' }}>Costo</strong> — ateneo pubblico vs. privato rispetto alla tua preferenza</li>
                <li><strong style={{ color: '#5C6B64' }}>Interessi</strong> — corrispondenza con le tue aree di studio</li>
                <li><strong style={{ color: '#5C6B64' }}>Attitudine</strong> — allineamento con il tuo profilo di orientamento</li>
                <li><strong style={{ color: '#5C6B64' }}>Accesso</strong> — facilità di ammissione in base al tipo di test</li>
              </ul>

              {/* Match percentuale */}
              {matchPct !== null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3.5rem', fontWeight: 700, color: '#1B5E52', letterSpacing: '-0.05em', lineHeight: 1 }}>
                    {matchPct}%
                  </div>
                  <div style={{ fontSize: '13px', color: '#8A9D95', marginTop: '6px' }}>
                    Match con i tuoi interessi
                  </div>
                </div>
              )}

              {/* Barre dimensioni */}
              <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {([
                  ['Posizione', scoreValues[0]],
                  ['Costo', scoreValues[1]],
                  ['Interessi', scoreValues[2]],
                  ['Attitudine', scoreValues[3]],
                  ['Accesso', scoreValues[4]],
                ] as [string, number][]).map(([label, value]) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#5C6B64', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: '12px', color: '#8A9D95' }}>{value}/100</span>
                    </div>
                    <div style={{ height: '5px', background: '#E4DDD0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: '#1B5E52', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* CORSI SIMILI */}
        <div style={{ borderTop: '1px solid #D4CEC2', paddingTop: '2rem' }}>
          <div style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#1B5E52', marginBottom: '0.4rem',
          }}>
            Corsi simili
          </div>
          <h2 style={{
            fontSize: '1.375rem', fontWeight: 700, color: '#1C2B26',
            letterSpacing: '-0.035em', marginBottom: '1.25rem', lineHeight: 1.2,
          }}>
            Potrebbero interessarti
          </h2>
          <div
            ref={scrollRef}
            className="similar-scroll"
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onMouseMove={onMouseMove}
            style={{
              display: 'flex', gap: '0.75rem',
              overflowX: 'auto', paddingBottom: '0.25rem',
            }}
          >
            {similar.map(c => {
              const cts = TIPO_COLORS[c.tipo] ?? { text: '#666', bg: '#F5F5F5' };
              const simValues = user?.onboarded
                ? computeScoreValues(c, user)
                : [70, 55, 50, 30, 55] as [number, number, number, number, number];
              const simMatch = user?.onboarded ? getMatchPct(c, user) : null;
              return (
                <Link
                  key={c.id}
                  href={`/corso/${c.id}`}
                  draggable={false}
                  onClick={e => { if (hasDragged.current) { e.preventDefault(); hasDragged.current = false; } }}
                  style={{ textDecoration: 'none', flexShrink: 0, width: '165px' }}
                >
                  <div style={{
                    background: '#F5F1E8', borderRadius: '12px', padding: '0.875rem',
                    border: '1px solid #D4CEC2',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    height: '100%',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '9px', fontWeight: 600, padding: '0.2rem 0.5rem',
                        borderRadius: '4px', background: cts.bg, color: cts.text,
                      }}>
                        {c.tipo}
                      </span>
                      {simMatch !== null && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#1B5E52' }}>
                          {simMatch}%
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px', fontWeight: 600, color: '#1C2B26',
                      lineHeight: 1.3, flex: 1,
                    }}>
                      {c.nome}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <PentagonSmall values={simValues} size={95} />
                    </div>
                    <div style={{ fontSize: '10px', color: '#8A9D95', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A9D95" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 21V6l9-3 9 3v15" /><path d="M9 21V12h6v9" />
                      </svg>
                      {c.universita.length > 26 ? c.universita.slice(0, 24) + '…' : c.universita}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
