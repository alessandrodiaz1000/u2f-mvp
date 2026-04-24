'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const AREAS = [
  'Ingegneria', 'Informatica & AI', 'Matematica', 'Fisica', 'Chimica',
  'Biologia & Biotecnologie', 'Medicina', 'Farmacia & Scienze Farmaceutiche',
  'Architettura & Design', 'Economia & Management', 'Finanza & Banking',
  'Marketing & Comunicazione', 'Giurisprudenza', 'Scienze Politiche & Relazioni Internazionali',
  'Psicologia', 'Scienze dell\'Educazione', 'Lingue & Letterature',
  'Storia, Filosofia & Sociologia', 'Arte & Moda', 'Musica & Spettacolo',
  'Scienze Ambientali & Agraria', 'Nutrizione & Alimentazione',
];
const DIPLOMAS = ['Liceo Scientifico', 'Liceo Classico', 'ITI', 'ITC', 'Liceo Linguistico', 'Liceo Artistico', 'Altro'];
const DEGREES  = ['Triennale', 'Magistrale', 'Ciclo Unico', 'Non so ancora'];
const CITIES   = ['Milano', 'Roma', 'Torino', 'Napoli', 'Bologna', 'Firenze', 'Altra città'];

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.625rem 1rem', borderRadius: '12px', fontSize: '13px',
      fontWeight: active ? 600 : 400,
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent-bg)' : 'var(--surface)',
      color: active ? 'var(--accent)' : 'var(--text-1)',
      cursor: 'pointer', transition: 'all 0.12s',
    }}>
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function ProfiloPage() {
  const { user, completeOnboarding, logout } = useAuth();
  const { t } = useLanguage();
  const tp = t.app.profilo;
  const router = useRouter();

  if (!user?.onboarded) { router.replace('/login'); return null; }

  const [areas, setAreas]       = useState<string[]>(user.areas ?? []);
  const [diploma, setDiploma]   = useState(user.diploma ?? '');
  const [city, setCity]         = useState(
    CITIES.includes(user.city) ? user.city : user.city ? 'Altra città' : ''
  );
  const [cityCustom, setCityCustom] = useState(
    CITIES.includes(user.city) ? '' : (user.city ?? '')
  );
  const [degree, setDegree]     = useState(user.degreeType ?? '');
  const [saved, setSaved]       = useState(false);

  const toggleArea = (a: string) =>
    setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const save = () => {
    completeOnboarding({
      areas,
      diploma,
      city: city === 'Altra città' ? cityCustom : city,
      degreeType: degree,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const canSave = areas.length > 0 && diploma && city && (city !== 'Altra città' || cityCustom) && degree;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-2)', padding: '0.25rem' }}>
            ←
          </button>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{tp.title}</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>{user.name}</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={!canSave}
          style={{
            padding: '0.5rem 1.125rem', borderRadius: '10px',
            background: saved ? '#22c55e' : canSave ? 'var(--accent)' : 'var(--border)',
            color: canSave || saved ? '#fff' : 'var(--text-3)',
            border: 'none', fontSize: '13px', fontWeight: 600,
            cursor: canSave ? 'pointer' : 'default',
            transition: 'background 0.2s',
          }}
        >
          {saved ? tp.saved : tp.save}
        </button>
      </header>

      <div style={{ padding: '1.5rem 1.25rem' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 700, flexShrink: 0,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{user.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{user.email}</div>
          </div>
        </div>

        {/* Aree di interesse */}
        <Section title={tp.sectionAreas}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {AREAS.map(a => (
              <Chip key={a} label={a} active={areas.includes(a)} onClick={() => toggleArea(a)} />
            ))}
          </div>
        </Section>

        {/* Diploma */}
        <Section title={tp.sectionSchool}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {DIPLOMAS.map(d => (
              <Chip key={d} label={d} active={diploma === d} onClick={() => setDiploma(d)} />
            ))}
          </div>
        </Section>

        {/* Città */}
        <Section title={tp.sectionCity}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {CITIES.map(c => (
              <Chip key={c} label={c} active={city === c} onClick={() => setCity(c)} />
            ))}
          </div>
          {city === 'Altra città' && (
            <input
              type="text" value={cityCustom} onChange={e => setCityCustom(e.target.value)}
              placeholder={t.app.onboarding.cityPlaceholder}
              className="ui-input"
              style={{ marginTop: '0.75rem' }}
            />
          )}
        </Section>

        {/* Tipo di laurea */}
        <Section title={tp.sectionDegree}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {DEGREES.map(d => (
              <Chip key={d} label={d} active={degree === d} onClick={() => setDegree(d)} />
            ))}
          </div>
        </Section>

        {/* Danger zone */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => { logout(); router.push('/'); }}
            style={{
              width: '100%', padding: '0.875rem',
              background: 'none', border: '1.5px solid #FECACA',
              borderRadius: '12px', fontSize: '14px', fontWeight: 500,
              color: '#DC2626', cursor: 'pointer',
            }}
          >
            {tp.logout}
          </button>
        </div>
      </div>
    </div>
  );
}
