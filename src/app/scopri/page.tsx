'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { resolveUniversity, uniSlug } from '@/lib/data';
import { buildDeck } from '@/lib/scoring';
import { getTestLabel, getAdmissionInfo, isAdmissionClosed } from '@/lib/admissions';
import { IconBuilding, IconExtLink, IconAlert, IconClipboard, IconCheck, IconUndo, IconX, IconHeart, IconBookmark } from '@/components/Icons';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import Link from 'next/link';

const TIPO_STYLE: Record<string, { text: string; bg: string }> = {
  Triennale:     { text: '#1D4ED8', bg: 'rgba(239,246,255,0.9)' },
  Magistrale:    { text: '#065F46', bg: 'rgba(236,253,245,0.9)' },
  'Ciclo Unico': { text: '#5B21B6', bg: 'rgba(245,243,255,0.9)' },
};

const UNI_PHOTOS: Record<string, string> = {
  'Politecnico di Milano':                                   '/images/polimi.webp',
  'Università commerciale Luigi Bocconi di Milano':          '/images/bocconi.jpg',
  'Università degli studi di Milano':                        '/images/statale.jpg',
  'Università Cattolica del "Sacro Cuore"':                  '/images/cattolica.jpg',
  'Libera Università di Lingue e Comunicazione (IULM)':      '/images/iulm.jpg',
  'Libera Università, Vita-Salute San Raffaele di Milano':   '/images/sanraffaele.jpeg',
  'Università degli studi di Milano-Bicocca':                '/images/bicocca.jpg',
};
const FALLBACK_PHOTO = '/images/polimi.webp';

