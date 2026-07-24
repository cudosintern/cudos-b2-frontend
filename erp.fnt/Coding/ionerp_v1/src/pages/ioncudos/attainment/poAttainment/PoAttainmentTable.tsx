import React from "react";
import { PoAttainmentMethod, PoAttainmentNotes, PoAttainmentRow } from "./poAttainmentTypes";

interface PoAttainmentTableProps {
  rows: PoAttainmentRow[];
  notes: PoAttainmentNotes;
  methods?: PoAttainmentMethod[];
  onDrilldownClick: (row: PoAttainmentRow, methodKey: string) => void;
  onLevelClick: (row: PoAttainmentRow, levelKey: string, levelValue: number | null) => void;
}

const headerCellClass = "border border-gray-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold text-slate-700";
const bodyCellClass = "border border-gray-200 px-3 py-2 align-top text-xs text-slate-700";
const headerCellStyle = { textTransform: "none" as const };

const MetricCell: React.FC<{
  value: number | null;
  row: PoAttainmentRow;
  methodKey: string;
  onDrilldownClick: (row: PoAttainmentRow, methodKey: string) => void;
}> = ({ value, row, methodKey, onDrilldownClick }) => (
  <td className={`${bodyCellClass} text-center`}>
    <div className="font-medium">{value === null || value === undefined ? "-" : `${value.toFixed(2)} %`}</div>
    <button
      type="button"
      onClick={() => {
        if (value === null || value === undefined) {
          return;
        }
        onDrilldownClick(row, methodKey);
      }}
      disabled={value === null || value === undefined || !row.poId}
      className="mt-1 text-[11px] font-medium text-sky-600 hover:text-amber-500 hover:underline disabled:cursor-default disabled:text-slate-400 disabled:no-underline"
    >
      drill down
    </button>
  </td>
);

const LevelCell: React.FC<{
  value: number | null;
  label: string;
  row: PoAttainmentRow;
  levelKey: string;
  onLevelClick: (row: PoAttainmentRow, levelKey: string, levelValue: number | null) => void;
}> = ({ value, label, row, levelKey, onLevelClick }) => (
  <td className={`${bodyCellClass} text-center`}>
    <div className="font-medium">{value === null || value === undefined ? "-" : value.toFixed(2)}</div>
    <button
      type="button"
      onClick={() => {
        if (value === null || value === undefined) {
          return;
        }
        onLevelClick(row, levelKey, value);
      }}
      disabled={value === null || value === undefined}
      className="mt-1 text-[11px] text-sky-600 hover:text-amber-500 hover:underline disabled:cursor-default disabled:text-slate-400 disabled:no-underline"
    >
      {label}
    </button>
  </td>
);

const getNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const PoAttainmentTable: React.FC<PoAttainmentTableProps> = ({ rows, notes, methods = [], onDrilldownClick, onLevelClick }) => {
  const methodColumns = methods.filter((method) => Boolean(method?.dataKey && method?.levelKey));

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="cia-table-consolidated w-full border-collapse">
          <thead>
            <tr>
              <th className={headerCellClass} style={headerCellStyle}>Sl. No.</th>
              <th className={headerCellClass} style={headerCellStyle}>PO Reference</th>
              {methodColumns.map((method) => (
                <React.Fragment key={method.dataKey}>
                  <th className={headerCellClass} style={headerCellStyle}>{method.label} %</th>
                  <th className={headerCellClass} style={headerCellStyle}>Attainment Level</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.poReference}>
                <td className={`${bodyCellClass} text-center`}>{row.slNo}</td>
                <td className={`${bodyCellClass} text-center font-medium`}>{row.poReference}</td>
                {methodColumns.map((method) => {
                  const rowValues = row as unknown as Record<string, unknown>;
                  const methodCell = row.methodCells?.[method.dataKey];
                  const percentageValue = getNullableNumber(rowValues[method.dataKey]) ?? methodCell?.percentage.value ?? null;
                  const levelValue = getNullableNumber(rowValues[method.levelKey]) ?? methodCell?.level.value ?? null;

                  return (
                    <React.Fragment key={`${row.poReference}-${method.dataKey}`}>
                      <MetricCell
                        value={percentageValue}
                        row={row}
                        methodKey={method.dataKey}
                        onDrilldownClick={onDrilldownClick}
                      />
                      <LevelCell
                        value={levelValue}
                        label={methodCell?.level.label ?? "View Level"}
                        row={row}
                        levelKey={methodCell?.level.levelKey ?? method.levelKey}
                        onLevelClick={onLevelClick}
                      />
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <span className="font-semibold">Note:</span> {notes.note}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {notes.formulas.map((formula) => (
          <div key={formula.title} className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-800">{formula.title}</div>
            <div className="mt-2 text-xs text-slate-600">Where,</div>
            <div className="mt-2 space-y-2 text-xs text-slate-600">
              {formula.lines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoAttainmentTable;
