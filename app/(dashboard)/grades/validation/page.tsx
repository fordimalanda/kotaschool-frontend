'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Eye,
  X,
  AlertCircle,
  Calendar,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { GradeTable, type GradeRow } from '@/components/grades/grade-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';

type PendingEvaluation = {
  id: string;
  libelle: string;
  dateEvaluation: string;
  affectation: {
    id: string;
    enseignant: { nom: string; prenom: string };
    classeMatiere: {
      classe: { libelle: string };
      matiere: { libelle: string };
    };
  };
  periode: { libelle: string } | null;
  semestre: { libelle: string };
  typeEvaluation: { libelle: string };
};

type GridData = {
  evaluation: {
    id: string;
    libelle: string;
    maximum: number;
    statut: string;
    semestre: string;
    periode: string | null;
    typeEvaluation: string;
    matiere: string;
    classe: string;
    annee: string;
  };
  rows: GradeRow[];
};

export default function ValidationPage() {
  const [pending, setPending] = useState<PendingEvaluation[] | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [grid, setGrid] = useState<GridData | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await api.get<PendingEvaluation[]>('/notes/validations');
    setPending(data);
  }

  useEffect(() => {
    refresh().catch(() =>
      setError('Impossible de charger les évaluations soumises.')
    );
  }, []);

  async function inspect(id: string) {
    setError('');
    setMessage('');
    try {
      const { data } = await api.get<GridData>(`/notes/grille/${id}`);
      setGrid(data);
    } catch {
      setError('Grille indisponible.');
    }
  }

  async function validate(id: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/notes/validations/${id}/valider`);
      setGrid(null);
      await refresh();
      setMessage('Évaluation validée avec succès et verrouillée.');
    } catch {
      setError('Validation impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-brand-600" />
            Validation Pédagogique des Notes
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Contrôlez la conformité des évaluations soumises par les enseignants
            avant publication officielle des bulletins.
          </p>
        </div>
        {pending && (
          <Badge
            variant={pending.length > 0 ? 'warning' : 'success'}
            className="self-start sm:self-auto text-xs"
          >
            {pending.length} évaluation{pending.length > 1 ? 's' : ''} en attente
          </Badge>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* ── Pending List ── */}
      {pending === null ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            <span className="text-xs font-medium">Chargement des soumissions…</span>
          </div>
        </div>
      ) : pending.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Toutes les évaluations sont à jour"
          description="Aucune évaluation soumise n'est en attente de validation officielle par l'administrateur."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft-sm">
          <div className="border-b border-slate-100 p-4 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-900">
              Soumissions en cours d&apos;examen
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-100/70 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="p-3.5">Évaluation</th>
                  <th className="p-3.5">Classe & Matière</th>
                  <th className="p-3.5">Type & Période</th>
                  <th className="p-3.5">Enseignant</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map((ev) => {
                  const teacherName = `${ev.affectation.enseignant.nom} ${ev.affectation.enseignant.prenom}`;
                  return (
                    <tr
                      key={ev.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {ev.libelle}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(ev.dateEvaluation).toLocaleDateString(
                            'fr-FR'
                          )}{' '}
                          · {ev.semestre.libelle}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="violet" className="text-[10px]">
                          {ev.affectation.classeMatiere.classe.libelle}
                        </Badge>
                        <p className="text-xs text-slate-600 font-medium mt-1">
                          {ev.affectation.classeMatiere.matiere.libelle}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <span className="text-xs text-slate-700 font-medium">
                          {ev.typeEvaluation.libelle}
                        </span>
                        <p className="text-xs text-slate-400">
                          {ev.periode?.libelle ?? 'Examen Semestriel'}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={teacherName} size="sm" />
                          <span className="text-xs font-medium text-slate-800">
                            {teacherName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => inspect(ev.id)}
                          className="mr-2 text-xs"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Consulter
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => validate(ev.id)}
                          disabled={busy}
                          loading={busy}
                          className="text-xs"
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Valider
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Inspected Grid Drawer / Modal ── */}
      {grid && (
        <section className="space-y-4 animate-scale-in">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {grid.evaluation.libelle}
                </h3>
                <Badge variant="sky">Examen en cours</Badge>
              </div>
              <p className="text-xs text-slate-500">
                {grid.evaluation.classe} · {grid.evaluation.matiere} ·{' '}
                {grid.evaluation.semestre}
                {grid.evaluation.periode
                  ? ` · ${grid.evaluation.periode}`
                  : ' · Examen'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGrid(null)}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Fermer
              </Button>
              <Button
                size="sm"
                onClick={() => validate(grid.evaluation.id)}
                disabled={busy}
                loading={busy}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Approuver & Verrouiller
              </Button>
            </div>
          </div>

          <GradeTable
            rows={grid.rows}
            maximum={grid.evaluation.maximum}
            onChange={() => {}}
            readOnly
          />
        </section>
      )}
    </section>
  );
}
