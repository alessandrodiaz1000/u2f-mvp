'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CourseAdmissionProgress {
  course_id: number;
  target_round: number;
  completed_steps: string[];
  test_score: number | null;
  test_type: string | null;
  test_date_taken: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  areas: string[];
  diploma: string;
  city: string;
  degreeType: string;
  onboarded: boolean;
  favorites: number[];
  swipedIds: number[];
  comparisonsCount: number;
  scores: Record<string, number>;

  // ── Progressive profile fields ─────────────────────────────────────
  // Add new optional fields here; always migrate in useEffect below.
  uniPreference: 'pubblica' | 'privata' | 'indifferente' | '';
  langPreference: 'italiano' | 'inglese' | 'indifferente' | '';
  gradeAvg: 'lt7' | '7to8' | '8to9' | '9to10' | '';
  startYear: '2025' | '2026' | '2027' | '2028' | '';
  admissionTracking: CourseAdmissionProgress[];
}

interface AuthCtx {
  user: UserProfile | null;
  login: (email: string, name: string) => void;
  logout: () => void;
  completeOnboarding: (data: Omit<UserProfile, 'id' | 'email' | 'name' | 'onboarded' | 'favorites' | 'swipedIds' | 'scores' | 'comparisonsCount' | 'uniPreference' | 'langPreference' | 'gradeAvg' | 'startYear' | 'admissionTracking'>) => void;
  swipeRight: (id: number) => void;
  swipeLeft: (id: number) => void;
  addFavorite: (id: number) => void;
  removeFavorite: (id: number) => void;
  markSwiped: (id: number) => void;
  updateScores: (newScores: Record<string, number>) => void;
  undoSwipe: (id: number, wasRight: boolean) => void;
  trackComparison: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  updateAdmissionProgress: (courseId: number, update: Partial<CourseAdmissionProgress>) => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  login: () => {},
  logout: () => {},
  completeOnboarding: () => {},
  swipeRight: () => {},
  swipeLeft: () => {},
  addFavorite: () => {},
  removeFavorite: () => {},
  markSwiped: () => {},
  updateScores: () => {},
  undoSwipe: () => {},
  trackComparison: () => {},
  updateProfile: () => {},
  updateAdmissionProgress: () => {},
});

const STORAGE_KEY = 'u2f_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migrate old profiles: area: string → areas: string[]
        if (!Array.isArray(parsed.areas)) {
          parsed.areas = parsed.area ? [parsed.area] : [];
          delete parsed.area;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        // Ensure core arrays / objects exist
        if (!Array.isArray(parsed.favorites))   parsed.favorites = [];
        if (!Array.isArray(parsed.swipedIds))   parsed.swipedIds = [];
        if (typeof parsed.scores !== 'object' || Array.isArray(parsed.scores)) parsed.scores = {};
        if (typeof parsed.comparisonsCount !== 'number') parsed.comparisonsCount = 0;
        // Progressive profile fields — add migration for every new field here
        if (!parsed.uniPreference)  parsed.uniPreference  = '';
        if (!parsed.langPreference) parsed.langPreference = '';
        if (!parsed.gradeAvg)       parsed.gradeAvg       = '';
        if (!parsed.startYear)      parsed.startYear      = '';
        if (!Array.isArray(parsed.admissionTracking)) parsed.admissionTracking = [];
        setUser(parsed);
      }
    } catch {}
  }, []);

  const persist = (u: UserProfile | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = (email: string, name: string) => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) { persist(JSON.parse(existing)); return; }
    persist({
      id: Math.random().toString(36).slice(2),
      name, email,
      areas: [], diploma: '', city: '', degreeType: '',
      onboarded: false, favorites: [], swipedIds: [], comparisonsCount: 0, scores: {},
      uniPreference: '', langPreference: '', gradeAvg: '', startYear: '',
      admissionTracking: [],
    });
  };

  const logout = () => persist(null);

  const completeOnboarding = (data: Omit<UserProfile, 'id' | 'email' | 'name' | 'onboarded' | 'favorites' | 'swipedIds' | 'scores' | 'comparisonsCount' | 'uniPreference' | 'langPreference' | 'gradeAvg' | 'startYear' | 'admissionTracking'>) => {
    if (!user) return;
    persist({ ...user, ...data, onboarded: true });
  };

  const swipeRight = (id: number) => {
    if (!user) return;
    const favorites = user.favorites.includes(id) ? user.favorites : [...user.favorites, id];
    const swipedIds = user.swipedIds.includes(id) ? user.swipedIds : [...user.swipedIds, id];
    persist({ ...user, favorites, swipedIds });
  };

  const swipeLeft = (id: number) => {
    if (!user) return;
    const swipedIds = user.swipedIds.includes(id) ? user.swipedIds : [...user.swipedIds, id];
    persist({ ...user, swipedIds });
  };

  const addFavorite = (id: number) => {
    if (!user || user.favorites.includes(id)) return;
    persist({ ...user, favorites: [...user.favorites, id] });
  };

  const removeFavorite = (id: number) => {
    if (!user) return;
    persist({ ...user, favorites: user.favorites.filter(f => f !== id) });
  };

  const markSwiped = (id: number) => {
    if (!user || user.swipedIds.includes(id)) return;
    persist({ ...user, swipedIds: [...user.swipedIds, id] });
  };

  const updateScores = (newScores: Record<string, number>) => {
    if (!user) return;
    persist({ ...user, scores: { ...user.scores, ...newScores } });
  };

  const undoSwipe = (id: number, wasRight: boolean) => {
    if (!user) return;
    const swipedIds = user.swipedIds.filter(s => s !== id);
    const favorites = wasRight ? user.favorites.filter(f => f !== id) : user.favorites;
    persist({ ...user, swipedIds, favorites });
  };

  const trackComparison = () => {
    if (!user) return;
    persist({ ...user, comparisonsCount: (user.comparisonsCount ?? 0) + 1 });
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    persist({ ...user, ...data });
  };

  const updateAdmissionProgress = (courseId: number, update: Partial<CourseAdmissionProgress>) => {
    if (!user) return;
    const existing = user.admissionTracking ?? [];
    const idx = existing.findIndex(p => p.course_id === courseId);
    if (idx >= 0) {
      const updated = [...existing];
      updated[idx] = { ...updated[idx], ...update };
      persist({ ...user, admissionTracking: updated });
    } else {
      persist({
        ...user,
        admissionTracking: [
          ...existing,
          { course_id: courseId, target_round: 1, completed_steps: [], test_score: null, test_type: null, test_date_taken: null, ...update },
        ],
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, completeOnboarding, swipeRight, swipeLeft, addFavorite, removeFavorite, markSwiped, updateScores, undoSwipe, trackComparison, updateProfile, updateAdmissionProgress }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
