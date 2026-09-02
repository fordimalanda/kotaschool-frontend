'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api/client';

type Eleve = { matricule: string; nom: string; postnom: string | null; prenom: string; sexe: 'M' | 'F'; dateNaissance: string; inscriptions: { id: string; annee: { libelle: string; estActive: boolean }; classe: { libelle: string } }[] };
type Classe = { id: string; libelle: string };
type Annee = { id: string; libelle: string; estActive: boolean };
type Catalogue = { sections: { id: string; libelle: string; options: { id: string; libelle: string; classes: Classe[] }[] }[]; annees: Annee[] };

const inputCls = 'w-full rounded-md border p-2 text-sm';
const btnCls = 'rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50';

export default function StudentsPage() {
  const [eleves, setEleves] = useState<Eleve[] | null>(null);
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const classes = useMemo(() => (cat?.sections ?? []).flatMap((s) => s.options.flatMap((o) => o.classes)), [cat]);

  async function refresh() {
    const [e, c] = await Promise.all([api.get<Eleve[]>('/administration/students'), api.get<Catalogue>('/administration/catalogue')]);
    setEleves(e.data);
    setCat(c.data);
  }

  useEffect(() => {
    refresh().catch(() => setError('Impossible de charger les données.'));
  }, []);

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

  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold">Élèves & inscriptions</h1><p className="mt-1 text-sm text-slate-600">Créez les dossiers élèves et inscrivez-les pour l’année scolaire.</p></div>
      {(message || error) && <p className={`rounded p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{error || message}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={submitStudent} className="space-y-3 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Nouvel élève</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input required name="matricule" placeholder="Matricule (ex. KOT-2026-004)" className={inputCls} />
            <input required name="nom" placeholder="Nom" className={inputCls} />
            <input name="postnom" placeholder="Postnom" className={inputCls} />
            <input required name="prenom" placeholder="Prénom" className={inputCls} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select required name="sexe" className={inputCls} defaultValue="M"><option value="M">Masculin</option><option value="F">Féminin</option></select>
            <label className="text-sm text-slate-500">Naissance<input required type="date" name="dateNaissance" className={`${inputCls} mt-1`} /></label>
            <input name="lieuNaissance" placeholder="Lieu de naissance" className={inputCls} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input required name="email" type="email" placeholder="Email de connexion" className={inputCls} />
            <input name="motDePasse" type="password" placeholder="Mot de passe (laisser vide = student)" className={inputCls} />
          </div>
          <input name="adresse" placeholder="Adresse" className={inputCls} />
          <button disabled={busy} className={btnCls}>Créer l’élève</button>
        </form>

        <form onSubmit={submitEnrolment} className="space-y-3 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Inscrire un élève</h2>
          <input required name="matricule" list="matricules" placeholder="Matricule de l’élève" className={inputCls} />
          <datalist id="matricules">{eleves?.map((e) => <option key={e.matricule} value={e.matricule}>{e.nom} {e.prenom}</option>)}</datalist>
          <select required name="idClasse" className={inputCls} defaultValue=""><option value="">Classe…</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}</select>
          <select required name="idAnnee" className={inputCls} defaultValue=""><option value="">Année scolaire…</option>{cat?.annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}{a.estActive ? ' (active)' : ''}</option>)}</select>
          <button disabled={busy} className={btnCls}>Inscrire</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">Matricule</th><th className="p-3">Élève</th><th className="p-3">Sexe</th><th className="p-3">Naissance</th><th className="p-3">Inscriptions</th></tr></thead>
          <tbody>
            {eleves?.map((e) => (
              <tr key={e.matricule} className="border-t">
                <td className="p-3 font-mono text-xs">{e.matricule}</td>
                <td className="p-3">{e.nom} {e.postnom ?? ''} {e.prenom}</td>
                <td className="p-3">{e.sexe === 'M' ? 'M' : 'F'}</td>
                <td className="p-3">{new Date(e.dateNaissance).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{e.inscriptions.map((i) => `${i.classe.libelle} · ${i.annee.libelle}${i.annee.estActive ? ' ✓' : ''}`).join(' — ') || <span className="text-slate-400">Non inscrit</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {eleves !== null && eleves.length === 0 && <p className="p-6 text-sm text-slate-500">Aucun élève pour le moment.</p>}
      </div>
    </section>
  );
}

