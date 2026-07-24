import React from "react";
import {
  FaBook,
  FaChevronDown,
  FaChevronRight,
  FaFilePdf,
  FaFileWord,
  FaList,
  FaQuestionCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { courseCoAttainmentApi } from "./courseCoAttainmentApi";
import CourseCoAttainmentFilters from "./CourseCoAttainmentFilters";
import { useCourseCoAttainment } from "./useCourseCoAttainment";
import {
  BloomLevelRow,
  CoAttainmentRow,
  CoPoMatrixRow,
  CompactChartPoint,
  DirectIndirectAttainmentRow,
  DirectIndirectChartPoint,
  CourseCoAttainmentOption,
  CourseCoAttainmentSectionBlock,
  CourseCoAttainmentTabId,
  CourseCoAttainmentDrilldownAssessmentRow,
  CourseCoAttainmentDrilldownData,
  FinalizeCourseOverviewRow,
  FinalizeOccasionOption,
  FormulaCard,
  MapLevelWeightageRow,
  ProgramOutcomeAttainmentRow,
  TargetLevelRow,
} from "./courseCoAttainmentTypes";

type CourseCoAttainmentTabItem = { id: CourseCoAttainmentTabId; label: string };

const tabs: CourseCoAttainmentTabItem[] = [
  { id: "cce", label: "CCE - COs Attainment" },
  { id: "mte", label: "MTE - COs Attainment" },
  { id: "finalize", label: "Finalize Course - COs Attainment" },
  { id: "blooms", label: "Bloom's Level Attainment" },
  { id: "directIndirect", label: "Direct and Indirect Attainment" },
];

const selectClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const sectionTitleClass = "text-lg font-semibold text-gray-800";
const cardClass = "rounded-lg border border-gray-200 bg-white shadow-sm";
const cardHeaderClass = "border-b border-gray-200 bg-gray-50 px-4 py-3";
const tableClass = "w-full border-collapse text-sm text-gray-800";
const headerCellClass = "border border-gray-200 bg-gray-50 px-4 py-3 text-left font-semibold";
const bodyCellClass = "border border-gray-200 px-4 py-3 align-top";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";
const chartAxisLevels = [100, 80, 60, 40, 20, 0];
const primarySeriesColor = "#6bc6d6";
const secondarySeriesColor = "#39ef63";
const greenButtonClass =
  "inline-flex items-center justify-center gap-1 rounded-md border border-[#437880] bg-[#437880] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-[#3a6a71] hover:bg-[#3a6a71]";
const exportVisibleTabs: CourseCoAttainmentTabId[] = ["cce", "mte", "finalize", "directIndirect"];

const formatPercent = (value: number) => `${value.toFixed(2)}%`;
const notApplicableValue = "NA";

const toDisplayValue = (value?: string | number | null) => {
  if (value === null || value === undefined) {
    return notApplicableValue;
  }

  const text = String(value).trim();
  return text.length ? text : notApplicableValue;
};

const formatPercentLevel = (percent?: string | null, level?: string | null) => {
  const percentValue = toDisplayValue(percent);
  const levelValue = toDisplayValue(level);
  return percentValue === notApplicableValue && levelValue === notApplicableValue
    ? notApplicableValue
    : `${percentValue} (${levelValue})`;
};

const ciaDataImportRoute = "/attainment/cce_data_import";

const helpIntro =
  "The User is allowed to calculate the Course CO Attainment for the respective Course.";

const helpTopics = [
  {
    id: "list-course",
    title: "List Course ? Course Outcome (CO) Attainment (CIA, MTE, and TEE/ESE)",
    content: `1. Select the curriculum from the 'Curriculum' drop-down list.
2. Select the term from the 'Term' drop-down list.
3. Select the course from the 'Course' drop-down list.

NOTE: The five different tabs will be displayed, with different functions.

4. Select the 'Export' button to export the data .pdf and .doc format.`,
  },
  {
    id: "cia-cos",
    title: "a. CIA - COs Attainment (Section / Division wise)",
    content: `All the Courses depending upon the Section will be displayed. Here the CIA Finalize depends upon the Section wise finalizing of the Courses. Once all the Sections are finalized by the Course Instructor then the Course Owner is allowed to finalize the complete Course.

NOTE: The Status of the Course - CIA Attainment is displayed in the table.

i. If all the Sections of the Courses are finalized, then the Status will be displayed as - 'CIA Attainment is Finalized'.

ii. If all the Sections of the Courses are not finalized, then the Status will be displayed as - 'CIA Attainment is not Finalized'.`,
  },
  {
    id: "course-mte",
    title: "b. Course MTE Attainment",
    content: `All the Courses depending upon the Section will be displayed. Here the MTE Finalize depends upon the Section wise finalizing of the Courses. Once all the Sections are finalized by the Course Instructor then the Course Owner is allowed to finalize the complete Course.

NOTE: The Status of the Course - MTE Attainment is displayed in the table.

i. If all the Sections of the Courses are finalized, then the Status will be displayed as - 'MTE Attainment is Finalized'.

ii. If all the Sections of the Courses are not finalized, then the Status will be displayed as - 'MTE Attainment is not Finalized'.`,
  },
  {
    id: "finalize-course",
    title: "c. Finalize Course ? CO Attainment",
    content: `All the CIA Occasions of the selected Course should be finalized, and then we will get the CO Attainment depending on which we will get the PO Attainment.

i. Select the type from the 'Type' drop-down list.

In this the, when both the type i.e. CIA and TEE/ESE is selected then the Attainment value is displayed by applying the Weightage.

For example, if the calculated value for CIA Attainment is 75%, MTE Attainment is 60% and TEE/ESE Attainment is 80%. And the Weightage value is CIA Weightage/Attainment = 40%,

MTE Weightage/Attainment = 20% and TEE/ESE Weightage/Attainment = 40%. Then the Overall Attainment % will be,

After applying the weightage the Attainment value are,

After weightage CIA Attainment = 40% of 80 = 32

After weightage MTE Attainment = 20% of 60 = 12

After weightage TEE/ESE Attainment = 40% of 75 = 30

Overall Attainment = After weightage CIA Attainment + After weightage MTE Attainment

                    + After weightage TEE/ESE Attainment

                    = 32 + 12 + 30

                    = 74

Overall Attainment = 74%`,
  },
  {
    id: "blooms-level",
    title: "d. Course ? Bloom?s Level Attainment",
    content: `i. Select the type from the 'Type' drop-down list.

NOTE: If TEE/ESE is selected then skip the Step iii and Step iv.

ii. Select the section from the 'Section' drop-down list.
iii. Select the CIA Occasion from the 'CIA Occasion' drop-down list.
iv. Select the Student from the 'Student' drop-down list.`,
  },
  {
    id: "direct-indirect",
    title: "e. Direct and Indirect Attainment",
    content: `i. Select the Survey from the drop-down list.
ii. Enter the Direct Attainment value.
iii. Enter the Indirect Attainment value.

NOTE: For this the respective Survey needs to be closed survey.

iv. Select the Submit button to submit the entered details.

For example, if the Direct Attainment value is 75% and the value from Survey calculation i.e. Indirect Attainment value is 85%. Now after selecting the Survey, respective Direct and indirect attainment value defined as,

Direct Attainment = 80% and Indirect Attainment = 20%

Then,

Attainment value = (80% of 75) + (20% of 85)

                 = 60 + 17

                 = 77

Attainment value = 77%`,
  },
] as const;

type CourseCoAttainmentHelpTopic = (typeof helpTopics)[number];

const CourseCoAttainmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [isLogOpen, setIsLogOpen] = React.useState(false);
  const [isFinalizeWarningOpen, setIsFinalizeWarningOpen] = React.useState(false);
  const [isDrilldownOpen, setIsDrilldownOpen] = React.useState(false);
  const [isDrilldownLoading, setIsDrilldownLoading] = React.useState(false);
  const [drilldownError, setDrilldownError] = React.useState("");
  const [drilldownData, setDrilldownData] = React.useState<CourseCoAttainmentDrilldownData | null>(null);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isFinalizeTypeOpen, setIsFinalizeTypeOpen] = React.useState(false);
  const [activeHelpTopicId, setActiveHelpTopicId] = React.useState<string | null>(null);
  const exportRef = React.useRef<HTMLDivElement | null>(null);
  const finalizeTypeRef = React.useRef<HTMLDivElement | null>(null);
  const {
    activeTab,
    filters,
    filterOptions,
    isLoading,
    isExporting,
    tabData,
    hasCourseSelected,
    isTermDisabled,
    isCourseDisabled,
    selectedFinalizeTypeIds,
    selectedBloomOccasion,
    selectedBloomSection,
    selectedBloomStudent,
    selectedBloomType,
    selectedSurveyId,
    setActiveTab,
    handleFilterChange,
    setSelectedFinalizeTypeIds,
    setSelectedBloomOccasion,
    setSelectedBloomSection,
    setSelectedBloomStudent,
    setSelectedBloomType,
    handleDirectIndirectSurveyChange,
    handleDirectIndirectWeightChange,
    handleDirectIndirectSubmit,
    handleExport,
  } = useCourseCoAttainment();

  const selectedCurriculumLabel =
    filterOptions.curriculums.find((curriculum: CourseCoAttainmentOption) => curriculum.id === filters.curriculumId)?.label || "";
  const selectedTermLabel =
    filterOptions.terms.find((term: CourseCoAttainmentOption) => term.id === filters.termId)?.label || "";
  const selectedCourseLabel =
    filterOptions.courses.find((course: CourseCoAttainmentOption) => course.id === filters.courseId)?.label || "";

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
      if (finalizeTypeRef.current && !finalizeTypeRef.current.contains(event.target as Node)) {
        setIsFinalizeTypeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const finalizeTypeOptions = (tabData?.finalize.typeOptions ?? []).filter(
    (option: FinalizeOccasionOption) => option.id !== "all-selected"
  );
  const allFinalizeTypesSelected =
    finalizeTypeOptions.length > 0 &&
    finalizeTypeOptions.every((option: FinalizeOccasionOption) => selectedFinalizeTypeIds.includes(option.id));
  const finalizeTypeButtonLabel = !selectedFinalizeTypeIds.length
    ? "Select Occasions"
    : allFinalizeTypesSelected
      ? "All selected"
      : selectedFinalizeTypeIds.length === 1
        ? finalizeTypeOptions.find((option: FinalizeOccasionOption) => option.id === selectedFinalizeTypeIds[0])?.label ||
          "1 selected"
        : `${selectedFinalizeTypeIds.length} selected`;

  const toggleFinalizeTypeSelection = (typeId: string) => {
    setSelectedFinalizeTypeIds((currentTypeIds) =>
      currentTypeIds.includes(typeId)
        ? currentTypeIds.filter((currentTypeId) => currentTypeId !== typeId)
        : [...currentTypeIds, typeId]
    );
  };

  const toggleAllFinalizeTypes = () => {
    setSelectedFinalizeTypeIds(allFinalizeTypesSelected ? [] : finalizeTypeOptions.map((option) => option.id));
  };

  const openHelpModal = () => {
    setActiveHelpTopicId(null);
    setIsHelpOpen(true);
  };

  const closeHelpModal = () => {
    setIsHelpOpen(false);
    setActiveHelpTopicId(null);
  };

  const closeDrilldownModal = () => {
    setIsDrilldownOpen(false);
    setIsDrilldownLoading(false);
    setDrilldownError("");
    setDrilldownData(null);
  };

  const handleDrilldownClick = async (row: CoAttainmentRow) => {
    if (!filters.curriculumId || !filters.termId || !filters.courseId || !row.coId) {
      return;
    }

    setIsDrilldownOpen(true);
    setIsDrilldownLoading(true);
    setDrilldownError("");

    try {
      const response = await courseCoAttainmentApi.getCloDrilldown(
        filters.curriculumId,
        filters.termId,
        filters.courseId,
        row.coId
      );
      setDrilldownData(response);
    } catch (error) {
      console.error("Failed to load Course CO drilldown:", error);
      setDrilldownError("Unable to load the selected CO drilldown right now.");
    } finally {
      setIsDrilldownLoading(false);
    }
  };

  const renderHelpButton = (className = "") => (
    <button
      type="button"
      title="Web Help"
      onClick={openHelpModal}
      className={`inline-flex items-center justify-center text-[18px] text-[#437880] transition hover:text-[#315f68] ${className}`}
    >
      <FaQuestionCircle />
    </button>
  );

  const toggleHelpTopic = (topicId: string) => {
    setActiveHelpTopicId((currentTopicId) => (currentTopicId === topicId ? null : topicId));
  };

  const renderModal = (
    isOpen: boolean,
    title: string,
    children: React.ReactNode,
    onClose: () => void,
    maxWidth = "max-w-5xl"
  ) => {
    if (!isOpen) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-6">
        <div className={`flex max-h-[88vh] w-full ${maxWidth} flex-col overflow-hidden rounded-lg bg-white shadow-2xl`}>
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-2xl font-bold leading-none text-gray-300 hover:text-gray-500"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6 text-sm leading-6 text-gray-800">
            {children}
          </div>
          <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-[#d9534f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c9423e]"
            >
              × Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleFinalizeLinkClick = (type: "cce" | "mte") => {
    navigate(type === "cce" ? "/attainment/cia_attainment" : "/attainment/mte_data_import");
  };

  const expandFinalizeWarningLines = (lines: string[]) => {
    if (!lines.length) {
      return [];
    }

    const expandedLines: string[] = [];
    const hasCceWarning = lines.some((line) => line.includes("CCE is not Finalized"));
    const hasMteWarning = lines.some((line) => line.includes("MTE Attainment is not Finalized"));
    const hasSeeWarning = lines.some((line) => line.includes("SEE marks not uploaded"));

    if (hasCceWarning) {
      expandedLines.push("CCE is not Finalized for this course.");
      expandedLines.push(
        'Kindly refer the first tab "CCE - COs Attainment (Section/Division wise)" to know the Course CCE Finalize status.'
      );
      expandedLines.push("Click here to Finalize course.");
    }

    if (hasMteWarning) {
      expandedLines.push("MTE Attainment is not Finalized for this course.");
      expandedLines.push("Click here to Finalize course MTE data.");
    }

    if (hasSeeWarning) {
      expandedLines.push("SEE marks not uploaded for this course.");
      expandedLines.push("Click here to Upload Marks.");
    }

    return expandedLines.length ? expandedLines : lines;
  };

  const renderFinalizeStatusLine = (line: string) => {
    if (line.includes("Click here to Finalize course") && !line.includes("MTE")) {
      return (
        <button
          key={line}
          type="button"
          onClick={() => navigate("/attainment/cia_attainment")}
          className="block w-full font-semibold text-blue-600 hover:underline"
        >
          {line}
        </button>
      );
    }

    if (line.includes("Click here to Finalize course MTE data")) {
      return (
        <button
          key={line}
          type="button"
          onClick={() => navigate("/attainment/mte_data_import")}
          className="block w-full font-semibold text-blue-600 hover:underline"
        >
          {line}
        </button>
      );
    }

    if (line.includes("Click here to Upload Marks")) {
      return (
        <button
          key={line}
          type="button"
          onClick={() => navigate("/attainment/see_data_import")}
          className="block w-full font-semibold text-blue-600 hover:underline"
        >
          {line}
        </button>
      );
    }

    return (
      <div key={line} className="font-semibold text-red-500">
        {line}
      </div>
    );
  };

  const renderEmptyStateRow = (message: string, colSpan: number) => (
    <tr>
      <td colSpan={colSpan} className={`${bodyCellClass} py-6 text-center text-gray-500`}>
        {message}
      </td>
    </tr>
  );

  const renderDrilldownModalContent = () => {
    const assessmentRows = drilldownData?.assessmentRows ?? [];
    const assessmentByType = assessmentRows.reduce<Record<string, CourseCoAttainmentDrilldownAssessmentRow>>(
      (accumulator, row) => {
        accumulator[row.assessmentType] = row;
        return accumulator;
      },
      {}
    );
    const cceRow = assessmentByType.CIA;
    const mteRow = assessmentByType.MTE;
    const seeRow = assessmentByType.TEE;

    if (isDrilldownLoading) {
      return <div className="py-8 text-center text-sm text-gray-500">Loading drilldown details...</div>;
    }

    if (drilldownError) {
      return <div className="py-8 text-center text-sm font-medium text-red-500">{drilldownError}</div>;
    }

    if (!drilldownData) {
      return <div className="py-8 text-center text-sm text-gray-500">No drilldown data available.</div>;
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
          <div><span className="font-semibold">Curriculum:</span> {toDisplayValue(selectedCurriculumLabel)}</div>
          <div><span className="font-semibold">Term:</span> {toDisplayValue(selectedTermLabel)}</div>
          <div><span className="font-semibold">Course:</span> {toDisplayValue(selectedCourseLabel)}</div>
          <div><span className="font-semibold">CCE Weightage:</span> {toDisplayValue(drilldownData.weights?.cia)}</div>
          <div><span className="font-semibold">MTE Weightage:</span> {toDisplayValue(drilldownData.weights?.mte)}</div>
          <div><span className="font-semibold">SEE Weightage:</span> {toDisplayValue(drilldownData.weights?.tee)}</div>
          <div className="md:col-span-2">
            <span className="font-semibold">CO Statement for {toDisplayValue(drilldownData.clo?.coCode)}:</span>{" "}
            {toDisplayValue(drilldownData.clo?.coStatement)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={headerCellClass}>Actual CCE Attainment % (Level)</th>
                <th className={headerCellClass}>Actual MTE Attainment % (Level)</th>
                <th className={headerCellClass}>Actual SEE Attainment % (Level)</th>
                <th className={headerCellClass}>After Weightage CCE Attainment % (Level)</th>
                <th className={headerCellClass}>After Weightage MTE Attainment % (Level)</th>
                <th className={headerCellClass}>After Weightage SEE Attainment % (Level)</th>
                <th className={headerCellClass}>Overall Attainment % (CCE + SEE + MTE) (Level)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="odd:bg-white even:bg-gray-50">
                <td className={bodyCellClass}>
                  {formatPercentLevel(cceRow?.actualAttainmentPercent ?? null, cceRow?.actualAttainmentLevel ?? null)}
                </td>
                <td className={bodyCellClass}>
                  {formatPercentLevel(mteRow?.actualAttainmentPercent ?? null, mteRow?.actualAttainmentLevel ?? null)}
                </td>
                <td className={bodyCellClass}>
                  {formatPercentLevel(seeRow?.actualAttainmentPercent ?? null, seeRow?.actualAttainmentLevel ?? null)}
                </td>
                <td className={bodyCellClass}>
                  {formatPercentLevel(
                    cceRow?.afterWeightageAttainmentPercent ?? null,
                    cceRow?.afterWeightageAttainmentLevel ?? null
                  )}
                </td>
                <td className={bodyCellClass}>
                  {formatPercentLevel(
                    mteRow?.afterWeightageAttainmentPercent ?? null,
                    mteRow?.afterWeightageAttainmentLevel ?? null
                  )}
                </td>
                <td className={bodyCellClass}>
                  {formatPercentLevel(
                    seeRow?.afterWeightageAttainmentPercent ?? null,
                    seeRow?.afterWeightageAttainmentLevel ?? null
                  )}
                </td>
                <td className={bodyCellClass}>
                  {formatPercentLevel(
                    drilldownData.overall?.overallAttainmentPercentDisplay ?? null,
                    drilldownData.overall?.overallAttainmentLevel ?? null
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAttainmentTab = (type: "cce" | "mte") => {
    if (!tabData) {
      return null;
    }

    const tableData = tabData[type];
    const sectionTitle =
      tableData.title ||
      (type === "cce" ? "CCE - COs Attainment List" : "MTE - COs Attainment List");

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)]">
          <div className={cardClass}>
            <div className={`${cardHeaderClass} flex items-center justify-between gap-3`}>
              <h4 className={sectionTitleClass}>{sectionTitle}</h4>
              {renderHelpButton()}
            </div>
            <div className="space-y-4 p-4">
              {tableData.sections.length > 0 ? (
                tableData.sections.map((section: CourseCoAttainmentSectionBlock) => (
                  <div key={section.id} className="rounded-md border border-gray-200">
                    <div className="flex flex-col gap-2 border-b border-gray-200 bg-white px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                      <div className="font-semibold text-gray-800">
                        Section / Division - {section.sectionLabel}
                        {section.batchLabel ? ` - Batch ${section.batchLabel}` : ""}
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-gray-800">Status: </span>
                        <span
                          className={
                            section.statusTone === "success"
                              ? "font-semibold text-emerald-600"
                              : "font-semibold text-orange-500"
                          }
                        >
                          {section.statusText}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className={tableClass}>
                        <thead>
                          <tr>
                            <th className={headerCellClass}>CO Code</th>
                            <th className={headerCellClass}>Threshold based Attainment %</th>
                            <th className={headerCellClass}>Attainment Level</th>
                            <th className={headerCellClass}>Average based Attainment %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.length > 0
                            ? section.rows.map((row: CoAttainmentRow) => (
                                <tr key={`${section.id}-${row.coCode}`} className="odd:bg-white even:bg-gray-50">
                                  <td className={bodyCellClass}>{row.coCode}</td>
                                  <td className={bodyCellClass}>{row.thresholdBasedAttainmentPercent}</td>
                                  <td className={bodyCellClass}>{row.attainmentLevel}</td>
                                  <td className={bodyCellClass}>{row.averageBasedAttainmentPercent}</td>
                                </tr>
                              ))
                            : renderEmptyStateRow(
                                `No ${type === "cce" ? "CCE" : "MTE"} attainment rows available.`,
                                4
                              )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col gap-2 px-4 py-3 text-sm text-gray-800 md:flex-row md:items-center md:justify-between">
                      <div>
                        <span className="font-semibold">Actual Course Attainment:</span>{" "}
                        {section.summary.actualCourseAttainment}
                      </div>
                      <div>
                        <span className="font-semibold">Course Attainment After Weightage:</span>{" "}
                        {section.summary.courseAttainmentAfterWeightage}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
                  No {type === "cce" ? "CCE" : "MTE"} section-wise attainment data available.
                </div>
              )}

              {tableData.finalizeLinkText ? (
                <button
                  type="button"
                  onClick={() => handleFinalizeLinkClick(type)}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {tableData.finalizeLinkText}
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className={cardClass}>
              <div className={`${cardHeaderClass} flex items-center justify-between gap-3`}>
                <h4 className={sectionTitleClass}>{tabData.targetLevels.title}</h4>
                {renderHelpButton()}
              </div>
              <div className="overflow-x-auto p-4">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={headerCellClass}>Attainment Level Name</th>
                      <th className={headerCellClass}>Attainment Level Value</th>
                      <th className={headerCellClass}>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabData.targetLevels.rows.map((row: TargetLevelRow) => (
                      <tr key={row.attainmentLevelName} className="odd:bg-white even:bg-gray-50">
                        <td className={bodyCellClass}>{row.attainmentLevelName}</td>
                        <td className={bodyCellClass}>{row.attainmentLevelValue}</td>
                        <td className={bodyCellClass}>{row.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {type === "cce" ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsFinalizeWarningOpen(true)}
                  className={greenButtonClass}
                >
                  {tabData.targetLevels.publishButtonLabel}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className={cardClass}>
          <div className="border-b border-gray-200 px-4 py-3 text-sm text-gray-700">
            <span className="font-semibold">Note:</span> {tabData.noteSection.note}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {tabData.noteSection.formulas.map((formula: FormulaCard, index: number) => (
              <div
                key={formula.title}
                className={`space-y-2 px-4 py-3 text-sm text-gray-800 ${
                  index > 0 ? "border-t border-gray-200 md:border-l md:border-t-0" : ""
                }`}
              >
                <div className="font-semibold">{formula.title}</div>
                {formula.lines.map((line: string) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCompactChart = (chartPoints: CompactChartPoint[], legendLabel = "Threshold %") => (
    <div className="rounded-md border border-gray-200 bg-[#fdfcf6] p-4">
      <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-4">
        <div className="relative h-72">
          {chartAxisLevels.map((level: number) => (
            <div
              key={`axis-${level}`}
              className="absolute left-0 right-0"
              style={{ bottom: `${level}%`, transform: "translateY(50%)" }}
            >
              <span className="block text-xs font-medium text-gray-500">{level}%</span>
            </div>
          ))}
        </div>

        <div className="relative h-72 border-l border-b border-gray-300">
          {chartAxisLevels.map((level: number) => (
            <div
              key={`grid-${level}`}
              className="absolute left-0 right-0 border-t border-gray-200"
              style={{ bottom: `${level}%` }}
            />
          ))}

          <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-around gap-4 px-4">
            {chartPoints.map((point: CompactChartPoint) => (
              <div key={point.label} className="flex h-full min-w-0 flex-1 items-end justify-center gap-2">
                <div className="flex h-full flex-col items-center justify-end">
                  <span className="mb-2 text-[11px] font-medium text-gray-600">{formatPercent(point.thresholdPercent)}</span>
                  <div className="w-5 rounded-t-sm shadow-sm" style={{ backgroundColor: primarySeriesColor, height: `${Math.max(point.thresholdPercent, 0)}%` }} />
                </div>
                <div className="flex h-full flex-col items-center justify-end">
                  <span className="mb-2 text-[11px] font-medium text-gray-600">{formatPercent(point.attainmentPercent)}</span>
                  <div className="w-5 rounded-t-sm shadow-sm" style={{ backgroundColor: secondarySeriesColor, height: `${Math.max(point.attainmentPercent, 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 ml-[72px] flex items-start justify-between gap-4">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {chartPoints.map((point: CompactChartPoint) => (
            <div key={`label-${point.label}`} className="text-center text-sm font-semibold text-gray-700">
              {point.label}
            </div>
          ))}
        </div>

        <div className="flex shrink-0 flex-col gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
          <div className="inline-flex items-center gap-2">
            <span className="h-3 w-3" style={{ backgroundColor: primarySeriesColor }} />
            {legendLabel}
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-3 w-3" style={{ backgroundColor: secondarySeriesColor }} />
            Average based Attainment %
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinalizeTab = () => {
    if (!tabData) {
      return null;
    }

    const finalizeStatusLines = expandFinalizeWarningLines(tabData.finalize.statusMessage?.lines ?? []);
    const pendingPreview = tabData.finalize.pendingPreview;

    return (
      <div className="space-y-5">
        <div className={cardClass}>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4 md:max-w-xs">
              <div ref={finalizeTypeRef}>
                <label className={labelClass}>
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFinalizeTypeOpen((currentState) => !currentState)}
                    className={`${selectClassName} flex items-center justify-between text-left`}
                  >
                    <span className="truncate">{finalizeTypeButtonLabel}</span>
                    <FaChevronDown size={10} className="text-gray-700" />
                  </button>

                  {isFinalizeTypeOpen ? (
                    <div className="absolute left-0 top-[42px] z-20 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                      <label className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 font-medium text-[#437880]">
                        <input
                          type="checkbox"
                          checked={allFinalizeTypesSelected}
                          onChange={toggleAllFinalizeTypes}
                          className="h-4 w-4"
                        />
                        Select All
                      </label>
                      {finalizeTypeOptions.map((option: FinalizeOccasionOption) => (
                        <label key={option.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedFinalizeTypeIds.includes(option.id)}
                            onChange={() => toggleFinalizeTypeSelection(option.id)}
                            className="h-4 w-4"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 inline-flex rounded bg-[#d9ecf7] px-4 py-2 text-sm font-semibold text-[#4b7f9e]">
              {tabData.finalize.note}
            </div>

            {finalizeStatusLines.length > 0 ? (
              <div className="mt-4 rounded-md border border-gray-200 bg-white px-4 py-6 text-center text-sm">
                {finalizeStatusLines.map((line: string) => renderFinalizeStatusLine(line))}
              </div>
            ) : null}
          </div>
        </div>

        {pendingPreview ? (
          <div className="space-y-5">
            <div className={cardClass}>
              <div className={`${cardHeaderClass} flex items-center justify-between gap-3`}>
                <h4 className={sectionTitleClass}>{pendingPreview.title}</h4>
                {renderHelpButton()}
              </div>
              <div className="p-4">{renderCompactChart(pendingPreview.chartPoints, pendingPreview.legendLabel)}</div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className={cardClass}>
                <div className={cardHeaderClass}>
                  <h4 className={sectionTitleClass}>{pendingPreview.targetLevels.title}</h4>
                </div>
                <div className="overflow-x-auto p-4">
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={headerCellClass}>Sl No.</th>
                        <th className={headerCellClass}>Attainment Level Name</th>
                        <th className={headerCellClass}>Attainment Level Value</th>
                        {pendingPreview.targetLevels.columns.map((column) => (
                          <th key={column.assessmentType} className={headerCellClass}>
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPreview.targetLevels.rows.length > 0
                        ? pendingPreview.targetLevels.rows.map((row) => (
                            <tr key={`${row.serialNo}-${row.attainmentLevelValue}`} className="odd:bg-white even:bg-gray-50">
                              <td className={bodyCellClass}>{row.serialNo}</td>
                              <td className={bodyCellClass}>{row.attainmentLevelName}</td>
                              <td className={bodyCellClass}>{row.attainmentLevelValue}</td>
                              {pendingPreview.targetLevels.columns.map((column) => (
                                <td key={`${row.serialNo}-${column.assessmentType}`} className={bodyCellClass}>
                                  {row.targets.find((target) => target.assessmentType === column.assessmentType)?.value || "-"}
                                </td>
                              ))}
                            </tr>
                          ))
                        : renderEmptyStateRow("No target level preview data available.", pendingPreview.targetLevels.columns.length + 3)}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={cardClass}>
                <div className={cardHeaderClass}>
                  <h4 className={sectionTitleClass}>{pendingPreview.overallCourseOutcomesTitle}</h4>
                </div>
                <div className="overflow-x-auto p-4">
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={headerCellClass}>Sl No.</th>
                        <th className={headerCellClass}>CO Code</th>
                        <th className={headerCellClass}>Threshold based Attainment %</th>
                        <th className={headerCellClass}>Attainment Level</th>
                        <th className={headerCellClass}>Average based Attainment %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPreview.overallCourseOutcomesRows.length > 0
                        ? pendingPreview.overallCourseOutcomesRows.map((row, index) => (
                            <tr key={`preview-${row.coCode}`} className="odd:bg-white even:bg-gray-50">
                              <td className={bodyCellClass}>{index + 1}</td>
                              <td className={bodyCellClass}>{row.coCode}</td>
                              <td className={bodyCellClass}>
                                <div>{row.thresholdBasedAttainmentPercent}</div>
                                {row.drillDownAvailable ? (
                                  <button
                                    type="button"
                                    onClick={() => void handleDrilldownClick(row)}
                                    disabled={!row.coId}
                                    className="mt-1 text-xs font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
                                  >
                                    drill down
                                  </button>
                                ) : null}
                              </td>
                              <td className={bodyCellClass}>{row.attainmentLevel}</td>
                              <td className={bodyCellClass}>{row.averageBasedAttainmentPercent}</td>
                            </tr>
                          ))
                        : renderEmptyStateRow("No preview course attainment rows available.", 5)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-5">
            <div className={cardClass}>
              <div className={cardHeaderClass}>
                <h4 className={sectionTitleClass}>{tabData.finalize.finalizedTableTitle}</h4>
              </div>
              <div className="overflow-x-auto p-4">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={headerCellClass}>CO Code</th>
                      <th className={headerCellClass}>CO Statement</th>
                      <th className={headerCellClass}>Threshold based Attainment %</th>
                      <th className={headerCellClass}>Attainment Level</th>
                      <th className={headerCellClass}>Average based Threshold %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabData.finalize.finalizedRows.length > 0
                      ? tabData.finalize.finalizedRows.map((row: FinalizeCourseOverviewRow) => (
                          <tr key={row.coCode} className="odd:bg-white even:bg-gray-50">
                            <td className={bodyCellClass}>{row.coCode}</td>
                            <td className={bodyCellClass}>{row.coStatement}</td>
                            <td className={bodyCellClass}>{row.thresholdBasedAttainmentPercent}</td>
                            <td className={bodyCellClass}>{row.attainmentLevel}</td>
                            <td className={bodyCellClass}>{row.averageBasedThresholdPercent}</td>
                          </tr>
                        ))
                      : renderEmptyStateRow("No finalized course attainment rows available.", 5)}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={cardClass}>
              <div className={cardHeaderClass}>
                <h4 className={sectionTitleClass}>{tabData.finalize.coPoMatrixTitle}</h4>
              </div>
              <div className="overflow-x-auto p-4">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={headerCellClass}>CO</th>
                      {tabData.finalize.coPoMatrixColumns.map((column: string) => (
                        <th key={column} className={headerCellClass}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tabData.finalize.coPoMatrixRows.length > 0
                      ? tabData.finalize.coPoMatrixRows.map((row: CoPoMatrixRow) => (
                          <tr key={row.coCode} className="odd:bg-white even:bg-gray-50">
                            <td className={bodyCellClass}>{row.coCode}</td>
                            {row.values.map((value: string, index: number) => (
                              <td key={`${row.coCode}-${index}`} className={bodyCellClass}>
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))
                      : renderEmptyStateRow("No CO to PO matrix data available.", tabData.finalize.coPoMatrixColumns.length + 1)}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
              <div className={cardClass}>
                <div className={cardHeaderClass}>
                  <h4 className={sectionTitleClass}>{tabData.finalize.programOutcomesTitle}</h4>
                </div>
                <div className="overflow-x-auto p-4">
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={headerCellClass}>Sl No.</th>
                        <th className={headerCellClass}>Program Outcomes</th>
                        <th className={headerCellClass}>Attainment based on Threshold method %</th>
                        <th className={headerCellClass}>Attainment Level</th>
                        <th className={headerCellClass}>Attainment based on Weighted Average Method %</th>
                        <th className={headerCellClass}>Attainment Level</th>
                        <th className={headerCellClass}>Attainment based on Relative Weighted Average Method %</th>
                        <th className={headerCellClass}>Attainment Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabData.finalize.programOutcomeRows.length > 0
                        ? tabData.finalize.programOutcomeRows.map((row: ProgramOutcomeAttainmentRow) => (
                            <tr key={row.serialNo} className="odd:bg-white even:bg-gray-50">
                              <td className={bodyCellClass}>{row.serialNo}</td>
                              <td className={bodyCellClass}>{row.programOutcome}</td>
                              <td className={bodyCellClass}>{row.thresholdMethodPercent}</td>
                              <td className={bodyCellClass}>{row.thresholdMethodLevel}</td>
                              <td className={bodyCellClass}>{row.weightedAveragePercent}</td>
                              <td className={bodyCellClass}>{row.weightedAverageLevel}</td>
                              <td className={bodyCellClass}>{row.relativeWeightedAveragePercent}</td>
                              <td className={bodyCellClass}>{row.relativeWeightedAverageLevel}</td>
                            </tr>
                          ))
                        : renderEmptyStateRow("No program outcome attainment data available.", 8)}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={cardClass}>
                <div className={cardHeaderClass}>
                  <h4 className={sectionTitleClass}>{tabData.finalize.mapLevelWeightageTitle}</h4>
                </div>
                <div className="overflow-x-auto p-4">
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={headerCellClass}>Sl No.</th>
                        <th className={headerCellClass}>Map Level</th>
                        <th className={headerCellClass}>Value</th>
                        <th className={headerCellClass}>Map Level Weightage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabData.finalize.mapLevelWeightageRows.length > 0
                        ? tabData.finalize.mapLevelWeightageRows.map((row: MapLevelWeightageRow) => (
                            <tr key={row.serialNo} className="odd:bg-white even:bg-gray-50">
                              <td className={bodyCellClass}>{row.serialNo}</td>
                              <td className={bodyCellClass}>{row.mapLevel}</td>
                              <td className={bodyCellClass}>{row.value}</td>
                              <td className={bodyCellClass}>{row.mapLevelWeightage}</td>
                            </tr>
                          ))
                        : renderEmptyStateRow("No map level weightage data available.", 4)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <div className="border-b border-gray-200 px-4 py-3 text-sm text-gray-700">
                <span className="font-semibold">Note:</span> The Attainment % for respective columns is calculated using the below formula.
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {tabData.finalize.calculationNotes.map((note: FormulaCard, index: number) => (
                  <div
                    key={note.title}
                    className={`space-y-2 px-4 py-3 text-sm text-gray-800 ${
                      index > 0 ? "border-t border-gray-200 lg:border-l lg:border-t-0" : ""
                    }`}
                  >
                    <div className="font-semibold">{note.title}</div>
                    {note.lines.map((line: string) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
        </div>
      </div>
    );
  };

  const renderBloomsTab = () => {
    if (!tabData) {
      return null;
    }

    const chartPoints = tabData.blooms.chartPoints;
    const isCiaBloomType = selectedBloomType !== "tee";

    return (
      <div className="space-y-5">
        <div className={cardClass}>
          <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-4">
            <div>
              <label className={labelClass}>
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBloomType}
                onChange={(event) => setSelectedBloomType(event.target.value)}
                className={selectClassName}
              >
                {tabData.blooms.typeOptions.map((option: CourseCoAttainmentOption) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {isCiaBloomType ? (
              <>
                <div>
                  <label className={labelClass}>
                    Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBloomSection}
                    onChange={(event) => setSelectedBloomSection(event.target.value)}
                    className={selectClassName}
                  >
                    {tabData.blooms.sectionOptions.map((option: CourseCoAttainmentOption) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    CCE Occasion <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBloomOccasion}
                    onChange={(event) => setSelectedBloomOccasion(event.target.value)}
                    className={selectClassName}
                  >
                    {tabData.blooms.occasionOptions.map((option: CourseCoAttainmentOption) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
            {selectedBloomType ? (
              <div>
                <label className={labelClass}>Student</label>
                <select
                  value={selectedBloomStudent}
                  onChange={(event) => setSelectedBloomStudent(event.target.value)}
                  className={selectClassName}
                >
                  {tabData.blooms.studentOptions.map((option: CourseCoAttainmentOption) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>

        <div className={cardClass}>
          <div className={`${cardHeaderClass} flex items-center justify-between gap-3`}>
            <h4 className={sectionTitleClass}>{tabData.blooms.chartTitle}</h4>
            {renderHelpButton()}
          </div>
          <div className="space-y-5 p-4">
            {tabData.blooms.messages.length ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {tabData.blooms.messages.map((message) => (
                  <div key={message}>{message}</div>
                ))}
              </div>
            ) : null}
            <div className="rounded-md border border-gray-200 bg-[#fdfcf6] p-4">
              <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-4">
                <div className="relative h-72">
                  {chartAxisLevels.map((level: number) => {
                    const bottomPercent = level;
                    return (
                      <div
                        key={level}
                        className="absolute left-0 right-0"
                        style={{ bottom: `${bottomPercent}%`, transform: "translateY(50%)" }}
                      >
                        <span className="block text-xs font-medium text-gray-500">
                          {level}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="relative h-72 border-l border-b border-gray-300">
                  {chartAxisLevels.map((level: number) => (
                    <div
                      key={`grid-${level}`}
                      className="absolute left-0 right-0 border-t border-gray-200"
                      style={{ bottom: `${level}%` }}
                    />
                  ))}

                  <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-around gap-4 px-4">
                    {chartPoints.map((point: CompactChartPoint) => (
                      <div key={point.label} className="flex h-full min-w-0 flex-1 items-end justify-center gap-2">
                        <div className="flex h-full flex-col items-center justify-end">
                          <span className="mb-2 text-[11px] font-medium text-gray-600">
                            {formatPercent(point.thresholdPercent)}
                          </span>
                          <div
                            title={point.label}
                            className="w-5 rounded-t-sm bg-[#39ef63] shadow-sm"
                            style={{ height: `${Math.max(point.thresholdPercent, 0)}%` }}
                          />
                        </div>
                        <div className="flex h-full flex-col items-center justify-end">
                          <span className="mb-2 text-[11px] font-medium text-gray-600">
                            {formatPercent(point.attainmentPercent)}
                          </span>
                          <div
                            title={point.label}
                            className="w-5 rounded-t-sm bg-[#6bc6d6] shadow-sm"
                            style={{ height: `${Math.max(point.attainmentPercent, 0)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 ml-[72px] flex items-start justify-between gap-4">
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                  {chartPoints.map((point: CompactChartPoint) => (
                    <div key={`label-${point.label}`} className="text-center text-sm font-semibold text-gray-700">
                      {point.label}
                    </div>
                  ))}
                </div>

                <div className="flex shrink-0 flex-col gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <div className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 bg-[#39ef63]" />
                    Threshold %
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 bg-[#6bc6d6]" />
                    Attainment %
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={headerCellClass}>Sl No.</th>
                    <th className={headerCellClass}>Bloom's Level</th>
                    <th className={headerCellClass}>Threshold</th>
                    <th className={headerCellClass}>Attainment</th>
                  </tr>
                </thead>
                <tbody>
                  {tabData.blooms.rows.length > 0
                    ? tabData.blooms.rows.map((row: BloomLevelRow) => (
                        <tr key={row.serialNo} className="odd:bg-white even:bg-gray-50">
                          <td className={bodyCellClass}>{row.serialNo}</td>
                          <td className={bodyCellClass}>{row.bloomLevel}</td>
                          <td className={bodyCellClass}>{row.threshold}</td>
                          <td className={bodyCellClass}>{row.attainment}</td>
                        </tr>
                      ))
                    : renderEmptyStateRow("No Data to Display", 4)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDirectIndirectTab = () => {
    if (!tabData) {
      return null;
    }

    return (
      <div className={cardClass}>
        <div className="space-y-5 p-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_160px_160px]">
            <div>
              <label className={labelClass}>Survey</label>
              <select
                value={selectedSurveyId}
                onChange={(event) => handleDirectIndirectSurveyChange(event.target.value)}
                className={selectClassName}
              >
                <option value="">Select Survey</option>
                {tabData.directIndirect.surveyOptions.map((option: CourseCoAttainmentOption) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Direct Weight <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={tabData.directIndirect.directWeight}
                  onChange={(event) => handleDirectIndirectWeightChange("directWeight", event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">%</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Indirect Weight <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={tabData.directIndirect.indirectWeight}
                  onChange={(event) => handleDirectIndirectWeightChange("indirectWeight", event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">%</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-700">
            <span className="font-semibold">Note:</span>{" "}
            {tabData.directIndirect.note === "Survey needs to be closed to view indirect attainment." ? (
              <>
                Survey needs to be{" "}
                <span className="rounded-full bg-[#c54b49] px-3 py-1 text-white">closed</span> to view
                indirect attainment.
              </>
            ) : (
              tabData.directIndirect.note
            )}
          </div>

          {tabData.directIndirect.validationMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {tabData.directIndirect.validationMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleDirectIndirectSubmit}
              className="rounded-md border border-[#437880] bg-[#437880] px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-[#3a6a71] hover:bg-[#3a6a71]"
            >
              {tabData.directIndirect.submitButtonLabel}
            </button>
          </div>

          {tabData.directIndirect.finalizeMessage ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {tabData.directIndirect.finalizeMessage}
            </div>
          ) : null}

          {tabData.directIndirect.chartPoints.length ? (
            <div className="space-y-3">
              <h4 className={sectionTitleClass}>{tabData.directIndirect.chartTitle}</h4>
              <div className="rounded-md border border-gray-200 bg-[#fdfcf6] p-4">
                <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-4">
                  <div className="relative h-72">
                    {chartAxisLevels.map((level: number) => (
                      <div
                        key={`direct-axis-${level}`}
                        className="absolute left-0 right-0"
                        style={{ bottom: `${level}%`, transform: "translateY(50%)" }}
                      >
                        <span className="block text-xs font-medium text-gray-500">{level}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="relative h-72 border-l border-b border-gray-300">
                    {chartAxisLevels.map((level: number) => (
                      <div
                        key={`direct-grid-${level}`}
                        className="absolute left-0 right-0 border-t border-gray-200"
                        style={{ bottom: `${level}%` }}
                      />
                    ))}

                    <div
                      className="absolute inset-x-0 bottom-0 top-0 grid gap-4 px-4"
                      style={{ gridTemplateColumns: `repeat(${tabData.directIndirect.chartPoints.length}, minmax(0, 1fr))` }}
                    >
                      {tabData.directIndirect.chartPoints.map((point: DirectIndirectChartPoint) => (
                        <div key={point.label} className="flex h-full min-w-0 flex-1 items-end justify-center">
                          <div className="flex h-full w-full max-w-[72px] flex-col items-center justify-end">
                            <span className="mb-2 text-[11px] font-medium text-gray-600">
                              {formatPercent(point.value)}
                            </span>
                            <div
                              className="w-8 rounded-t-sm bg-[#6bc6d6] shadow-sm"
                              style={{ height: `${Math.max(point.value, 0)}%` }}
                              title={point.coStatement ? `${point.coCode ?? point.label} - ${point.coStatement}` : point.coCode ?? point.label}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="absolute bottom-3 right-3 flex shrink-0 flex-col gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                      <div className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 bg-[#6bc6d6]" />
                        CO Attainment %
                      </div>
                    </div>
                  </div>

                  <div />
                  <div
                    className="grid min-w-0 gap-4"
                    style={{ gridTemplateColumns: `repeat(${tabData.directIndirect.chartPoints.length}, minmax(0, 1fr))` }}
                  >
                    {tabData.directIndirect.chartPoints.map((point: DirectIndirectChartPoint) => (
                      <div key={`direct-label-${point.label}`} className="text-center text-sm font-semibold text-gray-700">
                        {point.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {tabData.directIndirect.rows.length ? (
            <div className="space-y-3">
              <h4 className={sectionTitleClass}>Direct and Indirect Attainment Table</h4>
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={headerCellClass}>COs Code</th>
                      <th className={headerCellClass}>Actual Direct Attainment %</th>
                      <th className={headerCellClass}>Actual Direct Attainment Level</th>
                      <th className={headerCellClass}>Actual Indirect Attainment %</th>
                      <th className={headerCellClass}>Actual Indirect Attainment Level</th>
                      <th className={headerCellClass}>Direct Attainment Weightage %</th>
                      <th className={headerCellClass}>Indirect Attainment Weightage %</th>
                      <th className={headerCellClass}>After Weightage Direct Attainment %</th>
                      <th className={headerCellClass}>After Weightage Direct Attainment Level</th>
                      <th className={headerCellClass}>After Weightage Indirect Attainment %</th>
                      <th className={headerCellClass}>After Weightage Indirect Attainment Level</th>
                      <th className={headerCellClass}>Overall Attainment %</th>
                      <th className={headerCellClass}>Attainment Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabData.directIndirect.rows.map((row: DirectIndirectAttainmentRow) => (
                      <tr key={`${row.coCode}-${row.serialNo}`} className="odd:bg-white even:bg-gray-50">
                        <td className={bodyCellClass}>{row.coCode}</td>
                        <td className={bodyCellClass}>{row.actualDirectAttainmentPercent}</td>
                        <td className={bodyCellClass}>{row.actualDirectAttainmentLevel}</td>
                        <td className={bodyCellClass}>{row.actualIndirectAttainmentPercent}</td>
                        <td className={bodyCellClass}>{row.actualIndirectAttainmentLevel}</td>
                        <td className={bodyCellClass}>{row.directPercentage}</td>
                        <td className={bodyCellClass}>{row.indirectPercentage}</td>
                        <td className={bodyCellClass}>{row.afterWeightageDirectAttainmentPercent}</td>
                        <td className={bodyCellClass}>{row.afterWeightageDirectAttainmentLevel}</td>
                        <td className={bodyCellClass}>{row.afterWeightageIndirectAttainmentPercent}</td>
                        <td className={bodyCellClass}>{row.afterWeightageIndirectAttainmentLevel}</td>
                        <td className={bodyCellClass}>{row.overallAttainment}</td>
                        <td className={bodyCellClass}>{row.attainmentLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const shouldShowExportButton =
    exportVisibleTabs.includes(activeTab) &&
    (activeTab !== "directIndirect" || tabData?.directIndirect.previewReady);

  const renderFinalizeWarningModal = () => {
    if (!isFinalizeWarningOpen) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 px-4 pt-[18vh]">
        <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <h3 className="text-lg font-bold text-[#437880]">CIA Finalise Warning !!!</h3>
            <button
              type="button"
              onClick={() => setIsFinalizeWarningOpen(false)}
              className="text-2xl font-bold leading-none text-gray-300 hover:text-gray-500"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 px-5 py-6 text-sm leading-6 text-gray-800">
            <p>
              Finalise the CIA marks under the CIA Data Import menu, then proceed to the
              course-level CIA finalisation option.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsFinalizeWarningOpen(false);
                navigate(ciaDataImportRoute);
              }}
              className="font-medium text-blue-600 hover:underline"
            >
              Click this link to finalise CIA marks.
            </button>
          </div>

          <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-3">
            <button
              type="button"
              onClick={() => setIsFinalizeWarningOpen(false)}
              className="rounded-md bg-[#d9534f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c9423e]"
            >
              × Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full font-['Inter']">
      <div className="flex flex-col gap-4 pb-5 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-bold text-gray-900">Course CO Attainment (CIA, MTE, TEE)</h3>
        <div className="flex items-center gap-2">
          {hasCourseSelected ? (
            <>
              <button
                type="button"
                title="Click to view Log History"
                onClick={() => setIsLogOpen(true)}
                className="inline-flex items-center justify-center text-[18px] text-[#437880] transition hover:text-[#315f68]"
              >
                <FaList />
              </button>
              {renderHelpButton()}
            </>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <CourseCoAttainmentFilters
          filters={filters}
          filterOptions={filterOptions}
          isTermDisabled={isTermDisabled}
          isCourseDisabled={isCourseDisabled}
          onChange={handleFilterChange}
        />

        {!hasCourseSelected ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            Select Curriculum, Term, and Course to view Course CO Attainment.
          </div>
        ) : null}

        {hasCourseSelected ? (
          <>
            {shouldShowExportButton ? (
              <div className="flex justify-end">
                <div ref={exportRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsExportOpen((currentValue) => !currentValue)}
                    className={greenButtonClass}
                  >
                    <FaBook /> Export
                    <span className="text-xs">▼</span>
                  </button>
                  {isExportOpen ? (
                    <div className="absolute right-0 top-full z-20 mt-2 w-24 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportOpen(false);
                          void handleExport("pdf");
                        }}
                        disabled={isExporting}
                        className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                      >
                        <FaFilePdf className="text-red-600" />
                        .pdf
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportOpen(false);
                          void handleExport("doc");
                        }}
                        disabled={isExporting}
                        className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                      >
                        <FaFileWord className="text-blue-600" />
                        .doc
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab: CourseCoAttainmentTabItem) => {
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-t-md border px-4 py-2.5 text-sm transition ${
                        isActive
                          ? "border-gray-300 border-b-white bg-white font-medium text-gray-700"
                          : "border-transparent bg-transparent font-medium text-[#0b79d0] hover:text-[#095e9f]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                Loading Course CO Attainment...
              </div>
            ) : null}

            {!isLoading && activeTab === "cce" ? renderAttainmentTab("cce") : null}
            {!isLoading && activeTab === "mte" ? renderAttainmentTab("mte") : null}
            {!isLoading && activeTab === "finalize" ? renderFinalizeTab() : null}
            {!isLoading && activeTab === "blooms" ? renderBloomsTab() : null}
            {!isLoading && activeTab === "directIndirect" ? renderDirectIndirectTab() : null}
          </>
        ) : null}
      </div>

      {renderModal(
        isDrilldownOpen,
        "CCE , MTE & SEE CO Attainment.",
        renderDrilldownModalContent(),
        closeDrilldownModal,
        "max-w-7xl"
      )}
      {renderModal(
        isHelpOpen,
        "IonCUDOS Help And Support - Course CO Attainment (CIA, MTE, TEE)",
        <div className="space-y-5">
          <div className="text-sm text-gray-800">{helpIntro}</div>
          <div className="font-semibold text-gray-900">Help Topics:</div>
          <div className="space-y-3">
            {helpTopics.map((topic: CourseCoAttainmentHelpTopic) => {
              const isActive = activeHelpTopicId === topic.id;

              return (
                <div key={topic.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggleHelpTopic(topic.id)}
                    className="flex w-full items-start gap-2 text-left text-[15px] font-semibold text-[#0b79d0] hover:text-[#095e9f]"
                  >
                    <FaChevronRight
                      className={`mt-1 shrink-0 text-black transition-transform ${
                        isActive ? "rotate-90" : ""
                      }`}
                    />
                    <span>{topic.title}</span>
                  </button>
                  {isActive ? (
                    <div className="mt-4 whitespace-pre-line pl-6 text-sm leading-7 text-gray-800">
                      {topic.content}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>,
        closeHelpModal,
        "max-w-6xl"
      )}
      {renderModal(
        isLogOpen,
        "Log History for Course - CO Attainment (CCE , MTE , SEE)",
        <div className="py-6 text-base font-semibold text-gray-900">Log history not available.</div>,
        () => setIsLogOpen(false),
        "max-w-5xl"
      )}
      {renderFinalizeWarningModal()}
    </div>
  );
};

export default CourseCoAttainmentPage;
