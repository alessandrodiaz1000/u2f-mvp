import admissionInfoRaw from '@/data/admission_info.json';
import classeToTestRaw from '@/data/classe_to_test.json';

export type PathwayType = 'tolc' | 'application' | 'internal_test' | 'imat' | 'free';

export interface AdmissionRound {
  round_name: string | null;
  round_number: number | null;
  application_open: string | null;
  /** Primary deadline across all pathway types. */
  application_close: string | null;
  tolc_last_valid: string | null;
  test_date: string | null;
  results_date: string | null;
  enrollment_open: string | null;
  enrollment_close: string | null;
}

export interface AdmissionInfo {
  pathway_type: PathwayType;
  test: string;
  test_url: string | null;
  bando_url: string | null;
  rounds: AdmissionRound[];
  note: string | null;
  // Set at lookup time, not stored in JSON
  estimated?: boolean;
  sourceYear?: string;
}

export interface StepDef {
  id: string;
  label_it: string;
  label_en: string;
  /** Which field of AdmissionRound is the deadline for this step. null = no deadline. */
  deadline_field: keyof AdmissionRound | null;
  /** Step IDs that must be completed before this step unlocks. */
  requires: string[];
  user_input: 'confirm' | 'score' | 'score_and_type';
  score_label_it?: string;
  score_label_en?: string;
}

export const PATHWAY_STEPS: Record<PathwayType, StepDef[]> = {
  tolc: [
    {
      id: 'register_cisia',
      label_it: 'Iscriviti a CISIA',
      label_en: 'Register on CISIA',
      deadline_field: null,
      requires: [],
      user_input: 'confirm',
    },
    {
      id: 'take_tolc',
      label_it: 'Sostieni il TOLC',
      label_en: 'Take the TOLC',
      deadline_field: 'tolc_last_valid',
      requires: ['register_cisia'],
      user_input: 'score',
      score_label_it: 'Punteggio TOLC',
      score_label_en: 'TOLC score',
    },
    {
      id: 'enroll',
      label_it: 'Iscriviti al corso',
      label_en: 'Enroll in the course',
      deadline_field: 'application_close',
      requires: ['take_tolc'],
      user_input: 'confirm',
    },
  ],
  application: [
    {
      id: 'apply',
      label_it: 'Invia la domanda',
      label_en: 'Submit application',
      deadline_field: 'application_close',
      requires: [],
      user_input: 'confirm',
    },
    {
      id: 'take_test',
      label_it: 'Sostieni il test di ammissione',
      label_en: 'Take the admission test',
      deadline_field: 'test_date',
      requires: ['apply'],
      user_input: 'score_and_type',
      score_label_it: 'Risultato',
      score_label_en: 'Score',
    },
    {
      id: 'enroll',
      label_it: 'Immatricolati',
      label_en: 'Complete enrollment',
      deadline_field: 'enrollment_close',
      requires: ['take_test'],
      user_input: 'confirm',
    },
  ],
  internal_test: [
    {
      id: 'register',
      label_it: 'Registrati al test',
      label_en: 'Register for the test',
      deadline_field: 'application_close',
      requires: [],
      user_input: 'confirm',
    },
    {
      id: 'take_test',
      label_it: 'Sostieni il test',
      label_en: 'Take the test',
      deadline_field: 'test_date',
      requires: ['register'],
      user_input: 'score',
      score_label_it: 'Punteggio',
      score_label_en: 'Score',
    },
    {
      id: 'enroll',
      label_it: 'Immatricolati',
      label_en: 'Complete enrollment',
      deadline_field: 'enrollment_close',
      requires: ['take_test'],
      user_input: 'confirm',
    },
  ],
  imat: [
    {
      id: 'register',
      label_it: "Registrati per l'IMAT",
      label_en: 'Register for IMAT',
      deadline_field: 'application_close',
      requires: [],
      user_input: 'confirm',
    },
    {
      id: 'take_test',
      label_it: "Sostieni l'IMAT",
      label_en: 'Take the IMAT',
      deadline_field: 'test_date',
      requires: ['register'],
      user_input: 'score',
      score_label_it: 'Punteggio IMAT',
      score_label_en: 'IMAT score',
    },
    {
      id: 'enroll',
      label_it: 'Immatricolati',
      label_en: 'Complete enrollment',
      deadline_field: 'enrollment_close',
      requires: ['take_test'],
      user_input: 'confirm',
    },
  ],
  free: [
    {
      id: 'enroll',
      label_it: 'Immatricolati',
      label_en: 'Enroll',
      deadline_field: 'application_close',
      requires: [],
      user_input: 'confirm',
    },
  ],
};

// ── JSON imports ─────────────────────────────────────────────────────

const admissionInfo = admissionInfoRaw as Record<string, Record<string, Record<string, AdmissionInfo>>>;
const classeToTest = classeToTestRaw as Record<string, string>;

const uniLowerMap = new Map<string, string>(
  Object.keys(admissionInfo).map(k => [k.toLowerCase(), k])
);

function normalizeClasse(classe: string): string {
  return classe.replace(/\s+R$/, '').trim();
}

