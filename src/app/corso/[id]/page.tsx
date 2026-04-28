'use client';
import type { ReactNode } from 'react';
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

function Pentagon({ values, size = 120 }: { values: number[]; size?: number }) {
  const cx = 50, cy = 50, r = 34;
  const angles = Array.from({ length: 5 }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5);
  const outline = angles.map(a => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }));
  const filled = values.map((v, i) => ({
    x: cx + r * (v / 100) * Math.cos(angles[i]),
    y: cy + r * (v / 100) * Math.sin(angles[i]),
  }));
  const outlinePts = outline.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const filledPts = filled.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const labelR = r + 11;
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

function Section({ label, title, children, comingSoon }: {
  label: string; title: string; children?: ReactNode; comingSoon?: boolean;
}) {
  return (
    <div style={{ borderTop: '1px solid #D4CEC2', paddingTop: '2rem', marginBottom: '2.5rem' }}>
      <div style={{
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#1B5E52', marginBottom: '0.35rem',
      }}>
        {label}
      </div>
      <h2 style={{
        fontSize: '1.125rem', fontWeight: 700, color: '#1C2B26',
        letterSpacing: '-0.03em', marginBottom: comingSoon ? '1rem' : '1.5rem',
      }}>
        {title}
      </h2>
      {comingSoon ? (
        <div style={{
          background: '#F5F1E8', borderRadius: '10px', padding: '1.25rem 1.5rem',
          color: '#8A9D95', fontSize: '13px', fontStyle: 'italic',
          border: '1px solid #E4DDD0',
        }}>
          Disponibile prossimamente
        </div>
      ) : children}
    </div>
  );
}

function InfoRow({ label, children, last }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: '1rem', padding: '0.875rem 0',
      borderBottom: last ? 'none' : '1px solid #EDE8DC',
    }}>
      <span style={{ fontSize: '13px', color: '#5C6B64', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <div style={{ fontSize: '13px', color: '#1C2B26', fontWeight: 600, textAlign: 'right' }}>{children}</div>
    </div>
  );
}

