'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ───────────────────────────────────────────────────────────────────

type Resultat = { libelle: string; type: string; periode: string; matiere: string; note: number; maximum: number; statut: string; estValide: boolean };
type LigneSem = { matiere: string; coefficient: number; note: number; noteBulletin: number };
type BulletinSem = { totalObtenu: number; totalMaximum: number; pourcentage: number; rang: number | null; decision: string | null; lignes: LigneSem[] };
type SemestreView = { id: string; libelle: string; resultats: Resultat[]; bulletin: BulletinSem | null };
type MyGrades = { eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }; classe: string; option: string; section: string; annee: string; semestres: SemestreView[] };

type LigneAnnuelle = { matiere: string; coefficient: number; noteS1: number; pointsS1: number; maxS1: number; noteS2: number; pointsS2: number; maxS2: number; totalAnnuel: number; maxAnnuel: number; pourcentage: number };
type BulletinAnnuel = { totalObtenu: number; totalMaximum: number; pourcentage: number; rang?: number; totalEleves: number; mention: string; decision: string; application: string; conduite: string; lignes: LigneAnnuelle[] };
type MyAnnual = { eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }; classe: string; option: string; section: string; annee: string; bulletin: BulletinAnnuel | null; published: boolean };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUT_STYLE: Record<string, string> = { VALIDEE: 'bg-emerald-100 text-emerald-700', SOUMISE: 'bg-blue-100 text-blue-700', BROUILLON: 'bg-amber-100 text-amber-700' };

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function nomEleve(e: { nom: string; postnom?: string | null; prenom: string }): string {
  return `${e.nom} ${e.postnom ?? ''} ${e.prenom}`.trim();
}

const MENTION_COLOR: Record<string, string> = {
  'Grande Distinction': 'text-violet-700 bg-violet-50 border-violet-200',
  'Distinction': 'text-blue-700 bg-blue-50 border-blue-200',
  'Satisfaction': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Réussi': 'text-green-700 bg-green-50 border-green-200',
  'Non réussi': 'text-red-700 bg-red-50 border-red-200',
};

// ─── Print / PDF semestres ────────────────────────────────────────────────────

