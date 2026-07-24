import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const API_URL = `${BASE_URL}/program-po-pso`;

export interface CurriculumOption {
  crclm_id: number;
  crclm_name: string;
  pgm_title?: string;
}

export interface FirstYearCurriculumOption {
  crclm_id: number;
  crclm_name: string;
}

export interface AssessmentTypeOption {
  type_id: string;
  type_name: string;
}

export interface PoColumnHeader {
  po_id: number;
  po_code: string;
  po_reference?: string;
  is_pso: boolean;
}

export interface CourseAttainmentCell {
  po_code: string;
  attainment_level?: number;
  percentage?: number;
  display_text: string;
}

export interface CourseAttainmentRow {
  crs_id: number;
  crs_code: string;
  crs_title: string;
  attainments: Record<string, CourseAttainmentCell>;
}

export interface ProgramPoPsoReportResponse {
  status: string;
  message: string;
  columns: PoColumnHeader[];
  rows: CourseAttainmentRow[];
  summary_averages: Record<string, CourseAttainmentCell>;
}

export const fetchCurriculums = async (): Promise<CurriculumOption[]> => {
  const response = await axios.get<CurriculumOption[]>(`${API_URL}/curriculum`);
  return response.data;
};

export const fetchFirstYearCurriculums = async (): Promise<FirstYearCurriculumOption[]> => {
  const response = await axios.get<FirstYearCurriculumOption[]>(`${API_URL}/first-year-curriculum`);
  return response.data;
};

export const fetchAssessmentTypes = async (): Promise<AssessmentTypeOption[]> => {
  const response = await axios.get<AssessmentTypeOption[]>(`${API_URL}/types`);
  return response.data;
};

export const fetchPoPsoReport = async (
  curriculumId: number,
  firstYearCurriculumId?: number | null,
  type: string = "ALL"
): Promise<ProgramPoPsoReportResponse> => {
  const params: Record<string, any> = {
    curriculum_id: curriculumId,
    type: type,
  };
  if (firstYearCurriculumId) {
    params.first_year_curriculum_id = firstYearCurriculumId;
  }
  const response = await axios.get<ProgramPoPsoReportResponse>(`${API_URL}/report`, { params });
  return response.data;
};

export const exportPdf = (curriculumId: number, firstYearCurriculumId?: number | null, type: string = "ALL"): void => {
  let url = `${API_URL}/export/pdf?curriculum_id=${curriculumId}&type=${type}`;
  if (firstYearCurriculumId) {
    url += `&first_year_curriculum_id=${firstYearCurriculumId}`;
  }
  window.open(url, "_blank");
};

export const exportDoc = async (
  curriculumId: number,
  firstYearCurriculumId?: number | null,
  type: string = "ALL"
): Promise<void> => {
  let url = `${API_URL}/export/doc?curriculum_id=${curriculumId}&type=${type}`;
  if (firstYearCurriculumId) {
    url += `&first_year_curriculum_id=${firstYearCurriculumId}`;
  }
  const response = await axios.get(url, { responseType: "blob" });
  const blob = new Blob([response.data as BlobPart], { type: "application/msword" });
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = "Program_PO_PSO_Attainment_Report.doc";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
};
