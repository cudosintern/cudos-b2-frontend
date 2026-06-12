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
  finalize_allowed: boolean;
  blocking_messages: string[];
}