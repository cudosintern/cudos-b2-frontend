export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface CurriculumOption {
  value: number;
  label: string;
}

export interface TermOption {
  semester_id: number;
  label: string;
}

export interface CourseOption {
  crs_id: number;
  label: string;
}

export interface ProgramOutcome {
  po_id: number;
  po_code: string;
  po_statement: string;
  academic_batch_id: number;
}

export interface PerformanceLevel {
  plp_id?: number;
  academic_batch_id: number;
  po_id: number;
  performance_level_name: string;
  performance_level_name_alias?: string;
  performance_level_value: number;
  description?: string;
  start_range: number;
  conditional_opr: string;
  end_range: number;
  created_by?: number;
}

export interface IndirectAttainmentLevel {
  indirect_level_id?: number;
  academic_batch_id: number;
  po_id: number;
  attainment_level_name: string;
  attainment_level_name_alias?: string;
  attainment_level_value: number;
  conditional_opr: string;
  indirect_percentage: number;
  justify?: string;
  created_by?: number;
}

export interface DirectAttainmentLevel {
  alp_id: number;
  academic_batch_id: number;
  semester_id: number;
  crs_id: number;
  attainment_level_name: string;
  attainment_level_name_alias: string;
  attainment_level_value: number;
  cia_direct_percentage: number;
  mte_direct_percentage: number;
  tee_direct_percentage: number;
  indirect_percentage: number;
  conditional_opr?: string;
  cia_target_percentage?: number;
  mte_target_percentage?: number;
  tee_target_percentage?: number;
  justify?: string;
}

export interface IndirectTargetLevel {
  si_no: number;
  attainment_level_name?: string;
  attainment_level_value?: number;
  indirect_attainment_percentage?: number;
  target_percentage?: number;
}

export interface CloThreshold {
  clo_id: number;
  clo_code?: string;
  clo_statement?: string;
  CEE?: number | null;
  MTE?: number | null;
  SEE?: number | null;
  justify?: string;
}

export interface BloomThreshold {
  bloom_id: number;
  level?: string;
  description?: string;
  bloom_actionverbs?: string;
  cia_bloomlevel_minthreshhold?: number;
  mte_bloomlevel_minthreshhold?: number;
  tee_bloomlevel_minthreshhold?: number;
  bloomlevel_studentthreshhold?: number;
  justify?: string;
}