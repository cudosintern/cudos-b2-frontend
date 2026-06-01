import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../../utils/api";
import {
  Course,
  Curriculum,
  Department,
  MteOccasion,
  Program,
  Term,
} from "./mteDataImport.types";

// ─────────────────────────────────────────────────────────────────────────────
// Helper – safely extract data array from API response.
// Handles both { status, message, data: [...] } and bare array shapes.
// ─────────────────────────────────────────────────────────────────────────────
const extractData = (res: any): any[] => {
  const payload = (res?.data as any);
  if (Array.isArray(payload?.data))   return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload))          return payload;
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper – normalise the upload_status string from /courses to the
// three-value type used by the badge renderer.
// ─────────────────────────────────────────────────────────────────────────────
const normaliseStatus = (raw?: string): Course["status"] => {
  const s = (raw ?? "").trim();
  if (s === "Completed")                       return "Completed";
  if (s === "In-Progress" || s === "In Progress") return "In-Progress";
  return "Pending";
};

// ─────────────────────────────────────────────────────────────────────────────

export const useMteDataImport = () => {

  // ── Filter IDs (persisted across page visits via sessionStorage) ───────────
  const [deptId,       setDeptId]       = useState<number | "">(() => { const v = sessionStorage.getItem("mte_dept_id");       return v ? Number(v) : ""; });
  const [pgmId,        setPgmId]        = useState<number | "">(() => { const v = sessionStorage.getItem("mte_pgm_id");        return v ? Number(v) : ""; });
  const [curriculumId, setCurriculumId] = useState<number | "">(() => { const v = sessionStorage.getItem("mte_curriculum_id"); return v ? Number(v) : ""; });
  const [termId,       setTermId]       = useState<number | "">(() => { const v = sessionStorage.getItem("mte_term_id");       return v ? Number(v) : ""; });

  // ── Dropdown option lists (populated per-level by API) ────────────────────
  const [schools,     setSchools]     = useState<Department[]>([]);
  const [programs,    setPrograms]    = useState<Program[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [terms,       setTerms]       = useState<Term[]>([]);

  // ── Raw course rows from GET /courses?semester_id= ────────────────────────
  const [rawCourses,   setRawCourses]   = useState<any[]>([]);

  // ── Occasions for the currently-selected course (fetched on demand) ────────
  const [courseOccasions, setCourseOccasions] = useState<MteOccasion[]>([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [searchTerm,           setSearchTerm]           = useState("");
  const [entries,              setEntries]              = useState(20);
  const [currentPage,          setCurrentPage]          = useState(1);
  const [isLoading,            setIsLoading]            = useState(false);
  const [selectedCourse,       setSelectedCourse]       = useState<Course | null>(null);
  const [isOccasionsModalOpen, setIsOccasionsModalOpen] = useState(false);
  const [occasionsLoading,     setOccasionsLoading]     = useState(false);

  // ── Persist selection IDs ─────────────────────────────────────────────────
  useEffect(() => {
    sessionStorage.setItem("mte_dept_id",       deptId       ? String(deptId)       : "");
    sessionStorage.setItem("mte_pgm_id",        pgmId        ? String(pgmId)        : "");
    sessionStorage.setItem("mte_curriculum_id", curriculumId ? String(curriculumId) : "");
    sessionStorage.setItem("mte_term_id",       termId       ? String(termId)       : "");
  }, [deptId, pgmId, curriculumId, termId]);

  // ── Level 1: Schools — fetch once on mount ────────────────────────────────
  useEffect(() => {
    fetchSchools();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Level 2: Programs — cascade from school ───────────────────────────────
  useEffect(() => {
    if (!deptId) { setPrograms([]); return; }
    fetchPrograms(Number(deptId));
  }, [deptId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Level 3: Curriculums — cascade from program ───────────────────────────
  useEffect(() => {
    if (!pgmId) { setCurriculums([]); return; }
    fetchCurriculums(Number(pgmId));
  }, [pgmId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Level 4: Terms — cascade from curriculum ──────────────────────────────
  useEffect(() => {
    if (!curriculumId) { setTerms([]); return; }
    fetchTerms(Number(curriculumId));
  }, [curriculumId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Level 5: Courses — cascade from term ──────────────────────────────────
  useEffect(() => {
    if (!termId) { setRawCourses([]); return; }
    fetchCourses(Number(termId));
  }, [termId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch functions ────────────────────────────────────────────────────────

  const fetchSchools = async () => {
    try {
      const res = await axiosInstance.get("/mte-data-import/schools");
      setSchools(extractData(res));
    } catch (err) {
      console.error("MTE: fetchSchools error", err);
    }
  };

  const fetchPrograms = async (id: number) => {
    try {
      const res = await axiosInstance.get(`/mte-data-import/programs?dept_id=${id}`);
      setPrograms(extractData(res));
    } catch (err) {
      console.error("MTE: fetchPrograms error", err);
      setPrograms([]);
    }
  };

  const fetchCurriculums = async (id: number) => {
    try {
      const res = await axiosInstance.get(`/mte-data-import/curriculum?pgm_id=${id}`);
      setCurriculums(extractData(res));
    } catch (err) {
      console.error("MTE: fetchCurriculums error", err);
      setCurriculums([]);
    }
  };

  const fetchTerms = async (id: number) => {
    try {
      const res = await axiosInstance.get(`/mte-data-import/terms?academic_batch_id=${id}`);
      setTerms(extractData(res));
    } catch (err) {
      console.error("MTE: fetchTerms error", err);
      setTerms([]);
    }
  };

  const fetchCourses = async (semId: number) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/mte-data-import/courses?semester_id=${semId}`);
      setRawCourses(extractData(res));
    } catch (err) {
      console.error("MTE: fetchCourses error", err);
      setRawCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOccasionsForCourse = async (crsId: number | string) => {
    setOccasionsLoading(true);
    setCourseOccasions([]);
    try {
      const res = await axiosInstance.get(`/mte-data-import/occasions?crs_id=${crsId}`);
      const items = extractData(res).map((o: any): MteOccasion => ({
        ...o,
        occasion_id: o.ao_id ? String(o.ao_id) : o.occasion_id,
        description: o.description,
        type: (o.type ?? o.assessment_type ?? "QP") as "QP" | "Rubrics",
        maxMarks: Number(o.maxMarks ?? o.max_marks ?? 0),
      }));
      setCourseOccasions(items);
    } catch (err) {
      console.error("MTE: fetchOccasionsForCourse error", err);
      setCourseOccasions([]);
    } finally {
      setOccasionsLoading(false);
    }
  };

  // ── Normalised course rows for the DataTable ───────────────────────────────
  // Maps new backend field names → frontend column field names:
  //   code          → course_code
  //   course_type   → category
  //   instructor    → owner
  //   mode          → delivery_mode
  //   upload_status → status  (normalised string)
  // ──────────────────────────────────────────────────────────────────────────
  const courses = useMemo((): Course[] => {
    return rawCourses.map((c: any): Course => ({
      course_id:        c.crs_id,
      crs_id:           c.crs_id,
      course_code:      c.code          ?? c.course_code  ?? "",
      course_title:     c.course_title  ?? "",
      category:         c.course_type   ?? c.category     ?? "—",
      credits:          Number(c.credits ?? 0),
      total_marks:      Number(c.total_marks ?? 0),
      owner:            c.instructor    ?? c.owner        ?? "",
      delivery_mode:    c.mode          ?? c.delivery_mode ?? "Regular",
      // Status comes from /courses directly — no separate /course-status call
      status:           normaliseStatus(c.upload_status ?? c.status),
      // Always allow opening the Occasions modal; empty list handled in the modal
      hasOccasions:     true,
      // Carry semester context forward for navigation state
      semester_id:      termId || undefined,
      academic_batch_id: c.academic_batch_id,
    }));
  }, [rawCourses, termId]);

  // ── Filter change handlers ─────────────────────────────────────────────────
  // Each handler clears downstream state so dropdowns collapse correctly.

  const handleSchoolChange = (value: string) => {
    setDeptId(value ? Number(value) : "");
    setPgmId("");       setCurriculumId(""); setTermId("");
    setPrograms([]);    setCurriculums([]);  setTerms([]);  setRawCourses([]);
    setCurrentPage(1);  setSearchTerm("");
  };

  const handleProgramChange = (value: string) => {
    setPgmId(value ? Number(value) : "");
    setCurriculumId(""); setTermId("");
    setCurriculums([]);  setTerms([]);  setRawCourses([]);
    setCurrentPage(1);   setSearchTerm("");
  };

  const handleCurriculumChange = (value: string) => {
    setCurriculumId(value ? Number(value) : "");
    setTermId("");
    setTerms([]);  setRawCourses([]);
    setCurrentPage(1);  setSearchTerm("");
  };

  const handleTermChange = (value: string) => {
    setTermId(value ? Number(value) : "");
    setRawCourses([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entries]);

  // ─────────────────────────────────────────────────────────────────────────
  return {
    filters: {
      school:     deptId       ? String(deptId)       : "",
      program:    pgmId        ? String(pgmId)        : "",
      curriculum: curriculumId ? String(curriculumId) : "",
      term:       termId       ? String(termId)       : "",
      deptId,
      pgmId,
      curriculumId,
      termId,
    },
    setters: {
      handleSchoolChange,
      handleProgramChange,
      handleCurriculumChange,
      handleTermChange,
    },
    ui: {
      searchTerm,
      setSearchTerm,
      entries,
      setEntries,
      currentPage,
      setCurrentPage,
      isLoading,
      selectedCourse,
      setSelectedCourse,
      isOccasionsModalOpen,
      setIsOccasionsModalOpen,
      occasionsLoading,
      setOccasionsLoading,
    },
    filterOptions: {
      schools:     schools,
      programs:    programs,
      curriculums: curriculums,
      terms:       terms,
    },
    courses,
    courseOccasions,
    fetchOccasionsForCourse,
  };
};
