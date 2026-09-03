'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Edit3,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { GradeTable, type GradeRow } from '@/components/grades/grade-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

type Assignment = {
  id: string;
  annee: { libelle: string };
  classeMatiere: {
    id: string;
    classe: { libelle: string };
    matiere: { libelle: string };
  };
};

type Semestre = {
  id: string;
  libelle: string;
  annee: { libelle: string };
  periodes: { id: string; libelle: string }[];
};
type TypeEval = { id: string; libelle: string };

type Evaluation = {
  id: string;
  libelle: string;
  statut: string;
  dateEvaluation: string;
  affectation: {
    id: string;
    classeMatiere: {
      classe: { libelle: string };
      matiere: { libelle: string };
    };
  };
  periode: { libelle: string } | null;
  semestre: { libelle: string };
  typeEvaluation: { libelle: string };
};

type Ctx = {
  assignments: Assignment[];
  semestres: Semestre[];
  typesEvaluation: TypeEval[];
  evaluations: Evaluation[];
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

const STATUT_BADGE: Record<string, 'warning' | 'sky' | 'success'> = {
  BROUILLON: 'warning',
  SOUMISE: 'sky',
  VALIDEE: 'success',
};

const STATUT_LABEL: Record<string, string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Soumise',
  VALIDEE: 'Valid&eacute;e',
};

function getPeriodLabel(ev: Evaluation, semIndex: number): string {
  const lib = ev.libelle.toLowerCase();
  const per = (ev.periode?.libelle ?? '').toLowerCase();
  if (!ev.periode || lib.includes('exam') || per.includes('exam')) {
    return 'Examen';
  }
  if (semIndex === 0) {
    if (per.includes('1') || lib.includes('p1')) return 'P1 - Cotes';
    if (per.includes('2') || lib.includes('p2')) return 'P2 - Cotes';
  } else {
    if (per.includes('3') || lib.includes('p3')) return 'P3 - Cotes';
    if (per.includes('4') || lib.includes('p4')) return 'P4 - Cotes';
  }
  return ev.libelle;
}

