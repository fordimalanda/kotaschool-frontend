'use client';
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
  function update(index: number, patch: Partial<GradeRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  // Trier : élèves SANS note (valeurNote === null) en tête, les autres après
  const sorted = [...rows].sort((a, b) => {
    const aEmpty = a.valeurNote === null ? 0 : 1;
    const bEmpty = b.valeurNote === null ? 0 : 1;
    return aEmpty - bEmpty;
  });

  const emptyCount = sorted.filter((r) => r.valeurNote === null).length;

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
      {emptyCount > 0 && !readOnly && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5">
          <span className="text-base">⚠️</span>
          <p className="text-xs font-medium text-amber-800">
            <strong>{emptyCount}</strong> élève{emptyCount > 1 ? 's' : ''} sans note — affiché{emptyCount > 1 ? 's' : ''} en tête pour faciliter la saisie.
          </p>
        </div>
      )}
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="p-3">Matricule</th>
            <th className="p-3">Élève</th>
            <th className="p-3">Note / {maximum}</th>
            <th className="p-3">Observation</th>
            <th className="p-3">Statut</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const isEmpty = row.valeurNote === null;
            const originalIndex = rows.findIndex((r) => r.idInscription === row.idInscription);
            return (
              <tr
                key={row.idInscription}
                className={`border-t transition-colors ${
                  isEmpty && !readOnly
                    ? 'bg-amber-50/70 hover:bg-amber-50'
                    : 'hover:bg-slate-50/50'
                }`}
              >
                <td className="p-3 font-mono text-xs">{row.matricule}</td>
                <td className="p-3">
                  <span className="font-medium">
                    {row.nom} {row.postnom} {row.prenom}
                  </span>
                  {isEmpty && !readOnly && (
                    <span className="ml-2 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                      À saisir
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    disabled={readOnly}
                    min="0"
                    max={maximum}
                    value={row.valeurNote ?? ''}
                    onChange={(e) => {
                      const value =
                        e.target.value === ''
                          ? null
                          : Math.min(maximum, Math.max(0, Number(e.target.value)));
                      update(originalIndex, { valeurNote: value });
                    }}
                    className={`w-24 rounded border p-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                      isEmpty && !readOnly
                        ? 'border-amber-300 bg-amber-50 focus:border-amber-400'
                        : 'border-slate-200'
                    }`}
                    aria-label={`Note de ${row.nom}`}
                    placeholder={isEmpty && !readOnly ? '—' : ''}
                  />
                </td>
                <td className="p-3">
                  <input
                    disabled={readOnly}
                    value={row.observation}
                    onChange={(e) => update(originalIndex, { observation: e.target.value })}
                    className="w-full rounded border border-slate-200 p-2 text-sm"
                    placeholder="Facultatif"
                  />
                </td>
                <td className="p-3">
                  {isEmpty && !readOnly ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                      ⚠️ Sans note
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        row.estValide
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {row.estValide ? 'Validée' : 'Brouillon'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
