'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { U2FLogo } from '@/components/U2FLogo';

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

const TOTAL_STEPS = 5;

function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '2.5rem' }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} style={{
          height: '4px', flex: 1, borderRadius: '2px',
          background: i < step ? 'var(--accent)' : 'var(--border)',
          transition: 'background 0.3s ease',
        }} />
      ))}
    </div>
  );
}

function OptionGrid({ options, selected, onSelect, multi = false }: {
  options: string[]; selected: string | string[];
  onSelect: (v: string) => void; multi?: boolean;
}) {
  const isSelected = (v: string) =>
    multi ? (selected as string[]).includes(v) : selected === v;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          style={{
            padding: '0.75rem 1.125rem', borderRadius: '12px', fontSize: '14px',
            fontWeight: isSelected(opt) ? 600 : 400,
            border: `1.5px solid ${isSelected(opt) ? 'var(--accent)' : 'var(--border)'}`,
            background: isSelected(opt) ? 'var(--accent-bg)' : 'var(--surface)',
            color: isSelected(opt) ? 'var(--accent)' : 'var(--text-1)',
            cursor: 'pointer', transition: 'all 0.12s',
            letterSpacing: '-0.01em',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const { t } = useLanguage();
  const to = t.app.onboarding;
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [areas, setAreas]       = useState<string[]>([]);
  const [diploma, setDiploma]   = useState('');
  const [city, setCity]         = useState('');
  const [cityCustom, setCityCustom] = useState('');
  const [degree, setDegree]     = useState('');

  if (!user) { router.replace('/login'); return null; }
  if (user.onboarded) { router.replace('/dashboard'); return null; }

  const firstName = user.name.split(' ')[0];

  const canNext = [
    true,              // step 1 = benvenuto
    areas.length > 0,  // step 2
    !!diploma,      // step 3
    !!(city && (city !== 'Altra città' || cityCustom)), // step 4
    !!degree,       // step 5
  ][step - 1];

  const next = () => {
    if (step < TOTAL_STEPS) { setStep(s => s + 1); return; }
    completeOnboarding({
      areas, diploma,
      city: city === 'Altra città' ? cityCustom : city,
      degreeType: degree,
    });
    router.push('/dashboard');
  };

  const STEPS = [
    /* 1 — Welcome */
    <div key="1">
      <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>👋</div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-1)', marginBottom: '1rem', lineHeight: 1.15, whiteSpace: 'pre-line' }}>
        {to.welcomeTitle(firstName)}
      </h2>
      <p style={{ fontSize: '0.9375rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
        {to.welcomeBody}
      </p>
    </div>,

    /* 2 — Area di interesse */
    <div key="2">
      <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-1)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {to.areasTitle}
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>{to.areasSub}</p>
      <OptionGrid options={AREAS} selected={areas} onSelect={v => setAreas(prev => prev.includes(v) ? prev.filter(a => a !== v) : [...prev, v])} multi />
    </div>,

    /* 3 — Tipo di diploma */
    <div key="3">
      <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-1)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {to.diplomaTitle}
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>{to.diplomaSub}</p>
      <OptionGrid options={DIPLOMAS} selected={diploma} onSelect={setDiploma} />
    </div>,

    /* 4 — Città */
    <div key="4">
      <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-1)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {to.cityTitle}
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>
        {to.citySub}
      </p>
      <OptionGrid options={CITIES} selected={city} onSelect={setCity} />
      {city === 'Altra città' && (
        <input
          type="text" value={cityCustom} onChange={e => setCityCustom(e.target.value)}
          placeholder={to.cityPlaceholder}
          className="ui-input"
          style={{ marginTop: '1rem' }}
          autoFocus
        />
      )}
    </div>,

    /* 5 — Tipo di laurea */
    <div key="5">
      <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-1)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {to.degreeTitle}
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>
        {to.degreeSub}
      </p>
      <OptionGrid options={DEGREES} selected={degree} onSelect={setDegree} />
    </div>,
  ];

  return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '3rem 1.5rem 2rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <U2FLogo size={28} />
        <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>
          {step} / {TOTAL_STEPS}
        </span>
      </div>

      <ProgressDots step={step} />

      {/* Step content */}
      <div style={{ flex: 1 }}>
        {STEPS[step - 1]}
      </div>

      {/* Footer nav */}
      <div style={{ paddingTop: '2rem', display: 'flex', gap: '0.75rem' }}>
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              flex: '0 0 auto', padding: '1rem 1.25rem',
              background: 'var(--surface)', color: 'var(--text-2)',
              border: '1.5px solid var(--border)', borderRadius: '14px',
              fontSize: '15px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            ←
          </button>
        )}
        <button
          onClick={next}
          disabled={!canNext}
          style={{
            flex: 1, padding: '1rem',
            background: canNext ? 'var(--accent)' : 'var(--border)',
            color: canNext ? '#fff' : 'var(--text-3)',
            border: 'none', borderRadius: '14px',
            fontSize: '16px', fontWeight: 600,
            cursor: canNext ? 'pointer' : 'default',
            letterSpacing: '-0.02em', transition: 'background 0.15s',
          }}
        >
          {step === TOTAL_STEPS ? to.start : to.next}
        </button>
      </div>
    </div>
  );
}
