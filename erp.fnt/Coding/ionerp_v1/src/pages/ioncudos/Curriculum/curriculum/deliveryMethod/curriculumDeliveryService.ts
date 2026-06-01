import axiosInstance from "../../../../../utils/api";

// This matches the prefix we registered in routes.py
const API_URL = "/cudos/curriculum-delivery";

/**
 * API 1: Fetch methods already mapped to a specific curriculum
 * Hits: GET /cudos/curriculum-delivery/get_mapped_delivery_methods/{crclm_id}
 */
export const getMappedDeliveryMethods = async (crclm_id: number) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/get_mapped_delivery_methods/${crclm_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching mapped delivery methods:", error);
    throw error;
  }
};

/**
 * API 2: Save or Update a mapping
 * Hits: POST /cudos/curriculum-delivery/save_curriculum_delivery_method
 */
export const saveCurriculumDeliveryMethod = async (data: any) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const response = await axiosInstance.post(
      `${API_URL}/save_curriculum_delivery_method`,
      data,
      config
    );
    return response.data;
  } catch (error) {
    console.error("Error saving curriculum delivery method:", error);
    throw error;
  }
};

/**
 * API 3: Remove a mapping
 * Hits: POST /cudos/curriculum-delivery/delete_curriculum_delivery_method
 */
export const deleteCurriculumDeliveryMethod = async (crclm_dm_id: number) => {
  try {
    const payload = { crclm_dm_id: crclm_dm_id };
    const response = await axiosInstance.post(
      `${API_URL}/delete_curriculum_delivery_method`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting curriculum delivery method:", error);
    throw error;
  }
};