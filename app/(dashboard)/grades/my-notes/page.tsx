﻿'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Award,
  FileText,
  Printer,
  Download,
  Lock,
  Clock,
  AlertCircle,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Calendar,
  Sparkles,
  School,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Types

type Resultat = {
  libelle: string;
  type: string;
  periode: string;
  matiere: string;
  note: number;
  maximum: number;
  statut: string;
  estValide: boolean;
};
type LigneSem = {
  matiere: string;
  coefficient: number;
  note: number;
  noteBulletin: number;
  p1?: number;
  p2?: number;
  examen?: number;
};
type BulletinSem = {
  totalObtenu: number;
  totalMaximum: number;
  pourcentage: number;
  rang: number | null;
  decision: string | null;
  lignes: LigneSem[];
};
type SemestreView = {
  id: string;
  libelle: string;
  resultats: Resultat[];
  bulletin: BulletinSem | null;
};
type MyGrades = {
  eleve: {
    matricule: string;
    nom: string;
    postnom?: string | null;
    prenom: string;
  };
  classe: string;
  option: string;
  section: string;
  annee: string;
  semestres: SemestreView[];
};

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
  eleve: {
    matricule: string;
    nom: string;
    postnom?: string | null;
    prenom: string;
  };
  classe: string;
  option: string;
  section: string;
  annee: string;
  bulletin: BulletinAnnuel | null;
  published: boolean;
  readyForAnnual: boolean;
  missingInfo: string | null;
};

// Helpers

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function nomEleve(e: {
  nom: string;
  postnom?: string | null;
  prenom: string;
}): string {
  return `${e.nom} ${e.postnom ?? ''} ${e.prenom}`.trim();
}

const MENTION_COLOR: Record<string, string> = {
  'Grande Distinction': 'text-violet-700 bg-violet-50 border-violet-200',
  Distinction: 'text-blue-700 bg-blue-50 border-blue-200',
  Satisfaction: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Réussi: 'text-green-700 bg-green-50 border-green-200',
  'Non réussi': 'text-red-700 bg-red-50 border-red-200',
};

// Print / PDF semestres

function printBulletin(d: {
  semestre: string;
  annee: string;
  eleve: {
    matricule: string;
    nom: string;
    postnom?: string | null;
    prenom: string;
  };
  classe: string;
  option: string;
  section: string;
  bulletin: BulletinSem;
}) {
  const b = d.bulletin;
  const w = window.open('', '_blank', 'width=840,height=900');
  if (!w) return;
  const rows = b.lignes
    .map(
      (l) => `<tr>
    <td>${esc(l.matiere)}</td>
    <td class="c">${esc(l.coefficient)}</td>
    <td class="c">${l.p1 !== undefined ? esc(l.p1) : '—'}</td>
    <td class="c">${l.p2 !== undefined ? esc(l.p2) : '—'}</td>
    <td class="c">${l.examen !== undefined ? `<b>${esc(l.examen)}</b>` : '—'}</td>
    <td class="c">${esc(l.note)}</td>
    <td class="c font-bold">${esc(l.noteBulletin)}</td>
  </tr>`
    )
    .join('');
  w.document
    .write(`<!doctype html><html><head><meta charset="utf-8"><title>Bulletin ${esc(
    d.eleve.nom
  )}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px;margin:0}
    .head{display:flex;justify-content:space-between;gap:12px;border-bottom:2px solid #0f172a;padding-bottom:10px}
    h1{margin:0;font-size:20px;color:#4338ca}
    table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px}
    th,td{border:1px solid #334155;padding:5px;text-align:left}th{background:#f1f5f9}.c{text-align:center}.tot td{font-weight:bold}
    .meta{margin:12px 0;font-size:13px;line-height:1.6}.sig{margin-top:36px;font-size:11px;color:#475569}
    @page{margin:14mm}</style></head><body>
    <div class="head"><div><h1>Complexe Scolaire Sainte Famille</h1><div>Système Éducatif · EPSP (RDC)</div></div><div style="text-align:right"><b>Bulletin · ${esc(
      d.semestre
    )}</b><br>Année scolaire ${esc(d.annee)}</div></div>
    <p class="meta"><b>Élève :</b> ${esc(nomEleve(d.eleve))}<br><b>Matricule :</b> ${esc(
    d.eleve.matricule
  )}<br><b>Classe :</b> ${esc(d.classe)} · ${esc(d.option)} (${esc(
    d.section
  )})</p>
    <table><thead><tr><th>Matière</th><th class="c">Coef.</th><th class="c">P1 / 20</th><th class="c">P2 / 20</th><th class="c">Examen / 20</th><th class="c">Moy. / 20</th><th class="c">Total (Note × Coef)</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="tot"><td colspan="6">TOTAL SEMESTRIEL</td><td class="c">${esc(
      b.totalObtenu
    )} / ${esc(b.totalMaximum)}</td></tr></tfoot></table>
    <p class="meta">Pourcentage : <b>${esc(b.pourcentage)}%</b> · Rang : <b>${esc(
    b.rang
  )}</b> · Décision : <b>${esc(b.decision)}</b></p>
    <div class="sig">Fait le ${new Date().toLocaleDateString(
      'fr-FR'
    )} — Direction des Études Complexe Scolaire Sainte Famille</div>
    <script>window.onload = function(){ window.print(); }<\/script></body></html>`);
  w.document.close();
}

