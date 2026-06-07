const BASE_URL = "http://localhost:8000/book-published";

export const getDropdowns = async (userId: number) => {
  const res = await fetch(`${BASE_URL}/dropdowns/${userId}`);
  return await res.json();
};

export const getBooks = async () => {
  const res = await fetch(`${BASE_URL}/list`);
  return await res.json();
};

export const saveBook = async (payload: any) => {
  const res = await fetch(`${BASE_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await res.json();
};

export const getSingleBook = async (id: number) => {
  const res = await fetch(`${BASE_URL}/${id}`);
  return await res.json();
};

export const updateBook = async (id: number, payload: any) => {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await res.json();
};

export const deleteBook = async (id: number) => {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
  });

  return await res.json();
};