import { create } from 'zustand';
export type SessionUser = { id: string; username: string; role: 'ADMIN' | 'TEACHER' | 'SECRETARY' | 'PEDAGOGICAL_COUNCIL'; roleLabel?: string };
type AuthState = { token: string | null; user: SessionUser | null; setSession: (token: string, user: SessionUser) => void; clear: () => void };
export const useAuthStore = create<AuthState>((set) => ({ token: null, user: null, setSession: (token, user) => set({ token, user }), clear: () => set({ token: null, user: null }) }));
