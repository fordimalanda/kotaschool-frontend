'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ───────────────────────────────────────────────────────────────────

type Resultat = { libelle: string; type: string; periode: string; matiere: string; note: number; maximum: number; statut: string; estValide: boolean };
type LigneSem = { matiere: string; coefficient: number; note: number; noteBulletin: number; p1?: number; p2?: number; examen?: number };
type BulletinSem = { totalObtenu: number; totalMaximum: number; pourcentage: number; rang: number | null; decision: string | null; lignes: LigneSem[] };
type SemestreView = { id: string; libelle: string; resultats: Resultat[]; bulletin: BulletinSem | null };
type MyGrades = { eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }; classe: string; option: string; section: string; annee: string; semestres: SemestreView[] };

type LigneAnnuelle = {
  matiere: string;
  coefficient: number;
  p1?: number;
  p2?: number;
  examS1?: number;
  noteS1: number;
  pointsS1: number;
  maxS1: number;
  p3?: number;
  p4?: number;
  examS2?: number;
  noteS2: number;
  pointsS2: number;
  maxS2: number;
  totalAnnuel: number;
  maxAnnuel: number;
  pourcentage: number;
};

type BulletinAnnuel = {
  totalObtenu: number;
  totalMaximum: number;
  pourcentage: number;
  rang?: number;
  totalEleves: number;
  mention: string;
  decision: string;
  application: string;
  conduite: string;
  lignes: LigneAnnuelle[];
};

type MyAnnual = {
  eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string };
  classe: string;
  option: string;
  section: string;
  annee: string;
  bulletin: BulletinAnnuel | null;
  published: boolean;
  readyForAnnual: boolean;
  missingInfo: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUT_STYLE: Record<string, string> = {
  VALIDEE: 'bg-emerald-100 text-emerald-700',
  SOUMISE: 'bg-blue-100 text-blue-700',
  BROUILLON: 'bg-amber-100 text-amber-700',
};

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
  const w = window.open('', '_blank', 'width=840,height=900');
  if (!w) return;
  const rows = b.lignes.map((l) => `<tr>
    <td>${esc(l.matiere)}</td>
    <td class="c">${esc(l.coefficient)}</td>
    <td class="c">${l.p1 !== undefined ? esc(l.p1) : '—'}</td>
    <td class="c">${l.p2 !== undefined ? esc(l.p2) : '—'}</td>
    <td class="c">${l.examen !== undefined ? `<b>${esc(l.examen)}</b>` : '—'}</td>
    <td class="c">${esc(l.note)}</td>
    <td class="c"><b>${esc(l.noteBulletin)}</b></td>
  </tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Bulletin ${esc(d.eleve.nom)}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px;margin:0}
    .head{display:flex;justify-content:space-between;gap:12px;border-bottom:2px solid #0f172a;padding-bottom:10px}
    h1{margin:0;font-size:20px;color:#7c3aed}
    table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px}
    th,td{border:1px solid #334155;padding:5px;text-align:left}th{background:#f1f5f9}.c{text-align:center}.tot td{font-weight:bold}
    .meta{margin:12px 0;font-size:13px;line-height:1.6}.sig{margin-top:36px;font-size:11px;color:#475569}
    @page{margin:14mm}</style></head><body>
    <div class="head"><div><h1>Kotaschool</h1><div>Système éducatif · EPSP (RDC)</div></div><div style="text-align:right"><b>Bulletin · ${esc(d.semestre)}</b><br>Année scolaire ${esc(d.annee)}</div></div>
    <p class="meta"><b>Élève :</b> ${esc(nomEleve(d.eleve))}<br><b>Matricule :</b> ${esc(d.eleve.matricule)}<br><b>Classe :</b> ${esc(d.classe)} · ${esc(d.option)} (${esc(d.section)})</p>
    <table><thead><tr><th>Matière</th><th class="c">Coef.</th><th class="c">P1 / 20</th><th class="c">P2 / 20</th><th class="c">Examen / 20</th><th class="c">Moy. / 20</th><th class="c">Total (Note × Coef)</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="tot"><td colspan="6">TOTAL SEMESTRIEL</td><td class="c">${esc(b.totalObtenu)} / ${esc(b.totalMaximum)}</td></tr></tfoot></table>
    <p class="meta">Pourcentage : <b>${esc(b.pourcentage)}%</b> · Rang : <b>${esc(b.rang)}</b> · Décision : <b>${esc(b.decision)}</b></p>
    <div class="sig">Fait le ${new Date().toLocaleDateString('fr-FR')} — Direction des Études Kotaschool</div>
    <script>window.onload = function(){ window.print(); }<\/script></body></html>`);
  w.document.close();
}

