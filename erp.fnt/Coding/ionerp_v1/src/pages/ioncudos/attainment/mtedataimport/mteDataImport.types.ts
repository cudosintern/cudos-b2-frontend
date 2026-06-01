// ─────────────────────────────────────────────────────────────────────────────
// MTE Data Import – API-aligned type definitions
// ─────────────────────────────────────────────────────────────────────────────

/** School / Department from GET /mte-data-import/schools */
export interface Department {
  dept_id: number;
  dept_name: string;
}

/** Program from GET /mte-data-import/programs?dept_id= */
export interface Program {
  pgm_id: number;
  pgm_title: string;
  dept_id?: number;
}

/** Curriculum / Academic Batch from GET /mte-data-import/curriculum?pgm_id= */
export interface Curriculum {
  academic_batch_id: number;
  academic_batch_code: string;
  pgm_id?: number;
}

/** Term / Semester from GET /mte-data-import/terms?academic_batch_id= */
export interface Term {
  semester_id: number;
  /** Populated server-side as semester_desc ?? semester_code */
  term_name: string;
  semester_code?: string;
  academic_batch_id?: number;
}

/** Course row returned by GET /mte-data-import/courses?semester_id= */
export interface Course {
  course_id: string | number;
  crs_id?: number;
  course_code: string;
  course_title: string;
  /** Maps from backend field: course_type */
  category: string;
  credits: number;
  total_marks: number;
  /** Maps from backend field: instructor */
  owner: string;
  /** Maps from backend field: mode */
  delivery_mode: string;
  /** Derived from backend field: upload_status */
  status: 'In-Progress' | 'Completed' | 'Pending';
  /** True if at least one QP occasion exists for this course (from /qp-view) */
  hasOccasions: boolean;
  semester_id?: number | "";
  academic_batch_id?: number;
  /** Extra fields returned by new /courses endpoint */
  sl_no?: number;
  section_id?: number;
  section?: string;
}

/** Assessment Occasion from GET /mte-data-import/qp-view */
export interface MteOccasion {
  occasion_id?: string | number;
  ao_id?: number;
  qp_id?: number;
  description: string;
  type: 'QP' | 'Rubrics';
  maxMarks: number;
  max_marks?: number;
  qp_link?: string;
  crs_id?: number;
  course_id?: string | number;
}

/** Payload for POST /mte-data-import/marks */
export interface SaveMarksPayload {
  student_id: number;
  course_id: number;
  qp_id: number;
  question_id: number;
  obtained_marks: number;
}

/** Payload for POST /mte-data-import/save-marks (upsert) */
export interface SaveMarksUpsertPayload {
  student_id: number;
  question_id: number;
  obtained_marks: number;
}

/** Standard API response wrapper */
export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data: T[];
}

export interface FilterOptions {
  schools: Department[];
  programs: Program[];
  curriculums: Curriculum[];
  terms: Term[];
}
