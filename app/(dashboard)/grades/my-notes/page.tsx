'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type Resultat = { libelle: string; type: string; periode: string; matiere: string; note: number; maximum: number; statut: string; estValide: boolean };
type Ligne = { matiere: string; coefficient: number; note: number; noteBulletin: number };
type Bulletin = { totalObtenu: number; totalMaximum: number; pourcentage: number; rang: number | null; decision: string | null; lignes: Ligne[] };
type SemestreView = { id: string; libelle: string; resultats: Resultat[]; bulletin: Bulletin | null };
type MyGrades = { eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }; classe: string; option: string; section: string; annee: string; semestres: SemestreView[] };

const STATUT_STYLE: Record<string, string> = { VALIDEE: 'bg-emerald-100 text-emerald-700', SOUMISE: 'bg-blue-100 text-blue-700', BROUILLON: 'bg-amber-100 text-amber-700' };

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function nomEleve(e: { nom: string; postnom?: string | null; prenom: string }): string {
  return `${e.nom} ${e.postnom ?? ''} ${e.prenom}`.trim();
}

function printBulletin(d: { semestre: string; annee: string; eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }; classe: string; option: string; section: string; bulletin: Bulletin }) {
  const b = d.bulletin;
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) return;
  const rows = b.lignes.map((l) => `<tr><td>${esc(l.matiere)}</td><td class="c">${esc(l.coefficient)}</td><td class="c">${esc(l.note)}</td><td class="c">${esc(l.noteBulletin)}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Bulletin ${esc(d.eleve.nom)}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px;margin:0}
    .head{display:flex;justify-content:space-between;gap:12px;border-bottom:2px solid #0f172a;padding-bottom:10px}
    h1{margin:0;font-size:20px;color:#7c3aed}
    table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
    th,td{border:1px solid #334155;padding:6px;text-align:left}th{background:#f1f5f9}.c{text-align:center}.tot td{font-weight:bold}
    .meta{margin:12px 0;font-size:13px;line-height:1.6}.sig{margin-top:36px;font-size:11px;color:#475569}
    @page{margin:16mm}</style></head><body>
    <div class="head"><div><h1>Kotaschool</h1><div>Système éducatif · EPSP</div></div><div style="text-align:right"><b>Bulletin · ${esc(d.semestre)}</b><br>Année scolaire ${esc(d.annee)}</div></div>
    <p class="meta"><b>Élève :</b> ${esc(nomEleve(d.eleve))}<br><b>Matricule :</b> ${esc(d.eleve.matricule)}<br><b>Classe :</b> ${esc(d.classe)} · ${esc(d.option)} (${esc(d.section)})</p>
    <table><thead><tr><th>Matière</th><th class="c">Coef.</th><th class="c">Note / 20</th><th class="c">Note × Coef.</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="tot"><td>TOTAL</td><td class="c">—</td><td class="c">—</td><td class="c">${esc(b.totalObtenu)} / ${esc(b.totalMaximum)}</td></tr></tfoot></table>
    <p class="meta">Pourcentage : <b>${esc(b.pourcentage)}%</b> · Rang : <b>${esc(b.rang)}</b> · Décision : <b>${esc(b.decision)}</b></p>
    <div class="sig">Fait le ${new Date().toLocaleDateString('fr-FR')} — Secrétariat pédagogique Kotaschool</div>
    <script>window.onload = function(){ window.print(); }<\\/script></body></html>`);
  w.document.close();
}

function downloadBulletinPdf(d: { semestre: string; annee: string; eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }; classe: string; option: string; section: string; bulletin: Bulletin }) {
  const b = d.bulletin;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFontSize(17); doc.setFont('helvetica', 'bold'); doc.setTextColor(124, 58, 237); doc.text('Kotaschool', 14, 16);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80); doc.text('Système éducatif · EPSP', 14, 21);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42); doc.text(`Bulletin — ${d.semestre}`, 196, 16, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80); doc.text(`Année scolaire ${d.annee}`, 196, 21, { align: 'right' });
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42); doc.text(nomEleve(d.eleve), 14, 32);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Matricule : ${d.eleve.matricule}`, 14, 38);
  doc.text(`Classe : ${d.classe} · ${d.option} (${d.section})`, 14, 43);
  autoTable(doc, {
    startY: 50,
    head: [['Matière', 'Coef.', 'Note / 20', 'Note × Coef.']],
    body: b.lignes.map((l) => [l.matiere, String(l.coefficient), String(l.note), String(l.noteBulletin)]),
    foot: [['TOTAL', '', '', `${b.totalObtenu} / ${b.totalMaximum}`]],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 2.5 },
    footStyles: { fontStyle: 'bold' },
  });
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text(`Pourcentage : ${b.pourcentage}%    Rang : ${b.rang ?? '—'}    Décision : ${b.decision ?? '—'}`, 14, finalY + 8);
  doc.save(`bulletin_${nomEleve(d.eleve).replace(/\s+/g, '_')}_${d.semestre}.pdf`);
}

export default function MyNotesPage() {
  const [data, setData] = useState<MyGrades | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<MyGrades>('/notes/my-grades').then((r) => setData(r.data)).catch(() => setError('Impossible de charger vos résultats.'));
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes résultats</h1>
        <p className="mt-1 text-sm text-slate-600">{data ? `${nomEleve(data.eleve)} — ${data.classe} · ${data.option} (${data.section}) — Année ${data.annee}` : 'Consultation de vos notes et bulletins.'}</p>
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="text-slate-500">Chargement…</p>}

      {data?.semestres.map((s) => {
        const validees = s.resultats.filter((r) => r.estValide);
        const bul = s.bulletin;
        const pdfData = bul ? { semestre: s.libelle, annee: data.annee, eleve: data.eleve, classe: data.classe, option: data.option, section: data.section, bulletin: bul } : null;
        return (
          <div key={s.id} className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold">{s.libelle}</h2>

            {validees.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune note validée pour le moment.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600"><tr><th className="p-2">Matière</th><th className="p-2">Type</th><th className="p-2">Période</th><th className="p-2">Note</th><th className="p-2">Statut</th></tr></thead>
                <tbody>
                  {validees.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.matiere} — <span className="text-slate-500">{r.libelle}</span></td>
                      <td className="p-2">{r.type}</td>
                      <td className="p-2">{r.periode}</td>
                      <td className="p-2 font-semibold">{r.note} / {r.maximum}</td>
                      <td className="p-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_STYLE[r.statut] ?? 'bg-slate-100 text-slate-600'}`}>{r.statut}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className={`mt-4 rounded-md border p-4 ${bul ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'}`}>
              {bul ? (
                <>
                  <p className="text-sm">
                    Pourcentage : <strong>{bul.pourcentage}%</strong> · Rang : <strong>{bul.rang}</strong> · Décision : <strong>{bul.decision}</strong> · Total : {bul.totalObtenu}/{bul.totalMaximum}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button onClick={() => pdfData && printBulletin(pdfData)} className="rounded-md border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600">Imprimer le bulletin</button>
                    <button onClick={() => pdfData && downloadBulletinPdf(pdfData)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">Télécharger le bulletin (PDF)</button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">🔒 Votre bulletin sera disponible dès que toutes vos notes seront saisies et validées.</p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
