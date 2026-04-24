/**
 * Scoring dimensions — psycho-attitudinal axes measurable via orientation
 * games, tests, and quizzes. Each dimension is a 0–1 float stored in
 * user.scores. Adding new dimensions here is the only change needed when
 * new orientation activities are introduced.
 */
export const DIMENSIONS = [
  'analytical',      // logica, ragionamento astratto, problem solving
  'technical',       // costruire cose, ingegneria, coding, hands-on
  'quantitative',    // numeri, statistica, finanza, precisione
  'creative',        // design, arte, innovazione, estetica
  'social',          // persone, comunicazione, empatia, lavoro di gruppo
  'scientific',      // ricerca, curiosità per natura, metodo sperimentale
  'humanistic',      // cultura, storia, lingue, filosofia, letteratura
  'entrepreneurial', // business, leadership, strategia, rischio
  'caregiving',      // cura degli altri, salute, supporto, medicina
  'environmental',   // natura, sostenibilità, territorio, ecologia
] as const;

export type Dimension = typeof DIMENSIONS[number];

/**
 * Psycho-attitudinal weights per course area.
 * Values are relative importance (0–50). Higher = stronger correlation.
 * When orientation games produce dimension scores (0–1 floats),
 * the soft score contribution = userScore * weight.
 *
 * Design principle: area match (hard signal = 100pts) always dominates.
 * A perfect soft score on all dimensions = max ~50pts → boosts ranking
 * within area, never overrides it.
 */
export const AREA_DIMENSION_WEIGHTS: Record<string, Partial<Record<Dimension, number>>> = {
  'Ingegneria': {
    analytical: 35,
    technical: 45,
    quantitative: 20,
    entrepreneurial: 10,
    creative: 5,
  },
  'Matematica e Informatica': {
    analytical: 45,
    technical: 35,
    quantitative: 35,
    creative: 10,
    entrepreneurial: 10,
  },
  'Fisica': {
    analytical: 45,
    scientific: 40,
    quantitative: 30,
    technical: 20,
  },
  'Chimica': {
    scientific: 45,
    analytical: 35,
    technical: 20,
    caregiving: 10,
    environmental: 10,
  },
  'Biologia': {
    scientific: 50,
    caregiving: 20,
    environmental: 25,
    analytical: 25,
  },
  'Scienze della Terra': {
    environmental: 50,
    scientific: 40,
    analytical: 20,
    technical: 10,
  },
  'Scienze Agrarie': {
    environmental: 45,
    scientific: 35,
    technical: 20,
    caregiving: 10,
  },
  'Economia': {
    entrepreneurial: 40,
    quantitative: 35,
    analytical: 25,
    social: 15,
    creative: 10,
  },
  'Giurisprudenza': {
    analytical: 40,
    humanistic: 30,
    social: 25,
    entrepreneurial: 15,
  },
  'Medicina': {
    caregiving: 50,
    scientific: 40,
    analytical: 25,
    social: 20,
    technical: 10,
  },
  'Scienze Storiche': {
    humanistic: 50,
    analytical: 30,
    social: 20,
    creative: 10,
  },
  "Scienze dell'Antichità": {
    humanistic: 55,
    analytical: 25,
    creative: 15,
    social: 10,
  },
  'Scienze Politiche': {
    social: 40,
    humanistic: 35,
    entrepreneurial: 25,
    analytical: 20,
  },
  'Architettura': {
    creative: 50,
    technical: 30,
    analytical: 25,
    environmental: 15,
  },
};

/**
 * Diploma → area boost.
 * Small bonus (10–20pts) for academically relevant background.
 * Does not override area match — just improves ranking within same tier.
 */
export const DIPLOMA_AREA_BOOST: Record<string, Partial<Record<string, number>>> = {
  'Liceo Scientifico': {
    'Ingegneria': 15, 'Matematica e Informatica': 15,
    'Fisica': 15, 'Chimica': 12, 'Biologia': 12, 'Medicina': 10,
  },
  'Liceo Classico': {
    'Giurisprudenza': 15, 'Scienze Storiche': 15,
    "Scienze dell'Antichità": 18, 'Scienze Politiche': 10,
  },
  'ITI': {
    'Ingegneria': 20, 'Matematica e Informatica': 20, 'Architettura': 10,
  },
  'ITC': {
    'Economia': 20,
  },
  'Liceo Linguistico': {
    'Scienze Politiche': 15, 'Scienze Storiche': 10,
  },
  'Liceo Artistico': {
    'Architettura': 20,
  },
  // 'Altro' → no domain boost
};
