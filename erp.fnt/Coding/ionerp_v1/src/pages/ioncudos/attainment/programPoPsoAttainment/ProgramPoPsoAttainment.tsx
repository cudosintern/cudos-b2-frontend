import React, { useEffect, useState } from "react";
import { FileText, ChevronDown } from "lucide-react";
import {
  fetchCurriculums,
  fetchFirstYearCurriculums,
  fetchAssessmentTypes,
  fetchPoPsoReport,
  exportPdf,
  exportDoc,
  CurriculumOption,
  FirstYearCurriculumOption,
  AssessmentTypeOption,
  ProgramPoPsoReportResponse
} from "./service";

const ProgramPoPsoAttainment: React.FC = () => {
  // Filter States
  const [curriculums, setCurriculums] = useState<CurriculumOption[]>([]);
  const [firstYearCurriculums, setFirstYearCurriculums] = useState<FirstYearCurriculumOption[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentTypeOption[]>([]);

  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("");
  const [selectedFirstYearCurriculum, setSelectedFirstYearCurriculum] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  // Export Dropdown State
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Report State
  const [reportData, setReportData] = useState<ProgramPoPsoReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial dropdown options matching screenshots
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [currList, fyList, typeList] = await Promise.all([
          fetchCurriculums(),
          fetchFirstYearCurriculums(),
          fetchAssessmentTypes()
        ]);

        setCurriculums(currList);
        setFirstYearCurriculums(fyList);
        setAssessmentTypes(typeList);

        if (currList.length > 0) {
          setSelectedCurriculum(currList[0].crclm_id.toString());
        }
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };

    loadFilters();
  }, []);

  // Fetch PO & PSO Attainment Report
  const handleGenerateReport = async (currIdStr: string, fyIdStr: string, typeVal: string) => {
    if (!currIdStr) return;

    setError(null);
    setLoading(true);

    try {
      const currId = parseInt(currIdStr, 10);
      const fyId = fyIdStr ? parseInt(fyIdStr, 10) : null;
      const data = await fetchPoPsoReport(currId, fyId, typeVal || "ALL");
      setReportData(data);
    } catch (err: any) {
      console.error("Error fetching report:", err);
      setError("Failed to load PO & PSO attainment report data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCurriculumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCurriculum(val);
    if (val && selectedType) {
      handleGenerateReport(val, selectedFirstYearCurriculum, selectedType);
    }
  };

  const handleFirstYearCurriculumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedFirstYearCurriculum(val);
    if (selectedCurriculum && selectedType) {
      handleGenerateReport(selectedCurriculum, val, selectedType);
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedType(val);
    if (selectedCurriculum && val) {
      handleGenerateReport(selectedCurriculum, selectedFirstYearCurriculum, val);
    }
  };

  const handlePdfExport = () => {
    if (!selectedCurriculum) return;
    const currId = parseInt(selectedCurriculum, 10);
    const fyId = selectedFirstYearCurriculum ? parseInt(selectedFirstYearCurriculum, 10) : null;
    exportPdf(currId, fyId, selectedType || "ALL");
    setShowExportMenu(false);
  };

  const handleDocExport = () => {
    if (!selectedCurriculum) return;
    const currId = parseInt(selectedCurriculum, 10);
    const fyId = selectedFirstYearCurriculum ? parseInt(selectedFirstYearCurriculum, 10) : null;
    exportDoc(currId, fyId, selectedType || "ALL");
    setShowExportMenu(false);
  };

  // Group curriculums by program title (pgm_title)
  const groupedCurriculums: { [key: string]: CurriculumOption[] } = {};
  const ungroupedCurriculums: CurriculumOption[] = [];

  curriculums.forEach((c) => {
    if (c.pgm_title) {
      if (!groupedCurriculums[c.pgm_title]) {
        groupedCurriculums[c.pgm_title] = [];
      }
      groupedCurriculums[c.pgm_title].push(c);
    } else {
      ungroupedCurriculums.push(c);
    }
  });

  return (
    <div className="w-full bg-[#eef2f5] p-4 min-h-screen text-[#333333] font-sans">
      {/* Main Container Card matching reference UI */}
      <div className="bg-white border border-[#d0d7de] rounded shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#1f3448] text-white px-4 py-2.5 flex items-center justify-between font-semibold text-sm">
          <span>Program Level Course - PO & PSO Attainment Matrices Report</span>
          <div className="w-5 h-5 rounded-full bg-[#00a8cc] text-white flex items-center justify-center text-xs font-bold cursor-pointer" title="Help">
            ?
          </div>
        </div>

        {/* Filters Form Body */}
        <div className="p-4 bg-[#f9fafc]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              {/* Curriculum Dropdown */}
              <div className="flex items-center space-x-2">
                <label className="font-semibold text-[#555555]">
                  Curriculum: <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCurriculum}
                  onChange={handleCurriculumChange}
                  className="px-2.5 py-1 bg-white border border-[#cccccc] rounded text-xs text-[#333333] focus:outline-none focus:border-[#4f7f82] min-w-[220px]"
                >
                  <option value="">Select Curriculum</option>
                  {Object.keys(groupedCurriculums).map((groupName) => (
                    <optgroup key={groupName} label={groupName}>
                      {groupedCurriculums[groupName].map((c) => (
                        <option key={c.crclm_id} value={c.crclm_id}>
                          {c.crclm_name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  {ungroupedCurriculums.length > 0 && (
                    <optgroup label="Other Curriculums">
                      {ungroupedCurriculums.map((c) => (
                        <option key={c.crclm_id} value={c.crclm_id}>
                          {c.crclm_name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* First Year Curriculum Dropdown */}
              <div className="flex items-center space-x-2">
                <label className="font-semibold text-[#555555]">
                  First Year Curriculum:
                </label>
                <select
                  value={selectedFirstYearCurriculum}
                  onChange={handleFirstYearCurriculumChange}
                  className="px-2.5 py-1 bg-white border border-[#cccccc] rounded text-xs text-[#333333] focus:outline-none focus:border-[#4f7f82] min-w-[200px]"
                >
                  <option value="">Select First Year Curriculum</option>
                  {firstYearCurriculums.map((fy) => (
                    <option key={fy.crclm_id} value={fy.crclm_id}>
                      {fy.crclm_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Dropdown */}
              <div className="flex items-center space-x-2">
                <label className="font-semibold text-[#555555]">
                  Type: <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedType}
                  onChange={handleTypeChange}
                  className="px-2.5 py-1 bg-white border border-[#cccccc] rounded text-xs text-[#333333] focus:outline-none focus:border-[#4f7f82] min-w-[150px]"
                >
                  <option value="">Select Type</option>
                  {assessmentTypes.map((t) => (
                    <option key={t.type_id} value={t.type_id}>
                      {t.type_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Export Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#5cb85c] hover:bg-[#4ba64f] text-white rounded text-xs font-semibold shadow-sm transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded shadow-md z-20 py-1 text-xs">
                  <button
                    onClick={handlePdfExport}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700 flex items-center space-x-2"
                  >
                    <span>Export PDF</span>
                  </button>
                  <button
                    onClick={handleDocExport}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700 flex items-center space-x-2"
                  >
                    <span>Export Word (.doc)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {loading && (
          <div className="p-4 text-center text-xs text-gray-500">
            Loading PO & PSO Attainment Report...
          </div>
        )}

        {/* Matrix Report Table Section matching Screenshot 5 */}
        {reportData && reportData.rows.length > 0 && (
          <div className="p-4 border-t border-[#e2e8f0]">
            <div className="overflow-x-auto border border-[#cccccc]">
              <table className="w-full text-xs text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-[#f2f4f7] border-b border-[#cccccc] text-[#333333] font-bold text-center">
                    <th className="p-2 border-r border-[#cccccc] text-left min-w-[220px]">
                      COURSE
                    </th>
                    {reportData.columns.map((col, idx) => (
                      <th
                        key={col.po_code}
                        className="p-2 border-r border-[#cccccc] min-w-[75px] text-center font-bold"
                      >
                        {idx + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Semester Subheader Row matching screenshot 5 */}
                  <tr className="bg-[#e9ecef] font-bold text-[#495057] border-b border-[#cccccc]">
                    <td colSpan={reportData.columns.length + 1} className="p-2 text-left">
                      5 - Semester
                    </td>
                  </tr>

                  {/* Course Rows */}
                  {reportData.rows.map((row) => (
                    <tr key={row.crs_id} className="border-b border-[#e9ecef] hover:bg-[#f8f9fa]">
                      <td className="p-2 border-r border-[#cccccc] font-medium text-[#333333]">
                        {row.crs_title} ({row.crs_code})
                      </td>

                      {reportData.columns.map((col) => {
                        const cell = row.attainments[col.po_code];
                        const isHasValue = cell && cell.display_text !== "-";
                        return (
                          <td
                            key={col.po_code}
                            className="p-2 border-r border-[#cccccc] text-center align-middle font-normal"
                          >
                            {isHasValue ? (
                              <div className="leading-tight text-[11px]">
                                <div>{cell.attainment_level?.toFixed(2)} -</div>
                                <div>({cell.percentage?.toFixed(2)}%)</div>
                              </div>
                            ) : (
                              <span className="text-[#999999]">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramPoPsoAttainment;
