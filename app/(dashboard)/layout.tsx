'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  Calendar,
  Edit3,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  Award,
  LogOut,
  Menu,
  X,
  School,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const links: NavLinkItem[] = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'TEACHER', 'STUDENT'],
  },
  {
    href: '/students',
    label: 'Élèves & Inscriptions',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    href: '/teachers',
    label: 'Corps Enseignant',
    icon: GraduationCap,
    roles: ['ADMIN'],
  },
  {
    href: '/academic',
    label: 'Structure & Matières',
    icon: Layers,
    roles: ['ADMIN'],
  },
  {
    href: '/assignments',
    label: 'Affectations Pédagogiques',
    icon: Calendar,
    roles: ['ADMIN'],
  },
  {
    href: '/grades/entry',
    label: 'Saisie des Notes',
    icon: Edit3,
    roles: ['TEACHER'],
  },
  {
    href: '/reports',
    label: 'Bulletins & Palmarès',
    icon: FileSpreadsheet,
    roles: ['ADMIN'],
  },
  {
    href: '/grades/my-scores',
    label: 'Mes Notes en Direct',
    icon: TrendingUp,
    roles: ['STUDENT'],
  },
  {
    href: '/grades/my-notes',
    label: 'Mes Bulletins & Palmarès',
    icon: Award,
    roles: ['STUDENT'],
  },
];

const roleLabels: Record<string, { label: string; variant: 'default' | 'violet' | 'success' | 'warning' | 'sky' }> = {
  ADMIN: { label: 'Administrateur', variant: 'default' },
  TEACHER: { label: 'Enseignant', variant: 'success' },
  STUDENT: { label: 'Élève', variant: 'violet' },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const hydrated = useAuthStore((s) => s.hydrated);
  const router = useRouter();
  const path = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on page navigate
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  const current = links.find((l) => path.startsWith(l.href));
  const authorized = !current || !user || current.roles.includes(user.role);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login');
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-300">
            Initialisation de l&apos;espace Kotaschool…
          </p>
        </div>
      </div>
    );
  }

  const roleInfo = roleLabels[user.role] ?? {
    label: user.roleLabel ?? user.role,
    variant: 'default',
  };

  const visibleLinks = links.filter(
    (l) => !user || l.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 p-6 text-white shadow-2xl flex flex-col justify-between animate-scale-in">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-glow-brand">
                    <School className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-lg font-bold tracking-tight text-white">
                      Kotaschool
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Système Éducatif · EPSP
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 mb-3 px-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Navigation
                </p>
              </div>

              <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)]">
                {visibleLinks.map((l) => {
                  const Icon = l.icon;
                  const isActive = path === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                          : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400')} />
                      <span>{l.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Pill Bottom */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center gap-3">
                <Avatar name={user.username ?? 'Utilisateur'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {user.username}
                  </p>
                  <Badge variant={roleInfo.variant} className="text-[10px] py-0 px-1.5 mt-0.5">
                    {roleInfo.label}
                  </Badge>
                </div>
                <button
                  onClick={() => {
                    clear();
                    router.push('/login');
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400"
                  title="Déconnexion"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden border-r border-slate-800/60 bg-slate-950 p-6 text-slate-100 lg:flex lg:flex-col lg:justify-between sticky top-0 h-screen">
        <div>
          {/* Logo Brand */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand transition-transform duration-200 group-hover:scale-105">
              <School className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white">
                  Kotaschool
                </span>
              </div>
              <p className="text-xs text-slate-400">Système Éducatif · EPSP</p>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="mt-8 mb-2 px-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Menu Principal
            </p>
          </div>

          <nav className="space-y-1.5">
            {visibleLinks.map((l) => {
              const Icon = l.icon;
              const isActive =
                path === l.href ||
                (l.href !== '/dashboard' && path.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 font-semibold'
                      : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-white'
                      )}
                    />
                    <span>{l.label}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-brand-200" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Bottom Footer */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-3.5 shadow-inner">
          <div className="flex items-center gap-3">
            <Avatar name={user.username ?? 'U'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {user.username}
              </p>
              <div className="mt-0.5">
                <Badge
                  variant={roleInfo.variant}
                  className="text-[10px] py-0 px-1.5"
                >
                  {roleInfo.label}
                </Badge>
              </div>
            </div>
            <button
              onClick={() => {
                clear();
                router.push('/login');
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Mobile burger toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Context */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Portail Kotaschool</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">
                {current?.label ?? 'Page'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Academic Session Pill */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/70 px-3 py-1 text-xs font-semibold text-brand-700 shadow-soft-sm">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <span>Année Active · 2026–2027</span>
            </div>


            {/* Logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clear();
                router.push('/login');
              }}
              className="text-xs text-slate-600 hover:text-rose-600 hover:border-rose-200"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {authorized ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-rose-900">
                Accès non autorisé
              </h3>
              <p className="mt-1 max-w-md text-xs sm:text-sm text-rose-700">
                Votre rôle actuel ({user?.roleLabel ?? user?.role}) ne dispose
                pas des droits nécessaires pour accéder à cette rubrique.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-rose-300 text-rose-700 hover:bg-rose-100"
                onClick={() => router.push('/dashboard')}
              >
                Retour au tableau de bord
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
