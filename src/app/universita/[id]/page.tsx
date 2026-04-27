'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getMurBySlug, getCoursesForMur, DOCTORAL_ONLY } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  getUniAdmissionEntries, formatDeadline, daysUntil,
  getActiveRound, PATHWAY_STEPS,
} from '@/lib/admissions';
import { IconClipboard, IconCheck, IconBuilding } from '@/components/Icons';
const TIPO_STYLE: Record<string, { text: string; bg: string; border: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
};

const DEGREE_TYPES = ['Triennale', 'Magistrale', 'Ciclo Unico'];

export default function UniversityPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { t } = useLanguage();
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
  const admissionEntries = getUniAdmissionEntries(uni.name);

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
        <Link href="/esplora" style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '13px', color: 'var(--accent)', fontWeight: 500,
          textDecoration: 'none', flexShrink: 0,
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t.university.back}
        </Link>
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
      </section>

      {/* ── Admission info section ── */}
      {admissionEntries.length > 0 && (
        <section style={{ padding: '0 1.25rem 1.5rem' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Ammissione
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {admissionEntries.map(({ testType, info }) => {
              const steps = PATHWAY_STEPS[info.pathway_type];
              const isFree = info.pathway_type === 'free';

              // Round tabs state for this entry
              const roundIdx = selectedRounds[testType] ?? 0;
              const hasMultipleRounds = info.rounds.length > 1;
              const activeRound = info.rounds[roundIdx] ?? getActiveRound(info);

              const primaryDeadline = activeRound?.application_close ?? null;
              const days = primaryDeadline ? daysUntil(primaryDeadline) : null;
              const isUrgentDeadline = days !== null && days >= 0 && days <= 30;

              return (
                <div key={testType} style={{
                  background: 'var(--surface)', borderRadius: '16px',
                  border: `1px solid ${isUrgentDeadline ? '#FDE68A' : 'var(--border)'}`,
                  overflow: 'hidden',
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '0.875rem 1rem 0.75rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 700,
                      color: isFree ? '#555' : '#92400E',
                      background: isFree ? '#F5F5F5' : 'rgba(251,191,36,0.15)',
                      padding: '0.25rem 0.625rem', borderRadius: '6px',
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                    }}>
                      {isFree
                        ? <><IconCheck size={12} strokeWidth={2.5} /> Accesso libero</>
                        : <><IconClipboard size={12} strokeWidth={1.75} /> {testType}</>}
                    </span>
                    {primaryDeadline && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isUrgentDeadline ? '#B45309' : 'var(--text-3)' }}>
                        {days !== null && days >= 0 ? `${days}g · ` : ''}scade {formatDeadline(primaryDeadline)}
                      </span>
                    )}
                  </div>

                  {/* Round tabs — only shown when multiple rounds */}
                  {hasMultipleRounds && (
                    <div style={{ display: 'flex', gap: '0.375rem', padding: '0.625rem 1rem 0', overflowX: 'auto' }}>
                      {info.rounds.map((r, ri) => (
                        <button
                          key={ri}
                          onClick={() => setSelectedRounds(prev => ({ ...prev, [testType]: ri }))}
                          style={{
                            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                            border: `1.5px solid ${roundIdx === ri ? '#1B5E52' : 'var(--border)'}`,
                            background: roundIdx === ri ? '#E4F0ED' : 'var(--surface)',
                            color: roundIdx === ri ? '#1B5E52' : 'var(--text-3)',
                            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                          }}>
                          {r.round_name ?? `Round ${ri + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Steps */}
                  <div style={{ padding: '0.75rem 1rem' }}>
                    {info.note && (
                      <p style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '0.625rem', lineHeight: 1.5 }}>
                        ⚠️ {info.note}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {steps.map((step, si) => {
                        const deadline = activeRound && step.deadline_field
                          ? activeRound[step.deadline_field] as string | null
                          : null;
                        const stepDays = deadline ? daysUntil(deadline) : null;
                        const stepUrgent = stepDays !== null && stepDays >= 0 && stepDays <= 30;

                        return (
                          <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 700, marginTop: '1px',
                              background: '#F0F0F0', color: '#888',
                              border: '1.5px solid #E0E0E0',
                            }}>
                              {si + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-1)' }}>
                                {step.label_it}
                                {step.user_input === 'score' && (
                                  <span style={{ marginLeft: '0.375rem', fontSize: '10px', color: 'var(--text-3)' }}>
                                    · richiede {step.score_label_it}
                                  </span>
                                )}
                                {step.user_input === 'score_and_type' && (
                                  <span style={{ marginLeft: '0.375rem', fontSize: '10px', color: 'var(--text-3)' }}>
                                    · BAT / SAT / ACT + punteggio
                                  </span>
                                )}
                              </div>
                              {deadline && (
                                <div style={{ display: 'flex', gap: '0.875rem', marginTop: '2px', flexWrap: 'wrap' }}>
                                  {step.deadline_field === 'tolc_last_valid' && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                                      TOLC entro <strong style={{ color: stepUrgent ? '#EF4444' : 'var(--text-2)' }}>{info.estimated ? '~' : ''}{formatDeadline(deadline)}</strong>
                                    </span>
                                  )}
                                  {step.deadline_field === 'test_date' && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                                      Data test <strong style={{ color: 'var(--text-2)' }}>{info.estimated ? '~' : ''}{formatDeadline(deadline)}</strong>
                                    </span>
                                  )}
                                  {(step.deadline_field === 'application_close' || step.deadline_field === 'enrollment_close') && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                                      Scadenza <strong style={{ color: stepUrgent ? '#EF4444' : 'var(--text-2)' }}>
                                        {stepDays !== null && stepDays >= 0 ? `${stepDays}gg · ` : ''}{info.estimated ? '~' : ''}{formatDeadline(deadline)}
                                      </strong>
                                    </span>
                                  )}
                                  {/* Results date shown on last step */}
                                  {si === steps.length - 1 && activeRound?.results_date && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                                      Esiti <strong style={{ color: 'var(--text-2)' }}>{formatDeadline(activeRound.results_date)}</strong>
                                    </span>
                                  )}
                                </div>
                              )}
                              {/* Show results_date on last free step too */}
                              {!deadline && si === steps.length - 1 && activeRound?.results_date && (
                                <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                                  Esiti <strong style={{ color: 'var(--text-2)' }}>{formatDeadline(activeRound.results_date)}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Links */}
                    <div style={{ display: 'flex', gap: '0.875rem', marginTop: '0.75rem' }}>
                      {info.test_url && (
                        <a href={info.test_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                          Info {testType} →
                        </a>
                      )}
                      {info.bando_url && (
                        <a href={info.bando_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                          Bando ufficiale →
                        </a>
                      )}
                    </div>
                    {info.estimated && (
                      <p style={{ fontSize: '9px', color: 'var(--text-3)', marginTop: '0.375rem' }}>
                        Date basate su {info.sourceYear} — verifica il bando aggiornato
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
