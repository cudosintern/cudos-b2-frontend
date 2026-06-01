import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  fetchDepartments,
  fetchUsersByDept,
  addExistingBosMember,
} from "./bosApi";
import { UserResponse } from "./responseInterface";
import axiosInstance from "../../../../utils/api";

// --- TYPES ---
interface Department {
  department_id: number;
  dept_name: string;
  status?: number;
}

const AddExistingUser = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [schools, setSchools] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);

  const [form, setForm] = useState({
    school: "",
    staff_name: "",
    bos_for: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleListRedirect = () => {
    const basePath = window.location.pathname.replace(/\/add-existing$/, "");
    navigate(basePath);
  };

  // --- LOAD DEPARTMENTS ---
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "";
      const res = await axiosInstance.post(
        `${API_URL.replace(/\/+$/, "")}/comman_function/department_list`,
        {
          dept_id: null,
          show_delete: 0,
          equal_or_not_equal: false,
        },
        { withCredentials: false },
      );

      // @ts-ignore
      const data = res.data.data || res.data;
      if (Array.isArray(data)) {
        const activeSchools = data.filter(
          (dept: any) => dept.status !== 0 && String(dept.status) !== "0",
        );
        setSchools(activeSchools);
      }
    } catch (error) {
      console.error("Failed to load departments", error);
    }
  };

  // --- HANDLERS ---
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (value) {
      setErrors({ ...errors, [name]: "" });
    }

    if (name === "school") {
      setForm((prev) => ({ ...prev, school: value, staff_name: "" }));
      setUsers([]);

      if (value) {
        try {
          const API_URL = process.env.REACT_APP_API_URL || "";
          const API = `${API_URL.replace(/\/+$/, "")}/cudos/board-of-studies`;
          const res = await axiosInstance.post(
            `${API}/users_by_dept`,
            { dept_id: Number(value) },
            { withCredentials: false },
          );

          // @ts-ignore
          const data = res.data.data || res.data;
          if (Array.isArray(data)) {
            setUsers(data);
          }
        } catch (error) {
          console.error("Failed to fetch users", error);
        }
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.school) newErrors.school = "School is required";
    if (!form.staff_name) newErrors.staff_name = "Staff Name is required";
    if (!form.bos_for) newErrors.bos_for = "BoS For is required";
    return newErrors;
  };

  // --- SAVE ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const startValidation = validate();
    if (Object.keys(startValidation).length > 0) {
      setErrors(startValidation);
      return;
    }

    setIsSubmitting(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "";
      const API = `${API_URL.replace(/\/+$/, "")}/cudos/board-of-studies`;
      await axiosInstance.post(
        `${API}/add_existing`,
        {
          user_id: Number(form.staff_name),
          bos_dept_id: Number(form.bos_for),
          bos_for: "",
        },
        { withCredentials: false },
      );

      toast.success("Existing user added to BoS successfully");
      handleListRedirect();
    } catch (error: any) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.detail?.includes("already a member")
      ) {
        toast.warning("User is already a member of this BoS");
        return;
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already a member")
      ) {
        toast.warning("User is already a member of this BoS");
        return;
      }

      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to add existing user";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="">
      <h3 className="text-lg leading-6 font-medium pb-5">
        Add Existing User as BoS Member
      </h3>

      <div className="bg-white p-6 shadow-md rounded-md border border-gray-200">
        <form onSubmit={handleSave}>
          <div className="flex flex-col space-y-4" style={{ maxWidth: 450 }}>
            {/* School (Source) */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                School: <span className="text-red-500">*</span>
              </label>
              <select
                name="school"
                value={form.school}
                onChange={handleChange}
                className="border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select School</option>
                {schools.map((dept) => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
              {errors.school && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.school}
                </span>
              )}
            </div>

            {/* Staff Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Staff Name: <span className="text-red-500">*</span>
              </label>
              <select
                name="staff_name"
                value={form.staff_name}
                onChange={handleChange}
                disabled={!form.school}
                className="border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">
                  {users.length ? "Select User" : "No users found"}
                </option>
                {users.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </option>
                ))}
              </select>
              {errors.staff_name && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.staff_name}
                </span>
              )}
            </div>

            {/* BoS For (Target) */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                BoS for: <span className="text-red-500">*</span>
              </label>
              <select
                name="bos_for"
                value={form.bos_for}
                onChange={handleChange}
                className="border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select School</option>
                {schools.map((dept) => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
              {errors.bos_for && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.bos_for}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-4 text-sm rounded-md flex items-center gap-2 button-bg text-white hover:opacity-90 disabled:opacity-50"
            >
              <FaSave /> Save
            </button>

            <button
              type="button"
              className="h-10 px-4 text-sm rounded-md flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
              onClick={handleListRedirect}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExistingUser;
