'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';

type Enseignant = { id: string; nom: string; postnom: string | null; prenom: string; sexe: 'M' | 'F'; telephone: string | null; email: string | null };

const inputCls = 'w-full rounded-md border p-2 text-sm';

export default function TeachersPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[] | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSexe, setFilterSexe] = useState('');
  const [page, setPage] = useState(1);
  const user = useAuthStore((s) => s.user);
  const pageSize = 20;

  function submitAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setError(''); setMessage('');
    api.post('/administration/admins', { email: f.get('email'), motDePasse: (f.get('motDePasse') as string) || undefined })
      .then(() => { setMessage('Administrateur créé avec succès.'); form.reset(); })
      .catch((err: any) => setError(err.response?.data?.message?.toString?.() ?? 'Erreur lors de la création.'))
      .finally(() => setBusy(false));
  }

  async function refresh() {
    const { data } = await api.get<{ enseignants: Enseignant[] }>('/administration/catalogue');
    setEnseignants(data.enseignants);
  }

  useEffect(() => { refresh().catch(() => setError('Impossible de charger les enseignants.')); }, []);

  useEffect(() => { setPage(1); }, [search, filterSexe]);

  const filteredEnseignants = useMemo(() => {
    if (!enseignants) return [];
    const query = search.trim().toLowerCase();
    return enseignants.filter((teacher) => {
      if (filterSexe && teacher.sexe !== filterSexe) return false;
      if (!query) return true;
      const fullName = `${teacher.nom} ${teacher.postnom ?? ''} ${teacher.prenom}`.toLowerCase();
      return fullName.includes(query) || (teacher.telephone ?? '').toLowerCase().includes(query) || (teacher.email ?? '').toLowerCase().includes(query);
    });
  }, [enseignants, search, filterSexe]);

  const totalPages = Math.max(1, Math.ceil(filteredEnseignants.length / pageSize));
  const paginatedEnseignants = useMemo(() => filteredEnseignants.slice((page - 1) * pageSize, page * pageSize), [filteredEnseignants, page]);
  const hasActiveFilters = search !== '' || filterSexe !== '';

  function resetFilters() {
    setSearch('');
    setFilterSexe('');
    setPage(1);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setError(''); setMessage('');
    api.post('/administration/teachers', {
      nom: f.get('nom'), postnom: f.get('postnom') || undefined, prenom: f.get('prenom'),
      sexe: f.get('sexe'), telephone: f.get('telephone') || undefined, email: f.get('email'), motDePasse: (f.get('motDePasse') as string) || undefined,
    }).then(async () => {
      setMessage('Enseignant créé avec succès.');
      form.reset();
      await refresh();
    }).catch((err: any) => setError(err.response?.data?.message?.toString?.() ?? 'Erreur lors de l’enregistrement.'))
      .finally(() => setBusy(false));
  }

  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold">Enseignants</h1><p className="mt-1 text-sm text-slate-600">Gérez les fiches des enseignants de l’établissement.</p></div>
      {(message || error) && <p className={`rounded p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{error || message}</p>}

      <form onSubmit={submit} className="space-y-3 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Nouvel enseignant</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input required name="nom" placeholder="Nom" className={inputCls} />
          <input name="postnom" placeholder="Postnom" className={inputCls} />
          <input required name="prenom" placeholder="Prénom" className={inputCls} />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <select required name="sexe" className={inputCls} defaultValue="M"><option value="M">Masculin</option><option value="F">Féminin</option></select>
          <input name="telephone" placeholder="Téléphone" className={inputCls} />
          <input required name="email" type="email" placeholder="Email de connexion" className={inputCls} />
        </div>
        <input name="motDePasse" type="password" placeholder="Mot de passe (laisser vide = prof)" className={inputCls} />
        <button disabled={busy} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Créer l’enseignant</button>
      </form>

      {user?.role === 'ADMIN' && (
        <form onSubmit={submitAdmin} className="space-y-3 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Nouvel administrateur</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input required name="email" type="email" placeholder="Email de connexion" className={inputCls} />
            <input name="motDePasse" type="password" placeholder="Mot de passe (laisser vide = admin)" className={inputCls} />
          </div>
          <button disabled={busy} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Créer l’administrateur</button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <div className="space-y-3 border-b border-slate-100 bg-slate-50/60 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-slate-800">Liste des enseignants</h2>
            <span className="text-xs font-medium text-slate-500">{enseignants ? <>Affichage de <span className="font-bold text-slate-700">{filteredEnseignants.length}</span> sur <span className="font-bold text-slate-700">{enseignants.length}</span> enseignant(s)</> : 'Chargement...'}</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (nom, téléphone, email)..." className={`${inputCls} sm:flex-1`} />
            <div className="flex gap-2 sm:w-64">
              <select value={filterSexe} onChange={(e) => setFilterSexe(e.target.value)} className={inputCls}><option value="">Tous les sexes</option><option value="M">Masculin (M)</option><option value="F">Féminin (F)</option></select>
              {hasActiveFilters && <button type="button" onClick={resetFilters} title="Réinitialiser les filtres" className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">Effacer</button>}
            </div>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">Nom complet</th><th className="p-3">Sexe</th><th className="p-3">Téléphone</th><th className="p-3">Email</th></tr></thead>
          <tbody>
            {paginatedEnseignants.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3">{t.nom} {t.postnom ?? ''} {t.prenom}</td>
                <td className="p-3">{t.sexe === 'M' ? 'M' : 'F'}</td>
                <td className="p-3">{t.telephone ?? '—'}</td>
                <td className="p-3">{t.email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {enseignants !== null && filteredEnseignants.length === 0 && <div className="p-6 text-center text-sm text-slate-500">{hasActiveFilters ? <><p>Aucun enseignant ne correspond à vos critères.</p><button type="button" onClick={resetFilters} className="mt-2 font-semibold text-brand-600 underline">Réinitialiser les filtres</button></> : <p>Aucun enseignant.</p>}</div>}
        {totalPages > 1 && <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-600"><span>Page <b className="text-slate-800">{page}</b> sur <b className="text-slate-800">{totalPages}</b></span><div className="flex gap-1"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded border border-slate-200 bg-white px-3 py-1 disabled:opacity-40">Précédent</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded border border-slate-200 bg-white px-3 py-1 disabled:opacity-40">Suivant</button></div></div>}
      </div>
    </section>
  );
}

