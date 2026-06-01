import axiosInstance from "../../../../utils/api";
import { KP, Program, ApiResponse } from "./manageKnowledgeProfile.types";

// Base URL context
// As per user request:
// List: GET /manage_knowledge_and_attitude_profile/list/{pgm_id}
// Create: POST /manage_knowledge_and_attitude_profile/create
// Update: PUT /manage_knowledge_and_attitude_profile/update/{pkp_id}
// Delete: DELETE /manage_knowledge_and_attitude_profile/delete/{pkp_id}

// The backend seems to be on port 8000 based on references, but I should use the axiosInstance if it's configured.
// However, the `labCategorySchema` used `http://localhost:8000/cudos/lab-category/lab_categories` directly.
// And `curriculumSchema` used `http://localhost:8000/curriculum_list`.
// I will use `axiosInstance` but with full URL if needed or relative if proxy is set.
// Given previous files used full URL or specific base, I will define a BASE constant.

const BASE_URL = "http://localhost:8000/manage_knowledge_and_attitude_profile";
const PROGRAM_URL = "http://localhost:8000/curriculum_list"; // For getProgramsDropdown

export const getProgramsDropdown = async (): Promise<ApiResponse<Program[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Program[]>>(`${PROGRAM_URL}/programs`);
    return response.data;
  } catch (error) {
    console.error("Error fetching programs", error);
    throw error;
  }
};

export const getKPList = async (pgmId: number): Promise<ApiResponse<KP[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<KP[]>>(`${BASE_URL}/list/${pgmId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching KP list", error);
    throw error;
  }
};

export const createKP = async (data: any): Promise<ApiResponse<KP>> => {
  try {
    const response = await axiosInstance.post<ApiResponse<KP>>(`${BASE_URL}/create`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating KP", error);
    throw error;
  }
};

export const updateKP = async (id: number, data: any): Promise<ApiResponse<KP>> => {
  try {
    const response = await axiosInstance.put<ApiResponse<KP>>(`${BASE_URL}/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating KP", error);
    throw error;
  }
};

export const deleteKP = async (id: number): Promise<ApiResponse<null>> => {
  try {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting KP", error);
    throw error;
  }
};
