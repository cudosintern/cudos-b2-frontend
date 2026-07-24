import React, { useEffect, useState, useRef } from "react";
import { FileText, ChevronDown, BarChart2, Table, AlertCircle, Info, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine, Cell
} from "recharts";
import {
  fetchPageContext, fetchFinalizedCourses, fetchComparisonReport, fetchDrilldown, exportComparisonReport,
  DepartmentOption, ProgramOption, CurriculumOption, TermOption, FinalizedCourseOption, ReportResponse, DrilldownResponse
} from "./coAttainmentComparisonService";
import MultiSelect, { Option } from "../../../../components/FormBuilder/fields/MultiSelect";
import { useAuth } from "../../../../hooks/useAuth";
import { components } from "react-select";

// Custom Value Container to show "All selected" or summary text instead of multiple chips
const CustomValueContainer = ({ children, getValue, hasValue, ...props }: any) => {
  if (!hasValue) {
    return (
      <components.ValueContainer {...props}>
        {children}
      </components.ValueContainer>
    );
  }

  const selected = getValue();
  const options = props.selectProps.options || [];
  const actualOptions = options.filter((opt: any) => opt.value !== "*");
  const isAll = selected.length >= actualOptions.length;

  let labelText = "";
  if (isAll) {
    labelText = "All selected";
  } else {
    labelText = selected.map((s: any) => s.label).join(", ");
    if (labelText.length > 20) {
      labelText = `${selected.length} selected`;
    }
  }

  const childList = React.Children.toArray(children);
  const inputElement = childList.filter((c: any) => {
    return c && (c.type === components.Input || c.type?.name === "Input" || c.props?.focused !== undefined);
  });

  return (
    <components.ValueContainer {...props}>
      <span className="text-gray-700 text-sm truncate select-none pl-1">
        {labelText}
      </span>
      {inputElement}
    </components.ValueContainer>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-[#d0d7de] p-3 rounded shadow-md text-xs space-y-1 text-left max-w-xs z-50">
        <div className="font-bold text-[#a81c1c]">{data.co}</div>
        {data.statement && <div className="text-gray-600 italic leading-snug">{data.statement}</div>}
        <div className="font-bold text-blue-600 mt-1">Attainment: {payload[0].value?.toFixed(2)}%</div>
      </div>
    );
  }
  return null;
};

