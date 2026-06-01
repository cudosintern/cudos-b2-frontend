export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}

export interface Curriculum {
  academic_batch_id?: number; // from the new API
  academic_batch_code?: string; // from the new API
  curriculum_id?: number; 
  curriculum_name?: string;
  name?: string; // fallback
}

export interface ProgramOutcome {
  po_id: number;
  po_code: string;
  po_statement: string;
  bos_comments?: string;
}

export interface Competency {
  pi_id: number; // In the DB, Pi represents a competency
  po_id?: number;
  pi_statement: string; // The text description of the competency
  competency_id?: number; // legacy fallback
  competency_statement?: string; // legacy fallback
}

export interface PerformanceIndicator {
  msr_id: number; // DB ID for the Measure/PI
  pi_id: number; // Parent Competency ID
  pi_codes?: string; // e.g. "1.1.2"
  msr_statement: string; // The text description of the PI
}

export interface ViewCompetency {
  pi_id: number;
  pi_statement: string;
  performance_indicators: PerformanceIndicator[];
}

export interface ViewCPIsResponse {
  po_code: string;
  po_statement: string;
  competencies: ViewCompetency[];
}