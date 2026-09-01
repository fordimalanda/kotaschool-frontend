'use client';
import { useState } from 'react';
import { GradeTable, type GradeRow } from '@/components/grades/grade-table';
const demoStudents: GradeRow[] = [
  { idInscription: 'demo-1', matricule: 'KOT-2026-001', nom: 'Banza', postnom: 'Kalume', prenom: 'Aline', valeurNote: null, observation: '', estValide: false },
  { idInscription: 'demo-2', matricule: 'KOT-2026-002', nom: 'Ilunga', postnom: 'Mbuyi', prenom: 'David', valeurNote: null, observation: '', estValide: false },
];
export default function GradeEntryPage() {
  const [maximum, setMaximum] = useState(20); const [rows, setRows] = useState(demoStudents); const [message, setMessage] = useState('');
  async function save() { setMessage('La connexion de cette grille à POST /notes/batch sera activée lorsque les endpoints du module Notes seront ajoutés.'); }
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Saisie des notes</h1><p className="mt-1 text-sm text-slate-600">Enregistrez les notes en brouillon avant de les soumettre au conseil pédagogique.</p></div><section className="grid gap-4 rounded-lg bg-white p-5 shadow-sm md:grid-cols-4"><label className="text-sm font-medium">Année scolaire<select className="mt-1 w-full rounded-md border p-2"><option>2026–2027</option></select></label><label className="text-sm font-medium">Classe<select className="mt-1 w-full rounded-md border p-2"><option>Sélectionnez une classe</option></select></label><label className="text-sm font-medium">Matière<select className="mt-1 w-full rounded-md border p-2"><option>Sélectionnez une matière</option></select></label><label className="text-sm font-medium">Note maximale<input className="mt-1 w-full rounded-md border p-2" min="1" type="number" value={maximum} onChange={(e) => setMaximum(Number(e.target.value))} /></label></section><GradeTable rows={rows} maximum={maximum} onChange={setRows} /><div className="flex items-center gap-3"><button onClick={save} className="rounded-md border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600">Enregistrer en brouillon</button><button onClick={save} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">Soumettre pour validation</button>{message && <p className="text-sm text-slate-500">{message}</p>}</div></div>;
}
