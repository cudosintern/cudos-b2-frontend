import React from "react";
import { DataAnalysisQuestionResult, DataAnalysisReportState } from "./dataAnalysisTypes";

interface DataAnalysisReportProps {
  reportState: DataAnalysisReportState;
}

type QuestionFieldKey = keyof DataAnalysisQuestionResult;

const rowDefinitions: ReadonlyArray<{ label: string; key: QuestionFieldKey }> = [
  { label: "Bloom's Level", key: "bloomsLevel" },
  { label: "Question", key: "question" },
  { label: "CO", key: "co" },
  { label: "Marks", key: "marks" },
  { label: "Average", key: "average" },
  { label: "Standard Deviation", key: "standardDeviation" },
  { label: "Min in Range", key: "minInRange" },
  { label: "Max in Range", key: "maxInRange" },
  { label: "Number of attempts", key: "numberOfAttempts" },
  { label: "Percentage of Attempt", key: "percentageOfAttempt" },
  { label: "Percentage of Attainment", key: "percentageOfAttainment" },
] as const;

const DataAnalysisReport: React.FC<DataAnalysisReportProps> = ({ reportState }) => {
  if (reportState.kind === "loading") {
    return <div className="px-6 py-8 text-sm font-medium text-slate-500">Loading analysis report...</div>;
  }

  if (reportState.kind === "validation") {
    return <div className="px-6 py-8 text-sm font-semibold text-red-600">{reportState.message}</div>;
  }

  if (reportState.kind === "error") {
    return <div className="px-6 py-8 text-sm font-semibold text-red-600">{reportState.message}</div>;
  }

  if (reportState.kind !== "success") {
    return <div className="min-h-[88px]" />;
  }

  return (
    <div className="w-full min-w-0 space-y-6 px-6 py-6">
      <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-gray-200">
        <table className="cia-table-consolidated min-w-max border-collapse text-sm">
          <tbody>
            {rowDefinitions.map((row) => (
              <tr key={row.key}>
                <td className="sticky left-0 z-10 min-w-[220px] bg-slate-50 font-semibold text-slate-700">
                  {row.label}
                </td>
                {reportState.data.questions.map((question) => (
                  <td key={`${row.key}-${question.question}`} className="min-w-[160px] text-center">
                    {question[row.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-4 text-[13px] leading-relaxed text-gray-600">
        <div className="font-bold text-slate-800">Note:</div>
        <p>
          <span className="font-bold text-slate-700">Standard Deviation -</span> Take the mean of the
          data (secured marks for each question), then add the squared differences of each data and
          mean. Further divide the result by count of data set, fetch the square root of the
          resulting value.
        </p>
        <p>
          <span className="font-bold text-slate-700">Percentage of Attainment -</span> (Average * 100
          / Marks).
        </p>
      </div>
    </div>
  );
};

export default DataAnalysisReport;
