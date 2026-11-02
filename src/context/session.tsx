import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { authService } from '@/services/auth.service';
import { setSessionExpiredHandler } from '@/services/http';
import { tokenStore } from '@/services/token-store';
import type { AuthResponse, PlayerResponse } from '@/types/api';

type SessionContextValue = {
  isAuthenticated: boolean;
  player: PlayerResponse | null;
  isLoading: boolean;
  /** false solo entre el registro y el fin del onboarding; true para login y sesiones restauradas. */
  onboardingComplete: boolean;
  signInWithAuthResponse: (auth: AuthResponse, opts?: { skipOnboarding?: boolean }) => Promise<void>;
  completeOnboarding: () => void;
  signOut: () => Promise<void>;
  updateLocalPlayer: (player: PlayerResponse) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [player, setPlayer] = useState<PlayerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await tokenStore.load();
        if (storedToken) {
          setPlayer(await authService.me());
          setOnboardingComplete(true);
        }
      } catch {
        // Token vencido o inválido: seguimos como si no hubiera sesión.
        await tokenStore.clear();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signInWithAuthResponse = async (auth: AuthResponse, opts?: { skipOnboarding?: boolean }) => {
    await tokenStore.save(auth.token, auth.refreshToken);
    setPlayer(auth.player);
    setOnboardingComplete(opts?.skipOnboarding ?? false);
  };

  const completeOnboarding = () => setOnboardingComplete(true);

  const signOut = async () => {
    await tokenStore.clear();
    setPlayer(null);
  };

  useEffect(() => {
    setSessionExpiredHandler(() => setPlayer(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  const updateLocalPlayer = (updated: PlayerResponse) => setPlayer(updated);

  const value = useMemo(
    () => ({
      isAuthenticated: player !== null,
      player,
      isLoading,
      onboardingComplete,
      signInWithAuthResponse,
      completeOnboarding,
      signOut,
      updateLocalPlayer,
    }),
    [player, isLoading, onboardingComplete],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession debe usarse dentro de un SessionProvider');
  }
  return ctx;
}
