'use client';

import { FormEvent, useEffect, useState, useMemo } from 'react';
import {
  Layers,
  Calendar,
  BookOpen,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  School,
  FolderTree,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { AcademicD3Tree, type TreeDataNode } from '@/components/charts/academic-d3-tree';

type Classe = { id: string; libelle: string };
type Catalogue = {
  sections: {
    id: string;
    libelle: string;
    options: { id: string; libelle: string; classes: Classe[] }[];
  }[];
  matieres: { id: string; libelle: string }[];
  annees: { id: string; libelle: string; estActive: boolean }[];
};
type ClasseMatiere = {
  id: string;
  classe: { id: string; libelle: string; option: { libelle: string } };
  matiere: { id: string; libelle: string };
  coefficient: string;
};

export default function AcademicPage() {
  const [data, setData] = useState<Catalogue>();
  const [subjects, setSubjects] = useState<ClasseMatiere[]>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('structure');

  const refresh = async () => {
    try {
      const [c, s] = await Promise.all([
        api.get<Catalogue>('/administration/catalogue'),
        api.get<ClasseMatiere[]>('/administration/class-subjects'),
      ]);
      setData(c.data);
      setSubjects(s.data);
    } catch {
      setError('Impossible de charger le catalogue.');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const classes = (data?.sections ?? []).flatMap((s) =>
    s.options.flatMap((o) => o.classes)
  );

  async function create(path: string, form: HTMLFormElement) {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await api.post(`/administration/${path}`, Object.fromEntries(new FormData(form)));
      form.reset();
      setMessage('Élément enregistré avec succès dans le système.');
      await refresh();
    } catch (e: any) {
      setError(
        e.response?.data?.message?.toString() ??
          "Erreur lors de l'enregistrement de l'élément."
      );
    } finally {
      setBusy(false);
    }
  }

  const submit = (path: string) => (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    create(path, e.currentTarget);
  };

  const d3TreeData: TreeDataNode | null = useMemo(() => {
    if (!data?.sections || data.sections.length === 0) return null;
    return {
      name: 'Kotaschool',
      category: 'root',
      children: data.sections.map((sec) => ({
        name: sec.libelle,
        category: 'section' as const,
        children: sec.options.map((opt) => ({
          name: opt.libelle,
          category: 'option' as const,
          children: opt.classes.map((cls) => ({
            name: cls.libelle,
            category: 'classe' as const,
          })),
        })),
      })),
    };
  }, [data]);

  return (
    <section className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-brand-600" />
            Structure Pédagogique & Matières
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Configurez les années scolaires, sections, options d&apos;études,
            matières et coefficients officiels.
          </p>
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

      {/* ── Tabs Navigation ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-soft-sm">
        <Tabs
          tabs={[
            { id: 'structure', label: 'Arborescence & Vue D3.js', icon: FolderTree },
            { id: 'classes', label: 'Classes & Niveaux', icon: School },
            { id: 'matieres', label: 'Matières & Cours', icon: BookOpen },
            { id: 'coefficients', label: 'Coefficients', icon: Layers },
            { id: 'sections-options', label: 'Sections & Options', icon: Sparkles },
            { id: 'annees', label: 'Années Scolaires', icon: Calendar },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* ── Tab: Structure D3.js ── */}
      {activeTab === 'structure' && (
        <div className="space-y-6">
          {d3TreeData && <AcademicD3Tree data={d3TreeData} />}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.sections.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{s.libelle}</span>
                    <Badge variant="violet" className="text-xs">
                      {s.options.length} option{s.options.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {s.options.map((o) => (
                    <div key={o.id} className="rounded-lg bg-slate-50 p-3">
                      <p className="font-semibold text-xs text-slate-800">
                        {o.libelle}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.classes.map((c) => (
                          <Badge key={c.id} variant="secondary" className="text-[10px]">
                            {c.libelle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Classes ── */}
      {activeTab === 'classes' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Nouvelle Classe</CardTitle>
              <CardDescription>Ajouter une promotion à une option</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit('classes')} className="space-y-4">
                <div className="space-y-1.5">
                  <Label requiredIndicator>Nom de la classe</Label>
                  <Input required name="libelle" placeholder="Ex. 1ère Math-Physique A" />
                </div>
                <div className="space-y-1.5">
                  <Label requiredIndicator>Niveau d&apos;études</Label>
                  <Input required name="niveau" placeholder="Ex. 1ère, 2ème, 6ème…" />
                </div>
                <div className="space-y-1.5">
                  <Label requiredIndicator>Option parente</Label>
                  <Select required name="idOption">
                    <option value="">Sélectionner une option…</option>
                    {data?.sections.flatMap((s) =>
                      s.options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.libelle} ({s.libelle})
                        </option>
                      ))
                    )}
                  </Select>
                </div>
                <Button type="submit" loading={busy} className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Créer la classe
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Classes Enregistrées ({classes.length})</CardTitle>
              <CardDescription>Liste exhaustive des promotions scolaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {data?.sections.flatMap((s) =>
                  s.options.flatMap((o) =>
                    o.classes.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-soft-sm"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 text-xs sm:text-sm block">
                            {c.libelle}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {o.libelle} · {s.libelle}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          Active
                        </Badge>
                      </div>
                    ))
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: Matières ── */}
      {activeTab === 'matieres' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Nouvelle Matière</CardTitle>
              <CardDescription>Enregistrer une discipline au catalogue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit('subjects')} className="space-y-4">
                <div className="space-y-1.5">
                  <Label requiredIndicator>Libellé de la matière</Label>
                  <Input required name="libelle" placeholder="Ex. Mathématiques, Physique…" />
                </div>
                <Button type="submit" loading={busy} className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Ajouter la matière
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Catalogue des Matières ({data?.matieres.length ?? 0})
              </CardTitle>
              <CardDescription>Disciplines enseignées dans l&apos;établissement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {data?.matieres.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-3 shadow-soft-sm"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 border border-brand-200/60 shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
                      {m.libelle}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: Coefficients ── */}
      {activeTab === 'coefficients' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Assigner un Coefficient</CardTitle>
              <CardDescription>Définir le poids officiel par classe</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit('class-subjects')} className="space-y-4">
                <div className="space-y-1.5">
                  <Label requiredIndicator>Classe</Label>
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
                  <Label requiredIndicator>Matière</Label>
                  <Select required name="idMatiere">
                    <option value="">Sélectionner une matière…</option>
                    {data?.matieres.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.libelle}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label requiredIndicator>Coefficient (poids)</Label>
                  <Input
                    required
                    name="coefficient"
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="Ex. 2 ou 3.5"
                  />
                </div>

                <Button type="submit" loading={busy} className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Enregistrer le coefficient
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Grille des Coefficients ({subjects?.length ?? 0})
              </CardTitle>
              <CardDescription>Pondérations officielles appliquées aux bulletins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-200 bg-slate-100/70 text-xs font-semibold uppercase text-slate-600">
                    <tr>
                      <th className="p-3">Classe</th>
                      <th className="p-3">Matière</th>
                      <th className="p-3 text-right">Coefficient</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects?.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-semibold text-slate-800">
                          {s.classe.libelle}
                        </td>
                        <td className="p-3 text-slate-600">{s.matiere.libelle}</td>
                        <td className="p-3 text-right font-mono font-bold text-brand-600">
                          <Badge variant="violet">Coef {s.coefficient}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: Sections & Options ── */}
      {activeTab === 'sections-options' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nouvelle Section</CardTitle>
              <CardDescription>Ex. Scientifique, Littéraire, Commerciale</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit('sections')} className="space-y-4">
                <div className="space-y-1.5">
                  <Label requiredIndicator>Nom de la section</Label>
                  <Input required name="libelle" placeholder="Ex. Technique Industrielle" />
                </div>
                <Button type="submit" loading={busy} className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Créer la section
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nouvelle Option</CardTitle>
              <CardDescription>Rattachée à une section existante</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit('options')} className="space-y-4">
                <div className="space-y-1.5">
                  <Label requiredIndicator>Nom de l&apos;option</Label>
                  <Input required name="libelle" placeholder="Ex. Électricité Générale" />
                </div>
                <div className="space-y-1.5">
                  <Label requiredIndicator>Section parente</Label>
                  <Select required name="idSection">
                    <option value="">Sélectionner une section…</option>
                    {data?.sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.libelle}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" loading={busy} className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Créer l&apos;option
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: Années Scolaires ── */}
      {activeTab === 'annees' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Créer une Année</CardTitle>
              <CardDescription>Session scolaire académique</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit('academic-years')} className="space-y-4">
                <div className="space-y-1.5">
                  <Label requiredIndicator>Libellé de l&apos;année</Label>
                  <Input required name="libelle" placeholder="Ex. 2026–2027" />
                </div>
                <Button type="submit" loading={busy} className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Ajouter l&apos;année scolaire
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Historique des Sessions</CardTitle>
              <CardDescription>Années scolaires configurées dans la base</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {data?.annees.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-soft-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-200/60">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">
                          {a.libelle}
                        </span>
                        <span className="block text-xs text-slate-400">
                          Session Académique
                        </span>
                      </div>
                    </div>
                    {a.estActive ? (
                      <Badge variant="success">Année Active</Badge>
                    ) : (
                      <Badge variant="secondary">Clôturée</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
