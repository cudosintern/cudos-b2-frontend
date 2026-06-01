import axios from "axios";
import axiosInstance from "../../../../utils/api";
import { Curriculum, Program, ProgramOwner, CurriculumTerm } from "./curriculumResponseInterface";

// Base path for Curriculum APIs
// User provided: /api/v1/curriculum_list/...
const BASE_URL = "http://localhost:8000/curriculum_list";
//const BASE_URL = "http://localhost:8000/api/v1/curriculum_list";
export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}

const mapBackendToCurriculum = (data: any): Curriculum => {
  return {
    crclm_id: data.academic_batch_id,
    crclm_name: data.academic_batch_code || data.crclm_name, // Fallback if old code
    description: data.academic_batch_desc || data.description,
    start_year: data.start_year,
    end_year: data.end_year,
    program_id: data.pgm_id,
    program_name: data.program_name,
    program_owner_id: data.academic_batch_owner,
    program_owner_name: data.program_owner_name,
    authority_user_id: data.created_by,
    term_max_duration: data.program_duration,
    dept_name: data.dept_name,
    school_id: data.dept_id,
    status: data.status === 1,
    total_terms: data.total_terms,
    total_credits: data.total_credits,
    tee_passing_marks: data.tee_passing_marks,
    competency_pi_status: "Mandatory",
    course_mapping_status: "Optional",
    student_registration_status: "Mandatory"
  };
};

// Get All Curriculum
export const getAllCurriculum = async (): Promise<ApiResponse<Curriculum[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`${BASE_URL}/curriculum`);
    const mappedData = response.data.data.map(mapBackendToCurriculum);
    return { ...response.data, data: mappedData };
  } catch (error) {
    console.error("Error fetching curriculum list", error);
    throw error;
  }
};

// Get Curriculum by ID (Using /curriculum to get ALL fields since /curriculum/{id} drops some columns)
export const getCurriculumById = async (id: number): Promise<ApiResponse<Curriculum>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`${BASE_URL}/curriculum`);
    const allRecords = response.data.data || [];
    const specificRecord = allRecords.find((c: any) => c.academic_batch_id === id);

    if (!specificRecord) {
      throw new Error("Curriculum not found in list");
    }

    const mappedData = mapBackendToCurriculum(specificRecord);
    return { ...response.data, data: mappedData };
  } catch (error) {
    console.error("Error fetching curriculum details", error);
    throw error;
  }
};

// Add Curriculum
// export const createCurriculum = async (data: any): Promise<ApiResponse<Curriculum>> => {
//   try {
//     const response = await axiosInstance.post<ApiResponse<Curriculum>>(`${BASE_URL}/curriculum`, data);
//     return response.data;
//   } catch (error) {
//     console.error("Error creating curriculum", error);
//     throw error;
//   }
// };
export const createCurriculum = async (
  formData: Partial<Curriculum>
): Promise<ApiResponse<Curriculum>> => {
  try {

    const payload = {
      academic_batch_code: formData.crclm_name || "",
      academic_batch_desc: formData.description || "",
      academic_year: "",
      regulation_year: "",
      program_duration: formData.term_max_duration || 0,
      dept_id: formData.school_id || 1, // fallback from 0 to avoid FK error
      pgm_id: formData.program_id || 0,
      total_credits: formData.total_credits || 0,
      start_year: formData.start_year || 0,
      end_year: formData.end_year || 0,
      total_terms: formData.total_terms || 0,
      academic_batch_owner: formData.program_owner_id || 1, // Fallback to avoid FK error
      cia_passing_marks: 0,
      tee_passing_marks: formData.tee_passing_marks || 0,
      status: formData.status ? 1 : 0,
      created_by: formData.authority_user_id || 1
    };

    const response = await axiosInstance.post<ApiResponse<any>>(
      `${BASE_URL}/curriculum`,
      payload
    );

    return { ...response.data, data: mapBackendToCurriculum(response.data.data) };

  } catch (error) {
    console.error("Error creating curriculum", error);
    throw error;
  }
};
export const updateCurriculum = async (
  id: number,
  formData: Partial<Curriculum>
): Promise<ApiResponse<Curriculum>> => {
  try {
    const payload = {
      academic_batch_code: formData.crclm_name || "",
      academic_batch_desc: formData.description || "",
      academic_year: "",
      regulation_year: "",
      program_duration: formData.term_max_duration || 0,
      dept_id: formData.school_id || 1, // Fallback to avoid FK error
      pgm_id: formData.program_id || 0,
      total_credits: formData.total_credits || 0,
      start_year: formData.start_year || 0,
      end_year: formData.end_year || 0,
      total_terms: formData.total_terms || 0,
      academic_batch_owner: formData.program_owner_id || 1, // Fallback to avoid FK error
      cia_passing_marks: 0,
      tee_passing_marks: formData.tee_passing_marks || 0,
      status: formData.status ? 1 : 0,
      modified_by: formData.authority_user_id || 1
    };

    const response = await axiosInstance.put<ApiResponse<any>>(
      `${BASE_URL}/curriculum/${id}`,
      payload
    );

    return { ...response.data, data: mapBackendToCurriculum(response.data.data) };

  } catch (error) {
    console.error("Error updating curriculum", error);
    throw error;
  }
};

