'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  BookOpen,
  School,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Dialog } from '@/components/ui/dialog';

type Assignment = {
  id: string;
  enseignant: { nom: string; postnom: string | null; prenom: string };
  annee: { libelle: string };
  classeMatiere: {
    classe: { libelle: string };
    matiere: { libelle: string };
  };
};
type ClasseMatiere = {
  id: string;
  classe: { id: string; libelle: string };
  matiere: { id: string; libelle: string };
  coefficient: string;
};
type Enseignant = {
  id: string;
  nom: string;
  postnom: string | null;
  prenom: string;
};
type Annee = { id: string; libelle: string; estActive: boolean };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [classSubjects, setClassSubjects] = useState<ClasseMatiere[] | null>(null);
  const [enseignants, setEnseignants] = useState<Enseignant[] | null>(null);
  const [annees, setAnnees] = useState<Annee[] | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  async function refresh() {
    const [a, cs, c] = await Promise.all([
      api.get<Assignment[]>('/administration/assignments'),
      api.get<ClasseMatiere[]>('/administration/class-subjects'),
      api.get<{ enseignants: Enseignant[]; annees: Annee[] }>(
        '/administration/catalogue'
      ),
    ]);
    setAssignments(a.data);
    setClassSubjects(cs.data);
    setEnseignants(c.data.enseignants);
    setAnnees(c.data.annees);
  }

  useEffect(() => {
    refresh().catch(() =>
      setError('Impossible de charger les affectations.')
    );
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterClasse, filterMatiere, filterAnnee]);

  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    const query = search.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const teacher = `${assignment.enseignant.nom} ${
        assignment.enseignant.postnom ?? ''
      } ${assignment.enseignant.prenom}`;
      const classe = assignment.classeMatiere.classe.libelle;
      const matiere = assignment.classeMatiere.matiere.libelle;
      if (filterClasse && classe !== filterClasse) return false;
      if (filterMatiere && matiere !== filterMatiere) return false;
      if (filterAnnee && assignment.annee.libelle !== filterAnnee) return false;
      return (
        !query ||
        `${teacher} ${classe} ${matiere} ${assignment.annee.libelle}`
          .toLowerCase()
          .includes(query)
      );
    });
  }, [assignments, search, filterClasse, filterMatiere, filterAnnee]);

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const paginatedAssignments = useMemo(
    () =>
      filteredAssignments.slice((page - 1) * pageSize, page * pageSize),
    [filteredAssignments, page]
  );
  const classes = useMemo(
    () => [...new Set((classSubjects ?? []).map((item) => item.classe.libelle))],
    [classSubjects]
  );
  const matieres = useMemo(
    () => [...new Set((classSubjects ?? []).map((item) => item.matiere.libelle))],
    [classSubjects]
  );
  const hasActiveFilters =
    search !== '' ||
    filterClasse !== '' ||
    filterMatiere !== '' ||
    filterAnnee !== '';

  function resetFilters() {
    setSearch('');
    setFilterClasse('');
    setFilterMatiere('');
    setFilterAnnee('');
    setPage(1);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setError('');
    setMessage('');
    api
      .post('/administration/assignments', {
        idEnseignant: f.get('idEnseignant'),
        idClasseMatiere: f.get('idClasseMatiere'),
        idAnnee: f.get('idAnnee'),
      })
      .then(async () => {
        setMessage('Affectation pédagogique enregistrée avec succès.');
        setOpenModal(false);
        await refresh();
      })
      .catch((err: any) =>
        setError(
          err.response?.data?.message?.toString?.() ??
            "Erreur lors de l'affectation."
        )
      )
      .finally(() => setBusy(false));
  }

  return (
    <section className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-brand-600" />
            Affectations Pédagogiques
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Attribuez les cours et les classes aux enseignants pour chaque année
            scolaire.
          </p>
        </div>

        <Button onClick={() => setOpenModal(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle Affectation
        </Button>
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
          <div className="space-y-1.5">
            <Label>Recherche générale</Label>
            <div className="relative">
              <Input
                placeholder="Enseignant, classe, matière…"
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
              {classes.map((classe) => (
                <option key={classe} value={classe}>
                  {classe}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Filtrer par Matière</Label>
            <Select
              value={filterMatiere}
              onChange={(e) => setFilterMatiere(e.target.value)}
              className="text-xs"
            >
              <option value="">Toutes les matières</option>
              {matieres.map((matiere) => (
                <option key={matiere} value={matiere}>
                  {matiere}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Année Scolaire</Label>
            <Select
              value={filterAnnee}
              onChange={(e) => setFilterAnnee(e.target.value)}
              className="text-xs"
            >
              <option value="">Toutes les années</option>
              {annees?.map((annee) => (
                <option key={annee.id} value={annee.libelle}>
                  {annee.libelle}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>
              Résultats : <strong>{filteredAssignments.length}</strong> affectation(s)
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 font-semibold text-brand-600 hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Effacer les filtres
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100/70 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="p-3.5">Professeur Titulaire</th>
                <th className="p-3.5">Classe</th>
                <th className="p-3.5">Discipline / Matière</th>
                <th className="p-3.5 text-right">Année Scolaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments === null ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-slate-500">
                    Chargement des affectations…
                  </td>
                </tr>
              ) : paginatedAssignments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-slate-500">
                    Aucune affectation trouvée avec ces critères.
                  </td>
                </tr>
              ) : (
                paginatedAssignments.map((a) => {
                  const teacherName = `${a.enseignant.nom} ${
                    a.enseignant.postnom ?? ''
                  } ${a.enseignant.prenom}`.trim();

                  return (
                    <tr
                      key={a.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={teacherName} size="sm" />
                          <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                            {teacherName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="violet" className="text-xs">
                          {a.classeMatiere.classe.libelle}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-slate-800 text-xs sm:text-sm">
                          {a.classeMatiere.matiere.libelle}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-xs text-slate-600">
                        {a.annee.libelle}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* ── Modal: Nouvelle Affectation ── */}
      <Dialog
        open={openModal}
        onOpenChange={setOpenModal}
        title="Affecter un enseignant"
        description="Attribuez une classe et une matière à un professeur"
        maxWidth="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label requiredIndicator>Enseignant</Label>
            <Select required name="idEnseignant" defaultValue="">
              <option value="">— Sélectionner un enseignant —</option>
              {enseignants?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom} {t.postnom ?? ''} {t.prenom}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label requiredIndicator>Classe & Matière</Label>
            <Select required name="idClasseMatiere" defaultValue="">
              <option value="">— Sélectionner la classe et matière —</option>
              {classSubjects?.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.classe.libelle} — {cs.matiere.libelle} (coef {cs.coefficient})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label requiredIndicator>Année scolaire</Label>
            <Select required name="idAnnee" defaultValue="">
              <option value="">— Sélectionner l&apos;année —</option>
              {annees?.map((a) => (
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
              onClick={() => setOpenModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={busy}>
              Enregistrer l&apos;affectation
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}
