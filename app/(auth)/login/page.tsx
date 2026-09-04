'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  School,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', {
        email,
        motDePasse: password,
      });
      setSession(data.accessToken, data.user);
      router.push('/dashboard');
    } catch {
      setError('Identifiants invalides ou service Kotaschool temporairement inaccessible.');
    } finally {
      setLoading(false);
    }
  }

  function setDemoAccount(userEmail: string, pass: string) {
    setEmail(userEmail);
    setPassword(pass);
    setError('');
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* ── Left Showcase Hero (Hidden on Mobile) ── */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white">
        {/* Subtle Background Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-brand-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-glow-brand">
              <School className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  Kotaschool
                </span>
                <span className="rounded-md bg-brand-500/20 px-2 py-0.5 text-xs font-semibold text-brand-300">
                  Édition Professionnelle
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Système Éducatif · EPSP (Primaire, Secondaire & Professionnel)
              </p>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 max-w-lg space-y-6">
          <Badge
            variant="violet"
            className="border-violet-500/30 bg-violet-950/60 text-violet-300"
          >
            <Sparkles className="h-3 w-3 mr-1" /> Plateforme Pédagogique Intégrée
          </Badge>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl leading-snug">
            La gestion scolaire moderne, simplifiée et certifiée.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Centralisez la scolarité de votre établissement : inscriptions,
            saisie collaborative des notes, calcul automatisé des classements et
            génération haute fidélité des bulletins scolaires officiels.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Saisie rapide et sécurisée des notes par les enseignants',
              'Prise en compte directe des notes saisies dans les bulletins',
              'Calcul instantané des moyennes, pourcentages et rangs',
              'Consultation autonome en temps réel pour élèves et tuteurs',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-500">
          <span>Kotaschool © 2026 · Tous droits réservés</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Sécurité & Traçabilité
          </span>
        </div>
      </div>

      {/* ── Right Login Form Area ── */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Brand Top */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft-md mb-3">
              <School className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Kotaschool</h1>
            <p className="text-xs text-slate-500">Gestion scolaire & bulletins</p>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Bienvenue sur Kotaschool
            </h2>
            <p className="text-sm text-slate-500">
              Saisissez vos identifiants pour accéder à votre espace sécurisé.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" requiredIndicator>
                Adresse e-mail
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="nom@kotaschool.cd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" requiredIndicator>
                  Mot de passe
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full text-base font-semibold"
            >
              Se connecter
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft-sm">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              Comptes de test (Cliquez pour remplir) :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  setDemoAccount('fordimalanda7@gmail.com', 'MALANDA100')
                }
                className="flex flex-col items-start rounded-lg border border-slate-200/70 p-2 text-left hover:border-brand-500 hover:bg-brand-50/40 transition-colors"
              >
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800">
                  <ShieldCheck className="h-3 w-3 text-brand-600" />
                  Admin
                </span>
                <span className="text-[10px] text-slate-400 truncate w-full">
                  fordimalanda7@...
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDemoAccount('jean.kabamba@kotaschool.cd', 'prof')
                }
                className="flex flex-col items-start rounded-lg border border-slate-200/70 p-2 text-left hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors"
              >
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800">
                  <GraduationCap className="h-3 w-3 text-emerald-600" />
                  Enseignant
                </span>
                <span className="text-[10px] text-slate-400 truncate w-full">
                  jean.kabamba@...
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDemoAccount('beya.mbombo.gloria@kotaschool.cd', 'student')
                }
                className="flex flex-col items-start rounded-lg border border-slate-200/70 p-2 text-left hover:border-violet-500 hover:bg-violet-50/40 transition-colors"
              >
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800">
                  <Users className="h-3 w-3 text-violet-600" />
                  Élève
                </span>
                <span className="text-[10px] text-slate-400 truncate w-full">
                  beya.mbombo...
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
