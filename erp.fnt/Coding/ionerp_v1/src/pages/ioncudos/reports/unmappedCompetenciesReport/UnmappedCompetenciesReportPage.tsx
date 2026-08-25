import React, { useEffect, useState } from "react";
import Select from "react-select";
import { FileText, File } from "lucide-react";

const CURRICULUM_API =
  "http://localhost:8000/unmapped-competencies/curriculum-dropdown";

const REPORT_API =
  "http://localhost:8000/unmapped-competencies/unmapped-competencies-report";

// ======================================================
// TYPES
// ======================================================
interface OptionItem {
  value: string | number;
  label: string;
}

interface OptionGroup {
  label: string;
  options: OptionItem[];
}

interface CompetencyData {
  po: string;
  competency: string;
}

const UnmappedCompetenciesReportPage = () => {
  // ======================================================
  // STATES
  // ======================================================
  const [curriculumOptions, setCurriculumOptions] = useState<
    OptionGroup[]
  >([]);

  const [selectedCurriculum, setSelectedCurriculum] =
    useState<OptionItem | null>(null);

  const [loading, setLoading] = useState(false);

  const [reportData, setReportData] = useState<
    CompetencyData[]
  >([]);

  // ======================================================
  // FETCH CURRICULUM DROPDOWN
  // ======================================================
  useEffect(() => {
    fetchCurriculumDropdown();
  }, []);

  const fetchCurriculumDropdown = async () => {
    try {
      const response = await fetch(CURRICULUM_API);

      const data = await response.json();

      setCurriculumOptions(data?.data || []);
    } catch (error) {
      console.error("Curriculum dropdown error:", error);
    }
  };

  // ======================================================
  // FETCH REPORT
  // ======================================================
  const fetchReport = async (
    curriculum_id: string | number
  ) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${REPORT_API}?curriculum_id=${curriculum_id}`
      );

      const data = await response.json();

      setReportData(data?.data || []);
    } catch (error) {
      console.error("Report fetch error:", error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // HANDLE CURRICULUM CHANGE
  // ======================================================
  const handleCurriculumChange = (
    selected: OptionItem | null
  ) => {
    setSelectedCurriculum(selected);

    if (selected?.value) {
      fetchReport(selected.value);
    } else {
      setReportData([]);
    }
  };

  // ======================================================
  // EXPORT PDF
  // ======================================================
  const exportPDF = () => {
    if (!selectedCurriculum?.value) return;

    window.open(
      `${REPORT_API}/pdf?curriculum_id=${selectedCurriculum.value}`,
      "_blank"
    );
  };

  // ======================================================
  // EXPORT DOC
  // ======================================================
  const exportDOC = () => {
    if (!selectedCurriculum?.value) return;

    window.open(
      `${REPORT_API}/doc?curriculum_id=${selectedCurriculum.value}`,
      "_blank"
    );
  };

  return (
    <div
      style={{
        padding: "10px",
        background: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}
      <div className="bg-white px-3 py-2 text-[#4f7f82] font-semibold border border-[#d9d9d9]">
        Unmapped Competencies Report
      </div>

      {/* ================================================= */}
      {/* MAIN CARD */}
      {/* ================================================= */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #d1d5db",
          borderTop: "none",
          padding: "10px",
        }}
      >
        {/* ================================================= */}
        {/* TOP SECTION */}
        {/* ================================================= */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          {/* LEFT */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <label
              style={{
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              Curriculum :<span style={{ color: "red" }}> *</span>
            </label>

            <div style={{ width: "320px" }}>
              <Select<OptionItem, false, OptionGroup>
                value={selectedCurriculum}
                onChange={(selected) =>
                  handleCurriculumChange(selected)
                }
                options={curriculumOptions}
                placeholder="Select Curriculum"
                isClearable
                formatGroupLabel={(group) => (
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "11px",
                      color: "#374151",
                      background: "#d1d5db",
                      padding: "4px 8px",
                    }}
                  >
                    {group.label}
                  </div>
                )}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "32px",
                    height: "32px",
                    fontSize: "12px",
                    border: "1px solid #cbd5e1",
                    boxShadow: "none",
                  }),

                  valueContainer: (base) => ({
                    ...base,
                    height: "32px",
                    padding: "0 8px",
                  }),

                  input: (base) => ({
                    ...base,
                    margin: "0px",
                  }),

                  indicatorsContainer: (base) => ({
                    ...base,
                    height: "32px",
                  }),

                  menu: (base) => ({
                    ...base,
                    fontSize: "12px",
                    zIndex: 9999,
                  }),

                  option: (base, state) => ({
                    ...base,
                    fontSize: "12px",
                    paddingLeft: "14px",
                    backgroundColor: state.isSelected
                      ? "#2563eb"
                      : state.isFocused
                        ? "#2563eb"
                        : "#fff",
                    color:
                      state.isSelected || state.isFocused
                        ? "#fff"
                        : "#111827",
                  }),

                  groupHeading: (base) => ({
                    ...base,
                    margin: 0,
                    padding: 0,
                  }),
                }}
              />
            </div>
          </div>

          {/* ================================================= */}
          {/* EXPORT DROPDOWN */}
          {/* ================================================= */}
          <div className="relative group">
            <button
              disabled={!selectedCurriculum}
              className="
                bg-[#4f7f82]
                hover:bg-[#4f7f82]
                text-white
                text-sm
                px-4
                py-2
                rounded
                flex
                items-center
                gap-2
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              <FileText size={16} />
              Export
            </button>

            {selectedCurriculum && (
              <div
                className="
                  absolute
                  right-0
                  top-full
                  mt-1
                  w-28
                  bg-white
                  border
                  border-gray-300
                  shadow-lg
                  rounded-md
                  z-50
                  opacity-0
                  invisible
                  group-hover:opacity-100
                  group-hover:visible
                  transition-all
                  duration-200
                "
              >
                <button
                  onClick={exportPDF}
                  className="
                    w-full
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    text-sm
                    hover:bg-gray-100
                    rounded-t-md
                  "
                >
                  <FileText
                    size={16}
                    className="text-red-600"
                  />
                  .pdf
                </button>

                <button
                  onClick={exportDOC}
                  className="
                    w-full
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    text-sm
                    hover:bg-gray-100
                    rounded-b-md
                  "
                >
                  <File
                    size={16}
                    className="text-blue-600"
                  />
                  .doc
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}
        <div
          style={{
            border: "1px solid #d1d5db",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f3f4f6",
                }}
              >
                <th
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "8px",
                    textAlign: "left",
                    width: "40%",
                    color: "#1d4ed8",
                  }}
                >
                  Program Outcomes (POs)
                </th>

                <th
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "8px",
                    textAlign: "left",
                    color: "#1d4ed8",
                  }}
                >
                  Competencies
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      textAlign: "center",
                      padding: "20px",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : reportData.length > 0 ? (
                reportData.map((item, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "8px",
                        verticalAlign: "top",
                        color: "#7f1d1d",
                      }}
                    >
                      {item.po}
                    </td>

                    <td
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "8px",
                        verticalAlign: "top",
                        color: "#1e3a8a",
                      }}
                    >
                      {item.competency}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#6b7280",
                    }}
                  >
                    No Data Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================================================= */}
        {/* BOTTOM EXPORT */}
        {/* ================================================= */}
        {reportData.length > 0 && (
          <div className="flex justify-end mt-4">
            <div className="relative group">
              <button
                className="
                  bg-[#4f7f82]
                  hover:bg-[#4f7f82]
                  text-white
                  text-sm
                  px-4
                  py-2
                  rounded
                  flex
                  items-center
                  gap-2
                "
              >
                <FileText size={16} />
                Export
              </button>

              <div
                className="
                  absolute
                  right-0
                  top-full
                  mt-1
                  w-28
                  bg-white
                  border
                  border-gray-300
                  shadow-lg
                  rounded-md
                  z-50
                  opacity-0
                  invisible
                  group-hover:opacity-100
                  group-hover:visible
                  transition-all
                  duration-200
                "
              >
                <button
                  onClick={exportPDF}
                  className="
                    w-full
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    text-sm
                    hover:bg-gray-100
                    rounded-t-md
                  "
                >
                  <FileText
                    size={16}
                    className="text-red-600"
                  />
                  .pdf
                </button>

                <button
                  onClick={exportDOC}
                  className="
                    w-full
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    text-sm
                    hover:bg-gray-100
                    rounded-b-md
                  "
                >
                  <File
                    size={16}
                    className="text-blue-600"
                  />
                  .doc
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnmappedCompetenciesReportPage;