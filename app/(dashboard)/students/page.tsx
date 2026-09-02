'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api/client';

type Eleve = {
  matricule: string;
  nom: string;
  postnom: string | null;
  prenom: string;
  sexe: 'M' | 'F';
  dateNaissance: string;
  utilisateur?: { email: string | null } | null;
  inscriptions: { id: string; annee: { libelle: string; estActive: boolean }; classe: { libelle: string } }[];
};

type Classe = { id: string; libelle: string };
type Annee = { id: string; libelle: string; estActive: boolean };
type Catalogue = { sections: { id: string; libelle: string; options: { id: string; libelle: string; classes: Classe[] }[] }[]; annees: Annee[] };

const inputCls = 'w-full rounded-md border p-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
const btnCls = 'rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition';

export default function StudentsPage() {
  const [eleves, setEleves] = useState<Eleve[] | null>(null);
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Filtres et pagination
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterSexe, setFilterSexe] = useState('');
  const [filterStatut, setFilterStatut] = useState<'all' | 'inscrits' | 'non_inscrits'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const classes = useMemo(() => (cat?.sections ?? []).flatMap((s) => s.options.flatMap((o) => o.classes)), [cat]);

  async function refresh() {
    const [e, c] = await Promise.all([api.get<Eleve[]>('/administration/students'), api.get<Catalogue>('/administration/catalogue')]);
    setEleves(e.data);
    setCat(c.data);
  }

  useEffect(() => {
    refresh().catch(() => setError('Impossible de charger les données.'));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterClasse, filterSexe, filterStatut]);

  async function create(path: string, body: Record<string, unknown>, resetForm?: HTMLFormElement) {
    setBusy(true); setError(''); setMessage('');
    try {
      await api.post(`/administration/${path}`, body);
      resetForm?.reset();
      setMessage('Enregistré avec succès.');
      await refresh();
    } catch (e: any) {
      setError(e.response?.data?.message?.toString?.() ?? 'Erreur lors de l’enregistrement.');
    } finally { setBusy(false); }
  }

  function submitStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    create('students', {
      matricule: f.get('matricule'), nom: f.get('nom'), postnom: f.get('postnom') || undefined, prenom: f.get('prenom'),
      sexe: f.get('sexe'), dateNaissance: f.get('dateNaissance'), lieuNaissance: f.get('lieuNaissance') || undefined, adresse: f.get('adresse') || undefined,
      email: f.get('email'), motDePasse: (f.get('motDePasse') as string) || undefined,
    }, e.currentTarget);
  }

  function submitEnrolment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    create('enrolments', { matricule: f.get('matricule'), idClasse: f.get('idClasse'), idAnnee: f.get('idAnnee') }, e.currentTarget);
  }

  // Filtrage des élèves
  const filteredEleves = useMemo(() => {
    if (!eleves) return [];
    const q = search.trim().toLowerCase();

    return eleves.filter((e) => {
      if (filterSexe && e.sexe !== filterSexe) return false;

      const isInscrit = e.inscriptions && e.inscriptions.length > 0;
      if (filterStatut === 'inscrits' && !isInscrit) return false;
      if (filterStatut === 'non_inscrits' && isInscrit) return false;

      if (filterClasse && !e.inscriptions.some((i) => i.classe.libelle === filterClasse)) {
        return false;
      }

      if (q) {
        const fullName = `${e.nom} ${e.postnom ?? ''} ${e.prenom}`.toLowerCase();
        const matricule = e.matricule.toLowerCase();
        const email = (e.utilisateur?.email ?? '').toLowerCase();
        const classesStr = e.inscriptions.map((i) => i.classe.libelle.toLowerCase()).join(' ');
        if (!fullName.includes(q) && !matricule.includes(q) && !email.includes(q) && !classesStr.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [eleves, search, filterClasse, filterSexe, filterStatut]);

  const totalPages = Math.max(1, Math.ceil(filteredEleves.length / pageSize));
  const paginatedEleves = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEleves.slice(start, start + pageSize);
  }, [filteredEleves, page, pageSize]);

  const hasActiveFilters = search !== '' || filterClasse !== '' || filterSexe !== '' || filterStatut !== 'all';

  function resetFilters() {
    setSearch('');
    setFilterClasse('');
    setFilterSexe('');
    setFilterStatut('all');
    setPage(1);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Élèves & inscriptions</h1>
        <p className="mt-1 text-sm text-slate-600">Créez les dossiers élèves, gérez leurs comptes et inscrivez-les pour l’année scolaire.</p>
      </div>

      {(message || error) && (
        <p className={`rounded p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {error || message}
        </p>
      )}

      {/* Formulaires de création et d'inscription */}
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={submitStudent} className="space-y-3 rounded-lg bg-white p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800">Nouvel élève</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input required name="matricule" placeholder="Matricule (ex. KOT-2026-004)" className={inputCls} />
            <input required name="nom" placeholder="Nom" className={inputCls} />
            <input name="postnom" placeholder="Postnom" className={inputCls} />
            <input required name="prenom" placeholder="Prénom" className={inputCls} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select required name="sexe" className={inputCls} defaultValue="M">
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
            <label className="text-sm text-slate-500">
              Naissance
              <input required type="date" name="dateNaissance" className={`${inputCls} mt-1`} />
            </label>
            <input name="lieuNaissance" placeholder="Lieu de naissance" className={inputCls} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input required name="email" type="email" placeholder="Email (ex. nom.postnom.prenom@kotaschool.cd)" className={inputCls} />
            <input name="motDePasse" type="password" placeholder="Mot de passe (laisser vide = student)" className={inputCls} />
          </div>
          <input name="adresse" placeholder="Adresse" className={inputCls} />
          <button disabled={busy} className={btnCls}>Créer l’élève</button>
        </form>

        <form onSubmit={submitEnrolment} className="space-y-3 rounded-lg bg-white p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800">Inscrire un élève</h2>
          <input required name="matricule" list="matricules" placeholder="Matricule de l’élève" className={inputCls} />
          <datalist id="matricules">
            {eleves?.map((e) => <option key={e.matricule} value={e.matricule}>{e.nom} {e.postnom ?? ''} {e.prenom}</option>)}
          </datalist>
          <select required name="idClasse" className={inputCls} defaultValue="">
            <option value="">Classe…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
          </select>
          <select required name="idAnnee" className={inputCls} defaultValue="">
            <option value="">Année scolaire…</option>
            {cat?.annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}{a.estActive ? ' (active)' : ''}</option>)}
          </select>
          <button disabled={busy} className={btnCls}>Inscrire</button>
        </form>
      </div>

      {/* Bloc Liste des élèves avec Filtres */}
      <div className="rounded-lg bg-white shadow-sm border border-slate-100 overflow-hidden">
        {/* Barre d'outils et de filtrage */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="font-semibold text-slate-800">Liste des élèves</h2>
            <div className="text-xs text-slate-500 font-medium">
              {eleves ? (
                <>
                  Affichage de <span className="font-bold text-slate-700">{filteredEleves.length}</span> sur <span className="font-bold text-slate-700">{eleves.length}</span> élève(s)
                </>
              ) : 'Chargement...'}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Recherche textuelle */}
            <div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (nom, email, matricule)..."
                className={inputCls}
              />
            </div>

            {/* Filtrer par classe */}
            <div>
              <select
                value={filterClasse}
                onChange={(e) => setFilterClasse(e.target.value)}
                className={inputCls}
              >
                <option value="">Toutes les classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.libelle}>{c.libelle}</option>
                ))}
              </select>
            </div>

            {/* Filtrer par sexe */}
            <div>
              <select
                value={filterSexe}
                onChange={(e) => setFilterSexe(e.target.value)}
                className={inputCls}
              >
                <option value="">Tous les sexes</option>
                <option value="M">Masculin (M)</option>
                <option value="F">Féminin (F)</option>
              </select>
            </div>

            {/* Filtrer par statut */}
            <div className="flex items-center gap-2">
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value as any)}
                className={inputCls}
              >
                <option value="all">Tous les statuts</option>
                <option value="inscrits">Inscrits uniquement</option>
                <option value="non_inscrits">Non inscrits uniquement</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  title="Réinitialiser les filtres"
                  className="shrink-0 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tableau des élèves */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3">Matricule</th>
                <th className="p-3">Élève</th>
                <th className="p-3">Adresse email</th>
                <th className="p-3 text-center">Sexe</th>
                <th className="p-3">Naissance</th>
                <th className="p-3">Inscriptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEleves.map((e) => (
                <tr key={e.matricule} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono text-xs font-semibold text-slate-700">{e.matricule}</td>
                  <td className="p-3 font-medium text-slate-900">
                    {e.nom} {e.postnom ? `${e.postnom} ` : ''}{e.prenom}
                  </td>
                  <td className="p-3">
                    {e.utilisateur?.email ? (
                      <span className="font-mono text-xs text-brand-700 bg-brand-50/70 px-2 py-0.5 rounded border border-brand-100">
                        {e.utilisateur.email}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Non renseigné</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${e.sexe === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                      {e.sexe}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 text-xs">
                    {new Date(e.dateNaissance).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-3 text-xs text-slate-700">
                    {e.inscriptions && e.inscriptions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {e.inscriptions.map((i) => (
                          <span
                            key={i.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            <span>{i.classe.libelle}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">{i.annee.libelle}</span>
                            {i.annee.estActive && <span className="text-emerald-600 font-bold" title="Année active">✓</span>}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Non inscrit</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {eleves !== null && filteredEleves.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              {hasActiveFilters ? (
                <div>
                  <p>Aucun élève ne correspond à vos critères de recherche.</p>
                  <button onClick={resetFilters} className="mt-2 text-xs font-semibold text-brand-600 underline">
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <p>Aucun élève enregistré pour le moment.</p>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Page <span className="font-semibold text-slate-800">{page}</span> sur <span className="font-semibold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
