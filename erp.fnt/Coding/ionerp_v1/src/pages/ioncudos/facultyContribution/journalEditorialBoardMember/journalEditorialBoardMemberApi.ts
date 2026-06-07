const BASE_URL = "http://localhost:8000/journal-editorial-board-member";

// ==============================
// DROPDOWNS
// ==============================
export const getDropdowns = async () => {
  const response = await fetch(`${BASE_URL}/dropdowns`);

  return await response.json();
};

// ==============================
// LIST
// ==============================
export const getBoardMembers = async () => {
  const response = await fetch(`${BASE_URL}/list`);

  return await response.json();
};

// ==============================
// CREATE
// ==============================
export const createBoardMember = async (payload: any) => {
  const response = await fetch(`${BASE_URL}/create`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(payload),
  });

  return await response.json();
};

// ==============================
// UPDATE
// ==============================
export const updateBoardMember = async (id: number, payload: any) => {
  const response = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(payload),
  });

  return await response.json();
};

// ==============================
// DELETE
// ==============================
export const deleteBoardMember = async (id: number) => {
  const response = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
  });

  return await response.json();
};
