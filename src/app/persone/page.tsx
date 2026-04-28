'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

type Tab = 'peer' | 'tutor';

const UNIS = [
  'Politecnico di Milano', 'Università Bocconi', 'Università degli Studi di Milano',
  'Università Cattolica', 'IULM', 'Vita-Salute San Raffaele', 'Università Bicocca', 'Altra',
];
const YEARS = ['1°', '2°', '3°', '4°', '5°', 'Magistrale'];

export default function PersonePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const tpe = t.app.persone;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('peer');

  // Peer state
  const [peerJoined, setPeerJoined] = useState(false);
  const [showPeerForm, setShowPeerForm] = useState(false);
  const [peerConsent, setPeerConsent] = useState(false);

  // Tutor state
  const [tutorJoined, setTutorJoined] = useState(false);
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [tutorUni, setTutorUni] = useState('');
  const [tutorYear, setTutorYear] = useState('');
  const [tutorCorso, setTutorCorso] = useState('');
  const [tutorBio, setTutorBio] = useState('');

  if (!user) { router.replace("/"); return null; }
  if (!user.onboarded) { router.replace("/onboarding"); return null; }

  const canSubmitTutor = tutorUni && tutorYear && tutorCorso.trim().length > 3 && tutorBio.trim().length > 10;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '1rem 1.25rem',
      }}>
        <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '0.875rem' }}>
          {tpe.title}
        </h1>
        <div style={{ display: 'flex', gap: 0, background: 'var(--bg)', borderRadius: '10px', padding: '3px' }}>
          {(['peer', 'tutor'] as Tab[]).map(tb => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
              background: tab === tb ? 'var(--surface)' : 'transparent',
              color: tab === tb ? 'var(--text-1)' : 'var(--text-3)',
              fontSize: '13px', fontWeight: tab === tb ? 600 : 400,
              cursor: 'pointer',
              boxShadow: tab === tb ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
              {tb === 'peer' ? tpe.tabPeer : tpe.tabTutor}
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {tab === 'peer' ? (
          <>
            {/* Peer empty / joined state */}
            {!peerJoined ? (
              <div style={{
                background: 'var(--surface)', borderRadius: '20px',
                border: '1px solid var(--border)', padding: '2rem 1.5rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧊</div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                  {tpe.peerBreakIce}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {tpe.peerSubtitle}
                </p>
                {!showPeerForm ? (
                  <button onClick={() => setShowPeerForm(true)} style={{
                    background: 'var(--accent)', color: '#fff', border: 'none',
                    borderRadius: '12px', padding: '0.875rem 1.75rem',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}>
                    {tpe.peerJoin}
                  </button>
                ) : (
                  <div style={{ textAlign: 'left' }}>
                    {/* Preview card */}
                    <div style={{
                      background: 'var(--bg)', borderRadius: '14px',
                      border: '1.5px solid var(--accent)', padding: '1rem',
                      marginBottom: '1.25rem',
                    }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '16px', fontWeight: 700,
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '3px' }}>{user.name}</div>
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                            {[...user.areas.slice(0, 2), user.city].filter(Boolean).map(tag => (
                              <span key={tag} style={{ fontSize: '10px', color: 'var(--text-3)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.1rem 0.375rem' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Consent */}
                    <button
                      onClick={() => setPeerConsent(p => !p)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left', padding: 0, marginBottom: '1.25rem', width: '100%',
                      }}
                    >
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                        border: `1.5px solid ${peerConsent ? 'var(--accent)' : 'var(--border-2)'}`,
                        background: peerConsent ? 'var(--accent)' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: '1px',
                      }}>
                        {peerConsent && (
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.55 }}>
                        {tpe.peerConsentText}
                      </p>
                    </button>

                    <button
                      onClick={() => { if (peerConsent) setPeerJoined(true); }}
                      disabled={!peerConsent}
                      style={{
                        width: '100%', padding: '0.875rem',
                        background: peerConsent ? 'var(--accent)' : 'var(--border)',
                        color: peerConsent ? '#fff' : 'var(--text-3)',
                        border: 'none', borderRadius: '12px',
                        fontSize: '14px', fontWeight: 600,
                        cursor: peerConsent ? 'pointer' : 'default',
                      }}
                    >
                      {tpe.peerConfirm}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Joined state */}
                <div style={{
                  background: 'var(--accent-bg)', borderRadius: '16px',
                  border: '1px solid var(--accent)', padding: '1rem 1.125rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <span style={{ fontSize: '1.25rem' }}>✅</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{tpe.peerJoinedTitle}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>
                      {tpe.peerJoinedSub}
                    </div>
                  </div>
                </div>

                {/* Their own card */}
                <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '18px', fontWeight: 700,
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>{user.name}</span>
                        <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-bg)', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>TU</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {[...user.areas, user.city, user.diploma].filter(Boolean).map(tag => (
                          <span key={tag} style={{ fontSize: '10px', color: 'var(--text-3)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.1rem 0.375rem' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1.5px dashed var(--border)', padding: '1.25rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.55 }}>
                    {tpe.peerMoreComing}
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Tutor tab */}
            {!tutorJoined ? (
              <>
                <div style={{
                  background: 'var(--surface)', borderRadius: '20px',
                  border: '1px solid var(--border)', padding: '2rem 1.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                    {tpe.tutorTitle}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {tpe.tutorSubtitle}
                  </p>
                  {!showTutorForm && (
                    <button onClick={() => setShowTutorForm(true)} style={{
                      background: 'var(--accent)', color: '#fff', border: 'none',
                      borderRadius: '12px', padding: '0.875rem 1.75rem',
                      fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    }}>
                      {tpe.tutorRegister}
                    </button>
                  )}
                </div>

                {showTutorForm && (
                  <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
                      {tpe.tutorProfileTitle}
                    </h3>

                    {/* Università */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                        {tpe.tutorUniLabel}
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {UNIS.map(u => (
                          <button key={u} onClick={() => setTutorUni(u)} style={{
                            padding: '0.375rem 0.875rem', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                            border: `1px solid ${tutorUni === u ? 'var(--accent)' : 'var(--border)'}`,
                            background: tutorUni === u ? 'var(--accent)' : 'var(--bg)',
                            color: tutorUni === u ? '#fff' : 'var(--text-2)',
                            cursor: 'pointer', transition: 'all 0.12s',
                          }}>
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Anno */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                        {tpe.tutorYearLabel}
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {YEARS.map(y => (
                          <button key={y} onClick={() => setTutorYear(y)} style={{
                            padding: '0.375rem 0.875rem', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                            border: `1px solid ${tutorYear === y ? 'var(--accent)' : 'var(--border)'}`,
                            background: tutorYear === y ? 'var(--accent)' : 'var(--bg)',
                            color: tutorYear === y ? '#fff' : 'var(--text-2)',
                            cursor: 'pointer', transition: 'all 0.12s',
                          }}>
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Corso */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                        {tpe.tutorCorsoLabel}
                      </label>
                      <input
                        type="text" value={tutorCorso} onChange={e => setTutorCorso(e.target.value)}
                        placeholder={tpe.tutorCorsoPlaceholder}
                        className="ui-input"
                      />
                    </div>

                    {/* Bio */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                        {tpe.tutorBioLabel}
                      </label>
                      <textarea
                        value={tutorBio} onChange={e => setTutorBio(e.target.value)}
                        placeholder={tpe.tutorBioPlaceholder}
                        rows={3}
                        style={{
                          width: '100%', padding: '0.75rem 1rem',
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: '10px', fontSize: '14px', color: 'var(--text-1)',
                          outline: 'none', resize: 'none', lineHeight: 1.5,
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>

                    <button
                      onClick={() => { if (canSubmitTutor) setTutorJoined(true); }}
                      disabled={!canSubmitTutor}
                      style={{
                        width: '100%', padding: '0.875rem',
                        background: canSubmitTutor ? 'var(--accent)' : 'var(--border)',
                        color: canSubmitTutor ? '#fff' : 'var(--text-3)',
                        border: 'none', borderRadius: '12px',
                        fontSize: '14px', fontWeight: 600,
                        cursor: canSubmitTutor ? 'pointer' : 'default',
                        transition: 'background 0.15s',
                      }}
                    >
                      {tpe.tutorSubmit}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Tutor joined state */}
                <div style={{
                  background: 'var(--accent-bg)', borderRadius: '16px',
                  border: '1px solid var(--accent)', padding: '1rem 1.125rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  marginBottom: '0.25rem',
                }}>
                  <span style={{ fontSize: '1.25rem' }}>🎉</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{tpe.tutorSentTitle}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>
                      {tpe.tutorSentSub}
                    </div>
                  </div>
                </div>

                {/* Tutor card preview */}
                <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '18px', fontWeight: 700,
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>{user.name}</span>
                        <span style={{ fontSize: '10px', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '0.1rem 0.4rem', fontWeight: 500 }}>
                          {tpe.tutorUnderReview}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500, marginBottom: '2px' }}>{tutorCorso}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{tutorUni} · {tpe.tutorYearPrefix} {tutorYear}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55 }}>{tutorBio}</p>
                </div>

                <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1.5px dashed var(--border)', padding: '1.25rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.55 }}>
                    {tpe.tutorMoreComing}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
