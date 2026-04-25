# CLAUDE.md — U2F MVP

Questo file viene letto automaticamente da Claude Code all'avvio. Contiene tutto il contesto necessario per lavorare su questo progetto.

---

## Cos'è U2F

App web per aiutare studenti italiani a scegliere l'università giusta. Funziona come un motore di personalizzazione: raccogli il profilo dell'utente (interessi, diploma, città, tipo di laurea) e mostri i corsi più adatti con un sistema di scoring psico-attitudinale. Include swipe deck stile Tinder, confronto AI tra corsi, e scadenze di ammissione personalizzate.

**Live:** https://u2f-mvp.vercel.app  
**Repo:** https://github.com/alessandrodiaz1000/u2f-mvp  
**Deploy:** automatico su push a `main` via Vercel

---

## Stack

- **Framework:** Next.js 14 App Router — tutte le pagine interattive hanno `'use client'`
- **Language:** TypeScript strict mode — `npx tsc --noEmit` deve passare prima di ogni PR
- **Styling:** inline styles + CSS variables (no Tailwind, no CSS modules)
- **Auth:** localStorage mock — nessun backend, i dati vivono solo nel browser
- **AI:** Groq API (`llama-3.3-70b-versatile`) via API route server-side
- **i18n:** sistema custom con `LanguageContext` + `src/i18n/translations.ts` (IT/EN)

---

## Struttura file chiave

```
src/
  app/
    page.tsx                — landing page
    login/page.tsx          — login (email + nome)
    onboarding/page.tsx     — wizard 5 step (aree, diploma, città, tipo laurea)
    dashboard/page.tsx      — home post-login (Clarity Score, scadenze, profilo)
    scopri/page.tsx         — swipe deck stile Tinder
    preferiti/page.tsx      — corsi salvati + selezione confronto
    confronta/page.tsx      — confronto corsi + AI chat (Groq)
    profilo/page.tsx        — modifica profilo
    universita/[id]/page.tsx — pagina università con sezione Ammissione
    persone/page.tsx        — peer + tutor
    orientamento/page.tsx   — placeholder (da costruire)
    api/
      confront/route.ts     — API route Groq (server-side, usa GROQ_API_KEY)
  context/
    AuthContext.tsx          — stato utente + localStorage persistence + migration
    LanguageContext.tsx      — IT/EN switcher
  i18n/
    translations.ts          — tutte le stringhe IT + EN
  lib/
    data.ts                 — MILAN_COURSES, università, AREA_TO_SUBJECT
    scoring.ts              — scoreCourse() + buildDeck() — CORE PERSONALIZATION
    courseWeights.ts        — dimensioni psico-attitudinali + pesi per area
    admissions.ts           — lookup scadenze ammissione (year-aware)
  data/
    admission_info.json     — scadenze uni pubblica Milano (struttura: uni → year → test)
    classe_to_test.json     — mappa L-*/LM-* → tipo TOLC
  components/
    U2FLogo.tsx
    LanguageSwitcher.tsx
```

---

