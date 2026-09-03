'use client';

import { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Award,
  Sparkles,
  RotateCw,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  School,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';

type Semestre = { id: string; libelle: string; annee: { libelle: string } };
type BoardRow = {
  inscriptionId: string;
  matricule: string;
  nom: string;
  classe: string;
  totalObtenu: number;
  totalMaximum: number;
  pourcentage: number;
  rang: number | null;
  decision: string | null;
};
type Ligne = {
  matiere: string;
  coefficient: number;
  note: number;
  noteBulletin: number;
};
type Detail = {
  semestre: { libelle: string; annee: string };
  eleve: {
    matricule: string;
    nom: string;
    postnom?: string | null;
    prenom: string;
    classe: string;
    option: string;
    section: string;
  };
  lignes: Ligne[];
  totalObtenu: number;
  totalMaximum: number;
  pourcentage: number;
  rang: number | null;
  decision: string | null;
};

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function printBulletin(d: Detail) {
  const w = window.open('', '_blank', 'width=840,height=920');
  if (!w) return;

  const rows = d.lignes
    .map(
      (l) =>
        `<tr><td>${esc(l.matiere)}</td><td class="c">${esc(l.coefficient)}</td><td class="c">${esc(l.note)}</td><td class="c bold">${esc(l.noteBulletin)}</td></tr>`
    )
    .join('');

  const pct = Number(d.pourcentage);
  const mention = pct >= 80 ? 'Grande Distinction' : pct >= 70 ? 'Distinction' : pct >= 60 ? 'Satisfaction' : pct >= 50 ? 'Réussi' : 'Non Réussi';
  const mentionColor = pct >= 50 ? '#16a34a' : '#dc2626';

  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Bulletin — ${esc(d.eleve.nom)} ${esc(d.eleve.prenom)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;background:#fff}
  .page{width:210mm;min-height:297mm;margin:0 auto;padding:0}

  .header{background:#1e3a8a;color:#fff;display:flex;justify-content:space-between;align-items:center;padding:14px 20px}
  .school-name{font-size:24px;font-weight:800;letter-spacing:-0.5px}
  .school-sub{font-size:10px;color:#bae6fd;margin-top:2px}
  .doc-badge{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:4px;padding:4px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:right}
  .doc-sem{font-size:10px;color:#bae6fd;margin-top:4px;text-align:right}

  .accent-bar{background:linear-gradient(90deg,#1e3a8a,#3b82f6);height:3px}

  .body{padding:16px 20px}

  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;margin-bottom:14px}
  .info-item{font-size:11.5px;color:#475569}
  .info-item span{font-weight:700;color:#0f172a}

  .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#1e3a8a;margin-bottom:5px}

  table{width:100%;border-collapse:collapse;font-size:12px}
  thead tr{background:#1e3a8a;color:#fff}
  thead th{padding:7px 10px;text-align:left;font-weight:600;font-size:10.5px}
  thead th.c{text-align:center}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:6px 10px;border-bottom:1px solid #e2e8f0}
  tbody td.c{text-align:center}
  tbody td.bold{text-align:center;font-weight:700;color:#1e3a8a}
  tfoot td{padding:7px 10px;font-weight:700;font-size:12px;background:#e0e7ff;border-top:2px solid #1e3a8a;color:#1e3a8a}
  tfoot td.c{text-align:center}

  .result-box{display:flex;justify-content:space-between;align-items:center;margin-top:12px;background:#f0f9ff;border:1px solid #bae6fd;border-left:4px solid #0284c7;border-radius:6px;padding:10px 14px}
  .r-item{text-align:center;flex:1}
  .r-lbl{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:2px}
  .r-val{font-size:17px;font-weight:800;color:#0f172a;line-height:1}
  .r-val.mention{font-size:14px;color:${mentionColor};border:2px solid ${mentionColor};border-radius:5px;padding:3px 10px;display:inline-block}

  .divider{width:1px;height:36px;background:#bae6fd;margin:0 4px}

  .sig{display:flex;justify-content:space-between;margin-top:30px;gap:12px}
  .sig-block{flex:1;text-align:center}
  .sig-line{border-top:1px solid #94a3b8;margin:24px auto 5px;width:75%}
  .sig-label{font-size:9px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.4px}

  .footer{display:flex;justify-content:space-between;margin-top:18px;border-top:1px solid #e2e8f0;padding-top:6px;font-size:9px;color:#94a3b8}

  @page{size:A4;margin:0}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="page">
  <div class="header">
    <div>
      <div class="school-name">Kotaschool</div>
      <div class="school-sub">Système Éducatif · EPSP — République Démocratique du Congo</div>
    </div>
    <div>
      <div class="doc-badge">Bulletin Officiel</div>
      <div class="doc-sem">${esc(d.semestre.libelle)} &nbsp;·&nbsp; Année ${esc(d.semestre.annee)}</div>
    </div>
  </div>
  <div class="accent-bar"></div>

  <div class="body">
    <div class="info-grid">
      <div class="info-item">Nom complet : <span>${esc(d.eleve.nom)} ${esc(d.eleve.postnom ?? '')} ${esc(d.eleve.prenom)}</span></div>
      <div class="info-item">Classe : <span>${esc(d.eleve.classe)}</span></div>
      <div class="info-item">Matricule : <span>${esc(d.eleve.matricule)}</span></div>
      <div class="info-item">Option : <span>${esc(d.eleve.option)} (${esc(d.eleve.section)})</span></div>
    </div>

    <div class="section-label">Résultats par Matière</div>
    <table>
      <thead><tr><th>Matière</th><th class="c">Coef.</th><th class="c">Note / 20</th><th class="c">Note × Coef.</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td><b>TOTAL GÉNÉRAL</b></td><td class="c">—</td><td class="c">—</td><td class="c">${esc(d.totalObtenu)} / ${esc(d.totalMaximum)}</td></tr></tfoot>
    </table>

    <div class="result-box">
      <div class="r-item"><div class="r-lbl">Total obtenu</div><div class="r-val">${esc(d.totalObtenu)}<span style="font-size:11px;font-weight:400;color:#64748b"> / ${esc(d.totalMaximum)}</span></div></div>
      <div class="divider"></div>
      <div class="r-item"><div class="r-lbl">Pourcentage</div><div class="r-val">${esc(d.pourcentage)}%</div></div>
      <div class="divider"></div>
      <div class="r-item"><div class="r-lbl">Rang de classe</div><div class="r-val">${esc(d.rang ?? '—')}</div></div>
      <div class="divider"></div>
      <div class="r-item"><div class="r-lbl">Décision du Jury</div><div class="r-val mention">${mention}</div></div>
    </div>

    <div class="sig">
      <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Le Chef d'Établissement</div></div>
      <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Le Secrétaire Pédagogique</div></div>
      <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Le Titulaire de Classe</div></div>
    </div>

    <div class="footer">
      <span>Généré le ${new Date().toLocaleDateString('fr-FR')} par Kotaschool</span>
      <span>Document officiel — Ne pas reproduire sans autorisation</span>
    </div>
  </div>
</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`);
  w.document.close();
}

function downloadPdf(d: Detail) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const W = 210;
  const pct = Number(d.pourcentage);
  const mention = pct >= 80 ? 'Grande Distinction' : pct >= 70 ? 'Distinction' : pct >= 60 ? 'Satisfaction' : pct >= 50 ? 'Réussi' : 'Non Réussi';
  const isSuccess = pct >= 50;

  // ── Header background ──
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, W, 26, 'F');

  // School name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Kotaschool', 14, 11);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text('Système Éducatif · EPSP — République Démocratique du Congo', 14, 17);

  // Bulletin title right
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BULLETIN OFFICIEL', W - 14, 11, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text(`${d.semestre.libelle}  ·  Année ${d.semestre.annee}`, W - 14, 17, { align: 'right' });

  // Accent line
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 26, W, 1.2, 'F');

  // ── Student info box ──
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 31, W - 28, 24, 2.5, 2.5, 'FD');

  const labelCol = 18;
  const valueCol1 = 47;
  const labelCol2 = 113;
  const valueCol2 = 130;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Nom complet :', labelCol, 39);
  doc.text('Matricule :', labelCol, 47);
  doc.text('Classe :', labelCol2, 39);
  doc.text('Option :', labelCol2, 47);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${d.eleve.nom} ${d.eleve.postnom ?? ''} ${d.eleve.prenom}`.trim(), valueCol1, 39);
  doc.text(d.eleve.matricule, valueCol1, 47);
  doc.text(d.eleve.classe, valueCol2, 39);
  doc.text(`${d.eleve.option} (${d.eleve.section})`, valueCol2, 47);

  // ── Section label ──
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('RÉSULTATS PAR MATIÈRE', 14, 62);

  // ── Grades table ──
  autoTable(doc, {
    startY: 65,
    head: [['Matière', 'Coef.', 'Note / 20', 'Note × Coef.']],
    body: d.lignes.map((l) => [l.matiere, String(l.coefficient), String(l.note), String(l.noteBulletin)]),
    foot: [['TOTAL GÉNÉRAL', '—', '—', `${d.totalObtenu} / ${d.totalMaximum}`]],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center', fontStyle: 'bold', textColor: [30, 58, 138] },
    },
    bodyStyles: { fontSize: 8.5, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    footStyles: { fillColor: [224, 231, 255], textColor: [30, 58, 138], fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100;

  // ── Result summary box ──
  const boxY = finalY + 5;
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, boxY, W - 28, 20, 2.5, 2.5, 'FD');
  // Left accent border
  doc.setFillColor(2, 132, 199);
  doc.rect(14, boxY, 1, 20, 'F');

  const items = [
    { label: 'Total obtenu', value: `${d.totalObtenu} / ${d.totalMaximum}` },
    { label: 'Pourcentage', value: `${d.pourcentage}%` },
    { label: 'Rang de classe', value: String(d.rang ?? '—') },
    { label: 'Décision du Jury', value: mention },
  ];
  const colW = (W - 28) / items.length;
  items.forEach((item, i) => {
    const cx = 14 + colW * i + colW / 2;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(item.label.toUpperCase(), cx, boxY + 6.5, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    if (i === 3) {
      doc.setTextColor(isSuccess ? 22 : 185, isSuccess ? 163 : 28, isSuccess ? 74 : 28);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(item.value, cx, boxY + 14.5, { align: 'center' });
    // Vertical divider
    if (i < items.length - 1) {
      doc.setDrawColor(186, 230, 253);
      doc.setLineWidth(0.3);
      doc.line(14 + colW * (i + 1), boxY + 3, 14 + colW * (i + 1), boxY + 17);
    }
  });

  // ── Signature lines ──
  const sigY = boxY + 30;
  const sigLabels = ["Le Chef d'Établissement", 'Le Secrétaire Pédagogique', 'Le Titulaire de Classe'];
  const sigW = (W - 28) / 3;
  sigLabels.forEach((label, i) => {
    const sx = 14 + sigW * i + sigW / 2;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.35);
    doc.line(sx - sigW * 0.33, sigY + 16, sx + sigW * 0.33, sigY + 16);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label, sx, sigY + 21, { align: 'center' });
  });

  // ── Footer ──
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.line(14, 284, W - 14, 284);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} par Kotaschool`, 14, 288);
  doc.text('Document officiel — Ne pas reproduire sans autorisation', W - 14, 288, { align: 'right' });

  const filename = `bulletin_${d.eleve.nom}_${d.eleve.prenom}_${d.semestre.libelle}.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
}

export default function ReportsPage() {
  const [semestres, setSemestres] = useState<Semestre[] | null>(null);
  const [semestreId, setSemestreId] = useState('');
  const [board, setBoard] = useState<{
    semestre: { libelle: string; annee: string };
    bulletins: BoardRow[];
  } | null>(null);
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
    api
      .get<Semestre[]>('/notes/reports/semestres')
      .then(async ({ data }) => {
        setSemestres(data);
        if (data[0]) {
          setSemestreId(data[0].id);
          try {
            await loadBoard(data[0].id);
          } catch {
            setBoard(null);
          }
        }
      })
      .catch(() => setError('Impossible de charger les semestres.'));
  }, []);

  async function selectSemestre(id: string) {
    setSemestreId(id);
    setBoard(null);
    setDetail(null);
    setError('');
    setMessage('');
    try {
      await loadBoard(id);
    } catch {
      setError(
        'Aucun bulletin calculé pour ce semestre : lancez le calcul ci-dessous.'
      );
    }
  }

  async function recalculate() {
    if (!semestreId) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/notes/bulletins/semestre/${semestreId}/calculer`);
      await loadBoard(semestreId);
      setMessage(
        'Les délibérations ont été calculées et le classement mis à jour avec succès.'
      );
    } catch {
      setError('Recalcul impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function openDetail(inscriptionId: string) {
    setError('');
    setDetail(null);
    try {
      const { data } = await api.get(
        `/notes/reports/inscription/${inscriptionId}/semestre/${semestreId}`
      );
      setDetail(data);
    } catch {
      setError('Détail du bulletin indisponible.');
    }
  }

  return (
    <section className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-brand-600" />
            Palmarès & Bulletins Scolaires
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Consultez le classement officiel, lancez le calcul automatique des
            délibérations et imprimez les bulletins certifiés.
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

      {/* ── Filter & Calculation Bar ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="w-full sm:w-80 space-y-1.5">
            <Label>Semestre Scolaire</Label>
            <Select
              value={semestreId}
              onChange={(e) => selectSemestre(e.target.value)}
            >
              {semestres === null && <option>Chargement…</option>}
              {semestres?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.libelle} ({s.annee.libelle})
                </option>
              ))}
            </Select>
          </div>

          <Button
            onClick={recalculate}
            disabled={busy || !semestreId}
            loading={busy}
            className="no-print self-stretch sm:self-auto"
          >
            <RotateCw className="mr-1.5 h-4 w-4" />
            Recalculer le classement
          </Button>
        </div>
      </div>

      {/* ── Main Board Table ── */}
      {board && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {board.semestre.libelle}
              </h3>
              <p className="text-xs text-slate-500">
                Année scolaire {board.semestre.annee} · {board.bulletins.length}{' '}
                élève(s) classé(s)
              </p>
            </div>
            <Badge variant="violet">Palmarès Officiel</Badge>
          </div>

          {board.bulletins.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Aucun bulletin calculé pour ce semestre. Cliquez sur « Recalculer le
              classement ».
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-100/70 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="p-3.5 text-center w-20">Rang</th>
                    <th className="p-3.5">Matricule</th>
                    <th className="p-3.5">Élève</th>
                    <th className="p-3.5">Classe</th>
                    <th className="p-3.5">Total Obtenu</th>
                    <th className="p-3.5">% Obtenu</th>
                    <th className="p-3.5">Décision</th>
                    <th className="p-3.5 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {board.bulletins.map((b) => {
                    const isPodium = b.rang && b.rang <= 3;
                    const isPassed = b.pourcentage >= 50;

                    return (
                      <tr
                        key={b.inscriptionId}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="p-3.5 text-center font-bold">
                          {isPodium ? (
                            <span
                              className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${
                                b.rang === 1
                                  ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400/40'
                                  : b.rang === 2
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {b.rang}
                              {b.rang === 1 ? 'er' : 'e'}
                            </span>
                          ) : (
                            <span className="text-slate-600">
                              {b.rang ?? '—'}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-xs text-slate-600">
                          {b.matricule}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={b.nom} size="sm" />
                            <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                              {b.nom}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600 text-xs sm:text-sm">
                          {b.classe}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 text-xs sm:text-sm">
                          {b.totalObtenu} / {b.totalMaximum}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`font-bold text-sm ${
                              isPassed ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {b.pourcentage}%
                          </span>
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={isPassed ? 'success' : 'destructive'}
                            className="text-[11px]"
                          >
                            {b.decision ?? '—'}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right no-print whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetail(b.inscriptionId)}
                            className="text-xs"
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Bulletin
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Official Bulletin Preview Card ── */}
      {detail && (
        <div className="print-area overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-soft-lg animate-scale-in">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft-sm">
                <School className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-brand-600">
                  Kotaschool
                </h2>
                <p className="text-xs text-slate-500">
                  Système Éducatif · EPSP (RDC)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-slate-900">
                Bulletin Officiel · {detail.semestre.libelle}
              </p>
              <p className="text-xs text-slate-500">
                Année Scolaire {detail.semestre.annee}
              </p>
            </div>
          </div>

          {/* Student Meta Details */}
          <div className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 text-xs sm:text-sm md:grid-cols-3">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Élève
              </span>
              <strong className="text-slate-900 font-bold text-sm">
                {detail.eleve.nom} {detail.eleve.postnom ?? ''}{' '}
                {detail.eleve.prenom}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Matricule
              </span>
              <strong className="font-mono text-slate-800">
                {detail.eleve.matricule}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Classe & Filière
              </span>
              <strong className="text-slate-800">
                {detail.eleve.classe} · {detail.eleve.option} (
                {detail.eleve.section})
              </strong>
            </div>
          </div>

          {/* Lines Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-y border-slate-300 bg-slate-100/90 font-semibold text-slate-700">
                <tr>
                  <th className="p-3">Matière</th>
                  <th className="p-3 text-center">Coefficient</th>
                  <th className="p-3 text-center">Note / 20</th>
                  <th className="p-3 text-center">Note × Coef.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {detail.lignes.map((l) => (
                  <tr key={l.matiere} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-800">{l.matiere}</td>
                    <td className="p-3 text-center font-mono">{l.coefficient}</td>
                    <td className="p-3 text-center font-semibold">{l.note}</td>
                    <td className="p-3 text-center font-bold text-slate-900">
                      {l.noteBulletin}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                <tr>
                  <td className="p-3">TOTAL GÉNÉRAL</td>
                  <td className="p-3 text-center">—</td>
                  <td className="p-3 text-center">—</td>
                  <td className="p-3 text-center text-sm text-brand-700 font-extrabold">
                    {detail.totalObtenu} / {detail.totalMaximum}
                  </td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="p-3" colSpan={4}>
                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                      <span>
                        Pourcentage :{' '}
                        <strong className="text-brand-600 text-base">
                          {detail.pourcentage}%
                        </strong>
                      </span>
                      <span>
                        Rang : <strong>{detail.rang ?? '—'}</strong>
                      </span>
                      <span>
                        Décision du Jury :{' '}
                        <Badge
                          variant={
                            detail.pourcentage >= 50
                              ? 'success'
                              : 'destructive'
                          }
                        >
                          {detail.decision ?? '—'}
                        </Badge>
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures & Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-5 text-xs text-slate-500">
            <p>
              Fait le {new Date().toLocaleDateString('fr-FR')} — Secrétariat
              Pédagogique Kotaschool
            </p>

            <div className="flex items-center gap-3 no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetail(null)}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Fermer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => printBulletin(detail)}
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Imprimer
              </Button>
              <Button size="sm" onClick={() => downloadPdf(detail)}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Télécharger PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
