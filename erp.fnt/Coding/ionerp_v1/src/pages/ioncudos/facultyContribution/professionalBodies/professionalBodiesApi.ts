const BASE_URL = "http://localhost:8000/professional-bodies";

export const getDropdowns = async () => {
  const response = await fetch(`${BASE_URL}/dropdowns`);

  return await response.json();
};

export const getProfessionalBodies = async () => {
  const response = await fetch(`${BASE_URL}/list`);

  return await response.json();
};

export const createProfessionalBody = async (payload: any) => {
  const response = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

export const updateProfessionalBody = async (id: number, payload: any) => {
  const response = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

export const deleteProfessionalBody = async (id: number) => {
  const response = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
  });

  return await response.json();
};
