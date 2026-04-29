'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { U2FLogo } from '@/components/U2FLogo';

const AREAS_IT = [
  'Ingegneria', 'Informatica & AI', 'Matematica', 'Fisica', 'Chimica',
  'Biologia & Biotecnologie', 'Medicina', 'Farmacia & Scienze Farmaceutiche',
  'Architettura & Design', 'Economia & Management', 'Finanza & Banking',
  'Marketing & Comunicazione', 'Giurisprudenza', 'Scienze Politiche & Relazioni Internazionali',
  'Psicologia', "Scienze dell'Educazione", 'Lingue & Letterature',
  'Storia, Filosofia & Sociologia', 'Arte & Moda', 'Musica & Spettacolo',
  'Scienze Ambientali & Agraria', 'Nutrizione & Alimentazione',
];

const DIPLOMAS = ['Liceo Scientifico', 'Liceo Classico', 'ITI', 'ITC', 'Liceo Linguistico', 'Liceo Artistico', 'Altro'];
const CITIES   = ['Milano', 'Roma', 'Torino', 'Napoli', 'Bologna', 'Firenze'];

const TOTAL_STEPS = 6; // 0=lang, 1=welcome, 2=areas, 3=diploma, 4=city, 5=degree

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
  options: { value: string; label: string }[];
  selected: string | string[];
  onSelect: (v: string) => void;
  multi?: boolean;
}) {
  const isSelected = (v: string) =>
    multi ? (selected as string[]).includes(v) : selected === v;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          style={{
            padding: '0.75rem 1.125rem', borderRadius: '12px', fontSize: '14px',
            fontWeight: isSelected(opt.value) ? 600 : 400,
            border: `1.5px solid ${isSelected(opt.value) ? 'var(--accent)' : 'var(--border)'}`,
            background: isSelected(opt.value) ? 'var(--accent-bg)' : 'var(--surface)',
            color: isSelected(opt.value) ? 'var(--accent)' : 'var(--text-1)',
            cursor: 'pointer', transition: 'all 0.12s',
            letterSpacing: '-0.01em',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const to = t.app.onboarding;
  const router = useRouter();
  const [step, setStep] = useState(0); // start at 0 = language

  const [areas, setAreas]       = useState<string[]>([]);
  const [diploma, setDiploma]   = useState('');
  const [city, setCity]         = useState('');
  const [cityCustom, setCityCustom] = useState('');
  const [degree, setDegree]     = useState('');

  if (!user) { router.replace('/login'); return null; }
  if (user.onboarded) { router.replace('/dashboard'); return null; }

  const firstName = user.name.split(' ')[0];

  // Build localised area options (value=Italian key for scoring, label=translated)
  const areaOptions = AREAS_IT.map(a => ({ value: a, label: to.areaLabels[a] ?? a }));

  // Degree options come from translations (value=Italian for scoring, label=localised)
  const degreeOptions = to.degreeOptions;

  // City options
  const cityOptions = [
    ...CITIES.map(c => ({ value: c, label: c })),
    { value: 'Altra città', label: to.cityOther },
  ];

  const canNext = [
    true,                        // step 0 = language (IT pre-selected, always ok)
    true,                        // step 1 = welcome
    areas.length > 0,            // step 2 = areas
    !!diploma,                   // step 3 = diploma
    !!(city && (city !== 'Altra città' || cityCustom)), // step 4 = city
    !!degree,                    // step 5 = degree
  ][step];

  const next = () => {
    if (step < TOTAL_STEPS - 1) { setStep(s => s + 1); return; }
    completeOnboarding({
      areas, diploma,
      city: city === 'Altra città' ? cityCustom : city,
      degreeType: degree,
    });
    router.push('/dashboard');
  };

  const STEPS = [
    /* 0 — Language selection (bilingual by design) */
    <div key="0">
      <div style={{ marginBottom: '2rem' }}>
        <U2FLogo size={44} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-1)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        Scegli la lingua
        <span style={{ display: 'block', fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-3)', marginTop: '0.25rem' }}>
          Choose your language
        </span>
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '2rem' }}>
        Puoi cambiarla in qualsiasi momento · You can change it anytime
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {([
          { code: 'it' as const, flag: '🇮🇹', label: 'Italiano' },
          { code: 'en' as const, flag: '🇬🇧', label: 'English' },
        ]).map(({ code, flag, label }) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            style={{
              flex: 1, padding: '1.5rem 1rem', borderRadius: '16px',
              border: `2px solid ${lang === code ? 'var(--accent)' : 'var(--border)'}`,
              background: lang === code ? 'var(--accent-bg)' : 'var(--surface)',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '2rem' }}>{flag}</span>
            <span style={{
              fontSize: '15px', fontWeight: lang === code ? 700 : 500,
              color: lang === code ? 'var(--accent)' : 'var(--text-2)',
            }}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>,

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
      <OptionGrid
        options={areaOptions}
        selected={areas}
        onSelect={v => setAreas(prev => prev.includes(v) ? prev.filter(a => a !== v) : [...prev, v])}
        multi
      />
    </div>,

    /* 3 — Tipo di diploma */
    <div key="3">
      <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-1)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {to.diplomaTitle}
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>{to.diplomaSub}</p>
      <OptionGrid
        options={DIPLOMAS.map(d => ({ value: d, label: d }))}
        selected={diploma}
        onSelect={setDiploma}
      />
    </div>,

    /* 4 — Città */
    <div key="4">
      <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-1)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {to.cityTitle}
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>
        {to.citySub}
      </p>
      <OptionGrid options={cityOptions} selected={city} onSelect={setCity} />
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
      <OptionGrid options={degreeOptions} selected={degree} onSelect={setDegree} />
    </div>,
  ];

  const isLangStep = step === 0;

  return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '3rem 1.5rem 2rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        {isLangStep ? <div /> : <U2FLogo size={28} />}
        {!isLangStep && (
          <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>
            {step} / {TOTAL_STEPS - 1}
          </span>
        )}
      </div>

      {!isLangStep && <ProgressDots step={step} />}

      {/* Step content */}
      <div style={{ flex: 1 }}>
        {STEPS[step]}
      </div>

      {/* Footer nav */}
      <div style={{ paddingTop: '2rem', display: 'flex', gap: '0.75rem' }}>
        {step > 0 && (
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
          {step === TOTAL_STEPS - 1 ? to.start : to.next}
        </button>
      </div>
    </div>
  );
}
