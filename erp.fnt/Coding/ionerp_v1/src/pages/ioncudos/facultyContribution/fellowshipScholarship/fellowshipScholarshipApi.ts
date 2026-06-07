const BASE_URL = "http://localhost:8000/fellowship-scholarship";

// LIST
export const getFellowshipScholarshipList = async () => {
  const response = await fetch(`${BASE_URL}/list`);

  return await response.json();
};

// DROPDOWNS
export const getFellowshipScholarshipDropdowns = async () => {
  const response = await fetch(`${BASE_URL}/dropdowns`);

  return await response.json();
};

// SAVE
export const saveFellowshipScholarship = async (payload: any) => {
  const response = await fetch(`${BASE_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

// UPDATE
export const updateFellowshipScholarship = async (
  scholar_id: number,
  payload: any,
) => {
  const response = await fetch(`${BASE_URL}/update/${scholar_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

// DELETE
export const deleteFellowshipScholarship = async (scholar_id: number) => {
  const response = await fetch(`${BASE_URL}/delete/${scholar_id}`, {
    method: "DELETE",
  });

  return await response.json();
};
