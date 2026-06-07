const BASE_URL =
  "http://localhost:8000/faculty-econtent-development-certification";

export const getDropdown = async () => {
  const res = await fetch(`${BASE_URL}/dropdown`);
  return res.json();
};

export const getList = async (userId: number, flag: number) => {
  const res = await fetch(`${BASE_URL}/list/${userId}/${flag}`);
  return res.json();
};

export const saveRecord = async (payload: any) => {
  const res = await fetch(`${BASE_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const updateRecord = async (id: number, payload: any) => {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const deleteRecord = async (id: number) => {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
  });

  return res.json();
};

export const getUploadedFiles = async (id: number) => {
  const res = await fetch(`${BASE_URL}/upload-list/${id}`);

  return res.json();
};

export const deleteUploadedFile = async (id: number) => {
  const res = await fetch(`${BASE_URL}/upload/${id}`, {
    method: "DELETE",
  });

  return res.json();
};

export const updateUploadedFile = async (
  id: number,
  description: string,
  actual_date: string,
) => {
  const formData = new FormData();

  formData.append("description", description);

  formData.append("actual_date", actual_date);

  const res = await fetch(
    `${BASE_URL}/upload/update/${id}`,
    {
      method: "PUT",
      body: formData,
    },
  );

  return res.json();
};