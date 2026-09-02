'use client';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';

type Enseignant = { id: string; nom: string; postnom: string | null; prenom: string; sexe: 'M' | 'F'; telephone: string | null; email: string | null };

const inputCls = 'w-full rounded-md border p-2 text-sm';

export default function TeachersPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[] | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const user = useAuthStore((s) => s.user);

  function submitAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(''); setMessage('');
    api.post('/administration/admins', { email: f.get('email'), motDePasse: (f.get('motDePasse') as string) || undefined })
      .then(() => { setMessage('Administrateur créé avec succès.'); e.currentTarget.reset(); })
      .catch((err: any) => setError(err.response?.data?.message?.toString?.() ?? 'Erreur lors de la création.'))
      .finally(() => setBusy(false));
  }

  async function refresh() {
    const { data } = await api.get<{ enseignants: Enseignant[] }>('/administration/catalogue');
    setEnseignants(data.enseignants);
  }

  useEffect(() => { refresh().catch(() => setError('Impossible de charger les enseignants.')); }, []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(''); setMessage('');
    api.post('/administration/teachers', {
      nom: f.get('nom'), postnom: f.get('postnom') || undefined, prenom: f.get('prenom'),
      sexe: f.get('sexe'), telephone: f.get('telephone') || undefined, email: f.get('email'), motDePasse: (f.get('motDePasse') as string) || undefined,
    }).then(async () => {
      setMessage('Enseignant créé avec succès.');
      e.currentTarget.reset();
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
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">Nom complet</th><th className="p-3">Sexe</th><th className="p-3">Téléphone</th><th className="p-3">Email</th></tr></thead>
          <tbody>
            {enseignants?.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3">{t.nom} {t.postnom ?? ''} {t.prenom}</td>
                <td className="p-3">{t.sexe === 'M' ? 'M' : 'F'}</td>
                <td className="p-3">{t.telephone ?? '—'}</td>
                <td className="p-3">{t.email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {enseignants !== null && enseignants.length === 0 && <p className="p-6 text-sm text-slate-500">Aucun enseignant.</p>}
      </div>
    </section>
  );
}

