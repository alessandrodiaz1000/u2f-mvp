'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { U2FLogo } from '@/components/U2FLogo';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw]       = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in
  if (user) {
    router.replace(user.onboarded ? '/dashboard' : '/onboarding');
    return null;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      login(email.trim(), name.trim() || email.split('@')[0]);
      router.push('/onboarding');
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '0 1.5rem',
    }}>
      {/* Top */}
      <div style={{ paddingTop: '3.5rem', marginBottom: '3rem' }}>
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

      {/* Divider */}
      <div style={{ flex: 1 }} />
      <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', paddingBottom: '2rem', lineHeight: 1.5 }}>
        Continuando accetti i termini di servizio.<br />I tuoi dati non vengono condivisi con terze parti.
      </p>
    </div>
  );
}
