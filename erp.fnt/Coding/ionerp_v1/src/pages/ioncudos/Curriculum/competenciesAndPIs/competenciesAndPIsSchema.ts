import axiosInstance from "../../../../utils/api";
import { 
  ApiResponse, 
  Curriculum, 
  ProgramOutcome, 
  Competency, 
  PerformanceIndicator, 
  ViewCPIsResponse 
} from "./types";

const API_URL = `http://localhost:8000/competencies_pis`;

export const getCurriculumList = async (): Promise<ApiResponse<Curriculum[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Curriculum[]>>(`${API_URL}/get_curriculum_list`);
    return response.data;
  } catch (error) {
    console.error("Error fetching curriculum list", error);
    return { status: false, message: "Error fetching curriculum data", data: [] };
  }
};

export const getPoList = async (academicBatchId: number): Promise<ApiResponse<ProgramOutcome[]>> => {
  try {
    const response = await axiosInstance.post<ApiResponse<any>>(`${API_URL}/get_po_list`, {
      academic_batch_id: academicBatchId
    });
    
    return {
      status: response.data.status,
      message: response.data.message,
      data: response.data.data || []
    };
  } catch (error) {
    console.error("Error fetching PO list", error);
    return { status: false, message: "Error fetching POs", data: [] };
  }
};

export const viewCPIs = async (poId: number): Promise<ApiResponse<ViewCPIsResponse[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<ViewCPIsResponse[]>>(`${API_URL}/view_competencies_and_pis?po_id=${poId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching view CPIs", error);
    throw error;
  }
};

/* ================= COMPETENCY C.U.D ================= */
export const manageCompetency = async (data: { pi_id?: number, po_id: number, pi_statement: string }): Promise<ApiResponse<any>> => {
  try {
    const response = await axiosInstance.post<ApiResponse<any>>(`${API_URL}/manage_competency`, data);
    return response.data;
  } catch (error) {
    console.error("Error saving competency", error);
    throw error;
  }
};

export const deleteCompetency = async (piId: number): Promise<ApiResponse<null>> => {
  try {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${API_URL}/delete_competency/${piId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting competency", error);
    throw error;
  }
};

/* ================= PI C.U.D ================= */
export const managePI = async (data: { msr_id?: number, pi_id: number, msr_statement: string, pi_codes?: string }): Promise<ApiResponse<any>> => {
  try {
    const response = await axiosInstance.post<ApiResponse<any>>(`${API_URL}/manage_pi`, data);
    return response.data;
  } catch (error) {
    console.error("Error saving PI", error);
    throw error;
  }
};

export const deletePI = async (msrId: number): Promise<ApiResponse<null>> => {
  try {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${API_URL}/delete_pi/${msrId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting PI", error);
    throw error;
  }
};