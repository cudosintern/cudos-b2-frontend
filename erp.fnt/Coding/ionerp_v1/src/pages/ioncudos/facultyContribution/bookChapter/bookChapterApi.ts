const BASE_URL = "http://localhost:8000/book-chapter";

// ================= BOOK CHAPTER CRUD =================

export const getBookChapters = async (userId: number) => {
  const res = await fetch(`${BASE_URL}/list/${userId}`);
  return res.json();
};

export const saveBookChapter = async (data: any) => {
  const res = await fetch(`${BASE_URL}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const updateBookChapter = async (id: number, data: any) => {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const deleteBookChapter = async (id: number) => {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
  });

  return res.json();
};

// ================= FILE UPLOAD =================

export const uploadBookChapterFile = async (formData: FormData) => {
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  return res.json();
};

// ================= GET UPLOADED FILES =================

export const getBookChapterFiles = async (tableRefId: number) => {
  const res = await fetch(`${BASE_URL}/upload-list/book_chapter/${tableRefId}`);

  return res.json();
};

// ================= UPDATE FILE =================

export const updateBookChapterFile = async (id: number, formData: FormData) => {
  const res = await fetch(`${BASE_URL}/upload/update/${id}`, {
    method: "PUT",
    body: formData,
  });

  return res.json();
};

// ================= DELETE FILE =================

export const deleteBookChapterFile = async (id: number) => {
  const res = await fetch(`${BASE_URL}/upload/${id}`, {
    method: "DELETE",
  });

  return res.json();
};
