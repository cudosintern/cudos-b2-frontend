const BASE_URL = "http://127.0.0.1:8000/faculty-internship-training-industry";

// ================= GET ALL =================
export const getInternshipTrainingData = async (user_id: number) => {
  try {
    const response = await fetch(`${BASE_URL}/list/${user_id}`);

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    return await response.json();
  } catch (error) {
    console.error("GET API ERROR:", error);
    throw error;
  }
};

// ================= CREATE =================
export const createInternshipTrainingData = async (payload: any) => {
  try {
    const response = await fetch(`${BASE_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to create data");
    }

    return await response.json();
  } catch (error) {
    console.error("CREATE API ERROR:", error);
    throw error;
  }
};

// ================= UPDATE =================
export const updateInternshipTrainingData = async (
  id: number,
  payload: any,
) => {
  try {
    const response = await fetch(`${BASE_URL}/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to update data");
    }

    return await response.json();
  } catch (error) {
    console.error("UPDATE API ERROR:", error);
    throw error;
  }
};

// ================= DELETE =================
export const deleteInternshipTrainingData = async (id: number) => {
  try {
    const response = await fetch(`${BASE_URL}/delete/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete data");
    }

    return await response.json();
  } catch (error) {
    console.error("DELETE API ERROR:", error);
    throw error;
  }
};

// ================= DURATION DROPDOWN =================
export const getDurationUnits = async () => {
  try {
    const response = await fetch(`${BASE_URL}/duration-units`);

    if (!response.ok) {
      throw new Error("Failed to fetch duration units");
    }

    return await response.json();
  } catch (error) {
    console.error("DROPDOWN API ERROR:", error);
    throw error;
  }
};
