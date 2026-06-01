/**
 * API Response Interface
 * Matches backend http_return_helper.py response structure:
 * { status: boolean, message: string, data: T }
 */
export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

/**
 * Interface strictly following cudos_clo_po_map table
 */

export interface CoPoMapItem {
  clo_po_id: number;
  clo_id: number;
  po_id: number;
  academic_batch_id?: number;
  crs_id?: number;
  pi_id?: number;
  msr_id?: number;
  map_level?: string;
  justification?: string;
  created_by?: number;
  modified_by?: number;
  create_date?: string;
  modify_date?: string;
}

/**
 * Dropdown Interfaces
 */

export interface CurriculumOption {
  academic_batch_id?: number;
  value: number;
  label: string;
}

export interface TermOption {
  term_id: number;
  label: string;
}

export interface CourseOption {
  crs_id: number;
  label: string;
  crs_code?: string;
}

export interface CloOption {
  clo_id: number;
  clo_code?: string;
  clo_statement: string;
}

export interface PoOption {
  po_id: number;
  po_code: string;
}

/**
 * Matrix Mapping Interfaces
 */

export interface MappingCell {
  level: number;
  justification: string;
  clo_po_id: number | null;
  pi_id?: number | null;
  msr_id?: number | null;
}

export interface CoPoMappingData {
  [clo_id: number]: {
    [po_id: number]: MappingCell;
  };
}

/**
 * API Response Interfaces
 */

export interface CoPoMappingResponse {
  co_list: CloOption[];
  po_list: PoOption[];
  mappings: CoPoMapItem[];
}

export interface CloPoSavePayload {
  clo_po_id?: number | null;
  clo_id: number;
  po_id: number;
  crs_id: number;
  academic_batch_id?: number;
  map_level: string;
  justification: string;
  pi_id?: number | null;
  msr_id?: number | null;
}

/**
 * PI Measures Interfaces
 */

export interface PIMeasure {
  msr_id: number;
  msr_statement: string;
  pi_codes: string;
}

export interface PerformanceIndicator {
  pi_id: number;
  pi_statement: string;
  measures: Record<string, PIMeasure>;
}

export interface PIMeasuresResponse {
  po_id: number;
  performance_indicators: Record<string, PerformanceIndicator>;
}