export default function ScopriPage() {
  const { user, swipeRight, swipeLeft, undoSwipe } = useAuth();
  const { t } = useLanguage();
  const ts2 = t.app.scopri;
  const router = useRouter();

  if (!user) { router.replace("/"); return null; }
  if (!user.onboarded) { router.replace("/onboarding"); return null; }

  // Deck computed once at mount via the scoring system
  const [deck] = useState(() => buildDeck(user));

  const [idx, setIdx]           = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [dragX, setDragX]       = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const [history, setHistory]   = useState<{ id: number; dir: 'left' | 'right' }[]>([]);

  const current = deck[idx];
  const next    = deck[idx + 1];

  const doSwipe = (dir: 'left' | 'right') => {
    if (!current) return;
    setSwipeDir(dir);
    if (dir === 'right') swipeRight(current.id);
    else swipeLeft(current.id);
    setHistory(h => [...h, { id: current.id, dir }]);
    setTimeout(() => {
      setIdx(i => i + 1);
      setSwipeDir(null);
      setDragX(0);
    }, 300);
  };

  const doUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    undoSwipe(last.id, last.dir === 'right');
    setHistory(h => h.slice(0, -1));
    setIdx(i => i - 1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setDragX(e.touches[0].clientX - startX.current);
  };
  const onTouchEnd = () => {
    setDragging(false);
    if (dragX > 70)       doSwipe('right');
    else if (dragX < -70) doSwipe('left');
    else                  setDragX(0);
  };

  const cardX = swipeDir
    ? swipeDir === 'right' ? '130%' : '-130%'
    : `${dragX}px`;
  const cardRot = swipeDir
    ? swipeDir === 'right' ? 15 : -15
    : dragX * 0.05;

  const likeOpacity = Math.max(0, Math.min(1, (swipeDir === 'right' ? 1 : dragX / 80)));
  const skipOpacity = Math.max(0, Math.min(1, (swipeDir === 'left'  ? 1 : -dragX / 80)));

  // ── Empty state ──────────────────────────────────────────────────
  if (!current) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            {ts2.emptyTitle}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '2rem', lineHeight: 1.6 }}>
            {ts2.emptyBody}
          </p>
          <Link href="/preferiti">
            <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.875rem 2rem', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
              {ts2.emptyCta}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const mur       = resolveUniversity(current.universita);
  const slug      = mur ? uniSlug(mur.name) : null;
  const ts        = TIPO_STYLE[current.tipo] ?? TIPO_STYLE.Triennale;
  const photo     = UNI_PHOTOS[current.universita] ?? (mur ? (UNI_PHOTOS[mur.name] ?? FALLBACK_PHOTO) : FALLBACK_PHOTO);
  const testLabel = getTestLabel(current.universita, current.classe ?? '');
  const targetYear = user.startYear || String(new Date().getFullYear());
  const admInfo = getAdmissionInfo(current.universita, current.classe ?? '', targetYear);
  const admClosed = admInfo ? isAdmissionClosed(admInfo) : false;

  return (
    <div style={{ background: '#F7F7F7', height: '100svh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar />

      {/* ── Card stack ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '8px' }}>

        {/* Next card behind */}
        {next && (
          <div style={{
            position: 'absolute', inset: '12px 16px',
            borderRadius: '24px', background: '#fff',
            border: '1px solid #E8E8E8',
            transform: 'scale(0.96)', zIndex: 0,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }} />
        )}

        {/* Current card */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position: 'absolute', inset: '4px 8px',
            borderRadius: '24px',
            background: '#fff',
            border: '1px solid #E8E8E8',
            transform: `translateX(${cardX}) rotate(${cardRot}deg)`,
            transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.25,1,0.5,1)',
            cursor: 'grab', zIndex: 2,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* SALVA / SALTA overlays */}
          <div style={{
            position: 'absolute', top: '1.5rem', left: '1.25rem',
            background: '#1B5E52', color: '#fff', borderRadius: '8px',
            padding: '0.3rem 0.875rem', fontSize: '14px', fontWeight: 800,
            opacity: likeOpacity, transform: 'rotate(-8deg)',
            letterSpacing: '0.04em', zIndex: 3,
          }}>
            {ts2.save}
          </div>
          <div style={{
            position: 'absolute', top: '1.5rem', right: '1.25rem',
            background: '#5C5C5C', color: '#fff', borderRadius: '8px',
            padding: '0.3rem 0.875rem', fontSize: '14px', fontWeight: 800,
            opacity: skipOpacity, transform: 'rotate(8deg)',
            letterSpacing: '0.04em', zIndex: 3,
          }}>
            {ts2.skip}
          </div>

          {/* Counter */}
          <div style={{
            position: 'absolute', top: '1.125rem', left: '50%', transform: 'translateX(-50%)',
            fontSize: '11px', color: '#aaa', fontWeight: 500,
            background: '#F5F5F5', borderRadius: '20px', padding: '0.2rem 0.625rem',
            zIndex: 3,
          }}>
            {idx + 1} / {deck.length}
          </div>

          {/* University accent bar */}
          <div style={{
            height: '6px', flexShrink: 0,
            background: `linear-gradient(90deg, var(--accent), ${ts.text})`,
            borderRadius: '24px 24px 0 0',
          }} />

          {/* Card content */}
          <div style={{ flex: 1, padding: '2rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {/* University name */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                {current.universita.length > 50 ? current.universita.slice(0, 48) + '…' : current.universita}
              </span>
            </div>

            {/* Course name */}
            <h2 style={{
              fontSize: 'clamp(1.375rem, 5.5vw, 1.75rem)', fontWeight: 700,
              letterSpacing: '-0.04em', color: '#111',
              lineHeight: 1.15, marginBottom: '1.5rem',
            }}>
              <Link href={`/corso/${current.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {current.nome}
              </Link>
            </h2>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '20px', background: ts.bg, color: ts.text }}>
                {current.tipo}
              </span>
              {current.area && (
                <span style={{ fontSize: '11px', color: '#666', padding: '0.3rem 0.75rem', borderRadius: '20px', background: '#F5F5F5' }}>
                  {current.area}
                </span>
              )}
              {current.durata && (
                <span style={{ fontSize: '11px', color: '#666', padding: '0.3rem 0.75rem', borderRadius: '20px', background: '#F5F5F5' }}>
                  {current.durata} anni
                </span>
              )}
              {current.lingua && current.lingua !== 'Italiano' && (
                <span style={{ fontSize: '11px', color: '#666', padding: '0.3rem 0.75rem', borderRadius: '20px', background: '#F5F5F5' }}>
                  {current.lingua}
                </span>
              )}
              {testLabel && !admClosed && (
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '20px',
                  background: testLabel === 'Nessuno' ? '#F5F5F5' : 'rgba(251,191,36,0.15)',
                  color: testLabel === 'Nessuno' ? '#888' : '#92400E',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}>
                  {testLabel === 'Nessuno'
                    ? <><IconCheck size={11} strokeWidth={2.5} /> Accesso libero</>
                    : <><IconClipboard size={11} strokeWidth={1.75} /> {testLabel}</>}
                </span>
              )}
              {admClosed && (
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '20px',
                  background: '#FFF1F1', color: '#EF4444',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}>
                  <IconAlert size={12} strokeWidth={2} /> Ammissioni chiuse
                </span>
              )}
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {slug && (
                <Link href={`/universita/${slug}`} style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <IconBuilding size={13} strokeWidth={1.75} /> Vedi università
                </Link>
              )}
              {current.url && (
                <a href={current.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#999', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <IconExtLink size={13} strokeWidth={1.75} /> Sito ufficiale
                </a>
              )}
            </div>
          </div>

          {/* Hint */}
          <p style={{ fontSize: '10px', color: '#ccc', textAlign: 'center', padding: '0 1rem 1.25rem', letterSpacing: '0.02em' }}>
            {ts2.hint}
          </p>
        </div>
      </div>

      {/* ── Buttons ── */}
      <div style={{
        padding: '0.875rem 0 calc(0.875rem + env(safe-area-inset-bottom))',
        display: 'flex', gap: '1.25rem', justifyContent: 'center', alignItems: 'center',
        background: '#F7F7F7', borderTop: '1px solid #EBEBEB',
      }}>
        <button onClick={doUndo} disabled={history.length === 0} style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#fff', border: `1.5px solid ${history.length === 0 ? '#E5E5E5' : '#BBB'}`,
          cursor: history.length === 0 ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          color: history.length === 0 ? '#CCC' : '#555',
          transition: 'all 0.15s',
        }}>
          <IconUndo size={22} strokeWidth={1.75} />
        </button>
        <button onClick={() => doSwipe('left')} style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: '#fff', border: '1.5px solid #E5E5E5',
          cursor: 'pointer', color: '#888',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <IconX size={24} strokeWidth={2} />
        </button>
        <button onClick={() => doSwipe('right')} style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'var(--accent)', border: 'none',
          cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(27,94,82,0.35)',
        }}>
          <IconHeart size={28} strokeWidth={1.75} />
        </button>
        <Link href="/preferiti">
          <button style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#fff', border: '1.5px solid #E5E5E5',
            cursor: 'pointer', color: '#555',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <IconBookmark size={22} strokeWidth={1.75} />
          </button>
        </Link>
      </div>
    </div>
  );
}

function TopBar() {
  const { t } = useLanguage();
  const ts2 = t.app.scopri;
  return (
    <header style={{
      position: 'relative', zIndex: 10,
      background: '#F7F7F7',
      borderBottom: '1px solid #EBEBEB',
      padding: '0.875rem 1.25rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div>
        <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>{ts2.title}</h1>
        <p style={{ fontSize: '11px', color: '#aaa' }}>{ts2.subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <LanguageSwitcher />
        <Link href="/preferiti" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
          {ts2.savedLink}
        </Link>
      </div>
    </header>
  );
}
