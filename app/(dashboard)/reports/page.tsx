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
        `<tr><td>${esc(l.matiere)}</td><td class="c">${esc(
          l.coefficient
        )}</td><td class="c">${esc(l.note)}</td><td class="c font-bold">${esc(
          l.noteBulletin
        )}</td></tr>`
    )
    .join('');

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Bulletin ${esc(
    d.eleve.nom
  )}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:32px;margin:0}
    .head{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #0f172a;padding-bottom:12px}
    h1{margin:0;font-size:22px;color:#4338ca;font-weight:bold}
    table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
    th,td{border:1px solid #334155;padding:7px 10px;text-align:left}
    th{background:#f8fafc;font-weight:bold}
    .c{text-align:center}
    .tot td{font-weight:bold;background:#f1f5f9}
    .meta{margin:14px 0;font-size:13px;line-height:1.7}
    .sig{margin-top:40px;display:flex;justify-content:space-between;font-size:11px;color:#475569}
    @page{margin:16mm}
  </style></head><body>
    <div class="head">
      <div><h1>Kotaschool</h1><div style="font-size:12px;color:#475569">Système Éducatif · EPSP (RDC)</div></div>
      <div style="text-align:right"><b>Bulletin Officiel · ${esc(
        d.semestre.libelle
      )}</b><br><span style="font-size:12px">Année scolaire ${esc(
    d.semestre.annee
  )}</span></div>
    </div>
    <div class="meta">
      <b>Élève :</b> ${esc(d.eleve.nom)} ${esc(d.eleve.postnom)} ${esc(
    d.eleve.prenom
  )}<br>
      <b>Matricule :</b> ${esc(d.eleve.matricule)}<br>
      <b>Classe :</b> ${esc(d.eleve.classe)} · ${esc(d.eleve.option)} (${esc(
    d.eleve.section
  )})
    </div>
    <table><thead><tr><th>Matière</th><th class="c">Coef.</th><th class="c">Note / 20</th><th class="c">Note × Coef.</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="tot"><td>TOTAL GÉNÉRAL</td><td class="c">—</td><td class="c">—</td><td class="c">${esc(
      d.totalObtenu
    )} / ${esc(d.totalMaximum)}</td></tr></tfoot></table>
    <div class="meta" style="margin-top:14px">
      Pourcentage : <b>${esc(d.pourcentage)}%</b> &nbsp;|&nbsp; Rang : <b>${esc(
    d.rang
  )}</b> &nbsp;|&nbsp; Décision du Jury : <b>${esc(d.decision)}</b>
    </div>
    <div class="sig">
      <div>Fait le ${new Date().toLocaleDateString('fr-FR')}</div>
      <div style="text-align:center">Le Chef d'Établissement</div>
      <div style="text-align:right">Le Secrétaire Pédagogique</div>
    </div>
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`);
  w.document.close();
}

function downloadPdf(d: Detail) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text('Kotaschool', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Système Éducatif · EPSP (RDC)', 14, 21);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Bulletin Officiel — ${d.semestre.libelle}`, 196, 16, {
    align: 'right',
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Année scolaire ${d.semestre.annee}`, 196, 21, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${d.eleve.nom} ${d.eleve.postnom ?? ''} ${d.eleve.prenom}`.trim(),
    14,
    32
  );
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Matricule : ${d.eleve.matricule}`, 14, 38);
  doc.text(
    `Classe : ${d.eleve.classe} · ${d.eleve.option} (${d.eleve.section})`,
    14,
    43
  );

  autoTable(doc, {
    startY: 50,
    head: [['Matière', 'Coef.', 'Note / 20', 'Note × Coef.']],
    body: d.lignes.map((l) => [
      l.matiere,
      String(l.coefficient),
      String(l.note),
      String(l.noteBulletin),
    ]),
    foot: [['TOTAL GÉNÉRAL', '—', '—', `${d.totalObtenu} / ${d.totalMaximum}`]],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
    },
    styles: { fontSize: 10, cellPadding: 3 },
    footStyles: { fontStyle: 'bold' },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 60;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Pourcentage : ${d.pourcentage}%    Rang : ${d.rang ?? '—'}    Décision : ${
      d.decision ?? '—'
    }`,
    14,
    finalY + 9
  );
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Fait le ${new Date().toLocaleDateString(
      'fr-FR'
    )} — Secrétariat Pédagogique Kotaschool`,
    14,
    finalY + 16
  );
  const filename =
    `bulletin_${d.eleve.nom}_${d.eleve.prenom}_${d.semestre.libelle}.pdf`.replace(
      /\s+/g,
      '_'
    );
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
