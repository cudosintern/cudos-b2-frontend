export interface DropdownOption {
  id: string | number;
  name: string;
  course_code?: string;
}

export interface CiaAttainmentFilters {
  curriculumId: string | number | null;
  termId: string | number | null;
  courseId: string | number | null;
  sectionId: string | number | null;
  occasionIds: (string | number)[];
}

export interface CalculateAttainmentPayload {
  course_id: string | number;
  section_id: string | number;
  occasion_ids: (string | number)[];
  assessment_type: "CIA";
}

export interface AttainmentData {
  status: string;
  co_calculation_type: number;
  levels: Array<{
    name: string;
    value: number;
    direct_percentage: number;
    target_percentage: number;
  }>;
  co_attainment: Array<{
    co_id: string | number;
    co_code: string;
    co_statement: string;
    threshold_attainment: number;
    average_attainment: number;
    attainment_level: number;
    weighted_threshold_attainment: number;
  }>;
  course_attainment: number;
  course_attainment_after_weightage: number;
  workflow_co_attainment?: Array<{
    co_id: string | number;
    co_code: string;
    threshold_attainment: number;
    average_attainment: number;
    attainment_level: number;
  }>;
  workflow_course_attainment?: number;
  workflow_course_attainment_after_weightage?: number;
  finalize_allowed: boolean;
  blocking_messages: string[];
}

export interface CoAssessmentQuestion {
  assessment: string;
  question_no: string;
  question_content: string;
  marks: number;
}

export interface CoAssessmentDetails {
  co_id: string | number;
  co_code: string;
  co_statement: string;
  questions: CoAssessmentQuestion[];
  blocking_message?: string | null;
}

export interface CoDrilldownRow {
  sl_no?: number;
  co_code: string;
  occasion: string;
  actual_attainment_percentage: number;
  actual_attainment_level: number;
}

export interface CoDrilldownDetails {
  co_id: string | number;
  co_code: string;
  co_statement: string;
  curriculum_name?: string;
  term_name?: string;
  course_name?: string;
  ia_weightage?: number;
  rows: CoDrilldownRow[];
  total_attainment_percentage: number;
  total_attainment_level: number;
  blocking_message?: string | null;
}

export interface CiaAttainmentSelectionContext {
  curriculumName: string;
  termName: string;
  courseName: string;
  sectionName: string;
}

export interface ExportAttainmentResponse {
  message: string;
  export_type: 'pdf' | 'doc';
  filters: {
    curriculum_name: string;
    term_name: string;
    course_name: string;
    section_name: string;
    occasion_names: string[];
  };
  levels?: AttainmentData['levels'];
  calculated: {
    co_attainment: AttainmentData['co_attainment'];
    course_attainment: number;
    course_attainment_after_weightage: number;
  };
  finalized?: {
    co_attainment: AttainmentData['co_attainment'];
    is_finalized: boolean;
  };
  notes?: {
    threshold_formula?: string;
    average_formula?: string;
  };
}
