/* ===================== ACADEMIC BATCH (CURRICULUM) ===================== */

export interface CurriculumOption {
  value: number;
  label: string;
}

/* ===================== PEO ENTITY ===================== */

export interface PeoItem {
  peo_id: number;
  peo_reference: string;
  peo_statement: string;
  //po_type_id?: number;
  state_id?: number;
  academic_batch_id?: number;
  attendees?: { attendees_name: string; attendees_notes: string }[];
}

/* ===================== PEO PAYLOAD ===================== */

export interface PeoPayload {
  peo_reference: string;
  peo_statement: string;
  po_type_id?: number;
  academic_batch_id?: number;
  attendees?: { attendees_name: string; attendees_notes: string }[];
}

/* ===================== PEO LIST BY ACADEMIC BATCH ===================== */

export interface PeoListByCurriculum {
  academic_batch_id: number;
  academic_batch_desc: string;
  peos: PeoItem[];
  attendees?: { attendees_name: string; attendees_notes: string }[];
}

/* ===================== PO TYPES ===================== */

export interface PoTypeOption {
  value: number;
  label: string;
  status?: number;
}
