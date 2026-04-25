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
}

const admissionInfo = admissionInfoRaw as Record<string, Record<string, AdmissionInfo>>;
const classeToTest = classeToTestRaw as Record<string, string>;

// Case-insensitive lookup map: lowercase(uni name) → canonical key
const uniLowerMap = new Map<string, string>(
  Object.keys(admissionInfo).map(k => [k.toLowerCase(), k])
);

// Strip trailing " R" suffix used in post-reform class names (es. "L-8 R" → "L-8")
function normalizeClasse(classe: string): string {
  return classe.replace(/\s+R$/, '').trim();
}

/**
 * Returns admission info for a course using a 3-level cascade:
 * 1. Direct classe match (for private unis with per-class overrides)
 * 2. TOLC type derived from classe (for public unis)
 * 3. "_all" wildcard (for unis where all courses share the same process)
 */
export function getAdmissionInfo(universita: string, classe: string): AdmissionInfo | null {
  const canonicalKey = admissionInfo[universita]
    ? universita
    : (uniLowerMap.get(universita.toLowerCase()) ?? null);
  const uniInfo = canonicalKey ? admissionInfo[canonicalKey] : null;
  if (!uniInfo) return null;

  const normalized = normalizeClasse(classe);

  // Level 1: direct classe key
  if (uniInfo[normalized]) return uniInfo[normalized];

  // Level 2: lookup test type from classe, then find by test type
  const testType = classeToTest[normalized];
  if (testType && uniInfo[testType]) return uniInfo[testType];

  // Level 3: wildcard
  if (uniInfo['_all']) return uniInfo['_all'];

  // Fall back to "Nessuno" entry if the class maps to no test
  if (testType === 'Nessuno' && uniInfo['Nessuno']) return uniInfo['Nessuno'];

  return null;
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

/** All test types available for a given university (for the university page). */
export function getUniAdmissionEntries(universita: string): { testType: string; info: AdmissionInfo }[] {
  const canonicalKey = admissionInfo[universita]
    ? universita
    : (uniLowerMap.get(universita.toLowerCase()) ?? null);
  const uniInfo = canonicalKey ? admissionInfo[canonicalKey] : null;
  if (!uniInfo) return [];
  return Object.entries(uniInfo)
    .filter(([key]) => key !== '_all')
    .map(([testType, info]) => ({ testType, info }))
    .sort((a, b) => {
      const da = a.info.enrollment_close ?? '9999';
      const db = b.info.enrollment_close ?? '9999';
      return da.localeCompare(db);
    });
}
