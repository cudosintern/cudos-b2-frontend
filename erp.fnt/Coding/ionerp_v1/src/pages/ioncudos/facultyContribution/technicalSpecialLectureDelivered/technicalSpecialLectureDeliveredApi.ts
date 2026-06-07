const BASE_URL = "http://localhost:8000/technical-special-lecture-delivered";

const token = localStorage.getItem("token");

export const getDropdowns = async () => {
  const response = await fetch(`${BASE_URL}/dropdowns`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};

// ================= GET LIST =================

export const getLectures = async () => {
  const response = await fetch(`${BASE_URL}/list`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};

// ================= CREATE =================

export const createLecture = async (payload: any) => {
  const response = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

// ================= UPDATE =================

export const updateLecture = async (id: number, payload: any) => {
  const response = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

// ================= DELETE =================

export const deleteLecture = async (id: number) => {
  const response = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