export default function GradeEntryPage() {
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [evaluationId, setEvaluationId] = useState('');
  const [grid, setGrid] = useState<GridData | null>(null);
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    api
      .get<Ctx>('/notes/context')
      .then(({ data }) => {
        setCtx(data);
        const qId = searchParams.get('assignmentId');
        const targetId =
          qId && data.assignments.find((a) => a.id === qId)
            ? qId
            : data.assignments[0]?.id ?? '';
        setAssignmentId(targetId);
      })
      .catch(() => setError("Impossible de charger le contexte."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const evals = ctx?.evaluations.filter((e) => e.affectation.id === assignmentId) ?? [];
  const sem0Label = ctx?.semestres[0]?.libelle ?? '';
  const sem1Label = ctx?.semestres[1]?.libelle ?? '__NONE__';
  const s1Evals = evals.filter((ev) => ev.semestre.libelle === sem0Label);
  const s2Evals = evals.filter((ev) => ev.semestre.libelle === sem1Label);
  const fallbackEvals = evals.filter(
    (ev) => ev.semestre.libelle !== sem0Label && ev.semestre.libelle !== sem1Label
  );

  const isValidee = !!grid && grid.evaluation.statut === 'VALIDEE';
  const isBrouillon = !!grid && grid.evaluation.statut === 'BROUILLON';
  const editable = isBrouillon || (isValidee && correctionMode);

  async function refreshContext() {
    const { data } = await api.get<Ctx>('/notes/context');
    setCtx((prev) => (prev ? { ...prev, evaluations: data.evaluations } : data));
  }

  async function loadGrid(id: string) {
    const { data } = await api.get<GridData>(`/notes/grille/${id}`);
    setGrid(data);
    setRows(data.rows);
    setError('');
    setCorrectionMode(false);
  }

  function changeEvaluation(id: string) {
    setEvaluationId(id);
    setGrid(null);
    setCorrectionMode(false);
    if (id) loadGrid(id).catch(() => setError('Grille indisponible.'));
  }

  function changeAssignment(id: string) {
    setAssignmentId(id);
    setEvaluationId('');
    setGrid(null);
    setCorrectionMode(false);
  }

  async function saveDraft() {
    if (!grid) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const payload = rows.map((r) => ({
        idInscription: r.idInscription,
        valeurNote: r.valeurNote ?? undefined,
        observation: r.observation,
      }));
      await api.post('/notes/batch', { idEvaluation: grid.evaluation.id, notes: payload });
      await loadGrid(grid.evaluation.id);
      if (isValidee) {
        setMessage('Corrections enregistrees et bulletins recalcules automatiquement.');
        setCorrectionMode(false);
      } else {
        setMessage('Notes sauvegardees en brouillon avec succes.');
      }
    } catch {
      setError("Echec de l'enregistrement des notes.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!grid) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/notes/evaluations/${grid.evaluation.id}/soumettre`);
      await refreshContext();
      await loadGrid(grid.evaluation.id);
      setMessage('Evaluation soumise avec succes au Conseil Pedagogique pour validation.');
    } catch {
      setError("Soumission impossible : assurez-vous qu'au moins une note est saisie.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <span className="text-xs font-medium">Chargement du contexte...</span>
        </div>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error || 'Contexte de saisie indisponible.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Edit3 className="h-6 w-6 text-brand-600" />
            Saisie &amp; Correction des Notes
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Enregistrez les cotes par periode et soumettez-les au Conseil Pedagogique.
          </p>
        </div>
        <Badge variant="secondary" className="self-start sm:self-auto font-mono">
          Session 2026-2027
        </Badge>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Classe &amp; Matiere (Affectation)</Label>
            <Select
              value={assignmentId}
              onChange={(e) => changeAssignment(e.target.value)}
            >
              {ctx.assignments.length === 0 && (
                <option value="">Aucune affectation active</option>
              )}
              {ctx.assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.classeMatiere.classe.libelle} -- {a.classeMatiere.matiere.libelle} ({a.annee.libelle})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Saisie de Cotes (Periode)</Label>
            <Select
              value={evaluationId}
              onChange={(e) => changeEvaluation(e.target.value)}
            >
              <option value="">-- Choisir une periode --</option>
              {s1Evals.length > 0 && (
                <optgroup label="1er Semestre">
                  {s1Evals.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {getPeriodLabel(ev, 0)}
                    </option>
                  ))}
                </optgroup>
              )}
              {s2Evals.length > 0 && (
                <optgroup label="2eme Semestre">
                  {s2Evals.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {getPeriodLabel(ev, 1)}
                    </option>
                  ))}
                </optgroup>
              )}
              {s1Evals.length === 0 && s2Evals.length === 0 && fallbackEvals.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.libelle} - {STATUT_LABEL[ev.statut] ?? ev.statut}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Grade Grid Section */}
      {grid && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {grid.evaluation.libelle}
                </h3>
                <Badge variant={STATUT_BADGE[grid.evaluation.statut] ?? 'secondary'}>
                  {STATUT_LABEL[grid.evaluation.statut] ?? grid.evaluation.statut}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {grid.evaluation.classe} - {grid.evaluation.matiere} - {grid.evaluation.semestre}
                {grid.evaluation.periode ? ` - ${grid.evaluation.periode}` : ' - Examen'}{' '}
                - {grid.evaluation.typeEvaluation} - Annee {grid.evaluation.annee}
              </p>
            </div>
          </div>

          {isValidee && !correctionMode && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-soft-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Evaluation Validee Officiellement
                  </p>
                  <p className="text-xs text-amber-700">
                    Vous pouvez corriger une note en cas d&apos;erreur. Les bulletins seront mis a jour automatiquement.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setCorrectionMode(true)}
                variant="outline"
                size="sm"
                className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
              >
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                Activer la correction
              </Button>
            </div>
          )}

          {isValidee && correctionMode && (
            <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-xs font-medium text-orange-900 shadow-soft-sm">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
              <span>
                <strong>Mode correction actif :</strong> modifiez les notes dans le tableau ci-dessous, puis cliquez sur{' '}
                <strong>Enregistrer les corrections</strong> pour recalculer les bulletins.
              </span>
            </div>
          )}

          <GradeTable
            rows={rows}
            maximum={grid.evaluation.maximum}
            onChange={setRows}
            readOnly={!editable}
          />

          {editable && (
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              {isBrouillon && (
                <>
                  <Button onClick={saveDraft} disabled={busy} variant="outline" loading={busy}>
                    <Save className="mr-1.5 h-4 w-4" />
                    Enregistrer en brouillon
                  </Button>
                  <Button onClick={submit} disabled={busy} variant="default" loading={busy}>
                    <Send className="mr-1.5 h-4 w-4" />
                    Soumettre au Conseil
                  </Button>
                </>
              )}
              {isValidee && correctionMode && (
                <>
                  <Button
                    onClick={() => { loadGrid(grid.evaluation.id); setCorrectionMode(false); }}
                    variant="outline"
                    disabled={busy}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Annuler
                  </Button>
                  <Button onClick={saveDraft} disabled={busy} variant="default" loading={busy}>
                    <Save className="mr-1.5 h-4 w-4" />
                    Enregistrer les corrections
                  </Button>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {message && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}