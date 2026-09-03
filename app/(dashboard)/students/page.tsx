'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Calendar,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  School,
  X,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';

type Eleve = {
  matricule: string;
  nom: string;
  postnom: string | null;
  prenom: string;
  sexe: 'M' | 'F';
  dateNaissance: string;
  utilisateur?: { email: string | null } | null;
  inscriptions: {
    id: string;
    annee: { libelle: string; estActive: boolean };
    classe: { libelle: string };
  }[];
};

type Classe = { id: string; libelle: string };
type Annee = { id: string; libelle: string; estActive: boolean };
type Catalogue = {
  sections: {
    id: string;
    libelle: string;
    options: { id: string; libelle: string; classes: Classe[] }[];
  }[];
  annees: Annee[];
};

export default function StudentsPage() {
  const [eleves, setEleves] = useState<Eleve[] | null>(null);
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Modals
  const [openStudentModal, setOpenStudentModal] = useState(false);
  const [openEnrolModal, setOpenEnrolModal] = useState(false);
  const [selectedMatriculeForEnrol, setSelectedMatriculeForEnrol] = useState('');

  // Filtres et pagination
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterSexe, setFilterSexe] = useState('');
  const [filterStatut, setFilterStatut] = useState<
    'all' | 'inscrits' | 'non_inscrits'
  >('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const classes = useMemo(
    () =>
      (cat?.sections ?? []).flatMap((s) =>
        s.options.flatMap((o) => o.classes)
      ),
    [cat]
  );

  async function refresh() {
    const [e, c] = await Promise.all([
      api.get<Eleve[]>('/administration/students'),
      api.get<Catalogue>('/administration/catalogue'),
    ]);
    setEleves(e.data);
    setCat(c.data);
  }

  useEffect(() => {
    refresh().catch(() => setError('Impossible de charger les données élèves.'));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterClasse, filterSexe, filterStatut]);

  async function create(path: string, body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/administration/${path}`, body);
      setMessage('Opération effectuée avec succès.');
      setOpenStudentModal(false);
      setOpenEnrolModal(false);
      await refresh();
    } catch (e: any) {
      setError(
        e.response?.data?.message?.toString?.() ??
          "Erreur lors de l'enregistrement."
      );
    } finally {
      setBusy(false);
    }
  }

  function submitStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    create('students', {
      matricule: f.get('matricule'),
      nom: f.get('nom'),
      postnom: f.get('postnom') || undefined,
      prenom: f.get('prenom'),
      sexe: f.get('sexe'),
      dateNaissance: f.get('dateNaissance'),
      lieuNaissance: f.get('lieuNaissance') || undefined,
      adresse: f.get('adresse') || undefined,
      email: f.get('email'),
      motDePasse: (f.get('motDePasse') as string) || undefined,
    });
  }

  function submitEnrolment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    create('enrolments', {
      matricule: f.get('matricule'),
      idClasse: f.get('idClasse'),
      idAnnee: f.get('idAnnee'),
    });
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

      if (
        filterClasse &&
        !e.inscriptions.some((i) => i.classe.libelle === filterClasse)
      ) {
        return false;
      }

      if (q) {
        const fullName = `${e.nom} ${e.postnom ?? ''} ${e.prenom}`.toLowerCase();
        const matricule = e.matricule.toLowerCase();
        const email = (e.utilisateur?.email ?? '').toLowerCase();
        const classesStr = e.inscriptions
          .map((i) => i.classe.libelle.toLowerCase())
          .join(' ');
        if (
          !fullName.includes(q) &&
          !matricule.includes(q) &&
          !email.includes(q) &&
          !classesStr.includes(q)
        ) {
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

  const hasActiveFilters =
    search !== '' ||
    filterClasse !== '' ||
    filterSexe !== '' ||
    filterStatut !== 'all';

  function resetFilters() {
    setSearch('');
    setFilterClasse('');
    setFilterSexe('');
    setFilterStatut('all');
    setPage(1);
  }

  const inscritsCount =
    eleves?.filter((e) => e.inscriptions && e.inscriptions.length > 0).length ?? 0;
  const nonInscritsCount = (eleves?.length ?? 0) - inscritsCount;

  return (
    <section className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-brand-600" />
            Registre des Élèves & Inscriptions
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Créez les dossiers scolaires, affectez les matricules et inscrivez
            les élèves pour l&apos;année active.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedMatriculeForEnrol('');
              setOpenEnrolModal(true);
            }}
          >
            <School className="mr-1.5 h-4 w-4" />
            Inscrire un élève
          </Button>
          <Button onClick={() => setOpenStudentModal(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Nouvel élève
          </Button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filter Toolbar ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 lg:col-span-1">
            <Label>Recherche d&apos;élève</Label>
            <div className="relative">
              <Input
                placeholder="Nom, matricule, classe…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Filtrer par Classe</Label>
            <Select
              value={filterClasse}
              onChange={(e) => setFilterClasse(e.target.value)}
              className="text-xs"
            >
              <option value="">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.libelle}>
                  {c.libelle}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Statut Scolaire</Label>
            <Select
              value={filterStatut}
              onChange={(e) =>
                setFilterStatut(
                  e.target.value as 'all' | 'inscrits' | 'non_inscrits'
                )
              }
              className="text-xs"
            >
              <option value="all">Tous ({eleves?.length ?? 0})</option>
              <option value="inscrits">Inscrits ({inscritsCount})</option>
              <option value="non_inscrits">
                Non inscrits ({nonInscritsCount})
              </option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Genre / Sexe</Label>
            <Select
              value={filterSexe}
              onChange={(e) => setFilterSexe(e.target.value)}
              className="text-xs"
            >
              <option value="">Tous les sexes</option>
              <option value="M">Masculin (M)</option>
              <option value="F">Féminin (F)</option>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>
              Résultats trouvés : <strong>{filteredEleves.length}</strong> élève(s)
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 font-semibold text-brand-600 hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* ── Students Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100/70 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="p-3.5">Matricule</th>
                <th className="p-3.5">Nom & Prénoms</th>
                <th className="p-3.5">Genre</th>
                <th className="p-3.5">Classe Active</th>
                <th className="p-3.5">Compte Portail</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eleves === null ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-500">
                    Chargement des élèves…
                  </td>
                </tr>
              ) : paginatedEleves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-500">
                    Aucun élève trouvé avec les filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                paginatedEleves.map((e) => {
                  const fullName = `${e.nom} ${e.postnom ?? ''} ${e.prenom}`.trim();
                  const currentInsc = e.inscriptions.find(
                    (i) => i.annee.estActive
                  );

                  return (
                    <tr
                      key={e.matricule}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="p-3.5 font-mono text-xs font-semibold text-slate-700">
                        {e.matricule}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={fullName} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                              {fullName}
                            </p>
                            <p className="text-xs text-slate-400">
                              Né(e) le{' '}
                              {new Date(e.dateNaissance).toLocaleDateString(
                                'fr-FR'
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={e.sexe === 'F' ? 'violet' : 'sky'}
                          className="text-[10px]"
                        >
                          {e.sexe === 'F' ? 'Féminin' : 'Masculin'}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        {currentInsc ? (
                          <Badge variant="default" className="text-xs">
                            {currentInsc.classe.libelle}
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">
                            Non inscrit
                          </Badge>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-slate-500 font-mono">
                        {e.utilisateur?.email ?? (
                          <span className="text-slate-300">Aucun</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {!currentInsc && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMatriculeForEnrol(e.matricule);
                              setOpenEnrolModal(true);
                            }}
                            className="text-xs"
                          >
                            <School className="mr-1 h-3.5 w-3.5" />
                            Inscrire
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500">
            <span>
              Page {page} sur {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Nouvel Élève ── */}
      <Dialog
        open={openStudentModal}
        onOpenChange={setOpenStudentModal}
        title="Créer une fiche élève"
        description="Renseignez l'identité civile et le compte portail de l'élève"
        maxWidth="xl"
      >
        <form onSubmit={submitStudent} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label requiredIndicator>Matricule (identifiant)</Label>
              <Input
                required
                name="matricule"
                placeholder="Ex. 2026-MATH-001"
              />
            </div>
            <div className="space-y-1">
              <Label requiredIndicator>Genre / Sexe</Label>
              <Select required name="sexe">
                <option value="M">Masculin (M)</option>
                <option value="F">Féminin (F)</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label requiredIndicator>Nom de famille</Label>
              <Input required name="nom" placeholder="Ex. KABAMBA" />
            </div>
            <div className="space-y-1">
              <Label>Postnom</Label>
              <Input name="postnom" placeholder="Ex. MUKENDI" />
            </div>
            <div className="space-y-1">
              <Label requiredIndicator>Prénom</Label>
              <Input required name="prenom" placeholder="Ex. David" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label requiredIndicator>Date de naissance</Label>
              <Input required type="date" name="dateNaissance" />
            </div>
            <div className="space-y-1">
              <Label>Lieu de naissance</Label>
              <Input name="lieuNaissance" placeholder="Ex. Kinshasa" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Adresse de résidence</Label>
            <Input name="adresse" placeholder="Ex. Av. Lumumba n° 42, Gombe" />
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Accès Portail Kotaschool (Optionnel)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Email élève / tuteur</Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="eleve@kotaschool.cd"
                />
              </div>
              <div className="space-y-1">
                <Label>Mot de passe</Label>
                <Input
                  type="password"
                  name="motDePasse"
                  placeholder="Minimum 6 caractères"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenStudentModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={busy}>
              Enregistrer l&apos;élève
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ── Modal: Inscription ── */}
      <Dialog
        open={openEnrolModal}
        onOpenChange={setOpenEnrolModal}
        title="Inscription scolaire"
        description="Affecter l'élève à une classe pour l'année sélectionnée"
        maxWidth="md"
      >
        <form onSubmit={submitEnrolment} className="space-y-4">
          <div className="space-y-1.5">
            <Label requiredIndicator>Matricule de l&apos;élève</Label>
            <Input
              required
              name="matricule"
              placeholder="Ex. 2026-MATH-001"
              defaultValue={selectedMatriculeForEnrol}
            />
          </div>

          <div className="space-y-1.5">
            <Label requiredIndicator>Classe d&apos;affectation</Label>
            <Select required name="idClasse">
              <option value="">Sélectionner une classe…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.libelle}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label requiredIndicator>Année scolaire</Label>
            <Select required name="idAnnee">
              <option value="">Sélectionner l&apos;année…</option>
              {cat?.annees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.libelle} {a.estActive ? '(Active)' : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenEnrolModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={busy}>
              Valider l&apos;inscription
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}
