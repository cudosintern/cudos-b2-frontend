export const getWorkloadDropdowns = async (userId: number) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/faculty-workload/dropdowns/${userId}`, // ✅ FIXED
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
};


export const getFacultyWorkloadList = async (userId: number) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/faculty-workload/list/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
};


export const saveFacultyWorkload = async (payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    "http://localhost:8000/faculty-workload/save",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  return res.json();
};


export const updateFacultyWorkload = async (id: number, payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/faculty-workload/update/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  return res.json();
};


export const deleteFacultyWorkload = async (id: number) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/faculty-workload/delete/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
};