import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaSync, FaTimes } from "react-icons/fa";
import { bosSchema, BosFormData, bosFormFields } from "./bosSchema";
import {
  fetchDepartments,
  getDesignations,
  getBosById,
  createBos,
  updateBos,
  FACULTY_TYPES,
} from "./bosApi";
import { toast } from "react-toastify";
import axiosInstance from "../../../../utils/api";
import { Designation } from "./responseInterface";

const API_URL = process.env.REACT_APP_API_URL || "";
const API = `${API_URL.replace(/\/+$/, "")}/cudos/board-of-studies`;

// --- TYPES ---
const TITLE_TO_ID: Record<string, number> = {
  "Mr.": 1,
  "Mrs.": 2,
  "Ms.": 3,
  "Dr.": 4,
  "Prof.": 5,
};

const ID_TO_TITLE: Record<number, string> = {
  1: "Mr.",
  2: "Mrs.",
  3: "Ms.",
  4: "Dr.",
  5: "Prof.",
};

interface Department {
  department_id: number;
  dept_name: string;
  status?: number;
}

const AddNewMember = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // --- STATE ---
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadedData, setLoadedData] = useState<BosFormData | null>(null);

  const defaultValues = {
    faculty_type: "",
    title: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    organization: "",
    email: "",
    mobile: "",
    aadhar_number: "",
    highest_qualification: "",
    password: "",
    designation: "",
    experience: undefined,
    bos_for: "",
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BosFormData>({
    resolver: zodResolver(bosSchema),
    mode: "onChange",
    defaultValues,
  });

  const handleListRedirect = () => {
    const basePath = window.location.pathname
      .replace(/\/add-new$/, "")
      .replace(/\/edit\/\d+$/, "");
    navigate(basePath);
  };

  // --- LOAD DEPENDENCIES ---
  useEffect(() => {
    loadDesignations();
    loadDepartments();
  }, []);

  const loadDesignations = async () => {
    try {
      const res = await axiosInstance.get(`${API}/designations`, {
        withCredentials: false,
      });
      // @ts-ignore
      const data = res.data.data || res.data;
      if (Array.isArray(data)) {
        setDesignations(data);
      }
    } catch (err) {
      console.error("Failed to load designations", err);
    }
  };

  const loadDepartments = async () => {
    try {
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
        const activeDepartments = data.filter(
          (dept: any) => dept.status !== 0 && String(dept.status) !== "0",
        );
        setDepartments(activeDepartments);
      }
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  // --- LOAD MEMBER (EDIT MODE) ---
  useEffect(() => {
    if (isEdit && id) {
      loadMember(Number(id));
    }
  }, [isEdit, id]);

  const loadMember = async (memberId: number) => {
    try {
      const res = await getBosById(memberId);
      const data = res.data;

      let titleValue = "";
      const standardTitles = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."];
      const cleanOptions = ["mr", "mrs", "ms", "dr", "prof"];

      let raw: any =
        data.title ||
        (data as any).salutation ||
        (data as any).prefix ||
        (data as any).name_prefix ||
        (data as any).person_title ||
        (data as any).title_id ||
        (data as any).salutation_id ||
        (data as any).prefix_id ||
        (data as any).user?.title ||
        (data as any).user?.salutation ||
        (data as any).user?.prefix;

      if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
        if (
          typeof raw === "number" ||
          (!isNaN(Number(raw)) && !standardTitles.includes(String(raw)))
        ) {
          titleValue = ID_TO_TITLE[Number(raw)] || "";
        } else {
          const clean = String(raw).trim().replace(/\.$/, "").toLowerCase();
          const idx = cleanOptions.indexOf(clean);
          if (idx !== -1) {
            titleValue = standardTitles[idx];
          } else {
            titleValue = String(raw).trim();
          }
        }
      }

      if (!titleValue || titleValue === "") {
        const foundEntry = Object.entries(data).find(([_, val]) => {
          if (typeof val !== "string") return false;
          const c = val.trim().replace(/\.$/, "").toLowerCase();
          return cleanOptions.includes(c);
        });
        if (foundEntry) {
          const clean = String(foundEntry[1])
            .trim()
            .replace(/\.$/, "")
            .toLowerCase();
          const idx = cleanOptions.indexOf(clean);
          if (idx !== -1) titleValue = standardTitles[idx];
        }
      }

      if (
        titleValue &&
        !titleValue.endsWith(".") &&
        ["Mr", "Mrs", "Ms", "Dr", "Prof"].includes(titleValue)
      ) {
        titleValue += ".";
      }

      const loadFormData: any = {
        faculty_type: data.faculty_type || "",
        title: titleValue,
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        last_name: data.last_name || "",
        organization: data.organization || "",
        email: data.email || "",
        mobile: data.mobile || data.contact || "",
        aadhar_number: data.aadhar_number || "",
        highest_qualification: data.highest_qualification || "",
        experience:
          data.experience !== null && data.experience !== undefined
            ? Number(data.experience)
            : undefined,
        password: "",
        designation: data.designation_id ? String(data.designation_id) : "",
        bos_for: data.bos_for || data.organization || data.school || "",
      };

      setLoadedData(loadFormData);
      reset(loadFormData);
      if (titleValue) {
        setValue("title", titleValue, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    } catch (err) {
      console.error("Failed to load member", err);
    }
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue("password", pass, { shouldValidate: true });
  };

  // --- SUBMIT ---
  const onSubmit = async (data: BosFormData) => {
    try {
      const payload = {
        ...data,
        title: String(TITLE_TO_ID[data.title] || data.title),
        email: data.email,
        mobile: data.mobile,
        experience: data.experience ? Number(data.experience) : 0,
        aadhar_number: data.aadhar_number,
        bos_id: isEdit ? Number(id) : 0,
      };

      if (isEdit && id) {
        await updateBos(Number(id), payload);
        toast.success("BoS member updated successfully");
      } else {
        await axiosInstance.post(`${API}/create`, payload, {
          withCredentials: false,
        });
        toast.success("BoS member created successfully");
      }

      handleListRedirect();
    } catch (err: any) {
      console.error(err);
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to save member";
      toast.error(errorMsg);
    }
  };

  // --- RENDER ---
  return (
    <div className="">
      <h3 className="text-lg leading-6 font-medium pb-5">
        {isEdit ? "Edit" : "Add New"} Board of Studies (BoS) Member
      </h3>

      <div className="bg-white p-6 shadow-md rounded-md border border-gray-200">
        <form
          onSubmit={handleSubmit(onSubmit, () =>
            toast.warning("Please fill all required fields correctly."),
          )}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Faculty Type: <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("faculty_type")}
                  className={`border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${errors.faculty_type ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                >
                  <option value="">Select Faculty Type</option>
                  {FACULTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.faculty_type && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.faculty_type.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Title: <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("title")}
                  className={`border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${errors.title ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                >
                  <option value="">Select Title</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
                {errors.title && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.title.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  First Name: <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("first_name")}
                  placeholder="Enter First Name"
                  className={`border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${errors.first_name ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                />
                {errors.first_name && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.first_name.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Middle Name:
                </label>
                <input
                  {...register("middle_name")}
                  placeholder="Enter Middle Name"
                  className="border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Last Name:
                </label>
                <input
                  {...register("last_name")}
                  placeholder="Enter Last Name"
                  className="border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Organization: <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("organization")}
                  placeholder="Enter Organization Name"
                  className={`border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${errors.organization ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                />
                {errors.organization && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.organization.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Email Id: <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("email")}
                  placeholder="Enter User Email"
                  className={`border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${errors.email ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                />
                {errors.email && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </span>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Contact Number:
                </label>
                <input
                  {...register("mobile")}
                  maxLength={10}
                  placeholder="Enter Contact Number"
                  className={`border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${errors.mobile ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                />
                {errors.mobile && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.mobile.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Aadhaar Number:
                </label>
                <input
                  {...register("aadhar_number")}
                  maxLength={12}
                  placeholder="Enter Aadhaar Number"
                  className={`border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${errors.aadhar_number ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                />
                {errors.aadhar_number && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.aadhar_number.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Highest Qualification:
                </label>
                <input
                  {...register("highest_qualification")}
                  placeholder="Enter User Qualification"
                  className="border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Experience (In Years):
                </label>
                <input
                  type="number"
                  {...register("experience")}
                  placeholder="Enter User Experience"
                  className="border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Password:
                </label>
                <div className="flex space-x-2">
                  <input
                    {...register("password")}
                    readOnly={false}
                    className={`border rounded p-2 text-sm flex-1 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="bg-orange-400 text-white p-2 rounded hover:bg-orange-500 transition-colors"
                    title="Generate Password"
                  >
                    <FaSync />
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Designation: <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("designation")}
                  className={`border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${errors.designation ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                >
                  <option value="">Select Designation</option>
                  {designations.map((des) => (
                    <option key={des.designation_id} value={des.designation_id}>
                      {des.designation_name}
                    </option>
                  ))}
                </select>
                {errors.designation && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.designation.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  BoS for: <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("bos_for")}
                  className={`border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${errors.bos_for ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                >
                  <option value="">Select School</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.dept_name}>
                      {dept.dept_name}
                    </option>
                  ))}
                </select>
                {errors.bos_for && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.bos_for.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-4 text-sm rounded-md flex items-center gap-2 button-bg text-white hover:opacity-90 disabled:opacity-50"
            >
              <FaSave /> {isEdit ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                reset(defaultValues, { keepValues: false, keepDirty: false });
              }}
              className="h-10 px-4 text-sm rounded-md flex items-center gap-2 panel-bg-1 main-page-text-color hover:opacity-80 border border-[#437880]"
            >
              <FaSync /> Reset
            </button>
            <button
              type="button"
              className="h-10 px-4 text-sm rounded-md flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
              onClick={() => handleListRedirect()}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewMember;
