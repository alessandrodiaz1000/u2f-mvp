import admissionInfoRaw from '@/data/admission_info.json';
import classeToTestRaw from '@/data/classe_to_test.json';

export interface AdmissionInfo {
  test: string;
  test_url: string | null;
  enrollment_open: string | null;
  enrollment_close: string | null;
  tolc_last_valid: string | null;
  results_date: string | null;
  bando_url: string | null;
  note: string | null;
  // Set at lookup time, not stored in JSON
  estimated?: boolean;
  sourceYear?: string;
}

// JSON shape: university → year → testType → AdmissionInfo
const admissionInfo = admissionInfoRaw as Record<string, Record<string, Record<string, AdmissionInfo>>>;
const classeToTest = classeToTestRaw as Record<string, string>;

// Case-insensitive university name lookup
const uniLowerMap = new Map<string, string>(
  Object.keys(admissionInfo).map(k => [k.toLowerCase(), k])
);

function normalizeClasse(classe: string): string {
  return classe.replace(/\s+R$/, '').trim();
}

function resolveUniKey(universita: string): string | null {
  return admissionInfo[universita]
    ? universita
    : (uniLowerMap.get(universita.toLowerCase()) ?? null);
}

/**
 * Returns admission info for a course, year-aware.
 *
 * Year resolution:
 *   1. Try targetYear exactly
 *   2. Fall back to most recent available year → marks info.estimated = true
 *
 * Within each year, uses a 3-level cascade:
 *   1. Direct classe key (for private unis with per-class overrides)
 *   2. TOLC type derived from classe
 *   3. "_all" wildcard
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

  // Pick year: prefer exact match, else most recent
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

  // Attach metadata without mutating the original object
  return { ...info, estimated, sourceYear: year };
}

/** Returns just the test name for a quick badge label. */
export function getTestLabel(universita: string, classe: string): string | null {
  const info = getAdmissionInfo(universita, classe);
  return info?.test ?? null;
}

/** Formats a YYYY-MM-DD date as "15 lug" / "15 jul" */
export function formatDeadline(dateStr: string | null, lang: 'it' | 'en' = 'it'): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short' });
}

/** True if the enrollment deadline is within the next N days. */
export function isUrgent(dateStr: string | null, days = 30): boolean {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < days * 86_400_000;
}

/** Days remaining until a deadline (negative = already passed). */
export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

/** All test types available for a given university and year (for the university page). */
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
    .map(([testType, info]) => ({ testType, info: { ...info, estimated, sourceYear: year } }))
    .sort((a, b) => {
      const da = a.info.enrollment_close ?? '9999';
      const db = b.info.enrollment_close ?? '9999';
      return da.localeCompare(db);
    });
}
