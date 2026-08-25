import React, { useEffect, useState, useRef, } from "react";
import Select from "react-select";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { FileText, File } from "lucide-react";

// =========================================================
// API
// =========================================================

const CURRICULUM_API =
  "http://localhost:8000/question-paper-analysis/curriculum-dropdown";

const TERM_API =
  "http://localhost:8000/question-paper-analysis/term-dropdown";

const COURSE_API =
  "http://localhost:8000/question-paper-analysis/course-dropdown";

const SECTION_API =
  "http://localhost:8000/question-paper-analysis/section-dropdown";

const OCCASION_API =
  "http://localhost:8000/question-paper-analysis/occasion-dropdown";

const REPORT_API =
  "http://localhost:8000/question-paper-analysis/report";

// =========================================================
// TYPES
// =========================================================

interface OptionItem {
  value: string | number;
  label: string;
}

interface GraphRow {
  blooms_level: string;
  marks: number;
  percentage: number;
}

// =========================================================
// COLORS
// =========================================================

const COLORS = [
  "#48b0c7",
  "#e8a327",
  "#c8bc7d",
  "#5fa086",
  "#7f9350",
  "#a39a11",
];

// =========================================================
// COMPONENT
// =========================================================

const QuestionPaperAnalysisReportPage = () => {
  const equalChartRef = useRef<HTMLDivElement>(null);
  const actualChartRef = useRef<HTMLDivElement>(null);

  // ======================================================
  // DROPDOWNS
  // ======================================================

  const [curriculumList, setCurriculumList] =
    useState<any[]>([]);

  const [termOptions, setTermOptions] =
    useState<OptionItem[]>([]);

  const [courseOptions, setCourseOptions] =
    useState<OptionItem[]>([]);

  const [sectionOptions, setSectionOptions] =
    useState<OptionItem[]>([]);

  const [occasionOptions, setOccasionOptions] =
    useState<OptionItem[]>([]);

  // ======================================================
  // SELECTED VALUES
  // ======================================================

  const [selectedCurriculum, setSelectedCurriculum] =
    useState<OptionItem | null>(null);

  const [selectedTerm, setSelectedTerm] =
    useState<OptionItem | null>(null);

  const [selectedCourse, setSelectedCourse] =
    useState<OptionItem | null>(null);

  const [selectedSection, setSelectedSection] =
    useState<OptionItem | null>(null);

  const [selectedOccasion, setSelectedOccasion] =
    useState<OptionItem | null>(null);

  // ======================================================
  // TAB
  // ======================================================

  const [activeTab, setActiveTab] = useState<
    "sectionwise" | "overall"
  >("sectionwise");

  // ======================================================
  // REPORT
  // ======================================================

  const [equalWeightageData, setEqualWeightageData] =
    useState<GraphRow[]>([]);

  const [actualWeightageData, setActualWeightageData] =
    useState<GraphRow[]>([]);

  // ======================================================
  // LOAD CURRICULUM
  // ======================================================

  useEffect(() => {

    fetch(CURRICULUM_API)
      .then((res) => res.json())
      .then((data) => {
        setCurriculumList(data || []);
      });

  }, []);

  // ======================================================
  // LOAD TERMS
  // ======================================================

  useEffect(() => {

    if (!selectedCurriculum) return;

    fetch(
      `${TERM_API}?curriculum_id=${selectedCurriculum.value}`
    )
      .then((res) => res.json())
      .then((data) => {
        setTermOptions(data || []);
      });

    setSelectedTerm(null);
    setSelectedCourse(null);
    setSelectedSection(null);
    setSelectedOccasion(null);

  }, [selectedCurriculum]);

  // ======================================================
  // LOAD COURSES
  // ======================================================

  useEffect(() => {

    if (!selectedCurriculum || !selectedTerm)
      return;

    fetch(
      `${COURSE_API}?curriculum_id=${selectedCurriculum.value}&semester_id=${selectedTerm.value}`
    )
      .then((res) => res.json())
      .then((data) => {
        setCourseOptions(data || []);
      });

    setSelectedCourse(null);
    setSelectedSection(null);
    setSelectedOccasion(null);

  }, [selectedCurriculum, selectedTerm]);

  // ======================================================
  // LOAD SECTION
  // ======================================================

  useEffect(() => {

    if (
      !selectedCurriculum ||
      !selectedTerm ||
      !selectedCourse
    )
      return;

    fetch(
      `${SECTION_API}?curriculum_id=${selectedCurriculum.value}&semester_id=${selectedTerm.value}&course_id=${selectedCourse.value}`
    )
      .then((res) => res.json())
      .then((data) => {
        setSectionOptions(data || []);
      });

    setOccasionOptions([]);
    setSelectedOccasion(null);

  }, [
    selectedCurriculum,
    selectedTerm,
    selectedCourse,
  ]);

  // ======================================================
  // LOAD OCCASION
  // ======================================================

  useEffect(() => {

    if (
      !selectedCurriculum ||
      !selectedTerm ||
      !selectedCourse ||
      !selectedSection
    ) {
      setOccasionOptions([]);
      setSelectedOccasion(null);
      return;
    }

    fetch(
      `${OCCASION_API}?curriculum_id=${selectedCurriculum.value}` +
      `&semester_id=${selectedTerm.value}` +
      `&course_id=${selectedCourse.value}` +
      `&section_id=${selectedSection.value}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Occasion Response:", data);

        if (Array.isArray(data)) {
          setOccasionOptions(data);
        } else {
          setOccasionOptions([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setOccasionOptions([]);
      });

    setSelectedOccasion(null);

  }, [
    selectedCurriculum,
    selectedTerm,
    selectedCourse,
    selectedSection
  ]);

  // ======================================================
  // FETCH REPORT
  // ======================================================

  useEffect(() => {

    // ==============================================
    // COURSE REQUIRED
    // ==============================================

    if (!selectedCourse) {

      setEqualWeightageData([]);
      setActualWeightageData([]);

      return;
    }

    // ==============================================
    // SECTIONWISE VALIDATION
    // ==============================================

    if (
      activeTab === "sectionwise" &&
      (
        !selectedSection ||
        !selectedOccasion
      )
    ) {

      setEqualWeightageData([]);
      setActualWeightageData([]);

      return;
    }

    let url = "";

    // ==============================================
    // SECTIONWISE
    // ==============================================

    if (activeTab === "sectionwise") {

      url =
        `${REPORT_API}?course_id=${selectedCourse.value}` +
        `&analysis_type=sectionwise` +
        `&section_ids=${selectedSection?.value}` +
        `&occasion_ids=${selectedOccasion?.value}`;

    }

    // ==============================================
    // OVERALL
    // ==============================================

    else {

      url =
        `${REPORT_API}?course_id=${selectedCourse.value}` +
        `&analysis_type=overall`;

    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {

        setEqualWeightageData(
          data.equal_weightage || []
        );

        setActualWeightageData(
          data.actual_weightage || []
        );

      })
      .catch(() => {

        setEqualWeightageData([]);
        setActualWeightageData([]);

      });

  }, [
    selectedCourse,
    selectedSection,
    selectedOccasion,
    activeTab,
  ]);

  // ======================================================
  // EXPORT
  // ======================================================

  const exportPDF = () => {

    if (
      !selectedCurriculum ||
      !selectedTerm ||
      !selectedCourse
    ) return;

    let url =
      `http://localhost:8000/question-paper-analysis/pdf` +
      `?curriculum_id=${selectedCurriculum.value}` +
      `&semester_id=${selectedTerm.value}` +
      `&course_id=${selectedCourse.value}` +
      `&analysis_type=${activeTab}`;

    if (activeTab === "sectionwise") {
      url +=
        `&section_id=${selectedSection?.value}` +
        `&occasion_ids=${selectedOccasion?.value}`;
    }

    window.open(url, "_blank");
  };



  const exportDOC = () => {

    if (
      !selectedCurriculum ||
      !selectedTerm ||
      !selectedCourse
    ) return;

    let url =
      `http://localhost:8000/question-paper-analysis/doc` +
      `?curriculum_id=${selectedCurriculum.value}` +
      `&semester_id=${selectedTerm.value}` +
      `&course_id=${selectedCourse.value}` +
      `&analysis_type=${activeTab}`;

    if (activeTab === "sectionwise") {
      url +=
        `&section_id=${selectedSection?.value}` +
        `&occasion_ids=${selectedOccasion?.value}`;
    }

    window.open(url, "_blank");
  };

  // ======================================================
  // LABEL
  // ======================================================

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {

    const RADIAN = Math.PI / 180;

    const radius =
      innerRadius +
      (outerRadius - innerRadius) * 0.5;

    const x =
      cx +
      radius * Math.cos(-midAngle * RADIAN);

    const y =
      cy +
      radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#4b5563"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
      >
        {(percent * 100).toFixed(2)}%
      </text>
    );
  };

  // ======================================================
  // TOTAL
  // ======================================================

  const getTotalMarks = (data: GraphRow[]) => {

    return data
      .reduce(
        (sum, item) => sum + Number(item.marks),
        0
      )
      .toFixed(2);
  };

  // ======================================================
  // JSX
  // ======================================================
  const curriculumOptions = curriculumList.flatMap(
    (department: any) => [

      {
        value: `header-${department.department_name}`,
        label: department.department_name,
        isDisabled: true,
      },

      ...(department.curriculums || []).map(
        (item: any) => ({
          value: item.academic_batch_id,
          label: item.curriculum_name,
        })
      ),
    ]
  );
  return (
    <div
      style={{
        background: "#efefef",
        minHeight: "100vh",
        padding: "6px",
      }}
    >

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="bg-[#f8f8f8] px-3 py-2 text-[#4f7f82] font-semibold border border-[#d9d9d9]">
        Question Paper Analysis Report
      </div>

      {/* ================================================= */}
      {/* FILTER SECTION */}
      {/* ================================================= */}

      <div
        style={{
          padding: "14px 10px",
          background: "#f6f6f6",
          border: "1px solid #d9d9d9",
          borderTop: "none",
        }}
      >

        {/* ================================================= */}
        {/* FILTER GRID */}
        {/* ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            columnGap: "16px",
            rowGap: "10px",
            alignItems: "end",
            width: "100%",
          }}
        >

          {/* CURRICULUM */}

          <div>
            <label style={labelStyle}>
              Curriculum:<span style={{ color: "red" }}> *</span>
            </label>

            <Select
              options={curriculumOptions}

              value={curriculumOptions.find(
                (x: any) =>
                  x.value === selectedCurriculum?.value
              )}

              onChange={(selected: any) => {

                if (
                  !selected ||
                  String(selected.value).startsWith("header-")
                )
                  return;

                setSelectedCurriculum(selected);
              }}

              isOptionDisabled={(option: any) =>
                option.isDisabled
              }

              styles={{
                ...selectStyles,

                option: (base: any, state: any) => ({

                  ...base,

                  backgroundColor: state.data.isDisabled
                    ? "#d1d5db"
                    : state.isSelected
                      ? "#2563eb"
                      : state.isFocused
                        ? "#f3f4f6"
                        : "#ffffff",

                  color: state.data.isDisabled
                    ? "#000"
                    : state.isSelected
                      ? "#fff"
                      : "#000",

                  fontWeight: state.data.isDisabled
                    ? 600
                    : 400,

                  cursor: state.data.isDisabled
                    ? "default"
                    : "pointer",

                  padding: state.data.isDisabled
                    ? "6px 10px"
                    : "4px 10px",
                }),
              }}
            />
          </div>

          {/* TERM */}

          <div>
            <label style={labelStyle}>
              Term:<span style={{ color: "red" }}> *</span>
            </label>

            <Select
              options={termOptions}
              value={selectedTerm}
              onChange={(val) =>
                setSelectedTerm(val)
              }
              styles={selectStyles}
            />
          </div>

          {/* COURSE */}

          <div>
            <label style={labelStyle}>
              Course:<span style={{ color: "red" }}> *</span>
            </label>

            <Select
              options={courseOptions}
              value={selectedCourse}
              onChange={(val) =>
                setSelectedCourse(val)
              }
              styles={selectStyles}
            />
          </div>

          {/* SECTION */}

          <div>
            <label style={labelStyle}>
              Section:<span style={{ color: "red" }}> *</span>
            </label>

            <Select
              isDisabled={
                activeTab === "overall"
              }
              options={sectionOptions}
              value={selectedSection}
              onChange={(val) =>
                setSelectedSection(val)
              }
              styles={selectStyles}
            />
          </div>

          {/* OCCASION */}

          <div>
            <label style={labelStyle}>
              Occasion:<span style={{ color: "red" }}> *</span>
            </label>

            <Select
              isDisabled={
                activeTab === "overall"
              }
              options={occasionOptions}
              value={selectedOccasion}
              onChange={(val) =>
                setSelectedOccasion(val)
              }
              styles={selectStyles}
            />
          </div>

        </div>

        {/* ================================================= */}
        {/* TAB + EXPORT ROW */}
        {/* ================================================= */}

        <div
          style={{
            marginTop: "18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >

          {/* ================================================= */}
          {/* TABS */}
          {/* ================================================= */}

          <div
            className="flex border-b px-3 pt-3 gap-2"
          >

            {/* SECTIONWISE */}

            <button
              onClick={() =>
                setActiveTab("sectionwise")
              }
              className={`
      px-4 py-2
      text-[13px]
      border
      rounded-t
      ${activeTab === "sectionwise"
                  ? "bg-white border-b-white text-[#4f7f82] font-semibold"
                  : "bg-[#f3f3f3]"
                }
    `}
            >
              Sectionwise Analysis
            </button>


            {/* OVERALL */}

            <button
              onClick={() =>
                setActiveTab("overall")
              }
              className={`
      px-4 py-2
      text-[13px]
      border
      rounded-t
      ${activeTab === "overall"
                  ? "bg-white border-b-white text-[#4f7f82] font-semibold"
                  : "bg-[#f3f3f3]"
                }
    `}
            >
              Overall Course Analysis
            </button>

          </div>

          {/* ================================================= */}
          {/* EXPORT */}
          {/* ================================================= */}

          <div className="relative group">

            <button
              disabled={!selectedCourse}
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

            {selectedCourse && (
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

      </div>

      {/* ================================================= */}
      {/* PANEL 1 */}
      {/* ================================================= */}

      <PanelComponent
        chartRef={equalChartRef}
        title="Bloom's Level Marks Distribution based on equal Weightage %"
        data={equalWeightageData}
        renderCustomizedLabel={
          renderCustomizedLabel
        }
        totalMarks={getTotalMarks(
          equalWeightageData
        )}
      />

      {/* ================================================= */}
      {/* PANEL 2 */}
      {/* ================================================= */}

      <PanelComponent
        chartRef={actualChartRef}
        title="Bloom's Level Marks Distribution based on actual Weightage %"
        data={actualWeightageData}
        renderCustomizedLabel={
          renderCustomizedLabel
        }
        totalMarks={getTotalMarks(
          actualWeightageData
        )}
      />
      {/* ===================== NOTE ===================== */}

      <div
        style={{
          marginTop: "14px",
          border: "1px solid #d9d9d9",
          background: "#f8f8f8",
          borderRadius: "4px",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            fontWeight: "bold",
            borderBottom: "1px solid #ddd",
          }}
        >
          Note:
        </div>

        <div
          style={{
            padding: "12px 14px",
            lineHeight: "1.8",
            background: "#fff",
          }}
        >
          <div>
            The above pie chart depicts the individual Bloom's Level actual marks
            percentage distribution as in the question paper.
          </div>

          <div><strong>X = Individual Bloom's Level marks</strong></div>
          <div><strong>Y = Sum of all Bloom's Level marks</strong></div>
          <div><strong>% Distribution = (X / Y) * 100</strong></div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// PANEL COMPONENT
// =========================================================

const PanelComponent = ({
  title,
  data,
  renderCustomizedLabel,
  totalMarks,
  chartRef,
}: any) => {

  return (
    <div
      ref={chartRef}
      style={{
        marginTop: "14px",
        border: "1px solid #d9d9d9",
        background: "#fff",
      }}
    >

      <div
        ref={chartRef}
        style={{
          background: "#263547",
          color: "#fff",
          padding: "5px 14px",
          fontWeight: 700,
          fontSize: "12px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "48% 52%",
          gap: "15px",
          padding: "18px",
          alignItems: "start",
        }}
      >

        {/* LEFT */}

        <div>

          <div

            style={{
              width: "350px",
              height: "220px",
              border: "1px solid #bfbfbf",
              background: "#f6f5ef",
              boxShadow:
                "0px 1px 4px rgba(0,0,0,0.25)",
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>

                <Pie
                  data={data}
                  dataKey="marks"
                  nameKey="blooms_level"
                  cx="42%"
                  cy="50%"
                  outerRadius={80}
                  label={renderCustomizedLabel}
                  labelLine={false}
                >

                  {data.map(
                    (
                      entry: any,
                      index: number
                    ) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[
                          index % COLORS.length
                          ]
                        }
                      />
                    )
                  )}

                </Pie>

                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="square"
                  wrapperStyle={{
                    fontSize: "10px",
                    right: 10,
                  }}
                />

              </PieChart>
            </ResponsiveContainer>

          </div>

        </div>

        {/* TABLE */}

        <div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
            }}
          >

            <thead>

              <tr>

                <th style={thStyle}>
                  Bloom's Level
                </th>

                <th style={thStyle}>
                  Marks Distribution (X)
                </th>

                <th style={thStyle}>
                  % Distribution
                </th>

              </tr>

            </thead>

            <tbody>

              {data.map(
                (
                  row: GraphRow,
                  index: number
                ) => (
                  <tr key={index}>

                    <td style={tdStyle}>
                      {row.blooms_level}
                    </td>

                    <td style={tdStyle}>
                      {Number(
                        row.marks
                      ).toFixed(2)}
                    </td>

                    <td style={tdStyle}>
                      {Number(
                        row.percentage
                      ).toFixed(2)} %
                    </td>

                  </tr>
                )
              )}

              <tr>

                <td style={tdStyle}>
                  <b>Total</b>
                </td>

                <td style={tdStyle}>
                  <b>{totalMarks} (Y)</b>
                </td>

                <td style={tdStyle}>
                  <b>100.00 %</b>
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};

// =========================================================
// STYLES
// =========================================================

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "5px",
  fontSize: "11px",
  color: "#333",
};

const tabStyle: React.CSSProperties = {
  border: "1px solid #cfcfcf",
  padding: "7px 12px",
  fontSize: "11px",
  cursor: "pointer",
};

const thStyle: React.CSSProperties = {
  border: "1px solid #d9d9d9",
  padding: "6px",
  background: "#f7f7f7",
  textAlign: "center",
  fontWeight: 700,
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #d9d9d9",
  padding: "6px",
  textAlign: "center",
};

const selectStyles = {

  control: (base: any) => ({
    ...base,
    minHeight: "24px",
    height: "24px",
    fontSize: "11px",
    borderRadius: "2px",
    borderColor: "#cfcfcf",
    boxShadow: "none",
  }),

  valueContainer: (base: any) => ({
    ...base,
    height: "24px",
    padding: "0 6px",
  }),

  indicatorsContainer: (base: any) => ({
    ...base,
    height: "24px",
  }),

  input: (base: any) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),

  option: (base: any) => ({
    ...base,
    fontSize: "11px",
  }),

  menu: (base: any) => ({
    ...base,
    zIndex: 9999,
    fontSize: "11px",
  }),

};

export default QuestionPaperAnalysisReportPage;