// Toggle Status (Activate/Deactivate)
export const toggleCurriculumStatus = async (id: number): Promise<ApiResponse<any>> => {
  try {
    const response = await axiosInstance.patch<ApiResponse<any>>(`${BASE_URL}/curriculum/${id}/toggle-status?modified_by=1`);
    return response.data;
  } catch (error) {
    console.error("Error toggling curriculum status", error);
    throw error;
  }
};

// Get Programs Dropdown
export const getProgramsDropdown = async (): Promise<ApiResponse<Program[]>> => {
  try {
    const response = await axiosInstance.get<{ programs: Program[] }>(`${process.env.REACT_APP_API_URL}/programs`);

    return {
      status: true,
      message: "Success",
      data: response.data.programs || []
    };
  } catch (error) {
    console.error("Error fetching programs", error);
    throw error;
  }
};

// Get Program Owners
export const getProgramOwners = async (pgm_id: number): Promise<ApiResponse<ProgramOwner[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<ProgramOwner[]>>(`${BASE_URL}/curriculum/program/${pgm_id}/owners`);
    return response.data;
  } catch (error) {
    console.error("Error fetching program owners", error);
    throw error;
  }
};

// Get Program Details
export const getProgramDetails = async (pgm_id: number): Promise<ApiResponse<any>> => {
  try {
    const response = await axiosInstance.get<any>(`${process.env.REACT_APP_API_URL}/program/${pgm_id}/details`);
    return {
      status: true,
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching program details", error);
    throw error; // Let the form handle it or ignore
  }
};

// --- School/User APIs ---
const SCHOOL_USER_BASE = `${process.env.REACT_APP_API_URL}/school_user`;

export const getSchoolsDropdown = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`${SCHOOL_USER_BASE}/school_dropdown`);
    return response.data;
  } catch (error) {
    console.error("Error fetching schools", error);
    throw error;
  }
};

export const getUsersDropdown = async (dept_id?: number): Promise<ApiResponse<any[]>> => {
  try {
    const url = dept_id
      ? `${SCHOOL_USER_BASE}/users_dropdown?dept_id=${dept_id}`
      : `${SCHOOL_USER_BASE}/users_dropdown`;
    const response = await axiosInstance.get<ApiResponse<any[]>>(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching users", error);
    throw error;
  }
};

// --- Assessment & Term Detail APIs ---
const TERM_DETAIL_BASE = `${process.env.REACT_APP_API_URL}/curriculum_term_detail`;

export const getImportCurriculumList = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`${BASE_URL}/curriculum`);
    return response.data;
  } catch (error) {
    console.error("Error fetching import curriculum list", error);
    throw error;
  }
};

export const getCurriculumTermDetails = async (academicBatchId: number): Promise<ApiResponse<CurriculumTerm[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<CurriculumTerm[]>>(`${TERM_DETAIL_BASE}/curriculum-term-detail/${academicBatchId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching curriculum term details", error);
    throw error;
  }
};

export const createCurriculumTermDetails = async (academicBatchId: number, details: any[]): Promise<ApiResponse<any>> => {
  try {
    const payload = {
      academic_batch_id: academicBatchId,
      details: details.map(d => ({
        si_no: d.term_no || d.si_no,
        term_name: d.term_name,
        duration_weeks: d.duration_weeks || 16,
        total_credits: d.total_credits || d.credits || 0,
        total_theory_courses: d.total_theory_courses || 0,
        total_practical_others: d.total_practical_others || d.total_practical || 0,
        academic_start_year: d.academic_start_year || 0,
        academic_end_year: d.academic_end_year || 0,
        academic_year: d.academic_year || 0
      }))
    };
    const response = await axiosInstance.post<ApiResponse<any>>(`${TERM_DETAIL_BASE}/curriculum-term-detail`, payload);
    return response.data;
  } catch (error) {
    console.error("Error creating curriculum term details", error);
    throw error;
  }
};

export const updateCurriculumTermDetail = async (semesterId: number, academicBatchId: number, detail: any): Promise<ApiResponse<any>> => {
  try {
    const payload = {
      academic_batch_id: academicBatchId,
      si_no: detail.term_no || detail.si_no,
      term_name: detail.term_name,
      duration_weeks: detail.duration_weeks || 16,
      total_credits: detail.total_credits || detail.credits || 0,
      total_theory_courses: detail.total_theory_courses || 0,
      total_practical_others: detail.total_practical_others || detail.total_practical || 0,
      academic_start_year: detail.academic_start_year || 0,
      academic_end_year: detail.academic_end_year || 0,
      academic_year: detail.academic_year || 0
    };
    const response = await axiosInstance.put<ApiResponse<any>>(`${TERM_DETAIL_BASE}/curriculum-term-detail/${semesterId}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating curriculum term detail", error);
    throw error;
  }
};