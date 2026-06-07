const BASE_URL = "http://localhost:8000/research-project";

const getToken = () => localStorage.getItem("token");

// ==============================
// DROPDOWNS
// ==============================
export const getDropdowns = async () => {
  const response = await fetch(`${BASE_URL}/dropdowns`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return await response.json();
};

// ==============================
// LIST
// ==============================
export const getResearchProjects = async () => {
  const response = await fetch(`${BASE_URL}/list`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return await response.json();
};

// ==============================
// CREATE
// ==============================
export const createResearchProject = async (payload: any) => {
  const response = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

// ==============================
// UPDATE
// ==============================
export const updateResearchProject = async (id: number, payload: any) => {
  const response = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

// ==============================
// DELETE
// ==============================
export const deleteResearchProject = async (id: number) => {
  const response = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return await response.json();
};

export const uploadResearchProjectFile = async (
  formData: FormData,
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/upload`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: formData,
    },
  );

  return await response.json();
};

// ======================================
// GET FILES
// ======================================
export const getResearchProjectUploads = async (
  researchId: number,
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/upload-list/${researchId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return await response.json();
};

// ======================================
// DELETE FILE
// ======================================
export const deleteResearchProjectUpload =
  async (id: number) => {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${BASE_URL}/upload/${id}`,
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return await response.json();
  };

// ======================================
// UPDATE FILE
// ======================================
export const updateResearchProjectUpload =
  async (id: number, formData: FormData) => {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${BASE_URL}/upload/update/${id}`,
      {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      },
    );

    return await response.json();
  };
