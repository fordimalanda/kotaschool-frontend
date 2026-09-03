'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

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

  useEffect(() => { setPage(1); }, [search, filterClasse, filterMatiere, filterAnnee]);

  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    const query = search.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const teacher = `${assignment.enseignant.nom} ${assignment.enseignant.postnom ?? ''} ${assignment.enseignant.prenom}`;
      const classe = assignment.classeMatiere.classe.libelle;
      const matiere = assignment.classeMatiere.matiere.libelle;
      if (filterClasse && classe !== filterClasse) return false;
      if (filterMatiere && matiere !== filterMatiere) return false;
      if (filterAnnee && assignment.annee.libelle !== filterAnnee) return false;
      return !query || `${teacher} ${classe} ${matiere} ${assignment.annee.libelle}`.toLowerCase().includes(query);
    });
  }, [assignments, search, filterClasse, filterMatiere, filterAnnee]);

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const paginatedAssignments = useMemo(() => filteredAssignments.slice((page - 1) * pageSize, page * pageSize), [filteredAssignments, page]);
  const classes = useMemo(() => [...new Set((classSubjects ?? []).map((item) => item.classe.libelle))], [classSubjects]);
  const matieres = useMemo(() => [...new Set((classSubjects ?? []).map((item) => item.matiere.libelle))], [classSubjects]);
  const hasActiveFilters = search !== '' || filterClasse !== '' || filterMatiere !== '' || filterAnnee !== '';

  function resetFilters() {
    setSearch(''); setFilterClasse(''); setFilterMatiere(''); setFilterAnnee(''); setPage(1);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setError(''); setMessage('');
    api.post('/administration/assignments', { idEnseignant: f.get('idEnseignant'), idClasseMatiere: f.get('idClasseMatiere'), idAnnee: f.get('idAnnee') })
      .then(async () => { setMessage('Affectation enregistrée.'); form.reset(); await refresh(); })
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
        <div className="space-y-3 border-b border-slate-100 bg-slate-50/60 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-slate-800">Liste des affectations</h2>
            <span className="text-xs font-medium text-slate-500">{assignments ? <>Affichage de <span className="font-bold text-slate-700">{filteredAssignments.length}</span> sur <span className="font-bold text-slate-700">{assignments.length}</span> affectation(s)</> : 'Chargement...'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (enseignant, classe, matière)..." className={inputCls} />
            <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} className={inputCls}><option value="">Toutes les classes</option>{classes.map((classe) => <option key={classe} value={classe}>{classe}</option>)}</select>
            <select value={filterMatiere} onChange={(e) => setFilterMatiere(e.target.value)} className={inputCls}><option value="">Toutes les matières</option>{matieres.map((matiere) => <option key={matiere} value={matiere}>{matiere}</option>)}</select>
            <div className="flex gap-2"><select value={filterAnnee} onChange={(e) => setFilterAnnee(e.target.value)} className={inputCls}><option value="">Toutes les années</option>{annees?.map((annee) => <option key={annee.id} value={annee.libelle}>{annee.libelle}</option>)}</select>{hasActiveFilters && <button type="button" onClick={resetFilters} title="Réinitialiser les filtres" className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">Effacer</button>}</div>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">Enseignant</th><th className="p-3">Classe</th><th className="p-3">Matière</th><th className="p-3">Année</th></tr></thead>
          <tbody>
            {paginatedAssignments.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.enseignant.nom} {a.enseignant.postnom ?? ''} {a.enseignant.prenom}</td>
                <td className="p-3">{a.classeMatiere.classe.libelle}</td>
                <td className="p-3">{a.classeMatiere.matiere.libelle}</td>
                <td className="p-3">{a.annee.libelle}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {assignments !== null && filteredAssignments.length === 0 && <div className="p-6 text-center text-sm text-slate-500">{hasActiveFilters ? <><p>Aucune affectation ne correspond à vos critères.</p><button type="button" onClick={resetFilters} className="mt-2 font-semibold text-brand-600 underline">Réinitialiser les filtres</button></> : <p>Aucune affectation.</p>}</div>}
        {totalPages > 1 && <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-600"><span>Page <b className="text-slate-800">{page}</b> sur <b className="text-slate-800">{totalPages}</b></span><div className="flex gap-1"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded border border-slate-200 bg-white px-3 py-1 disabled:opacity-40">Précédent</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded border border-slate-200 bg-white px-3 py-1 disabled:opacity-40">Suivant</button></div></div>}
      </div>
    </section>
  );
}

