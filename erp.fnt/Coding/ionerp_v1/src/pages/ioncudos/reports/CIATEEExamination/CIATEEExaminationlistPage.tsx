import React, { useEffect, useState } from "react";
import Select from "react-select";
import { FileText, File } from "lucide-react";

const API_BASE_URL = "http://localhost:8000/cia-tee-exam";

// ======================================================
// TYPES
// ======================================================
interface OptionItem {
  value: string | number;
  label: string;
}

interface QuestionType {
  qp_mq_id?: number;

  qno: string;
  question: string;
  marks: string | number;

  unit?: string;

  is_or?: number;

  mandatory?: boolean;

  or_group?: boolean;

  // ADD THIS
  start_block?: boolean;

  type?: "question" | "or_start" | "or_separator" | "or_end";
}

interface ReportHeader {
  qpd_id?: number;
  qpd_title: string;
  qpd_timing: string;
  maximum_marks: string | number;
  course_name: string;
  course_code: string;
  academic_batch?: string;
  semester?: string;
  term_name?: string;
}

interface ReportResponse {
  header: ReportHeader;
  questions: QuestionType[];
  blooms_distribution?: any[];
  co_distribution?: any[];
}

const CIATEEExaminationlistPage = () => {
  // ======================================================
  // STATES
  // ======================================================
  const [loading, setLoading] = useState(false);

  const [curriculumList, setCurriculumList] = useState<any[]>([]);

  const [semesterOptions, setSemesterOptions] = useState<
    OptionItem[]
  >([]);

  const [courseOptions, setCourseOptions] = useState<
    OptionItem[]
  >([]);

  const [occasionOptions, setOccasionOptions] = useState<
    OptionItem[]
  >([]);

  const [selectedCurriculum, setSelectedCurriculum] =
    useState<OptionItem | null>(null);

  const [selectedSemester, setSelectedSemester] =
    useState<OptionItem | null>(null);

  const [selectedCourse, setSelectedCourse] =
    useState<OptionItem | null>(null);

  const [selectedOccasion, setSelectedOccasion] =
    useState<OptionItem | null>(null);

  const [examType, setExamType] = useState("");

  const [reportData, setReportData] =
    useState<ReportResponse | null>(null);

  // ======================================================
  // COMMON SELECT STYLES
  // ======================================================
  const selectStyles: any = {
    control: (base: any) => ({
      ...base,
      minHeight: "32px",
      height: "32px",
      fontSize: "12px",
      border: "1px solid #cbd5e1",
      boxShadow: "none",
    }),

    valueContainer: (base: any) => ({
      ...base,
      height: "32px",
      padding: "0 8px",
    }),

    input: (base: any) => ({
      ...base,
      margin: "0px",
    }),

    indicatorsContainer: (base: any) => ({
      ...base,
      height: "32px",
    }),

    menu: (base: any) => ({
      ...base,
      fontSize: "12px",
      zIndex: 9999,
    }),

    option: (base: any, state: any) => ({
      ...base,
      fontSize: "12px",
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
  };

  // ======================================================
  // FETCH CURRICULUM
  // ======================================================
  useEffect(() => {
    fetchCurriculumDropdown();
  }, []);

  const fetchCurriculumDropdown = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/academic-batch-dropdown`
      );

      const data = await response.json();

      setCurriculumList(data?.data || []);
    } catch (error) {
      console.error("Curriculum Error:", error);
      setCurriculumList([]);
    }
  };

  // ======================================================
  // FETCH SEMESTERS
  // ======================================================
  const fetchSemesterDropdown = async (
    academic_batch_id: string | number
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/semester-dropdown?academic_batch_id=${academic_batch_id}`
      );

      const data = await response.json();

      setSemesterOptions(data?.data || []);
    } catch (error) {
      console.error("Semester Error:", error);
      setSemesterOptions([]);
    }
  };

  // ======================================================
  // FETCH COURSES
  // ======================================================
  const fetchCourseDropdown = async (
    academic_batch_id: string | number,
    semester_id: string | number
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/course-dropdown?academic_batch_id=${academic_batch_id}&semester_id=${semester_id}`
      );

      const data = await response.json();

      setCourseOptions(data?.data || []);
    } catch (error) {
      console.error("Course Error:", error);
      setCourseOptions([]);
    }
  };

  // ======================================================
  // FETCH OCCASIONS
  // ======================================================
  const fetchOccasionDropdown = async () => {
    try {
      if (
        !selectedCurriculum?.value ||
        !selectedSemester?.value ||
        !selectedCourse?.value
      ) {
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/occasion-dropdown?academic_batch_id=${selectedCurriculum.value}&semester_id=${selectedSemester.value}&crs_id=${selectedCourse.value}&exam_type=${examType}`
      );

      const data = await response.json();

      setOccasionOptions(data?.data || []);
    } catch (error) {
      console.error("Occasion Error:", error);
      setOccasionOptions([]);
    }
  };

  // ======================================================
  // FETCH REPORT
  // ======================================================
  const fetchReport = async (ao_id?: string | number) => {
    try {
      if (
        !selectedCurriculum?.value ||
        !selectedSemester?.value ||
        !selectedCourse?.value
      ) {
        return;
      }

      setLoading(true);

      let url =
        `${API_BASE_URL}/question-paper-report` +
        `?academic_batch_id=${selectedCurriculum.value}` +
        `&semester_id=${selectedSemester.value}` +
        `&crs_id=${selectedCourse.value}` +
        `&exam_type=${examType}`;

      if (examType === "CIA" && ao_id) {
        url += `&ao_id=${ao_id}`;
      }

      console.log("Request URL:", url);

      const response = await fetch(url);
      const data = await response.json();

      if (data?.status) {
        setReportData({
          header: data.header || {},
          questions: data.questions || [],
          blooms_distribution: data.blooms_distribution || [],
          co_distribution: data.co_distribution || [],
        });
      } else {
        setReportData(null);
      }
    } catch (error) {
      console.error("Report Error:", error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CURRICULUM CHANGE
  // ======================================================
  const handleCurriculumChange = (
    selected: OptionItem | null
  ) => {
    setSelectedCurriculum(selected);

    setSelectedSemester(null);
    setSelectedCourse(null);
    setSelectedOccasion(null);

    setSemesterOptions([]);
    setCourseOptions([]);
    setOccasionOptions([]);

    setReportData(null);

    if (selected?.value) {
      fetchSemesterDropdown(selected.value);
    }
  };

  // ======================================================
  // SEMESTER CHANGE
  // ======================================================
  const handleSemesterChange = (
    selected: OptionItem | null
  ) => {
    setSelectedSemester(selected);

    setSelectedCourse(null);
    setSelectedOccasion(null);

    setCourseOptions([]);
    setOccasionOptions([]);

    setReportData(null);

    if (
      selected?.value &&
      selectedCurriculum?.value
    ) {
      fetchCourseDropdown(
        selectedCurriculum.value,
        selected.value
      );
    }
  };

  // ======================================================
  // COURSE CHANGE
  // ======================================================
  const handleCourseChange = (
    selected: OptionItem | null
  ) => {
    setSelectedCourse(selected);

    setSelectedOccasion(null);
    setOccasionOptions([]);

    setReportData(null);

    if (selected?.value) {
      fetchOccasionDropdown();
    }
  };

  // ======================================================
  // EXAM TYPE CHANGE
  // ======================================================
  useEffect(() => {
    if (selectedCourse?.value) {
      setSelectedOccasion(null);
      setOccasionOptions([]);
      setReportData(null);

      fetchOccasionDropdown();
    }
  }, [examType]);

  // ======================================================
  // OCCASION CHANGE
  // ======================================================
  const handleOccasionChange = (selected: OptionItem | null) => {
    setSelectedOccasion(selected);

    if (selected) {
      fetchReport(selected.value);
    } else {
      setReportData(null);
    }
  };

  // ======================================================
  // EXPORT
  // ======================================================
  const exportPDF = () => {
    if (
      !selectedCurriculum?.value ||
      !selectedSemester?.value ||
      !selectedCourse?.value
    ) {
      return;
    }

    window.open(
      `${API_BASE_URL}/question-paper-report/pdf?academic_batch_id=${selectedCurriculum.value}&semester_id=${selectedSemester.value}&crs_id=${selectedCourse.value}&exam_type=${examType}&ao_id=${selectedOccasion?.value || ""}`,
      "_blank"
    );
  };

  const exportDOC = () => {
    if (
      !selectedCurriculum?.value ||
      !selectedSemester?.value ||
      !selectedCourse?.value
    ) {
      return;
    }

    window.open(
      `${API_BASE_URL}/question-paper-report/doc?academic_batch_id=${selectedCurriculum.value}&semester_id=${selectedSemester.value}&crs_id=${selectedCourse.value}&exam_type=${examType}&ao_id=${selectedOccasion?.value || ""}`,
      "_blank"
    );
  };
  const curriculumOptions = curriculumList.flatMap(
    (department: any) => [
      {
        value: `header-${department.department_name}`,
        label: department.department_name,
        isDisabled: true,
      },

      ...(department.curriculums || []).map((item: any) => ({
        value: item.value,
        label: item.label,
      })),
    ]
  );

  return (
    <div
      style={{
        padding: "10px",
        background: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div className="bg-white px-3 py-2 text-[#4f7f82] font-semibold border border-[#d9d9d9]">
        Continuous Internal Assessment (CIA),
        Term End Examination (TEE) Report
      </div>

      {/* MAIN CARD */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #d1d5db",
          borderTop: "none",
          padding: "10px",
        }}
      >
        {/* FILTERS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              examType === "CIA"
                ? "repeat(5, minmax(0, 1fr))"
                : "repeat(4, minmax(0, 1fr))",
            gap: "15px",
            marginBottom: "15px",
            alignItems: "end",
            transition: "all 0.3s ease",
          }}
        >
          {/* CURRICULUM */}
          <div>
            <label
              style={{
                fontSize: "12px",
                marginBottom: "5px",
                display: "block",
              }}
            >
              Curriculum
            </label>

            <Select
              value={curriculumOptions.find(
                (o) => o.value === selectedCurriculum?.value
              )}
              options={curriculumOptions}
              placeholder="Select Curriculum"
              isClearable
              isOptionDisabled={(option) => option.isDisabled}
              styles={{
                ...selectStyles,

                menuList: (base: any) => ({
                  ...base,
                  padding: 0,
                  margin: 0,
                }),

                option: (base: any, state: any) => ({
                  ...base,

                  minHeight: "28px",

                  padding: state.data.isDisabled
                    ? "6px 10px"
                    : "4px 10px",

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
                }),
              }}
              onChange={(selected: any) => {

                if (!selected) {
                  handleCurriculumChange(null);
                  return;
                }

                if (String(selected.value).startsWith("header-")) {
                  return;
                }

                handleCurriculumChange(selected);
              }}
            />
          </div>

          {/* SEMESTER */}
          <div>
            <label
              style={{
                fontSize: "12px",
                marginBottom: "5px",
                display: "block",
              }}
            >
              Semester
            </label>

            <Select
              value={selectedSemester}
              onChange={(selected) => handleSemesterChange(selected)}
              options={semesterOptions}
              styles={selectStyles}
              placeholder="Select Semester"
              isClearable
            />
          </div>

          {/* COURSE */}
          <div>
            <label
              style={{
                fontSize: "12px",
                marginBottom: "5px",
                display: "block",
              }}
            >
              Course
            </label>

            <Select
              value={selectedCourse}
              onChange={(selected) => handleCourseChange(selected)}
              options={courseOptions}
              styles={selectStyles}
              placeholder="Select Course"
              isClearable
            />
          </div>

          {/* EXAM TYPE */}
          <div>
            <label
              style={{
                fontSize: "12px",
                marginBottom: "5px",
                display: "block",
              }}
            >
              Exam Type
            </label>

            <select
              value={examType}
              onChange={(e) => {
                const value = e.target.value;

                setExamType(value);

                // Reset occasion whenever exam type changes
                setSelectedOccasion(null);
                setOccasionOptions([]);
                setReportData(null);
              }}
              style={{
                width: "100%",
                height: "38px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                fontSize: "12px",
                padding: "0 8px",
                background: "#fff",
              }}
            >
              <option value="">Select Exam Type</option>
              <option value="CIA">CIA</option>
              <option value="TEE">TEE</option>
            </select>
          </div>

          {/* OCCASION */}
          {examType === "CIA" && (
            <div>
              <label
                style={{
                  fontSize: "12px",
                  marginBottom: "5px",
                  display: "block",
                }}
              >
                Occasion
              </label>

              <Select
                value={selectedOccasion}
                onChange={(selected) => handleOccasionChange(selected)}
                options={occasionOptions}
                styles={selectStyles}
                placeholder="Select Occasion"
                isClearable
              />
            </div>
          )}
        </div>

        {/* EXPORT */}
        {reportData && (
          <div className="flex justify-end mb-4">
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

        {/* LOADING */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              fontSize: "13px",
            }}
          >
            Loading...
          </div>
        )}

        {/* REPORT */}
        {!loading && reportData && (
          <>
            {/* HEADER TABLE */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                marginBottom: "10px",
              }}
            >
              <tbody>
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      border: "1px solid #d1d5db",
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    Question Paper Title :
                    {reportData.header.qpd_title}
                  </td>
                </tr>

                <tr>
                  <td
                    style={{
                      border: "1px solid #d1d5db",
                      padding: "8px",
                      width: "30%",
                    }}
                  >
                    Total Duration (H:M) :
                    {reportData.header.qpd_timing}
                  </td>

                  <td
                    style={{
                      border: "1px solid #d1d5db",
                      padding: "8px",
                      width: "40%",
                    }}
                  >
                    Course :
                    {reportData.header.course_name} (
                    {reportData.header.course_code})
                  </td>

                  <td
                    style={{
                      border: "1px solid #d1d5db",
                      padding: "8px",
                      width: "30%",
                    }}
                  >
                    Maximum Marks  :
                    {reportData.header.maximum_marks}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* NOTE */}
            <div
              style={{
                marginBottom: "10px",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              <strong>Note :</strong> An asterisk{" "}
              <span
                style={{
                  color: "red",
                  fontWeight: "bold",
                }}
              >
                (*)
              </span>{" "}
              indicates a mandatory question.
            </div>

            {/* QUESTION TABLE */}
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
                  fontSize: "12px",
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
                        width: "10%",
                      }}
                    >
                      Q.No
                    </th>

                    <th
                      style={{
                        border: "1px solid #d1d5db",
                        padding: "8px",
                      }}
                    >
                      Question
                    </th>

                    <th
                      style={{
                        border: "1px solid #d1d5db",
                        padding: "8px",
                        width: "10%",
                      }}
                    >
                      Marks
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reportData.questions.map((item, index) => {

                    // OR Row
                    if (item.is_or === 1) {
                      return (
                        <tr key={index}>
                          <td
                            colSpan={3}
                            style={{
                              borderLeft: "1px solid #d1d5db",
                              borderRight: "1px solid #d1d5db",
                              borderTop: "1px solid #999",
                              borderBottom: "1px solid #999",
                              textAlign: "center",
                              fontWeight: 700,
                              padding: "10px",
                              background: "#fff"
                            }}
                          >
                            OR
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={index}>
                        {/* Question No */}
                        <td
                          style={{
                            borderLeft: "1px solid #d1d5db",
                            borderRight: "1px solid #d1d5db",
                            borderBottom: "1px solid #d1d5db",

                            // Thick border when backend says start of block
                            borderTop:
                              item.start_block
                                ? "2px solid #444"
                                : "1px solid #d1d5db",

                            padding: "8px",
                            width: "10%",
                            verticalAlign: "top"
                          }}
                        >
                          {item.qno}

                          {item.mandatory && (
                            <span
                              style={{
                                color: "red",
                                fontWeight: 700
                              }}
                            >
                              *
                            </span>
                          )}
                        </td>

                        {/* Question */}
                        <td
                          style={{
                            borderLeft: "1px solid #d1d5db",
                            borderRight: "1px solid #d1d5db",
                            borderBottom: "1px solid #d1d5db",

                            borderTop:
                              item.start_block
                                ? "2px solid #444"
                                : "1px solid #d1d5db",

                            padding: "8px"
                          }}
                        >
                          {item.question}
                        </td>

                        {/* Marks */}
                        <td
                          style={{
                            borderLeft: "1px solid #d1d5db",
                            borderRight: "1px solid #d1d5db",
                            borderBottom: "1px solid #d1d5db",

                            borderTop:
                              item.start_block
                                ? "2px solid #444"
                                : "1px solid #d1d5db",

                            width: "10%",
                            textAlign: "center",
                            padding: "8px"
                          }}
                        >
                          {item.marks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CIATEEExaminationlistPage;