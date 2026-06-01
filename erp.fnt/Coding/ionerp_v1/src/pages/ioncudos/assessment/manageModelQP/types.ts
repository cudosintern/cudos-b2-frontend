export type ModelQPStatus = "PENDING" | "INITIATED" | "COMPLETED";

// ==================== UI MODELS (CamelCase) ====================

export interface SectionUI {
  id?: number;          // backend ID (optional if not saved)
  tempId: string;       // unique UI-only identifier
  name: string;
  numQuestions: number;
  maxMarks: number;
  questions?: any[];    // nested question objects if loaded
}

export interface ModelQPForm {
  title: string;
  duration: number;        // hours (UI-friendly decimal)
  maxMarks: number;        // total marks of the framework
  totalMarks: number;      // grand total / target marks
  note: string;
}

export interface CourseQPRowUI {
  courseId: number;
  courseCode: string;
  courseTitle: string;
  credits: number;
  totalMarks: number;
  courseOwner: string;
  type: string;
  qpId?: number;
  status?: string;
  duration?: number;   // in hours (UI format)
  maxMarks?: number;
}

// ==================== API MODELS (Snake_case) ====================

export interface QuestionApi {
  question_text: string;
  co_id: number | null;
  bloom_level: string;
  pi_code?: string;
  marks: number;
}

export interface QuestionGroupApi {
  type: "EITHER_OR";
  questions: QuestionApi[];
}

export interface UnitApi {
  qp_unitd_id?: number;
  id?: number;
  unit_name?: string;
  module_name?: string;
  section_name?: string;
  no_of_questions: number;
  max_marks: number;
  questions?: QuestionGroupApi[];
}

export interface ModelQPApi {
  id: number;
  qpd_id?: number;
  crs_id: number;
  course_id?: number;
  title: string;
  total_duration: string; // HH:MM
  max_marks: number;
  grand_total: number;
  note: string;
  status: ModelQPStatus;
  units?: UnitApi[];
  sections?: UnitApi[]; // Backend sometimes uses units or sections
  curriculum_id?: number;
  semester_id?: number;
}

// ==================== SHARED ====================

export interface DropdownOption {
  value: string | number;
  label: string;
}
