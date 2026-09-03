'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Edit3, Save, Send, CheckCircle2, AlertTriangle, RotateCcw, AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { GradeTable, type GradeRow } from '@/components/grades/grade-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Period slot definition ───────────────────────────────────────────────────

type PeriodSlot = {
  key: string;
  label: string;
  displayLabel: string;   // shown in the grid header
  semestreIndex: number;  // 0 = S1, 1 = S2
  periodeIndex: number | null; // null = examen
  semGroupLabel: string;
};

const SLOTS: PeriodSlot[] = [
  { key: 'p1',    label: 'P1 - Cotes', displayLabel: 'Periode 1',  semestreIndex: 0, periodeIndex: 0,    semGroupLabel: '1er Semestre' },
  { key: 'p2',    label: 'P2 - Cotes', displayLabel: 'Periode 2',  semestreIndex: 0, periodeIndex: 1,    semGroupLabel: '1er Semestre' },
  { key: 'ex1',   label: 'Examen',     displayLabel: 'Examen S1',  semestreIndex: 0, periodeIndex: null, semGroupLabel: '1er Semestre' },
  { key: 'p3',    label: 'P3 - Cotes', displayLabel: 'Periode 3',  semestreIndex: 1, periodeIndex: 0,    semGroupLabel: '2eme Semestre' },
  { key: 'p4',    label: 'P4 - Cotes', displayLabel: 'Periode 4',  semestreIndex: 1, periodeIndex: 1,    semGroupLabel: '2eme Semestre' },
  { key: 'ex2',   label: 'Examen',     displayLabel: 'Examen S2',  semestreIndex: 1, periodeIndex: null, semGroupLabel: '2eme Semestre' },
];

const STATUT_BADGE: Record<string, 'warning' | 'sky' | 'success'> = {
  BROUILLON: 'warning',
  SOUMISE: 'sky',
  VALIDEE: 'success',
};

