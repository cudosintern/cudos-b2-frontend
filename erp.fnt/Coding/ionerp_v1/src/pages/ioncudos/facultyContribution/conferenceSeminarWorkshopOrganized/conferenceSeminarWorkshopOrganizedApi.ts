const BASE_URL = "http://localhost:8000/conference-seminar";

// ===============================
// DROPDOWNS
// ===============================
export const getDropdowns = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/dropdowns`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};

// ===============================
// LIST
// ===============================
export const getConferenceSeminarList = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};

// ===============================
// SAVE
// ===============================
export const saveConferenceSeminar = async (payload: any) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/save`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(payload),
  });

  return await response.json();
};

// ===============================
// UPDATE
// ===============================
export const updateConferenceSeminar = async (
  twc_id: number,
  payload: any,
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/update/${twc_id}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(payload),
  });

  return await response.json();
};

// ===============================
// DELETE
// ===============================
export const deleteConferenceSeminar = async (twc_id: number) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/delete/${twc_id}`, {
    method: "DELETE",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};