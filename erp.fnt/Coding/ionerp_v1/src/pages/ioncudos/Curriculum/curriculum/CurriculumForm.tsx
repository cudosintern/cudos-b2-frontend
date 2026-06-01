import React, { useState, useEffect } from "react";
import "./Curriculum.css";
import {
  FaCheck,
  FaTimes,
  FaSync,
  FaSave,
  FaChevronDown,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCurriculum,
  updateCurriculum,
  getCurriculumById,
  getProgramsDropdown,
  getProgramOwners,
  getSchoolsDropdown,
  getUsersDropdown,
  getProgramDetails,
  getImportCurriculumList,
  getCurriculumTermDetails,
  createCurriculumTermDetails,
  updateCurriculumTermDetail,
} from "./curriculumSchema";
import {
  Curriculum,
  Program,
  ProgramOwner,
} from "./curriculumResponseInterface";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import UIButton from "../../../../components/FormBuilder/fields/Button";

// Year Picker Component
const YearPicker = ({
  selectedYear,
  onChange,
  hasError,
}: {
  selectedYear: number | undefined;
  onChange: (year: number) => void;
  hasError?: boolean;
}) => {
  return (
    <DatePicker
      selected={selectedYear ? new Date(selectedYear, 0, 1) : null}
      onChange={(date: Date | null) => date && onChange(date.getFullYear())}
      showYearPicker
      dateFormat="yyyy"
      className={`w-full border p-2 rounded text-sm transition-all focus:ring-1 focus:ring-[#437880] focus:border-[#437880] outline-none ${hasError ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}`}
      placeholderText="Select year"
    />
  );
};

interface TermRow {
  semester_id?: number;
  term_no: number;
  term_name: string;
  duration_weeks: number;
  total_credits?: number;
  total_theory_courses?: number;
  total_practical_others?: number;
  academic_start_year?: number;
  academic_end_year?: number;
  academic_year?: string;
}

const CurriculumForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // --- State ---
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Curriculum>>({});
  const [programs, setPrograms] = useState<Program[]>([]);
  const [owners, setOwners] = useState<ProgramOwner[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolUsers, setSchoolUsers] = useState<any[]>([]);
  const [allCurricula, setAllCurricula] = useState<Curriculum[]>([]);
  const [isProgramDetailsOpen, setIsProgramDetailsOpen] = useState(false);

  const defaultTermRows: TermRow[] = Array.from({ length: 8 }, (_, i) => ({
    term_no: i + 1,
    term_name: `${i + 1} - Semester`,
    duration_weeks: 16,
  }));

  const [termRows, setTermRows] = useState<TermRow[]>([]);
  const [importCurriculumId, setImportCurriculumId] = useState<number | "">("");
  const [approvalData, setApprovalData] = useState<{
    school_id: number | null;
    user_id: number | null;
  }>({
    school_id: null,
    user_id: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Effects ---
  useEffect(() => {
    loadDropdowns();
    if (isEditMode) {
      loadData(Number(id));
    } else {
      setFormData({
        terms: [],
        status: true,
        competency_pi_status: "Mandatory",
        course_mapping_status: "Optional",
        student_registration_status: "Mandatory",
      });
    }
  }, [id]);

  const loadData = async (curriculumId: number) => {
    setLoading(true);
    try {
      const res = await getCurriculumById(curriculumId);
      if (res.data) {
        let data = res.data;
        if (res.data.program_id) {
          try {
            const ownersRes = await getProgramOwners(res.data.program_id);
            setOwners(ownersRes.data || []);
            const detailsRes = await getProgramDetails(res.data.program_id);
            if (detailsRes) {
              const details = detailsRes.data ? detailsRes.data : detailsRes;
              data = {
                ...data,
                total_terms: details.total_terms,
                total_credits: details.total_credits,
                term_min_credits: details.term_min_credits,
                term_max_credits: details.term_max_credits,
                term_min_duration: details.term_min_duration,
                term_max_duration: details.term_max_duration,
              };
            }
          } catch (e) {
            console.error(e);
          }
        }
        setFormData(data);
        if (res.data.school_id) {
          loadUsers(res.data.school_id);
          setApprovalData({
            school_id: res.data.school_id,
            user_id: res.data.authority_user_id || null,
          });
        }
        try {
          const termRes = await getCurriculumTermDetails(curriculumId);
          if (termRes.status && termRes.data && termRes.data.length > 0) {
            const mappedTerms = termRes.data.map((t: any) => ({
              semester_id: t.semester_id,
              term_no: t.si_no || t.term_no,
              term_name: t.term_name,
              duration_weeks: t.duration_weeks || 16,
              total_credits: t.total_credits || t.credits,
              total_theory_courses: t.total_theory_courses,
              total_practical_others: t.total_practical_others,
              academic_start_year: t.academic_start_year,
              academic_end_year: t.academic_end_year,
              academic_year: t.academic_year,
            }));
            setTermRows(mappedTerms);
          }
        } catch (e) {
          console.warn(e);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const res = await getProgramsDropdown();
      if (res.status !== false) setPrograms(res.data || []);
      const schoolsRes = await getSchoolsDropdown();
      if (schoolsRes.status !== false) setSchools(schoolsRes.data || []);
      const curriculaRes = await getImportCurriculumList();
      if (curriculaRes.status !== false)
        setAllCurricula(curriculaRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUsers = async (schoolId: number) => {
    try {
      const res = await getUsersDropdown(schoolId);
      if (res.status !== false) setSchoolUsers(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.program_id)
      newErrors.program_id = "Program Title is required";
    if (!formData.start_year) newErrors.start_year = "Start Year is required";
    if (!formData.end_year) newErrors.end_year = "End Year is required";
    if (!formData.crclm_name || formData.crclm_name.trim() === "")
      newErrors.crclm_name = "Curriculum Name is required";
    if (!formData.program_owner_id)
      newErrors.program_owner_id = "Program Owner is required";
    if (!approvalData.school_id)
      newErrors.school_id = "Approval Authority is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.warning("Please fill all required fields correctly.");
      return;
    }

    try {
      const curriculumTotals = {
        total_credits: termRows.reduce((a, b) => a + (b.total_credits || 0), 0),
        total_terms: termRows.length,
      };

      const payload = {
        ...formData,
        ...curriculumTotals,
        school_id: approvalData.school_id,
        authority_user_id: approvalData.user_id,
        approval_authority: {
          authority_type: "School",
          school_id: approvalData.school_id,
          user_id: approvalData.user_id,
        },
      } as any;

      let curriculumId = formData.crclm_id;

      if (isEditMode && curriculumId) {
        await updateCurriculum(curriculumId, payload);
        for (const row of termRows) {
          if (row.semester_id)
            await updateCurriculumTermDetail(
              row.semester_id,
              curriculumId,
              row,
            );
        }
        toast.success("Curriculum updated successfully");
      } else {
        const res = await createCurriculum(payload);
        curriculumId = res.data.crclm_id;
        if (curriculumId)
          await createCurriculumTermDetails(curriculumId, termRows);
        toast.success("Curriculum saved successfully");
      }
      navigate(-1);
    } catch (e: any) {
      console.error("Save failed", e);
      toast.error(e.response?.data?.message || "Failed to save curriculum");
    }
  };

  const shortenProgramTitle = (title: string) => {
    if (!title) return "";
    let shortName = title;

    // Degree replacements based on screenshot styles (flexible for spaces or hyphens)
    shortName = shortName.replace(
      /Bachelor[\s-]*of[\s-]*Engineering/gi,
      "B. E",
    );
    shortName = shortName.replace(
      /Bachelor[\s-]*of[\s-]*Technology/gi,
      "B.Tech",
    );
    shortName = shortName.replace(/Master[\s-]*of[\s-]*Engineering/gi, "M.E");
    shortName = shortName.replace(
      /Master[\s-]*of[\s-]*Techn?ology/gi,
      "M.Tech",
    );
    shortName = shortName.replace(
      /Master[\s-]*of[\s-]*Business[\s-]*Administration/gi,
      "MBA",
    );

    // Handle "in" streams
    if (shortName.includes(" in ")) {
      let [prefix, stream] = shortName.split(" in ");

      prefix = prefix.trim();
      // Special case for B. E (keep space)
      if (prefix === "B. E") {
        // keep as is
      } else {
        // Split by spaces or existing hyphens, filter empty components, and join with single hyphen
        prefix = prefix
          .split(/[\s-]+/)
          .filter(Boolean)
          .join("-");
      }

      const streamInitials = stream
        .split(/\s+/)
        .filter(
          (word) => !["and", "of", "the", "&"].includes(word.toLowerCase()),
        )
        .map((word) => word[0]?.toUpperCase())
        .join("");

      return `${prefix} in ${streamInitials}`;
    }

    return shortName.trim().split(/\s+/).join("-");
  };

  const getGeneratedCurriculumName = (
    pgm_id: number,
    startYear?: number,
    endYear?: number,
  ) => {
    const prog = programs.find((p) => p.pgm_id === pgm_id);
    if (!prog) return "";
    const base = shortenProgramTitle(prog.pgm_title);
    if (startYear && endYear) {
      return `${base} ${startYear}-${endYear}`;
    }
    return base;
  };

  const handleProgramChange = async (pgm_id: number) => {
    // Reset program-specific state to prevent showing stale data from previous selection
    setOwners([]);
    setTermRows([]);

    const selectedProg = programs.find((p) => p.pgm_id === pgm_id);
    let autoName = getGeneratedCurriculumName(
      pgm_id,
      formData.start_year,
      formData.end_year,
    );

    let newData = {
      ...formData,
      program_id: pgm_id,
      crclm_name: autoName,
      // Reset program details in formData
      total_terms: undefined,
      total_credits: undefined,
      term_min_credits: undefined,
      term_max_credits: undefined,
      term_min_duration: undefined,
      term_max_duration: undefined,
      program_owner_id: undefined,
    };

    try {
      const res = await getProgramOwners(pgm_id);
      setOwners(res.data || []);
    } catch (e) {
      console.error("Failed to fetch program owners:", e);
    }

    try {
      const detailsRes = await getProgramDetails(pgm_id);
      if (detailsRes) {
        const details = detailsRes.data ? detailsRes.data : detailsRes;
        const totalTerms =
          details.total_terms || details.total_no_of_terms || 0;

        // Calculate end_year based on terms: StartYear + (Terms/2)
        let newEndYear = formData.end_year;
        if (formData.start_year && totalTerms > 0) {
          newEndYear = formData.start_year + Math.ceil(totalTerms / 2);
        }

        // Regenerate name with new end year
        autoName = getGeneratedCurriculumName(
          pgm_id,
          formData.start_year,
          newEndYear,
        );

        // Update term details based on program configuration
        if (totalTerms > 0) {
          const dynamicTermRows: TermRow[] = Array.from(
            { length: totalTerms },
            (_, i) => ({
              term_no: i + 1,
              term_name: `${i + 1} - Semester`,
              duration_weeks: 16,
            }),
          );
          setTermRows(dynamicTermRows);
        }

        newData = {
          ...newData,
          total_terms: totalTerms,
          total_credits: details.total_credits,
          term_min_credits: details.term_min_credits,
          term_max_credits: details.term_max_credits,
          term_min_duration: details.term_min_duration,
          term_max_duration: details.term_max_duration,
          end_year: newEndYear,
          crclm_name: autoName,
        };
      }
    } catch (e) {
      console.error("Failed to fetch program details:", e);
    }
    setFormData(newData);
  };

  const handleReset = () => {
    setFormData({
      terms: [],
      status: true,
      competency_pi_status: "Mandatory",
      course_mapping_status: "Optional",
      student_registration_status: "Mandatory",
    });
    setTermRows([]);
    setApprovalData({ school_id: null, user_id: null });
    setErrors({});
  };

  const handleTermRowChange = (
    index: number,
    field: keyof TermRow,
    value: any,
  ) => {
    const newRows = [...termRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setTermRows(newRows);
  };

  const fetchTermDetails = async (curriculumId: number) => {
    if (!curriculumId) return;
    setLoading(true);
    try {
      const res = await getCurriculumTermDetails(curriculumId);
      if (res.status && res.data && res.data.length > 0) {
        const mappedTerms = res.data.map((t: any) => ({
          term_no: t.si_no || t.term_no,
          term_name: t.term_name,
          duration_weeks: t.duration_weeks || 16,
          total_credits: t.total_credits || t.credits,
          total_theory_courses: t.total_theory_courses,
          total_practical_others: t.total_practical_others,
          academic_start_year: t.academic_start_year,
          academic_end_year: t.academic_end_year,
          academic_year: t.academic_year,
        }));
        setTermRows(mappedTerms);
        toast.info("Term details imported successfully");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totals = termRows.reduce(
    (acc, row) => ({
      credits: acc.credits + (Number(row.total_credits) || 0),
      theory: acc.theory + (Number(row.total_theory_courses) || 0),
      practical: acc.practical + (Number(row.total_practical_others) || 0),
    }),
    { credits: 0, theory: 0, practical: 0 },
  );

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Loading curriculum details...
      </div>
    );

  return (
    <div className="">
      <h3 className="text-lg font-medium pb-5">
        {isEditMode
          ? "Edit Curriculum (Regulation)"
          : "Add Curriculum (Regulation)"}
      </h3>

      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        {/* Basic Details Section */}
        <h3 className="text-[#437880] text-base font-semibold border-b border-gray-100 pb-3 mb-6">
          Add Curriculum (Regulation)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <label className="text-sm font-medium text-gray-700 md:text-right">
                Program Title <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-3">
                <select
                  className={`w-full rounded-md shadow-sm border p-2 text-sm transition-all focus:ring-1 focus:ring-[#437880] focus:border-[#437880] outline-none ${errors.program_id ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}`}
                  value={formData.program_id || ""}
                  onChange={(e) => {
                    handleProgramChange(Number(e.target.value));
                    if (e.target.value)
                      setErrors((prev) => ({ ...prev, program_id: "" }));
                  }}
                >
                  <option value="">Select Program</option>
                  {programs.map((p) => (
                    <option key={p.pgm_id} value={p.pgm_id}>
                      {p.pgm_title}
                    </option>
                  ))}
                </select>
                {errors.program_id && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">
                    {errors.program_id}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <label className="text-sm font-medium text-gray-700 md:text-right">
                Curriculum Year <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-3 flex gap-4">
                <div className="flex-1">
                  <YearPicker
                    selectedYear={formData.start_year}
                    onChange={(year) => {
                      const start = year;
                      const terms = formData.total_terms || 0;
                      // Dynamic duration: terms / 2
                      const end =
                        terms > 0 ? start + Math.ceil(terms / 2) : start + 4;
                      const autoName = formData.program_id
                        ? getGeneratedCurriculumName(
                            formData.program_id,
                            start,
                            end,
                          )
                        : "";
                      setFormData({
                        ...formData,
                        start_year: start,
                        end_year: end,
                        crclm_name: autoName,
                      });
                      setErrors((prev) => ({
                        ...prev,
                        start_year: "",
                        end_year: "",
                      }));
                    }}
                    hasError={!!errors.start_year}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Start Year</p>
                </div>
                <div className="flex-1">
                  <YearPicker
                    selectedYear={formData.end_year}
                    onChange={(year) => {
                      const autoName = formData.program_id
                        ? getGeneratedCurriculumName(
                            formData.program_id,
                            formData.start_year,
                            year,
                          )
                        : "";
                      setFormData({
                        ...formData,
                        end_year: year,
                        crclm_name: autoName,
                      });
                      setErrors((prev) => ({ ...prev, end_year: "" }));
                    }}
                    hasError={!!errors.end_year}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">End Year</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <label className="text-sm font-medium text-gray-700 md:text-right">
                Curriculum Name <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-3">
                <input
                  type="text"
                  className={`w-full border p-2 rounded text-sm transition-all focus:ring-1 focus:ring-[#437880] focus:border-[#437880] outline-none ${errors.crclm_name ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}`}
                  value={formData.crclm_name || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, crclm_name: e.target.value });
                    if (e.target.value.trim())
                      setErrors((prev) => ({ ...prev, crclm_name: "" }));
                  }}
                  placeholder="Enter Curriculum Name"
                />
                {errors.crclm_name && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">
                    {errors.crclm_name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              <label className="text-sm font-medium text-gray-700 md:text-right pt-2">
                Description
              </label>
              <div className="md:col-span-3">
                <textarea
                  className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-[#437880] focus:border-[#437880] outline-none transition-all"
                  rows={3}
                  placeholder="Brief description..."
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                ></textarea>
                <div className="text-right text-[10px] text-gray-400 mt-1">
                  {(formData.description || "").length} / 2000
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <label className="text-sm font-medium text-gray-700 md:text-right">
                Program Owner <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-3">
                <select
                  className={`w-full border p-2 rounded text-sm transition-all focus:ring-1 focus:ring-[#437880] focus:border-[#437880] outline-none ${errors.program_owner_id ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}`}
                  value={formData.program_owner_id || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      program_owner_id: Number(e.target.value),
                    });
                    if (e.target.value)
                      setErrors((prev) => ({ ...prev, program_owner_id: "" }));
                  }}
                >
                  <option value="">Select User</option>
                  {owners.map((o) => (
                    <option key={o.user_id} value={o.user_id}>
                      {o.user_name}
                    </option>
                  ))}
                </select>
                {errors.program_owner_id && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">
                    {errors.program_owner_id}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Program Stats Accordion Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsProgramDetailsOpen(!isProgramDetailsOpen)}
              >
                <span className="text-xs font-bold text-[#437880] uppercase tracking-wider">
                  Program Details
                </span>
                <FaChevronDown
                  className={`text-[#437880] transition-transform duration-300 ${isProgramDetailsOpen ? "rotate-180" : ""}`}
                  size={12}
                />
              </div>
              <div
                className={`transition-all duration-300 overflow-hidden ${isProgramDetailsOpen ? "max-h-[500px]" : "max-h-0"}`}
              >
                <div className="p-4 space-y-3 bg-white">
                  {[
                    { label: "Terms", value: formData.total_terms },
                    { label: "Credits", value: formData.total_credits },
                    { label: "Min Credits", value: formData.term_min_credits },
                    { label: "Max Credits", value: formData.term_max_credits },
                    {
                      label: "Min Duration",
                      value: formData.term_min_duration,
                    },
                    {
                      label: "Max Duration",
                      value: formData.term_max_duration,
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0"
                    >
                      <span className="text-[11px] font-medium text-gray-500">
                        {stat.label}
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        {stat.value || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Term Details Table Section */}
        <h3 className="text-[#437880] text-base font-semibold border-b border-gray-100 pb-3 mb-6 mt-12">
          Curriculum Term Details
        </h3>

        <div className="mb-6 flex items-center gap-4 bg-[#f8fafc] p-4 rounded-lg border border-gray-100">
          <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-tight">
            Import from existing:
          </span>
          <select
            className="border border-gray-300 p-2 rounded-md text-sm focus:ring-1 focus:ring-[#437880] outline-none min-w-[250px]"
            value={importCurriculumId}
            onChange={(e) => {
              const val = Number(e.target.value);
              setImportCurriculumId(val || "");
              if (val) fetchTermDetails(val);
            }}
          >
            <option value="">-- Choose Curriculum --</option>
            {allCurricula.map((c: any) => (
              <option
                key={c.crclm_id || c.academic_batch_id || c.id}
                value={c.crclm_id || c.academic_batch_id || c.id}
              >
                {c.crclm_name || c.academic_batch_code || c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mb-12">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#f2f4f6] text-[#6b7280] font-bold text-[10px] tracking-widest uppercase border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 border-r border-gray-200">Sl</th>
                <th className="px-4 py-3 border-r border-gray-200">
                  Term Name *
                </th>
                <th className="px-4 py-3 border-r border-gray-200">
                  Duration (Wk) *
                </th>
                <th className="px-4 py-3 border-r border-gray-200">Credits</th>
                <th className="px-4 py-3 border-r border-gray-200">Theory *</th>
                <th className="px-4 py-3 border-r border-gray-200">
                  Practical *
                </th>
                <th className="px-4 py-3 border-r border-gray-200">
                  Start Year *
                </th>
                <th className="px-4 py-3 border-r border-gray-200">
                  End Year *
                </th>
                <th className="px-4 py-3">Acad. Year *</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {termRows.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-[#f9fafb] transition-colors tabular-nums"
                >
                  <td className="px-4 py-2 text-center font-bold text-gray-400 border-r border-gray-100">
                    {row.term_no}
                  </td>
                  <td className="px-2 py-2 border-r border-gray-100">
                    <input
                      type="text"
                      disabled
                      className="w-full bg-transparent px-2 py-1.5 border-none text-gray-600 font-medium disabled:opacity-80"
                      value={row.term_name}
                    />
                  </td>
                  <td className="px-2 py-2 border-r border-gray-100">
                    <select
                      className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 rounded focus:border-[#437880] focus:ring-1 focus:ring-[#437880] outline-none bg-transparent transition-all"
                      value={row.duration_weeks}
                      onChange={(e) =>
                        handleTermRowChange(
                          index,
                          "duration_weeks",
                          Number(e.target.value),
                        )
                      }
                    >
                      <option value={16}>16</option>
                      <option value={18}>18</option>
                      <option value={20}>20</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 border-r border-gray-100">
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 rounded focus:border-[#437880] focus:ring-1 focus:ring-[#437880] outline-none bg-transparent transition-all text-[#437880] font-bold"
                      value={row.total_credits || ""}
                      onChange={(e) =>
                        handleTermRowChange(
                          index,
                          "total_credits",
                          Number(e.target.value),
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2 border-r border-gray-100">
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 rounded focus:border-[#437880] focus:ring-1 focus:ring-[#437880] outline-none bg-transparent transition-all"
                      value={row.total_theory_courses || ""}
                      onChange={(e) =>
                        handleTermRowChange(
                          index,
                          "total_theory_courses",
                          Number(e.target.value),
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2 border-r border-gray-100">
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 rounded focus:border-[#437880] focus:ring-1 focus:ring-[#437880] outline-none bg-transparent transition-all"
                      value={row.total_practical_others || ""}
                      onChange={(e) =>
                        handleTermRowChange(
                          index,
                          "total_practical_others",
                          Number(e.target.value),
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2 border-r border-gray-100">
                    <YearPicker
                      selectedYear={row.academic_start_year}
                      onChange={(year) =>
                        handleTermRowChange(index, "academic_start_year", year)
                      }
                    />
                  </td>
                  <td className="px-2 py-2 border-r border-gray-100">
                    <YearPicker
                      selectedYear={row.academic_end_year}
                      onChange={(year) =>
                        handleTermRowChange(index, "academic_end_year", year)
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 rounded focus:border-[#437880] focus:ring-1 focus:ring-[#437880] outline-none bg-transparent transition-all"
                      placeholder="e.g. 2024-25"
                      value={row.academic_year || ""}
                      onChange={(e) =>
                        handleTermRowChange(
                          index,
                          "academic_year",
                          e.target.value,
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#f9fafb] font-bold border-t border-gray-300">
              <tr className="divide-x divide-gray-200">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-right uppercase tracking-wider text-gray-500 font-bold"
                >
                  Total Curriculum Credits / Courses
                </td>
                <td className="px-4 py-3 text-[#437880] text-sm tabular-nums underline decoration-2 underline-offset-4">
                  {totals.credits || 0}
                </td>
                <td className="px-4 py-3 text-[#5cb85c] text-sm tabular-nums">
                  {totals.theory || 0}
                </td>
                <td className="px-4 py-3 text-[#5cb85c] text-sm tabular-nums">
                  {totals.practical || 0}
                </td>
                <td colSpan={3} className="bg-gray-50/50"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Approval Authority Section */}
        <h3 className="text-[#437880] text-base font-semibold border-b border-gray-100 pb-3 mb-6 mt-12">
          Approval Authority
        </h3>

        <div className="bg-[#f8fafc] border border-gray-100 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                Select Authority <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                className={`w-full border p-2 rounded text-sm transition-all focus:ring-1 focus:ring-[#437880] outline-none ${errors.school_id ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}`}
                value={approvalData.school_id || ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setApprovalData({
                    ...approvalData,
                    school_id: val,
                    user_id: null,
                  });
                  loadUsers(val);
                  if (errors.school_id)
                    setErrors((prev) => {
                      const n = { ...prev };
                      delete n.school_id;
                      return n;
                    });
                }}
              >
                <option value="">-- Choose School/Authority --</option>
                {schools.map((s: any) => (
                  <option key={s.dept_id} value={s.dept_id}>
                    {s.dept_name}
                  </option>
                ))}
              </select>
              {errors.school_id && (
                <p className="text-red-500 text-xs mt-1">{errors.school_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Select User
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded text-sm transition-all focus:ring-1 focus:ring-[#437880] outline-none bg-white"
                value={approvalData.user_id || ""}
                onChange={(e) =>
                  setApprovalData({
                    ...approvalData,
                    user_id: Number(e.target.value),
                  })
                }
              >
                <option value="">-- Choose User --</option>
                {schoolUsers.map((u: any) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Form Footer Buttons */}
        <div className="flex justify-end gap-3 mt-12 border-t border-gray-100 pt-8">
          <UIButton className="button-bg min-w-[120px]" onClick={handleSave}>
            <FaSave className="mr-2" /> {isEditMode ? "Update" : "Save"}
          </UIButton>
          <UIButton
            className="panel-bg-1 main-page-text-color border border-[#437880] !shadow-none"
            onClick={handleReset}
          >
            <FaSync className="mr-2" /> Reset
          </UIButton>
          <UIButton className="bg-[#d9534f]" onClick={() => navigate(-1)}>
            <FaTimes className="mr-2" /> Cancel
          </UIButton>
        </div>
      </div>
    </div>
  );
};

export default CurriculumForm;
