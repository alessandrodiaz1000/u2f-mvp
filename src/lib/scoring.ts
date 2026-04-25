import { MILAN_COURSES } from './data';
import { AREA_DIMENSION_WEIGHTS, DIPLOMA_AREA_BOOST } from './courseWeights';
import type { UserProfile } from '@/context/AuthContext';

type Course = typeof MILAN_COURSES[number];

/**
 * Score breakdown for debugging and future transparency UI.
 * Each field represents one scoring layer so it's easy to inspect
 * why a course ranked high or low for a specific user.
 */
export interface ScoreBreakdown {
  total: number;
  areaScore: number;
  degreeMatch: boolean;
  diplomaBoost: number;
  softScore: number;
  uniPrefBoost: number;   // soft: matches user's public/private preference
  langPrefBoost: number;  // soft: matches user's language preference
  missingDimensions: string[];
}

/**
 * Core scoring function. Pure — no side effects.
 *
 * Score tiers (by design):
 *   Area match alone          → 100 pts
 *   + degree match            → +40 pts
 *   + diploma boost           → +0–20 pts
 *   + perfect soft score      → +0–50 pts (max if all orientation done)
 *
 * This means: hard signals always dominate. Soft scores refine the
 * ranking *within* a tier, never override area relevance.
 */
export function scoreCourse(course: Course, user: UserProfile): ScoreBreakdown {
  let total = 0;

  // ── AREA SCORE: sum of per-area relevance scores across user's selected areas ──
  // Each area contributes 0–10. Multiply by 10 so a perfect single-area match = 100.
  const areaScore = user.areas.reduce(
    (sum, a) => sum + ((course.areaScores ?? {})[a] ?? 0), 0
  );
  total += areaScore * 10;

  // ── HARD SIGNAL 2: Degree type ──────────────────────────────────
  const wantsDegree = !!user.degreeType && user.degreeType !== 'Non so ancora';
  const degreeMatch = wantsDegree && course.tipo === user.degreeType;
  if (degreeMatch) total += 40;

  // ── SOFT SIGNAL 1: Diploma background ───────────────────────────
  const diplomaBoost = (DIPLOMA_AREA_BOOST[user.diploma] ?? {})[course.area] ?? 0;
  total += diplomaBoost;

  // ── SOFT SIGNAL 2: Psycho-attitudinal dimensions ─────────────────
  // user.scores holds 0–1 floats produced by orientation activities.
  // Each dimension score × its weight for this course area = partial boost.
  const dimWeights = AREA_DIMENSION_WEIGHTS[course.area] ?? {};
  const userScores = user.scores ?? {};
  const missingDimensions: string[] = [];
  let softScore = 0;

  for (const [dim, weight] of Object.entries(dimWeights)) {
    if (dim in userScores) {
      softScore += userScores[dim] * (weight ?? 0);
    } else {
      missingDimensions.push(dim); // user hasn't done the activity that measures this
    }
  }

  total += softScore;

  // ── SOFT SIGNAL 3: University type preference ────────────────────
  const PRIVATE_UNIS = ['Bocconi', 'Cattolica', 'San Raffaele', 'IULM'];
  const isPrivate = PRIVATE_UNIS.some(k => course.universita.includes(k));
  const uniPref = user.uniPreference ?? '';
  const uniPrefBoost =
    (uniPref === 'pubblica' && !isPrivate) ? 25 :
    (uniPref === 'privata'  && isPrivate)  ? 25 : 0;
  total += uniPrefBoost;

  // ── SOFT SIGNAL 4: Language preference ──────────────────────────
  const langPref = user.langPreference ?? '';
  const courseLang = (course.lingua ?? '').toLowerCase();
  const langPrefBoost =
    (langPref === 'italiano' && courseLang === 'italiano') ? 20 :
    (langPref === 'inglese'  && courseLang !== 'italiano') ? 20 : 0;
  total += langPrefBoost;

  return { total, areaScore, degreeMatch, diplomaBoost, softScore, uniPrefBoost, langPrefBoost, missingDimensions };
}

/**
 * Build the sorted deck for the scopri page.
 *
 * Ordering:
 *   1. Exclude already swiped and already favorited courses
 *   2. Score every remaining course via scoreCourse()
 *   3. Sort descending by total score
 *   4. Cap at maxCards to avoid infinite scroll fatigue
 *
 * Future extensions (add params here, not in the component):
 *   - languageFilter: 'it' | 'en' | 'any'
 *   - cityFilter: string
 *   - excludeAreas: string[]
 *   - boostNewCourses: boolean (for A/B testing)
 */
export function buildDeck(
  user: UserProfile,
  { maxCards = 80 }: { maxCards?: number } = {},
): Course[] {
  const seen  = new Set(user.swipedIds);
  const faved = new Set(user.favorites);
  const wantsDegree = user.degreeType && user.degreeType !== 'Non so ancora';

  // Compute direction from ALL areaScores of saved courses (same logic as dashboard)
  const dirTotals: Record<string, number> = {};
  for (const c of MILAN_COURSES.filter(c => faved.has(c.id))) {
    for (const [area, score] of Object.entries(c.areaScores ?? {})) {
      dirTotals[area] = (dirTotals[area] ?? 0) + score;
    }
  }
  // Top 3 direction areas, normalized weight 1 / (rank+1): 1, 0.5, 0.33
  const dirTop3 = Object.entries(dirTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return MILAN_COURSES
    .filter(c => !seen.has(c.id) && !faved.has(c.id))
    .filter(c => !wantsDegree || c.tipo === user.degreeType)
    .map(c => {
      const base = scoreCourse(c, user).total;

      // Direction boost: how well this course matches where saved courses cluster
      // Max contribution ~27 pts — soft signal, doesn't override area match
      const dirBoost = dirTop3.reduce((sum, [area, _], rank) => {
        const courseScore = (c.areaScores[area] ?? 0) / 10; // 0–1
        return sum + courseScore * (1 / (rank + 1)) * 15;
      }, 0);

      // Higher jitter (was 5) → more variety among similarly-scored courses
      const jitter = Math.random() * 20;

      return { course: c, score: base + dirBoost + jitter };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ course }) => course)
    .slice(0, maxCards);
}
