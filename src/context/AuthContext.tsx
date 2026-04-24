'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  areas: string[];     // multiple interest areas (hard filter)
  diploma: string;
  city: string;
  degreeType: string;
  onboarded: boolean;
  favorites: number[];
  swipedIds: number[];
  /**
   * Psycho-attitudinal dimension scores, 0–1 floats.
   * Populated progressively by orientation games and tests.
   * Keys match DIMENSIONS in src/lib/courseWeights.ts.
   * Missing key = user hasn't completed the activity that measures it.
   */
  scores: Record<string, number>;
}

interface AuthCtx {
  user: UserProfile | null;
  login: (email: string, name: string) => void;
  logout: () => void;
  completeOnboarding: (data: Omit<UserProfile, 'id' | 'email' | 'name' | 'onboarded' | 'favorites' | 'swipedIds' | 'scores'>) => void;
  swipeRight: (id: number) => void;
  swipeLeft: (id: number) => void;
  addFavorite: (id: number) => void;
  removeFavorite: (id: number) => void;
  markSwiped: (id: number) => void;
  updateScores: (newScores: Record<string, number>) => void;
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
        // Ensure arrays and objects exist
        if (!Array.isArray(parsed.favorites)) parsed.favorites = [];
        if (!Array.isArray(parsed.swipedIds)) parsed.swipedIds = [];
        if (typeof parsed.scores !== 'object' || Array.isArray(parsed.scores)) parsed.scores = {};
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
    if (existing) {
      persist(JSON.parse(existing));
      return;
    }
    persist({
      id: Math.random().toString(36).slice(2),
      name, email,
      areas: [], diploma: '', city: '', degreeType: '',
      onboarded: false, favorites: [], swipedIds: [], scores: {},
    });
  };

  const logout = () => persist(null);

  const completeOnboarding = (data: Omit<UserProfile, 'id' | 'email' | 'name' | 'onboarded' | 'favorites' | 'swipedIds' | 'scores'>) => {
    if (!user) return;
    persist({ ...user, ...data, onboarded: true });
  };

  // Atomic swipe: both favorite + swiped in one persist to avoid stale closure overwrites
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

  // Merges new dimension scores into existing ones (orientation games call this)
  const updateScores = (newScores: Record<string, number>) => {
    if (!user) return;
    persist({ ...user, scores: { ...user.scores, ...newScores } });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, completeOnboarding, swipeRight, swipeLeft, addFavorite, removeFavorite, markSwiped, updateScores }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
