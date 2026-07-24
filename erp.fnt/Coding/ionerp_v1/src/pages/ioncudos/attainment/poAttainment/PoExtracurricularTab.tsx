import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PoActivityAttainmentResponse, PoActivityOption } from "./poAttainmentTypes";

interface PoExtracurricularTabProps {
  activityData: PoActivityAttainmentResponse["data"] | null;
  activityLoading: boolean;
  activityOptions: PoActivityOption[];
  selectedActivityIds: string[];
  onSelectedActivitiesChange: (activityIds: string[]) => void;
}

const selectClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#437880] disabled:bg-gray-100 disabled:text-gray-500";
const activityHeaderCellClass =
  "border border-gray-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold text-slate-700";
const activityBodyCellClass = "border border-gray-200 px-3 py-2 text-xs text-slate-700";

const ActivityTooltip: React.FC<{
  active?: boolean;
  label?: string;
  payload?: Array<{ value?: number | string; name?: string; payload?: { tooltip?: string } }>;
}> = ({ active, label, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const value = Number(payload[0]?.value);
  const tooltipLabel = payload[0]?.payload?.tooltip || label || "";

  return (
    <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 shadow-md">
      <div className="font-semibold text-slate-800">{tooltipLabel}</div>
      <div className="mt-1">Attainment % : {Number.isFinite(value) ? value.toFixed(2) : "0.00"}%</div>
    </div>
  );
};

const PoExtracurricularTab: React.FC<PoExtracurricularTabProps> = ({
  activityData,
  activityLoading,
  activityOptions,
  selectedActivityIds,
  onSelectedActivitiesChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesCount, setEntriesCount] = useState(20);
  const [activityTouched, setActivityTouched] = useState(false);

  useEffect(() => {
    if (activityData) {
      setEntriesCount(activityData.table.showEntriesOptions[0] ?? 20);
    }
  }, [activityData]);

  const filteredRows = useMemo(() => {
    if (!activityData) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return activityData.rows;
    }

    return activityData.rows.filter((row) => {
      const statementText = `${row.poCode} - ${row.poStatement}`.toLowerCase();
      return statementText.includes(normalizedSearch);
    });
  }, [activityData, searchTerm]);

  const visibleRows = filteredRows.slice(0, entriesCount);
  const chartData = useMemo(() => {
    if (!activityData) {
      return [];
    }

    return activityData.chart.categories.map((category, index) => ({
      category,
      value: activityData.chart.series[0].data[index],
      tooltip: activityData.chart.tooltips[index],
    }));
  }, [activityData]);

  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Activity: <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedActivityIds[0] ?? ""}
          onChange={(event) => {
            setActivityTouched(true);
            onSelectedActivitiesChange(event.target.value ? [event.target.value] : []);
          }}
          className={selectClassName}
        >
          <option value="">Select Activity</option>
          {activityOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {activityTouched && !selectedActivityIds.length && (
        <div className="flex min-h-[260px] items-center justify-center text-center text-lg font-medium text-red-600">
          No Data to Display.
        </div>
      )}

      {selectedActivityIds.length > 0 && activityLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading extracurricular attainment data...
        </div>
      )}

      {selectedActivityIds.length > 0 && !activityLoading && activityData && (
        <div className="space-y-5">
          <div className="h-[320px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 24, left: 12, bottom: 10 }}>
                <CartesianGrid stroke="#d1d5db" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#475569" }} />
                <YAxis
                  domain={[0, 110]}
                  tickFormatter={(value) => `${Number(value).toFixed(2)}%`}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  content={<ActivityTooltip />}
                  cursor={false}
                  wrapperStyle={{ outline: "none" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" name="Attainment %" barSize={18} maxBarSize={18}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(value: number | string) => Number(value).toFixed(2)}
                    style={{ fontSize: 11, fill: "#475569" }}
                  />
                  {chartData.map((entry) => (
                    <Cell key={entry.category} fill="#55bfd6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span>Show</span>
                <select
                  value={entriesCount}
                  onChange={(event) => setEntriesCount(Number(event.target.value))}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                >
                  {activityData.table.showEntriesOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span>entries</span>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <span>Search:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
                />
              </label>
            </div>

            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="cia-table-consolidated w-full border-collapse">
                <thead>
                  <tr>
                    <th className={activityHeaderCellClass} style={{ textTransform: "none" }}>
                      Criteria
                    </th>
                    <th className={activityHeaderCellClass} style={{ textTransform: "none" }}>
                      Program Outcome Statement
                    </th>
                    <th className={activityHeaderCellClass} style={{ textTransform: "none" }}>
                      Attainment %
                    </th>
                    <th className={activityHeaderCellClass} style={{ textTransform: "none" }}>
                      Attainment Level
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-200">
                    <td className={`${activityBodyCellClass} font-semibold`}>
                      Criteria:- <span className="font-normal">{activityData.criteriaLabel || "-"}</span>
                    </td>
                    <td className={activityBodyCellClass} />
                    <td className={activityBodyCellClass} />
                    <td className={activityBodyCellClass} />
                  </tr>
                  {visibleRows.map((row) => (
                    <tr key={`${row.criteria ?? activityData.criteriaLabel}-${row.poCode}`}>
                      <td className={activityBodyCellClass}>{row.criteria || "-"}</td>
                      <td className={activityBodyCellClass}>
                        {row.poCode} - {row.poStatement}
                      </td>
                      <td className={`${activityBodyCellClass} text-right`}>
                        {row.attainmentPercentage.toFixed(2)}%
                      </td>
                      <td className={`${activityBodyCellClass} text-right`}>
                        {row.attainmentLevel === null || row.attainmentLevel === undefined ? "-" : row.attainmentLevel.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
              <div>
                Showing {filteredRows.length ? 1 : 0} to {Math.min(filteredRows.length, entriesCount)} of {filteredRows.length} entries
              </div>
              <div className="inline-flex overflow-hidden rounded border border-gray-200">
                <button
                  type="button"
                  disabled
                  className="border-r border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-400"
                >
                  Previous
                </button>
                <button type="button" disabled className="border-r border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
                  1
                </button>
                <button type="button" disabled className="bg-gray-100 px-4 py-2 text-sm text-gray-400">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoExtracurricularTab;