export default function CorsoPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const id = Number(params.id);
  const course = MILAN_COURSES.find(c => c.id === id);

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
  const scoreValues = user?.onboarded ? computeScoreValues(course, user) : [70, 55, 50, 30, 55] as [number, number, number, number, number];
  const matchPct = user?.onboarded ? getMatchPct(course, user) : null;

  const description = `Corso di laurea ${course.tipo.toLowerCase()} in ${course.nome}, erogato da ${course.universita} nella sede di ${course.citta}. La durata prevista è di ${course.durata} ${course.durata === 1 ? 'anno' : 'anni'}${course.cfu ? ` per un totale di ${course.cfu} CFU` : ''}. Il corso appartiene alla classe ${course.classe} ed è tenuto in ${course.lingua}.`;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1.25rem 4rem' }}>

      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8A9D95', fontSize: '13px', padding: '0 0 1.75rem',
          display: 'flex', alignItems: 'center', gap: '0.35rem',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A9D95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Indietro
      </button>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        {slug ? (
          <Link href={`/universita/${slug}`} style={{
            fontSize: '11px', fontWeight: 600, color: '#1B5E52',
            textDecoration: 'none', letterSpacing: '0.02em',
            textTransform: 'uppercase', display: 'block', marginBottom: '0.6rem',
          }}>
            {course.universita}
          </Link>
        ) : (
          <div style={{ fontSize: '11px', color: '#8A9D95', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {course.universita}
          </div>
        )}
        <h1 style={{
          fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700,
          color: '#1C2B26', letterSpacing: '-0.04em',
          lineHeight: 1.15, marginBottom: '1rem',
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

      {/* INFORMAZIONI PRINCIPALI */}
      <Section label="Informazioni principali" title="Dettagli del corso">
        <InfoRow label="Durata">
          {course.durata} {course.durata === 1 ? 'anno' : 'anni'}{course.cfu ? ` · ${course.cfu} CFU` : ''}
        </InfoRow>
        <InfoRow label="Classe di laurea">
          {course.classe}
        </InfoRow>
        <InfoRow label="Lingua">
          {course.lingua || 'Non specificata'}
        </InfoRow>
        <InfoRow label="Ammissione">
          {admission ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
              <span>{admission.test}</span>
              {admission.rounds[0]?.application_close && (
                <span style={{ fontSize: '11px', color: '#8A9D95', fontWeight: 400 }}>
                  Scadenza: {formatDeadline(admission.rounds[0].application_close)}
                  {admission.estimated ? ' (stimata)' : ''}
                </span>
              )}
              {admission.bando_url && (
                <a href={admission.bando_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '11px', color: '#1B5E52', textDecoration: 'none', fontWeight: 500 }}>
                  Vedi bando
                </a>
              )}
            </div>
          ) : (
            <span style={{ color: '#8A9D95', fontWeight: 400 }}>Non disponibile</span>
          )}
        </InfoRow>
        <InfoRow label="Sito ufficiale" last>
          {course.url ? (
            <a href={course.url} target="_blank" rel="noopener noreferrer"
              style={{ color: '#1B5E52', textDecoration: 'none' }}>
              Apri sito
            </a>
          ) : (
            <span style={{ color: '#8A9D95', fontWeight: 400 }}>Non disponibile</span>
          )}
        </InfoRow>
        <div style={{ paddingTop: '1rem' }}>
          <div style={{ fontSize: '12px', color: '#5C6B64', fontWeight: 500, marginBottom: '0.5rem' }}>Descrizione</div>
          <p style={{ fontSize: '13px', color: '#1C2B26', lineHeight: 1.65, margin: 0 }}>
            {description}
          </p>
        </div>
      </Section>

      {/* OVERVIEW */}
      <Section label="Overview" title="Università e dipartimento" comingSoon />

      {/* POSIZIONE */}
      <Section label="Posizione" title="Dove si studia" comingSoon />

      {/* MATCHING */}
      <Section label="Matching" title="Compatibilita con il tuo profilo">
        {!user?.onboarded ? (
          <div style={{
            background: '#F5F1E8', borderRadius: '10px', padding: '1.25rem 1.5rem',
            border: '1px solid #E4DDD0', fontSize: '13px', color: '#5C6B64',
          }}>
            <Link href="/login" style={{ color: '#1B5E52', fontWeight: 600, textDecoration: 'none' }}>Accedi</Link>
            {' '}per vedere la compatibilita con il tuo profilo.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Pentagon values={scoreValues} size={150} />
            <div style={{ flex: 1, minWidth: '160px' }}>
              {matchPct !== null && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '2.75rem', fontWeight: 700, color: '#1B5E52', letterSpacing: '-0.05em', lineHeight: 1 }}>
                    {matchPct}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#8A9D95', marginTop: '4px' }}>
                    Match con i tuoi interessi
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {([
                  ['Posizione', scoreValues[0]],
                  ['Tipo universita', scoreValues[1]],
                  ['Interessi', scoreValues[2]],
                  ['Attitudine', scoreValues[3]],
                  ['Accesso', scoreValues[4]],
                ] as [string, number][]).map(([label, value]) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', color: '#5C6B64' }}>{label}</span>
                      <span style={{ fontSize: '11px', color: '#8A9D95' }}>{value}</span>
                    </div>
                    <div style={{ height: '4px', background: '#E4DDD0', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: '#1B5E52', borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* CORSI SIMILI */}
      <div style={{ borderTop: '1px solid #D4CEC2', paddingTop: '2rem' }}>
        <div style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#1B5E52', marginBottom: '0.35rem',
        }}>
          Corsi simili
        </div>
        <h2 style={{
          fontSize: '1.125rem', fontWeight: 700, color: '#1C2B26',
          letterSpacing: '-0.03em', marginBottom: '1.25rem',
        }}>
          Potrebbero interessarti
        </h2>
        <div style={{
          display: 'flex', gap: '0.75rem',
          overflowX: 'auto', paddingBottom: '0.5rem',
          scrollbarWidth: 'thin',
        }}>
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
                    <Pentagon values={simValues} size={95} />
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
  );
}
