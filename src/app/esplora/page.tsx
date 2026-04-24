'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  MILAN_UNIVERSITIES, MILAN_COURSES, UNI_SUBJECTS, UNI_DEGREE_TYPES, UNI_COURSE_COUNT,
  SUBJECT_CATEGORIES, DOCTORAL_ONLY, uniSlug, resolveUniversity,
} from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type Tab = 'uni' | 'corsi';

const DEGREE_TYPES = ['Triennale', 'Magistrale', 'Ciclo Unico'];

const TIPO_STYLE: Record<string, { text: string; bg: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF' },
};

export default function EsploraPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('uni');

  // University filters
  const [search, setSearch]               = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
  const [tipoUniv, setTipoUniv]           = useState<'all' | 'state' | 'non_state'>('all');

  // Course filters
  const [courseSearch, setCourseSearch]   = useState('');
  const [courseType, setCourseType]       = useState('');

  const filteredUnis = useMemo(() => {
    const q = search.toLowerCase().trim();
    return MILAN_UNIVERSITIES.filter(u => {
      if (DOCTORAL_ONLY.has(u.mur_code)) return false;
      if (q && !u.name.toLowerCase().includes(q) && !u.short_name.toLowerCase().includes(q)) return false;
      if (tipoUniv !== 'all' && u.public_private !== tipoUniv) return false;
      if (selectedAreas.length > 0) {
        const subjects = UNI_SUBJECTS.get(u.mur_code) ?? [];
        if (!selectedAreas.some(a => subjects.includes(a))) return false;
      }
      if (selectedDegrees.length > 0) {
        const degrees = UNI_DEGREE_TYPES.get(u.mur_code) ?? [];
        if (!selectedDegrees.some(d => degrees.includes(d))) return false;
      }
      return true;
    });
  }, [search, tipoUniv, selectedAreas, selectedDegrees]);

  const filteredCorsi = useMemo(() => {
    const q = courseSearch.toLowerCase().trim();
    return MILAN_COURSES.filter(c => {
      if (q && !c.nome.toLowerCase().includes(q) && !c.universita.toLowerCase().includes(q)) return false;
      if (courseType && c.tipo !== courseType) return false;
      return true;
    }).slice(0, 80);
  }, [courseSearch, courseType]);

  const toggleArea = (a: string) =>
    setSelectedAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const toggleDegree = (d: string) =>
    setSelectedDegrees(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const hasUniFilters = search || selectedAreas.length > 0 || selectedDegrees.length > 0 || tipoUniv !== 'all';
  const resetUni = () => { setSearch(''); setSelectedAreas([]); setSelectedDegrees([]); setTipoUniv('all'); };

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#fff',
        borderBottom: '1px solid #F0F0F0',
        padding: '1rem 1.25rem 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#111', letterSpacing: '-0.03em' }}>
            Cerca
          </h1>
          <LanguageSwitcher />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {([['uni', 'Università'], ['corsi', 'Corsi']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '0.625rem 0', background: 'none', border: 'none',
              fontSize: '14px', fontWeight: tab === key ? 600 : 400,
              color: tab === key ? 'var(--accent)' : '#999',
              borderBottom: `2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'uni' ? (
        <div>
          {/* Search */}
          <div style={{ padding: '1rem 1.25rem 0' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#999" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cerca università…"
                style={{
                  width: '100%', paddingLeft: '2.5rem', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  background: '#F7F7F7', border: '1px solid #EBEBEB', borderRadius: '12px',
                  fontSize: '15px', color: '#111', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ padding: '0.75rem 1.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
              <div style={{ display: 'flex', gap: '0.5rem', width: 'max-content' }}>
                {SUBJECT_CATEGORIES.map(area => {
                  const active = selectedAreas.includes(area);
                  return (
                    <button key={area} onClick={() => toggleArea(area)} style={{
                      padding: '0.35rem 0.875rem', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                      border: `1px solid ${active ? 'var(--accent)' : '#E5E5E5'}`,
                      background: active ? 'var(--accent)' : '#fff',
                      color: active ? '#fff' : '#555',
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
                    }}>
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
              <div style={{ display: 'flex', gap: '0.5rem', width: 'max-content' }}>
                {DEGREE_TYPES.map(d => {
                  const active = selectedDegrees.includes(d);
                  return (
                    <button key={d} onClick={() => toggleDegree(d)} style={{
                      padding: '0.35rem 0.875rem', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                      border: `1px solid ${active ? 'var(--accent)' : '#E5E5E5'}`,
                      background: active ? 'var(--accent)' : '#fff',
                      color: active ? '#fff' : '#555',
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
                    }}>
                      {d}
                    </button>
                  );
                })}
                {(['state', 'non_state'] as const).map(tv => {
                  const active = tipoUniv === tv;
                  const label = tv === 'state' ? 'Statale' : 'Privata';
                  return (
                    <button key={tv} onClick={() => setTipoUniv(active ? 'all' : tv)} style={{
                      padding: '0.35rem 0.875rem', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                      border: `1px solid ${active ? 'var(--accent)' : '#E5E5E5'}`,
                      background: active ? 'var(--accent)' : '#fff',
                      color: active ? '#fff' : '#555',
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
                    }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {hasUniFilters && (
              <button onClick={resetUni} style={{
                alignSelf: 'flex-start', fontSize: '12px', fontWeight: 500,
                color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, textDecoration: 'underline',
              }}>
                Reset
              </button>
            )}
          </div>

          {/* University list */}
          <div style={{ padding: '0.875rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredUnis.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#999', padding: '3rem 0' }}>
                Nessuna università trovata
              </p>
            ) : filteredUnis.map(uni => {
              const count = UNI_COURSE_COUNT.get(uni.mur_code) ?? 0;
              const areas = UNI_SUBJECTS.get(uni.mur_code) ?? [];
              const slug  = uniSlug(uni.name);
              return (
                <Link key={uni.mur_code} href={`/universita/${slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#FAFAFA', borderRadius: '14px',
                    border: '1px solid #F0F0F0', padding: '1rem 1.125rem',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111', lineHeight: 1.3, letterSpacing: '-0.02em', flex: 1 }}>
                        {uni.name}
                      </h3>
                      <span style={{
                        fontSize: '10px', padding: '0.2rem 0.5rem', borderRadius: '6px',
                        flexShrink: 0, fontWeight: 500,
                        background: uni.public_private === 'state' ? '#F0FDF4' : '#EFF6FF',
                        color: uni.public_private === 'state' ? '#166534' : '#1D4ED8',
                      }}>
                        {uni.public_private === 'state' ? 'Statale' : 'Privata'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {areas.slice(0, 3).map(a => (
                          <span key={a} style={{
                            fontSize: '10px', color: '#777', fontWeight: 500,
                            background: '#fff', border: '1px solid #E8E8E8',
                            borderRadius: '4px', padding: '0.1rem 0.4rem',
                          }}>
                            {a}
                          </span>
                        ))}
                        {areas.length > 3 && (
                          <span style={{ fontSize: '10px', color: '#999' }}>+{areas.length - 3}</span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: '#999', flexShrink: 0 }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{count}</span> corsi
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          {/* Course search */}
          <div style={{ padding: '1rem 1.25rem 0' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#999" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={courseSearch} onChange={e => setCourseSearch(e.target.value)}
                placeholder="Cerca corso o università…"
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  background: '#F7F7F7', border: '1px solid #EBEBEB', borderRadius: '12px',
                  fontSize: '15px', color: '#111', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Degree type filter */}
          <div style={{ padding: '0.75rem 1.25rem 0', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', width: 'max-content' }}>
              {['', ...DEGREE_TYPES].map(d => {
                const active = courseType === d;
                return (
                  <button key={d || 'all'} onClick={() => setCourseType(d)} style={{
                    padding: '0.35rem 0.875rem', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                    border: `1px solid ${active ? 'var(--accent)' : '#E5E5E5'}`,
                    background: active ? 'var(--accent)' : '#fff',
                    color: active ? '#fff' : '#555',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
                  }}>
                    {d || 'Tutti'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Count */}
          <div style={{ padding: '0.75rem 1.25rem 0' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{filteredCorsi.length}</span>
              {filteredCorsi.length === 80 ? '+ corsi' : ' corsi'}
            </span>
          </div>

          {/* Course list */}
          <div style={{ padding: '0.625rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1px', background: '#fff' }}>
            {filteredCorsi.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#999', padding: '3rem 0' }}>
                Nessun corso trovato
              </p>
            ) : filteredCorsi.map(c => {
              const ts = TIPO_STYLE[c.tipo] ?? TIPO_STYLE.Triennale;
              const mur = resolveUniversity(c.universita);
              const slug = mur ? uniSlug(mur.name) : null;
              return (
                <div key={c.id} style={{
                  padding: '0.875rem 0',
                  borderBottom: '1px solid #F5F5F5',
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '0.2rem 0.5rem',
                    borderRadius: '5px', flexShrink: 0, marginTop: '2px',
                    background: ts.bg, color: ts.text,
                  }}>
                    {c.tipo}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111', lineHeight: 1.35, marginBottom: '3px' }}>
                      {c.nome}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {slug ? (
                        <Link href={`/universita/${slug}`} style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                          {c.universita.length > 40 ? c.universita.slice(0, 38) + '…' : c.universita}
                        </Link>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#999' }}>{c.universita}</span>
                      )}
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '11px', color: '#999', textDecoration: 'none' }}>
                          →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
