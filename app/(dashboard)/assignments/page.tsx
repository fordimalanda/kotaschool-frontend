'use client';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api/client';

type Assignment = { id: string; enseignant: { nom: string; postnom: string | null; prenom: string }; annee: { libelle: string }; classeMatiere: { classe: { libelle: string }; matiere: { libelle: string } } };
type ClasseMatiere = { id: string; classe: { id: string; libelle: string }; matiere: { id: string; libelle: string }; coefficient: string };
type Enseignant = { id: string; nom: string; postnom: string | null; prenom: string };
type Annee = { id: string; libelle: string; estActive: boolean };

const inputCls = 'w-full rounded-md border p-2 text-sm';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [classSubjects, setClassSubjects] = useState<ClasseMatiere[] | null>(null);
  const [enseignants, setEnseignants] = useState<Enseignant[] | null>(null);
  const [annees, setAnnees] = useState<Annee[] | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [a, cs, c] = await Promise.all([
      api.get<Assignment[]>('/administration/assignments'),
      api.get<ClasseMatiere[]>('/administration/class-subjects'),
      api.get<{ enseignants: Enseignant[]; annees: Annee[] }>('/administration/catalogue'),
    ]);
    setAssignments(a.data);
    setClassSubjects(cs.data);
    setEnseignants(c.data.enseignants);
    setAnnees(c.data.annees);
  }

  useEffect(() => { refresh().catch(() => setError('Impossible de charger les affectations.')); }, []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(''); setMessage('');
    api.post('/administration/assignments', { idEnseignant: f.get('idEnseignant'), idClasseMatiere: f.get('idClasseMatiere'), idAnnee: f.get('idAnnee') })
      .then(async () => { setMessage('Affectation enregistrée.'); e.currentTarget.reset(); await refresh(); })
      .catch((err: any) => setError(err.response?.data?.message?.toString?.() ?? 'Erreur lors de l’affectation.'))
      .finally(() => setBusy(false));
  }

  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold">Affectations</h1><p className="mt-1 text-sm text-slate-600">Affectez un enseignant à un couple classe–matière pour l’année scolaire.</p></div>
      {(message || error) && <p className={`rounded p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{error || message}</p>}

      <form onSubmit={submit} className="grid gap-3 rounded-lg bg-white p-5 shadow-sm md:grid-cols-4">
        <label className="text-sm font-medium">Enseignant<select required name="idEnseignant" className={`${inputCls} mt-1`} defaultValue=""><option value="">— Choisir —</option>{enseignants?.map((t) => <option key={t.id} value={t.id}>{t.nom} {t.postnom ?? ''} {t.prenom}</option>)}</select></label>
        <label className="text-sm font-medium">Classe — Matière<select required name="idClasseMatiere" className={`${inputCls} mt-1`} defaultValue=""><option value="">— Choisir —</option>{classSubjects?.map((cs) => <option key={cs.id} value={cs.id}>{cs.classe.libelle} — {cs.matiere.libelle} (coef {cs.coefficient})</option>)}</select></label>
        <label className="text-sm font-medium">Année scolaire<select required name="idAnnee" className={`${inputCls} mt-1`} defaultValue=""><option value="">— Choisir —</option>{annees?.map((a) => <option key={a.id} value={a.id}>{a.libelle}{a.estActive ? ' (active)' : ''}</option>)}</select></label>
        <div className="flex items-end"><button disabled={busy} className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Affecter</button></div>
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">Enseignant</th><th className="p-3">Classe</th><th className="p-3">Matière</th><th className="p-3">Année</th></tr></thead>
          <tbody>
            {assignments?.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.enseignant.nom} {a.enseignant.postnom ?? ''} {a.enseignant.prenom}</td>
                <td className="p-3">{a.classeMatiere.classe.libelle}</td>
                <td className="p-3">{a.classeMatiere.matiere.libelle}</td>
                <td className="p-3">{a.annee.libelle}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {assignments !== null && assignments.length === 0 && <p className="p-6 text-sm text-slate-500">Aucune affectation.</p>}
      </div>
    </section>
  );
}

