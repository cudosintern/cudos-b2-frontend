const BASE_URL = "http://127.0.0.1:8000/academy-data";

// ================= LIST =================

export const getBoardMembers = async () => {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  return await response.json();
};

// ================= CREATE =================

export const createBoardMember = async (payload: any) => {
  const response = await fetch(BASE_URL, {
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
};

// ================= UPDATE =================

export const updateBoardMember = async (
  id: number,
  payload: any,
) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
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
};

// ================= DELETE =================

export const deleteBoardMember = async (
  id: number,
) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete data");
  }

  return await response.json();
};