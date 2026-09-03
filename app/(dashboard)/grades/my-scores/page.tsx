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
  eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string };
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
  { bg: 'rgba(124, 58, 237, 0.75)', border: 'rgb(124, 58, 237)' },
  { bg: 'rgba(16, 185, 129, 0.75)', border: 'rgb(16, 185, 129)' },
];

// Calcule la moyenne sur 20 par matière à partir des résultats bruts
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

// ─── Composant Graphique ─────────────────────────────────────────────────────

function GradesChart({ semestres }: { semestres: SemestreView[] }) {
  // Collecter toutes les matières
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
      borderRadius: 6,
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
        labels: { font: { size: 12, family: "'Inter', sans-serif" }, padding: 16, usePointStyle: true },
      },
      title: {
        display: true,
        text: 'Moyennes par matière (sur 20)',
        font: { size: 14, weight: 'bold', family: "'Inter', sans-serif" },
        color: '#1e293b',
        padding: { bottom: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ctx.parsed.y !== null ? `${ctx.dataset.label}: ${ctx.parsed.y}/20` : `${ctx.dataset.label}: —`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          maxRotation: 35,
          minRotation: 0,
        },
      },
      y: {
        min: 0,
        max: 20,
        grid: { color: 'rgba(148,163,184,0.2)' },
        ticks: {
          stepSize: 2,
          font: { size: 11 },
          callback: (v) => `${v}/20`,
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
}

// ─── Badge statut ─────────────────────────────────────────────────────────────

const STATUT_STYLE: Record<string, string> = {
  VALIDEE: 'bg-emerald-100 text-emerald-700',
  SOUMISE: 'bg-blue-100 text-blue-700',
  BROUILLON: 'bg-amber-100 text-amber-700',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    <section className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold">📊 Mes notes en direct</h1>
        <p className="mt-1 text-sm text-slate-600">
          {data
            ? `${nomEleve(data.eleve)} — ${data.classe} · ${data.option} (${data.section}) — ${data.annee}`
            : 'Consultation de vos notes en temps réel.'}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Vous pouvez consulter vos notes à tout moment, indépendamment des bulletins officiels.
        </p>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="text-slate-500">Chargement…</p>}

      {data && (
        <>
          {/* ── Graphique d'évolution ── */}
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">📈</span>
              <h2 className="font-semibold text-slate-800">Évolution par matière</h2>
              <span className="ml-auto text-xs text-slate-400">Moyennes des notes validées / 20</span>
            </div>
            {data.semestres.every((s) => s.resultats.filter((r) => r.estValide).length === 0) ? (
              <div className="flex items-center justify-center h-40 rounded-lg bg-slate-50 border-2 border-dashed border-slate-200">
                <p className="text-sm text-slate-400">Aucune note validée pour le moment — le graphique apparaîtra ici.</p>
              </div>
            ) : (
              <GradesChart semestres={data.semestres} />
            )}
          </div>

          {/* ── Résumé rapide ── */}
          {data.semestres.some((s) => s.bulletin) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.semestres
                .filter((s) => s.bulletin)
                .map((s) => (
                  <div key={s.id} className="rounded-xl bg-white p-5 shadow-sm border">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.libelle}</p>
                    <div className="mt-3 flex items-end gap-4">
                      <div>
                        <div className="text-3xl font-bold text-brand-600">
                          {s.bulletin!.pourcentage}%
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">Pourcentage semestriel</div>
                      </div>
                      <div className="ml-auto text-right text-sm">
                        <div className="font-semibold text-slate-700">{s.bulletin!.totalObtenu} / {s.bulletin!.totalMaximum}</div>
                        <div className="text-xs text-slate-400">Points obtenus</div>
                        {s.bulletin!.rang && (
                          <div className="mt-1 text-xs text-violet-600 font-medium">Rang : {s.bulletin!.rang}</div>
                        )}
                      </div>
                    </div>
                    {/* Mini barre de progression */}
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full transition-all ${s.bulletin!.pourcentage >= 50 ? 'bg-emerald-500' : 'bg-red-400'}`}
                        style={{ width: `${Math.min(100, s.bulletin!.pourcentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ── Onglets semestres ── */}
          <div className="rounded-xl bg-white shadow-sm border">
            {/* Tabs */}
            <div className="flex border-b">
              {data.semestres.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === s.id
                      ? 'border-b-2 border-brand-600 text-brand-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s.libelle}
                  <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                    {s.resultats.filter((r) => r.estValide).length} notes
                  </span>
                </button>
              ))}
            </div>

            {/* Contenu de l'onglet actif */}
            {activeSemestre && (
              <div className="p-5">
                {activeSemestre.resultats.filter((r) => r.estValide).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="text-4xl mb-3">📭</span>
                    <p className="text-slate-500 font-medium">Aucune note validée pour ce semestre.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Vos notes apparaîtront ici au fur et à mesure que vos enseignants les saisissent et valident.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Tableau groupé par matière */}
                    {(() => {
                      const matieres = Array.from(
                        new Set(activeSemestre.resultats.filter((r) => r.estValide).map((r) => r.matiere))
                      );
                      return (
                        <div className="space-y-4">
                          {matieres.map((matiere) => {
                            const notes = activeSemestre.resultats.filter(
                              (r) => r.matiere === matiere && r.estValide
                            );
                            const moy = notes.reduce((s, r) => s + (r.maximum > 0 ? (r.note / r.maximum) * 20 : 0), 0) / notes.length;
                            const isGood = moy >= 10;
                            return (
                              <div key={matiere} className="rounded-lg border border-slate-100 overflow-hidden">
                                {/* En-tête de matière */}
                                <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                                  <span className="font-semibold text-sm text-slate-800">{matiere}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Moy. :</span>
                                    <span className={`text-sm font-bold ${isGood ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {moy.toFixed(1)}/20
                                    </span>
                                    <div className={`h-2 w-16 rounded-full bg-slate-200`}>
                                      <div
                                        className={`h-2 rounded-full ${isGood ? 'bg-emerald-500' : 'bg-red-400'}`}
                                        style={{ width: `${Math.min(100, (moy / 20) * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                {/* Lignes de notes */}
                                <table className="w-full text-sm">
                                  <tbody>
                                    {notes.map((r, i) => {
                                      const isExam = r.periode === 'Examen' || r.type === 'Examen';
                                      const on20 = r.maximum > 0 ? (r.note / r.maximum) * 20 : 0;
                                      return (
                                        <tr
                                          key={i}
                                          className={`border-t border-slate-100 ${isExam ? 'bg-violet-50/40' : ''}`}
                                        >
                                          <td className="px-4 py-2.5 text-slate-600">
                                            {isExam ? (
                                              <span className="inline-flex items-center gap-1">
                                                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                                                  Examen
                                                </span>
                                                {r.libelle}
                                              </span>
                                            ) : (
                                              <span>
                                                <span className="text-slate-400 mr-1.5">{r.periode} ·</span>
                                                {r.libelle}
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <span className={`font-semibold ${isExam ? 'text-violet-700' : 'text-slate-800'}`}>
                                              {r.note}/{r.maximum}
                                            </span>
                                            <span className="ml-2 text-xs text-slate-400">
                                              ({on20.toFixed(1)}/20)
                                            </span>
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_STYLE[r.statut] ?? 'bg-slate-100 text-slate-600'}`}>
                                              {r.statut}
                                            </span>
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
                    })()}

                    {/* Résumé du bulletin si disponible */}
                    {activeSemestre.bulletin && (
                      <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-emerald-600 text-base">✅</span>
                          <span className="text-sm font-semibold text-emerald-800">Résultats semestriels calculés</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                          <div>
                            <div className="text-xs text-slate-500">Total</div>
                            <div className="font-semibold">{activeSemestre.bulletin.totalObtenu}/{activeSemestre.bulletin.totalMaximum}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Pourcentage</div>
                            <div className="font-semibold">{activeSemestre.bulletin.pourcentage}%</div>
                          </div>
                          {activeSemestre.bulletin.rang && (
                            <div>
                              <div className="text-xs text-slate-500">Rang</div>
                              <div className="font-semibold">{activeSemestre.bulletin.rang}</div>
                            </div>
                          )}
                          {activeSemestre.bulletin.decision && (
                            <div>
                              <div className="text-xs text-slate-500">Décision</div>
                              <div className={`font-semibold text-xs ${activeSemestre.bulletin.pourcentage >= 50 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {activeSemestre.bulletin.decision}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
