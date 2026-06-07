const BASE_URL = "http://localhost:8000/consultancy-testing-projects";

// DROPDOWNS
export const getDropdowns = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/dropdowns`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return data;
};

// CONSULTANCY LIST
export const getConsultancyProjects = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/consultancy/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

// SAVE CONSULTANCY
export const saveConsultancyProject = async (payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/consultancy/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

// UPDATE CONSULTANCY
export const updateConsultancyProject = async (id: number, payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/consultancy/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

// DELETE CONSULTANCY
export const deleteConsultancyProject = async (id: number | null) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/consultancy/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

// INNOVATIVE LIST
export const getInnovativeProjects = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/innovative/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};
export const updateInnovativeProject = async (
  id: number,
  payload: any
) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/innovative/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};
// SAVE INNOVATIVE
export const saveInnovativeProject = async (payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/innovative/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

// DELETE INNOVATIVE
export const deleteInnovativeProject = async (id: number | null) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/innovative/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};
