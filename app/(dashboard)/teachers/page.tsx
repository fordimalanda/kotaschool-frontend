'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  UserPlus,
  ShieldCheck,
  Search,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Dialog } from '@/components/ui/dialog';

type Enseignant = {
  id: string;
  nom: string;
  postnom: string | null;
  prenom: string;
  sexe: 'M' | 'F';
  telephone: string | null;
  email: string | null;
};

export default function TeachersPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[] | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSexe, setFilterSexe] = useState('');
  const [page, setPage] = useState(1);
  const user = useAuthStore((s) => s.user);
  const pageSize = 15;

  // Modals
  const [openTeacherModal, setOpenTeacherModal] = useState(false);
  const [openAdminModal, setOpenAdminModal] = useState(false);

  async function refresh() {
    const { data } = await api.get<{ enseignants: Enseignant[] }>(
      '/administration/catalogue'
    );
    setEnseignants(data.enseignants);
  }

  useEffect(() => {
    refresh().catch(() => setError('Impossible de charger les enseignants.'));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterSexe]);

  const filteredEnseignants = useMemo(() => {
    if (!enseignants) return [];
    const query = search.trim().toLowerCase();
    return enseignants.filter((teacher) => {
      if (filterSexe && teacher.sexe !== filterSexe) return false;
      if (!query) return true;
      const fullName = `${teacher.nom} ${teacher.postnom ?? ''} ${teacher.prenom}`.toLowerCase();
      return (
        fullName.includes(query) ||
        (teacher.telephone ?? '').toLowerCase().includes(query) ||
        (teacher.email ?? '').toLowerCase().includes(query)
      );
    });
  }, [enseignants, search, filterSexe]);

  const totalPages = Math.max(1, Math.ceil(filteredEnseignants.length / pageSize));
  const paginatedEnseignants = useMemo(
    () =>
      filteredEnseignants.slice((page - 1) * pageSize, page * pageSize),
    [filteredEnseignants, page]
  );
  const hasActiveFilters = search !== '' || filterSexe !== '';

  function resetFilters() {
    setSearch('');
    setFilterSexe('');
    setPage(1);
  }

  function submitTeacher(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setError('');
    setMessage('');
    api
      .post('/administration/teachers', {
        nom: f.get('nom'),
        postnom: f.get('postnom') || undefined,
        prenom: f.get('prenom'),
        sexe: f.get('sexe'),
        telephone: f.get('telephone') || undefined,
        email: f.get('email'),
        motDePasse: (f.get('motDePasse') as string) || undefined,
      })
      .then(async () => {
        setMessage('Enseignant enregistré avec succès.');
        setOpenTeacherModal(false);
        await refresh();
      })
      .catch((err: any) =>
        setError(
          err.response?.data?.message?.toString?.() ??
            "Erreur lors de l'enregistrement."
        )
      )
      .finally(() => setBusy(false));
  }

  function submitAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setError('');
    setMessage('');
    api
      .post('/administration/admins', {
        email: f.get('email'),
        motDePasse: (f.get('motDePasse') as string) || undefined,
      })
      .then(() => {
        setMessage('Administrateur créé avec succès.');
        setOpenAdminModal(false);
      })
      .catch((err: any) =>
        setError(
          err.response?.data?.message?.toString?.() ??
            'Erreur lors de la création.'
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
            <GraduationCap className="h-6 w-6 text-brand-600" />
            Corps Enseignant & Équipe Pédagogique
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Gérez les dossiers des professeurs, leurs spécialités et leurs
            accès au portail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user?.role === 'ADMIN' && (
            <Button
              variant="outline"
              onClick={() => setOpenAdminModal(true)}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Nouvel Administrateur
            </Button>
          )}
          <Button onClick={() => setOpenTeacherModal(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Nouvel Enseignant
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Recherche par nom, contact ou email</Label>
            <div className="relative">
              <Input
                placeholder="Ex. Kabamba, jean.kabamba@..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Genre / Sexe</Label>
            <Select
              value={filterSexe}
              onChange={(e) => setFilterSexe(e.target.value)}
              className="text-xs"
            >
              <option value="">Tous les genres</option>
              <option value="M">Masculin (M)</option>
              <option value="F">Féminin (F)</option>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>
              Résultats trouvés :{' '}
              <strong>{filteredEnseignants.length}</strong> enseignant(s)
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

      {/* ── Teachers Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100/70 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="p-3.5">Enseignant</th>
                <th className="p-3.5">Genre</th>
                <th className="p-3.5">Téléphone</th>
                <th className="p-3.5">Email Portail</th>
                <th className="p-3.5 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enseignants === null ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-slate-500">
                    Chargement des enseignants…
                  </td>
                </tr>
              ) : paginatedEnseignants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-slate-500">
                    Aucun enseignant trouvé avec ces filtres.
                  </td>
                </tr>
              ) : (
                paginatedEnseignants.map((t) => {
                  const fullName = `${t.nom} ${t.postnom ?? ''} ${t.prenom}`.trim();
                  return (
                    <tr
                      key={t.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={fullName} size="sm" />
                          <div>
                            <span className="font-semibold text-slate-800 text-xs sm:text-sm block">
                              {fullName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Professeur Titulaire
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={t.sexe === 'F' ? 'violet' : 'sky'}
                          className="text-[10px]"
                        >
                          {t.sexe === 'F' ? 'Féminin' : 'Masculin'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-xs text-slate-600">
                        {t.telephone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {t.telephone}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-slate-600">
                        {t.email ? (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {t.email}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Badge variant="success">Actif</Badge>
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

      {/* ── Modal: Nouvel Enseignant ── */}
      <Dialog
        open={openTeacherModal}
        onOpenChange={setOpenTeacherModal}
        title="Créer un compte enseignant"
        description="Renseignez l'état civil et les identifiants portail du professeur"
        maxWidth="lg"
      >
        <form onSubmit={submitTeacher} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label requiredIndicator>Nom</Label>
              <Input required name="nom" placeholder="Ex. KABAMBA" />
            </div>
            <div className="space-y-1">
              <Label>Postnom</Label>
              <Input name="postnom" placeholder="Ex. MUKENDI" />
            </div>
            <div className="space-y-1">
              <Label requiredIndicator>Prénom</Label>
              <Input required name="prenom" placeholder="Ex. Jean" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label requiredIndicator>Genre / Sexe</Label>
              <Select required name="sexe">
                <option value="M">Masculin (M)</option>
                <option value="F">Féminin (F)</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Téléphone</Label>
              <Input name="telephone" placeholder="+243 810 000 001" />
            </div>
          </div>

          <div className="space-y-1">
            <Label requiredIndicator>Adresse e-mail (connexion)</Label>
            <Input
              required
              type="email"
              name="email"
              placeholder="jean.kabamba@kotaschool.cd"
            />
          </div>

          <div className="space-y-1">
            <Label>Mot de passe</Label>
            <Input
              type="password"
              name="motDePasse"
              placeholder="Par défaut: prof (si laissé vide)"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenTeacherModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={busy}>
              Créer l&apos;enseignant
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ── Modal: Nouvel Administrateur ── */}
      <Dialog
        open={openAdminModal}
        onOpenChange={setOpenAdminModal}
        title="Créer un administrateur"
        description="Attribuer les pleins pouvoirs système à un utilisateur"
        maxWidth="md"
      >
        <form onSubmit={submitAdmin} className="space-y-4">
          <div className="space-y-1.5">
            <Label requiredIndicator>Adresse email</Label>
            <Input
              required
              type="email"
              name="email"
              placeholder="admin@kotaschool.cd"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mot de passe</Label>
            <Input
              type="password"
              name="motDePasse"
              placeholder="Par défaut: admin (si laissé vide)"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenAdminModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={busy}>
              Créer l&apos;administrateur
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}
