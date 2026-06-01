
export interface AccreditationType {
  atype_id: number;
  atype_name: string;
  atype_description: string;
  pos?: GenericPO[];
}

export interface PoType {
    po_type_id: number;
    po_type_name: string;
    po_type_description?: string;
}

export interface PoCode {
    mt_details_id: number;
    mt_details_name: string;
}

export interface GenericPO {
    po_id: number;
    po_code: string;
    po_statement: string;
    po_description?: string; // Often used instead of statement or alongside
    po_reference?: string; 
    pso_flag?: boolean;
    po_type_id?: number | null;
    crclm_id: number;
    state_id?: number;
    atype_id?: number; // Foreign key to AccreditationType
  
    // Extended fields from model
    po_minthreshhold?: number;
    po_studentthreshhold?: number;
    justify?: string;
    import_ref_po_id?: number;
    direct_attainment?: number;
    indirect_attainment?: number;
    extra_curricular?: number;

    // Display fields (if joined)
    atype_name?: string;
    created_at?: string;
    updated_at?: string;
}

// Response wrapper if needed, but LabCategory uses direct type in array
export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}
