const BASE_URL = "http://localhost:8000/faculty-reports-profile";

// ==================================
// Get Departments
// ==================================
export const getDepartments = async () => {
  const response = await fetch(`${BASE_URL}/departments`);

  if (!response.ok) {
    throw new Error("Failed to fetch departments");
  }

  return await response.json();
};

// ==================================
// Get Users By Department
// ==================================
export const getUsers = async (deptId: number) => {
  const response = await fetch(`${BASE_URL}/users/${deptId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return await response.json();
};

// ==================================
// Get Faculty Profile
// ==================================
export const getFacultyProfile = async (deptId: number, userId: number) => {
  const response = await fetch(`${BASE_URL}/profile/${deptId}/${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch faculty profile");
  }

  return await response.json();
};
