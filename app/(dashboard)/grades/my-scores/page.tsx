'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  TrendingUp,
  BarChart3,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

// ─── Types ────────────────────────────────────────────────────────────────────

type Resultat = {
  libelle: string;
  type: string;
  periode: string;
  matiere: string;
  note: number;
  maximum: number;
  statut: string;
  estValide: boolean;
};

type LigneSem = {
  matiere: string;
  coefficient: number;
  note: number;
  noteBulletin: number;
  p1?: number;
  p2?: number;
  examen?: number;
};

type BulletinSem = {
  totalObtenu: number;
  totalMaximum: number;
  pourcentage: number;
  rang: number | null;
  decision: string | null;
  lignes: LigneSem[];
};

type SemestreView = {
  id: string;
  libelle: string;
  resultats: Resultat[];
  bulletin: BulletinSem | null;
};

type MyGrades = {
  eleve: {
    matricule: string;
    nom: string;
    postnom?: string | null;
    prenom: string;
  };
  classe: string;
  option: string;
  section: string;
  annee: string;
  semestres: SemestreView[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nomEleve(e: { nom: string; postnom?: string | null; prenom: string }): string {
  return `${e.nom} ${e.postnom ?? ''} ${e.prenom}`.trim();
}

const SEMESTRE_COLORS = [
  { bg: 'rgba(79, 70, 229, 0.85)', border: 'rgb(79, 70, 229)' },
  { bg: 'rgba(16, 185, 129, 0.85)', border: 'rgb(16, 185, 129)' },
];

function moyenneParMatiere(resultats: Resultat[]): Record<string, { sum: number; count: number }> {
  const map: Record<string, { sum: number; count: number }> = {};
  for (const r of resultats) {
    if (!r.estValide) continue;
    const on20 = r.maximum > 0 ? (r.note / r.maximum) * 20 : 0;
    if (!map[r.matiere]) map[r.matiere] = { sum: 0, count: 0 };
    map[r.matiere].sum += on20;
    map[r.matiere].count += 1;
  }
  return map;
}

// ─── Chart Component ─────────────────────────────────────────────────────────

function GradesChart({ semestres }: { semestres: SemestreView[] }) {
  const allMatieres = Array.from(
    new Set(semestres.flatMap((s) => s.resultats.map((r) => r.matiere)))
  ).sort();

  if (allMatieres.length === 0) return null;

  const datasets = semestres.map((s, i) => {
    const moyennes = moyenneParMatiere(s.resultats);
    const color = SEMESTRE_COLORS[i % SEMESTRE_COLORS.length];
    return {
      label: s.libelle,
      data: allMatieres.map((m) => {
        const d = moyennes[m];
        return d && d.count > 0 ? Math.round((d.sum / d.count) * 100) / 100 : null;
      }),
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 1.5,
      borderRadius: 8,
      borderSkipped: false,
    };
  });

  const chartData: ChartData<'bar'> = {
    labels: allMatieres,
    datasets,
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12, family: 'var(--font-sans), sans-serif' },
          padding: 16,
          usePointStyle: true,
          color: '#334155',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 12, family: 'var(--font-sans)' },
        bodyFont: { size: 12, family: 'var(--font-sans)' },
        callbacks: {
          label: (ctx) =>
            ctx.parsed.y !== null
              ? `${ctx.dataset.label}: ${ctx.parsed.y}/20`
              : `${ctx.dataset.label}: —`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, family: 'var(--font-sans)' },
          color: '#64748b',
          maxRotation: 35,
          minRotation: 0,
        },
      },
      y: {
        min: 0,
        max: 20,
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: {
          stepSize: 2,
          font: { size: 11, family: 'var(--font-sans)' },
          color: '#64748b',
          callback: (v) => `${v}/20`,
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}

// ─── Subject Grades Grouping ──────────────────────────────────────────────────

function SubjectGradesGroup({ resultats }: { resultats: Resultat[] }) {
  const valid = resultats.filter((r) => r.estValide);
  const matieres = Array.from(new Set(valid.map((r) => r.matiere)));

  return (
    <div className="space-y-4">
      {matieres.map((matiere) => {
        const notes = valid.filter((r) => r.matiere === matiere);
        const moy =
          notes.reduce(
            (s, r) => s + (r.maximum > 0 ? (r.note / r.maximum) * 20 : 0),
            0
          ) / notes.length;
        const isGood = moy >= 10;

        return (
          <div
            key={matiere}
            className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-soft-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <span className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-600" />
                {matiere}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Moyenne :</span>
                <span
                  className={`text-sm font-bold ${
                    isGood ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {moy.toFixed(1)}/20
                </span>
                <div className="h-2 w-20 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${
                      isGood ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (moy / 20) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <table className="w-full text-xs sm:text-sm text-left">
              <tbody className="divide-y divide-slate-100">
                {notes.map((r, i) => {
                  const isExam = r.periode === 'Examen' || r.type === 'Examen';
                  const on20 = r.maximum > 0 ? (r.note / r.maximum) * 20 : 0;
                  return (
                    <tr
                      key={i}
                      className={`transition-colors hover:bg-slate-50/50 ${
                        isExam ? 'bg-violet-50/30' : ''
                      }`}
                    >
                      <td className="p-3.5 text-slate-700">
                        {isExam ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="violet" className="text-[10px]">
                              Examen
                            </Badge>
                            <span className="font-medium">{r.libelle}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 mr-1.5 font-medium">
                              {r.periode} ·
                            </span>
                            <span className="font-medium">{r.libelle}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-800">
                        {r.note}/{r.maximum}
                        <span className="ml-1.5 text-xs text-slate-400 font-normal">
                          ({on20.toFixed(1)}/20)
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <Badge
                          variant={
                            r.statut === 'VALIDEE' ? 'success' : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {r.statut}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyScoresPage() {
  const [data, setData] = useState<MyGrades | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    api
      .get<MyGrades>('/notes/my-grades')
      .then((r) => {
        setData(r.data);
        if (r.data.semestres[0]) setActiveTab(r.data.semestres[0].id);
      })
      .catch(() => setError('Impossible de charger vos notes.'));
  }, []);

  const activeSemestre = data?.semestres.find((s) => s.id === activeTab) ?? null;

  return (
    <section className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <TrendingUp className="h-6 w-6 text-brand-600" />
            Mes Notes en Direct
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {data
              ? `${nomEleve(data.eleve)} · Matricule : ${data.eleve.matricule} · ${data.classe} (${data.section})`
              : 'Consultation de vos résultats scolaires en temps réel.'}
          </p>
        </div>
        <Badge variant="violet" className="self-start sm:self-auto font-mono">
          {data?.annee ?? '2026–2027'}
        </Badge>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            <span className="text-xs font-medium">
              Chargement de votre carnet de notes…
            </span>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* ── Graphique de performance ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-brand-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Moyennes Générales par Matière (sur 20)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calcul automatique basé sur vos notes validées
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Moyenne &gt;= 10/20 = Réussite
              </Badge>
            </div>

            {data.semestres.every((s) => s.resultats.filter((r) => r.estValide).length === 0) ? (
              <EmptyState
                icon={BarChart3}
                title="Aucune note validée pour le moment"
                description="Le graphique de vos performances apparaîtra automatiquement dès que vos professeurs auront saisi et validé vos premières notes."
              />
            ) : (
              <GradesChart semestres={data.semestres} />
            )}
          </div>

          {/* ── Résumé des Bulletins Semestriels ── */}
          {data.semestres.some((s) => s.bulletin) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.semestres
                .filter((s) => s.bulletin)
                .map((s) => {
                  const b = s.bulletin!;
                  const isPass = b.pourcentage >= 50;
                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {s.libelle}
                        </span>
                        {b.rang && (
                          <Badge variant="violet" className="text-xs">
                            <Award className="h-3 w-3" />
                            Rang : {b.rang}
                            {b.rang === 1 ? 'er' : 'ème'}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 flex items-baseline justify-between">
                        <div>
                          <span
                            className={`text-3xl font-bold tracking-tight ${
                              isPass ? 'text-brand-600' : 'text-rose-600'
                            }`}
                          >
                            {b.pourcentage}%
                          </span>
                          <span className="block text-xs text-slate-500 mt-0.5">
                            Pourcentage semestriel
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-800">
                            {b.totalObtenu} / {b.totalMaximum}
                          </span>
                          <span className="block text-xs text-slate-400">
                            Points obtenus
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPass ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, b.pourcentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ── Onglets de détail semestriel ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-soft-sm overflow-hidden">
            <div className="border-b border-slate-200/80 p-4 bg-slate-50/50">
              <Tabs
                tabs={data.semestres.map((s) => ({
                  id: s.id,
                  label: s.libelle,
                  count: s.resultats.filter((r) => r.estValide).length,
                }))}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>

            {activeSemestre && (
              <div className="p-5 sm:p-6">
                {activeSemestre.resultats.filter((r) => r.estValide).length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="Aucune note enregistrée pour ce semestre"
                    description="Vos évaluations pour cette période scolaire apparaîtront ici au fur et à mesure de leur validation."
                  />
                ) : (
                  <SubjectGradesGroup resultats={activeSemestre.resultats} />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
