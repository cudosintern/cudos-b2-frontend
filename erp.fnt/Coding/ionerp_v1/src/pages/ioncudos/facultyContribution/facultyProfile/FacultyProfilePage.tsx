import React, { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, Upload } from "lucide-react";
import { useFacultyProfile } from "./useFacultyProfile";
import "./FacultyProfilePage.css";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { Calendar } from "lucide-react";
import { forwardRef } from "react";
import { toast } from "react-toastify";
// import { saveDesignation } from "./facultyProfileApi";
import {
  saveDesignation,
  getUserDesignationList,
  getPhdGuidanceList,
  savePhdGuidance,
  getQualificationList,
  saveQualification,
  getQualificationUploadList,
  uploadQualificationFile,
  deleteQualificationUpload,
  updateQualificationUpload,
} from "./facultyProfileApi";
const btnSave =
  "px-4 py-2 rounded text-white text-sm bg-[#4f7f82] hover:bg-[#3f676a]";

const btnCancel =
  "px-4 py-2 rounded text-white text-sm bg-red-600 hover:bg-red-700";
type Department = {
  id: number;
  name: string;
};

type Designation = {
  id: number;
  name: string;
};
const Input = React.memo(({ error, ...props }: any) => (
  <div>
    <input
      {...props}
      className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2
      ${error ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
));

const Select = React.memo(({ error, ...props }: any) => (
  <div>
    <select
      {...props}
      className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2
      ${error ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
));

const TextArea = React.memo(({ error, ...props }: any) => (
  <div>
    <textarea
      {...props}
      className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2
      ${error ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
));
const isNegative = (value: any) => {
  return value !== "" && Number(value) < 0;
};

const isInvalidNumber = (value: any) => {
  return value !== "" && (isNaN(value) || Number(value) < 0);
};
const FacultyProfilePage: React.FC = () => {
  const qualificationFormRef = useRef<HTMLDivElement | null>(null);
  const designationFormRef = useRef<HTMLDivElement | null>(null);
  const phdFormRef = useRef<HTMLDivElement | null>(null);
  const [designationSearch, setDesignationSearch] = useState("");
  const YearInput = forwardRef<HTMLInputElement, any>(
    ({ value, onClick }, ref) => (
      <div className="flex">
        <input
          ref={ref}
          value={value || ""}
          onClick={onClick}
          readOnly
          placeholder="Select Year"
          className="w-full px-3 py-2 border rounded-l text-sm cursor-pointer"
        />
        <span
          onClick={onClick}
          className="flex items-center px-3 border border-l-0 rounded-r bg-gray-100 cursor-pointer"
        >
          <Calendar size={16} />
        </span>
      </div>
    ),
  );
  const [designationEntries, setDesignationEntries] = useState(10);
  const validateForm = () => {
    let newErrors: any = {};

    // REQUIRED
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.faculty_type)
      newErrors.faculty_type = "Faculty type is required";
    if (!formData.doj) newErrors.doj = "Date of joining is required";
    if (!formData.faculty_serving)
      newErrors.faculty_serving = "Faculty serving is required";
    if (!formData.designation)
      newErrors.designation = "Designation is required";
    if (!formData.total_exp)
      newErrors.total_exp = "Total experience is required";
    if (!formData.highest_qualification)
      newErrors.highest_qualification = "Qualification is required";

    // NUMBER VALIDATION
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Enter valid 10-digit mobile number";
    }

    if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar)) {
      newErrors.aadhaar = "Aadhaar must be 12 digits";
    }

    // 🔥 GENERIC NEGATIVE CHECK
    const numericFields = [
      "total_exp",
      "teaching_exp",
      "industrial_exp",
      "salary",
      "phd_inside_count",
      "phd_outside_count",
    ];

    numericFields.forEach((field) => {
      if (isNegative(formData[field])) {
        newErrors[field] = "Value cannot be negative";
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };
  const [editableFiles, setEditableFiles] = useState<any[]>([]);
  const handleFinalSave = () => {
    if (!validateForm()) return;

    handleSave(); // existing API call
  };
  // ================= ADD THESE STATES TOP OF COMPONENT =================
  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);
  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const handleResetPhd = () => {
    setPhdForm({
      year: "",
      candidate_name: "",
      university_name: "",
      phd_topic: "",
      status: "",
    });

    setPhdEditId(null);
    setPhdErrors({});
  };
  const handleResetQualification = () => {
    setQualificationForm({
      degree: "",
      specialization: "",
      university: "",
      year: "",
    });

    setQualificationEditId(null);
    setQualificationErrors({});
  };
  const handleResetDesignation = () => {
    setSelectedDept("");
    setSelectedDesignation("");
    setSelectedYear("");

    setEditMode(false);
    setEditId(null);
    setDesignationErrors({});
  };

  // ================= LOAD TABLE DATA FROM BACKEND =================
  const fetchUploadedFiles = async (qualificationId: number) => {
    try {
      const res = await getQualificationUploadList(qualificationId);

      console.log("UPLOAD LIST:", res); // optional debug

      // ✅ FIXED CONDITION
      if (res?.status === true) {
        setUploadedFiles(res.data || []);
      } else {
        setUploadedFiles([]);
      }
    } catch (err) {
      console.error(err);
      setUploadedFiles([]); // ✅ good practice
    }
  };
  const loadUploadedFiles = async (id?: number) => {
    if (!id) return;

    try {
      const data = await getQualificationUploadList(id);

      console.log("UPLOAD LIST API RESPONSE:", data);

      // ✅ FIX HERE
      if (data?.status === true) {
        setUploadedFiles(data.data || []);
        setEditableFiles(data.data || []);
      } else {
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error(error);
      setUploadedFiles([]);
    }
  };
  const handleUploadFile = async (file: File) => {
    if (!uploadQualId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", String(manualUserId));
    formData.append("qualification_id", String(uploadQualId));

    const res = await uploadQualificationFile(formData);

    if (res?.status === "success") {
      toast.success("Uploaded Successfully");

      // ✅ IMPORTANT: reload table immediately
      await loadUploadedFiles(uploadQualId);

      setUploadFile(null); // optional
    }
  };

  // ================= SAVE BUTTON FUNCTION =================
  const handleSaveUploadedFiles = async () => {
    try {
      for (let file of editableFiles) {
        const formData = new FormData();
        formData.append("description", file.description || "");
        formData.append("actual_date", file.actual_date || "");

        await updateQualificationUpload(file.id, formData);
      }

      toast.success("Updated Successfully");

      if (uploadQualId) {
        await loadUploadedFiles(uploadQualId);
      }
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };
  const [qualificationErrors, setQualificationErrors] = useState<any>({});
  const validateQualification = () => {
    let err: any = {};

    if (!qualificationForm.degree) err.degree = "Degree required";
    if (!qualificationForm.specialization)
      err.specialization = "Specialization required";
    if (!qualificationForm.university) err.university = "University required";
    if (!qualificationForm.year) err.year = "Year required";

    setQualificationErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleSaveQualificationWrapped = () => {
    if (!validateQualification()) return;

    handleSaveQualification();
  };
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadQualId, setUploadQualId] = useState<number | null>(null);
  const [showQualDeleteModal, setShowQualDeleteModal] = useState(false);
  const [qualDeleteId, setQualDeleteId] = useState<number | null>(null);
  const confirmUploadDelete = async () => {
    if (!uploadDeleteId) return;

    const res = await deleteQualificationUpload(uploadDeleteId);

    if (res?.status || res?.success) {
      toast.success("Deleted Successfully");

      if (uploadQualId) {
        await loadUploadedFiles(uploadQualId);
      }
    } else {
      toast.error(res?.message || "Delete failed");
    }

    setShowUploadDeleteModal(false);
    setUploadDeleteId(null);
  };
  // ================= WHEN OPEN MODAL =================
  useEffect(() => {
    if (uploadQualId) {
      loadUploadedFiles(uploadQualId);
    }
  }, [uploadQualId]);

  const [showPhdDeleteModal, setShowPhdDeleteModal] = useState(false);
  const [phdDeleteId, setPhdDeleteId] = useState<number | null>(null);
  const confirmQualificationDelete = async () => {
    if (!qualDeleteId) return;

    const success = await handleDeleteQualification(qualDeleteId);

    if (success) {
      setShowQualDeleteModal(false);
      setQualDeleteId(null);
    }
  };
  const confirmPhdDelete = async () => {
    if (!phdDeleteId) return;

    const success = await handleDeletePhd(phdDeleteId);

    if (success) {
      setShowPhdDeleteModal(false);
      setPhdDeleteId(null);
    }
  };
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const handleEdit = (row: any) => {
    console.log("ROW:", row);

    // ✅ find department ID from name
    const dept = departmentList.find(
      (d: any) => d.name === row.department_name || d.name === row.dept_id,
    );

    setEditId(row.id);

    setSelectedDept(dept ? String(dept.id) : ""); // ✅ FIXED
    setSelectedDesignation(String(row.designation_id));
    setSelectedYear(String(row.year));

    setEditMode(true);
  };
  const handleSaveDesignation = async () => {
    try {
      let data;

      if (editMode && editId) {
        // ✅ UPDATE
        const res = await fetch(
          `http://localhost:8000/faculty-profile/designation/update/${editId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: manualUserId,
              dept_id: selectedDept,
              designation: selectedDesignation,
              year: selectedYear,
            }),
          },
        );

        data = await res.json(); // ✅ only here
      } else {
        // ✅ INSERT
        data = await saveDesignation({
          user_id: manualUserId,
          dept_id: selectedDept,
          designation: selectedDesignation,
          year: selectedYear,
        });
      }

      console.log("FINAL DATA:", data); // 🔥 DEBUG

      if (data?.status || data?.success) {
        toast.success(editMode ? "Updated Successfully" : "Saved Successfully");

        setEditMode(false);
        setEditId(null);
        setSelectedDept("");
        setSelectedDesignation("");
        setSelectedYear("");

        const refreshed = await getUserDesignationList(manualUserId);

        const mapped = (refreshed?.data || []).map((item: any) => {
          const dept = departmentList.find(
            (d: any) =>
              d.id == item.dept_id ||
              d.id == item.department ||
              d.id == item.department_id,
          );

          const desig = designationList.find(
            (d: any) => d.id == item.designation || d.id == item.designation_id,
          );

          return {
            ...item,
            id: item.id,
            dept_id: item.dept_id || item.department_id || item.department,
            designation_id: item.designation_id || item.designation,
            department_name:
              item.department_name || dept?.name || item.department || "",
            designation_name: item.designation_name || desig?.name || "",
            year: item.year,
          };
        });

        setDesignationTable(mapped);
      } else {
        toast.error(data?.message || "Failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong"); // ✅ also needed
    }
  };
  const handleEditPhd = (row: any) => {
    setPhdEditId(row.id);

    setPhdForm({
      year: row.year || "",
      candidate_name: row.candidate_name || "",
      university_name: row.university_name || "",
      phd_topic: row.phd_topic || "",
      status: row.status || "",
    });
  };

  const handleDeletePhd = async (id: number) => {
    try {
      const res = await fetch(
        `http://localhost:8000/faculty-profile/phd-guidance/delete/${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      if (data?.status || data?.success) {
        toast.success("Deleted Successfully");
        loadPhd();
        return true;
      } else {
        toast.error(data?.message || "Delete failed");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
      return false;
    }
  };
  const handleDeleteClick = (row: any) => {
    setDeleteId(row.id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    const res = await fetch(
      `http://localhost:8000/faculty-profile/designation/delete/${deleteId}`,
      { method: "DELETE" },
    );

    const data = await res.json();

    if (data.status) {
      toast.success("Deleted Successfully");
      setShowDeleteModal(false);
      setDeleteId(null);

      // 🔥 refresh table
      const refreshed = await getUserDesignationList(manualUserId);

      const mapped = (refreshed?.data || []).map((item: any) => {
        const dept = departmentList.find(
          (d: any) =>
            d.id == item.dept_id ||
            d.id == item.department ||
            d.id == item.department_id,
        );

        const desig = designationList.find(
          (d: any) => d.id == item.designation || d.id == item.designation_id,
        );

        return {
          ...item,

          id: item.id,

          dept_id: item.dept_id || item.department_id || item.department,

          designation_id: item.designation_id || item.designation,

          department_name:
            item.department_name || dept?.name || item.department || "",

          designation_name: item.designation_name || desig?.name || "",

          year: item.year,
        };
      });

      setDesignationTable(mapped);
    } else {
      toast.error(data.message || "Delete Failed");
    }
  };
  const handleEditQualification = (row: any) => {
    setQualificationEditId(row.id);
    setQualificationForm({
      degree: row.degree,
      specialization: row.specialization,
      university: row.university,
      year: row.year,
    });
  };

  const handleDeleteQualification = async (id: number) => {
    try {
      const res = await fetch(
        `http://localhost:8000/faculty-profile/qualification/delete/${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      if (data?.status || data?.success) {
        toast.success("Deleted Successfully");

        await loadQualification();

        return true;
      } else {
        toast.error(data?.message || "Delete failed");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
      return false;
    }
  };
  const loadPhd = async () => {
    const res = await getPhdGuidanceList(manualUserId);
    setPhdTable(res.data || []);
  };

  const handleSavePhd = async () => {
    try {
      let data;

      if (phdEditId) {
        // UPDATE
        const res = await fetch(
          `http://localhost:8000/faculty-profile/phd-guidance/update/${phdEditId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: manualUserId,
              ...phdForm,
            }),
          },
        );

        data = await res.json(); // ✅ required
      } else {
        // INSERT
        data = await savePhdGuidance({
          user_id: manualUserId,
          ...phdForm,
        });
      }

      console.log("PHD RESPONSE:", data);

      if (data?.status || data?.success) {
        toast.success(
          phdEditId ? "Updated Successfully" : "Saved Successfully",
        );

        await loadPhd(); // refresh after success

        setPhdForm({
          year: "",
          candidate_name: "",
          university_name: "",
          phd_topic: "",
          status: "",
        });

        setPhdEditId(null);
      } else {
        toast.error(data?.message || "Failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };
  const [phdErrors, setPhdErrors] = useState<any>({});

  const validatePhd = () => {
    let err: any = {};

    if (!phdForm.year) err.year = "Year required";
    if (!phdForm.candidate_name) err.candidate_name = "Candidate name required";
    if (!phdForm.university_name) err.university_name = "University required";
    if (!phdForm.phd_topic) err.phd_topic = "Topic required";
    if (!phdForm.status) err.status = "Status required";

    setPhdErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleSavePhdWrapped = () => {
    if (!validatePhd()) return;

    handleSavePhd();
  };
  const [designationErrors, setDesignationErrors] = useState<any>({});

  const validateDesignation = () => {
    let err: any = {};

    if (!selectedDept) err.dept = "Department required";
    if (!selectedDesignation) err.designation = "Designation required";
    if (!selectedYear) err.year = "Year required";

    setDesignationErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleSaveDesignationWrapped = async () => {
    console.log("SAVE CLICKED");

    if (!validateDesignation()) {
      console.log("VALIDATION FAILED");
      return;
    }

    console.log("VALIDATION PASSED");

    await handleSaveDesignation();
  };
  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));

    // 🔥 clear error instantly
    setErrors((prev: any) => ({
      ...prev,
      [name]: "",
    }));
  };
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const [showPhdModal, setShowPhdModal] = useState(false);
  const [phdTable, setPhdTable] = useState<any[]>([]);
  const [phdEditId, setPhdEditId] = useState<number | null>(null);

  const [phdForm, setPhdForm] = useState({
    year: "",
    candidate_name: "",
    university_name: "",
    phd_topic: "",
    status: "",
  });
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [openQualificationTable, setOpenQualificationTable] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openMain, setOpenMain] = useState(true);
  const [openPersonal, setOpenPersonal] = useState(true);
  const [openProfessional, setOpenProfessional] = useState(true);
  // ✅ CORRECT HOOK USAGE
  const manualUserId = 1; // temporary
  const deptId = 71; // temporary

  const {
    formData,
    setFormData,
    handleSave,
    dropdowns,
    designationList,
    errors,
    setErrors,
    facultyMode,
    setFacultyMode,
    profileImage,
    setProfileImage,
    handleImageUpload,
    departmentList,
    designationTable,
    setDesignationTable,
    editId,
    setEditId,
    deleteId,
    setDeleteId,
    showDeleteModal,
    setShowDeleteModal,
    qualificationTable,
    qualificationForm,
    setQualificationForm,
    qualificationEditId,
    setQualificationEditId,
    handleSaveQualification,
    loadQualification,
  } = useFacultyProfile(deptId, manualUserId);
  const isLocked = !!formData.email && !!formData.total_exp;
  const filteredDesignationTable = (designationTable || [])
    .filter(
      (row: any) =>
        row.department_name
          ?.toLowerCase()
          .includes(designationSearch.toLowerCase()) ||
        row.designation_name
          ?.toLowerCase()
          .includes(designationSearch.toLowerCase()) ||
        String(row.year)?.includes(designationSearch),
    )
    .slice(0, designationEntries);
  return (
    <div className="w-full min-h-screen p-6">
      <h3 className="text-lg font-semibold pb-5 text-[#437880]">
        Faculty Profile
      </h3>
      {/* PROFILE PHOTO */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">
          Upload your profile photo:
        </label>

        {/* Preview Box (CLICKABLE) */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-[160px] h-[140px] border bg-gray-100 flex items-center justify-center text-sm overflow-hidden cursor-pointer hover:border-[#437880]"
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            "Preview"
          )}
        </div>

        {/* Hidden Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // instant preview
            setProfileImage(URL.createObjectURL(file));

            // upload to backend
            handleImageUpload(file);
          }}
        />

        {/* Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[#437880] text-sm mt-2 hover:underline"
        >
          Change profile
        </button>
      </div>

      {/* MAIN SECTION */}
      <div className="border rounded bg-white">
        {/* Employee Details Header */}
        <div
          className="px-4 py-3 cursor-pointer flex items-center gap-2 border-b"
          onClick={() => setOpenMain(!openMain)}
        >
          <span>{openMain ? "▼" : "▶"}</span>
          <h3 className="font-semibold text-[#437880]">Employee Details</h3>
        </div>

        {openMain && (
          <div className="p-4">
            {/* PERSONAL DETAILS */}
            <div className="border rounded mb-6">
              <div
                className="px-4 py-2 cursor-pointer flex items-center gap-2 bg-gray-50"
                onClick={() => setOpenPersonal(!openPersonal)}
              >
                <span>{openPersonal ? "▼" : "▶"}</span>
                <h4 className="text-[#437880] font-semibold">
                  Personal Details:
                </h4>
              </div>

              {openPersonal && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label>
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Select
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      error={errors.title}
                    >
                      <option value="">Select Title</option>
                      {dropdowns[50]?.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label>
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      error={errors.first_name}
                    />
                  </div>

                  <div>
                    <label>
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      error={errors.last_name}
                    />
                  </div>

                  <div>
                    <label>
                      Email Id <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      disabled={isLocked}
                    />
                  </div>

                  <div>
                    <label>Contact Number</label>
                    <Input
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      error={errors.mobile}
                    />
                  </div>

                  <div>
                    <label>Aadhaar Number</label>
                    <Input
                      name="aadhaar"
                      value={formData.aadhaar}
                      onChange={handleChange}
                      error={errors.aadhaar}
                    />
                  </div>

                  <div>
                    <label>Present Address</label>
                    <TextArea
                      name="present_address"
                      value={formData.present_address}
                      onChange={handleChange}
                      error={errors.present_address}
                    />
                  </div>

                  <div>
                    <label>Permanent Address</label>
                    <TextArea
                      name="permanent_address"
                      value={formData.permanent_address}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label>Website</label>
                    <Input
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label>
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      error={errors.dob}
                    />
                  </div>

                  <div>
                    <label>Blood Group</label>
                    <Select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* PROFESSIONAL DETAILS */}
            <div className="border rounded">
              <div
                className="px-4 py-2 cursor-pointer flex items-center gap-2 bg-gray-50"
                onClick={() => setOpenProfessional(!openProfessional)}
              >
                <span>{openProfessional ? "▼" : "▶"}</span>
                <h4 className="text-[#437880] font-semibold">
                  Professional Details:
                </h4>
              </div>

              {openProfessional && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label>Employee No</label>
                    <Input
                      name="employee_no"
                      value={formData.employee_no}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label>Faculty Type </label>
                    <Select
                      name="faculty_type"
                      value={formData.faculty_type}
                      onChange={handleChange}
                      error={errors.faculty_type}
                    >
                      <option value="">Select Faculty Type</option>
                      {dropdowns[19]?.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label>
                      Date of Joining <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      name="doj"
                      value={formData.doj}
                      onChange={handleChange}
                      max={formData.relieving_date || undefined}
                    />
                  </div>

                  <div>
                    <label>Relieving Date</label>
                    <Input
                      type="date"
                      name="relieving_date"
                      value={formData.relieving_date}
                      onChange={handleChange}
                      min={formData.doj || undefined} // 🔥 blocks invalid selection
                    />
                  </div>

                  <div>
                    <label>Teaching Experience</label>
                    <Input
                      type="number"
                      name="teaching_exp"
                      value={formData.teaching_exp}
                      onChange={handleChange}
                      error={errors.teaching_exp}
                    />
                  </div>

                  <div>
                    <label>Industrial Experience</label>
                    <Input
                      type="number"
                      name="industrial_exp"
                      value={formData.industrial_exp}
                      onChange={handleChange}
                      error={errors.industrial_exp}
                    />
                  </div>

                  <div>
                    <label>
                      Faculty Serving <span className="text-red-500">*</span>
                    </label>
                    <Select
                      name="faculty_serving"
                      value={formData.faculty_serving}
                      onChange={handleChange}
                      error={errors.faculty_serving}
                    >
                      <option value="">Select Faculty Serving</option>
                      {dropdowns[17]?.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label>Last Promotion</label>

                    <DatePicker
                      selected={
                        formData.last_promotion
                          ? new Date(formData.last_promotion)
                          : null
                      }
                      onChange={(date: Date | null) => {
                        const year = date ? date.getFullYear() : "";

                        setFormData({
                          ...formData,
                          // Backend format: YYYY-01-01
                          last_promotion: year ? `${year}-01-01` : "",
                        });
                      }}
                      showYearPicker
                      dateFormat="yyyy"
                      customInput={<YearInput />}
                      yearItemNumber={12}
                      popperPlacement="bottom-start"
                    />
                  </div>

                  <div>
                    <label>Remarks</label>
                    <TextArea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label>Responsibilities</label>
                    <TextArea
                      name="responsibilities"
                      value={formData.responsibilities}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label>
                      Current Designation{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      error={errors.designation}
                    >
                      <option value="">Select Designation</option>
                      {(designationList || []).map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                    <p
                      className="text-blue-600 text-sm cursor-pointer hover:underline mt-1"
                      onClick={() => setShowDesignationModal(true)}
                    >
                      Manage Designation List
                    </p>
                  </div>
                  <div className="flex items-center gap-3 relative w-full">
                    {/* Input */}
                    <div className="flex-1">
                      <label>
                        Total Experience <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        name="total_exp"
                        value={formData.total_exp}
                        onChange={handleChange}
                        error={errors.total_exp}
                        disabled={isLocked}
                      />
                    </div>

                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      className="peer mt-6"
                      checked={facultyMode === 1}
                      onChange={(e) => setFacultyMode(e.target.checked ? 1 : 0)}
                    />

                    {/* FULL WIDTH TOOLTIP */}
                    <div className="absolute left-0 top-full mt-2 hidden peer-hover:block w-full bg-[#fdf6e3] text-black text-xs p-3 rounded shadow-lg z-50">
                      An employee on contract for a period of not less than two
                      years and drawing consolidated salary not less than
                      applicable gross salary shall only be counted as a regular
                      employee.
                    </div>
                  </div>
                  <div>
                    <label>Retirement Date</label>
                    <Input
                      type="date"
                      name="retirement_date"
                      value={formData.retirement_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label>Salary Pay (₹)</label>
                    <Input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      error={errors.salary}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* ================= QUALIFICATION DETAILS ================= */}
            <div className="border rounded mt-6">
              <div className="px-4 py-2 bg-gray-50">
                <h4 className="text-[#437880] font-semibold">
                  Qualification Details:
                </h4>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label>
                    Highest Qualification{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Select
                    name="highest_qualification"
                    value={formData.highest_qualification}
                    onChange={handleChange}
                    error={errors.highest_qualification}
                  >
                    <option value="">Select Qualification</option>
                    {dropdowns[10]?.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label>Research Interest</label>
                  <TextArea
                    name="research_interest"
                    value={formData.research_interest}
                    onChange={handleChange}
                    placeholder="Enter Research Interest"
                  />
                </div>

                <div>
                  <label>Specialization</label>
                  <TextArea
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="Enter Specialization"
                  />
                </div>

                <div>
                  <label>Skills</label>
                  <TextArea
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="Enter Skills"
                  />
                </div>
              </div>
            </div>

            {/* ================= PhD DETAILS ================= */}
            <div className="border rounded mt-6">
              <div className="px-4 py-2 bg-gray-50">
                <h4 className="text-[#437880] font-semibold">Ph.D Details:</h4>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label>Name of University</label>
                  <Input
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    placeholder="Enter Name of University"
                  />
                </div>

                <div>
                  <label>Year of Registration</label>

                  <DatePicker
                    selected={
                      formData.phd_registration_year
                        ? new Date(Number(formData.phd_registration_year), 0)
                        : null
                    }
                    onChange={(date: Date | null) =>
                      setFormData({
                        ...formData,
                        phd_registration_year: date
                          ? date.getFullYear().toString()
                          : "",
                      })
                    }
                    showYearPicker
                    dateFormat="yyyy"
                    customInput={<YearInput />}
                    yearItemNumber={12}
                    popperPlacement="bottom-start"
                  />
                </div>

                <div>
                  <label>Supervisor(s)</label>
                  <Input
                    name="phd_supervisor"
                    value={formData.phd_supervisor}
                    onChange={handleChange}
                    placeholder="Enter Supervisor(s)"
                  />
                </div>

                <div>
                  <label>Topic on Ph.D</label>
                  <Input
                    name="phd_topic"
                    value={formData.phd_topic}
                    onChange={handleChange}
                    placeholder="Enter Topic on Ph.D"
                  />
                </div>

                <div>
                  <label>URL</label>
                  <Input
                    name="phd_url"
                    value={formData.phd_url}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label>Ph.D during assessment year</label>

                  <DatePicker
                    selected={
                      formData.phd_year
                        ? new Date(Number(formData.phd_year), 0)
                        : null
                    }
                    onChange={(date: Date | null) =>
                      setFormData({
                        ...formData,
                        phd_year: date ? date.getFullYear().toString() : "",
                      })
                    }
                    showYearPicker
                    dateFormat="yyyy"
                    customInput={<YearInput />}
                    yearItemNumber={12}
                    popperPlacement="bottom-start"
                  />
                </div>

                <div>
                  {/* Ph.D Status */}
                  <div className="w-[260px]">
                    <label>Ph.D Status</label>

                    <Select
                      name="phd_status"
                      value={formData.phd_status || ""}
                      onChange={handleChange}
                    >
                      <option value="">Select Status</option>

                      {(dropdowns?.[56] || []).map((item: any) => (
                        <option key={item.id} value={String(item.id)}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Guidance Line */}
                  <div className="mt-3">
                    {/* FIRST ROW (your existing grid) */}
                    <div className="grid grid-cols-[auto_auto_80px_auto_80px] items-center gap-x-2">
                      <span className="font-semibold whitespace-nowrap">
                        Ph.D Guidance Details:
                      </span>

                      <span className="whitespace-nowrap">
                        Candidate(s) within organization:
                      </span>

                      <Input
                        type="number"
                        name="phd_inside_count"
                        value={formData.phd_inside_count}
                        onChange={handleChange}
                        error={errors.phd_inside_count}
                        className="w-[70px]"
                      />

                      <span className="whitespace-nowrap">
                        Candidate(s) outside organization:
                      </span>

                      <Input
                        type="number"
                        name="phd_outside_count"
                        value={formData.phd_outside_count}
                        onChange={handleChange}
                        error={errors.phd_outside_count}
                        className="w-[70px]"
                      />
                    </div>

                    {/* SECOND ROW (link below) */}
                    <div className="mt-1">
                      <span
                        className="text-blue-600 cursor-pointer hover:underline whitespace-nowrap"
                        onClick={() => {
                          setShowPhdModal(true);
                          loadPhd();
                        }}
                      >
                        Add PhD guidance details
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                className={btnSave}
                onClick={() => handleFinalSave()}
              >
                Save
              </button>
            </div>
            {/* ================= QUALIFICATION TABLE ================= */}
            <div className="border rounded mt-6">
              {/* HEADER */}
              <div
                className="px-4 py-2 bg-gray-50 flex items-center gap-2 cursor-pointer"
                onClick={() =>
                  setOpenQualificationTable(!openQualificationTable)
                }
              >
                <span>{openQualificationTable ? "▼" : "▶"}</span>
                <h4 className="text-[#437880] font-semibold">
                  Qualification Details
                </h4>
              </div>

              {/* COLLAPSIBLE CONTENT */}
              {openQualificationTable && (
                <>
                  <div className="p-4">
                    {/* TABLE */}
                    <table className="w-full border text-sm mb-4">
                      <thead className="bg-[#f3f3f3]">
                        <tr>
                          <th className="border p-2">Sl No.</th>
                          <th className="border p-2">Qualification</th>
                          <th className="border p-2">University</th>
                          <th className="border p-2">Year</th>
                          <th className="border p-2 text-center">
                            Upload
                          </th>{" "}
                          {/* NEW */}
                          <th className="border p-2 text-center">Edit</th>
                          <th className="border p-2 text-center">Delete</th>
                        </tr>
                      </thead>

                      <tbody>
                        {qualificationTable.map((row, index) => (
                          <tr key={row.id}>
                            <td className="border p-2">{index + 1}</td>
                            <td className="border p-2">{row.degree_name}</td>
                            <td className="border p-2">{row.university}</td>

                            {/* YEAR ONLY */}
                            <td className="border p-2">{row.year || ""}</td>

                            {/* UPLOAD ICON */}
                            <td className="border p-2 text-center">
                              <button
                                onClick={async () => {
                                  setUploadQualId(row.id);
                                  setShowUploadModal(true);
                                  await loadUploadedFiles(row.id);
                                }}
                                className="flex items-center gap-1 text-[#4f7f82] hover:underline"
                              >
                                <Upload size={16} />
                                Upload
                              </button>
                            </td>

                            {/* EDIT ICON */}
                            <td className="border p-2 text-center">
                              <button
                                onClick={() => {
                                  handleEditQualification(row);

                                  setTimeout(() => {
                                    qualificationFormRef.current?.scrollIntoView(
                                      {
                                        behavior: "smooth",
                                        block: "start",
                                      },
                                    );
                                  }, 100);
                                }}
                                className="text-yellow-600 hover:text-yellow-800"
                              >
                                <Pencil size={16} />
                              </button>
                            </td>

                            {/* DELETE ICON */}
                            <td className="border p-2 text-center">
                              <button
                                onClick={() => {
                                  setQualDeleteId(row.id);
                                  setShowQualDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2
                                  size={18}
                                  className="text-red-600 hover:text-red-700"
                                />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* ADD FORM */}
                    <div
                      ref={qualificationFormRef}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4"
                    >
                      {/* Degree */}
                      <div>
                        <label>
                          Degree <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={qualificationForm.degree}
                          error={qualificationErrors.degree}
                          onChange={(e: any) =>
                            setQualificationForm({
                              ...qualificationForm,
                              degree: e.target.value,
                            })
                          }
                        >
                          <option value="">Select Degree</option>
                          {dropdowns[10]?.map((item: any) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Specialization */}
                      <div>
                        <label>
                          Specialization <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={qualificationForm.specialization}
                          error={qualificationErrors.specialization}
                          onChange={(e: any) =>
                            setQualificationForm({
                              ...qualificationForm,
                              specialization: e.target.value,
                            })
                          }
                          placeholder="Enter Specialization"
                        />
                      </div>

                      {/* University */}
                      <div>
                        <label>
                          University <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="Enter University"
                          value={qualificationForm.university}
                          error={qualificationErrors.university}
                          onChange={(e: any) =>
                            setQualificationForm({
                              ...qualificationForm,
                              university: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* Year */}
                      <div>
                        <label>
                          Year of Graduation:
                          <span className="text-red-500">*</span>
                        </label>

                        <DatePicker
                          selected={
                            qualificationForm.year
                              ? new Date(Number(qualificationForm.year), 0)
                              : null
                          }
                          onChange={(date: Date | null) =>
                            setQualificationForm({
                              ...qualificationForm,
                              year: date ? date.getFullYear().toString() : "",
                            })
                          }
                          showYearPicker
                          dateFormat="yyyy"
                          customInput={<YearInput />}
                          yearItemNumber={12}
                          portalId="root-portal"
                          popperPlacement="bottom-start"
                        />

                        {qualificationErrors.year && (
                          <p className="text-red-500 text-sm mt-1">
                            {qualificationErrors.year}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex justify-end gap-3 mt-4 mb-6 pr-6">
                    <button
                      type="button"
                      onClick={handleSaveQualificationWrapped}
                      className={btnSave}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={handleResetQualification}
                      className="px-4 py-2 text-sm rounded bg-amber-600 text-white hover:bg-amber-500"
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}
            </div>
            {showDesignationModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                {/* MODAL CONTAINER */}
                <div className="bg-white w-[95%] max-w-5xl rounded-lg shadow-xl flex flex-col max-h-[90vh]">
                  {/* HEADER */}
                  <div className="px-5 py-3 flex justify-between items-center border-b">
                    <h3 className="text-lg font-semibold text-[#437880]">
                      User Designation List
                    </h3>
                    <button onClick={() => setShowDesignationModal(false)}>
                      ✖
                    </button>
                  </div>

                  {/* BODY (SCROLL HERE ONLY) */}
                  <div className="p-4 overflow-y-auto flex-1">
                    <p className="mb-3">
                      Current Designation:{" "}
                      <b>
                        {designationList.find(
                          (d: any) => d.id == formData.designation,
                        )?.name || "-"}
                      </b>
                    </p>

                    {/* TABLE */}
                    <div className="flex justify-between items-center mb-3 text-sm">
                      <div>
                        Show
                        <select
                          className="mx-2 border px-2 py-1 rounded"
                          value={designationEntries}
                          onChange={(e) =>
                            setDesignationEntries(Number(e.target.value))
                          }
                        >
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                          <option value={25}>25</option>
                        </select>
                        entries
                      </div>

                      <div>
                        Search:
                        <input
                          className="ml-2 border px-2 py-1 rounded"
                          value={designationSearch}
                          onChange={(e) => setDesignationSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <table className="w-full border border-collapse text-sm mb-4">
                      <thead className="bg-[#f3f3f3]">
                        <tr>
                          <th className="border p-2">Sl No.</th>
                          <th className="border p-2">Department</th>
                          <th className="border p-2">Designation</th>
                          <th className="border p-2">Year</th>
                          <th className="border p-2">Edit</th>
                          <th className="border p-2">Delete</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredDesignationTable.map(
                          (row: any, index: number) => (
                            <tr key={row.id}>
                              <td className="border p-2">{index + 1}</td>
                              <td className="border p-2">
                                {row.department_name}
                              </td>
                              <td className="border p-2">
                                {row.designation_name}
                              </td>
                              <td className="border p-2">{row.year}</td>

                              <td className="border p-2 text-center">
                                <button
                                  onClick={() => {
                                    handleEdit(row);

                                    setTimeout(() => {
                                      designationFormRef.current?.scrollIntoView(
                                        {
                                          behavior: "smooth",
                                          block: "start",
                                        },
                                      );
                                    }, 100);
                                  }}
                                  className="text-yellow-600"
                                >
                                  <Pencil size={16} />
                                </button>
                              </td>

                              <td className="border p-2 text-center">
                                <button
                                  onClick={() => handleDeleteClick(row)}
                                  className="text-red-600"
                                >
                                  <Trash2
                                    size={18}
                                    className="text-red-600 hover:text-red-700"
                                  />
                                </button>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>

                    {/* FORM */}
                    <div
                      ref={designationFormRef}
                      className="grid grid-cols-3 gap-4"
                    >
                      {/* Department */}
                      <div>
                        <label className="block text-sm mb-1">
                          Department:<span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={selectedDept}
                          onChange={(e: any) => setSelectedDept(e.target.value)}
                          error={designationErrors.dept}
                        >
                          <option value="">Select Department</option>
                          {(departmentList || []).map((d: any) => (
                            <option key={d.id} value={String(d.id)}>
                              {d.name}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Designation */}
                      <div>
                        <label className="block text-sm mb-1">
                          Designation:<span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={selectedDesignation}
                          onChange={(e: any) =>
                            setSelectedDesignation(e.target.value)
                          }
                          error={designationErrors.designation}
                        >
                          <option value="">Select Designation</option>
                          {designationList.map((d: any) => (
                            <option key={d.id} value={String(d.id)}>
                              {d.name}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Year */}
                      <div>
                        <label className="block text-sm mb-1">
                          Year:<span className="text-red-500">*</span>
                        </label>

                        <DatePicker
                          selected={
                            selectedYear
                              ? new Date(Number(selectedYear), 0)
                              : null
                          }
                          onChange={(date: Date | null) =>
                            setSelectedYear(
                              date ? date.getFullYear().toString() : "",
                            )
                          }
                          showYearPicker
                          dateFormat="yyyy"
                          customInput={<YearInput />}
                          yearItemNumber={12}
                          popperPlacement="bottom-start"
                          /* IMPORTANT */
                          portalId="root"
                        />

                        {designationErrors.year && (
                          <p className="text-red-500 text-sm mt-1">
                            {designationErrors.year}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="flex justify-end gap-3 p-4 border-t">
                    <button
                      className={btnSave}
                      onClick={handleSaveDesignationWrapped}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleResetDesignation}
                      className="px-4 py-2 bg-amber-600 text-white rounded"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowDesignationModal(false)}
                      className="px-4 py-2 bg-red-500 text-white rounded"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showPhdModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                {/* MODAL CONTAINER */}
                <div className="bg-white w-[95%] max-w-5xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                  {/* HEADER (ALWAYS VISIBLE) */}
                  <div className="px-5 py-3 flex justify-between items-center border-b">
                    <h3 className="text-lg font-semibold text-[#437880]">
                      PhD guidance data
                    </h3>
                    <button
                      onClick={() => setShowPhdModal(false)}
                      className="text-lg"
                    >
                      ✖
                    </button>
                  </div>

                  {/* BODY (ONLY SCROLL HERE) */}
                  <div className="p-4 overflow-y-auto flex-1">
                    {/* TOP CONTROLS */}
                    <div className="flex justify-between items-center mb-3 text-sm">
                      <div>
                        Show
                        <select className="mx-2 border px-2 py-1 rounded">
                          <option>20</option>
                        </select>
                        entries
                      </div>

                      <div>
                        Search:
                        <input className="ml-2 border px-2 py-1 rounded" />
                      </div>
                    </div>

                    {/* TABLE */}
                    <table className="w-full border text-sm">
                      <thead className="bg-[#f3f3f3]  top-0 z-10">
                        <tr>
                          <th className="border p-2 text-left">Sl No.</th>
                          <th className="border p-2 text-left">
                            Candidate Name
                          </th>
                          <th className="border p-2 text-left">
                            University Name
                          </th>
                          <th className="border p-2 text-left">Topic of PhD</th>
                          <th className="border p-2 text-left">Status</th>
                          <th className="border p-2 text-center">Edit</th>
                          <th className="border p-2 text-center">Delete</th>
                        </tr>
                      </thead>

                      <tbody>
                        {phdTable.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center p-2">
                              No Data to Display
                            </td>
                          </tr>
                        ) : (
                          phdTable.map((row: any, index: number) => (
                            <tr key={row.id}>
                              <td className="border p-2">{index + 1}</td>
                              <td className="border p-2">
                                {row.candidate_name}
                              </td>
                              <td className="border p-2">
                                {row.university_name}
                              </td>
                              <td className="border p-2">{row.phd_topic}</td>
                              <td className="border p-2">
                                {dropdowns?.[56]?.find(
                                  (s: any) => s.id == row.status,
                                )?.name || "-"}
                              </td>

                              <td className="border p-2 text-center">
                                <button
                                  onClick={() => {
                                    handleEditPhd(row);

                                    setTimeout(() => {
                                      phdFormRef.current?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                      });
                                    }, 100);
                                  }}
                                >
                                  <Pencil
                                    size={16}
                                    className="text-yellow-600 hover:text-yellow-700"
                                  />
                                </button>
                              </td>

                              <td className="border p-2 text-center">
                                <button
                                  onClick={() => {
                                    setPhdDeleteId(row.id);
                                    setShowPhdDeleteModal(true);
                                  }}
                                >
                                  <Trash2
                                    size={18}
                                    className="text-red-500 hover:text-red-700"
                                  />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* FORM */}
                    <div ref={phdFormRef} className="mt-6 space-y-4">
                      {/* Year */}
                      <div className="flex items-center gap-4">
                        <label className="w-[200px]">
                          Year of Registration:
                          <span className="text-red-500">*</span>
                        </label>

                        <div className="flex">
                          <DatePicker
                            selected={
                              phdForm.year
                                ? new Date(Number(phdForm.year), 0)
                                : null
                            }
                            onChange={(date: Date | null) =>
                              setPhdForm({
                                ...phdForm,
                                year: date ? date.getFullYear().toString() : "",
                              })
                            }
                            showYearPicker
                            dateFormat="yyyy"
                            customInput={<YearInput />}
                            yearItemNumber={12}
                            popperPlacement="bottom-start"
                          />

                          {phdErrors.year && (
                            <p className="text-red-500 text-sm mt-1">
                              {phdErrors.year}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Candidate */}
                      <div className="flex items-center gap-4">
                        <label className="w-[200px]">
                          Candidate Name<span className="text-red-500">*</span>
                        </label>

                        <Input
                          placeholder="Enter Candidate Name"
                          value={phdForm.candidate_name}
                          onChange={(e: any) =>
                            setPhdForm({
                              ...phdForm,
                              candidate_name: e.target.value,
                            })
                          }
                          error={phdErrors.candidate_name}
                        />
                      </div>

                      {/* University */}
                      <div className="flex items-center gap-4">
                        <label className="w-[200px]">
                          University Name<span className="text-red-500">*</span>
                        </label>

                        <Input
                          placeholder="Enter University Name"
                          value={phdForm.university_name}
                          onChange={(e: any) =>
                            setPhdForm({
                              ...phdForm,
                              university_name: e.target.value,
                            })
                          }
                          error={phdErrors.university_name}
                        />
                      </div>

                      {/* Topic */}
                      <div className="flex items-center gap-4">
                        <label className="w-[200px]">
                          Topic of PhD<span className="text-red-500">*</span>
                        </label>

                        <Input
                          placeholder="Enter PhD Topic"
                          value={phdForm.phd_topic}
                          onChange={(e: any) =>
                            setPhdForm({
                              ...phdForm,
                              phd_topic: e.target.value,
                            })
                          }
                          error={phdErrors.phd_topic}
                        />
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-4">
                        <label className="w-[200px]">
                          Status<span className="text-red-500">*</span>
                        </label>

                        <Select
                          value={phdForm.status}
                          onChange={(e: any) =>
                            setPhdForm({
                              ...phdForm,
                              status: e.target.value,
                            })
                          }
                          error={phdErrors.status}
                        >
                          <option value="">Select Status</option>
                          {dropdowns?.[56]?.map((item: any) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER (FIXED) */}
                  <div className="flex justify-end gap-3 p-4 border-t">
                    <button
                      className="px-4 py-2 bg-amber-600 text-white rounded"
                      onClick={handleResetPhd}
                    >
                      Reset
                    </button>

                    <button onClick={handleSavePhdWrapped} className={btnSave}>
                      Save
                    </button>

                    <button
                      onClick={() => setShowPhdModal(false)}
                      className="px-4 py-2 bg-red-500 text-white rounded"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showPhdDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded w-[400px]">
                  <h2 className="text-lg font-semibold mb-4">
                    Delete PhD Record
                  </h2>

                  <p className="mb-6">Do you want to delete this PhD record?</p>

                  <div className="flex justify-end gap-3">
                    <button
                      className={btnCancel}
                      onClick={() => setShowPhdDeleteModal(false)}
                    >
                      Cancel
                    </button>

                    <button
                      className="px-4 py-2 bg-[#4f7f82] text-white rounded"
                      onClick={confirmPhdDelete}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded w-[400px]">
                  <h2 className="text-lg font-semibold mb-4">
                    Delete Confirmation
                  </h2>

                  <p className="mb-6">Do you want to delete this record?</p>

                  <div className="flex justify-end gap-3">
                    <button
                      className={btnCancel}
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>

                    <button
                      className="px-4 py-2 bg-[#4f7f82] text-white rounded"
                      onClick={confirmDelete}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showQualDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded w-[400px]">
                  <h2 className="text-lg font-semibold mb-4">
                    Delete Qualification
                  </h2>

                  <p className="mb-6">
                    Do you want to delete this qualification record?
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                      className={btnCancel}
                      onClick={() => setShowQualDeleteModal(false)}
                    >
                      Cancel
                    </button>

                    <button
                      className="px-4 py-2 bg-[#4f7f82] text-white rounded"
                      onClick={confirmQualificationDelete}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showUploadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="w-[1000px] bg-white rounded shadow-2xl border flex flex-col max-h-[90vh]">
                  {/* ================= HEADER ================= */}
                  <div className="text-[#4f7f82] px-5 py-3 flex justify-between items-center border-b">
                    <h2 className="text-[18px] font-semibold">
                      Uploaded Files
                    </h2>

                    <button
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadFile(null);
                      }}
                      className="text-black text-xl font-bold"
                    >
                      ✖
                    </button>
                  </div>

                  {/* ================= BODY (SCROLL ONLY HERE) ================= */}
                  <div className="p-5 overflow-y-auto flex-1">
                    <h3 className="font-semibold text-[18px] mb-4">
                      Qualification
                    </h3>

                    {/* TABLE */}
                    <div className="border rounded overflow-hidden">
                      <table className="w-full border-collapse bg-[#f3f3f3]">
                        {/* FIXED TABLE HEADER */}
                        <thead className="sticky top-0 bg-[#f7f7f7] z-10">
                          <tr>
                            <th className="border px-3 py-2 w-[70px]">
                              Select
                            </th>
                            <th className="border px-3 py-2 w-[80px]">
                              Sl No.
                            </th>
                            <th className="border px-3 py-2">File Name</th>
                            <th className="border px-3 py-2 w-[350px]">
                              Description
                            </th>
                            <th className="border px-3 py-2 w-[250px]">Date</th>
                            <th className="border px-3 py-2 w-[80px]">
                              Delete
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {uploadedFiles.length > 0 ? (
                            uploadedFiles.map((row: any, index: number) => (
                              <tr key={row.id}>
                                {/* CHECKBOX */}
                                <td className="border px-3 py-2 text-center">
                                  <input type="checkbox" />
                                </td>

                                {/* SERIAL */}
                                <td className="border px-3 py-2">
                                  {index + 1}
                                </td>

                                {/* FILE */}
                                <td className="border px-3 py-2 truncate max-w-[200px]">
                                  <a
                                    href={row.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block truncate text-[#4f7f82] underline"
                                  >
                                    {row.file_name}
                                  </a>
                                </td>
                                {/* DESCRIPTION */}
                                <td className="border px-3 py-2 align-top">
                                  <textarea
                                    className="w-full resize-none border rounded px-2 py-1 text-sm"
                                    value={
                                      editableFiles[index]?.description || ""
                                    }
                                    onChange={(e) => {
                                      const updated = [...editableFiles];
                                      updated[index].description =
                                        e.target.value;
                                      setEditableFiles(updated);
                                    }}
                                  />
                                </td>

                                {/* DATE */}
                                <td className="border px-3 py-2">
                                  <input
                                    type="date"
                                    className="w-full border px-2 py-1 rounded"
                                    value={
                                      editableFiles[index]?.actual_date?.split(
                                        "T",
                                      )[0] || ""
                                    }
                                    onChange={(e) => {
                                      const updated = [...editableFiles];
                                      updated[index].actual_date =
                                        e.target.value;
                                      setEditableFiles(updated);
                                    }}
                                  />
                                </td>

                                {/* DELETE */}
                                <td className="border px-3 py-2 text-center">
                                  <button
                                    onClick={() => {
                                      setUploadDeleteId(row.id);
                                      setShowUploadDeleteModal(true);
                                    }}
                                    className="text-red-600 font-bold text-xl"
                                  >
                                    <Trash2
                                      size={18}
                                      className="text-red-600 hover:text-red-700"
                                    />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="text-center py-2 text-gray-500 border"
                              >
                                No Files Uploaded
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* NOTE */}
                    <div className="mt-6 border rounded bg-[#fafafa] px-4 py-4 text-[15px] leading-7">
                      <p>
                        <b>Note :</b> Files allowed are .doc, .docx, .xls,
                        .xlsx, .jpg, .png, .txt, .ppt, .pptx, .pdf, .odt, .rtf.
                      </p>
                      <p className="ml-12">
                        Maximum file size allowed is 10MB.
                      </p>
                    </div>
                  </div>

                  {/* ================= FOOTER ================= */}
                  <div className="bg-[#f5f5f5] border-t px-5 py-4 flex justify-end gap-3">
                    {/* UPLOAD */}
                    <label className="px-4 py-2 text-sm rounded bg-[#4f7f82] text-white hover:bg-[#4f7f82]">
                      {uploadedFiles.length > 0 ? "Upload More" : "Upload"}

                      <input
                        type="file"
                        hidden
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !uploadQualId) return;

                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("user_id", String(manualUserId));
                          formData.append(
                            "qualification_id",
                            String(uploadQualId),
                          );

                          const res = await uploadQualificationFile(formData);

                          if (res?.status) {
                            toast.success("Uploaded Successfully");
                            await loadUploadedFiles(uploadQualId);
                          }
                        }}
                      />
                    </label>
                    {/* SAVE */}
                    <label
                      className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded font-medium"
                      onClick={handleSaveUploadedFiles}
                    >
                      Save
                    </label>
                    {/* CLOSE */}
                    <label
                      className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded font-medium"
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadFile(null);
                      }}
                    >
                      Close
                    </label>
                  </div>
                </div>
              </div>
            )}
            {showUploadDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded w-[400px]">
                  <h2 className="text-lg font-semibold mb-4">Delete File</h2>

                  <p className="mb-6">Do you want to delete this file?</p>

                  <div className="flex justify-end gap-3">
                    <button
                      className={btnCancel}
                      onClick={() => setShowUploadDeleteModal(false)}
                    >
                      Cancel
                    </button>

                    <button
                      className="px-4 py-2 bg-[#4f7f82] text-white rounded"
                      onClick={confirmUploadDelete}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyProfilePage;
