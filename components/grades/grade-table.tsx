'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Search,
  User,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export type GradeRow = {
  idInscription: string;
  matricule: string;
  nom: string;
  postnom?: string | null;
  prenom: string;
  valeurNote: number | null;
  observation: string;
  estValide: boolean;
};

export function GradeTable({
  rows,
  maximum,
  onChange,
  readOnly = false,
}: {
  rows: GradeRow[];
  maximum: number;
  onChange: (rows: GradeRow[]) => void;
  readOnly?: boolean;
}) {
  const [search, setSearch] = useState('');

  function update(index: number, patch: Partial<GradeRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  // Filtered and sorted
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aEmpty = a.valeurNote === null ? 0 : 1;
      const bEmpty = b.valeurNote === null ? 0 : 1;
      return aEmpty - bEmpty;
    });
  }, [rows]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.trim().toLowerCase();
    return sorted.filter((r) => {
      const full = `${r.nom} ${r.postnom ?? ''} ${r.prenom}`.toLowerCase();
      return full.includes(q) || r.matricule.toLowerCase().includes(q);
    });
  }, [sorted, search]);

  const emptyCount = rows.filter((r) => r.valeurNote === null).length;
  const gradedCount = rows.length - emptyCount;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft-sm">
      {/* ── Table Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="relative w-64 max-w-full">
            <Input
              type="text"
              placeholder="Rechercher par élève ou matricule…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-white"
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {gradedCount} noté{gradedCount > 1 ? 's' : ''}
          </span>
          {emptyCount > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              {emptyCount} en attente
            </span>
          )}
        </div>
      </div>

      {emptyCount > 0 && !readOnly && (
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/60 px-4 py-2.5 text-xs font-medium text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>{emptyCount}</strong> élève{emptyCount > 1 ? 's' : ''} sans note
            — placés en priorité pour accélérer votre saisie.
          </span>
        </div>
      )}

      {/* ── Main Data Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-100/70 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="p-3.5">Matricule</th>
              <th className="p-3.5">Élève</th>
              <th className="p-3.5 w-36">Note / {maximum}</th>
              <th className="p-3.5">Observation</th>
              <th className="p-3.5 text-right">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-xs text-slate-500">
                  Aucun élève ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isEmpty = row.valeurNote === null;
                const originalIndex = rows.findIndex(
                  (r) => r.idInscription === row.idInscription
                );
                const fullName = `${row.nom} ${row.postnom ?? ''} ${row.prenom}`.trim();

                return (
                  <tr
                    key={row.idInscription}
                    className={`transition-colors duration-150 ${
                      isEmpty && !readOnly
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="p-3.5 font-mono text-xs text-slate-600">
                      {row.matricule}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={fullName} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                            {fullName}
                          </p>
                          {isEmpty && !readOnly && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              À compléter
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          disabled={readOnly}
                          min="0"
                          max={maximum}
                          step="0.5"
                          value={row.valeurNote ?? ''}
                          onChange={(e) => {
                            const value =
                              e.target.value === ''
                                ? null
                                : Math.min(maximum, Math.max(0, Number(e.target.value)));
                            update(originalIndex, { valeurNote: value });
                          }}
                          className={`w-24 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                            isEmpty && !readOnly
                              ? 'border-amber-300 bg-white text-slate-900 focus:border-amber-400'
                              : 'border-slate-200 bg-white text-slate-900'
                          }`}
                          aria-label={`Note de ${row.nom}`}
                          placeholder="—"
                        />
                        <span className="text-xs text-slate-400 font-medium">
                          /{maximum}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <input
                        disabled={readOnly}
                        value={row.observation}
                        onChange={(e) =>
                          update(originalIndex, { observation: e.target.value })
                        }
                        className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        placeholder="Observation facultative…"
                      />
                    </td>
                    <td className="p-3.5 text-right">
                      {isEmpty && !readOnly ? (
                        <Badge variant="warning">
                          <Clock className="h-3 w-3" />
                          Sans note
                        </Badge>
                      ) : (
                        <Badge
                          variant={row.estValide ? 'success' : 'secondary'}
                        >
                          {row.estValide ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Validée
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              Brouillon
                            </>
                          )}
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
