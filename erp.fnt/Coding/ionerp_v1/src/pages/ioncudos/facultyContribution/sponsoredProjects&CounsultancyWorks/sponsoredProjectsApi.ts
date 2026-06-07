// sponsoredProjectsApi.ts

export const getDropdowns = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    "http://localhost:8000/sponsored-projects/dropdowns",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return await res.json();
};

export const getProjects = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:8000/sponsored-projects/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await res.json();
};

export const saveProject = async (payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:8000/sponsored-projects/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return await res.json();
};

export const updateProject = async (id: number, payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/sponsored-projects/update/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  return await res.json();
};

export const deleteProject = async (id: number) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/sponsored-projects/delete/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return await res.json();
};
