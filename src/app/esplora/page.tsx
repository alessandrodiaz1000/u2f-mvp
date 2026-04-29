'use client';
import Link from 'next/link';
import { useMemo, useState, useEffect, useRef } from 'react';
import {
  MILAN_UNIVERSITIES, MILAN_COURSES, UNI_SUBJECTS, UNI_DEGREE_TYPES, UNI_COURSE_COUNT,
  SUBJECT_CATEGORIES, DOCTORAL_ONLY, uniSlug, resolveUniversity,
} from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/context/AuthContext';
import { IconExtLink } from '@/components/Icons';
import { scoreCourse } from '@/lib/scoring';
import { useRouter } from 'next/navigation';

type Tab = 'uni' | 'corsi';

const DEGREE_TYPES = ['Triennale', 'Magistrale', 'Ciclo Unico'];

const TIPO_STYLE: Record<string, { text: string; bg: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF' },
};

type UniMenu = { slug: string | null; url: string | undefined; name: string } | null;

export default function EsploraPage() {
  const { t, lang } = useLanguage();
  const tipoLabel = t.app.corso.tipoLabel;
  const { user, addFavorite, removeFavorite } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('uni');
  const [uniMenu, setUniMenu] = useState<UniMenu>(null);

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
    const results = MILAN_COURSES.filter(c => {
      if (q && !c.nome.toLowerCase().includes(q) && !c.universita.toLowerCase().includes(q)) return false;
      if (courseType && c.tipo !== courseType) return false;
      return true;
    });
    if (user) {
      results.sort((a, b) => scoreCourse(b, user).total - scoreCourse(a, user).total);
    }
    return results;
  }, [courseSearch, courseType, user]);

  const [visible, setVisible] = useState(20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(20);
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisible(v => v + 20); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredCorsi]);

  const toggleArea = (a: string) =>
    setSelectedAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const toggleDegree = (d: string) =>
    setSelectedDegrees(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const hasUniFilters = search || selectedAreas.length > 0 || selectedDegrees.length > 0 || tipoUniv !== 'all';
  const resetUni = () => { setSearch(''); setSelectedAreas([]); setSelectedDegrees([]); setTipoUniv('all'); };

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* Header — sticky, contains search + filters for active tab */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#fff',
        borderBottom: '1px solid #F0F0F0',
        padding: '1rem 1.25rem 0.875rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#111', letterSpacing: '-0.03em' }}>
            Cerca
          </h1>
          <LanguageSwitcher />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '0.875rem' }}>
          {([['uni', 'Università'], ['corsi', 'Corsi']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '0.5rem 0', background: 'none', border: 'none',
              fontSize: '14px', fontWeight: tab === key ? 600 : 400,
              color: tab === key ? 'var(--accent)' : '#999',
              borderBottom: `2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: '0.625rem' }}>
          <svg style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#999" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {tab === 'uni' ? (
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cerca università…"
              style={{
                width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                background: '#F7F7F7', border: '1px solid #EBEBEB', borderRadius: '12px',
                fontSize: '15px', color: '#111', outline: 'none',
              }}
            />
          ) : (
            <input
              type="text" value={courseSearch} onChange={e => setCourseSearch(e.target.value)}
              placeholder="Cerca corso o università…"
              style={{
                width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                background: '#F7F7F7', border: '1px solid #EBEBEB', borderRadius: '12px',
                fontSize: '15px', color: '#111', outline: 'none',
              }}
            />
          )}
        </div>

        {/* Filters */}
        {tab === 'uni' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                    }}>{area}</button>
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
                    }}>{d}</button>
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
                    }}>{label}</button>
                  );
                })}
              </div>
            </div>
            {hasUniFilters && (
              <button onClick={resetUni} style={{
                alignSelf: 'flex-start', fontSize: '12px', fontWeight: 500,
                color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, textDecoration: 'underline',
              }}>Reset</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', width: 'max-content' }}>
              {['', ...DEGREE_TYPES].map(d => {
                const active = courseType === d;
                const label = d ? (tipoLabel[d] ?? d) : t.esplora.all;
                return (
                  <button key={d || 'all'} onClick={() => setCourseType(d)} style={{
                    padding: '0.35rem 0.875rem', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                    border: `1px solid ${active ? 'var(--accent)' : '#E5E5E5'}`,
                    background: active ? 'var(--accent)' : '#fff',
                    color: active ? '#fff' : '#555',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
                  }}>{label}</button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {tab === 'uni' ? (
        <div>

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
          {/* Course list */}
          <div style={{ padding: '0.625rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1px', background: '#fff' }}>
            {filteredCorsi.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#999', padding: '3rem 0' }}>
                Nessun corso trovato
              </p>
            ) : filteredCorsi.slice(0, visible).map(c => {
              const ts = TIPO_STYLE[c.tipo] ?? TIPO_STYLE.Triennale;
              const mur = resolveUniversity(c.universita);
              const slug = mur ? uniSlug(mur.name) : null;
              const isFaved = user?.favorites.includes(c.id) ?? false;
              return (
                <div key={c.id} onClick={() => router.push(`/corso/${c.id}`)} style={{
                  padding: '0.875rem 0',
                  borderBottom: '1px solid #F5F5F5',
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  cursor: 'pointer',
                }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '0.2rem 0.5rem',
                    borderRadius: '5px', flexShrink: 0, marginTop: '2px',
                    background: ts.bg, color: ts.text,
                  }}>
                    {tipoLabel[c.tipo] ?? c.tipo}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#111', lineHeight: 1.35, marginBottom: '3px', display: 'block' }}>
                      {c.nome}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); setUniMenu({ slug, url: c.url, name: c.universita }); }}
                      style={{
                        fontSize: '11px', color: 'var(--accent)', fontWeight: 500,
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        textAlign: 'left', lineHeight: 1.4,
                      }}
                    >
                      {c.universita.length > 40 ? c.universita.slice(0, 38) + '…' : c.universita}
                    </button>
                  </div>
                  {/* Save button */}
                  <button
                    onClick={e => { e.stopPropagation(); isFaved ? removeFavorite(c.id) : addFavorite(c.id); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0.25rem', flexShrink: 0, marginTop: '1px',
                      color: isFaved ? '#ef4444' : '#ccc',
                      fontSize: '18px', lineHeight: 1,
                      transition: 'color 0.15s',
                    }}
                    aria-label={isFaved ? 'Rimuovi dai salvati' : 'Salva corso'}
                  >
                    {isFaved ? '♥' : '♡'}
                  </button>
                </div>
              );
            })}
            {/* Infinite scroll sentinel */}
            {visible < filteredCorsi.length && (
              <div ref={sentinelRef} style={{ height: '1px' }} />
            )}
          </div>
        </div>
      )}

      {/* University action sheet */}
      {uniMenu && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setUniMenu(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
              zIndex: 300, backdropFilter: 'blur(2px)',
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '1.25rem 1.25rem 2.5rem',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          }}>
            {/* Handle */}
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E5E5E5', margin: '0 auto 1.25rem' }} />
            <p style={{ fontSize: '13px', color: '#999', marginBottom: '1rem', lineHeight: 1.4 }}>
              {uniMenu.name.length > 50 ? uniMenu.name.slice(0, 48) + '…' : uniMenu.name}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {uniMenu.slug && (
                <button
                  onClick={() => { setUniMenu(null); router.push(`/universita/${uniMenu.slug}`); }}
                  style={{
                    width: '100%', padding: '0.875rem 1rem',
                    background: 'var(--accent)', color: '#fff',
                    border: 'none', borderRadius: '14px',
                    fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  📚 Vedi tutti i corsi
                </button>
              )}
              {uniMenu.url && (
                <a
                  href={uniMenu.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setUniMenu(null)}
                  style={{
                    display: 'block', width: '100%', padding: '0.875rem 1rem',
                    background: '#F7F7F7', color: '#111',
                    border: '1px solid #E5E5E5', borderRadius: '14px',
                    fontSize: '15px', fontWeight: 500, cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  <IconExtLink size={15} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Sito ufficiale
                </a>
              )}
              <button
                onClick={() => setUniMenu(null)}
                style={{
                  width: '100%', padding: '0.75rem',
                  background: 'none', border: 'none',
                  fontSize: '14px', color: '#999', cursor: 'pointer',
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
