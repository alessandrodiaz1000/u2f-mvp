'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { MILAN_COURSES, resolveUniversity, uniSlug } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import type { Lang } from '@/i18n/translations';

const TIPO_STYLE: Record<string, { text: string; bg: string }> = {
  Triennale:     { text: '#1D4ED8', bg: '#EFF6FF' },
  Magistrale:    { text: '#065F46', bg: '#ECFDF5' },
  'Ciclo Unico': { text: '#5B21B6', bg: '#F5F3FF' },
};

function generateOverview(courses: typeof MILAN_COURSES, lang: Lang): string {
  if (courses.length < 2) return '';
  const names = courses.map(c => `"${c.nome}"`).join(', ');
  const unis = Array.from(new Set(courses.map(c => c.universita.split(' ').slice(0, 3).join(' '))));
  const tipos = Array.from(new Set(courses.map(c => c.tipo)));
  const durate = courses.map(c => c.durata).filter(Boolean);
  const lingue = Array.from(new Set(courses.map(c => c.lingua).filter(Boolean)));
  const aree = Array.from(new Set(courses.map(c => c.area).filter(Boolean)));

  const it = lang === 'it';
  let text = it ? `Stai confrontando ${names}.\n\n` : `You're comparing ${names}.\n\n`;

  if (unis.length > 1) {
    text += it
      ? `Si tratta di corsi offerti da atenei diversi (${unis.join(', ')}), il che significa ambienti accademici, reti alumni e culture universitarie distinte.\n\n`
      : `These are courses from different universities (${unis.join(', ')}), meaning distinct academic environments, alumni networks and university cultures.\n\n`;
  } else {
    text += it
      ? `Tutti i corsi sono offerti dallo stesso ateneo — la scelta dipenderà quindi principalmente dall'area di studio e dagli sbocchi lavorativi.\n\n`
      : `All courses are offered by the same university — the choice will mainly depend on the area of study and career prospects.\n\n`;
  }

  if (tipos.length > 1) {
    text += it
      ? `I corsi hanno tipologie diverse (${tipos.join(', ')}): tieni conto che un ciclo triennale ti permette di entrare prima nel mondo del lavoro, mentre una magistrale o un ciclo unico offrono una specializzazione più profonda.\n\n`
      : `The courses have different types (${tipos.join(', ')}): a bachelor's degree lets you enter the workforce sooner, while a master's or single-cycle degree offers deeper specialisation.\n\n`;
  }

  if (durate.length > 0) {
    const unique = Array.from(new Set(durate));
    if (unique.length > 1) {
      text += it
        ? `Le durate variano (${unique.join(', ')} anni), quindi considera anche il tempo di investimento complessivo.\n\n`
        : `Durations vary (${unique.join(', ')} years), so consider the overall time investment too.\n\n`;
    }
  }

  if (lingue.length > 1) {
    text += it
      ? `Alcuni corsi sono in lingua diversa dall'italiano — un fattore rilevante sia per le opportunità internazionali che per il livello di inglese richiesto.\n\n`
      : `Some courses are taught in a language other than Italian — a relevant factor for international opportunities and the English level required.\n\n`;
  }

  if (aree.length > 1) {
    text += it
      ? `Le aree disciplinari sono diverse (${aree.join(', ')}): se sei ancora indeciso sull'ambito, ti consiglio di esplorare i piani di studio ufficiali e, se possibile, parlare con studenti già iscritti.`
      : `The subject areas are different (${aree.join(', ')}): if you're still undecided on the field, I recommend exploring the official study plans and, if possible, talking to current students.`;
  } else if (aree.length === 1) {
    text += it
      ? `Tutti i corsi appartengono all'area ${aree[0]} — la differenza principale sarà nell'approccio didattico, nel taglio teorico vs pratico, e nella reputazione dell'ateneo nel settore.`
      : `All courses belong to the ${aree[0]} area — the main difference will be in the teaching approach, theoretical vs practical focus, and the university's reputation in the sector.`;
  }

  return text.trim();
}

