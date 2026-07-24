import React from "react";
import { FaChevronRight, FaQuestionCircle, FaTimes } from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import PoAttainmentChart from "./PoAttainmentChart";
import PoDirectIndirectAttainmentTab from "./PoDirectIndirectAttainmentTab";
import PoExtracurricularTab from "./PoExtracurricularTab";
import PoAttainmentFilters from "./PoAttainmentFilters";
import PoAttainmentTable from "./PoAttainmentTable";
import PoAttainmentTabs from "./PoAttainmentTabs";
import PoIndirectAttainmentTab from "./PoIndirectAttainmentTab";
import { poAttainmentApi } from "./poAttainmentApi";
import { captureChartImage, downloadExportBlob, openPdfPreview } from "./poAttainmentExport";
import { usePoAttainment } from "./usePoAttainment";
import "../../assessment/cia/cia.css";
import "../cceDataImport/CiaDataImport.css";

const cardClass = "rounded-lg border border-gray-200 bg-white shadow-sm";
const tealActionButtonClass =
  "inline-flex items-center gap-2 rounded border border-[#437880] bg-[#437880] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#3a6a71] hover:bg-[#3a6a71]";
const helpIconClass = "cursor-pointer text-[#437880] transition hover:text-[#315f68]";
const redCloseButtonClass =
  "inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700";
const directOnlyNote = "Note: Below analysis is based purely on Direct Attainment as you have not selected any survey.";

interface DirectIndirectReportContext {
  result: any;
  directWeight: number;
  indirectWeight: number;
  activityWeight: number;
  surveyRows: Array<{
    sourceId: string;
    sourceType: "survey" | "activity";
    weightage: number;
  }>;
}

const parseCombinedSourceOptionId = (value: string) => {
  const [sourceType, ...rest] = String(value || "").split(":");
  return {
    sourceType: sourceType === "activity" ? "activity" as const : "survey" as const,
    rawId: rest.join(":"),
  };
};

const drilldownTooltipClass = {
  backgroundColor: "rgba(255, 255, 255, 0.96)",
  border: "1px solid #dbe4ee",
  borderRadius: "6px",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.12)",
  color: "#334155",
  fontSize: "11px",
  lineHeight: 1.35,
  padding: "6px 8px",
} as const;

const defaultDrilldownNotes = [
  "If PO Attainment % and Attainment Level are blank, it indicates that CO attainment for the respective courses are not finalized for calculating PO attainment.",
  "The above bar graph depicts individual PO attainment contributed by courses under selected Terms (Semester).",
] as const;

const helpTopics = [
  {
    id: "list",
    title: "List PO Attainment",
    lines: [
      "1. Select the curriculum from the ‘Curriculum’ drop-down list.",
      "2. Select the term from the ‘Term’ drop-down list.",
      "3. Select the check-box to display Attainment for only core Courses.",
      "4. Four different tabs will be displayed.",
      "5. Select the ‘Export’ button to export the Attainment details in the PDF or Word document.",
    ],
  },
  {
    id: "direct",
    title: "a. Direct Attainment",
    lines: [
      "i. Select the Direct Attainment tab, which displays the attainment value for respective POs.",
      "ii. Select the ‘drill down’ link, which displays the PO attainment for individual course.",
    ],
  },
  {
    id: "extracurricular",
    title: "b. Extracurricular / Co-curricular Activity",
    lines: [
      "i. Select the Extracurricular / CO-curricular Activity tab.",
      "ii. Select the Activity from the drop-down list, which displays the attainment value for respective POs mapped with the respective Criteria.",
    ],
  },
  {
    id: "indirect",
    title: "c. Indirect Attainment",
    lines: [
      "i. Select the Indirect Attainment tab.",
      "ii. Select the Survey from the drop-down list.",
      "NOTE: For this the respective Survey needs to be closed survey.",
    ],
  },
  {
    id: "directIndirect",
    title: "d. Direct and Indirect Attainment",
    lines: [
      "i. Select the Indirect Attainment tab.",
      "ii. Enter the Direct attainment value in the text-box.",
      "iii. Enter the Indirect attainment value in the text-box.",
      "iv. Select the Survey from the drop-down list.",
      "NOTE: For this the respective Survey needs to be closed survey.",
      "v. Enter the Weightage in the text-box.",
      "vi. Select the ‘Add more rows’ button to add one more survey.",
      "NOTE: The sum of weightage for all the selected Surveys should not be greater or less than 100.",
      "vii. Select the icon to delete the selected Survey.",
      "viii. Select the ‘Submit’ button, which displays the attainment values.",
    ],
  },
] as const;

const DrilldownCompactTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({
  active,
  label,
  payload,
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const courseLabel = item.payload?.courseTitle ?? label;

  return (
    <div style={drilldownTooltipClass}>
      <div style={{ fontWeight: 600, marginBottom: "2px", whiteSpace: "nowrap" }}>
        {courseLabel}
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: "6px", whiteSpace: "nowrap" }}>
        <span
          style={{
            backgroundColor: item.color,
            borderRadius: "999px",
            display: "inline-block",
            height: "8px",
            width: "8px",
          }}
        />
        <span>PO Attainment %</span>
        <span style={{ fontWeight: 600 }}>{Number(item.value).toFixed(2)}%</span>
      </div>
    </div>
  );
};

const PoHelpModal: React.FC<{
  openTopicIds: string[];
  onClose: () => void;
  onToggleTopic: (topicId: string) => void;
}> = ({ openTopicIds, onClose, onToggleTopic }) => (
  <div className="cce-modal-overlay z-[100001]">
    <div className="cce-modal-box cce-modal-box-lg">
      <div
        className="cce-modal-header border-b border-gray-200"
        style={{ backgroundColor: "#f8fafc", color: "#437880" }}
      >
        <span className="cce-modal-title">IonCUDOS Help And Support - PO Attainment</span>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="cursor-pointer text-[#437880] transition hover:text-[#315f68]"
        >
          <FaTimes />
        </button>
      </div>
      <div className="cce-modal-body text-sm text-slate-700">
        <p className="mb-8">
          The User gets the Course Outcome (CO) attainment comparison for the selected Term and Course.
        </p>
        <p className="mb-4 font-bold text-gray-800">Help Topics:</p>
        <div className="space-y-4">
          {helpTopics.map((topic) => {
            const isOpen = openTopicIds.includes(topic.id);

            return (
              <div key={topic.id}>
                <button
                  type="button"
                  onClick={() => onToggleTopic(topic.id)}
                  className="inline-flex w-full items-center gap-2 rounded px-2 py-1 text-left font-semibold text-[#1c8adb] transition hover:bg-amber-50 hover:text-amber-600"
                >
                  <FaChevronRight className={`text-[12px] text-gray-800 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  <span>{topic.title}</span>
                </button>
                {isOpen && (
                  <div className="ml-9 mt-3 space-y-3 leading-7 text-gray-700">
                    {topic.lines.map((line) => {
                      const isNote = line.startsWith("NOTE:");
                      return (
                        <p key={line} className={isNote ? "font-semibold" : ""}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="cce-modal-footer">
        <button type="button" onClick={onClose} className={redCloseButtonClass}>
          <FaTimes /> Close
        </button>
      </div>
    </div>
  </div>
);

const DrilldownModal: React.FC<{
  drilldownData: NonNullable<ReturnType<typeof usePoAttainment>["drilldownData"]>;
  onClose: () => void;
  onOpenHelp: () => void;
}> = ({ drilldownData, onClose, onOpenHelp }) => {
  const chartData = drilldownData.chart.categories.map((category, index) => ({
    category,
    value: drilldownData.chart.series[0].data[index],
    courseTitle: drilldownData.chart.tooltips[index],
  }));
  const hasChartData = chartData.length > 0;
  const hasRows = drilldownData.rows.length > 0;
  const notesToShow = drilldownData.notes.length > 0 ? drilldownData.notes : defaultDrilldownNotes;

  return (
    <div className="cce-modal-overlay">
      <div className="cce-modal-box cce-modal-box-lg">
        <div
          className="cce-modal-header border-b border-gray-200"
          style={{ backgroundColor: "#f8fafc", color: "#437880" }}
        >
          <span className="cce-modal-title">Program Outcome Attainment by individual courses</span>
          <div className="flex items-center gap-3">
            <button type="button" title="Web Help" onClick={onOpenHelp} className={helpIconClass}>
              <FaQuestionCircle />
            </button>
            <button type="button" title="Close" onClick={onClose} className={helpIconClass}>
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="cce-modal-body space-y-5 text-sm text-slate-700">
          <p className="text-center text-base font-semibold text-gray-700">
            Program Outcome : {drilldownData.po.poId}
            {drilldownData.po.poStatement ? `. PO Statement: ${drilldownData.po.poStatement}` : ""}
          </p>

          {hasChartData ? (
            <div className="h-[280px] rounded border border-gray-200 bg-[#fbf8ee] p-4">
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
                    content={<DrilldownCompactTooltip />}
                    cursor={false}
                    wrapperStyle={{ outline: "none" }}
                  />
                  <Bar dataKey="value" name="PO Attainment %" barSize={18} maxBarSize={18}>
                    {chartData.map((entry) => (
                      <Cell key={entry.category} fill="#55bfd6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded border border-dashed border-gray-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              No drilldown chart data available for the selected PO and method.
            </div>
          )}

          {hasRows ? (
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="cia-table-consolidated w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700">
                      Course Code - Course Title
                    </th>
                    <th className="border border-gray-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700">
                      Threshold based (Average) Attainment %
                    </th>
                    <th className="border border-gray-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700">
                      Attainment Level
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drilldownData.rows.map((row) => (
                    <tr key={`${row.courseCode}-${row.courseTitle}`}>
                      <td className="border border-gray-200 px-3 py-2 text-xs text-slate-700">
                        <button type="button" className="text-sky-600 hover:text-amber-500 hover:underline">
                          {row.courseCode}
                        </button>
                        {" - "}
                        {row.courseTitle}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">
                        {row.attainmentPercentage === null ? "-" : `${row.attainmentPercentage.toFixed(2)}%`}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">
                        {row.attainmentLevel === null ? "-" : row.attainmentLevel.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded border border-dashed border-gray-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              No course-wise drilldown rows available for the selected PO and method.
            </div>
          )}

          <div className="rounded-md border border-gray-300 bg-slate-50 p-5 shadow-sm">
            <p className="mb-4 font-semibold text-gray-800">Note:</p>
            <div className="space-y-2">
              {notesToShow.map((note) => (
                <div key={note} className="rounded border border-gray-200 bg-white px-3 py-2 text-xs text-slate-700">
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="cce-modal-footer">
          <button type="button" onClick={onClose} className={redCloseButtonClass}>
            <FaTimes /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

const PerformanceLevelsModal: React.FC<{
  performanceLevelsData: NonNullable<ReturnType<typeof usePoAttainment>["performanceLevelsData"]>;
  onClose: () => void;
  onOpenHelp: () => void;
}> = ({ performanceLevelsData, onClose, onOpenHelp }) => (
  <div className="cce-modal-overlay">
    <div className="cce-modal-box cce-modal-box-md">
      <div
        className="cce-modal-header border-b border-gray-200"
        style={{ backgroundColor: "#f8fafc", color: "#437880" }}
      >
        <span className="cce-modal-title">View Performance Levels</span>
        <div className="flex items-center gap-3">
          <button type="button" title="Web Help" onClick={onOpenHelp} className={helpIconClass}>
            <FaQuestionCircle />
          </button>
          <button type="button" title="Close" onClick={onClose} className={helpIconClass}>
            <FaTimes />
          </button>
        </div>
      </div>
      <div className="cce-modal-body space-y-5 text-sm text-slate-700">
        <div>
          <p className="font-semibold text-gray-800">Program Outcome:</p>
          <p className="mt-2 text-base">
            {performanceLevelsData.po.poId} : {performanceLevelsData.po.poStatement}
          </p>
        </div>

        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="cia-table-consolidated w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-200 bg-slate-50 px-2 py-3 text-xs font-semibold text-slate-700">Sl.No</th>
                <th className="border border-gray-200 bg-slate-50 px-2 py-3 text-xs font-semibold text-slate-700">Level Name</th>
                <th className="border border-gray-200 bg-slate-50 px-2 py-3 text-xs font-semibold text-slate-700">Level Value</th>
                <th className="border border-gray-200 bg-slate-50 px-2 py-3 text-xs font-semibold text-slate-700">Start Range</th>
                <th className="border border-gray-200 bg-slate-50 px-2 py-3 text-xs font-semibold text-slate-700">&gt;=</th>
                <th className="border border-gray-200 bg-slate-50 px-2 py-3 text-xs font-semibold text-slate-700">End Range</th>
                <th className="border border-gray-200 bg-slate-50 px-2 py-3 text-xs font-semibold text-slate-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {performanceLevelsData.levels.length ? performanceLevelsData.levels.map((level) => (
                <tr key={`${level.slNo}-${level.levelName}`}>
                  <td className="border border-gray-200 px-2 py-2 text-center text-xs text-slate-700">{level.slNo}</td>
                  <td className="border border-gray-200 px-2 py-2 text-xs text-slate-700">{level.levelName}</td>
                  <td className="border border-gray-200 px-2 py-2 text-center text-xs text-slate-700">{level.levelValue}</td>
                  <td className="border border-gray-200 px-2 py-2 text-center text-xs text-slate-700">{level.startRange.toFixed(2)}</td>
                  <td className="border border-gray-200 px-2 py-2 text-center text-xs text-slate-700">{level.comparator}</td>
                  <td className="border border-gray-200 px-2 py-2 text-center text-xs text-slate-700">{level.endRange.toFixed(2)}</td>
                  <td className="border border-gray-200 px-2 py-2 text-xs text-slate-700">{level.description}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="border border-gray-200 px-3 py-6 text-center text-sm text-slate-600">
                    No performance level details are available for this PO and attainment method.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="cce-modal-footer">
        <button type="button" onClick={onClose} className={redCloseButtonClass}>
          <FaTimes /> Close
        </button>
      </div>
    </div>
  </div>
);

const PoAttainmentPage: React.FC = () => {
  const [showHelp, setShowHelp] = React.useState(false);
  const [openHelpTopicIds, setOpenHelpTopicIds] = React.useState<string[]>([]);
  const [exportLoading, setExportLoading] = React.useState(false);
  const [exportError, setExportError] = React.useState("");
  const [directIndirectReport, setDirectIndirectReport] = React.useState<DirectIndirectReportContext | null>(null);
  const directChartRef = React.useRef<HTMLDivElement | null>(null);
  const activityChartRef = React.useRef<HTMLDivElement | null>(null);
  const indirectChartRef = React.useRef<HTMLDivElement | null>(null);
  const directIndirectChartRef = React.useRef<HTMLDivElement | null>(null);
  const {
    activeTab,
    activityData,
    activityLoading,
    activityOptions,
    curriculums,
    data,
    directIndirectSourceOptions,
    drilldownData,
    exportOptions,
    filters,
    hasValidFilters,
    indirectData,
    indirectLoading,
    indirectSurveyOptions,
    initialAvgPoAttainmentFlag,
    loading,
    openDrilldown,
    closeDrilldown,
    openPerformanceLevels,
    closePerformanceLevels,
    performanceLevelsData,
    popupLoading,
    resultsLoading,
    setActiveTab,
    setFilterValue,
    setSelectedIndirectSurvey,
    setSelectedActivities,
    selectedIndirectSurveyId,
    selectedActivityIds,
    selectedTermIds,
    terms,
  } = usePoAttainment();

  const renderPlaceholder = () => (
    <div className={`${cardClass} p-6 text-sm text-slate-600`}>
      Please select a curriculum and at least one term to view PO Attainment.
    </div>
  );

  const renderTabPlaceholder = () => (
    <div className={`${cardClass} p-6 text-sm text-slate-600`}>
      This tab is ready for backend integration and will be populated when the corresponding PO Attainment API is connected.
    </div>
  );

  const toggleHelpTopic = (topicId: string) => {
    setOpenHelpTopicIds((currentIds) =>
      currentIds.includes(topicId)
        ? currentIds.filter((currentId) => currentId !== topicId)
        : [...currentIds, topicId]
    );
  };

  React.useEffect(() => {
    setDirectIndirectReport(null);
    setExportError("");
  }, [filters.curriculumId, filters.termIds, filters.coreCoursesOnly]);

  const hasDirectDisplayData = Boolean(
    data &&
    data.rows.length > 0 &&
    data.chart.categories.length > 0
  );

  const handleExport = async (exportType: "pdf" | "docx") => {
    setExportError("");
    const curriculumLabel = curriculums.find((item) => item.id === filters.curriculumId)?.label ?? "";
    const termLabels = terms
      .filter((term) => filters.termIds.includes(term.id))
      .map((term) => term.label);
    const coreCoursesLabel = filters.coreCoursesOnly ? "Yes" : "No";

    try {
      if (activeTab === "direct") {
        if (!data?.rows?.length) {
          setExportError("Export is available only after Direct Attainment report is generated.");
          return;
        }

        const previewWindow = exportType === "pdf" ? window.open("", "_blank") : null;
        if (exportType === "pdf" && !previewWindow) {
          setExportError("Allow pop-ups to preview the PDF export.");
          return;
        }
        if (previewWindow) {
          previewWindow.document.open();
          previewWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Generating PDF preview...</p>');
          previewWindow.document.close();
        }

        setExportLoading(true);
        const response = await poAttainmentApi.exportPoAttainment({
          activeTab: "direct",
          exportType,
          curriculumId: filters.curriculumId,
          termIds: selectedTermIds,
          coreCoursesOnly: filters.coreCoursesOnly,
          latestGeneratedReport: data,
          latestChartImage: await captureChartImage(directChartRef.current),
          exportMetadata: {
            curriculumLabel,
            termLabels,
            coreCoursesLabel,
          },
        });
        if (exportType === "pdf") {
          openPdfPreview(response.blob, response.filename, previewWindow);
        } else {
          downloadExportBlob(response.blob, response.filename);
        }
        return;
      }

      if (activeTab === "extracurricular") {
        if (!selectedActivityIds.length || !activityData?.rows?.length) {
          setExportError("Export is available only after Activity Attainment report is generated.");
          return;
        }

        const previewWindow = exportType === "pdf" ? window.open("", "_blank") : null;
        if (exportType === "pdf" && !previewWindow) {
          setExportError("Allow pop-ups to preview the PDF export.");
          return;
        }
        if (previewWindow) {
          previewWindow.document.open();
          previewWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Generating PDF preview...</p>');
          previewWindow.document.close();
        }

        setExportLoading(true);
        const response = await poAttainmentApi.exportPoAttainment({
          activeTab: "activity",
          exportType,
          curriculumId: filters.curriculumId,
          termIds: selectedTermIds,
          coreCoursesOnly: filters.coreCoursesOnly,
          activityIds: selectedActivityIds,
          latestGeneratedReport: activityData,
          latestChartImage: await captureChartImage(activityChartRef.current),
          exportMetadata: {
            curriculumLabel,
            termLabels,
            coreCoursesLabel,
            activityLabel: activityOptions.find((option) => option.id === selectedActivityIds[0])?.label ?? "",
          },
        });
        if (exportType === "pdf") {
          openPdfPreview(response.blob, response.filename, previewWindow);
        } else {
          downloadExportBlob(response.blob, response.filename);
        }
        return;
      }

      if (activeTab === "indirect") {
        if (!selectedIndirectSurveyId || !indirectData?.rows?.length) {
          setExportError("Export is available only after Indirect Attainment report is generated.");
          return;
        }

        const previewWindow = exportType === "pdf" ? window.open("", "_blank") : null;
        if (exportType === "pdf" && !previewWindow) {
          setExportError("Allow pop-ups to preview the PDF export.");
          return;
        }
        if (previewWindow) {
          previewWindow.document.open();
          previewWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Generating PDF preview...</p>');
          previewWindow.document.close();
        }

        setExportLoading(true);
        const response = await poAttainmentApi.exportPoAttainment({
          activeTab: "indirect",
          exportType,
          curriculumId: filters.curriculumId,
          termIds: selectedTermIds,
          coreCoursesOnly: filters.coreCoursesOnly,
          surveyId: selectedIndirectSurveyId,
          latestGeneratedReport: indirectData,
          latestChartImage: await captureChartImage(indirectChartRef.current),
          exportMetadata: {
            curriculumLabel,
            termLabels,
            coreCoursesLabel,
            surveyLabel: indirectSurveyOptions.find((option) => option.id === selectedIndirectSurveyId)?.label ?? "",
          },
        });
        if (exportType === "pdf") {
          openPdfPreview(response.blob, response.filename, previewWindow);
        } else {
          downloadExportBlob(response.blob, response.filename);
        }
        return;
      }

      if (activeTab === "directIndirect") {
        if (!directIndirectReport?.result?.rows?.length) {
          setExportError("Export is available only after Final Weighted PO Attainment report is generated.");
          return;
        }

        if (directIndirectReport.result.exportStatus !== 1) {
          setExportError("Export is available only when the final weighted report export status allows it.");
          return;
        }

        const surveyRows = directIndirectReport.surveyRows.filter((row) => row.sourceType === "survey");
        const activityRows = directIndirectReport.surveyRows.filter((row) => row.sourceType === "activity");
        const activityWeightActive = directIndirectReport.activityWeight > 0;
        const previewWindow = exportType === "pdf" ? window.open("", "_blank") : null;
        if (exportType === "pdf" && !previewWindow) {
          setExportError("Allow pop-ups to preview the PDF export.");
          return;
        }
        if (previewWindow) {
          previewWindow.document.open();
          previewWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Generating PDF preview...</p>');
          previewWindow.document.close();
        }

        setExportLoading(true);
        const response = await poAttainmentApi.exportPoAttainment({
          activeTab: "direct_indirect",
          exportType,
          curriculumId: filters.curriculumId,
          termIds: selectedTermIds,
          coreCoursesOnly: filters.coreCoursesOnly,
          directWeight: directIndirectReport.directWeight,
          indirectWeight: directIndirectReport.indirectWeight,
          actWeight: directIndirectReport.activityWeight,
          surveyIds: surveyRows.map((row) => parseCombinedSourceOptionId(row.sourceId).rawId),
          surveyWeightages: surveyRows.map((row) => row.weightage),
          activityIds: activityWeightActive ? activityRows.map((row) => parseCombinedSourceOptionId(row.sourceId).rawId) : [],
          activityWeightages: activityWeightActive ? activityRows.map((row) => row.weightage) : [],
          avgPoAttntFlag: initialAvgPoAttainmentFlag,
          latestGeneratedReport: directIndirectReport.result,
          latestChartImage: await captureChartImage(directIndirectChartRef.current),
          exportMetadata: {
            curriculumLabel,
            termLabels,
            coreCoursesLabel,
            directOnlyNote:
              directIndirectReport.directWeight === 100 &&
              directIndirectReport.indirectWeight === 0 &&
              directIndirectReport.activityWeight === 0 &&
              directIndirectReport.surveyRows.length === 0
                ? directOnlyNote
                : "",
            directIndirectSelections: directIndirectReport.surveyRows
              .filter((row) => row.sourceType !== "activity" || activityWeightActive)
              .map((row) => ({
                sourceId: parseCombinedSourceOptionId(row.sourceId).rawId,
                sourceType: row.sourceType,
                sourceLabel: directIndirectSourceOptions.find((option) => option.id === row.sourceId)?.label ?? row.sourceId,
                weightage: row.weightage,
              })),
          },
          exportStatus: directIndirectReport.result.exportStatus,
        });
        if (exportType === "pdf") {
          openPdfPreview(response.blob, response.filename, previewWindow);
        } else {
          downloadExportBlob(response.blob, response.filename);
        }
        return;
      }

      setExportError("Export is available only for Direct, Activity, Indirect, or Direct and Indirect Attainment reports.");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "PO Attainment export failed.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="cia-container space-y-6">
      <div className={cardClass}>
        <div className="border-b border-gray-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-semibold text-slate-800">
              Program Outcome (PO) Attainment (CCE &amp; SEE)
            </h1>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              title="Web Help"
              className="cursor-pointer text-[#437880] transition hover:text-[#315f68]"
            >
              <FaQuestionCircle />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <PoAttainmentFilters
            curriculums={curriculums}
            terms={terms}
            filters={filters}
            exportOptions={exportOptions}
            loading={loading}
            onFilterChange={setFilterValue}
            onExport={handleExport}
          />

          {exportError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {exportError}
            </div>
          )}

          {exportLoading && (
            <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-slate-600">
              Generating export...
            </div>
          )}

          <PoAttainmentTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {!hasValidFilters && renderPlaceholder()}

      {hasValidFilters && activeTab === "direct" && resultsLoading && (
        <div className={`${cardClass} p-6 text-sm text-slate-600`}>
          Loading PO Attainment data...
        </div>
      )}

      {hasValidFilters && !resultsLoading && data && activeTab === "direct" && !hasDirectDisplayData && (
        <div className={`${cardClass} p-6 text-center text-sm text-slate-600`}>
          No Data to Display.
        </div>
      )}

      {hasValidFilters && !resultsLoading && data && activeTab === "direct" && hasDirectDisplayData && (
        <div className="space-y-5">
          <div className={cardClass}>
            <div className="border-b border-[#e0f2fe] bg-[#f0f9ff] px-5 py-3">
              <h2 className="text-sm font-semibold text-[#4a8494]">Program Outcome (PO) Attainment</h2>
            </div>
            <div ref={directChartRef} className="p-5">
              <PoAttainmentChart chart={data.chart} />
            </div>
          </div>

          <div className={cardClass}>
            <div className="p-5">
              <PoAttainmentTable
                rows={data.rows}
                notes={data.notes}
                methods={data.methods}
                onDrilldownClick={openDrilldown}
                onLevelClick={openPerformanceLevels}
              />
            </div>
          </div>
        </div>
      )}

      {hasValidFilters && activeTab === "extracurricular" && (
        <div className={cardClass}>
          <div ref={activityChartRef} className="p-5">
            <PoExtracurricularTab
              activityData={activityData}
              activityLoading={activityLoading}
              activityOptions={activityOptions}
              selectedActivityIds={selectedActivityIds}
              onSelectedActivitiesChange={setSelectedActivities}
            />
          </div>
        </div>
      )}

      {hasValidFilters && activeTab === "indirect" && (
        <div className={cardClass}>
          <div ref={indirectChartRef} className="p-5">
            <PoIndirectAttainmentTab
              indirectData={indirectData}
              indirectLoading={indirectLoading}
              surveyOptions={indirectSurveyOptions}
              selectedSurveyId={selectedIndirectSurveyId}
              onSurveyChange={setSelectedIndirectSurvey}
            />
          </div>
        </div>
      )}

      {hasValidFilters && activeTab === "directIndirect" && (
        <div className={cardClass}>
          <div ref={directIndirectChartRef} className="p-5">
            <PoDirectIndirectAttainmentTab
              filters={filters}
              termIds={selectedTermIds}
              initialAvgPoAttainmentFlag={initialAvgPoAttainmentFlag}
              sourceOptions={directIndirectSourceOptions}
              onReportChange={setDirectIndirectReport}
            />
          </div>
        </div>
      )}

      {hasValidFilters && !resultsLoading && data && activeTab !== "direct" && activeTab !== "extracurricular" && activeTab !== "indirect" && activeTab !== "directIndirect" && renderTabPlaceholder()}

      {popupLoading && (
        <div className={`${cardClass} p-6 text-sm text-slate-600`}>
          Loading popup data...
        </div>
      )}

      {drilldownData && (
        <DrilldownModal
          drilldownData={drilldownData}
          onClose={closeDrilldown}
          onOpenHelp={() => setShowHelp(true)}
        />
      )}

      {performanceLevelsData && (
        <PerformanceLevelsModal
          performanceLevelsData={performanceLevelsData}
          onClose={closePerformanceLevels}
          onOpenHelp={() => setShowHelp(true)}
        />
      )}

      {showHelp && (
        <PoHelpModal
          openTopicIds={openHelpTopicIds}
          onClose={() => setShowHelp(false)}
          onToggleTopic={toggleHelpTopic}
        />
      )}
    </div>
  );
};

export default PoAttainmentPage;
