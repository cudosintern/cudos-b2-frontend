/* ===================== CURRICULUM / ACADEMIC BATCH ===================== */

export interface CurriculumOption {
  value: number;
  label: string;
}

/* ===================== PO/PSO ENTITY (cudos_po table) ===================== */

export interface PsoItem {
  po_id: number;
  po_code: string;
  po_reference: string;
  pso_flag: boolean;
  po_statement: string;
  po_type_id?: number;
  academic_batch_id: number;
  state_id: number;
  justify?: string;
  import_ref_po_id?: number;
  direct_attainment?: number;
  indirect_attainment?: number;
  extra_curricular?: number;
  po_minthreshhold?: number;
  po_studentthreshhold?: number;
  created_by?: number;
  modified_by?: number;
  created_at?: string;
  updated_at?: string;
}

/* ===================== PO/PSO PAYLOAD ===================== */

export interface PsoPayload {
  po_code: string;
  po_reference: string;
  pso_flag: boolean;
  po_statement: string;
  po_type_id?: number;
  academic_batch_id: number;
  state_id?: number;
  justify?: string;
}

/* ===================== PO LIST BY ACADEMIC BATCH ===================== */

export interface PsoListByAcademicBatch {
  academic_batch_id: number;
  academic_batch_code?: string;
  academic_batch_desc?: string;
  po_pso: PsoItem[];
  psos?: PsoItem[];
}

/* ===================== PO TYPES ===================== */

export interface PoTypeOption {
  value: number;
  label: string;
  status?: number;
}
