// ✅ GET ALL COURSES
export const getCourses = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    "http://localhost:8000/course-completed/",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
};


// ✅ CREATE COURSE
export const createCourse = async (payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    "http://localhost:8000/course-completed/",
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


// ✅ UPDATE COURSE
export const updateCourse = async (id: number, payload: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/course-completed/${id}`,
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


// ✅ DELETE COURSE
export const deleteCourse = async (id: number) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8000/course-completed/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
};