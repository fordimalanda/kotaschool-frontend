'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';
export default function LoginPage() {
  const router = useRouter(); const setSession = useAuthStore((s) => s.setSession); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(form: FormData) { setLoading(true); setError(''); try { const { data } = await api.post('/auth/login', { email: form.get('email'), motDePasse: form.get('password') }); setSession(data.accessToken, data.user); router.push('/dashboard'); } catch { setError('Identifiants invalides ou API indisponible.'); } finally { setLoading(false); } }
  return <main className="grid min-h-screen place-items-center p-6"><form action={submit} className="w-full max-w-sm space-y-5 rounded-xl bg-white p-8 shadow-sm"><div><h1 className="text-2xl font-bold text-brand-600">Kotaschool</h1><p className="mt-1 text-sm text-slate-500">Connectez-vous à votre espace.</p></div><label className="block text-sm font-medium">Adresse e-mail<input required name="email" type="email" autoComplete="username" className="mt-1 w-full rounded-md border p-2" /></label><label className="block text-sm font-medium">Mot de passe<input required type="password" name="password" className="mt-1 w-full rounded-md border p-2" /></label>{error && <p className="text-sm text-red-600">{error}</p>}<button disabled={loading} className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white disabled:opacity-50">{loading ? 'Connexion…' : 'Se connecter'}</button></form></main>;
}
