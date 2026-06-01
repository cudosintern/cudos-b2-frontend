import { 
  CourseQPRowUI, 
  ModelQPForm, 
  SectionUI, 
  ModelQPApi, 
  UnitApi 
} from "../types";

// ==================== IDENTIFIER HELPERS ====================

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ==================== DURATION HELPERS ====================

export const HHMMToHours = (hhmm: string): number => {
  if (!hhmm || typeof hhmm !== 'string') return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
};

export const hoursToHHMM = (hours: number): string => {
  const h = Math.floor(hours || 0);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// ==================== DROPDOWN HELPERS ====================

export const mapToDropdown = (
  data: any[],
  labelKey: string,
  valueKey: string
) => {
  if (!Array.isArray(data)) {
    console.error("Dropdown data is not array:", data);
    return [];
  }

  return data.map((item) => ({
    label: item[labelKey],
    value: item[valueKey],
  }));
};

// ==================== MAPPERS ====================

/**
 * Normalizes a raw backend row into a UI-friendly CourseQPRowUI
 */
export const normalizeCourseRow = (row: any): CourseQPRowUI => {
  return {
    qpId: row.qpd_id || row.qp_id || row.id || null,
    courseId: row.crs_id || row.id || 0,
    courseCode: row.crs_code || row.course_code || "",
    courseTitle: row.crs_title || row.course_title || row.course_name || "N/A",
    credits: row.credits || row.credit_hours || 0,
    totalMarks: row.total_marks || 0,
    courseOwner: row.course_owner || row.course_owner_name || "TBD",
    type: row.core_or_elective || (row.elective_crs_flag === 1 ? "Elective" : "Core"),
    status: row.model_qp_status || row.status || "PENDING",
    duration: HHMMToHours(row.total_duration || "00:00"),
    maxMarks: row.max_marks ?? 0,
  };
};

/**
 * Normalizes a raw backend QP object into a UI-friendly ModelQPForm
 */
export const normalizeQP = (api: ModelQPApi): ModelQPForm => {
  return {
    title: api.title || "",
    duration: HHMMToHours(api.total_duration || "03:00"),
    maxMarks: api.max_marks || 0,
    totalMarks: api.grand_total || 0,
    note: api.note || "",
  };
};

/**
 * Normalizes backend units/sections into UI-friendly SectionUI arrays
 */
export const normalizeSections = (units: any[] = []): SectionUI[] => {
  return (units || []).map(u => ({
    id: u.qp_unitd_id || u.id,
    tempId: u.qp_unitd_id ? `sec-${u.qp_unitd_id}` : uid(),
    name: u.unit_name || u.module_name || u.section_name || "",
    numQuestions: Number(u.no_of_questions || 0),
    maxMarks: Number(u.max_marks || (u.questions?.[0]?.questions?.[0]?.marks ?? 0)),
    questions: u.questions || []
  }));
};

/**
 * Combined normalizer for Edit flow
 */
export const normalizeFullQP = (api: ModelQPApi) => ({
  form: normalizeQP(api),
  sections: normalizeSections(api.units || api.sections),
});

/**
 * Generates a dummy section for the UI
 */
export const createEmptySection = (): SectionUI => ({
  tempId: uid(),
  name: "",
  numQuestions: 0,
  maxMarks: 0,
  questions: []
});

/**
 * Calculates total marks from sections
 */
export const recalcMaxMarks = (sections: SectionUI[]): number => {
  return (sections || []).reduce((sum, s) => sum + Number(s.maxMarks || 0), 0);
};

/**
 * Builds the payload for POST/PUT from the UI models
 */
export const buildFrameworkPayload = (form: ModelQPForm, sections: SectionUI[]) => {
  return {
    title: form.title,
    total_duration: hoursToHHMM(form.duration),
    max_marks: form.maxMarks,
    grand_total: form.totalMarks,
    note: form.note,
    // Use `units` key for the frontend-to-saveDraftQP bridge;
    // saveDraftQP will remap the array to `sections` with `section_name` for the backend.
    units: (sections || []).map((s, idx) => ({
      qp_unitd_id: s.id,
      unit_name: s.name,       // remapped → section_name in saveDraftQP
      no_of_questions: Number(s.questions?.length || s.numQuestions || 1),
      max_marks: Number(s.questions?.[0]?.questions?.[0]?.marks || s.maxMarks || 0),
      sort_order: idx + 1,
    })),
  };
};
