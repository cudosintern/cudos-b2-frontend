const BASE_URL = "http://localhost:8000/seminar-workshop-attended";

// ==========================
// DROPDOWNS
// ==========================
export const getDropdowns = async () => {
  const response = await fetch(`${BASE_URL}/dropdowns`);

  return await response.json();
};

// ==========================
// LIST
// ==========================
export const getSeminarWorkshopList = async () => {
  const response = await fetch(`${BASE_URL}/list`);

  return await response.json();
};

// ==========================
// CREATE
// ==========================
export const saveSeminarWorkshop = async (payload: any) => {
  const response = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

// ==========================
// UPDATE
// ==========================
export const updateSeminarWorkshop = async (id: number, payload: any) => {
  const response = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

// ==========================
// DELETE
// ==========================
export const deleteSeminarWorkshop = async (id: number) => {
  const response = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
  });

  return await response.json();
};

export const uploadSeminarWorkshopFile = async (formData: FormData) => {
  const response = await fetch(
    `${BASE_URL}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  return await response.json();
};

// ===============================
// GET UPLOAD LIST
// ===============================
export const getUploadList = async (twca_id: number) => {
  const response = await fetch(
    `${BASE_URL}/upload-list/${twca_id}`
  );

  return await response.json();
};

// ===============================
// DELETE UPLOAD
// ===============================
export const deleteUploadFile = async (id: number) => {
  const response = await fetch(
    `${BASE_URL}/upload/${id}`,
    {
      method: "DELETE",
    }
  );

  return await response.json();
};

// ===============================
// UPDATE UPLOAD
// ===============================
export const updateUploadFile = async (
  id: number,
  formData: FormData
) => {
  const response = await fetch(
    `${BASE_URL}/upload/update/${id}`,
    {
      method: "PUT",
      body: formData,
    }
  );

  return await response.json();
};
