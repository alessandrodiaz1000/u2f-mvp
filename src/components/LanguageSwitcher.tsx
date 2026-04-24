'use client';
import { useLanguage } from '@/context/LanguageContext';

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <button
      onClick={() => setLang(lang === 'it' ? 'en' : 'it')}
      style={{
        fontSize: '12px', fontWeight: 500, color: 'var(--text-2)',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '0.3rem 0.625rem',
        cursor: 'pointer', letterSpacing: '0.02em',
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      {lang === 'it' ? 'EN' : 'IT'}
    </button>
  );
}
