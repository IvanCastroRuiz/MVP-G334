import { create, type StateCreator } from 'zustand';
import type { AuthProfileDto, ModuleSummaryDto } from '@mvp/shared';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthProfileDto | null;
  modules: ModuleSummaryDto[];
  setTokens(accessToken: string, refreshToken: string): void;
  setUser(user: AuthProfileDto | null): void;
  setModules(modules: ModuleSummaryDto[]): void;
  clear(): void;
}

const storage = typeof window !== 'undefined' ? window.sessionStorage : null;

const persistedAccess = storage?.getItem('accessToken') ?? null;
const persistedRefresh = storage?.getItem('refreshToken') ?? null;

const createAuthStore: StateCreator<AuthState> = (set) => ({
  accessToken: persistedAccess,
  refreshToken: persistedRefresh,
  user: null,
  modules: [],
  setTokens: (accessToken: string, refreshToken: string) => {
    storage?.setItem('accessToken', accessToken);
    storage?.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },
  setUser: (user: AuthProfileDto | null) => set({ user }),
  setModules: (modules: ModuleSummaryDto[]) => set({ modules }),
  clear: () => {
    storage?.removeItem('accessToken');
    storage?.removeItem('refreshToken');
    set({ accessToken: null, refreshToken: null, user: null, modules: [] });
  },
});

export const useAuthStore = create<AuthState>()(createAuthStore);