function shiftDate(dateStr: string | null, years: number): string | null {
  if (!dateStr || years === 0) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

function shiftRound(round: AdmissionRound, years: number): AdmissionRound {
  return {
    ...round,
    application_open:  shiftDate(round.application_open,  years),
    application_close: shiftDate(round.application_close, years),
    tolc_last_valid:   shiftDate(round.tolc_last_valid,   years),
    test_date:         shiftDate(round.test_date,         years),
    results_date:      shiftDate(round.results_date,      years),
    enrollment_open:   shiftDate(round.enrollment_open,   years),
    enrollment_close:  shiftDate(round.enrollment_close,  years),
  };
}

function resolveUniKey(universita: string): string | null {
  return admissionInfo[universita]
    ? universita
    : (uniLowerMap.get(universita.toLowerCase()) ?? null);
}

// ── Core lookup ──────────────────────────────────────────────────────

/**
 * Year resolution: prefer exact targetYear, fall back to most recent → marks estimated=true.
 * Key cascade: direct classe key → TOLC type → _all wildcard → 'Nessuno' if testType is 'Nessuno'.
 */
export function getAdmissionInfo(
  universita: string,
  classe: string,
  targetYear?: string,
): AdmissionInfo | null {
  const uniKey = resolveUniKey(universita);
  if (!uniKey) return null;

  const uniYears = admissionInfo[uniKey];
  const availableYears = Object.keys(uniYears).sort();
  if (availableYears.length === 0) return null;

  const year = targetYear && uniYears[targetYear]
    ? targetYear
    : availableYears[availableYears.length - 1];
  const estimated = !targetYear || year !== targetYear;

  const uniInfo = uniYears[year];
  const normalized = normalizeClasse(classe);

  let info: AdmissionInfo | null = null;

  if (uniInfo[normalized]) {
    info = uniInfo[normalized];
  } else {
    const testType = classeToTest[normalized];
    if (testType && uniInfo[testType]) {
      info = uniInfo[testType];
    } else if (uniInfo['_all']) {
      info = uniInfo['_all'];
    } else if (testType === 'Nessuno' && uniInfo['Nessuno']) {
      info = uniInfo['Nessuno'];
    }
  }

  if (!info) return null;

  // When falling back to a different year, shift all round dates to targetYear
  const yearDiff = targetYear && estimated ? parseInt(targetYear) - parseInt(year) : 0;
  const rounds = yearDiff > 0
    ? info.rounds.map(r => shiftRound(r, yearDiff))
    : info.rounds;

  return { ...info, rounds, estimated, sourceYear: year };
}

export function getTestLabel(universita: string, classe: string): string | null {
  return getAdmissionInfo(universita, classe)?.test ?? null;
}

// ── Round helpers ────────────────────────────────────────────────────

/** Next upcoming round by application_close; falls back to last round if all have passed. */
export function getActiveRound(info: AdmissionInfo): AdmissionRound | null {
  if (!info.rounds || info.rounds.length === 0) return null;
  const now = Date.now();
  const upcoming = info.rounds
    .filter(r => r.application_close && new Date(r.application_close).getTime() > now)
    .sort((a, b) => (a.application_close ?? '').localeCompare(b.application_close ?? ''));
  return upcoming[0] ?? info.rounds[info.rounds.length - 1];
}

/** Single source of truth for "the next critical deadline" across all pathway types. */
export function getPrimaryDeadline(info: AdmissionInfo): string | null {
  return getActiveRound(info)?.application_close ?? null;
}

/** True when every round's application_close is in the past. Estimated-year data is never considered closed. */
export function isAdmissionClosed(info: AdmissionInfo): boolean {
  if (info.estimated) return false;
  const rounds = info.rounds ?? [];
  const withDeadline = rounds.filter(r => r.application_close);
  if (withDeadline.length === 0) return false;
  const now = Date.now();
  return withDeadline.every(r => new Date(r.application_close!).getTime() < now);
}

// ── Step helpers ─────────────────────────────────────────────────────

/** Returns the first unlocked, not-yet-done step. null = all steps completed. */
export function getActiveStep(
  pathwayType: PathwayType,
  completedSteps: string[],
): StepDef | null {
  for (const step of PATHWAY_STEPS[pathwayType]) {
    if (completedSteps.includes(step.id)) continue;
    if (step.requires.every(r => completedSteps.includes(r))) return step;
  }
  return null;
}

export function getStepDeadline(step: StepDef, round: AdmissionRound): string | null {
  if (!step.deadline_field) return null;
  return round[step.deadline_field] as string | null;
}

export function isAllDone(pathwayType: PathwayType, completedSteps: string[]): boolean {
  return PATHWAY_STEPS[pathwayType].every(s => completedSteps.includes(s.id));
}

// ── Date utils ───────────────────────────────────────────────────────

export function formatDeadline(dateStr: string | null, lang: 'it' | 'en' = 'it'): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short' });
}

export function isUrgent(dateStr: string | null, days = 30): boolean {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < days * 86_400_000;
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

// ── Uni page helper ──────────────────────────────────────────────────

export function getUniAdmissionEntries(
  universita: string,
  targetYear?: string,
): { testType: string; info: AdmissionInfo }[] {
  const uniKey = resolveUniKey(universita);
  if (!uniKey) return [];

  const uniYears = admissionInfo[uniKey];
  const availableYears = Object.keys(uniYears).sort();
  if (availableYears.length === 0) return [];

  const year = targetYear && uniYears[targetYear]
    ? targetYear
    : availableYears[availableYears.length - 1];
  const estimated = !targetYear || year !== targetYear;

  const uniInfo = uniYears[year];

  return Object.entries(uniInfo)
    .filter(([key]) => key !== '_all')
    .map(([testType, info]) => ({
      testType,
      info: { ...info, estimated, sourceYear: year } as AdmissionInfo,
    }))
    .sort((a, b) => {
      const da = getPrimaryDeadline(a.info) ?? '9999';
      const db = getPrimaryDeadline(b.info) ?? '9999';
      return da.localeCompare(db);
    });
}
