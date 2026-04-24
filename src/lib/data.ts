import coursesRaw from '@/data/courses.json';
import murRaw from '@/data/mur_universities_enriched.json';
import scoredRaw from '@/data/milan_courses_scored.json';
import { UNI_ALIAS_MAP } from '@/data/uniAliasMap';

export interface Course {
  id: number;
  source: string;
  nome: string;
  universita: string;
  tipo: string;
  durata: number;
  lingua: string;
  citta: string;
  cfu: number | null;
  classe: string;
  area: string;
  url: string;
  accesso: string;
  areaScores: Record<string, number>; // relevance per user interest area, 0–10
}

export interface MurUniversity {
  mur_code: number;
  name: string;
  short_name: string;
  normalized_name: string;
  institution_type: string;
  public_private: string;
  address: string;
  city: string;
  province: string;
  region: string;
  macro_region: string;
  lat: number | null;
  lng: number | null;
  geo_confidence: string | null;
  geo_source: string;
  geo_note: string | null;
  geo_display_name: string;
  qs_rank: string | null;
  the_rank: string | null;
  arwu_rank: string | null;
}

export const MUR_UNIVERSITIES = murRaw as unknown as MurUniversity[];

export const ALL_COURSES = (coursesRaw as unknown as Course[]).filter(
  c => c.source === 'universita'
);

function normalizeUniName(s: string): string {
  let r = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  r = r.replace(/["""''()[\]{}\-–—,.;:/\\]/g, ' ');
  r = r.replace(/\b(degli|delle|dello|dell|della|di|del|dei|il|la|lo|le|un|una|e|per)\b/g, ' ');
  return r.replace(/\s+/g, ' ').trim();
}

const MUR_BY_NAME_LOWER = new Map<string, MurUniversity>(
  MUR_UNIVERSITIES.map(u => [u.name.toLowerCase(), u])
);
const MUR_BY_NORMALIZED = new Map<string, MurUniversity>(
  MUR_UNIVERSITIES.map(u => [normalizeUniName(u.name), u])
);
const MUR_BY_ALIAS = new Map<string, MurUniversity>();
for (const [coursesName, murName] of Object.entries(UNI_ALIAS_MAP)) {
  const murEntry = MUR_BY_NAME_LOWER.get(murName.toLowerCase());
  if (murEntry) MUR_BY_ALIAS.set(coursesName.toLowerCase(), murEntry);
}

export function resolveUniversity(universita: string): MurUniversity | null {
  const lower = universita.toLowerCase();
  return (
    MUR_BY_NAME_LOWER.get(lower) ??
    MUR_BY_NORMALIZED.get(normalizeUniName(universita)) ??
    MUR_BY_ALIAS.get(lower) ??
    null
  );
}

export function uniSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["""''()[\]{},.;:/\\]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const MUR_BY_SLUG = new Map<string, MurUniversity>(
  MUR_UNIVERSITIES.map(u => [uniSlug(u.name), u])
);

export function getMurBySlug(slug: string): MurUniversity | null {
  return MUR_BY_SLUG.get(slug) ?? null;
}

export function titleCase(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function getCoursesForMur(mur: MurUniversity): Course[] {
  return ALL_COURSES.filter(c => resolveUniversity(c.universita)?.mur_code === mur.mur_code);
}

// ─── Milan-specific ───────────────────────────────────────────────────────────

export const MILAN_UNIVERSITIES = MUR_UNIVERSITIES.filter(
  u => u.city.toUpperCase() === 'MILANO'
);

const MILAN_MUR_CODES = new Set(MILAN_UNIVERSITIES.map(u => u.mur_code));

type ScoredEntry = { id: number; nome: string; scores: Record<string, number> };
const SCORED_MAP = new Map<number, ScoredEntry>(
  (scoredRaw as ScoredEntry[]).map(s => [s.id, s])
);

export const MILAN_COURSES = ALL_COURSES
  .filter(c => {
    const mur = resolveUniversity(c.universita);
    return mur && MILAN_MUR_CODES.has(mur.mur_code);
  })
  .map(c => {
    const scored = SCORED_MAP.get(c.id);
    return {
      ...c,
      nome: scored?.nome ?? c.nome,
      areaScores: scored?.scores ?? {},
    };
  });

// ─── Subject categories ───────────────────────────────────────────────────────

export const AREA_TO_SUBJECT: Record<string, string> = {
  'Ingegneria':               'STEM',
  'Matematica e Informatica': 'STEM',
  'Fisica':                   'STEM',
  'Chimica':                  'STEM',
  'Biologia':                 'STEM',
  'Scienze della Terra':      'STEM',
  'Scienze Agrarie':          'STEM',
  'Economia':                 'Economia',
  'Giurisprudenza':           'Legge',
  'Medicina':                 'Medicina',
  'Scienze Storiche':         'Umanistica',
  "Scienze dell'Antichità":   'Umanistica',
  'Scienze Politiche':        'Umanistica',
  'Architettura':             'Architettura',
};

export const SUBJECT_CATEGORIES = [
  'STEM', 'Economia', 'Medicina', 'Legge', 'Umanistica', 'Architettura',
] as const;

export const UNI_SUBJECTS = new Map<number, string[]>();
export const UNI_DEGREE_TYPES = new Map<number, string[]>();
export const UNI_COURSE_COUNT = new Map<number, number>();

for (const course of MILAN_COURSES) {
  const mur = resolveUniversity(course.universita);
  if (!mur) continue;
  const code = mur.mur_code;
  UNI_COURSE_COUNT.set(code, (UNI_COURSE_COUNT.get(code) ?? 0) + 1);
  const subject = AREA_TO_SUBJECT[course.area];
  if (subject) {
    const ex = UNI_SUBJECTS.get(code);
    if (!ex) UNI_SUBJECTS.set(code, [subject]);
    else if (!ex.includes(subject)) ex.push(subject);
  }
  if (course.tipo) {
    const ex = UNI_DEGREE_TYPES.get(code);
    if (!ex) UNI_DEGREE_TYPES.set(code, [course.tipo]);
    else if (!ex.includes(course.tipo)) ex.push(course.tipo);
  }
}

export const DOCTORAL_ONLY = new Set<number>([1511]);
