'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { MILAN_COURSES, resolveUniversity, uniSlug } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

const TIPO_STYLE: Record<string, { text: string; bg: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF' },
};

async function streamGroq(
  courseIds: number[],
  lang: string,
  question: string | null,
  onChunk: (text: string) => void,
  onDone: () => void,
): Promise<void> {
  const res = await fetch('/api/confront', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseIds, lang, question }),
  });

  if (!res.ok || !res.body) {
    onChunk(lang === 'it'
      ? 'Errore nella risposta AI. Riprova tra qualche secondo.'
      : 'AI response error. Please try again in a moment.');
    onDone();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') { onDone(); return; }
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) onChunk(content);
      } catch {}
    }
  }
  onDone();
}

function ConfruntaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { trackComparison } = useAuth();
  const tc = t.app.confronta;
  const ids = (searchParams.get('ids') ?? '').split(',').map(Number).filter(Boolean);
  const courses = MILAN_COURSES.filter(c => ids.includes(c.id));

  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  // Load initial AI overview
  useEffect(() => {
    if (courses.length < 2) return;
    trackComparison();
    setIsLoading(true);
    let text = '';
    setMessages([{ role: 'ai', text: '' }]);
    streamGroq(ids, lang, null, (chunk) => {
      text += chunk;
      setMessages([{ role: 'ai', text }]);
    }, () => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (courses.length < 2) {
    return (
      <div style={{ minHeight: '100svh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: '#666', marginBottom: '1.5rem' }}>{tc.minCourses}</p>
        <Link href="/preferiti" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>{tc.backToSaved}</Link>
      </div>
    );
  }

  const send = (text: string) => {
    if (!text.trim() || isLoading) return;
    const question = text.trim();
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setIsLoading(true);

    let aiText = '';
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);

    streamGroq(ids, lang, question, (chunk) => {
      aiText += chunk;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', text: aiText };
        return updated;
      });
    }, () => {
      setIsLoading(false);
      setTimeout(() => chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 100);
    });
  };

  const colW = `${Math.floor(100 / courses.length)}%`;

  const ROWS: { label: string; getValue: (c: typeof courses[0]) => string }[] = [
    { label: tc.rowUni,    getValue: c => c.universita.length > 35 ? c.universita.slice(0, 33) + '…' : c.universita },
    { label: tc.rowTipo,   getValue: c => c.tipo },
    { label: tc.rowArea,   getValue: c => c.area ?? '—' },
    { label: tc.rowDurata, getValue: c => c.durata ? `${c.durata} ${lang === 'it' ? 'anni' : 'yrs'}` : '—' },
    { label: tc.rowLingua, getValue: c => c.lingua ?? 'Italiano' },
    { label: tc.rowSito,   getValue: () => '' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100svh' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#fff', borderBottom: '1px solid #F0F0F0',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#555', padding: '0.25rem' }}>
          ←
        </button>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>{tc.title}</h1>
          <p style={{ fontSize: '11px', color: '#aaa' }}>{tc.selected(courses.length)}</p>
        </div>
      </header>

      <div style={{ padding: '1.25rem' }}>

        {/* ── Comparison table ── */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1px', marginBottom: '1px' }}>
            {courses.map(c => {
              const ts = TIPO_STYLE[c.tipo] ?? TIPO_STYLE.Triennale;
              return (
                <div key={c.id} style={{
                  width: colW, background: '#FAFAFA', borderRadius: '12px 12px 0 0',
                  padding: '0.875rem 0.75rem',
                  borderTop: `3px solid ${ts.text}`,
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#111', lineHeight: 1.3, marginBottom: '0.25rem' }}>{c.nome}</div>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: '4px', background: ts.bg, color: ts.text }}>
                    {c.tipo}
                  </span>
                </div>
              );
            })}
          </div>

          {ROWS.map((row, ri) => (
            <div key={row.label} style={{ display: 'flex', gap: '1px', marginBottom: '1px' }}>
              {courses.map((c, ci) => (
                <div key={c.id} style={{
                  width: colW,
                  background: ri % 2 === 0 ? '#fff' : '#FAFAFA',
                  padding: '0.75rem',
                  borderBottom: ri === ROWS.length - 1 ? 'none' : '1px solid #F5F5F5',
                }}>
                  {ci === 0 && (
                    <div style={{ fontSize: '10px', color: '#aaa', fontWeight: 500, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {row.label}
                    </div>
                  )}
                  {row.label === tc.rowSito ? (
                    c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                        {tc.openSite}
                      </a>
                    ) : <span style={{ fontSize: '12px', color: '#ccc' }}>—</span>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#333', fontWeight: 400, lineHeight: 1.4 }}>
                      {row.getValue(c) || '—'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '1px' }}>
            {courses.map(c => {
              const mur = resolveUniversity(c.universita);
              const slug = mur ? uniSlug(mur.name) : null;
              return (
                <div key={c.id} style={{ width: colW, padding: '0.75rem', background: '#FAFAFA', borderRadius: '0 0 12px 12px' }}>
                  {slug && (
                    <Link href={`/universita/${slug}`} style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                      {tc.uniLink}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Esami ── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            {tc.esami}
          </h2>
          <div style={{
            background: '#FAFAFA', borderRadius: '16px',
            border: '1.5px dashed #E5E5E5', padding: '1.5rem',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.6 }}>
              {tc.esamiEmpty}<br />
              <span style={{ fontWeight: 600, color: '#888' }}>{tc.esamiSoon}</span>
            </p>
          </div>
        </section>

        {/* ── AI Overview ── */}
        <section style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {tc.aiTitle}
          </h2>
          <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '0.875rem' }}>
            {tc.aiSubtitle}
          </p>

          {/* Chat area */}
          <div ref={chatRef} style={{
            background: '#FAFAFA', borderRadius: '16px', border: '1px solid #F0F0F0',
            padding: '1rem', maxHeight: '380px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            marginBottom: '0.75rem',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '88%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? 'var(--accent)' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#222',
                  fontSize: '13px', lineHeight: 1.55,
                  border: m.role === 'ai' ? '1px solid #EBEBEB' : 'none',
                  whiteSpace: 'pre-wrap',
                  minHeight: m.role === 'ai' && m.text === '' ? '1.5rem' : undefined,
                }}>
                  {m.text || (m.role === 'ai' && isLoading
                    ? <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc', animation: 'pulse 1s infinite' }} />
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc', animation: 'pulse 1s infinite 0.2s' }} />
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc', animation: 'pulse 1s infinite 0.4s' }} />
                      </span>
                    : null)}
                </div>
              </div>
            ))}
          </div>

          {/* Suggested questions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {tc.suggested.map(q => (
              <button key={q} onClick={() => send(q)} disabled={isLoading} style={{
                padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '12px',
                border: '1px solid var(--accent)', background: 'transparent',
                color: 'var(--accent)', cursor: isLoading ? 'default' : 'pointer',
                fontWeight: 500, opacity: isLoading ? 0.5 : 1,
              }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder={tc.aiPlaceholder}
              disabled={isLoading}
              style={{
                flex: 1, padding: '0.75rem 1rem',
                background: '#F7F7F7', border: '1px solid #EBEBEB',
                borderRadius: '12px', fontSize: '14px', color: '#111', outline: 'none',
                opacity: isLoading ? 0.6 : 1,
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isLoading}
              style={{
                padding: '0.75rem 1rem', borderRadius: '12px',
                background: input.trim() && !isLoading ? 'var(--accent)' : '#E5E5E5',
                color: '#fff', border: 'none',
                cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                fontSize: '16px', transition: 'background 0.15s',
              }}
            >
              →
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

export default function ConfruntaPage() {
  return (
    <Suspense>
      <ConfruntaContent />
    </Suspense>
  );
}
