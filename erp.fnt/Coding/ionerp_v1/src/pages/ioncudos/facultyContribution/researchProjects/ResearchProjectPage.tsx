import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Upload, Calendar, Filter } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  uploadResearchProjectFile,
  getResearchProjectUploads,
  deleteResearchProjectUpload,
  updateResearchProjectUpload,
} from "./researchProjectApi";

type ColumnKey =
  | "project_title"
  | "role"
  | "sanctioned_date"
  | "duration"
  | "collaboration";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

interface DropdownOption {
  value: number;
  label: string;
}

interface ResearchProject {
  id: number;
  project_title: string;

  role: string;
  role_id?: number;

  sanctioned_date: string;

  duration: string;
  collaboration: string;
  team_members: string;

  status: string;
  status_id?: number;

  quantum_amount: string;
  funding_agency: string;
  amount_utilized: string;
  outcome_project: string;
}

const BASE_URL = "http://localhost:8000/research-project";

const ResearchProjectPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      project_title: "",
      role: "",
      sanctioned_date: "",
      duration: "",
      collaboration: "",
    },
  );
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveFilter("");
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  const [tableData, setTableData] = useState<ResearchProject[]>([]);
  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesColumnFilters = (
        Object.keys(columnFilters) as ColumnKey[]
      ).every((key) => {
        const filterValue = columnFilters[key]?.toLowerCase();

        if (
          !filterValue &&
          filterType[key] !== "blank" &&
          filterType[key] !== "notBlank"
        ) {
          return true;
        }

        const cellValue = (item[key] || "").toString().toLowerCase();

        const type = filterType[key] || "contains";

        switch (type) {
          case "contains":
            return cellValue.includes(filterValue);

          case "notContains":
            return !cellValue.includes(filterValue);

          case "equals":
            return cellValue === filterValue;

          case "notEquals":
            return cellValue !== filterValue;

          case "startsWith":
            return cellValue.startsWith(filterValue);

          case "endsWith":
            return cellValue.endsWith(filterValue);

          case "blank":
            return cellValue === "";

          case "notBlank":
            return cellValue !== "";

          default:
            return true;
        }
      });

      return matchesSearch && matchesColumnFilters;
    });
  }, [tableData, searchTerm, columnFilters, filterType]);
  const indexOfLastItem = currentPage * entriesPerPage;

  const indexOfFirstItem = indexOfLastItem - entriesPerPage;

  const currentTableData = filteredData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const formRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<any>({});
  const [isOpen, setIsOpen] = useState(true);

  const [roleDropdown, setRoleDropdown] = useState<DropdownOption[]>([]);
  const [statusDropdown, setStatusDropdown] = useState<DropdownOption[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [editId, setEditId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedResearchId, setSelectedResearchId] = useState<number | null>(
    null,
  );

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);

  const initialForm = {
    project_title: "",
    role: null as number | null,
    sanctioned_date: null as Date | null,
    team_members: "",
    status: null as number | null,
    collaboration: "",
    quantum_amount: "",
    duration: "",
    funding_agency: "",
    amount_utilized: "",
    outcome_project: "",
  };

  const [formData, setFormData] = useState(initialForm);

  // ===============================
  // FETCH DROPDOWNS
  // ===============================
  const fetchDropdowns = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/dropdowns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setRoleDropdown(data.roles || []);
      setStatusDropdown(data.status || []);
    } catch (error) {
      toast.error("Failed to load dropdowns");
    }
  };

  // ===============================
  // FETCH TABLE DATA
  // ===============================
  const fetchResearchProjects = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setTableData(data.data || []);
    } catch (error) {
      toast.error("Failed to fetch records");
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchResearchProjects();
  }, []);

  // ===============================
  // HANDLE CHANGE
  // ===============================
  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: name === "role" || name === "status" ? Number(value) : value,
    });

    setErrors((prev: any) => ({
      ...prev,
      [name]: "",
    }));
  };
  const loadUploadedFiles = async (researchId: number) => {
    const data = await getResearchProjectUploads(researchId);

    if (data.status) {
      setUploadedFiles(data.data || []);
      setEditableFiles(data.data || []);
    }
  };

  // ======================================
  // SAVE FILE DESCRIPTION / DATE
  // ======================================
  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        const formData = new FormData();

        formData.append("description", file.description || "");

        formData.append("actual_date", file.actual_date || "");

        await updateResearchProjectUpload(file.id, formData);
      }

      toast.success("Updated Successfully");

      if (selectedResearchId) {
        loadUploadedFiles(selectedResearchId);
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  // ======================================
  // DELETE UPLOAD
  // ======================================
  const handleDeleteUpload = async () => {
    if (!uploadDeleteId) return;

    const data = await deleteResearchProjectUpload(uploadDeleteId);

    if (data.status) {
      toast.success("Deleted Successfully");

      setShowUploadDeleteModal(false);

      if (selectedResearchId) {
        loadUploadedFiles(selectedResearchId);
      }
    } else {
      toast.error(data.message);
    }
  };

  // ===============================
  // ONLY DIGITS VALIDATION
  // ===============================
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // allow only positive digits
    if (/^\d*$/.test(value)) {
      setFormData({
        ...formData,
        [name]: value,
      });

      setErrors((prev: any) => ({
        ...prev,
        [name]: "",
      }));
    } else {
      setErrors((prev: any) => ({
        ...prev,
        [name]: "Only digits are allowed",
      }));
    }
  };

  // ===============================
  // VALIDATION
  // ===============================
  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.project_title.trim()) {
      newErrors.project_title = "Project Title is required";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!formData.sanctioned_date) {
      newErrors.sanctioned_date = "Sanctioned Date is required";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ===============================
  // SAVE
  // ===============================
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const payload = {
        ...formData,

        duration: formData.duration !== "" ? Number(formData.duration) : null,

        quantum_amount:
          formData.quantum_amount !== ""
            ? Number(formData.quantum_amount)
            : null,

        amount_utilized:
          formData.amount_utilized !== ""
            ? Number(formData.amount_utilized)
            : null,

        sanctioned_date: formData.sanctioned_date
          ? formData.sanctioned_date.toISOString().split("T")[0]
          : "",
      };

      const response = await fetch(
        editId ? `${BASE_URL}/update/${editId}` : `${BASE_URL}/create`,
        {
          method: editId ? "PUT" : "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editId
            ? "Research Project Updated Successfully"
            : "Research Project Saved Successfully",
        );

        resetForm();

        fetchResearchProjects();
      } else {
        toast.error(data.detail || "Something went wrong");
      }
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // EDIT
  // ===============================
  const handleEdit = (row: ResearchProject) => {
    setEditId(row.id);

    setFormData({
      project_title: row.project_title || "",

      role: row.role_id ? Number(row.role_id) : null,

      sanctioned_date: row.sanctioned_date
        ? new Date(row.sanctioned_date)
        : null,

      team_members: row.team_members || "",

      status: row.status_id ? Number(row.status_id) : null,

      collaboration: row.collaboration || "",

      quantum_amount: row.quantum_amount || "",

      duration: row.duration || "",

      funding_agency: row.funding_agency || "",

      amount_utilized: row.amount_utilized || "",

      outcome_project: row.outcome_project || "",
    });

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ===============================
  // DELETE
  // ===============================
  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");

      await fetch(`${BASE_URL}/delete/${deleteId}`, {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Deleted Successfully");

      setShowDeleteModal(false);

      setDeleteId(null);

      fetchResearchProjects();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // ===============================
  // RESET
  // ===============================
  const resetForm = () => {
    setEditId(null);

    setErrors({});

    setFormData(initialForm);
  };

  return (
    <div className="bg-[#f2f2f2] min-h-screen p-4">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 mb-4">
        <h2 className="text-lg font-semibold">Research Projects</h2>
      </div>

      {/* COLLAPSE HEADER */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border px-4 py-3 flex items-center gap-2 cursor-pointer font-semibold text-[#4f7f82]"
      >
        {isOpen ? "▼" : "▶"}

        <span>Research Projects</span>
      </div>

      {/* CONTENT */}
      {isOpen && (
        <div className="bg-white border border-t-0 p-4">
          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border border-collapse text-sm">
              <thead className="bg-[#f3f3f3]">
                <tr>
                  {(
                    [
                      {
                        key: "project_title",
                        label: "Project Title",
                      },
                      {
                        key: "role",
                        label: "Role",
                      },
                      {
                        key: "sanctioned_date",
                        label: "Sanctioned Date",
                      },
                      {
                        key: "duration",
                        label: "Duration",
                      },
                      {
                        key: "collaboration",
                        label: "Collaboration",
                      },
                    ] as {
                      key: ColumnKey;
                      label: string;
                    }[]
                  ).map((col) => (
                    <th key={col.key} className="border p-2 relative text-left">
                      <div className="flex items-center justify-between">
                        <span>{col.label}</span>

                        <Filter
                          size={16}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();

                            setActiveFilter(
                              activeFilter === col.key ? "" : col.key,
                            );
                          }}
                        />
                      </div>

                      {activeFilter === col.key && (
                        <div
                          className="absolute z-50 bg-white border shadow p-2 mt-2 w-44"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            className="w-full border px-1 py-1 mb-2 text-sm"
                            value={filterType[col.key] || "contains"}
                            onChange={(e) =>
                              setFilterType((prev: any) => ({
                                ...prev,
                                [col.key]: e.target.value,
                              }))
                            }
                          >
                            <option value="contains">Contains</option>

                            <option value="notContains">
                              Does not contain
                            </option>

                            <option value="equals">Equals</option>

                            <option value="notEquals">Does not equal</option>

                            <option value="startsWith">Begins with</option>

                            <option value="endsWith">Ends with</option>

                            <option value="blank">Blank</option>

                            <option value="notBlank">Not blank</option>
                          </select>

                          {filterType[col.key] !== "blank" &&
                            filterType[col.key] !== "notBlank" && (
                              <input
                                type="text"
                                placeholder="Filter..."
                                value={columnFilters[col.key] || ""}
                                onChange={(e) =>
                                  setColumnFilters((prev: any) => ({
                                    ...prev,
                                    [col.key]: e.target.value,
                                  }))
                                }
                                className="w-full border px-2 py-1 text-sm"
                              />
                            )}
                        </div>
                      )}
                    </th>
                  ))}

                  <th className="border p-2 text-center">Upload</th>

                  <th className="border p-2 text-center">Edit</th>

                  <th className="border p-2 text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {currentTableData.length > 0 ? (
                  currentTableData.map(
                    (row: ResearchProject, index: number) => {
                      const prevStatus =
                        index > 0 ? currentTableData[index - 1].status : null;

                      const showStatusRow = prevStatus !== row.status;

                      return (
                        <React.Fragment key={row.id}>
                          {/* STATUS HEADER ROW */}
                          {showStatusRow && (
                            <tr className="bg-gray-300">
                              <td
                                colSpan={8}
                                className="border px-3 py-3 font-semibold text-black text-left"
                              >
                                {row.status || "--"}
                              </td>
                            </tr>
                          )}

                          {/* DATA ROW */}
                          <tr>
                            <td className="border p-2">{row.project_title}</td>

                            <td className="border p-2">{row.role}</td>

                            <td className="border p-2">
                              {row.sanctioned_date}
                            </td>

                            <td className="border p-2">{row.duration}</td>

                            <td className="border p-2">{row.collaboration}</td>

                            <td className="border p-2 text-center">
                              <button
                                className="gap-1 flex items-center text-[#4f7f82] mx-auto"
                                onClick={() => {
                                  setSelectedResearchId(row.id);
                                  setShowUploadModal(true);
                                  loadUploadedFiles(row.id);
                                }}
                              >
                                <Upload size={16} />
                                Upload
                              </button>
                            </td>

                            <td className="border p-2 text-center">
                              <button
                                className="text-yellow-600"
                                onClick={() => handleEdit(row)}
                              >
                                <Pencil size={16} />
                              </button>
                            </td>

                            <td className="border p-2 text-center">
                              <button
                                className="text-red-600"
                                onClick={() => {
                                  setDeleteId(row.id);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    },
                  )
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center p-4">
                      No Data Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FORM */}
          <div ref={formRef} className="border-t mt-6 pt-6">
            <h3 className="text-[#4f7f82] font-semibold text-lg mb-6">
              Add / Edit Research Project
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* LEFT */}
              <div className="space-y-4">
                {/* PROJECT TITLE */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Project Title
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="project_title"
                    value={formData.project_title}
                    onChange={handleChange}
                    placeholder="Enter Project Title"
                    className="w-full border px-3 py-2"
                  />
                  {errors.project_title && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.project_title}
                    </p>
                  )}
                </div>

                {/* ROLE */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Role
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="role"
                    value={formData.role ?? ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2"
                  >
                    <option value="">Select Role</option>

                    {roleDropdown.map((item, index) => (
                      <option key={index} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                  )}
                </div>

                {/* TEAM MEMBERS */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Team Member(s)
                  </label>

                  <textarea
                    name="team_members"
                    value={formData.team_members}
                    onChange={handleChange}
                    placeholder="Enter Team Members"
                    className="w-full border px-3 py-2 h-28 resize-none"
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Status
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="status"
                    value={formData.status ?? ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2"
                  >
                    <option value="">Select Status</option>

                    {statusDropdown.map((item, index) => (
                      <option key={index} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="text-red-500 text-xs mt-1">{errors.status}</p>
                  )}
                </div>

                {/* COLLABORATION */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Collaboration
                  </label>

                  <textarea
                    name="collaboration"
                    value={formData.collaboration}
                    onChange={handleChange}
                    placeholder="Enter Collaboration"
                    className="w-full border px-3 py-2 h-28 resize-none"
                  />
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-4">
                {/* DATE */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Sanctioned Date
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <DatePicker
                      selected={formData.sanctioned_date}
                      onChange={(date) =>
                        setFormData({
                          ...formData,
                          sanctioned_date: date,
                        })
                      }
                      dateFormat="dd-MM-yyyy"
                      placeholderText="dd-mm-yyyy"
                      className="w-full border px-3 py-2 pr-10"
                    />

                    <Calendar
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                    {errors.sanctioned_date && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.sanctioned_date}
                      </p>
                    )}
                  </div>
                </div>

                {/* QUANTUM */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Quantum of Amount Sanctioned (₹)
                  </label>

                  <input
                    type="text"
                    name="quantum_amount"
                    value={formData.quantum_amount}
                    onChange={handleNumberInput}
                    placeholder="Enter Amount"
                    className="w-full border px-3 py-2"
                  />
                  {errors.quantum_amount && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.quantum_amount}
                    </p>
                  )}
                </div>

                {/* DURATION */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Duration (Months)
                  </label>

                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleNumberInput}
                    placeholder="Enter Duration"
                    className="w-full border px-3 py-2"
                  />
                  {errors.duration && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.duration}
                    </p>
                  )}
                </div>

                {/* FUNDING */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Funding Agency
                  </label>

                  <textarea
                    name="funding_agency"
                    value={formData.funding_agency}
                    onChange={handleChange}
                    placeholder="Enter Funding Agency"
                    className="w-full border px-3 py-2 h-28 resize-none"
                  />
                </div>

                {/* AMOUNT UTILIZED */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Amount Utilized
                  </label>

                  <input
                    type="text"
                    name="amount_utilized"
                    value={formData.amount_utilized}
                    onChange={handleChange}
                    placeholder="Enter Amount Utilized"
                    className="w-full border px-3 py-2"
                  />
                </div>

                {/* OUTCOME */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Outcome of Project
                  </label>

                  <textarea
                    name="outcome_project"
                    value={formData.outcome_project}
                    onChange={handleChange}
                    placeholder="Enter Outcome of Project"
                    className="w-full border px-3 py-2 h-28 resize-none"
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-[#4f7f82] text-white px-5 py-2 rounded"
                >
                  {editId ? "Update" : "Save"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-amber-600 text-white px-5 py-2 rounded"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-xl w-[420px] overflow-hidden">
            {/* HEADER */}
            <div className="px-5 py-3 border-b">
              <h2 className="text-lg text-[#4f7f82] font-semibold">
                Delete Confirmation
              </h2>
            </div>

            {/* BODY */}
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to delete this record?
              </p>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 px-5 py-4 bg-[#f5f5f5] border-t">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
              >
                Cancel
              </button>

              <button
                className="bg-[#4f7f82] text-white px-4 py-2 rounded"
                onClick={confirmDelete}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-[1000px] bg-white rounded shadow-2xl border flex flex-col max-h-[90vh]">
            {/* HEADER */}
            <div className="text-[#4f7f82] px-5 py-3 flex justify-between items-center rounded-t border-b">
              <h2 className="text-[18px] font-semibold">Uploaded Files</h2>

              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedResearchId(null);
                  setUploadedFiles([]);
                }}
                className="text-black text-xl font-bold"
              >
                ✖
              </button>
            </div>

            {/* BODY */}
            <div className="p-5 overflow-y-auto flex-1">
              <h3 className="font-semibold text-[18px] mb-4">
                Research Projects
              </h3>

              {/* TABLE */}
              <div className="border rounded overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-[#f7f7f7]">
                    <tr>
                      <th className="border px-3 py-2 w-[70px]">Select</th>

                      <th className="border px-3 py-2 w-[80px]">Sl No.</th>

                      <th className="border px-3 py-2">File Name</th>

                      <th className="border px-3 py-2 w-[350px]">
                        Description
                      </th>

                      <th className="border px-3 py-2 w-[250px]">Date</th>

                      <th className="border px-3 py-2 w-[80px]">Delete</th>
                    </tr>
                  </thead>

                  <tbody>
                    {uploadedFiles.length > 0 ? (
                      uploadedFiles.map((file: any, index: number) => (
                        <tr key={file.id}>
                          <td className="border px-3 py-2 text-center">
                            <input type="checkbox" />
                          </td>

                          <td className="border px-3 py-2">{index + 1}</td>

                          <td className="border px-3 py-2">
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#4f7f82] underline"
                            >
                              {file.file_name}
                            </a>
                          </td>

                          <td className="border px-3 py-2">
                            <textarea
                              className="w-full border rounded px-2 py-1"
                              value={file.description}
                              onChange={(e) => {
                                const updated = [...uploadedFiles];

                                updated[index].description = e.target.value;

                                setUploadedFiles(updated);

                                setEditableFiles(updated);
                              }}
                            />
                          </td>

                          <td className="border px-3 py-2">
                            <input
                              type="date"
                              className="w-full border px-2 py-1 rounded"
                              value={
                                file.actual_date
                                  ? file.actual_date.slice(0, 10)
                                  : ""
                              }
                              onChange={(e) => {
                                const updated = [...uploadedFiles];

                                updated[index].actual_date = e.target.value;

                                setUploadedFiles(updated);

                                setEditableFiles(updated);
                              }}
                            />
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <button
                              onClick={() => {
                                setUploadDeleteId(file.id);

                                setShowUploadDeleteModal(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-2 border">
                          No Files Uploaded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* NOTE */}
              <div className="mt-4 mb-2 p-3 text-sm">
                <label>
                  <span className="font-semibold">Upload Note:</span>
                  Sanctioned letter, Progress Report, Utilization Certificate
                </label>
              </div>

              <div className="mt-6 border rounded bg-[#fafafa] px-4 py-4">
                <p>
                  <b>Note :</b> Files allowed are .doc, .docx, .xls, .xlsx,
                  .jpg, .png, .txt, .ppt, .pptx, .pdf, .odt, .rtf.
                </p>

                <p className="ml-12">Maximum file size allowed is 10MB.</p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="bg-[#f5f5f5] border-t px-5 py-4 flex justify-end gap-3">
              {/* UPLOAD */}
              <label className="bg-[#4f7f82] text-white px-5 py-2 rounded cursor-pointer">
                {uploadedFiles.length > 0 ? "Upload More" : "Upload"}

                <input
                  type="file"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];

                    if (!file || !selectedResearchId) return;

                    const today = new Date().toISOString().split("T")[0];

                    const formData = new FormData();

                    formData.append("file", file);

                    formData.append("research_id", String(selectedResearchId));

                    formData.append("user_id", "1");

                    formData.append("actual_date", today);

                    const data = await uploadResearchProjectFile(formData);

                    if (data.status) {
                      toast.success("Uploaded Successfully");

                      loadUploadedFiles(selectedResearchId);
                    } else {
                      toast.error(data.message);
                    }
                  }}
                />
              </label>

              {/* SAVE */}
              <label
                onClick={handleSaveUploadedFiles}
                className="bg-[#4f7f82] text-white px-5 py-2 rounded"
              >
                Save
              </label>

              {/* CLOSE */}
              <label
                className="bg-red-600 text-white px-5 py-2 rounded"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedResearchId(null);
                  setUploadedFiles([]);
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
            <h2 className="text-lg font-semibold mb-4">Delete Confirmation</h2>

            <p className="mb-6">Do you want to delete this uploaded file?</p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => setShowUploadDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-[#4f7f82] text-white rounded"
                onClick={handleDeleteUpload}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchProjectPage;
