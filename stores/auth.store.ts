import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
export type SessionUser = { id: string; username: string; email?: string | null; role: 'ADMIN' | 'TEACHER' | 'SECRETARY' | 'PEDAGOGICAL_COUNCIL' | 'STUDENT'; roleLabel?: string; eleve?: { matricule: string; nom: string; prenom: string } | null };
type AuthState = { token: string | null; user: SessionUser | null; hydrated: boolean; setSession: (token: string, user: SessionUser) => void; clear: () => void; setHydrated: (hydrated: boolean) => void };
export const useAuthStore = create<AuthState>()(persist((set) => ({ token: null, user: null, hydrated: false, setSession: (token, user) => set({ token, user }), clear: () => set({ token: null, user: null }), setHydrated: (hydrated) => set({ hydrated }) }), { name: 'kotaschool-auth', storage: createJSONStorage(() => localStorage), onRehydrateStorage: () => (state) => state?.setHydrated(true) }));
