'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MILAN_COURSES, resolveUniversity, uniSlug } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const DEGREE_TYPES = ['Triennale', 'Magistrale', 'Ciclo Unico'];

const TIPO_STYLE: Record<string, { text: string; bg: string; border: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
};

export default function CorsiPage() {
  const { t } = useLanguage();
  const [search, setSearch]               = useState('');
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return MILAN_COURSES.filter(c => {
      if (selectedDegrees.length > 0 && !selectedDegrees.includes(c.tipo)) return false;
      if (q && !c.nome.toLowerCase().includes(q) && !c.universita.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, selectedDegrees]);

  const toggleDegree = (d: string) =>
    setSelectedDegrees(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            {t.corsi.title}
          </h1>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{filtered.length}</span> {t.corsi.courses}
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* ── Search ── */}
      <div style={{ padding: '1rem 1.25rem 0' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-3)" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.corsi.search}
            className="ui-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* ── Degree type filter ── */}
      <div style={{ padding: '0.875rem 1.25rem 0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '0.5rem', width: 'max-content' }}>
          {DEGREE_TYPES.map(d => {
            const active = selectedDegrees.includes(d);
            const s = TIPO_STYLE[d];
            return (
              <button key={d} onClick={() => toggleDegree(d)} style={{
                padding: '0.4rem 0.875rem', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
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

      {/* ── Course list ── */}
      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '0', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg)' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>{t.corsi.noResults}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--border)', gap: '1px' }}>
            {filtered.map(c => {
              const ts = TIPO_STYLE[c.tipo] ?? TIPO_STYLE.Triennale;
              const mur = resolveUniversity(c.universita);
              const slug = mur ? uniSlug(mur.name) : null;
              return (
                <div key={`${c.source}-${c.id}`} style={{
                  background: 'var(--surface)', padding: '0.875rem 1.25rem',
                  display: 'flex', flexDirection: 'column', gap: '0.375rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <h3 style={{
                      fontSize: '14px', fontWeight: 500, color: 'var(--text-1)',
                      lineHeight: 1.35, letterSpacing: '-0.01em', flex: 1,
                    }}>
                      {c.nome}
                    </h3>
                    <span style={{
                      fontSize: '10px', padding: '0.2rem 0.5rem', borderRadius: '6px',
                      flexShrink: 0, fontWeight: 500,
                      background: ts.bg, color: ts.text, border: `1px solid ${ts.border}`,
                    }}>
                      {c.tipo}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {slug ? (
                        <Link href={`/universita/${slug}`} style={{
                          fontSize: '12px', color: 'var(--accent)', fontWeight: 500,
                          textDecoration: 'none',
                        }}>
                          {c.universita.length > 40 ? c.universita.slice(0, 38) + '…' : c.universita}
                        </Link>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{c.universita}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {c.cfu && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.cfu} CFU</span>}
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: '12px', color: 'var(--accent)', fontWeight: 500,
                          textDecoration: 'none',
                        }}>
                          {t.corsi.details}
                        </a>
                      )}
                    </div>
                  </div>
                  {c.area && (
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.area}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
