import axiosInstance from "../../../../utils/api";

const API_URL = "/curriculum/course_specialization";

export interface CourseSpecializationData {
  crs_domain_id?: number;
  dept_id: number;
  crs_domain_name: string;
  crs_domain_description?: string;
}

export interface ApiResponse {
  status: number;
  message?: string;
  data?: any;
}

// --- 1. GET DEPARTMENT DROPDOWN ---
export const getDepartmentDropdown = async (): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/get_department_dropdown`);
    return response.data as ApiResponse;
  } catch (error) {
    console.error("Error fetching departments:", error);
    return { status: 0, message: "Error fetching departments" };
  }
};

// --- 2. GET LIST (Filtered by Department) ---
export const getCourseDomains = async (
  deptId: number,
): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.post(`${API_URL}/get_course_domain`, {
      dept_id: deptId,
    });
    return response.data as ApiResponse;
  } catch (error) {
    console.error("Error fetching domains:", error);
    return { status: 0, message: "Error fetching data" };
  }
};

// --- 3. SAVE (Create or Update) ---
export const saveCourseDomain = async (
  data: CourseSpecializationData,
): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.post(`${API_URL}/save_course_domain`, data);
    return response.data as ApiResponse;
  } catch (error) {
    console.error("Error saving domain:", error);
    return { status: 0, message: "Error saving data" };
  }
};

// --- 4. DELETE ---
export const deleteCourseDomain = async (id: number): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.post(`${API_URL}/delete_course_domain`, {
      crs_domain_id: id,
    });
    return response.data as ApiResponse;
  } catch (error) {
    console.error("Error deleting domain:", error);
    return { status: 0, message: "Error deleting data" };
  }
};
