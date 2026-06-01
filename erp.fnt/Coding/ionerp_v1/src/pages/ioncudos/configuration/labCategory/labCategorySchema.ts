import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { LabCategory } from "./types";

interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}

// --- API FUNCTIONS ---

export const getLabCategories = async (): Promise<ApiResponse<LabCategory[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<LabCategory[]>>(ApiEndpoint.cudos.lab_category + "lab_categories");
    // Backend might return direct data or wrapped in data.data
    const data = (response.data as any).data || response.data;
    return { status: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    console.error("Error fetching lab categories", error);
    return { status: false, message: "Error fetching data", data: [] };
  }
};

export const createLabCategory = async (data: any): Promise<ApiResponse<LabCategory>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<LabCategory>>(ApiEndpoint.cudos.lab_category + "lab_categories", data);
        return response.data;
    } catch (error) {
        console.error("Error creating lab category", error);
        throw error;
    }
};

export const updateLabCategory = async (id: number, data: any): Promise<ApiResponse<LabCategory>> => {
    try {
        const response = await axiosInstance.put<ApiResponse<LabCategory>>(`${ApiEndpoint.cudos.lab_category}lab_categories/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating lab category", error);
        throw error;
    }
};

export const deleteLabCategory = async (id: number): Promise<ApiResponse<null>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<null>>(`${ApiEndpoint.cudos.lab_category}lab_categories/${id}`);
        return response.data;
    } catch (error) {
         console.error("Error deleting lab category", error);
         throw error;
    }
};
