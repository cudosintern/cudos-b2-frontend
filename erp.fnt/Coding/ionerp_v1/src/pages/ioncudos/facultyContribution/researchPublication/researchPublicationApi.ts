export const getDropdowns = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/research-publication/dropdowns`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return res.json();
};

export const getPublications = async (
  userId: number,
  publicationType?: number,
) => {
  const token = localStorage.getItem("token");

  let url = `http://localhost:8000/research-publication/list?user_id=${userId}`;

  if (publicationType) {
    url += `&publication_type=${publicationType}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const savePublication = async (payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:8000/research-publication/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const updatePublication = async (id: number, payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/research-publication/update/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  return res.json();
};

export const deletePublication = async (id: number) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/research-publication/delete/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return res.json();
};

// ================= UPLOAD FILE =================

export const uploadResearchPublicationFile = async (formData: FormData) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:8000/research-publication/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return res.json();
};

// ================= GET UPLOAD LIST =================

export const getResearchPublicationUploadList = async (
  publicationId: number,
) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/research-publication/upload-list/${publicationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return res.json();
};

// ================= DELETE FILE =================

export const deleteResearchPublicationUpload = async (id: number) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/research-publication/upload/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return res.json();
};

// ================= UPDATE DESCRIPTION/DATE =================

export const updateResearchPublicationUpload = async (
  id: number,
  formData: FormData,
) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/research-publication/upload/update/${id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  return res.json();
};

export const bulkSavePublications = async (payload: any[]) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/research-publication/bulk-save`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    },
  );

  return res.json();
};
