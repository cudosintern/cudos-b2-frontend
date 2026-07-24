import React from "react";
import { FaChevronRight, FaTimes } from "react-icons/fa";

const redCloseButtonClass =
  "inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700";

const helpTopics = [
  {
    id: "list",
    title: "List Data Analysis",
    lines: [
      "1. Select the school from the ‘School’ drop-down list.",
      "2. Select the program from the ‘Program’ drop-down list.",
      "3. Select the curriculum from the ‘Curriculum’ drop-down list.",
      "4. Select the term from the ‘Term’ drop-down list.",
      "5. Select the course from the ‘Course’ drop-down list.",
      "6. Select the type of examination from the ‘Type’ drop-down list.",
      "7. For CCE or MTE, select the section from the ‘Section’ drop-down list.",
      "8. For CCE or MTE, select the occasion from the ‘Occasion’ drop-down list.",
      "9. For SEE, the report loads after the required selections without an Occasion.",
      "10. Select the ‘Export’ button to export the displayed data when export is available.",
    ],
  },
] as const;

interface DataAnalysisHelpModalProps {
  openTopicIds: string[];
  onClose: () => void;
  onToggleTopic: (topicId: string) => void;
}

const DataAnalysisHelpModal: React.FC<DataAnalysisHelpModalProps> = ({
  openTopicIds,
  onClose,
  onToggleTopic,
}) => (
  <div className="cce-modal-overlay z-[100001]">
    <div className="cce-modal-box cce-modal-box-lg">
      <div
        className="cce-modal-header border-b border-gray-200"
        style={{ backgroundColor: "#f8fafc", color: "#437880" }}
      >
        <span className="cce-modal-title">Data Analysis Help And Support</span>
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
        <h3 className="mb-6 text-[18px] font-bold text-gray-800 underline underline-offset-2">
          Data Analysis
        </h3>
        <p className="mb-16 max-w-none text-[15px] leading-8 text-slate-700">
          In this the User gets the complete Data Analysis Report where PO, Bloom&apos;s level,
          CO, marks, average marks, standard deviation of marks, minimum and maximum marks
          obtained, number of students attempted, percentage of attempt and attainment with
          respect to a Question is displayed.
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
                  <FaChevronRight
                    className={`text-[12px] text-gray-800 transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                  <span>{topic.title}</span>
                </button>

                {isOpen && (
                  <div className="ml-9 mt-3 space-y-1 leading-7 text-gray-700">
                    {topic.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
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

export default DataAnalysisHelpModal;
