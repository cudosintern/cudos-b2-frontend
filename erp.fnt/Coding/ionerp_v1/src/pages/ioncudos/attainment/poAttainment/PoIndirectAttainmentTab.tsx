import React, { useMemo, useState } from "react";
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
import { PoIndirectAttainmentResponse, PoIndirectSurveyOption } from "./poAttainmentTypes";

interface PoIndirectAttainmentTabProps {
  indirectData: PoIndirectAttainmentResponse["data"] | null;
  indirectLoading: boolean;
  surveyOptions: PoIndirectSurveyOption[];
  selectedSurveyId: string;
  onSurveyChange: (surveyId: string) => void;
}

const selectClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#437880] disabled:bg-gray-100 disabled:text-gray-500";
const indirectHeaderCellClass =
  "border border-gray-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700";

const PoIndirectAttainmentTab: React.FC<PoIndirectAttainmentTabProps> = ({
  indirectData,
  indirectLoading,
  surveyOptions,
  selectedSurveyId,
  onSurveyChange,
}) => {
  const [surveyTouched, setSurveyTouched] = useState(false);

  const chartData = useMemo(() => {
    if (!indirectData) {
      return [];
    }

    return indirectData.chart.categories.map((category, index) => ({
      category,
      value: indirectData.chart.series[0].data[index],
      tooltip: indirectData.chart.tooltips[index],
    }));
  }, [indirectData]);

  const showEmptyMessage = surveyTouched && !selectedSurveyId;
  const showResults = Boolean(selectedSurveyId && !indirectLoading && indirectData);

  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Survey: <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedSurveyId}
          onChange={(event) => {
            setSurveyTouched(true);
            onSurveyChange(event.target.value);
          }}
          className={selectClassName}
        >
          <option value="">Select Survey/Activity</option>
          {surveyOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {indirectLoading && selectedSurveyId && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading indirect attainment data...
        </div>
      )}

      {showEmptyMessage && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Program Outcome (POs) Indirect Attainment Analysis</h2>
          </div>
          <div className="flex min-h-[80px] items-center justify-center px-5 py-6 text-center text-sm font-medium text-red-600">
            Survey is empty
          </div>
        </div>
      )}

      {showResults && indirectData && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-800">{indirectData.chart.title}</h2>
          </div>

          <div className="space-y-5 p-5">
            <div className="h-[320px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 16, right: 24, left: 12, bottom: 10 }}>
                  <CartesianGrid stroke="#d1d5db" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#475569" }} />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${Number(value).toFixed(2)}%`}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    cursor={false}
                    wrapperStyle={{ outline: "none" }}
                    contentStyle={{ fontSize: 11, padding: "6px 8px" }}
                    itemStyle={{ fontSize: 11 }}
                    labelStyle={{ fontSize: 11 }}
                    formatter={(value: number | string) => `${Number(value).toFixed(2)}%`}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltip ?? ""}
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

            {indirectData.surveyStatus === "closed" && (
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <table className="cia-table-consolidated w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={`${indirectHeaderCellClass} text-left`} style={{ textTransform: "none" }}>
                        PO reference
                      </th>
                      <th className={`${indirectHeaderCellClass} text-left`} style={{ textTransform: "none" }}>
                        Program Outcome (PO) Statement
                      </th>
                      <th className={`${indirectHeaderCellClass} text-center`} style={{ textTransform: "none" }}>
                        Attainment %
                      </th>
                      <th className={`${indirectHeaderCellClass} text-center`} style={{ textTransform: "none" }}>
                        Attainment Level
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {indirectData.rows.map((row) => (
                      <tr key={row.poReference}>
                        <td className="border border-gray-200 px-3 py-2 text-xs text-slate-700">{row.poReference}</td>
                        <td className="border border-gray-200 px-3 py-2 text-xs text-slate-700">{row.poStatement}</td>
                        <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">
                          {row.attainmentPercentage.toFixed(2)}%
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">
                          {row.attainmentLevel === null ? "-" : row.attainmentLevel.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {indirectData.surveyStatus === "in_progress" && indirectData.warningMessage && (
              <div className="space-y-1 text-center text-sm text-red-600">
                <p>{indirectData.warningMessage}</p>
                <p>
                  Use this link to close the hosted survey :{" "}
                  <a
                    href="#"
                    onClick={(event) => event.preventDefault()}
                    className="text-sky-600 underline transition hover:text-amber-500"
                  >
                    survey close link
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoIndirectAttainmentTab;