const STATUT_LABEL: Record<string, string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Soumise',
  VALIDEE: 'Validee',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GradeEntryPage() {
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [assignmentId, setAssignmentId] = useState('');
  const [selectedSlotKey, setSelectedSlotKey] = useState('');
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

  // Evaluations for current assignment
  const evals = ctx?.evaluations.filter((e) => e.affectation.id === assignmentId) ?? [];

  // Find an existing evaluation for a given slot
  function findEvalForSlot(slot: PeriodSlot): Evaluation | null {
    if (!ctx) return null;
    const sem = ctx.semestres[slot.semestreIndex];
    if (!sem) return null;

    for (const ev of evals) {
      if (ev.semestre.libelle !== sem.libelle) continue;

      if (slot.periodeIndex === null) {
        // Examen: periode is null OR libelle contains "exam"
        if (!ev.periode || ev.periode.libelle.toLowerCase().includes('exam')) {
          return ev;
        }
      } else {
        const expectedPeriode = sem.periodes[slot.periodeIndex];
        if (!expectedPeriode) continue;
        if (ev.periode && ev.periode.libelle === expectedPeriode.libelle) {
          return ev;
        }
      }
    }
    return null;
  }

  const isValidee = !!grid && grid.evaluation.statut === 'VALIDEE';
  const isBrouillon = !!grid && grid.evaluation.statut === 'BROUILLON';
  const editable = isBrouillon || (isValidee && correctionMode);

  async function refreshContext() {
    const { data } = await api.get<Ctx>('/notes/context');
    setCtx((prev) => (prev ? { ...prev, evaluations: data.evaluations } : data));
    return data;
  }

  async function loadGrid(id: string) {
    const { data } = await api.get<GridData>(`/notes/grille/${id}`);
    setGrid(data);
    setRows(data.rows);
    setError('');
    setCorrectionMode(false);
  }

  async function handleSlotChange(slotKey: string) {
    setSelectedSlotKey(slotKey);
    setGrid(null);
    setEvaluationId('');
    setCorrectionMode(false);
    setError('');
    setMessage('');

    if (!slotKey || !ctx) return;

    const slot = SLOTS.find((s) => s.key === slotKey);
    if (!slot) return;

    const sem = ctx.semestres[slot.semestreIndex];
    if (!sem) {
      setError("Semestre introuvable dans le contexte.");
      return;
    }

    // Check if evaluation already exists
    const existing = findEvalForSlot(slot);
    if (existing) {
      setEvaluationId(existing.id);
      await loadGrid(existing.id).catch(() => setError('Grille indisponible.'));
      return;
    }

    // Auto-create the evaluation for this period slot
    setBusy(true);
    try {
      const periodeId = slot.periodeIndex !== null
        ? (sem.periodes[slot.periodeIndex]?.id ?? undefined)
        : undefined;

      const libelle = slot.periodeIndex !== null
        ? `${slot.label} - ${sem.periodes[slot.periodeIndex]?.libelle ?? ''}`
        : `Examen - ${sem.libelle}`;

      const typeId = ctx.typesEvaluation[0]?.id;

      const { data } = await api.post('/notes/evaluations', {
        libelle,
        idAffectation: assignmentId,
        idSemestre: sem.id,
        idPeriode: periodeId,
        idTypeEvaluation: typeId,
        dateEvaluation: new Date().toISOString().slice(0, 10),
      });

      await refreshContext();
      setEvaluationId(data.id);
      await loadGrid(data.id);
      setMessage('Periode creee. Vous pouvez saisir les cotes.');
    } catch {
      setError("Impossible de creer la periode. Verifiez votre connexion.");
    } finally {
      setBusy(false);
    }
  }

  function changeAssignment(id: string) {
    setAssignmentId(id);
    setSelectedSlotKey('');
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
        setMessage('Corrections enregistrees et bulletins recalcules.');
        setCorrectionMode(false);
      } else {
        setMessage('Cotes sauvegardees en brouillon.');
      }
    } catch {
      setError("Echec de l'enregistrement.");
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
      setMessage('Cotes soumises avec succes au Conseil Pedagogique.');
    } catch {
      setError("Soumission impossible : au moins une cote doit etre saisie.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <span className="text-xs font-medium">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error || 'Contexte indisponible.'}
      </div>
    );
  }

  // Build visible slots (only for semestres that exist in ctx)
  const s1Slots = SLOTS.filter((s) => s.semestreIndex === 0 && ctx.semestres[0]);
  const s2Slots = SLOTS.filter((s) => s.semestreIndex === 1 && ctx.semestres[1]);

  const currentSlot = SLOTS.find((s) => s.key === selectedSlotKey) ?? null;

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
            Choisissez votre classe, selectionnez la periode et saisissez les cotes.
          </p>
        </div>
        <Badge variant="secondary" className="self-start sm:self-auto font-mono">
          Session 2026-2027
        </Badge>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Affectation */}
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

          {/* Period slot selector */}
          <div className="space-y-1.5">
            <Label>Saisie de Cotes (Periode)</Label>
            <Select
              value={selectedSlotKey}
              onChange={(e) => handleSlotChange(e.target.value)}
              disabled={busy}
            >
              <option value="">-- Choisir une periode --</option>

              {s1Slots.length > 0 && (
                <optgroup label="1er Semestre">
                  {s1Slots.map((slot) => (
                    <option key={slot.key} value={slot.key}>
                      {slot.label}
                    </option>
                  ))}
                </optgroup>
              )}

              {s2Slots.length > 0 && (
                <optgroup label="2eme Semestre">
                  {s2Slots.map((slot) => (
                    <option key={slot.key} value={slot.key}>
                      {slot.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </div>
        </div>
      </div>

      {/* Grade Grid Section */}
      {grid && currentSlot && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {currentSlot.label} &mdash; {grid.evaluation.matiere}
                </h3>
                <Badge variant={STATUT_BADGE[grid.evaluation.statut] ?? 'secondary'}>
                  {STATUT_LABEL[grid.evaluation.statut] ?? grid.evaluation.statut}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {grid.evaluation.classe} &middot; {currentSlot.semGroupLabel} &middot; {grid.evaluation.annee}
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
                  <p className="text-sm font-semibold text-amber-900">Cotes Validees Officiellement</p>
                  <p className="text-xs text-amber-700">
                    Vous pouvez corriger une cote en cas d&apos;erreur. Les bulletins seront mis a jour automatiquement.
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
                <strong>Mode correction actif :</strong> modifiez les cotes puis cliquez sur{' '}
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