'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { GradeTable, type GradeRow } from '@/components/grades/grade-table';

type PendingEvaluation = {
  id: string;
  libelle: string;
  dateEvaluation: string;
  affectation: { id: string; enseignant: { nom: string; prenom: string }; classeMatiere: { classe: { libelle: string }; matiere: { libelle: string } } };
  periode: { libelle: string } | null;
  semestre: { libelle: string };
  typeEvaluation: { libelle: string };
  _count: { notes: number };
};
type GridData = { evaluation: { id: string; libelle: string; maximum: number; statut: string; semestre: string; periode: string | null; typeEvaluation: string; matiere: string; classe: string; annee: string }; rows: GradeRow[] };

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
    refresh().catch(() => setError('Impossible de charger les évaluations soumises.'));
  }, []);

  async function inspect(id: string) {
    setError(''); setMessage('');
    try {
      const { data } = await api.get<GridData>(`/notes/grille/${id}`);
      setGrid(data);
    } catch { setError('Grille indisponible.'); }
  }

  async function validate(id: string) {
    setBusy(true); setError(''); setMessage('');
    try {
      await api.post(`/notes/validations/${id}/valider`);
      setGrid(null);
      await refresh();
      setMessage('Évaluation validée et verrouillée.');
    } catch { setError('Validation impossible.'); } finally { setBusy(false); }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Validation des notes</h1>
        <p className="mt-2 text-slate-600">Le conseil pédagogique contrôle et verrouille les évaluations soumises par les enseignants.</p>
      </div>

      {pending === null ? (
        <p className="text-slate-500">Chargement…</p>
      ) : pending.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-sm text-slate-500 shadow-sm">Aucune évaluation en attente de validation.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr><th className="p-3">Évaluation</th><th className="p-3">Classe / Matière</th><th className="p-3">Type</th><th className="p-3">Période</th><th className="p-3">Enseignant</th><th className="p-3">Notes</th></tr>
            </thead>
            <tbody>
              {pending.map((ev) => (
                <tr key={ev.id} className="border-t">
                  <td className="p-3"><p className="font-medium">{ev.libelle}</p><p className="text-xs text-slate-500">{new Date(ev.dateEvaluation).toLocaleDateString('fr-FR')} · {ev.semestre.libelle}</p></td>
                  <td className="p-3">{ev.affectation.classeMatiere.classe.libelle}<p className="text-xs text-slate-500">{ev.affectation.classeMatiere.matiere.libelle}</p></td>
                  <td className="p-3">{ev.typeEvaluation.libelle}</td>
                  <td className="p-3">{ev.periode?.libelle ?? 'Examen'}</td>
                  <td className="p-3">{ev.affectation.enseignant.nom} {ev.affectation.enseignant.prenom}</td>
                  <td className="p-3">{ev._count.notes}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => inspect(ev.id)} className="mr-2 rounded border border-brand-600 px-3 py-1 text-xs font-medium text-brand-600">Consulter</button>
                    <button onClick={() => validate(ev.id)} disabled={busy} className="rounded bg-brand-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Valider</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {grid && (
        <section className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="min-w-0">
              <p className="font-medium">{grid.evaluation.libelle}</p>
              <p className="text-xs text-slate-500">{grid.evaluation.classe} · {grid.evaluation.matiere} · {grid.evaluation.semestre}{grid.evaluation.periode ? ` · ${grid.evaluation.periode}` : ' · Examen'} · {grid.evaluation.typeEvaluation} · Année {grid.evaluation.annee}</p>
            </div>
            <button onClick={() => setGrid(null)} className="ml-auto text-sm text-slate-500">Fermer</button>
          </div>
          <GradeTable rows={grid.rows} maximum={grid.evaluation.maximum} onChange={() => {}} readOnly />
        </section>
      )}
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