function generateAnswer(question: string, courses: typeof MILAN_COURSES, lang: Lang): string {
  const q = question.toLowerCase();
  const it = lang === 'it';
  if (q.includes('sbocch') || q.includes('lavor') || q.includes('career') || q.includes('prospect')) {
    return it
      ? `Gli sbocchi lavorativi dipendono molto dall'ateneo e dalla specializzazione. In generale, ${courses.map(c => `"${c.nome}"`).join(' e ')} aprono percorsi nel settore ${courses[0]?.area ?? 'di riferimento'}. Per i dettagli sui placement rate e le aziende partner, visita i siti ufficiali dei singoli corsi.`
      : `Career prospects depend heavily on the university and specialisation. In general, ${courses.map(c => `"${c.nome}"`).join(' and ')} open paths in the ${courses[0]?.area ?? 'relevant'} sector. For details on placement rates and partner companies, visit the official course websites.`;
  }
  if (q.includes('difficil') || q.includes('esam') || q.includes('hard')) {
    return it
      ? `Il livello di difficoltà varia molto da studente a studente. La sezione Esami è in arrivo: presto potrai vedere i voti medi, i CFU per anno e le testimonianze di studenti. Per ora ti consiglio i forum di Studentville o Reddit per opinioni dirette.`
      : `Difficulty varies greatly from student to student. The Exams section is coming soon: you'll be able to see average grades, CFUs per year and student testimonials. For now, check Studentville or Reddit forums for direct opinions.`;
  }
  if (q.includes('miglio') || q.includes('quale scegl') || q.includes('consig') || q.includes('recommend') || q.includes('which')) {
    return it
      ? `Non esiste una risposta universale — dipende dai tuoi obiettivi. Se cerchi rigore tecnico e rete industriale, valuta il percorso più focalizzato. Se vuoi flessibilità e visione ampia, scegli quello con più aree di studio. Parla con studenti attuali tramite la sezione "Persone".`
      : `There's no universal answer — it depends on your goals. If you want technical rigour and an industry network, consider the more focused programme. If you want flexibility and broad exposure, choose the one with more study areas. Talk to current students via the "People" section.`;
  }
  if (q.includes('cost') || q.includes('tass') || q.includes('borsa') || q.includes('fee') || q.includes('tuition')) {
    return it
      ? `Le tasse universitarie a Milano variano: gli atenei statali applicano tasse proporzionali al reddito ISEE (in genere 0–3.500€/anno), mentre quelli privati hanno rette fisse più elevate (5.000–20.000€/anno). Controlla i siti ufficiali per i dati aggiornati e le borse di studio disponibili.`
      : `University fees in Milan vary: state universities apply fees proportional to ISEE income (generally €0–3,500/year), while private ones have higher fixed fees (€5,000–20,000/year). Check the official websites for up-to-date data and available scholarships.`;
  }
  if (q.includes('lingua') || q.includes('english') || q.includes('inglese') || q.includes('language')) {
    const engCourses = courses.filter(c => c.lingua && c.lingua !== 'Italiano');
    if (engCourses.length > 0) {
      return it
        ? `${engCourses.map(c => `"${c.nome}"`).join(' e ')} ${engCourses.length === 1 ? 'è erogato' : 'sono erogati'} in inglese — un vantaggio per chi vuole un percorso internazionale o punta a master/lavoro all'estero.`
        : `${engCourses.map(c => `"${c.nome}"`).join(' and ')} ${engCourses.length === 1 ? 'is taught' : 'are taught'} in English — an advantage for those seeking an international path or aiming for a master's/job abroad.`;
    }
    return it
      ? `Tra i corsi selezionati, tutti o quasi sono in italiano. Se cerchi un percorso internazionale, considera anche i corsi in inglese nella sezione Cerca.`
      : `Among the selected courses, all or most are in Italian. If you're looking for an international path, also consider English-taught courses in the Search section.`;
  }
  return it
    ? `Ottima domanda. Per "${question}" ti consiglio di approfondire visitando i siti ufficiali dei corsi e confrontando i piani di studio completi. La nostra AI overview è ancora in fase di sviluppo — presto potrà rispondere con dati aggiornati direttamente dai siti universitari.`
    : `Great question. For "${question}" I recommend diving deeper by visiting the official course websites and comparing the full study plans. Our AI overview is still in development — it will soon be able to answer with data pulled directly from university websites.`;
}

function ConfruntaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const tc = t.app.confronta;
  const ids = (searchParams.get('ids') ?? '').split(',').map(Number).filter(Boolean);
  const courses = MILAN_COURSES.filter(c => ids.includes(c.id));

  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>(() => {
    const overview = generateOverview(courses, lang);
    return overview ? [{ role: 'ai', text: overview }] : [];
  });
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  if (courses.length < 2) {
    return (
      <div style={{ minHeight: '100svh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: '#666', marginBottom: '1.5rem' }}>{tc.minCourses}</p>
        <Link href="/preferiti" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>{tc.backToSaved}</Link>
      </div>
    );
  }

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user' as const, text: text.trim() };
    const aiMsg = { role: 'ai' as const, text: generateAnswer(text, courses, lang) };
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    setTimeout(() => chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 100);
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
          {/* Course name headers */}
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

          {/* Rows */}
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
                  {row.label === 'Sito' ? (
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

          {/* Uni links row */}
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
            padding: '1rem', maxHeight: '320px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            marginBottom: '0.75rem',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '88%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? 'var(--accent)' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#222',
                  fontSize: '13px', lineHeight: 1.55,
                  border: m.role === 'ai' ? '1px solid #EBEBEB' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Suggested questions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {tc.suggested.map(q => (
              <button key={q} onClick={() => send(q)} style={{
                padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '12px',
                border: '1px solid var(--accent)', background: 'transparent',
                color: 'var(--accent)', cursor: 'pointer', fontWeight: 500,
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
              style={{
                flex: 1, padding: '0.75rem 1rem',
                background: '#F7F7F7', border: '1px solid #EBEBEB',
                borderRadius: '12px', fontSize: '14px', color: '#111', outline: 'none',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              style={{
                padding: '0.75rem 1rem', borderRadius: '12px',
                background: input.trim() ? 'var(--accent)' : '#E5E5E5',
                color: '#fff', border: 'none', cursor: input.trim() ? 'pointer' : 'default',
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
