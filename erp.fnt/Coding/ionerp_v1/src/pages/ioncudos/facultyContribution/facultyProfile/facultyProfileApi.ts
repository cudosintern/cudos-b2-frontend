export const getDropdowns = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:8000/faculty-profile/master-values", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.json();
};

export const getDesignations = async () => {
  const res = await fetch("http://localhost:8000/faculty-profile/designation-list");
  return res.json();
};

export const saveFaculty = async (payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:8000/faculty-profile/save-full", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const getFacultyDetails = async (userId: number) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/faculty-profile/details/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
};
export const uploadProfileImage = async (userId: number, file: File) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("user_id", String(userId));
  formData.append("file", file);

  const res = await fetch("http://localhost:8000/faculty-profile/upload-image", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  return res.json();
};

export const getDepartments = async () => {
  const res = await fetch("http://localhost:8000/faculty-profile/departments");
  return res.json();
};

export const getUserDesignationList = async (userId: number) => {
  const res = await fetch(`http://localhost:8000/faculty-profile/designation/${userId}`);
  return res.json();
};

export const saveDesignation = async (payload: any) => {
  const res = await fetch("http://localhost:8000/faculty-profile/designation/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.json();
};

export const getPhdGuidanceList = async (userId:number) => {
  const res = await fetch(`http://localhost:8000/faculty-profile/phd-guidance/${userId}`);
  return res.json();
};

export const savePhdGuidance = async (payload:any) => {
  const res = await fetch(`http://localhost:8000/faculty-profile/phd-guidance/save`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const getQualificationList = async (userId: number) => {
  const res = await fetch(`http://localhost:8000/faculty-profile/qualification/${userId}`);
  return res.json();
};

export const saveQualification = async (payload: any) => {
  const res = await fetch(`http://localhost:8000/faculty-profile/qualification/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const uploadQualificationFile = async (formData: FormData) => {
  const res = await fetch(
    "http://localhost:8000/faculty-profile/qualification/upload",
    {
      method: "POST",
      body: formData
    }
  );

  return res.json();
};

export const getQualificationUploadList = async (qualificationId: number) => {
  const res = await fetch(
    `http://localhost:8000/faculty-profile/qualification/upload-list/${qualificationId}`
  );

  return res.json();
};

export const deleteQualificationUpload = async (id: number) => {
  const res = await fetch(
    `http://localhost:8000/faculty-profile/qualification/upload/${id}`,
    {
      method: "DELETE"
    }
  );

  return res.json();
};
export const updateQualificationUpload = async (id: number, formData: FormData) => {
  const res = await fetch(
    `http://localhost:8000/faculty-profile/qualification/upload/update/${id}`,
    {
      method: "PUT",
      body: formData
    }
  );

  return res.json();
};