'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMurBySlug, getCoursesForMur, DOCTORAL_ONLY } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { MurUniversity } from '@/lib/data';

function buildUniDescription(uni: MurUniversity, courseCount: number): string {
  const tipo = uni.institution_type?.toLowerCase() === 'politecnico' ? 'politecnico'
    : uni.institution_type?.toLowerCase() === 'accademia' ? "accademia"
    : 'università';
  const pubPriv = uni.public_private === 'state' ? 'pubblica' : 'privata';
  const articleTipo = tipo === 'università' || tipo === 'accademia' ? `un'${tipo}` : `un ${tipo}`;
  const city = uni.city ? (uni.city.charAt(0) + uni.city.slice(1).toLowerCase()) : 'Milano';

  const parts: string[] = [
    `${uni.name} è ${articleTipo} ${pubPriv} con sede a ${city}.`,
  ];

  const rankings: string[] = [];
  if (uni.qs_rank) rankings.push(`QS World #${uni.qs_rank}`);
  if (uni.the_rank) rankings.push(`THE ${uni.the_rank}`);
  if (uni.arwu_rank) rankings.push(`ARWU ${uni.arwu_rank}`);
  if (rankings.length > 0) parts.push(`Classificata nei principali ranking internazionali: ${rankings.join(', ')}.`);

  if (courseCount > 0) parts.push(`Il catalogo milanese comprende ${courseCount} corsi tra triennali, magistrali e cicli unici.`);

  return parts.join(' ');
}
const TIPO_STYLE: Record<string, { text: string; bg: string; border: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
};

const DEGREE_TYPES = ['Triennale', 'Magistrale', 'Ciclo Unico'];

export default function UniversityPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { t } = useLanguage();
  const router = useRouter();
  const [search, setSearch]               = useState('');
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
  const [selectedRounds, setSelectedRounds] = useState<Record<string, number>>({});

  const uni  = getMurBySlug(id);
  const allCourses = useMemo(() => uni ? getCoursesForMur(uni) : [], [uni]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allCourses.filter(c => {
      if (selectedDegrees.length > 0 && !selectedDegrees.includes(c.tipo)) return false;
      if (q && !c.nome.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allCourses, search, selectedDegrees]);

  const toggleDegree = (d: string) =>
    setSelectedDegrees(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  if (!uni) {
    return (
      <div style={{ padding: '3rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '1rem' }}>Università non trovata.</p>
        <Link href="/esplora" style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
          ← Esplora
        </Link>
      </div>
    );
  }

  const isDoctoralOnly = DOCTORAL_ONLY.has(uni.mur_code);
  const isState = uni.public_private === 'state';
  const description = buildUniDescription(uni, allCourses.length);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '0.75rem',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            fontSize: '14px', color: 'var(--accent)', fontWeight: 700,
            background: 'var(--surface)', border: '1.5px solid var(--accent)',
            padding: '0.375rem 0.875rem 0.375rem 0.625rem', borderRadius: '20px',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Indietro
        </button>
        <LanguageSwitcher />
      </header>

      {/* ── University info ── */}
      <section style={{ padding: '1.5rem 1.25rem 1.25rem' }}>
        <h1 style={{
          fontSize: '1.1875rem', fontWeight: 700,
          letterSpacing: '-0.03em', color: 'var(--text-1)',
          lineHeight: 1.25, marginBottom: '0.75rem',
        }}>
          {uni.name}
        </h1>

        {/* Meta chips row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{
            fontSize: '11px', fontWeight: 500,
            padding: '0.25rem 0.625rem', borderRadius: '6px',
            background: isState ? '#F0FDF4' : '#EFF6FF',
            color: isState ? '#166534' : '#1D4ED8',
            border: `1px solid ${isState ? '#BBF7D0' : '#BFDBFE'}`,
          }}>
            {isState ? t.university.statale : t.university.nonStatale}
          </span>
          {uni.address && (
            <span style={{
              fontSize: '11px', color: 'var(--text-3)',
              padding: '0.25rem 0.625rem', borderRadius: '6px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
            }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {uni.address}
            </span>
          )}
          {(uni.qs_rank || uni.the_rank) && (
            <span style={{
              fontSize: '11px', color: 'var(--text-3)',
              padding: '0.25rem 0.625rem', borderRadius: '6px',
              background: 'var(--surface)', border: '1px solid var(--border)',
            }}>
              {uni.qs_rank ? `QS #${uni.qs_rank}` : `THE #${uni.the_rank}`}
            </span>
          )}
        </div>

        {/* Description */}
        <p style={{
          fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.65,
          marginTop: '0.25rem',
        }}>
          {description}
        </p>
      </section>



      {/* ── Doctoral-only notice ── */}
      {isDoctoralOnly && (
        <section style={{ padding: '0 1.25rem 2rem' }}>
          <div style={{
            background: 'var(--surface)', borderRadius: '14px',
            border: '1px solid var(--border)', padding: '1.25rem',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6 }}>
              {t.university.doctoral}
            </p>
          </div>
        </section>
      )}

      {/* ── Courses section ── */}
      {!isDoctoralOnly && (
        <section style={{ padding: '0 1.25rem' }}>

          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '0.875rem',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              {t.university.courses}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{filtered.length}</span> / {allCourses.length}
            </span>
          </div>

          {/* Course search */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <svg style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--text-3)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.university.search}
              className="ui-input"
              style={{ paddingLeft: '2.5rem', fontSize: '14px', padding: '0.625rem 0.875rem 0.625rem 2.5rem' }}
            />
          </div>

          {/* Degree type chips */}
          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', width: 'max-content' }}>
              {DEGREE_TYPES.map(d => {
                const active = selectedDegrees.includes(d);
                const s = TIPO_STYLE[d];
                return (
                  <button key={d} onClick={() => toggleDegree(d)} style={{
                    padding: '0.375rem 0.75rem', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                    border: `1px solid ${active ? s.text : 'var(--border)'}`,
                    background: active ? s.bg : 'var(--surface)',
                    color: active ? s.text : 'var(--text-2)',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
                  }}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Courses list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>{t.university.noResults}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
              {filtered.map((c, i) => {
                const ts = TIPO_STYLE[c.tipo] ?? TIPO_STYLE.Triennale;
                const isLast = i === filtered.length - 1;
                return (
                  <div key={`${c.source}-${c.id}`} style={{
                    background: 'var(--surface)', padding: '0.875rem 1rem',
                    display: 'flex', flexDirection: 'column', gap: '0.375rem',
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 500, padding: '0.2rem 0.5rem',
                        borderRadius: '5px', flexShrink: 0,
                        background: ts.bg, color: ts.text, border: `1px solid ${ts.border}`,
                        marginTop: '1px',
                      }}>
                        {c.tipo}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px', fontWeight: 500, color: 'var(--text-1)',
                          lineHeight: 1.35, letterSpacing: '-0.01em',
                        }}>
                          {c.nome}
                        </div>
                        {c.area && (
                          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{c.area}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.875rem' }}>
                      {c.cfu && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.cfu} CFU</span>}
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.lingua}</span>
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: '12px', color: 'var(--accent)', fontWeight: 500,
                          textDecoration: 'none',
                        }}>
                          {t.university.details}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <div style={{ height: '1.5rem' }} />
    </div>
  );
}
