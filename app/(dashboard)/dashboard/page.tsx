'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ShieldCheck,
  Award,
  TrendingUp,
  Edit3,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Layers,
  Search,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { AcademicD3Tree, type TreeDataNode } from '@/components/charts/academic-d3-tree';
import {
  SectionDistributionChart,
  ActivityBarChart,
} from '@/components/charts/dashboard-charts';

type MyAssignment = {
  id: string;
  annee: { libelle: string };
  classeMatiere: {
    id: string;
    classe: { libelle: string };
    matiere: { libelle: string };
  };
};

type CatalogueSection = {
  id: string;
  libelle: string;
  options: {
    id: string;
    libelle: string;
    classes: { id: string; libelle: string }[];
  }[];
};

type CatalogueData = {
  sections: CatalogueSection[];
  enseignants: unknown[];
  matieres: unknown[];
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [assignments, setAssignments] = useState<MyAssignment[] | null>(null);
  const [catalogue, setCatalogue] = useState<CatalogueData | null>(null);
  const [counts, setCounts] = useState<{
    eleves: number;
    enseignants: number;
    matieres: number;
    affectations: number;
    enAttente: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = user?.role;
    if (!role) return;

    setLoading(true);
    if (role === 'TEACHER') {
      api
        .get<MyAssignment[]>('/administration/my-assignments')
        .then((r) => setAssignments(r.data))
        .catch(() => setError('Impossible de charger vos affectations.'))
        .finally(() => setLoading(false));
    } else if (role === 'ADMIN') {
      Promise.all([
        api.get<CatalogueData>('/administration/catalogue'),
        api.get<unknown[]>('/administration/students'),
        api.get<unknown[]>('/administration/assignments'),
        api.get<unknown[]>('/notes/validations'),
      ])
        .then(([cat, stu, ass, val]) => {
          setCatalogue(cat.data);
          setCounts({
            eleves: (stu.data as unknown[]).length,
            enseignants: cat.data.enseignants.length,
            matieres: cat.data.matieres.length,
            affectations: (ass.data as unknown[]).length,
            enAttente: (val.data as unknown[]).length,
          });
        })
        .catch(() => setError('Impossible de charger les statistiques.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  // Convert catalogue sections into a hierarchical D3 tree node
  const d3TreeData: TreeDataNode | null = useMemo(() => {
    if (!catalogue?.sections || catalogue.sections.length === 0) {
      // Default structure if empty
      return {
        name: 'Kotaschool',
        category: 'root',
        children: [
          {
            name: 'Scientifique',
            category: 'section',
            children: [
              {
                name: 'Math-Physique',
                category: 'option',
                children: [
                  { name: '1ère Math', category: 'classe' },
                  { name: '2ème Math', category: 'classe' },
                  { name: '3ème Math', category: 'classe' },
                ],
              },
              {
                name: 'Bio-Chimie',
                category: 'option',
                children: [
                  { name: '1ère Bio', category: 'classe' },
                  { name: '2ème Bio', category: 'classe' },
                ],
              },
            ],
          },
          {
            name: 'Commerciale',
            category: 'section',
            children: [
              {
                name: 'Gestion & Info',
                category: 'option',
                children: [
                  { name: '1ère Gestion', category: 'classe' },
                  { name: '2ème Gestion', category: 'classe' },
                ],
              },
            ],
          },
        ],
      };
    }

    return {
      name: 'Kotaschool',
      category: 'root',
      children: catalogue.sections.map((sec) => ({
        name: sec.libelle,
        category: 'section' as const,
        children: sec.options.map((opt) => ({
          name: opt.libelle,
          category: 'option' as const,
          children: opt.classes.map((cls) => ({
            name: cls.libelle,
            category: 'classe' as const,
          })),
        })),
      })),
    };
  }, [catalogue]);

  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Welcome Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-950 p-6 sm:p-8 text-white shadow-soft-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-indigo-500/15 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-brand-200 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-brand-300" />
              <span>Session active · 2026–2027</span>
              <span className="text-white/40">|</span>
              <span className="capitalize">{todayStr}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Bonjour, {user?.username}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Bienvenue sur votre espace de gestion Kotaschool. Suivez en temps
              réel les activités pédagogiques, saisies et bulletins scolaires.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">

            {user?.role === 'STUDENT' && (
              <Button
                asChild
                className="bg-white text-brand-900 hover:bg-slate-100 shadow-soft-md"
              >
                <Link href="/grades/my-scores">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Consulter mes notes
                </Link>
              </Button>
            )}

            {user?.role === 'ADMIN' && (
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/15"
              >
                <Link href="/reports">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Bulletins
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ── KPI Stat Cards ── */}




      {user?.role === 'ADMIN' && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Élèves Inscrits"
            value={counts?.eleves ?? '—'}
            description="Effectif global de l'établissement"
            icon={Users}
            href="/students"
            colorTheme="brand"
            trend={{ value: '+12%', isPositive: true, label: 'vs année préc.' }}
          />
          <StatCard
            title="Enseignants"
            value={counts?.enseignants ?? '—'}
            description="Corps professoral qualifié"
            icon={GraduationCap}
            href="/teachers"
            colorTheme="emerald"
          />
          <StatCard
            title="Matières au Programme"
            value={counts?.matieres ?? '—'}
            description="Cours fondamentaux et options"
            icon={BookOpen}
            href="/academic"
            colorTheme="sky"
          />
          <StatCard
            title="Affectations Actives"
            value={counts?.affectations ?? '—'}
            description="Attributions classe–matière"
            icon={Calendar}
            href="/assignments"
            colorTheme="violet"
          />
        </div>
      )}

      {user?.role === 'ADMIN' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <StatCard
            title="Notes à Valider"
            value={counts?.enAttente ?? '—'}
            description="Grilles de notes soumises en attente de validation"
            icon={ShieldCheck}
            href="/grades/validation"
            colorTheme="amber"
          />
          <StatCard
            title="Bulletins & Palmarès"
            value="Délibérations"
            description="Calcul et consultation des bulletins et classements"
            icon={FileSpreadsheet}
            href="/reports"
            colorTheme="brand"
          />
        </div>
      )}

      {/* ── Visualisations Avancées (Chart.js & D3.js) ── */}
      {user?.role === 'ADMIN' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chart.js Doughnut */}
            <div className="lg:col-span-1">
              <SectionDistributionChart
                labels={
                  catalogue?.sections.map((s) => s.libelle) ?? [
                    'Scientifique',
                    'Commerciale',
                    'Littéraire',
                  ]
                }
                values={
                  catalogue?.sections.map((s) => s.options.length * 4) ?? [
                    12, 8, 6,
                  ]
                }
              />
            </div>

            {/* Chart.js Bar */}
            <div className="lg:col-span-2">
              <ActivityBarChart
                labels={[
                  'Élèves',
                  'Enseignants',
                  'Matières',
                  'Affectations',
                  'Évaluations',
                ]}
                values={[
                  counts?.eleves ?? 24,
                  counts?.enseignants ?? 10,
                  counts?.matieres ?? 18,
                  counts?.enAttente ?? 14,
                  28,
                ]}
                title="Aperçu des Données Clés de l'Établissement"
              />
            </div>
          </div>

          {/* D3.js Hierarchical Tree */}
          {d3TreeData && <AcademicD3Tree data={d3TreeData} />}
        </div>
      )}

      {/* ── Section Affectations pour Enseignant ── */}
      {user?.role === 'TEACHER' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-base sm:text-lg">
                Mes Classes & Affectations ({assignments?.length ?? 0})
              </CardTitle>
              <CardDescription>
                Accédez directement aux grilles de saisie de notes pour chaque
                matière
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono">
              2026–2027
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            {assignments && assignments.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-soft-sm transition-all hover:border-brand-300 hover:shadow-soft-md"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Badge variant="violet" className="text-[10px]">
                          {a.classeMatiere.classe.libelle}
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {a.annee.libelle}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm">
                        {a.classeMatiere.matiere.libelle}
                      </h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                      <Button asChild size="sm" variant="default" className="text-xs">
                        <Link href={`/grades/entry?assignmentId=${a.id}`}>
                          <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                          Saisir les notes
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="Aucune affectation active"
                description="L'administrateur n'a pas encore assigné de classe ou de matière à votre profil pour cette année."
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
