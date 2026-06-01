// Curriculum dropdown option
export interface CurriculumOption {
    value: number;
    label: string;
}

// PO as returned by backend /po_peo_mapping/po_list
export interface Po {
    po_id: number;
    po_code: string;
    po_statement: string;
}

// PEO as returned by backend /po_peo_mapping/peo_list
export interface Peo {
    peo_id: number;
    peo_reference: string;
    peo_statement: string;
}

// Single mapping item sent to /po_peo_mapping/save_po_peo_map
// Backend expects a flat ARRAY of these
export interface PoPeoSavePayload {
    pp_id: number | null;   // null = INSERT, number = UPDATE
    peo_id: number;
    po_id: number;
    academic_batch_id: number;
    map_level: string;      // MUST be string: "1", "2", "3"
    justification: string;
}

// Delete payload for /po_peo_mapping/delete_po_peo_map
export interface PoPeoDeletePayload {
    pp_id: number;
}

export interface ExistingMapping {
    pp_id: number;
    po_id: number;
    peo_id: number;
    map_level: string;
    justification: string;
}