function printBulletin(d: { semestre: string; annee: string; eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }; classe: string; option: string; section: string; bulletin: BulletinSem }) {
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
    <script>window.onload = function(){ window.print(); }<\/script></body></html>`);
  w.document.close();
}

function downloadBulletinPdf(d: { semestre: string; annee: string; eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }; classe: string; option: string; section: string; bulletin: BulletinSem }) {
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

// ─── Print / PDF bulletin annuel ─────────────────────────────────────────────

function printAnnualBulletin(eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }, classe: string, option: string, section: string, annee: string, b: BulletinAnnuel) {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return;
  const rows = b.lignes.map((l) => `<tr>
    <td>${esc(l.matiere)}</td>
    <td class="c">${esc(l.coefficient)}</td>
    <td class="c">${esc(l.noteS1)} <small>(${esc(l.pointsS1)}/${esc(l.maxS1)})</small></td>
    <td class="c">${esc(l.noteS2)} <small>(${esc(l.pointsS2)}/${esc(l.maxS2)})</small></td>
    <td class="c">${esc(l.totalAnnuel)} / ${esc(l.maxAnnuel)}</td>
    <td class="c">${esc(l.pourcentage)}%</td>
  </tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Bulletin Annuel ${esc(eleve.nom)}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px;margin:0}
    .head{display:flex;justify-content:space-between;gap:12px;border-bottom:3px solid #7c3aed;padding-bottom:10px;margin-bottom:14px}
    h1{margin:0;font-size:22px;color:#7c3aed}
    .badge{display:inline-block;padding:4px 14px;border-radius:999px;font-weight:bold;font-size:14px}
    table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px}
    th,td{border:1px solid #cbd5e1;padding:5px 7px;text-align:left}th{background:#f8fafc;font-weight:bold}.c{text-align:center}
    .tot td{font-weight:bold;background:#f1f5f9}.meta{margin:10px 0;font-size:13px;line-height:1.7}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0;font-size:13px}
    .sig{margin-top:30px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px}
    @page{margin:14mm}</style></head><body>
    <div class="head">
      <div><h1>Kotaschool</h1><div style="font-size:11px;color:#64748b">République Démocratique du Congo — EPSP</div></div>
      <div style="text-align:right"><b style="font-size:15px">BULLETIN ANNUEL</b><br><span style="font-size:12px">Année scolaire ${esc(annee)}</span></div>
    </div>
    <p class="meta">
      <b>Élève :</b> ${esc(nomEleve(eleve))} &nbsp;|&nbsp; <b>Matricule :</b> ${esc(eleve.matricule)}<br>
      <b>Classe :</b> ${esc(classe)} &nbsp;|&nbsp; <b>Option :</b> ${esc(option)} &nbsp;|&nbsp; <b>Section :</b> ${esc(section)}
    </p>
    <table>
      <thead><tr>
        <th>Matière</th><th class="c">Coef.</th>
        <th class="c">Semestre 1<br><small>Note (pts/max)</small></th>
        <th class="c">Semestre 2<br><small>Note (pts/max)</small></th>
        <th class="c">Total annuel</th>
        <th class="c">%</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="tot">
        <td colspan="4">TOTAL ANNUEL</td>
        <td class="c">${esc(b.totalObtenu)} / ${esc(b.totalMaximum)}</td>
        <td class="c">${esc(b.pourcentage)}%</td>
      </tr></tfoot>
    </table>
    <div class="info-grid" style="margin-top:16px">
      <div><b>Pourcentage :</b> ${esc(b.pourcentage)}%</div>
      <div><b>Rang :</b> ${b.rang ? `${esc(b.rang)} / ${esc(b.totalEleves)}` : '—'}</div>
      <div><b>Mention :</b> ${esc(b.mention)}</div>
      <div><b>Décision :</b> ${esc(b.decision)}</div>
      <div><b>Application :</b> ${esc(b.application)}</div>
      <div><b>Conduite :</b> ${esc(b.conduite)}</div>
    </div>
    <div class="sig">Fait le ${new Date().toLocaleDateString('fr-FR')} — Secrétariat pédagogique Kotaschool</div>
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`);
  w.document.close();
}

function downloadAnnualPdf(eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }, classe: string, option: string, section: string, annee: string, b: BulletinAnnuel) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

  // Header
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(124, 58, 237);
  doc.text('Kotaschool', 14, 16);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text('République Démocratique du Congo — EPSP', 14, 22);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
  doc.text('BULLETIN ANNUEL', 280, 16, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text(`Année scolaire ${annee}`, 280, 22, { align: 'right' });

  // Élève info
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
  doc.text(nomEleve(eleve), 14, 32);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Matricule : ${eleve.matricule}   |   Classe : ${classe}   |   Option : ${option}   |   Section : ${section}`, 14, 38);

  autoTable(doc, {
    startY: 45,
    head: [['Matière', 'Coef.', 'Semestre 1\n(note/pts/max)', 'Semestre 2\n(note/pts/max)', 'Total annuel', '%']],
    body: b.lignes.map((l) => [
      l.matiere,
      String(l.coefficient),
      `${l.noteS1}  (${l.pointsS1}/${l.maxS1})`,
      `${l.noteS2}  (${l.pointsS2}/${l.maxS2})`,
      `${l.totalAnnuel} / ${l.maxAnnuel}`,
      `${l.pourcentage}%`,
    ]),
    foot: [['TOTAL ANNUEL', '', '', '', `${b.totalObtenu} / ${b.totalMaximum}`, `${b.pourcentage}%`]],
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2 },
    footStyles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
    columnStyles: { 0: { cellWidth: 60 } },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);

  const summaryItems = [
    ['Pourcentage :', `${b.pourcentage}%`],
    ['Rang :', b.rang ? `${b.rang} / ${b.totalEleves}` : '—'],
    ['Mention :', b.mention],
    ['Décision :', b.decision],
    ['Application :', b.application],
    ['Conduite :', b.conduite],
  ];

  let cx = 14;
  for (const [label, value] of summaryItems) {
    doc.setFont('helvetica', 'bold'); doc.text(label, cx, finalY + 10);
    doc.setFont('helvetica', 'normal'); doc.text(value, cx + 28, finalY + 10);
    cx += 48;
  }

  doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')} — Secrétariat pédagogique Kotaschool`, 14, finalY + 18);

  doc.save(`bulletin_annuel_${nomEleve(eleve).replace(/\s+/g, '_')}_${annee}.pdf`);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyNotesPage() {
  const [data, setData] = useState<MyGrades | null>(null);
  const [annual, setAnnual] = useState<MyAnnual | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<MyGrades>('/notes/my-grades'),
      api.get<MyAnnual>('/notes/my-annual-bulletin'),
    ])
      .then(([r1, r2]) => { setData(r1.data); setAnnual(r2.data); })
      .catch(() => setError('Impossible de charger vos résultats.'));
  }, []);

  const mentionColor = annual?.bulletin ? (MENTION_COLOR[annual.bulletin.mention] ?? 'text-slate-700 bg-slate-50 border-slate-200') : '';

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes résultats</h1>
        <p className="mt-1 text-sm text-slate-600">
          {data ? `${nomEleve(data.eleve)} — ${data.classe} · ${data.option} (${data.section}) — Année ${data.annee}` : 'Consultation de vos notes et bulletins.'}
        </p>
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="text-slate-500">Chargement…</p>}

      {/* ── Bulletins semestriels ── */}
      {data?.semestres.map((s) => {
        const validees = s.resultats.filter((r) => r.estValide);
        const bul = s.bulletin;
        const pdfData = bul ? { semestre: s.libelle, annee: data.annee, eleve: data.eleve, classe: data.classe, option: data.option, section: data.section, bulletin: bul } : null;
        return (
          <div key={s.id} className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-lg">{s.libelle}</h2>

            {validees.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune note validée pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-2">Matière</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Période</th>
                      <th className="p-2">Note</th>
                      <th className="p-2">Statut</th>
                    </tr>
                  </thead>
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
              </div>
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

      {/* ── Bulletin Annuel (EPSP Congo) ── */}
      {annual && (
        <div className="rounded-xl border-2 border-violet-200 bg-white shadow-md">
          {/* Header violet */}
          <div className="flex items-center justify-between rounded-t-xl bg-gradient-to-r from-violet-700 to-violet-500 px-6 py-4 text-white">
            <div>
              <h2 className="text-xl font-bold tracking-wide">📋 Bulletin Annuel</h2>
              <p className="mt-0.5 text-sm text-violet-200">Année scolaire {annual.annee} — Résultat définitif</p>
            </div>
            <div className="text-right text-sm">
              <div className="font-medium">{annual.classe}</div>
              <div className="text-violet-200">{annual.option}</div>
            </div>
          </div>

          <div className="p-6">
            {!annual.bulletin ? (
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-5 text-slate-500">
                <span className="text-2xl">🔒</span>
                <p className="text-sm">Le bulletin annuel sera disponible une fois les deux semestres complétés et validés.</p>
              </div>
            ) : (
              <>
                {/* Mention badge + stats */}
                <div className="mb-5 flex flex-wrap items-start gap-4">
                  <div className={`rounded-xl border-2 px-6 py-3 text-center ${mentionColor}`}>
                    <div className="text-xs font-medium uppercase tracking-wide opacity-70">Mention</div>
                    <div className="mt-0.5 text-xl font-bold">{annual.bulletin.mention}</div>
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Pourcentage', value: `${annual.bulletin.pourcentage}%` },
                      { label: 'Rang', value: annual.bulletin.rang ? `${annual.bulletin.rang} / ${annual.bulletin.totalEleves}` : '—' },
                      { label: 'Application', value: annual.bulletin.application },
                      { label: 'Conduite', value: annual.bulletin.conduite },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-slate-50 p-3 text-center">
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className="mt-0.5 font-semibold text-slate-800">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Décision de passage */}
                <div className={`mb-5 flex items-center gap-3 rounded-lg border px-4 py-3 ${annual.bulletin.pourcentage >= 50 ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                  <span className="text-xl">{annual.bulletin.pourcentage >= 50 ? '✅' : '❌'}</span>
                  <div>
                    <div className="font-semibold">{annual.bulletin.decision}</div>
                    <div className="text-sm opacity-75">Total : {annual.bulletin.totalObtenu} / {annual.bulletin.totalMaximum} points</div>
                  </div>
                </div>

                {/* Tableau par matière S1 + S2 */}
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-violet-50 text-violet-800">
                      <tr>
                        <th className="p-3">Matière</th>
                        <th className="p-3 text-center">Coef.</th>
                        <th className="p-3 text-center border-l border-violet-100">Semestre 1<br /><span className="text-xs font-normal">(note / pts / max)</span></th>
                        <th className="p-3 text-center border-l border-violet-100">Semestre 2<br /><span className="text-xs font-normal">(note / pts / max)</span></th>
                        <th className="p-3 text-center border-l border-violet-200 bg-violet-100/50">Total annuel</th>
                        <th className="p-3 text-center bg-violet-100/50">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annual.bulletin.lignes.map((l, i) => (
                        <tr key={i} className={`border-t ${l.pourcentage < 50 ? 'bg-red-50/40' : ''}`}>
                          <td className="p-3 font-medium">{l.matiere}</td>
                          <td className="p-3 text-center text-slate-500">{l.coefficient}</td>
                          <td className="p-3 text-center border-l border-slate-100">
                            <span className="font-semibold">{l.noteS1}</span>
                            <span className="text-slate-400 text-xs"> ({l.pointsS1}/{l.maxS1})</span>
                          </td>
                          <td className="p-3 text-center border-l border-slate-100">
                            <span className="font-semibold">{l.noteS2}</span>
                            <span className="text-slate-400 text-xs"> ({l.pointsS2}/{l.maxS2})</span>
                          </td>
                          <td className="p-3 text-center border-l border-violet-100 bg-violet-50/30 font-semibold">
                            {l.totalAnnuel} <span className="text-slate-400 font-normal">/ {l.maxAnnuel}</span>
                          </td>
                          <td className={`p-3 text-center bg-violet-50/30 font-semibold ${l.pourcentage < 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {l.pourcentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-violet-100/60">
                      <tr className="border-t-2 border-violet-200">
                        <td className="p-3 font-bold" colSpan={4}>TOTAL ANNUEL</td>
                        <td className="p-3 text-center font-bold border-l border-violet-200">
                          {annual.bulletin.totalObtenu} <span className="text-slate-500 font-normal">/ {annual.bulletin.totalMaximum}</span>
                        </td>
                        <td className="p-3 text-center font-bold">{annual.bulletin.pourcentage}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Boutons impression/téléchargement */}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => annual.bulletin && printAnnualBulletin(annual.eleve, annual.classe, annual.option, annual.section, annual.annee, annual.bulletin)}
                    className="rounded-md border border-violet-600 px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50"
                  >
                    🖨️ Imprimer le bulletin annuel
                  </button>
                  <button
                    onClick={() => annual.bulletin && downloadAnnualPdf(annual.eleve, annual.classe, annual.option, annual.section, annual.annee, annual.bulletin)}
                    className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                  >
                    ⬇️ Télécharger PDF (paysage)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