function downloadBulletinPdf(d: {
  semestre: string;
  annee: string;
  eleve: {
    matricule: string;
    nom: string;
    postnom?: string | null;
    prenom: string;
  };
  classe: string;
  option: string;
  section: string;
  bulletin: BulletinSem;
}) {
  const b = d.bulletin;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text('Complexe Scolaire Sainte Famille', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Système Éducatif · EPSP (RDC)', 14, 21);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Bulletin — ${d.semestre}`, 196, 16, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Année scolaire ${d.annee}`, 196, 21, { align: 'right' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(nomEleve(d.eleve), 14, 32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Matricule : ${d.eleve.matricule}`, 14, 38);
  doc.text(`Classe : ${d.classe} · ${d.option} (${d.section})`, 14, 43);
  autoTable(doc, {
    startY: 50,
    head: [
      [
        'Matière',
        'Coef.',
        'Période 1',
        'Période 2',
        'Examen',
        'Moyenne / 20',
        'Total (Note × Coef)',
      ],
    ],
    body: b.lignes.map((l) => [
      l.matiere,
      String(l.coefficient),
      l.p1 !== undefined ? String(l.p1) : '—',
      l.p2 !== undefined ? String(l.p2) : '—',
      l.examen !== undefined ? String(l.examen) : '—',
      String(l.note),
      String(l.noteBulletin),
    ]),
    foot: [
      [
        'TOTAL',
        '',
        '',
        '',
        '',
        '',
        `${b.totalObtenu} / ${b.totalMaximum}`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
    },
    styles: { fontSize: 9, cellPadding: 2.2 },
    footStyles: { fontStyle: 'bold' },
  });
  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 60;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Pourcentage : ${b.pourcentage}%    Rang : ${b.rang ?? '—'}    Décision : ${
      b.decision ?? '—'
    }`,
    14,
    finalY + 8
  );
  doc.save(
    `bulletin_${nomEleve(d.eleve).replace(/\s+/g, '_')}_${d.semestre}.pdf`
  );
}

//Print / PDF bulletin annuel

function printAnnualBulletin(
  eleve: {
    matricule: string;
    nom: string;
    postnom?: string | null;
    prenom: string;
  },
  classe: string,
  option: string,
  section: string,
  annee: string,
  b: BulletinAnnuel
) {
  const w = window.open('', '_blank', 'width=1000,height=1000');
  if (!w) return;
  const rows = b.lignes
    .map(
      (l) => `<tr>
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
    <td class="c ${l.pourcentage < 50 ? 'red' : 'green'}"><b>${esc(
        l.pourcentage
      )}%</b></td>
  </tr>`
    )
    .join('');
  w.document
    .write(`<!doctype html><html><head><meta charset="utf-8"><title>Bulletin Annuel Officiel - ${esc(
    eleve.nom
  )}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px;margin:0}
    .head{display:flex;justify-content:space-between;gap:12px;border-bottom:3px solid #4338ca;padding-bottom:10px;margin-bottom:14px}
    h1{margin:0;font-size:22px;color:#4338ca}
    table{width:100%;border-collapse:collapse;margin-top:14px;font-size:11px}
    th,td{border:1px solid #cbd5e1;padding:4px 6px;text-align:left}th{background:#f8fafc;font-weight:bold}.c{text-align:center}
    .tot td{font-weight:bold;background:#f1f5f9}.meta{margin:10px 0;font-size:13px;line-height:1.7}
    .info-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;margin:14px 0;font-size:13px;background:#f8fafc;padding:12px;border:1px solid #e2e8f0;border-radius:8px}
    .sig{margin-top:30px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between}
    .red{color:#dc2626}.green{color:#16a34a}
  </style></head><body>
    <div class="head">
      <div><h1>Complexe Scolaire Sainte Famille</h1><div>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO · EPSP</div></div>
      <div style="text-align:right"><b>BULLETIN SCOLAIRE ANNUEL</b><br>Année scolaire ${esc(
        annee
      )}</div>
    </div>
    <div class="meta">
      <b>Élève :</b> ${esc(nomEleve(eleve))} &nbsp;|&nbsp; <b>Matricule :</b> ${esc(
    eleve.matricule
  )} &nbsp;|&nbsp; <b>Classe :</b> ${esc(classe)} · ${esc(option)} (${esc(
    section
  )})
    </div>
    <table>
      <thead>
        <tr style="background:#4338ca;color:#fff">
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
      <div><b>Place / Rang :</b> ${
        b.rang ? `${esc(b.rang)} / ${esc(b.totalEleves)}` : '—'
      }</div>
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

function downloadAnnualPdf(
  eleve: {
    matricule: string;
    nom: string;
    postnom?: string | null;
    prenom: string;
  },
  classe: string,
  option: string,
  section: string,
  annee: string,
  b: BulletinAnnuel
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text('Complexe Scolaire Sainte Famille', 14, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO · EPSP / EPST', 14, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('BULLETIN SCOLAIRE ANNUEL', 280, 15, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Année scolaire ${annee}`, 280, 20, { align: 'right' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(nomEleve(eleve), 14, 29);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Matricule : ${eleve.matricule}   |   Classe : ${classe}   |   Option : ${option}   |   Section : ${section}`,
    14,
    34
  );

  autoTable(doc, {
    startY: 39,
    head: [
      [
        { content: 'Matière', rowSpan: 2 },
        { content: 'Coef', rowSpan: 2 },
        {
          content: 'PREMIER SEMESTRE',
          colSpan: 4,
          styles: { halign: 'center', fillColor: [67, 56, 202] },
        },
        {
          content: 'DEUXIÈME SEMESTRE',
          colSpan: 4,
          styles: { halign: 'center', fillColor: [67, 56, 202] },
        },
        {
          content: 'TOTAL ANNUEL',
          colSpan: 2,
          styles: { halign: 'center', fillColor: [49, 46, 129] },
        },
      ],
      [
        'P1',
        'P2',
        'Exam 1',
        'Total S1',
        'P3',
        'P4',
        'Exam 2',
        'Total S2',
        'Pts / Max',
        '%',
      ],
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
    foot: [
      [
        'TOTAL GÉNÉRAL ANNUEL',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        `${b.totalObtenu} / ${b.totalMaximum}`,
        `${b.pourcentage}%`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { fontSize: 8, cellPadding: 1.8, halign: 'center' },
    columnStyles: { 0: { halign: 'left', cellWidth: 50 } },
    footStyles: {
      fontStyle: 'bold',
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
    },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 60;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

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
    doc.setFont('helvetica', 'bold');
    doc.text(label, cx, finalY + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(value, cx + 33, finalY + 9);
    cx += 45;
  }

  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Fait à Kinshasa, le ${new Date().toLocaleDateString(
      'fr-FR'
    )} — Direction de Complexe Scolaire Sainte Famille`,
    14,
    finalY + 16
  );

  doc.save(
    `bulletin_annuel_${nomEleve(eleve).replace(/\s+/g, '_')}_${annee}.pdf`
  );
}

// Main Page

export default function MyNotesPage() {
  const [data, setData] = useState<MyGrades | null>(null);
  const [annual, setAnnual] = useState<MyAnnual | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<MyGrades>('/notes/my-grades'),
      api.get<MyAnnual>('/notes/my-annual-bulletin'),
    ])
      .then(([r1, r2]) => {
        setData(r1.data);
        setAnnual(r2.data);
      })
      .catch(() => setError('Impossible de charger vos résultats.'));
  }, []);

  const mentionColor = annual?.bulletin
    ? MENTION_COLOR[annual.bulletin.mention] ??
      'text-slate-700 bg-slate-50 border-slate-200'
    : '';

  return (
    <section className="space-y-8 animate-fade-in">
      {/*  Header  */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Award className="h-6 w-6 text-brand-600" />
            Mes Bulletins & Palmarès Scolaire
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {data
              ? `${nomEleve(data.eleve)} · ${data.classe} · ${data.option} (${data.section}) — Année ${data.annee}`
              : 'Consultation et téléchargement officiel de vos bulletins semestriels et annuels.'}
          </p>
        </div>
        <Badge variant="violet" className="self-start sm:self-auto font-mono">
          {data?.annee ?? '2026–2027'}
        </Badge>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            <span className="text-xs font-medium">Chargement de vos bulletins…</span>
          </div>
        </div>
      )}

      {/*  Bulletins semestriels  */}
      {data?.semestres.map((s) => {
        const validees = s.resultats.filter((r) => r.estValide);
        const bul = s.bulletin;
        const pdfData = bul
          ? {
              semestre: s.libelle,
              annee: data.annee,
              eleve: data.eleve,
              classe: data.classe,
              option: data.option,
              section: data.section,
              bulletin: bul,
            }
          : null;

        return (
          <div
            key={s.id}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-200/60">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">
                    {s.libelle}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Périodes & Session d&apos;Examens
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Semestre</Badge>
            </div>

            {validees.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Aucune note validée pour ce semestre.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-200 bg-slate-100/60 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="p-3.5">Matière & Épreuve</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Période</th>
                      <th className="p-3.5">Note Obtenue</th>
                      <th className="p-3.5 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validees.map((r, i) => {
                      const isExam =
                        r.periode === 'Examen' || r.type === 'Examen';
                      return (
                        <tr
                          key={i}
                          className={`transition-colors hover:bg-slate-50/60 ${
                            isExam ? 'bg-violet-50/30 font-medium' : ''
                          }`}
                        >
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800">
                              {r.matiere}
                            </span>
                            <span className="text-slate-400 ml-1.5">
                              · {r.libelle}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {isExam ? (
                              <Badge variant="violet" className="text-[10px]">
                                Examen
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-600 font-medium">
                                {r.type}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {isExam ? (
                              <span className="font-semibold text-violet-700 text-xs">
                                Session Officielle
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">
                                {r.periode}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">
                            {r.note} / {r.maximum}
                          </td>
                          <td className="p-3.5 text-right">
                            <Badge variant="success" className="text-[10px]">
                              <CheckCircle2 className="h-3 w-3" />
                              Validée
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom calculation strip */}
            <div className="border-t border-slate-100 p-5 bg-slate-50/70">
              {bul ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                    <span>
                      Pourcentage :{' '}
                      <strong className="text-brand-600 text-base font-bold">
                        {bul.pourcentage}%
                      </strong>
                    </span>
                    <span>
                      Rang : <strong>{bul.rang ?? '—'}</strong>
                    </span>
                    <span>
                      Décision :{' '}
                      <Badge
                        variant={
                          bul.pourcentage >= 50 ? 'success' : 'destructive'
                        }
                      >
                        {bul.decision ?? '—'}
                      </Badge>
                    </span>
                    <span>
                      Total :{' '}
                      <strong>
                        {bul.totalObtenu}/{bul.totalMaximum}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pdfData && printBulletin(pdfData)}
                      className="text-xs"
                    >
                      <Printer className="mr-1.5 h-3.5 w-3.5" />
                      Imprimer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => pdfData && downloadBulletinPdf(pdfData)}
                      className="text-xs"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Télécharger PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    Votre bulletin semestriel officiel sera généré dès que
                    toutes les notes du semestre auront été validées par
                    l'administration.
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Bulletin Annuel (EPSP Congo) */}
      {annual && (
        <div className="overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-soft-lg">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-950 p-6 text-white">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-brand-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                RÉPUBLIQUE DÉMOCRATIQUE DU CONGO · EPSP
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                Bulletin Scolaire Annuel Synthétique
              </h2>
              <p className="mt-0.5 text-xs text-slate-300">
                Consolidation générale Semestre 1 + Semestre 2 — Session{' '}
                {annual.annee}
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-sm block">{annual.classe}</span>
              <span className="text-brand-200">
                {annual.option} ({annual.section})
              </span>
            </div>
          </div>

          <div className="p-6">
            {!annual.readyForAnnual ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-amber-900 text-sm sm:text-base">
                      Bulletin Annuel en Cours de Consolidation
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                      Le bulletin annuel synthétique sera automatiquement
                      débloqué lorsque toutes les notes des semestres 1 et 2
                      auront été validées.
                    </p>
                    {annual.missingInfo && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-900 bg-amber-100/80 rounded-lg p-2.5 border border-amber-200/80">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
                        <span>{annual.missingInfo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Disabled buttons */}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button disabled variant="outline" size="sm">
                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                    Imprimer le bulletin annuel
                  </Button>
                  <Button disabled size="sm">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Télécharger PDF officiel (paysage)
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {annual.bulletin && (
                  <div className="space-y-5">
                    {/* Mention & Stats */}
                    <div className="flex flex-wrap items-start gap-4">
                      <div
                        className={`rounded-2xl border-2 px-6 py-4 text-center ${mentionColor}`}
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
                          Mention Finale
                        </div>
                        <div className="mt-1 text-xl font-bold">
                          {annual.bulletin.mention}
                        </div>
                      </div>

                      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          {
                            label: 'Pourcentage Annuel',
                            value: `${annual.bulletin.pourcentage}%`,
                          },
                          {
                            label: 'Rang Général',
                            value: annual.bulletin.rang
                              ? `${annual.bulletin.rang} / ${annual.bulletin.totalEleves}`
                              : '—',
                          },
                          {
                            label: 'Application',
                            value: annual.bulletin.application,
                          },
                          {
                            label: 'Conduite',
                            value: annual.bulletin.conduite,
                          },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-center"
                          >
                            <span className="text-[11px] text-slate-500 font-medium block">
                              {label}
                            </span>
                            <span className="mt-1 font-bold text-slate-800 text-sm block">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Decision Banner */}
                    <div
                      className={`flex items-center gap-3 rounded-xl border p-4 ${
                        annual.bulletin.pourcentage >= 50
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-rose-200 bg-rose-50 text-rose-900'
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-soft-sm">
                        {annual.bulletin.pourcentage >= 50 ? (
                          <GraduationCap className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm sm:text-base">
                          {annual.bulletin.decision}
                        </div>
                        <div className="text-xs opacity-80 mt-0.5">
                          Total général des points :{' '}
                          <strong>{annual.bulletin.totalObtenu}</strong> sur{' '}
                          <strong>{annual.bulletin.totalMaximum}</strong> (
                          {annual.bulletin.pourcentage}%)
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-brand-900 text-white text-center">
                            <th
                              rowSpan={2}
                              className="p-3 text-left border-r border-brand-800"
                            >
                              Branche / Matière
                            </th>
                            <th
                              rowSpan={2}
                              className="p-3 border-r border-brand-800"
                            >
                              Coef
                            </th>
                            <th
                              colSpan={4}
                              className="p-2.5 border-r border-brand-800 bg-brand-950 font-bold"
                            >
                              PREMIER SEMESTRE
                            </th>
                            <th
                              colSpan={4}
                              className="p-2.5 border-r border-brand-800 bg-brand-950 font-bold"
                            >
                              DEUXIÈME SEMESTRE
                            </th>
                            <th colSpan={2} className="p-2.5 bg-slate-900 font-bold">
                              TOTAL ANNUEL
                            </th>
                          </tr>
                          <tr className="bg-brand-50 text-brand-900 text-center font-semibold text-xs border-t border-brand-200">
                            <th className="p-2">P1</th>
                            <th className="p-2">P2</th>
                            <th className="p-2 bg-brand-100 font-bold">Exam</th>
                            <th className="p-2 border-r border-brand-200 font-bold">
                              Total S1
                            </th>
                            <th className="p-2">P3</th>
                            <th className="p-2">P4</th>
                            <th className="p-2 bg-brand-100 font-bold">Exam</th>
                            <th className="p-2 border-r border-brand-200 font-bold">
                              Total S2
                            </th>
                            <th className="p-2 bg-brand-100">Pts / Max</th>
                            <th className="p-2 bg-brand-100">% Annuel</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {annual.bulletin.lignes.map((l, i) => (
                            <tr
                              key={i}
                              className={`text-center transition-colors hover:bg-slate-50/60 ${
                                l.pourcentage < 50 ? 'bg-rose-50/30' : ''
                              }`}
                            >
                              <td className="p-2.5 text-left font-medium border-r border-slate-100 text-slate-800">
                                {l.matiere}
                              </td>
                              <td className="p-2.5 text-slate-500 border-r border-slate-100 font-mono">
                                {l.coefficient}
                              </td>
                              <td className="p-2">{l.p1 ?? '—'}</td>
                              <td className="p-2">{l.p2 ?? '—'}</td>
                              <td className="p-2 bg-brand-50/40 font-semibold text-brand-900">
                                {l.examS1 ?? '—'}
                              </td>
                              <td className="p-2 border-r border-slate-200 font-semibold text-slate-800">
                                {l.pointsS1}{' '}
                                <span className="text-slate-400 font-normal text-[11px]">
                                  /{l.maxS1}
                                </span>
                              </td>
                              <td className="p-2">{l.p3 ?? '—'}</td>
                              <td className="p-2">{l.p4 ?? '—'}</td>
                              <td className="p-2 bg-brand-50/40 font-semibold text-brand-900">
                                {l.examS2 ?? '—'}
                              </td>
                              <td className="p-2 border-r border-slate-200 font-semibold text-slate-800">
                                {l.pointsS2}{' '}
                                <span className="text-slate-400 font-normal text-[11px]">
                                  /{l.maxS2}
                                </span>
                              </td>
                              <td className="p-2 bg-brand-50/20 font-bold text-slate-900">
                                {l.totalAnnuel}{' '}
                                <span className="text-slate-400 font-normal text-[11px]">
                                  /{l.maxAnnuel}
                                </span>
                              </td>
                              <td
                                className={`p-2 bg-brand-50/20 font-bold ${
                                  l.pourcentage < 50
                                    ? 'text-rose-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {l.pourcentage}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-brand-50/80 text-center font-bold">
                          <tr className="border-t-2 border-brand-300">
                            <td className="p-3 text-left font-bold" colSpan={2}>
                              TOTAL GÉNÉRAL ANNUEL
                            </td>
                            <td
                              colSpan={4}
                              className="p-3 border-r border-brand-200 text-xs text-slate-600"
                            >
                              Total S1 consolidé
                            </td>
                            <td
                              colSpan={4}
                              className="p-3 border-r border-brand-200 text-xs text-slate-600"
                            >
                              Total S2 consolidé
                            </td>
                            <td className="p-3 text-slate-900 font-extrabold">
                              {annual.bulletin.totalObtenu}{' '}
                              <span className="text-slate-500 font-normal text-xs">
                                /{annual.bulletin.totalMaximum}
                              </span>
                            </td>
                            <td className="p-3 text-brand-900 text-base font-extrabold">
                              {annual.bulletin.pourcentage}%
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          annual.bulletin &&
                          printAnnualBulletin(
                            annual.eleve,
                            annual.classe,
                            annual.option,
                            annual.section,
                            annual.annee,
                            annual.bulletin
                          )
                        }
                      >
                        <Printer className="mr-1.5 h-4 w-4" />
                        Imprimer le bulletin annuel
                      </Button>
                      <Button
                        onClick={() =>
                          annual.bulletin &&
                          downloadAnnualPdf(
                            annual.eleve,
                            annual.classe,
                            annual.option,
                            annual.section,
                            annual.annee,
                            annual.bulletin
                          )
                        }
                      >
                        <Download className="mr-1.5 h-4 w-4" />
                        Télécharger PDF officiel (paysage)
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

