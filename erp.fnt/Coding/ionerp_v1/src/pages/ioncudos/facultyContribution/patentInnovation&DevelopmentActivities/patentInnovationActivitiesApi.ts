const BASE_URL =
  "http://localhost:8000/patentInnovation_activities";

export const getPatentDropdowns = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/dropdowns`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const getPatents = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const savePatent = async (data: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const updatePatent = async (
  id: number,
  data: any
) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const deletePatent = async (id: number) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};