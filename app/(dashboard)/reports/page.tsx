'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';

type Semestre = { id: string; libelle: string; annee: { libelle: string } };
type BoardRow = { inscriptionId: string; matricule: string; nom: string; classe: string; totalObtenu: number; totalMaximum: number; pourcentage: number; rang: number | null; decision: string | null };
type Ligne = { matiere: string; coefficient: number; note: number; noteBulletin: number };
type Detail = {
  semestre: { libelle: string; annee: string };
  eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string; classe: string; option: string; section: string };
  lignes: Ligne[];
  totalObtenu: number;
  totalMaximum: number;
  pourcentage: number;
  rang: number | null;
  decision: string | null;
};

export default function ReportsPage() {
  const [semestres, setSemestres] = useState<Semestre[] | null>(null);
  const [semestreId, setSemestreId] = useState('');
  const [board, setBoard] = useState<{ semestre: { libelle: string; annee: string }; bulletins: BoardRow[] } | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadBoard(id: string) {
    const { data } = await api.get(`/notes/reports/semestre/${id}`);
    setBoard(data);
    setDetail(null);
  }

  useEffect(() => {
    api.get<Semestre[]>('/notes/reports/semestres').then(async ({ data }) => {
      setSemestres(data);
      if (data[0]) {
        setSemestreId(data[0].id);
        try { await loadBoard(data[0].id); } catch { setBoard(null); }
      }
    }).catch(() => setError('Impossible de charger les semestres.'));
  }, []);

  async function selectSemestre(id: string) {
    setSemestreId(id);
    setBoard(null);
    setDetail(null);
    setError(''); setMessage('');
    try { await loadBoard(id); } catch { setError('Aucun bulletin calculé pour ce semestre : lancez le calcul.'); }
  }

  async function recalculate() {
    if (!semestreId) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await api.post(`/notes/bulletins/semestre/${semestreId}/calculer`);
      await loadBoard(semestreId);
      setMessage('Bulletins recalculés et classés.');
    } catch { setError('Recalcul impossible.'); } finally { setBusy(false); }
  }

  async function openDetail(inscriptionId: string) {
    setError(''); setDetail(null);
    try {
      const { data } = await api.get(`/notes/reports/inscription/${inscriptionId}/semestre/${semestreId}`);
      setDetail(data);
    } catch { setError('Détail du bulletin indisponible.'); }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulletins</h1>
        <p className="mt-1 text-sm text-slate-600">Consultez le classement du semestre et générez les bulletins imprimables (PDF).</p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg bg-white p-5 shadow-sm">
        <label className="text-sm font-medium">Semestre
          <select className="mt-1 w-full rounded-md border p-2" value={semestreId} onChange={(e) => selectSemestre(e.target.value)}>
            {semestres === null && <option>Chargement…</option>}
            {semestres?.map((s) => <option key={s.id} value={s.id}>{s.libelle} ({s.annee.libelle})</option>)}
          </select>
        </label>
        <button onClick={recalculate} disabled={busy || !semestreId} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 no-print">Recalculer le classement</button>
      </div>

      {board && (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <div className="border-b p-4">
            <p className="font-medium">{board.semestre.libelle} — Année {board.semestre.annee}</p>
            <p className="text-xs text-slate-500">{board.bulletins.length} élève(s)</p>
          </div>
          {board.bulletins.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Aucun bulletin. Cliquez sur « Recalculer le classement ».</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr><th className="p-3">Rang</th><th className="p-3">Matricule</th><th className="p-3">Élève</th><th className="p-3">Classe</th><th className="p-3">Total</th><th className="p-3">%</th><th className="p-3">Décision</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {board.bulletins.map((b) => (
                  <tr key={b.inscriptionId} className="border-t">
                    <td className="p-3 font-semibold">{b.rang ?? '—'}</td>
                    <td className="p-3 font-mono text-xs">{b.matricule}</td>
                    <td className="p-3">{b.nom}</td>
                    <td className="p-3">{b.classe}</td>
                    <td className="p-3">{b.totalObtenu}/{b.totalMaximum}</td>
                    <td className="p-3">{b.pourcentage}%</td>
                    <td className="p-3">{b.decision ?? '—'}</td>
                    <td className="p-3"><button onClick={() => openDetail(b.inscriptionId)} className="rounded border border-brand-600 px-3 py-1 text-xs font-medium text-brand-600 no-print">Bulletin</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {detail && (
        <div className="print-area rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-300 pb-4">
            <div>
              <p className="text-xl font-bold text-brand-600">Kotaschool</p>
              <p className="text-xs text-slate-500">Système éducatif · EPSP</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Bulletin · {detail.semestre.libelle}</p>
              <p className="text-xs text-slate-500">Année scolaire {detail.semestre.annee}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
            <p><span className="text-slate-500">Élève :</span> <strong>{detail.eleve.nom} {detail.eleve.postnom ?? ''} {detail.eleve.prenom}</strong></p>
            <p><span className="text-slate-500">Matricule :</span> {detail.eleve.matricule}</p>
            <p><span className="text-slate-500">Classe :</span> {detail.eleve.classe} · {detail.eleve.option} ({detail.eleve.section})</p>
          </div>

          <table className="mt-4 w-full text-left text-sm">
            <thead className="border-y border-slate-300 bg-slate-100 text-slate-700">
              <tr><th className="p-2">Matière</th><th className="p-2 text-center">Coef.</th><th className="p-2 text-center">Note / 20</th><th className="p-2 text-center">Note × Coef.</th></tr>
            </thead>
            <tbody>
              {detail.lignes.map((l) => (
                <tr key={l.matiere} className="border-b border-slate-200">
                  <td className="p-2">{l.matiere}</td>
                  <td className="p-2 text-center">{l.coefficient}</td>
                  <td className="p-2 text-center">{l.note}</td>
                  <td className="p-2 text-center">{l.noteBulletin}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="p-2">TOTAL</td>
                <td className="p-2 text-center">—</td>
                <td className="p-2 text-center">—</td>
                <td className="p-2 text-center">{detail.totalObtenu} / {detail.totalMaximum}</td>
              </tr>
              <tr>
                <td className="p-2" colSpan={4}>Pourcentage : <strong>{detail.pourcentage}%</strong> · Rang : <strong>{detail.rang ?? '—'}</strong> · Décision : <strong>{detail.decision ?? '—'}</strong></td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-6 flex items-center justify-end gap-3 no-print">
            <button onClick={() => setDetail(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Fermer</button>
            <button onClick={() => window.print()} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">Imprimer / PDF</button>
          </div>
        </div>
      )}
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

