const BASE_URL = "http://localhost:8000/award-honors";

// ================= GET =================
export const getAwards = async () => {
  const res = await fetch(BASE_URL);

  return await res.json();
};

// ================= SAVE =================
export const saveAward = async (payload: any) => {
  const body = {
    award_name: payload.awarded_name,
    award_for: payload.awarded_for,
    spo_oganization: payload.awarded_organization,
    venue: payload.venue,
    remarks: payload.award_details,
    year: payload.awarded_year,
    cash_award: 0,
  };

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return await res.json();
};

// ================= UPDATE =================
export const updateAward = async (id: number, payload: any) => {
  const body = {
    award_name: payload.awarded_name,
    award_for: payload.awarded_for,
    spo_oganization: payload.awarded_organization,
    venue: payload.venue,
    remarks: payload.award_details,
    year: payload.awarded_year,
    cash_award: 0,
  };

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return await res.json();
};

// ================= DELETE =================
export const deleteAward = async (id: number) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  return await res.json();
};

export const uploadAwardFile = async (
  formData: FormData,
) => {
  const res = await fetch(
    `${BASE_URL}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  return await res.json();
};

export const getAwardUploadedFiles = async (
  awardId: number,
) => {
  const res = await fetch(
    `${BASE_URL}/upload-list/award_honors/${awardId}`,
  );

  return await res.json();
};

export const updateAwardUploadFile = async (
  id: number,
  formData: FormData,
) => {
  const res = await fetch(
    `${BASE_URL}/upload/update/${id}`,
    {
      method: "PUT",
      body: formData,
    },
  );

  return await res.json();
};

export const deleteAwardUploadFile = async (
  id: number,
) => {
  const res = await fetch(
    `${BASE_URL}/upload/${id}`,
    {
      method: "DELETE",
    },
  );

  return await res.json();
};