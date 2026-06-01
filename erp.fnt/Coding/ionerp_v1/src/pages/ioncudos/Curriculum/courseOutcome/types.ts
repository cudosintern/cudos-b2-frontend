export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data?: T;
}

export interface Curriculum {
  id: number;
  name: string;
  curriculum_id?: number;
  academic_batch_id?: number;
  curriculum_name?: string;
  academic_batch_code?: string;
  academic_batch_desc?: string;
  value?: number;
  label?: string;
}

export interface Semester {
  id: number;
  name: string;
  value?: number;
  label?: string;
}

export interface Course {
  id: number;
  name: string;
  course_code?: string;
  course_name?: string;
  crs_id?: number;
  crs_code?: string;
  course?: string;
}

export interface BloomLevel {
  id: number;
  bloom_level_name: string;
}

export interface DeliveryMethod {
  id: number;
  delivery_method_name: string;
}

export interface CourseOutcome {
  id?: number;
  co_code: string;
  co_statement: string;
  bloom_levels: BloomLevel[];
  delivery_methods: DeliveryMethod[];
  status?: number;
}

export interface SaveCourseOutcomePayload {
  id?: number;
  academic_batch_id: number;
  semester_id: number;
  crs_id: number;
  co_code_id: number | string;
  co_statement: string;
  blooms_level_id?: number; // Keep for backward compatibility or refactor later
  bloom_level_ids: number[];
  delivery_method_ids: number[];
}