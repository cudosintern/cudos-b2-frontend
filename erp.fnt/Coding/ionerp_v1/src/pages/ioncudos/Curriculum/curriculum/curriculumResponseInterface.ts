export interface Program {
  pgm_id: number;
  pgm_title: string;
  pgm_code?: string;
  duration?: number;
}

export interface ProgramOwner {
  user_id: number;
  user_name: string;
}


export interface School {
  school_id: number;
  school_name: string;
}

export interface Curriculum {
  crclm_id: number;
  crclm_name: string; // "Bachelor in Architecture"
  dept_name?: string; // "ATC"
  program_id: number;
  program_name?: string; // For display
  start_year: number; // 2021
  end_year: number; // 2026
  program_owner_id?: number | null;
  program_owner_name?: string; // "Mr. Gururaj Joshi"
  
  // Statuses
  status: boolean | number; // Active/Inactive (1/0)
  competency_pi_status: string; // "Mandatory" | "Optional"
  course_mapping_status: string; // "Mandatory" | "Optional"
  student_registration_status: string; // "Mandatory" | "Optional"
  
  // Creation/Import Status
  peo_po_creation_status?: string; // "Initiated"
  import_status?: string; // "Roll-back"
  
  // Details
  description?: string;
  tee_passing_marks?: number;
  
  // Calculated/Program Details (from backend or separate)
  total_terms?: number;
  total_credits?: number;
  term_min_credits?: number;
  term_max_credits?: number;
  term_min_duration?: number;
  term_max_duration?: number;
  
  // Sub-items
  terms?: CurriculumTerm[];
  approval_authority?: ApprovalAuthority;
  
  // Temporary fields for form
  school_id?: number;
  authority_user_id?: number;
}

export interface CurriculumTerm {
  term_id?: number; // legacy
  semester_id?: number; // new
  term_name: string;
  term_no: number;
  credits?: number;
  duration_weeks?: number;
  total_theory_courses?: number;
  total_practical_others?: number;
  academic_start_year?: number;
  academic_end_year?: number;
  academic_year?: number;
  min_credits?: number;
  max_credits?: number;
  min_duration?: number;
  max_duration?: number;
}

export interface ApprovalAuthority {
  authority_type: string;
  school_id: number;
  user_id: number;
}