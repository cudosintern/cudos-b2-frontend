import React, { useEffect, useState } from "react";
import Select from "react-select";
import { FileText, File } from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL =
  "http://localhost:8000/question-paper-audit";

const CURRICULUM_API =
  `${API_BASE_URL}/academic-batch-dropdown`;

const REPORT_API =
  `${API_BASE_URL}/question-paper-audit-report`;
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
interface BloomData {
  name: string;
  total_marks: number;
  weightage_marks: number;
  value: number;
}
const COLORS = [
  "#4FB7C5", // L1
  "#F5A623", // L2
  "#CABB83", // L3
  "#9C27B0",
  "#4CAF50",
  "#E91E63",
];

const QuestionPaperAuditReportPage = () => {
  const [bloomData, setBloomData] = useState<BloomData[]>([]);
  const [termOptions, setTermOptions] = useState<OptionItem[]>([]);
  const [courseOptions, setCourseOptions] = useState<any[]>([]);

  const [selectedTerm, setSelectedTerm] =
    useState<OptionItem | null>(null);

  const [selectedCourse, setSelectedCourse] =
    useState<any>(null);

  const [courseMode, setCourseMode] =
    useState<number>(0);
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
  const fetchBloomDistribution = async (
    courseId: number
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8000/question-paper-audit/blooms-distribution?course_id=${courseId}`
      );

      const data = await response.json();

      setBloomData(data);
    } catch (err) {
      console.error(err);
      setBloomData([]);
      setCourseMode(0);
    }
  };
  const handleCourseChange = async (selected: any) => {
    setSelectedCourse(selected);

    if (!selected) {
      setBloomData([]);
      setCourseMode(0);
      return;
    }

    try {
      // Fetch course mode
      const modeResponse = await fetch(
        `${API_BASE_URL}/course-mode?course_id=${selected.value}`
      );

      const modeData = await modeResponse.json();

      console.log("Course Mode:", modeData);

      setCourseMode(modeData.course_mode);

      // Fetch bloom distribution
      fetchBloomDistribution(selected.value);

    } catch (err) {
      console.error(err);
      setCourseMode(0);
    }
  };
  const thStyle: React.CSSProperties = {
    border: "1px solid #000",
    padding: "4px",
    background: "#f3f4f6",
    textAlign: "center",
    fontWeight: 600,
  };
  const tdStyle: React.CSSProperties = {
    border: "1px solid #000",
    padding: "4px",
  };
  const tdCenter: React.CSSProperties = {
    ...tdStyle,
    textAlign: "center",
  };
  const sectionStyle: React.CSSProperties = {
    border: "1px solid #000",
    padding: "4px",
    fontWeight: "bold",
  };
  const totalWeightageMarks = bloomData.reduce(
    (sum, item) => sum + item.weightage_marks,
    0
  );
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
  const handleCurriculumChange = async (
    selected: OptionItem | null
  ) => {
    setSelectedCurriculum(selected);

    setSelectedTerm(null);
    setSelectedCourse(null);

    setTermOptions([]);
    setCourseOptions([]);
    setBloomData([]);
    setCourseMode(0);

    if (!selected) return;

    try {
      const response = await fetch(
        `http://localhost:8000/question-paper-audit/semester-dropdown?academic_batch_id=${selected.value}`
      );

      const data = await response.json();

      setTermOptions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTermChange = async (
    selected: OptionItem | null
  ) => {
    setSelectedTerm(selected);

    setSelectedCourse(null);
    setCourseOptions([]);
    setBloomData([]);
    setCourseMode(0);

    if (!selectedCurriculum || !selected) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/course-dropdown?academic_batch_id=${selectedCurriculum.value}&semester_id=${selected.value}`
      );
      const result = await response.json();

      setCourseOptions(result.data || []);
    } catch (err) {
      console.error(err);
    }
  };
  // ======================================================
  // EXPORT DOC
  // ======================================================
  const exportDOC = () => {
    if (
      !selectedCurriculum ||
      !selectedTerm ||
      !selectedCourse
    )
      return;

    window.open(
      `${API_BASE_URL}/doc?academic_batch_id=${selectedCurriculum.value}&semester_id=${selectedTerm.value}&course_id=${selectedCourse.value}`,
      "_blank"
    );
  };
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "32px",
      height: "32px",
      fontSize: "13px",
    }),

    valueContainer: (base: any) => ({
      ...base,
      height: "32px",
      padding: "0 8px",
    }),

    input: (base: any) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),

    indicatorsContainer: (base: any) => ({
      ...base,
      height: "32px",
    }),

    menuList: (base: any) => ({
      ...base,
      padding: 0,
      margin: 0,
    }),

    option: (base: any, state: any) => ({
      ...base,
      minHeight: "28px",
      padding: state.isDisabled ? "6px 10px" : "4px 10px",

      backgroundColor: state.isDisabled
        ? "#d1d5db"
        : state.isSelected
          ? "#2563eb"
          : state.isFocused
            ? "#f3f4f6"
            : "#ffffff",

      color: state.isDisabled
        ? "#000"
        : state.isSelected
          ? "#fff"
          : "#000",

      fontWeight: state.isDisabled ? 600 : 400,
      cursor: state.isDisabled ? "default" : "pointer",
    }),

    singleValue: (base: any) => ({
      ...base,
      fontSize: "13px",
    }),

    groupHeading: (base: any) => ({
      ...base,
      background: "#d1d5db",
      color: "#000",
      fontWeight: 600,
      padding: "6px 10px",
      margin: 0,
    }),
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
      <div className="bg-[#f8f8f8] px-3 py-2 text-[#4f7f82] font-semibold border border-[#d9d9d9]">
        Question Paper Audit Report
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
            display: "grid",
            gridTemplateColumns: "repeat(3, 250px) auto",
            gap: "16px",
            alignItems: "end",
            marginBottom: "20px",
          }}
        >
          {/* ================= CURRICULUM ================= */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              Curriculum <span style={{ color: "red" }}>*</span>
            </label>

            <Select<OptionItem, false, OptionGroup>
              value={selectedCurriculum}
              onChange={handleCurriculumChange}
              options={curriculumOptions}
              placeholder="Select Curriculum"
              isClearable
              styles={selectStyles}
              formatGroupLabel={(group) => (
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "13px",
                    background: "#d1d5db",
                    color: "#000",
                    padding: "6px 10px",
                  }}
                >
                  {group.label}
                </div>
              )}
            />
          </div>

          {/* ================= SEMESTER ================= */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              Semester
            </label>

            <Select
              value={selectedTerm}
              options={termOptions}
              styles={selectStyles}
              placeholder="Select Semester"
              isClearable
              onChange={handleTermChange}
            />
          </div>

          {/* ================= COURSE ================= */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              Course
            </label>

            <Select
              value={selectedCourse}
              options={courseOptions}
              styles={selectStyles}
              placeholder="Select Course"
              isClearable
              onChange={handleCourseChange}
            />
          </div>
          {/* ================= EXPORT ================= */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "end",
              height: "100%",
            }}
          >
            <div className="relative group">
              <button
                disabled={!selectedCurriculum}
                className="
          bg-[#4f7f82]
          hover:bg-[#4f7f82]
          text-white
          rounded
          flex
          items-center
          gap-2
          px-5
          h-[42px]
          text-sm
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
              >
                <FileText size={18} />
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
            rounded-md
            shadow-lg
            z-50
            opacity-0
            invisible
            group-hover:opacity-100
            group-hover:visible
            transition-all
          "
                >
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

        <hr
          style={{
            border: 0,
            borderTop: "1px solid #d1d5db",
            marginBottom: "20px",
          }}
        />

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}
        <div
          style={{
            border: "1px solid #d1d5db",
            overflowX: "auto",
          }}
        >
          {/* ==========================================================
    QUESTION PAPER AUDIT FORMAT (THEORY)
========================================================== */}

          {selectedCourse && courseMode !== 1 && (
            <div
              style={{
                marginTop: "20px",
              }}
            >
              <h3
                style={{

                  color: "#0f0c0c",
                  padding: "10px 15px",
                  borderRadius: "4px",
                  marginBottom: "20px",
                }}
              >
                Question Paper Audit Format
              </h3>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Sr. No.</th>

                    <th style={thStyle}>Checklist</th>

                    <th style={thStyle}>
                      Course Chairperson's Response
                      <br />
                      (Yes / No)
                    </th>

                    <th style={thStyle}>
                      Auditor's Observation
                      <br />
                      (Yes / No) with Remarks
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {/* =======================
            GENERAL
        ======================== */}

                  <tr>
                    <td
                      colSpan={4}
                      style={sectionStyle}
                    >
                      General
                    </td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>1</td>

                    <td style={tdStyle}>
                      <b>Template:</b> Question Paper
                      Template is followed.
                    </td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>2</td>

                    <td style={tdStyle}>
                      <b>Language:</b> The framing of
                      questions is unambiguous,
                      technically appropriate and
                      grammatically correct.
                    </td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>3</td>

                    <td style={tdStyle}>
                      <b>Time:</b> The total time
                      provided to attempt the question
                      paper is sufficient.
                    </td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>4</td>

                    <td style={tdStyle}>
                      <b>Difficulty Levels:</b>
                      The questions represent an appropriate distribution (weightage)
                      among the three difficulty levels (easy, medium and difficult/challenging).
                    </td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>5</td>

                    <td style={tdStyle}>
                      <b>Syllabus Coverage:</b>
                      All question papers set for the course (i.e. the entire evaluation scheme
                      for the course) together cover all the modules or units from the course contents.
                    </td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>6</td>

                    <td style={tdStyle}>
                      <b>Mark distribution:</b>
                      for the questions and sub-questions is clearly indicated.
                    </td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  {/* =======================
            COURSE OUTCOMES
        ======================== */}

                  <tr>
                    <td
                      colSpan={4}
                      style={sectionStyle}
                    >
                      Related to Course Outcomes (CO)
                    </td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>7</td>

                    <td style={tdStyle}>
                      <b>Mapping:</b>
                      Each question appropriately maps with at least one of the course outcomes.
                    </td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>8</td>

                    <td style={tdStyle}>
                      <b>Coverage:</b>
                      All the COs are covered in the entire evaluation scheme
                      (e.g. T1, T2 and ESE — all together) of the course.
                    </td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  {/* =======================
            BLOOM'S LEVEL
        ======================== */}

                  <tr>
                    <td
                      colSpan={4}
                      style={sectionStyle}
                    >
                      Related to Bloom's Levels (BL)
                    </td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>9</td>

                    <td style={tdStyle}>
                      <b>Higher Cognitive Levels:</b>
                      Questions pertaining to Bloom's levels of Analyze / Evaluate
                      are included in the evaluation scheme.
                    </td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>10</td>

                    <td style={tdStyle}>
                      <b>Weightage:</b>
                      % marks of the higher cognitive levels:
                    </td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                </tbody>
              </table>

              {/* =======================
        SIGNATURES
    ======================== */}

              <div
                style={{
                  marginTop: "25px",
                  fontSize: "14px",
                  lineHeight: "2.2",
                }}
              >
                <strong>
                  Name & Signature of the Course Chairperson:
                </strong>

                _______________________________________

                <br />

                <strong>
                  Name & Signature of the Departmental Auditor:
                </strong>

                _______________________________________

                <br />

                <strong>Date of Audit:</strong>

                _______________________________________
              </div>
            </div>
          )}

          {/* ===== Part 3 starts after this ===== */}
          {/* ==========================================================
    LAB AUDIT FORMAT
========================================================== */}

          {selectedCourse && courseMode === 1 && (
            <div
              style={{
                marginTop: "25px",
              }}
            >
              <h3
                style={{
                  color: "#fff",
                  padding: "10px 15px",
                  borderRadius: "4px",
                  marginBottom: "20px",
                }}
              >
                Lab Audit Format
              </h3>

              {/* =====================================================
        PART A
    ====================================================== */}

              <h4
                style={{
                  marginBottom: "15px",
                }}
              >
                Part — A: Distribution of the Lab Assignments in Different Autonomy Levels*
              </h4>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Autonomy Level</th>

                    <th style={thStyle}>
                      Type of the Laboratory Assignment
                    </th>

                    <th
                      style={thStyle}
                      colSpan={4}
                    >
                      Stages in the Completion of the Lab Assignment
                    </th>

                    <th
                      style={thStyle}
                      colSpan={2}
                    >
                      How Many Assignments (number out of total)
                      According to —
                    </th>
                  </tr>

                  <tr>
                    <th style={thStyle}></th>

                    <th style={thStyle}></th>

                    <th style={thStyle}>Aim</th>

                    <th style={thStyle}>Material</th>

                    <th style={thStyle}>Methods</th>

                    <th style={thStyle}>Answer</th>

                    <th style={thStyle}>
                      Chairperson
                    </th>

                    <th style={thStyle}>
                      Auditor
                    </th>
                  </tr>
                </thead>

                <tbody>

                  <tr>
                    <td style={tdCenter}>0</td>

                    <td style={tdStyle}>
                      Demonstration
                    </td>

                    <td style={tdCenter}>Given</td>

                    <td style={tdCenter}>Given</td>

                    <td style={tdCenter}>Given</td>

                    <td style={tdCenter}>Given</td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>1</td>

                    <td style={tdStyle}>
                      Exercise
                    </td>

                    <td style={tdCenter}>Given</td>

                    <td style={tdCenter}>Given</td>

                    <td style={tdCenter}>Given</td>

                    <td style={tdCenter}>Open</td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>2</td>

                    <td style={tdStyle}>
                      Structured Enquiry
                    </td>

                    <td style={tdCenter}>Given</td>

                    <td style={tdCenter}>
                      Given in part / whole
                    </td>

                    <td style={tdCenter}>
                      Open in part / whole
                    </td>

                    <td style={tdCenter}>Open</td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                  <tr>
                    <td style={tdCenter}>3</td>

                    <td style={tdStyle}>
                      Open Ended Enquiry
                    </td>

                    <td style={tdCenter}>Given</td>

                    <td style={tdCenter}>Open</td>

                    <td style={tdCenter}>Open</td>

                    <td style={tdCenter}>Open</td>

                    <td style={tdStyle}></td>

                    <td style={tdStyle}></td>
                  </tr>

                </tbody>
              </table>

              <div
                style={{
                  marginTop: "20px",
                  lineHeight: "2",
                  fontSize: "14px",
                }}
              >
                <strong>
                  Name & Signature of the Course Chairperson:
                </strong>

                _____________________________

                <br />

                <strong>
                  Name & Signature of the Departmental Auditor:
                </strong>

                _____________________________

                <br />

                <strong>Date of Audit:</strong>

                _____________________________
              </div>

              <p
                style={{
                  marginTop: "12px",
                  fontStyle: "italic",
                  fontSize: "12px",
                }}
              >
                *Reference : Hazel and Baillie, 1998
              </p>

              {/* =====================================================
        PART B
    ====================================================== */}

              <h4
                style={{
                  marginTop: "35px",
                  marginBottom: "15px",
                }}
              >
                Part B : List of the Lab Assignment and Their
                Respective Autonomy Levels (with reference to Part A)
              </h4>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Sr. No.</th>

                    <th style={thStyle}>
                      Title of the Laboratory Assignment /
                      Experiment
                    </th>

                    <th
                      style={thStyle}
                      colSpan={2}
                    >
                      Autonomy Level (0 / 1 / 2 / 3)
                    </th>
                  </tr>

                  <tr>
                    <th style={thStyle}></th>

                    <th style={thStyle}></th>

                    <th style={thStyle}>
                      Chairperson
                    </th>

                    <th style={thStyle}>
                      Auditor
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {Array.from({ length: 10 }).map(
                    (_, index) => (
                      <tr key={index}>
                        <td style={tdCenter}>
                          {index + 1}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            height: "45px",
                          }}
                        ></td>

                        <td style={tdStyle}></td>

                        <td style={tdStyle}></td>
                      </tr>
                    )
                  )}

                </tbody>
              </table>

              <div
                style={{
                  marginTop: "20px",
                  lineHeight: "2",
                  fontSize: "14px",
                }}
              >
                <strong>
                  Name & Signature of the Course Chairperson:
                </strong>

                _____________________________

                <br />

                <strong>
                  Name & Signature of the Departmental Auditor:
                </strong>

                _____________________________

                <br />

                <strong>Date of Audit:</strong>

                _____________________________
              </div>
            </div>
          )}

          {/* ===== Part 4 starts after this ===== */}
          {/* ==========================================================
    BLOOM'S LEVEL MARKS DISTRIBUTION
========================================================== */}

          {selectedCourse && (
            <div
              style={{
                marginTop: "40px",
              }}
            >
              <h3
                style={{

                  color: "#100e0e",
                  padding: "10px 15px",
                  borderRadius: "4px",
                  marginBottom: "20px",
                }}
              >
                Bloom's Level Marks Distribution based on Actual Weightage %
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  alignItems: "start",
                }}
              >
                {/* ==========================
          PIE CHART
      ========================== */}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    background: "#fff",
                    height: "320px",
                    padding: "15px",
                  }}
                >
                  <ResponsiveContainer width={280} height={280}>
                    <PieChart>
                      <Pie
                        data={bloomData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={0}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                          const RADIAN = Math.PI / 180;
                          const radius =
                            innerRadius + (outerRadius - innerRadius) * 0.6;

                          const x =
                            cx + radius * Math.cos(-midAngle * RADIAN);

                          const y =
                            cy + radius * Math.sin(-midAngle * RADIAN);

                          return (
                            <text
                              x={x}
                              y={y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize={12}
                              fontWeight={600}
                              fill="#444"
                            >
                              {Number(value).toFixed(1)}%
                            </text>
                          );
                        }}
                        labelLine={false}
                      >
                        {bloomData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* ==========================
          TABLE
      ========================== */}

                <div>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      border: "1px solid #cfcfcf",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            border: "1px solid #cfcfcf",
                            padding: "10px",
                            background: "#f8f8f8",
                            textAlign: "center",
                          }}
                        >Bloom's Level</th>
                        <th
                          style={{
                            border: "1px solid #cfcfcf",
                            padding: "10px",
                            background: "#f8f8f8",
                            textAlign: "center",
                          }}
                        >Marks Distribution (X)</th>
                        <th
                          style={{
                            border: "1px solid #cfcfcf",
                            padding: "10px",
                            background: "#f8f8f8",
                            textAlign: "center",
                          }}
                        >% Distribution</th>
                      </tr>
                    </thead>

                    <tbody>

                      {bloomData.map((item) => (

                        <tr key={item.name}>

                          <td
                            style={{
                              border: "1px solid #cfcfcf",
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >{item.name}</td>

                          <td
                            style={{
                              border: "1px solid #cfcfcf",
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >{item.weightage_marks.toFixed(2)}</td>

                          <td
                            style={{
                              border: "1px solid #cfcfcf",
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >{item.value.toFixed(2)} %</td>

                        </tr>

                      ))}

                      <tr>

                        <th>Total</th>

                        <th>{totalWeightageMarks.toFixed(2)} (Y)</th>

                        <th>100.00 %</th>

                      </tr>

                    </tbody>
                  </table>

                </div>
              </div>
              <div
                style={{
                  marginTop: "25px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    borderBottom: "1px solid #d1d5db",
                    padding: "10px 15px",
                    fontWeight: 600,
                    color: "#100e0e",
                  }}
                >
                  Note
                </div>

                <div
                  style={{
                    padding: "15px",
                    lineHeight: "1.9",
                    fontSize: "14px",
                  }}
                >
                  <p>
                    The above pie chart depicts the individual Bloom's Level
                    actual marks percentage distribution as in the question
                    paper.
                  </p>

                  <p>
                    <strong>X</strong> = Individual Bloom's Level marks
                  </p>

                  <p>
                    <strong>Y</strong> = Sum of all Bloom's Level marks
                  </p>

                  <p>
                    <strong>% Distribution</strong> = (X / Y) × 100
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionPaperAuditReportPage;