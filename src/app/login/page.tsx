'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { U2FLogo } from '@/components/U2FLogo';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const { login, logout, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw]       = useState('');
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      login(email.trim(), name.trim() || email.split('@')[0]);
      router.push('/onboarding');
    }, 600);
  };

  // Already logged in — show resume/logout options instead of instant redirect
  if (user) {
    return (
      <div style={{
        minHeight: '100svh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        padding: '0 1.5rem',
      }}>
        <div style={{ paddingTop: '3.5rem', marginBottom: '3rem' }}>
          <U2FLogo size={44} />
        </div>

        <h1 style={{
          fontSize: 'clamp(1.5rem, 7vw, 2rem)', fontWeight: 700,
          letterSpacing: '-0.04em', color: 'var(--text-1)',
          marginBottom: '0.5rem',
        }}>
          Ciao, {user.name.split(' ')[0]}.
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          Hai già una sessione attiva.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => router.push(user.onboarded ? '/dashboard' : '/onboarding')}
            style={{
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: '14px',
              padding: '1rem', fontSize: '16px', fontWeight: 600,
              cursor: 'pointer', letterSpacing: '-0.02em',
            }}
          >
            Continua come {user.name.split(' ')[0]} →
          </button>
          <button
            onClick={() => { logout(); router.push('/'); }}
            style={{
              background: 'transparent', color: 'var(--text-2)',
              border: '1.5px solid var(--border-2)', borderRadius: '14px',
              padding: '1rem', fontSize: '15px', fontWeight: 500,
              cursor: 'pointer', letterSpacing: '-0.01em',
            }}
          >
            Esci e usa un altro account
          </button>
        </div>

        <div style={{ flex: 1 }} />
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', color: 'var(--text-3)', paddingBottom: '2rem',
            textAlign: 'center',
          }}
        >
          ← Torna alla home
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '0 1.5rem',
    }}>
      {/* Back button */}
      <div style={{ paddingTop: '1.25rem' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            fontSize: '14px', color: 'var(--text-2)', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.25rem 0',
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Indietro
        </button>
      </div>

      {/* Top */}
      <div style={{ paddingTop: '2rem', marginBottom: '3rem' }}>
        <U2FLogo size={44} />
      </div>

      <h1 style={{
        fontSize: 'clamp(1.875rem, 8vw, 2.5rem)', fontWeight: 700,
        letterSpacing: '-0.045em', lineHeight: 1.1,
        color: 'var(--text-1)', marginBottom: '0.625rem',
      }}>
        {mode === 'signup' ? 'Crea il tuo profilo.' : 'Bentornato.'}
      </h1>
      <p style={{ fontSize: '0.9375rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
        {mode === 'signup'
          ? 'Gratis. Nessuna carta di credito. Pronto in 2 minuti.'
          : 'Accedi per continuare il tuo percorso.'}
      </p>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {mode === 'signup' && (
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: '0.375rem' }}>
              Come ti chiami?
            </label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Nome e cognome"
              className="ui-input"
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: '0.375rem' }}>
            Email
          </label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="la-tua@email.com"
            className="ui-input"
            required autoComplete="email"
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: '0.375rem' }}>
            Password
          </label>
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="••••••••"
            className="ui-input"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          style={{
            marginTop: '0.5rem',
            background: loading ? 'var(--border-2)' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: '14px',
            padding: '1rem', fontSize: '16px', fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            letterSpacing: '-0.02em', transition: 'background 0.15s',
          }}
        >
          {loading ? '…' : mode === 'signup' ? 'Inizia →' : 'Accedi →'}
        </button>
      </form>

      {/* Toggle */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-3)' }}>
          {mode === 'signup' ? 'Hai già un account? ' : 'Non hai un account? '}
        </span>
        <button
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {mode === 'signup' ? 'Accedi' : 'Registrati'}
        </button>
      </div>

      <div style={{ flex: 1 }} />
      <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', paddingBottom: '2rem', lineHeight: 1.5 }}>
        Continuando accetti i termini di servizio.<br />I tuoi dati non vengono condivisi con terze parti.
      </p>
    </div>
  );
}