## UserProfile — struttura completa

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  areas: string[];        // aree di interesse (es. ['Ingegneria', 'Informatica & AI'])
  diploma: string;        // es. 'Liceo Scientifico'
  city: string;
  degreeType: string;     // es. 'Triennale'
  onboarded: boolean;
  favorites: number[];    // course IDs salvati
  swipedIds: number[];    // course IDs già visti
  comparisonsCount: number;
  scores: Record<string, number>; // dimensioni psico-attitudinali, 0–1 float

  // Campi progressive profile (editabili dalla dashboard)
  uniPreference: 'pubblica' | 'privata' | 'indifferente' | '';
  langPreference: 'italiano' | 'inglese' | 'indifferente' | '';
  gradeAvg: 'lt7' | '7to8' | '8to9' | '9to10' | '';
  startYear: '2025' | '2026' | '2027' | '2028' | '';
}
```

Quando aggiungi un campo a `UserProfile`, aggiungi sempre la migration in `AuthContext.tsx` nel `useEffect` che carica il profilo da localStorage — altrimenti i vecchi profili generano pagina bianca.

---

## Sistema di scoring (CORE — non rompere)

`scoreCourse(course, user)` in `src/lib/scoring.ts` è la singola source of truth per il ranking dei corsi E per il pentagon chart in dashboard. Non duplicare logica di scoring altrove.

| Segnale | Tipo | Punti |
|---|---|---|
| Area match | Hard | +0–100 |
| Tipo laurea match | Hard | +40 |
| Diploma correlato | Soft | +0–20 |
| Dimensioni psico-attitudinali | Soft | +0–50 max |
| Preferenza pubblica/privata | Soft | +25 |
| Preferenza lingua | Soft | +20 |

`buildDeck(user)` aggiunge direction boost (corsi simili ai preferiti) + jitter random per varietà.

---

## Sistema ammissione

`src/lib/admissions.ts` + `src/data/admission_info.json`

**Struttura JSON:** `università → anno → tipoTest → AdmissionInfo`

**Lookup cascade per ogni corso:**
1. Chiave classe diretta (es. "L-8")
2. Tipo TOLC da `classe_to_test.json`
3. Wildcard `_all`

**Lookup case-insensitive** — i nomi uni nei corsi sono MAIUSCOLO, le chiavi JSON no. La funzione `resolveUniKey` gestisce questo.

**Normalizzazione classe** — il dataset usa "L-8 R", il JSON usa "L-8". `normalizeClasse()` stripa il suffisso ` R`.

**Year-aware** — `user.startYear` determina quale anno mostrare. Se l'anno non esiste nel JSON, fallback all'anno più recente con `estimated: true` → la UI mostra disclaimer.

**Copertura attuale:** Polimi, Statale Milano, Bicocca — solo 2026. Bocconi, Cattolica, IULM, San Raffaele non ancora coperti.

---

## Regole CSS

- **No CSS variables nei fill/stroke SVG** — `var(--accent)` non funziona su iOS Safari. Usa hex espliciti (es. `#1B5E52`).
- **Design tokens principali:**
  - Accent: `#1B5E52` (verde scuro)
  - Background: `#F8F6F1` (panna)
  - Font: Inter (Google Fonts)
- **Z-index:** AppNav è a 100. Action sheet e modal devono stare a 300+.

---

## API Groq

- **Env var:** `GROQ_API_KEY` — impostata su Vercel, NON nel codice
- Per sviluppo locale: crea `.env.local` con `GROQ_API_KEY=xxx` (chiedi la chiave ad Ale)
- **Non committare mai** `.env.local`

---

## Comandi utili

```bash
npm run dev                          # dev server locale
npm run dev -- --hostname 0.0.0.0   # accessibile da iPhone sulla stessa rete
npx tsc --noEmit                     # TypeScript check — deve passare prima di ogni PR
git add -p && git commit -m "feat/fix/chore: descrizione" && git push
```

---

## Workflow collaborazione

- **Nessuno pusha direttamente su `main`** — tutto da branch → PR
- Nomi branch: `feat/nome-feature`, `fix/nome-bug`
- Prima di aprire una PR: `npx tsc --noEmit` deve passare
- Vercel genera una preview URL automaticamente per ogni PR — usala per testare
- Ale fa merge su `main` → deploy automatico su Vercel

---

## Bug noti / fix già applicati

| Bug | Causa | Fix |
|---|---|---|
| Pagina bianca su iPhone | vecchi profili `area: string` invece di `areas: string[]` | migration in AuthContext useEffect |
| Action sheet coperto da nav | z-index conflitto con AppNav | alzato a 300/301 |
| Area matching mai attivo | `AREA_TO_SUBJECT` mappava a 'STEM' ma user.areas usa stringhe granulari | `COURSE_AREA_TO_USER_AREAS` in courseWeights.ts |
| Lookup ammissione sempre null | "Politecnico di MILANO" ≠ "Politecnico di Milano" | mappa lowercase case-insensitive |
| Classe non trovata | dataset usa "L-8 R", JSON usa "L-8" | `normalizeClasse()` strip ` R` |
| CSS var in SVG non funziona iOS | `var(--accent)` non supportato in SVG su Safari | hex esplicito `#1B5E52` |

---

## Backlog (da non implementare senza allineamento col team)

- Secondo batch ammissione: Bocconi, Cattolica, IULM, San Raffaele
- `pathway_type` per ammissione: `tolc_standard` / `tolc_early` / `application` / `free`
- Redesign card scopri: full-page con foto università (immagini già in `/public/images/`)
- Fix deck re-computation bug nei preferiti
- Backend Supabase (quando utenti si lamentano di perdere dati cross-device)
- Orientamento: giochi e test che popolano `user.scores`
- Dominio custom