const CoAttainmentComparison: React.FC = () => {
  const { authState, applicationRole } = useAuth();
  
  // Allowed Roles check is managed dynamically by routes configuration and backend API
  const hasAccess = true;

  // Cascading Filter Data
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [allPrograms, setAllPrograms] = useState<ProgramOption[]>([]);
  const [allCurriculums, setAllCurriculums] = useState<CurriculumOption[]>([]);
  const [allTerms, setAllTerms] = useState<TermOption[]>([]);
  const [courses, setCourses] = useState<FinalizedCourseOption[]>([]);

  // Filter Selections
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedPgm, setSelectedPgm] = useState<string>("");
  const [selectedCurriculums, setSelectedCurriculums] = useState<number[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);

  const selectedTermIds = React.useMemo(() => {
    return allTerms
      .filter(t => selectedTerms.includes(t.term_name))
      .map(t => t.term_id);
  }, [allTerms, selectedTerms]);

  // Filter options derived cascadingly
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramOption[]>([]);
  const [filteredCurriculums, setFilteredCurriculums] = useState<CurriculumOption[]>([]);

  // Page States
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [targetThreshold, setTargetThreshold] = useState<number>(60.0);

  // Drilldown Modal State
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState<boolean>(false);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);

  // Chart References for SVG capture
  const chart1Ref = useRef<HTMLDivElement>(null);
  const chart2Ref = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    if (!hasAccess) return;
    const initPage = async () => {
      try {
        const context = await fetchPageContext();
        setDepartments(context.departments);
        setAllPrograms(context.programs);
        setAllCurriculums(context.curriculums);
        setAllTerms(context.terms);
      } catch (err) {
        console.error("Error loading filter context:", err);
        setError("Failed to initialize filter options.");
      }
    };
    initPage();
  }, [hasAccess]);

  // Cascade 1: Department -> Program
  useEffect(() => {
    if (selectedDept) {
      const filtered = allPrograms.filter(p => p.dept_id === parseInt(selectedDept, 10));
      setFilteredPrograms(filtered);
    } else {
      setFilteredPrograms([]);
    }
    setSelectedPgm("");
    setSelectedCurriculums([]);
    setSelectedTerms([]);
    setCourses([]);
    setSelectedCourses([]);
    setReportData(null);
  }, [selectedDept, allPrograms]);

  // Cascade 2: Program -> Curriculum
  useEffect(() => {
    if (selectedPgm) {
      const filtered = allCurriculums.filter(c => String(c.pgm_id) === String(selectedPgm));
      setFilteredCurriculums(filtered);
    } else {
      setFilteredCurriculums([]);
    }
    setSelectedCurriculums([]);
    setSelectedTerms([]);
    setCourses([]);
    setSelectedCourses([]);
    setReportData(null);
  }, [selectedPgm, allCurriculums]);

  // Cascade 3: Curriculum -> Term reset
  useEffect(() => {
    setSelectedTerms([]);
    setCourses([]);
    setSelectedCourses([]);
    setReportData(null);
  }, [selectedCurriculums]);

  // Cascade 4: Term -> Fetch Finalized Courses
  useEffect(() => {
    if (selectedCurriculums.length > 0 && selectedTerms.length > 0) {
      const loadCourses = async () => {
        try {
          const list = await fetchFinalizedCourses(selectedCurriculums, selectedTermIds);
          setCourses(list);
        } catch (err) {
          console.error("Error loading finalized courses:", err);
          setError("Failed to fetch finalized courses for the selected term.");
        }
      };
      loadCourses();
    } else {
      setCourses([]);
    }
    setSelectedCourses([]);
    setReportData(null);
  }, [selectedCurriculums, selectedTerms, selectedTermIds]);

  // Handle report generation
  const handleGenerateReport = async (courseIds: number[]) => {
    if (courseIds.length === 0 || selectedCurriculums.length === 0 || selectedTerms.length === 0) {
      setReportData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        department_id: selectedDept ? parseInt(selectedDept, 10) : undefined,
        program_id: selectedPgm ? parseInt(selectedPgm, 10) : undefined,
        curriculum_ids: selectedCurriculums,
        term_ids: selectedTermIds,
        course_ids: courseIds
      };
      const response = await fetchComparisonReport(payload);
      setReportData(response);
    } catch (err) {
      console.error("Error fetching comparison report:", err);
      setError("Failed to generate attainment comparison report.");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (selectedVals: any) => {
    let ids: number[] = [];
    if (Array.isArray(selectedVals)) {
      ids = selectedVals.map(v => typeof v === 'object' ? v.value : v);
    } else if (selectedVals) {
      ids = [typeof selectedVals === 'object' ? selectedVals.value : selectedVals];
    }
    
    // Explicit selection limit of max 4 courses is bypassed to allow selecting all courses

    setSelectedCourses(ids);
    handleGenerateReport(ids);
  };

  // Convert Recharts SVG to Base64 PNG natively
  const captureChartAsBase64 = async (containerRef: React.RefObject<HTMLDivElement>): Promise<string | undefined> => {
    console.log("captureChartAsBase64: containerRef current is:", containerRef.current);
    if (!containerRef.current) return undefined;
    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) {
      console.warn("captureChartAsBase64: No SVG element found inside container ref!");
      return undefined;
    }

    return new Promise((resolve) => {
      try {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const URL = window.URL || window.webkitURL || window;
        const svgUrl = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          console.log("captureChartAsBase64: Image loaded successfully for rendering to canvas");
          const canvas = document.createElement("canvas");
          const width = containerRef.current?.clientWidth || svgElement.clientWidth || 800;
          const height = containerRef.current?.clientHeight || svgElement.clientHeight || 400;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            console.log("captureChartAsBase64: Generated base64 string of length:", dataUrl.length);
            resolve(dataUrl);
          } else {
            console.error("captureChartAsBase64: Canvas 2d context is not supported!");
            resolve(undefined);
          }
        };
        img.onerror = (e) => {
          console.error("captureChartAsBase64: Image load failed:", e);
          resolve(undefined);
        };
        img.src = svgUrl;
      } catch (err) {
        console.error("Failed to capture chart image:", err);
        resolve(undefined);
      }
    });
  };

  // Handle Export to PDF/Word
  const handleExport = async (type: number) => {
    if (!reportData || selectedCourses.length === 0) return;
    
    // 0 = PDF, 1 = DOC
    setLoading(true);
    setShowExportMenu(false);
    
    try {
      const chart1_base64 = await captureChartAsBase64(chart1Ref);
      const chart2_base64 = await captureChartAsBase64(chart2Ref);
      
      const payload = {
        export_type: type,
        department_id: selectedDept ? parseInt(selectedDept, 10) : undefined,
        program_id: selectedPgm ? parseInt(selectedPgm, 10) : undefined,
        curriculum_ids: selectedCurriculums,
        term_ids: selectedTermIds,
        course_ids: selectedCourses,
        chart1_image: chart1_base64,
        chart2_image: chart2_base64
      };
      
      const fileBlob = await exportComparisonReport(payload);
      const fileUrl = window.URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = type === 0 ? "CO_Attainment_Comparison_Report.pdf" : "CO_Attainment_Comparison_Report.doc";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("Export failed:", err);
      setError("Failed to download report document.");
    } finally {
      setLoading(false);
    }
  };

  // Handle attainment click for drilldown modal
  const handleAttainmentClick = async (courseId: number, coCode: string) => {
    const matchedCourse = courses.find(c => c.course_id === courseId);
    const termId = matchedCourse ? matchedCourse.term_id : selectedTermIds[0];
    const curriculumId = selectedCurriculums[0];

    setIsDrilldownOpen(true);
    setDrilldownLoading(true);
    setDrilldownData(null);
    try {
      const data = await fetchDrilldown({
        course_id: courseId,
        clo_code: coCode,
        curriculum_id: curriculumId,
        term_id: termId
      });
      setDrilldownData(data);
    } catch (err) {
      console.error("Drilldown loading failed:", err);
    } finally {
      setDrilldownLoading(false);
    }
  };



  // Map curriculums to options for MultiSelect dropdown
  const curriculumOptions = filteredCurriculums.map(c => ({
    value: c.crclm_id,
    label: c.crclm_name
  }));

  // Map terms to options uniquely by name for MultiSelect dropdown
  const termOptions = React.useMemo(() => {
    const uniqueNames = Array.from(new Set(allTerms.map(t => t.term_name.trim())));
    return uniqueNames.map(name => ({
      value: name,
      label: name
    }));
  }, [allTerms]);

  // Map courses to options for MultiSelect dropdown
  const courseOptions = courses.map(c => ({
    value: c.course_id,
    label: c.label
  }));

  // Limit selection to max 4 courses is bypassed to allow Select All to function
  const filteredCourseOptions = courseOptions;

  // Prepare Recharts chart1 (grouped course-wise comparison)
  const chart1Data = reportData ? reportData.charts.course_wise.labels.map((label, index) => {
    const item: any = { co: label };
    reportData.charts.course_wise.series.forEach(ser => {
      item[ser.name] = ser.data[index];
    });
    return item;
  }) : [];

  const chart1Colors = ["#4bb2c5", "#3efc70", "#f781f3", "#c5b47f", "#fe9a2e", "#9DEBD7"];

  // Prepare Recharts chart2 (overall co average) with statements for tooltips
  const chart2Data = reportData ? reportData.charts.overall.labels.map((label, index) => {
    const matchingRow = reportData.overall_rows.find(row => row.co_code === label);
    return {
      co: label,
      attainment: reportData.charts.overall.series[0].data[index],
      statement: matchingRow?.co_statement || ""
    };
  }) : [];

  const overallRows = reportData?.overall_rows || [];
  const avgOverallAttainment = overallRows.length > 0 
    ? overallRows.reduce((sum, r) => sum + (r.display_attainment ?? 0), 0) / overallRows.length 
    : 0;

  const highestCO = overallRows.length > 0 
    ? [...overallRows].sort((a, b) => (b.display_attainment ?? 0) - (a.display_attainment ?? 0))[0] 
    : null;

  const lowestCO = overallRows.length > 0 
    ? [...overallRows].sort((a, b) => (a.display_attainment ?? 0) - (b.display_attainment ?? 0))[0] 
    : null;

  const isThreshold = reportData ? (reportData.config.co_attainment_type.includes("2") || reportData.config.co_attainment_type.length > 1) : false;
  const displayLabel = isThreshold ? "Threshold based Attainment %" : "Average based Attainment %";
  const curriculum_name = reportData ? Array.from(new Set(reportData.courses.map(c => c.curriculum_name))).join(", ") : "";
  const term_name = reportData ? Array.from(new Set(reportData.courses.map(c => c.term_name))).join(", ") : "";
  const course_list_str = reportData?.courses?.map(c => `${c.course_code} - ${c.course_title}`).join(", ") || "";

  return (
    <div className="w-full bg-[#eef2f5] p-4 min-h-screen text-[#333333] font-sans">
      <div className="bg-white border border-[#d0d7de] rounded shadow-sm overflow-hidden mb-6">
        
        {/* Header Bar */}
        <div className="bg-[#1f3448] text-white px-4 py-2.5 flex items-center justify-between font-semibold text-sm">
          <span>Course Outcomes (COs) Attainment Comparision</span>
          <div className="w-5 h-5 rounded-full bg-[#00a8cc] text-white flex items-center justify-center text-xs font-bold cursor-pointer" title="Help">
            ?
          </div>
        </div>

        {/* Filter Section */}
        <div className="p-4 bg-[#f9fafc] border-b border-[#d0d7de] text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* School */}
            <div className="flex flex-col space-y-1">
              <label className="font-semibold text-gray-700">School:<span className="text-red-500">*</span></label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2.5 py-2 bg-white border border-[#cccccc] rounded focus:outline-none focus:border-[#4f7f82] h-[38px] text-sm"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
                ))}
              </select>
            </div>

            {/* Program */}
            <div className="flex flex-col space-y-1">
              <label className="font-semibold text-gray-700">Program:<span className="text-red-500">*</span></label>
              <select
                value={selectedPgm}
                onChange={(e) => setSelectedPgm(e.target.value)}
                disabled={!selectedDept}
                className="px-2.5 py-2 bg-white border border-[#cccccc] rounded focus:outline-none focus:border-[#4f7f82] disabled:bg-gray-100 disabled:cursor-not-allowed h-[38px] text-sm"
              >
                <option value="">Select Program</option>
                {filteredPrograms.map((p) => (
                  <option key={p.pgm_id} value={p.pgm_id}>{p.pgm_title}</option>
                ))}
              </select>
            </div>

            {/* Curriculum (MultiSelect) */}
            <div className="flex flex-col space-y-1">
              <label className="font-semibold text-gray-700">Curriculum:<span className="text-red-500">*</span></label>
              <MultiSelect
                label=""
                name="curriculums"
                options={curriculumOptions}
                value={selectedCurriculums}
                disabled={!selectedPgm}
                onChange={(selected: any) => {
                  const vals = Array.isArray(selected) ? selected.map(v => typeof v === 'object' ? v.value : v) : selected ? [typeof selected === 'object' ? selected.value : selected] : [];
                  setSelectedCurriculums(vals);
                }}
                placeholder="Select Curriculum"
                isMulti
                isSelectAll
                components={{ ValueContainer: CustomValueContainer }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-4">
            {/* Term (MultiSelect) */}
            <div className="flex flex-col space-y-1">
              <label className="font-semibold text-gray-700">Term:<span className="text-red-500">*</span></label>
              <MultiSelect
                label=""
                name="terms"
                options={termOptions}
                value={selectedTerms}
                disabled={selectedCurriculums.length === 0}
                onChange={(selected: any) => {
                  const vals = Array.isArray(selected) ? selected.map(v => typeof v === 'object' ? v.value : v) : selected ? [typeof selected === 'object' ? selected.value : selected] : [];
                  setSelectedTerms(vals);
                }}
                placeholder="Select Term"
                isMulti
                isSelectAll
                components={{ ValueContainer: CustomValueContainer }}
              />
            </div>

            {/* Course (MultiSelect) */}
            <div className="flex flex-col space-y-1">
              <label className="font-semibold text-gray-700">Course:<span className="text-red-500">*</span></label>
              <MultiSelect
                label=""
                name="courses"
                options={filteredCourseOptions}
                value={selectedCourses}
                disabled={selectedTerms.length === 0}
                onChange={handleCourseChange}
                placeholder="Select Course"
                isMulti
                isSelectAll
                components={{ ValueContainer: CustomValueContainer }}
              />
            </div>

            {/* Export Menu / Actions */}
            <div className="relative flex justify-start md:justify-end pb-0.5">
              <div className="relative w-full md:w-auto min-w-[120px]">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={!reportData || selectedCourses.length === 0}
                  className="flex items-center justify-between w-full px-4 py-2 bg-[#5cb85c] hover:bg-[#4ba64f] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-sm font-semibold transition h-[38px] shadow-sm"
                >
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Export</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-full md:w-40 bg-white border border-[#d0d7de] rounded shadow-md z-50 py-1 text-xs">
                    <button
                      onClick={() => handleExport(0)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center space-x-2"
                    >
                      <span>Export PDF</span>
                    </button>
                    <button
                      onClick={() => handleExport(1)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center space-x-2"
                    >
                      <span>Export Word</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* Loading / Error Indicators */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="p-12 text-center text-sm text-gray-500 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#00a8cc]" />
            <span>Processing and loading report data...</span>
          </div>
        )}

        {/* Report Content */}
        {!loading && reportData && (
          <div className="p-4 space-y-6">
            {/* Course Details Info Box (Selection Summary) at the very top */}
            <div className="bg-[#f8f9fa] border border-[#d0d7de] p-3 rounded text-xs space-y-1.5 font-medium text-gray-700">
              <div><b>Curriculum:</b> {curriculum_name}</div>
              <div><b>Term:</b> {term_name}</div>
              <div><b>Course:</b> {course_list_str}</div>
            </div>

            {/* Chart 1: Course-wise Bar Chart */}
            <div ref={chart1Ref} className="w-full h-80 bg-white border border-[#e2e8f0] p-4 rounded shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart1Data} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="none" />
                  <XAxis dataKey="co" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tickCount={7} tick={{ fontSize: 10 }} tickFormatter={(val) => `${Math.round(val)}%`} />
                  <ChartTooltip formatter={(value) => [`${value}%`]} />
                  <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                  {reportData.charts.course_wise.series.map((ser, idx) => (
                    <Bar
                      key={ser.name}
                      dataKey={ser.name}
                      fill={chart1Colors[idx % chart1Colors.length]}
                      barSize={12}
                    >
                      <LabelList dataKey={ser.name} position="top" style={{ fontSize: 9, fill: "#333", fontWeight: "semibold" }} formatter={(val: any) => typeof val === 'number' ? val.toFixed(2) : val} />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Side-by-Side Comparison Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.courses.map((course) => {
                const cWiseRows = reportData.course_wise_rows.filter(r => r.course_id === course.course_id);
                return (
                  <div key={course.course_id} className="border border-[#cccccc] rounded bg-white overflow-hidden shadow-sm text-xs">
                    <div className="bg-[#eef2f5] p-2.5 border-b border-[#cccccc] font-semibold leading-normal text-gray-700">
                      <div>Curriculum : {course.curriculum_name}</div>
                      <div>Term : {course.term_name}</div>
                      <div>Course : <span className="text-blue-700 font-bold">{course.course_code}({course.course_title})</span></div>
                    </div>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f9fafc] border-b border-[#cccccc] text-[#555555]">
                          <th className="p-2 border-r border-[#cccccc] text-center w-12">SI No.</th>
                          <th className="p-2 border-r border-[#cccccc] w-20">CO Code</th>
                          <th className="p-2">{displayLabel}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cWiseRows.map((r, idx) => (
                          <tr key={`${course.course_id}-${r.co_code}`} className="border-b border-[#e2e8f0] hover:bg-gray-50">
                            <td className="p-2 border-r border-[#cccccc] text-center">{idx + 1}</td>
                            <td className="p-2 border-r border-[#cccccc] font-semibold text-gray-700">{r.co_code}</td>
                            <td className="p-2 font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => handleAttainmentClick(course.course_id, r.co_code)}>
                              {r.display_attainment?.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Section 2: Overall CO Attainment */}
            <div className="border-t border-[#d0d7de] pt-6 space-y-6">
              <h2 className="text-[#a81c1c] text-sm font-bold flex items-center gap-1.5 border-b border-gray-100 pb-3">
                <Table className="w-4 h-4" />
                <span>Overall Course Outcomes (COs) Attainment</span>
              </h2>

              {/* Chart 2: Overall Attainment */}
              <div ref={chart2Ref} className="w-full h-80 bg-white border border-[#e2e8f0] p-4 rounded shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart2Data} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="none" />
                    <XAxis dataKey="co" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tickCount={7} tick={{ fontSize: 10 }} tickFormatter={(val) => `${Math.round(val)}%`} />
                    <ChartTooltip formatter={(value) => [`${value}%`, displayLabel]} />
                    <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="attainment" name={displayLabel} fill="#4bb2c5" barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Insights Card */}
              <div className="flex items-center justify-center p-3.5 bg-[#f8fafc] border border-[#d0d7de] rounded shadow-sm text-center">
                <span className="text-gray-500 font-semibold text-xs mr-2">Average CO Attainment:</span>
                <span className="text-lg font-extrabold text-blue-600">{avgOverallAttainment.toFixed(2)}%</span>
              </div>

              {/* Overall Table */}
              <div className="overflow-x-auto border border-[#cccccc]">
                <table className="w-full text-xs text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-[#f2f4f7] border-b border-[#cccccc] text-[#333333] font-bold">
                      <th className="p-2.5 border-r border-[#cccccc] text-center w-16">Sl.No</th>
                      <th className="p-2.5 border-r border-[#cccccc] w-24">CO Code</th>
                      <th className="p-2.5 border-r border-[#cccccc]">CO Statement</th>
                      <th className="p-2.5 w-48 text-center">{displayLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.overall_rows.map((row, idx) => (
                      <tr key={row.co_code} className="border-b border-[#cccccc] hover:bg-gray-50">
                        <td className="p-2.5 border-r border-[#cccccc] text-center">{idx + 1}</td>
                        <td className="p-2.5 border-r border-[#cccccc] font-bold text-gray-700">{row.co_code}</td>
                        <td className="p-2.5 border-r border-[#cccccc] text-gray-600">{row.co_statement}</td>
                        <td className="p-2.5 text-center font-bold text-[#a81c1c]">
                          {row.display_attainment?.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes / Formula Box */}
              <div className="bg-[#f7fafc] border border-[#cbd5e0] p-4 rounded text-xs space-y-2 text-gray-600 leading-normal shadow-inner">
                <div className="font-semibold text-gray-800">
                  Note: The above bar graph depicts the overall class performance with respect to the {isThreshold ? "Threshold %" : "Average %"} for individual Course Outcomes (COs). The Attainment % is calculated using the below formula.
                </div>
                {isThreshold ? (
                  <div>
                    <div className="font-bold text-[#a81c1c] text-xs">For Threshold based Attainment % = ( x / y ) * 100</div>
                    <div className="pl-4">x = Count of Students &gt;= to Threshold %</div>
                    <div className="pl-4">y = Total number of Students Attempted</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-[#a81c1c] text-xs">For Average based Attainment % = ( x / y ) * 100</div>
                    <div className="pl-4">x = Average secured marks of attempted students</div>
                    <div className="pl-4">y = Maximum marks</div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Drilldown Modal */}
      {isDrilldownOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d0d7de] rounded-md shadow-lg max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#1f3448] text-white px-4 py-3 flex items-center justify-between font-semibold text-sm">
              <span>Attainment Drilldown Details</span>
              <button onClick={() => setIsDrilldownOpen(false)} className="text-white hover:text-gray-300 font-bold text-sm">
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 space-y-4 text-xs">
              {drilldownLoading && (
                <div className="p-12 text-center text-sm text-gray-500 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00a8cc]" />
                  <span>Loading drilldown attainment details...</span>
                </div>
              )}
              
              {!drilldownLoading && drilldownData && (
                <div className="space-y-4">
                  {/* Header info */}
                  <div className="bg-[#f8f9fa] border border-[#d0d7de] p-3 rounded font-medium text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div><b>Curriculum:</b> {drilldownData.header.curriculum}</div>
                    <div><b>Term:</b> {drilldownData.header.term}</div>
                    <div><b>Course:</b> {drilldownData.header.course}</div>
                    <div><b>CO Code:</b> {drilldownData.header.co_code}</div>
                    <div className="md:col-span-2"><b>CO Statement:</b> {drilldownData.header.co_statement}</div>
                  </div>

                  {/* Drilldown table */}
                  <div className="border border-[#cccccc] rounded overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#f2f4f7] border-b border-[#cccccc] text-[#333333] font-bold">
                          <th className="p-2 border-r border-[#cccccc] text-center w-16">Sl.No</th>
                          <th className="p-2 border-r border-[#cccccc]">Assessment Type</th>
                          <th className="p-2 border-r border-[#cccccc] text-center w-32">Section</th>
                          <th className="p-2 border-r border-[#cccccc] text-center w-40">Attainment %</th>
                          <th className="p-2 text-center w-40">Attainment Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drilldownData.sections.map((sec, idx) => (
                          <tr key={`${sec.assessment_type}-${sec.section_name}`} className="border-b border-[#cccccc] hover:bg-gray-50">
                            <td className="p-2 border-r border-[#cccccc] text-center">{idx + 1}</td>
                            <td className="p-2 border-r border-[#cccccc] font-semibold text-gray-700">{sec.assessment_type}</td>
                            <td className="p-2 border-r border-[#cccccc] text-center">{sec.section_name}</td>
                            <td className="p-2 border-r border-[#cccccc] text-center font-bold text-[#a81c1c]">{sec.attainment?.toFixed(2)}%</td>
                            <td className="p-2 text-center font-bold text-blue-700">{sec.attainment_level?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#f9fafc] border-t border-[#d0d7de] px-4 py-3 flex justify-end">
              <button
                onClick={() => setIsDrilldownOpen(false)}
                className="px-4 py-1.5 bg-[#1f3448] text-white rounded text-xs font-semibold hover:bg-[#2b4863]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoAttainmentComparison;
