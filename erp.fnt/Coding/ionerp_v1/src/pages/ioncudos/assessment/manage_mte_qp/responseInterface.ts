/**
 * API Response Interface - Extended for MTE QP Module
 */
export interface ApiResponse<T> {
  status: number;
  message?: string;
  data: T;
}

/**
 * Strictly matching cudos_qp_definition table + joins
 */
export interface AssessmentItem {
  qpd_id: number;

  qpf_id?: number;
  qpd_type?: number;
  cia_model_qp?: number;
  qp_rollout?: number;

  academic_batch_id?: number;
  semester_id?: number;
  crs_id?: number;
  crs_code?: string;
  crs_title?: string;

  lms_ciatee_stud_avg_score?: number;

  qpd_title?: string;
  qpd_timing?: string;

  qpd_gt_marks?: number;
  qpd_max_marks?: number;

  qpd_notes?: string;
  qpd_num_units?: number;

  rubrics_flag?: number;
  ao_method_id?: number;

  course_type?: string;
  credits?: number;
  course_owner?: string;

  created_by?: number;
  created_date?: string;
  modified_by?: number;
  modified_date?: string;

  import_ref_qpd_id?: number;
}

/**
 * Dropdown Response Types (exact backend shapes)
 */
export interface SchoolOption {
  dept_id: number;
  dept_name: string;
}

export interface ProgramOption {
  pgm_id: number;
  pgm_title: string;
  pgm_acronym?: string;
  dept_id?: number;
}

export interface CurriculumOption {
  academic_batch_id: number;
  academic_batch_code: string;
  academic_batch_desc?: string;
  pgm_id?: number;
  dept_id?: number;
  program_name?: string;
  dept_name?: string;
}

export interface TermOption {
  semester_id: number;
  term_name: string;
  si_no?: number;
  academic_batch_id?: number;
  duration_weeks?: number;
  total_credits?: number;
}

/**
 * Course listing for main DataTable
 */
export interface CourseOption extends Partial<AssessmentItem> {
  crs_id: number;
  crs_code: string;
  crs_title?: string;
  course_type?: string;
  credits?: number;
}

/**
 * MTE Framework responses (for ManageMteDetailsPage)
 */
export interface MteFramework {
  qpf_id: number;
  qpf_title: string;
  question_paper_title?: string;
  total_duration: string;
  maximum_marks: number;
  grand_total: number;
  note?: string;
  units: MteUnit[];
  academic_batch_code?: string;
  pgm_title?: string;
  term_name?: string;
  semester_name?: string;
  crs_title?: string;
  crs_name?: string;
}

export interface MteUnit {
  qpf_unit_id: number;
  unit_name: string;
  no_of_questions: number;
  unit_max_marks: number;
}

export interface MteQuestion {
  qpf_mq_id: number;
  question_text: string;
  course_outcome_id: number | null;
  bloom_level_id: number | null;
  co_code: string | null;
  bloom_code: string | null;
  marks: number;
  unit_id: number;
  main_question_no: number | null;
  sub_question_no: string | null;
  is_mandatory?: number;
}

export interface Question {
  id: string;
  question: string;
  cos: string;
  rawCoId: number | undefined;
  blooms: string;
  rawBloomId: number | undefined;
  marks: number;
}

export interface BloomLevel {
  bloom_level_id: number;
  bloom_level: string;
  description?: string;
}

export interface CourseOutcome {
  co_id: number;
  co_code: string;
  co_statement: string;
}

export interface AssessmentOccasion {
  ao_id: number;
  ao_name: string;
  ao_description?: string;
  qpd_id?: number;
  qpf_id?: number;
  qpd_title?: string;
  created_date?: string;
  created_by_name?: string;
}

/**
 * Service responses (generic)
 */
export type ServiceResponse<T = any> = ApiResponse<T>;

export interface AssessmentListResponse {
  data: AssessmentItem[];
}

