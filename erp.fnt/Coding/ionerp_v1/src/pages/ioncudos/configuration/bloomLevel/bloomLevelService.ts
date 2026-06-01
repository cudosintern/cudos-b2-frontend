import axios from "axios";

const API_URL = "http://localhost:8000/cudo_module";

// Function 1: Save a new level
export const saveBloomLevel = async (data: any) => {
  try {
    const config = {
      headers: {
        "org-id": 1,
        "Content-Type": "application/json",
      },
    };
    const response = await axios.post(
      `${API_URL}/save_bloom_level`,
      data,
      config,
    );
    return response.data;
  } catch (error) {
    console.error("Error saving level:", error);
    throw error;
  }
};

/**
 * API 2: Fetch all Bloom Levels
 */
export const getBloomLevels = async () => {
  try {
    const config = {
      headers: {
        "org-id": 1,
      },
    };
    const response = await axios.get(`${API_URL}/get_bloom_levels`, config);
    return response.data;
  } catch (error) {
    console.error("Error fetching levels:", error);
    throw error;
  }
};

/**
 * API 3: Delete a Bloom Level */
export const deleteBloomLevel = async (bloom_id: number) => {
  try {
    const config = {
      headers: {
        "org-id": 1,
        "Content-Type": "application/json",
      },
    };
    const payload = { bloom_id: bloom_id };

    const response = await axios.post(
      `${API_URL}/delete_bloom_level`,
      payload,
      config,
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting level:", error);
    throw error;
  }
};
