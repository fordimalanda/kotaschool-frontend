'use client';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { GradeTable, type GradeRow } from '@/components/grades/grade-table';

type Assignment = { id: string; annee: { libelle: string }; classeMatiere: { id: string; classe: { libelle: string }; matiere: { libelle: string } } };
type Periode = { id: string; libelle: string };
type Semestre = { id: string; libelle: string; annee: { libelle: string }; periodes: Periode[] };
type TypeEval = { id: string; libelle: string };
type Evaluation = { id: string; libelle: string; statut: string; dateEvaluation: string; affectation: { id: string; classeMatiere: { classe: { libelle: string }; matiere: { libelle: string } } }; periode: { libelle: string } | null; semestre: { libelle: string }; typeEvaluation: { libelle: string } };
type Ctx = { assignments: Assignment[]; semestres: Semestre[]; typesEvaluation: TypeEval[]; evaluations: Evaluation[] };
type GridData = { evaluation: { id: string; libelle: string; maximum: number; statut: string; semestre: string; periode: string | null; typeEvaluation: string; matiere: string; classe: string; annee: string }; rows: GradeRow[] };

const STATUT_BADGE: Record<string, string> = { BROUILLON: 'bg-amber-100 text-amber-700', SOUMISE: 'bg-blue-100 text-blue-700', VALIDEE: 'bg-emerald-100 text-emerald-700' };
const STATUT_LABEL: Record<string, string> = { BROUILLON: 'Brouillon', SOUMISE: 'Soumise', VALIDEE: 'Validée' };

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

  const [showNew, setShowNew] = useState(false);
  const [semestreId, setSemestreId] = useState('');
  const [periodeId, setPeriodeId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [libelle, setLibelle] = useState('');
  const [dateEval, setDateEval] = useState(() => new Date().toISOString().slice(0, 10));

  // Mode correction (pour les évaluations validées)
  const [correctionMode, setCorrectionMode] = useState(false);

  useEffect(() => {
    api.get<Ctx>('/notes/context').then(({ data }) => {
      setCtx(data);
      if (data.assignments[0]) setAssignmentId(data.assignments[0].id);
      if (data.semestres[0]) { setSemestreId(data.semestres[0].id); setPeriodeId(data.semestres[0].periodes[0]?.id ?? ''); }
      if (data.typesEvaluation[0]) setTypeId(data.typesEvaluation[0].id);
    }).catch(() => setError("Impossible de charger le contexte. L'API est-elle démarrée ?")).finally(() => setLoading(false));
  }, []);

  const assignment = ctx?.assignments.find((a) => a.id === assignmentId) ?? null;
  const evals = ctx?.evaluations.filter((e) => e.affectation.id === assignmentId) ?? [];
  const semestre = ctx?.semestres.find((s) => s.id === semestreId) ?? null;

  // Éditable = brouillon OU correction d'une validée
  const isValidee = !!grid && grid.evaluation.statut === 'VALIDEE';
  const isBrouillon = !!grid && grid.evaluation.statut === 'BROUILLON';
  const editable = isBrouillon || (isValidee && correctionMode);

  async function refreshContext() {
    const { data } = await api.get<Ctx>('/notes/context');
    setCtx((prev) => (prev ? { ...prev, evaluations: data.evaluations } : data));
    return data.evaluations;
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
    setShowNew(false);
    setGrid(null);
    setCorrectionMode(false);
    if (id) loadGrid(id).catch(() => setError('Grille indisponible.'));
  }
  function changeAssignment(id: string) {
    setAssignmentId(id);
    setEvaluationId('');
    setShowNew(false);
    setGrid(null);
    setCorrectionMode(false);
  }

  async function createEvaluation(e: FormEvent) {
    e.preventDefault();
    if (!assignment) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await api.post('/notes/evaluations', { libelle: libelle.trim() || `Évaluation ${assignment.classeMatiere.matiere.libelle}`, idAffectation: assignmentId, idSemestre: semestreId, idPeriode: periodeId || undefined, idTypeEvaluation: typeId, dateEvaluation: dateEval });
      await refreshContext();
      setEvaluationId(data.id);
      setShowNew(false);
      setLibelle('');
      await loadGrid(data.id);
      setMessage('Évaluation créée. Saisissez les notes puis enregistrez le brouillon.');
    } catch { setError('Échec de la création de l\'évaluation.'); } finally { setBusy(false); }
  }

  async function saveDraft() {
    if (!grid) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const payload = rows.map((r) => ({ idInscription: r.idInscription, valeurNote: r.valeurNote ?? undefined, observation: r.observation }));
      await api.post('/notes/batch', { idEvaluation: grid.evaluation.id, notes: payload });
      await loadGrid(grid.evaluation.id);
      if (isValidee) {
        setMessage('✅ Corrections enregistrées et bulletins recalculés automatiquement.');
        setCorrectionMode(false);
      } else {
        setMessage('Notes enregistrées en brouillon.');
      }
    } catch { setError('Échec de l\'enregistrement des notes.'); } finally { setBusy(false); }
  }

  async function submit() {
    if (!grid) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await api.post(`/notes/evaluations/${grid.evaluation.id}/soumettre`);
      await refreshContext();
      await loadGrid(grid.evaluation.id);
      setMessage('Évaluation soumise au conseil pédagogique.');
    } catch { setError('Soumission impossible : vérifiez qu\'au moins une note est saisie.'); } finally { setBusy(false); }
  }

  if (loading) return <p className="text-slate-500">Chargement…</p>;
  if (!ctx) return <p className="text-red-600">{error || 'Contexte indisponible.'}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saisie des notes</h1>
        <p className="mt-1 text-sm text-slate-600">Enregistrez les notes en brouillon avant de les soumettre au conseil pédagogique. Vous pouvez aussi corriger des évaluations déjà validées.</p>
      </div>

      <section className="grid gap-4 rounded-lg bg-white p-5 shadow-sm md:grid-cols-3">
        <label className="text-sm font-medium">Classe / Matière (affectation)
          <select className="mt-1 w-full rounded-md border p-2" value={assignmentId} onChange={(e) => changeAssignment(e.target.value)}>
            {ctx.assignments.length === 0 && <option value="">Aucune affectation</option>}
            {ctx.assignments.map((a) => <option key={a.id} value={a.id}>{a.classeMatiere.classe.libelle} — {a.classeMatiere.matiere.libelle} ({a.annee.libelle})</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Évaluation
          <select className="mt-1 w-full rounded-md border p-2" value={evaluationId} onChange={(e) => changeEvaluation(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {evals.map((ev) => <option key={ev.id} value={ev.id}>{ev.libelle} · {ev.typeEvaluation.libelle} · {STATUT_LABEL[ev.statut] ?? ev.statut}</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <button type="button" onClick={() => setShowNew((v) => !v)} className="w-full rounded-md border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600">{showNew ? 'Annuler' : '+ Nouvelle évaluation'}</button>
        </div>
      </section>

      {showNew && (
        <form onSubmit={createEvaluation} className="grid gap-4 rounded-lg bg-white p-5 shadow-sm md:grid-cols-6">
          <label className="text-sm font-medium">Libellé<input className="mt-1 w-full rounded-md border p-2" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Interrogation P1…" /></label>
          <label className="text-sm font-medium">Semestre
            <select className="mt-1 w-full rounded-md border p-2" value={semestreId} onChange={(e) => { setSemestreId(e.target.value); const s = ctx.semestres.find((x) => x.id === e.target.value); setPeriodeId(s?.periodes[0]?.id ?? ''); }}>
              {ctx.semestres.map((s) => <option key={s.id} value={s.id}>{s.libelle} ({s.annee.libelle})</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Période
            <select className="mt-1 w-full rounded-md border p-2" value={periodeId} onChange={(e) => setPeriodeId(e.target.value)}>
              <option value="">Examen (hors période)</option>
              {semestre?.periodes.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Type
            <select className="mt-1 w-full rounded-md border p-2" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {ctx.typesEvaluation.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Date<input type="date" className="mt-1 w-full rounded-md border p-2" value={dateEval} onChange={(e) => setDateEval(e.target.value)} /></label>
          <div className="flex items-end"><button disabled={busy} className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Créer</button></div>
        </form>
      )}

      {grid && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="min-w-0">
              <p className="font-medium">{grid.evaluation.libelle}</p>
              <p className="text-xs text-slate-500">{grid.evaluation.classe} · {grid.evaluation.matiere} · {grid.evaluation.semestre}{grid.evaluation.periode ? ` · ${grid.evaluation.periode}` : ' · Examen'} · {grid.evaluation.typeEvaluation} · Année {grid.evaluation.annee}</p>
            </div>
            <span className={`ml-auto rounded-full px-2 py-1 text-xs font-medium ${STATUT_BADGE[grid.evaluation.statut] ?? 'bg-slate-100 text-slate-600'}`}>{STATUT_LABEL[grid.evaluation.statut] ?? grid.evaluation.statut}</span>
          </div>

          {/* Bandeau correction pour les évaluations validées */}
          {isValidee && !correctionMode && (
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-600 text-lg">✏️</span>
                <div>
                  <p className="text-sm font-medium text-amber-800">Évaluation déjà validée</p>
                  <p className="text-xs text-amber-600">Vous pouvez corriger les notes. Les bulletins seront recalculés automatiquement.</p>
                </div>
              </div>
              <button onClick={() => setCorrectionMode(true)} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
                Corriger les notes
              </button>
            </div>
          )}

          {isValidee && correctionMode && (
            <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <span className="text-orange-500 text-lg">⚠️</span>
              <p className="text-sm text-orange-800">Mode correction actif — Modifiez les notes, puis cliquez sur <strong>Enregistrer les corrections</strong> pour mettre à jour les bulletins.</p>
            </div>
          )}

          <GradeTable rows={rows} maximum={grid.evaluation.maximum} onChange={setRows} readOnly={!editable} />

          {editable && (
            <div className="flex items-center gap-3">
              {isBrouillon && (
                <>
                  <button onClick={saveDraft} disabled={busy} className="rounded-md border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 disabled:opacity-50">Enregistrer en brouillon</button>
                  <button onClick={submit} disabled={busy} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Soumettre pour validation</button>
                </>
              )}
              {isValidee && correctionMode && (
                <>
                  <button onClick={saveDraft} disabled={busy} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                    {busy ? 'Enregistrement…' : 'Enregistrer les corrections'}
                  </button>
                  <button onClick={() => { loadGrid(grid.evaluation.id); setCorrectionMode(false); }} disabled={busy} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-50">Annuler</button>
                </>
              )}
            </div>
          )}
        </section>
      )}
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
