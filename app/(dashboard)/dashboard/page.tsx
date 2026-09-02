'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';

type MyAssignment = { id: string; annee: { libelle: string }; classeMatiere: { id: string; classe: { libelle: string }; matiere: { libelle: string } } };

function Stat({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="rounded-lg bg-white p-5 shadow-sm transition hover:shadow">
      <p className="text-3xl font-bold text-brand-600">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [assignments, setAssignments] = useState<MyAssignment[] | null>(null);
  const [counts, setCounts] = useState<{ eleves: number; enseignants: number; matieres: number; enAttente: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const role = user?.role;
    if (!role) return;
    if (role === 'TEACHER') {
      api.get<MyAssignment[]>('/administration/my-assignments').then((r) => setAssignments(r.data)).catch(() => setError('Impossible de charger vos affectations.'));
    } else if (role === 'ADMIN' || role === 'SECRETARY') {
      Promise.all([
        api.get('/administration/catalogue'),
        api.get<unknown[]>('/administration/students'),
        api.get<unknown[]>('/administration/assignments'),
      ]).then(([cat, stu, ass]) => setCounts({ eleves: (stu.data as unknown[]).length, enseignants: (cat.data as { enseignants: unknown[] }).enseignants.length, matieres: (cat.data as { matieres: unknown[] }).matieres.length, enAttente: (ass.data as unknown[]).length })).catch(() => setError('Impossible de charger les statistiques.'));
    } else if (role === 'PEDAGOGICAL_COUNCIL') {
      api.get<unknown[]>('/notes/validations').then((r) => setCounts({ eleves: 0, enseignants: 0, matieres: 0, enAttente: (r.data as unknown[]).length })).catch(() => setError('Impossible de charger les validations.'));
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-600">Bonjour <strong>{user?.username}</strong> ({user?.roleLabel ?? user?.role}).</p>
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {user?.role === 'STUDENT' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Mes résultats et bulletins" value="Voir" href="/grades/my-notes" />
        </div>
      )}

      {user?.role === 'TEACHER' && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Accéder à la saisie des notes" value="Saisie" href="/grades/entry" />
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold">Mes affectations ({assignments?.length ?? 0})</h2>
            {assignments?.length ? (
              <ul className="space-y-2 text-sm">
                {assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-md border p-3">
                    <span>{a.classeMatiere.classe.libelle} — <strong>{a.classeMatiere.matiere.libelle}</strong> ({a.annee.libelle})</span>
                    <Link href="/grades/entry" className="rounded border border-brand-600 px-3 py-1 text-xs font-medium text-brand-600">Saisir les notes</Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">Aucune affectation pour le moment.</p>}
          </div>
        </>
      )}

      {(user?.role === 'ADMIN' || user?.role === 'SECRETARY') && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Élèves" value={counts?.eleves ?? '—'} href="/students" />
          <Stat label="Enseignants" value={counts?.enseignants ?? '—'} href="/teachers" />
          <Stat label="Matières" value={counts?.matieres ?? '—'} href="/academic" />
          <Stat label="Affectations" value={counts?.enAttente ?? '—'} href="/assignments" />
        </div>
      )}

      {user?.role === 'PEDAGOGICAL_COUNCIL' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat label="Évaluations en attente de validation" value={counts?.enAttente ?? '—'} href="/grades/validation" />
        </div>
      )}
    </div>
  );
}