function downloadBulletinPdf(d: { semestre: string; annee: string; eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }; classe: string; option: string; section: string; bulletin: BulletinSem }) {
  const b = d.bulletin;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFontSize(17); doc.setFont('helvetica', 'bold'); doc.setTextColor(124, 58, 237); doc.text('Kotaschool', 14, 16);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80); doc.text('Système éducatif · EPSP (RDC)', 14, 21);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42); doc.text(`Bulletin — ${d.semestre}`, 196, 16, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80); doc.text(`Année scolaire ${d.annee}`, 196, 21, { align: 'right' });
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42); doc.text(nomEleve(d.eleve), 14, 32);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Matricule : ${d.eleve.matricule}`, 14, 38);
  doc.text(`Classe : ${d.classe} · ${d.option} (${d.section})`, 14, 43);
  autoTable(doc, {
    startY: 50,
    head: [['Matière', 'Coef.', 'Période 1', 'Période 2', 'Examen', 'Moyenne / 20', 'Total (Note × Coef)']],
    body: b.lignes.map((l) => [
      l.matiere,
      String(l.coefficient),
      l.p1 !== undefined ? String(l.p1) : '—',
      l.p2 !== undefined ? String(l.p2) : '—',
      l.examen !== undefined ? String(l.examen) : '—',
      String(l.note),
      String(l.noteBulletin)
    ]),
    foot: [['TOTAL', '', '', '', '', '', `${b.totalObtenu} / ${b.totalMaximum}`]],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.2 },
    footStyles: { fontStyle: 'bold' },
  });
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text(`Pourcentage : ${b.pourcentage}%    Rang : ${b.rang ?? '—'}    Décision : ${b.decision ?? '—'}`, 14, finalY + 8);
  doc.save(`bulletin_${nomEleve(d.eleve).replace(/\s+/g, '_')}_${d.semestre}.pdf`);
}

// ─── Print / PDF bulletin annuel ─────────────────────────────────────────────

function printAnnualBulletin(eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }, classe: string, option: string, section: string, annee: string, b: BulletinAnnuel) {
  const w = window.open('', '_blank', 'width=1000,height=1000');
  if (!w) return;
  const rows = b.lignes.map((l) => `<tr>
    <td>${esc(l.matiere)}</td>
    <td class="c">${esc(l.coefficient)}</td>
    <td class="c">${l.p1 ?? '—'}</td>
    <td class="c">${l.p2 ?? '—'}</td>
    <td class="c"><b>${l.examS1 ?? '—'}</b></td>
    <td class="c">${esc(l.pointsS1)} <small>/${esc(l.maxS1)}</small></td>
    <td class="c">${l.p3 ?? '—'}</td>
    <td class="c">${l.p4 ?? '—'}</td>
    <td class="c"><b>${l.examS2 ?? '—'}</b></td>
    <td class="c">${esc(l.pointsS2)} <small>/${esc(l.maxS2)}</small></td>
    <td class="c"><b>${esc(l.totalAnnuel)} / ${esc(l.maxAnnuel)}</b></td>
    <td class="c ${l.pourcentage < 50 ? 'red' : 'green'}"><b>${esc(l.pourcentage)}%</b></td>
  </tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Bulletin Annuel Officiel - ${esc(eleve.nom)}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px;margin:0}
    .head{display:flex;justify-content:space-between;gap:12px;border-bottom:3px solid #7c3aed;padding-bottom:10px;margin-bottom:14px}
    h1{margin:0;font-size:22px;color:#7c3aed}
    table{width:100%;border-collapse:collapse;margin-top:14px;font-size:11px}
    th,td{border:1px solid #cbd5e1;padding:4px 6px;text-align:left}th{background:#f8fafc;font-weight:bold}.c{text-align:center}
    .tot td{font-weight:bold;background:#f1f5f9}.meta{margin:10px 0;font-size:13px;line-height:1.7}
    .info-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;margin:14px 0;font-size:13px;background:#f8fafc;padding:12px;border:1px solid #e2e8f0;border-radius:8px}
    .sig{margin-top:30px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between}
    .red{color:#dc2626}.green{color:#16a34a}
    @page{margin:10mm}</style></head><body>
    <div class="head">
      <div>
        <div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:#475569">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</div>
        <div style="font-size:10px;color:#64748b">MINISTÈRE DE L'ÉDUCATION NATIONALE ET NOUVELLE CITOYENNETÉ · EPSP</div>
        <h1 style="margin-top:4px">Kotaschool</h1>
      </div>
      <div style="text-align:right">
        <b style="font-size:16px;color:#7c3aed">BULLETIN SCOLAIRE ANNUEL</b><br>
        <span style="font-size:12px;font-weight:bold">Année scolaire ${esc(annee)}</span>
      </div>
    </div>
    <p class="meta">
      <b>Élève :</b> ${esc(nomEleve(eleve))} &nbsp;|&nbsp; <b>Matricule :</b> ${esc(eleve.matricule)}<br>
      <b>Classe :</b> ${esc(classe)} &nbsp;|&nbsp; <b>Option :</b> ${esc(option)} &nbsp;|&nbsp; <b>Section :</b> ${esc(section)}
    </p>
    <table>
      <thead>
        <tr style="background:#ede9fe;color:#5b21b6">
          <th rowspan="2">Branche / Matière</th>
          <th rowspan="2" class="c">Coef</th>
          <th colspan="4" class="c">PREMIER SEMESTRE</th>
          <th colspan="4" class="c">DEUXIÈME SEMESTRE</th>
          <th colspan="2" class="c">TOTAL GÉNÉRAL</th>
        </tr>
        <tr>
          <th class="c">P1</th><th class="c">P2</th><th class="c">Exam 1</th><th class="c">Total S1</th>
          <th class="c">P3</th><th class="c">P4</th><th class="c">Exam 2</th><th class="c">Total S2</th>
          <th class="c">Pts / Max</th><th class="c">% Annuel</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="tot">
        <td colspan="10">TOTAL GÉNÉRAL ANNUEL</td>
        <td class="c">${esc(b.totalObtenu)} / ${esc(b.totalMaximum)}</td>
        <td class="c">${esc(b.pourcentage)}%</td>
      </tr></tfoot>
    </table>
    <div class="info-grid">
      <div><b>Pourcentage annuel :</b> ${esc(b.pourcentage)}%</div>
      <div><b>Place / Rang :</b> ${b.rang ? `${esc(b.rang)} / ${esc(b.totalEleves)}` : '—'}</div>
      <div><b>Degré de satisfaction :</b> <u>${esc(b.mention)}</u></div>
      <div><b>Décision du jury :</b> <strong>${esc(b.decision)}</strong></div>
      <div><b>Application :</b> ${esc(b.application)}</div>
      <div><b>Conduite :</b> ${esc(b.conduite)}</div>
    </div>
    <div class="sig">
      <div>Sceau de l'établissement</div>
      <div>Le Préfet des Études</div>
      <div>Fait le ${new Date().toLocaleDateString('fr-FR')}</div>
    </div>
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`);
  w.document.close();
}

function downloadAnnualPdf(eleve: { matricule: string; nom: string; postnom?: string | null; prenom: string }, classe: string, option: string, section: string, annee: string, b: BulletinAnnuel) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

  // Header
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(124, 58, 237);
  doc.text('Kotaschool', 14, 15);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO · EPSP / EPST", 14, 20);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
  doc.text('BULLETIN SCOLAIRE ANNUEL', 280, 15, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text(`Année scolaire ${annee}`, 280, 20, { align: 'right' });

  // Élève info
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
  doc.text(nomEleve(eleve), 14, 29);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`Matricule : ${eleve.matricule}   |   Classe : ${classe}   |   Option : ${option}   |   Section : ${section}`, 14, 34);

  autoTable(doc, {
    startY: 39,
    head: [
      [
        { content: 'Matière', rowSpan: 2 },
        { content: 'Coef', rowSpan: 2 },
        { content: 'PREMIER SEMESTRE', colSpan: 4, styles: { halign: 'center', fillColor: [109, 40, 217] } },
        { content: 'DEUXIÈME SEMESTRE', colSpan: 4, styles: { halign: 'center', fillColor: [109, 40, 217] } },
        { content: 'TOTAL ANNUEL', colSpan: 2, styles: { halign: 'center', fillColor: [91, 33, 182] } },
      ],
      ['P1', 'P2', 'Exam 1', 'Total S1', 'P3', 'P4', 'Exam 2', 'Total S2', 'Pts / Max', '%'],
    ],
    body: b.lignes.map((l) => [
      l.matiere,
      String(l.coefficient),
      l.p1 !== undefined ? String(l.p1) : '—',
      l.p2 !== undefined ? String(l.p2) : '—',
      l.examS1 !== undefined ? String(l.examS1) : '—',
      `${l.pointsS1}/${l.maxS1}`,
      l.p3 !== undefined ? String(l.p3) : '—',
      l.p4 !== undefined ? String(l.p4) : '—',
      l.examS2 !== undefined ? String(l.examS2) : '—',
      `${l.pointsS2}/${l.maxS2}`,
      `${l.totalAnnuel} / ${l.maxAnnuel}`,
      `${l.pourcentage}%`,
    ]),
    foot: [['TOTAL GÉNÉRAL ANNUEL', '', '', '', '', '', '', '', '', '', `${b.totalObtenu} / ${b.totalMaximum}`, `${b.pourcentage}%`]],
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 1.8, halign: 'center' },
    columnStyles: { 0: { halign: 'left', cellWidth: 50 } },
    footStyles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);

  const summaryItems = [
    ['Pourcentage annuel :', `${b.pourcentage}%`],
    ['Place / Rang :', b.rang ? `${b.rang} / ${b.totalEleves}` : '—'],
    ['Degré de satisfaction :', b.mention],
    ['Décision du jury :', b.decision],
    ['Application :', b.application],
    ['Conduite :', b.conduite],
  ];

  let cx = 14;
  for (const [label, value] of summaryItems) {
    doc.setFont('helvetica', 'bold'); doc.text(label, cx, finalY + 9);
    doc.setFont('helvetica', 'normal'); doc.text(value, cx + 33, finalY + 9);
    cx += 45;
  }

  doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
  doc.text(`Fait à Kinshasa, le ${new Date().toLocaleDateString('fr-FR')} — Direction de Kotaschool`, 14, finalY + 16);

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
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">{s.libelle}</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                Périodes & Session d'Examens
              </span>
            </div>

            {validees.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune note validée pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-2.5">Matière</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Période / Examen</th>
                      <th className="p-2.5">Note obtenue</th>
                      <th className="p-2.5">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validees.map((r, i) => {
                      const isExam = r.periode === 'Examen' || r.type === 'Examen';
                      return (
                        <tr key={i} className={`border-t ${isExam ? 'bg-purple-50/50 font-medium' : ''}`}>
                          <td className="p-2.5">
                            {r.matiere} — <span className="text-slate-500">{r.libelle}</span>
                          </td>
                          <td className="p-2.5">
                            {isExam ? (
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                                Examen
                              </span>
                            ) : (
                              r.type
                            )}
                          </td>
                          <td className="p-2.5">
                            {isExam ? (
                              <span className="font-semibold text-violet-800">Session d'Examen</span>
                            ) : (
                              r.periode
                            )}
                          </td>
                          <td className="p-2.5 font-semibold">
                            <span className={isExam ? 'text-violet-700 font-bold' : ''}>
                              {r.note} / {r.maximum}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_STYLE[r.statut] ?? 'bg-slate-100 text-slate-600'}`}>
                              {r.statut}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button onClick={() => pdfData && printBulletin(pdfData)} className="rounded-md border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50">
                      🖨️ Imprimer le bulletin
                    </button>
                    <button onClick={() => pdfData && downloadBulletinPdf(pdfData)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                      ⬇️ Télécharger le bulletin (PDF)
                    </button>
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
              <div className="text-xs uppercase tracking-wider text-violet-200 font-semibold">
                RÉPUBLIQUE DÉMOCRATIQUE DU CONGO · EPSP
              </div>
              <h2 className="text-xl font-bold tracking-wide mt-0.5">
                📋 Bulletin Scolaire Annuel
              </h2>
              <p className="mt-0.5 text-xs text-violet-200">
                Synthèse Périodes + Examens (S1 & S2) — Année scolaire {annual.annee}
              </p>
            </div>
            <div className="text-right text-sm">
              <div className="font-bold">{annual.classe}</div>
              <div className="text-violet-200 text-xs">{annual.option} ({annual.section})</div>
            </div>
          </div>

          <div className="p-6">
            {!annual.readyForAnnual ? (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50/60 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 text-base">Bulletin Scolaire Annuel — En cours de constitution</h3>
                    <p className="mt-1 text-sm text-amber-800">
                      Le bulletin annuel ne peut être généré que lorsque <strong>toutes</strong> les notes des deux semestres ont été saisies et validées pour chaque cours.
                    </p>
                    {annual.missingInfo && (
                      <p className="mt-2 text-xs text-amber-700 bg-amber-100 rounded-md px-3 py-2 border border-amber-200">
                        ℹ️ {annual.missingInfo}
                      </p>
                    )}
                  </div>
                </div>
                {/* Boutons désactivés avec indication */}
                <div className="mt-5 flex flex-wrap gap-3">
                  <div className="relative group">
                    <button
                      disabled
                      className="cursor-not-allowed rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 opacity-60"
                    >
                      🖨️ Imprimer le bulletin annuel
                    </button>
                    <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden w-64 rounded-md bg-slate-800 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      Disponible quand toutes les notes des S1 et S2 sont complètes.
                    </div>
                  </div>
                  <div className="relative group">
                    <button
                      disabled
                      className="cursor-not-allowed rounded-md bg-slate-300 px-4 py-2 text-sm font-medium text-slate-500 opacity-60"
                    >
                      ⬇️ Télécharger PDF officiel (paysage)
                    </button>
                    <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden w-64 rounded-md bg-slate-800 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      Disponible quand toutes les notes des S1 et S2 sont complètes.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Mention badge + stats */}
                <div className="mb-5 flex flex-wrap items-start gap-4">
                  <div className={`rounded-xl border-2 px-6 py-3 text-center ${mentionColor}`}>
                    <div className="text-xs font-medium uppercase tracking-wide opacity-70">Degré de satisfaction</div>
                    <div className="mt-0.5 text-xl font-bold">{annual.bulletin.mention}</div>
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Pourcentage Annuel', value: `${annual.bulletin.pourcentage}%` },
                      { label: 'Place / Rang', value: annual.bulletin.rang ? `${annual.bulletin.rang} / ${annual.bulletin.totalEleves}` : '—' },
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
                  <span className="text-2xl">{annual.bulletin.pourcentage >= 50 ? '🎓' : '⚠️'}</span>
                  <div>
                    <div className="font-bold text-base">{annual.bulletin.decision}</div>
                    <div className="text-xs opacity-75">
                      Total général des points : <strong>{annual.bulletin.totalObtenu}</strong> sur <strong>{annual.bulletin.totalMaximum}</strong> ({annual.bulletin.pourcentage}%)
                    </div>
                  </div>
                </div>

                {/* Tableau officiel complet congolais : P1, P2, Examen S1, P3, P4, Examen S2 */}
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-violet-700 text-white text-center">
                        <th rowSpan={2} className="p-2.5 text-left border-r border-violet-600">Branche / Matière</th>
                        <th rowSpan={2} className="p-2.5 border-r border-violet-600">Coef</th>
                        <th colSpan={4} className="p-2 border-r border-violet-600 bg-violet-800 font-bold">
                          PREMIER SEMESTRE
                        </th>
                        <th colSpan={4} className="p-2 border-r border-violet-600 bg-violet-800 font-bold">
                          DEUXIÈME SEMESTRE
                        </th>
                        <th colSpan={2} className="p-2 bg-violet-900 font-bold">
                          TOTAL ANNUEL
                        </th>
                      </tr>
                      <tr className="bg-violet-100 text-violet-900 text-center font-semibold text-xs">
                        <th className="p-2">P1</th>
                        <th className="p-2">P2</th>
                        <th className="p-2 bg-violet-200/70 font-bold text-violet-950">Examen</th>
                        <th className="p-2 border-r border-violet-200 font-bold">Total S1</th>
                        <th className="p-2">P3</th>
                        <th className="p-2">P4</th>
                        <th className="p-2 bg-violet-200/70 font-bold text-violet-950">Examen</th>
                        <th className="p-2 border-r border-violet-200 font-bold">Total S2</th>
                        <th className="p-2 bg-violet-200/50">Pts / Max</th>
                        <th className="p-2 bg-violet-200/50">% Annuel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annual.bulletin.lignes.map((l, i) => (
                        <tr key={i} className={`border-t text-center ${l.pourcentage < 50 ? 'bg-red-50/40' : ''}`}>
                          <td className="p-2.5 text-left font-medium border-r border-slate-100">{l.matiere}</td>
                          <td className="p-2.5 text-slate-500 border-r border-slate-100">{l.coefficient}</td>
                          {/* S1 */}
                          <td className="p-2">{l.p1 !== undefined ? l.p1 : '—'}</td>
                          <td className="p-2">{l.p2 !== undefined ? l.p2 : '—'}</td>
                          <td className="p-2 bg-violet-50/60 font-semibold text-violet-900">{l.examS1 !== undefined ? l.examS1 : '—'}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">
                            {l.pointsS1} <span className="text-slate-400 font-normal text-xs">/{l.maxS1}</span>
                          </td>
                          {/* S2 */}
                          <td className="p-2">{l.p3 !== undefined ? l.p3 : '—'}</td>
                          <td className="p-2">{l.p4 !== undefined ? l.p4 : '—'}</td>
                          <td className="p-2 bg-violet-50/60 font-semibold text-violet-900">{l.examS2 !== undefined ? l.examS2 : '—'}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">
                            {l.pointsS2} <span className="text-slate-400 font-normal text-xs">/{l.maxS2}</span>
                          </td>
                          {/* Total annuel */}
                          <td className="p-2 bg-violet-50/30 font-bold text-slate-800">
                            {l.totalAnnuel} <span className="text-slate-400 font-normal text-xs">/{l.maxAnnuel}</span>
                          </td>
                          <td className={`p-2 bg-violet-50/30 font-bold ${l.pourcentage < 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {l.pourcentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-violet-100/70 text-center font-bold">
                      <tr className="border-t-2 border-violet-300">
                        <td className="p-3 text-left font-bold" colSpan={2}>TOTAL GÉNÉRAL ANNUEL</td>
                        <td colSpan={4} className="p-3 border-r border-violet-200 text-xs text-slate-600">
                          Total S1 consolidé
                        </td>
                        <td colSpan={4} className="p-3 border-r border-violet-200 text-xs text-slate-600">
                          Total S2 consolidé
                        </td>
                        <td className="p-3 text-slate-900">
                          {annual.bulletin.totalObtenu} <span className="text-slate-500 font-normal text-xs">/{annual.bulletin.totalMaximum}</span>
                        </td>
                        <td className="p-3 text-violet-900 text-base">{annual.bulletin.pourcentage}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Boutons impression/téléchargement — actifs car readyForAnnual */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => annual.bulletin && printAnnualBulletin(annual.eleve, annual.classe, annual.option, annual.section, annual.annee, annual.bulletin)}
                    className="rounded-md border border-violet-600 px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                  >
                    🖨️ Imprimer le bulletin annuel
                  </button>
                  <button
                    onClick={() => annual.bulletin && downloadAnnualPdf(annual.eleve, annual.classe, annual.option, annual.section, annual.annee, annual.bulletin)}
                    className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                  >
                    ⬇️ Télécharger PDF officiel (paysage)
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
