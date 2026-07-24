import React from "react";
import { FaFileExport, FaQuestionCircle } from "react-icons/fa";
import DataAnalysisFilters from "./DataAnalysisFilters";
import DataAnalysisHelpModal from "./DataAnalysisHelpModal";
import DataAnalysisReport from "./DataAnalysisReport";
import { useDataAnalysis } from "./useDataAnalysis";
import "../../assessment/cia/cia.css";
import "../cceDataImport/CiaDataImport.css";

const sectionHeaderClass =
  "flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4";
const sectionTitleClass = "text-base font-semibold text-[#437880]";
const cardClass = "w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm";
const exportButtonClass =
  "inline-flex items-center gap-2 rounded-md border border-[#437880] bg-[#437880] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-[#3a6a71] hover:bg-[#3a6a71] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none";
const helpIconClass = "cursor-pointer text-[#437880] transition hover:text-[#315f68]";

const DataAnalysisPage: React.FC = () => {
  const [showHelp, setShowHelp] = React.useState(false);
  const [openHelpTopicIds, setOpenHelpTopicIds] = React.useState<string[]>([]);
  const {
    filters,
    filterOptions,
    reportState,
    pageLoading,
    showSection,
    showOccasion,
    canExport,
    handleFilterChange,
  } = useDataAnalysis();

  const toggleHelpTopic = (topicId: string) => {
    setOpenHelpTopicIds((currentIds) =>
      currentIds.includes(topicId)
        ? currentIds.filter((currentId) => currentId !== topicId)
        : [...currentIds, topicId]
    );
  };

  return (
    <div className="cia-container min-h-screen max-w-full bg-slate-50">
      <div className="w-full min-w-0 space-y-6">
        <div className={cardClass}>
          <div className={sectionHeaderClass}>
            <h2 className={sectionTitleClass}>Data Analysis Report</h2>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              title="Web Help"
              className={helpIconClass}
            >
              <FaQuestionCircle />
            </button>
          </div>

          <div className="space-y-6 px-6 py-6">
            <DataAnalysisFilters
              filters={filters}
              schools={filterOptions.schools}
              programs={filterOptions.programs}
              curricula={filterOptions.curricula}
              terms={filterOptions.terms}
              courses={filterOptions.courses}
              types={filterOptions.types}
              sections={filterOptions.sections}
              occasions={filterOptions.occasions}
              loading={pageLoading || reportState.kind === "loading"}
              showSection={showSection}
              showOccasion={showOccasion}
              onFilterChange={handleFilterChange}
            />

            <div className="flex justify-end">
              <button type="button" className={exportButtonClass} disabled={!canExport}>
                <FaFileExport size={14} />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className={sectionHeaderClass}>
            <h2 className={sectionTitleClass}>Data Series Analysis Report</h2>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              title="Web Help"
              className={helpIconClass}
            >
              <FaQuestionCircle />
            </button>
          </div>

          <DataAnalysisReport reportState={reportState} />
        </div>
      </div>

      {showHelp && (
        <DataAnalysisHelpModal
          openTopicIds={openHelpTopicIds}
          onClose={() => setShowHelp(false)}
          onToggleTopic={toggleHelpTopic}
        />
      )}
    </div>
  );
};

export default DataAnalysisPage;
