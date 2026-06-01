// seeImportTypes.ts

export interface DropdownOption {
  value: number | string;
  label: string;
}

export interface Course {
  course_id: number;
  course_code: string;
  course_title: string;
  course_type: string; // Core / Elective
  credits: number;
  total_marks: number;
  course_owner: string;
  mode: string; // Theory / Practical
  /** True if the current logged-in user is the course owner */
  isOwner: boolean;
  /** True if marks have already been imported for this course */
  hasImportedData: boolean;
}

export interface FilterState {
  school_id: number | string;
  program_id: number | string;
  curriculum_id: number | string;
  term_id: number | string;
}

export interface ImportMarksPayload {
  course_id: number;
  term_id: number;
  file: File;
}

export interface ImportedStudentMarks {
  usn: string;
  student_name: string;
  [key: string]: string | number; // For dynamic question columns
}

export interface SEEQuestion {
  key: string;
  label: string;
  max: number;
  bloomLevel?: string;
  cos?: string[];
}

export interface SEEQuestionStats {
  average: string;
  stdDev: string;
  min: string;
  max: string;
  attempts: number;
  percentAttempt: string;
  percentAttainment: string;
}
