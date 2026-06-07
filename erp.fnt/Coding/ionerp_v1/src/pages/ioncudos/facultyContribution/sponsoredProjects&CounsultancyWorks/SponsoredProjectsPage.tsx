import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { Calendar } from "lucide-react";
import { forwardRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import {
  Pencil,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  getDropdowns,
  getProjects,
  saveProject,
  updateProject,
  deleteProject,
} from "./sponsoredProjectsApi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ProjectData {
  s_id?: number;

  project_type: string;

  project_title: string;

  principal_investigator: string;

  co_investigator: string;

  sponsoring_organization: string;

  collaborating_organization: string;

  sanctioned_department: string;

  amount: string;

  duration: string;

  status: string | number;

  spo_status?: string;

  date_of_sanction: Date | null;

  description: string;

  year?: string;

  investigator?: string;

  spo_oganization?: string;

  sanc_dept?: string;

  abstract?: string;
}
interface DropdownOption {
  label: string;
  value: string | number;
}

interface DropdownResponse {
  project_type: DropdownOption[];
  status: DropdownOption[];
}
type ColumnKey =
  | "project_title"
  | "investigator"
  | "co_investigator"
  | "spo_oganization"
  | "collaborating_organization"
  | "duration"
  | "spo_status";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";
const SponsoredProjectsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      project_title: "",
      investigator: "",
      co_investigator: "",
      spo_oganization: "",
      collaborating_organization: "",
      duration: "",
      spo_status: "",
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
  const formRef = useRef<HTMLDivElement | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);

  const loadUploadedFiles = async (projectId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/sponsored-projects/sponsored-project/upload-list/${projectId}`,
      );

      const data = await response.json();

      if (data.status) {
        setUploadedFiles(data.data);
        setEditableFiles(data.data);
      }
    } catch (error) {
      toast.error("Failed to load uploaded files");
    }
  };
  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        const formData = new FormData();

        formData.append("description", file.description || "");
        formData.append("actual_date", file.actual_date || "");

        await fetch(
          `http://localhost:8000/sponsored-projects/sponsored-project/upload/update/${file.id}`,
          {
            method: "PUT",
            body: formData,
          },
        );
      }

      toast.success("Updated Successfully");

      if (selectedProjectId) {
        loadUploadedFiles(selectedProjectId);
      }
    } catch (error) {
      toast.error("Update Failed");
    }
  };
  const handleDeleteUpload = async () => {
    if (uploadDeleteId === null) return;

    try {
      const response = await fetch(
        `http://localhost:8000/sponsored-projects/sponsored-project/upload/${uploadDeleteId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.status) {
        toast.success("Deleted Successfully");

        setShowUploadDeleteModal(false);

        if (selectedProjectId) {
          loadUploadedFiles(selectedProjectId);
        }
      }
    } catch (error) {
      toast.error("Delete Failed");
    }
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [projectTypeOptions, setProjectTypeOptions] = useState<
    DropdownOption[]
  >([]);

  const [statusOptions, setStatusOptions] = useState<DropdownOption[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  useEffect(() => {
    fetchDropdowns();
    fetchProjects();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const response = await getDropdowns();

      setProjectTypeOptions(response.project_type ?? []);
      setStatusOptions(response.status ?? []);

      // ✅ AUTO SELECT FIRST VALUE
      if (response.project_type?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          project_type: response.project_type[0].value,
        }));
      }

      // (optional) same for status
      if (response.status?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          status: response.status[0].value,
        }));
      }
    } catch (error) {
      console.error("Dropdown error:", error);
      toast.error("Failed to fetch dropdowns");
    }
  };
  const fetchProjects = async () => {
    try {
      const response: any = await getProjects();

      console.log("Projects Response:", response);

      // If API returns array directly
      if (Array.isArray(response)) {
        setTableData(response);
      }

      // If API returns { data: [...] }
      else if (Array.isArray(response.data)) {
        setTableData(response.data);
      }

      // If API returns { projects: [...] }
      else if (Array.isArray(response.projects)) {
        setTableData(response.projects);
      } else {
        setTableData([]);
      }
    } catch (error) {
      toast.error("Failed to fetch data");
      setTableData([]);
    }
  };
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        project_title: formData.project_title,
        spo_oganization: formData.sponsoring_organization,
        collaborating_organization: formData.collaborating_organization,
        investigator: formData.principal_investigator,
        co_investigator: formData.co_investigator,
        amount: Number(formData.amount),
        sanc_dept: formData.sanctioned_department,
        project_type: formData.project_type,
        year: formData.date_of_sanction
          ? String(formData.date_of_sanction.getFullYear())
          : "",
        duration: Number(formData.duration),
        abstract: formData.description,
        status: Number(formData.status),
      };

      if (editId) {
        await updateProject(editId, payload);

        toast.success("Updated Successfully");
      } else {
        await saveProject(payload);

        toast.success("Saved Successfully");
      }

      fetchProjects();

      resetForm();

      setEditId(null);
    } catch (error) {
      toast.error("Failed");
    }
  };
  const handleEdit = (item: any) => {
    setEditId(item.s_id);

    setFormData({
      s_id: item.s_id,
      project_type: item.project_type || "",
      project_title: item.project_title || "",
      principal_investigator: item.investigator || "",
      co_investigator: item.co_investigator || "",
      sponsoring_organization: item.spo_oganization || "",
      collaborating_organization: item.collaborating_organization || "",
      sanctioned_department: item.sanc_dept || "",
      amount: item.amount?.toString() || "",
      duration: item.duration?.toString() || "",
      status: item.status || "",
      date_of_sanction: item.year ? new Date(`${item.year}-01-01`) : null,
      description: item.abstract || "",
    });

    // SCROLL TO FORM
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };
  const handleDelete = (id: number) => {
    setDeleteId(id);

    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteProject(deleteId);

      toast.success("Deleted Successfully");

      fetchProjects();

      setShowDeleteModal(false);

      setDeleteId(null);
    } catch (error) {
      toast.error("Delete Failed");
    }
  };
  const DateInput = forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
  >(({ value, onClick, placeholder }, ref) => (
    <div className="relative w-full">
      <input
        ref={ref}
        value={value}
        onClick={onClick}
        placeholder={placeholder}
        readOnly
        className="w-full border rounded px-3 py-2 mt-1 pr-10"
      />

      <Calendar
        size={18}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
        onClick={() => onClick?.({} as any)}
      />
    </div>
  ));

  DateInput.displayName = "DateInput";
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(true);

  const [tableData, setTableData] = useState<ProjectData[]>([]);

  const [formData, setFormData] = useState<ProjectData>({
    project_type: "",
    project_title: "",
    principal_investigator: "",
    co_investigator: "",
    sponsoring_organization: "",
    collaborating_organization: "",
    sanctioned_department: "",
    amount: "",
    duration: "",
    status: "",
    date_of_sanction: null,
    description: "",
  });

  const [errors, setErrors] = useState<any>({});

  // ================= HANDLE CHANGE =================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    let error = "";

    // VALIDATE AMOUNT & DURATION
    if (name === "amount" || name === "duration") {
      if (value && !/^\d+$/.test(value)) {
        error = "Only digits allowed";
      }
    }

    setErrors((prev: any) => ({
      ...prev,
      [name]: error,
    }));
  };

  // ================= VALIDATION =================

  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.project_title.trim()) {
      newErrors.project_title = "Project title is required";
    }

    if (!formData.principal_investigator.trim()) {
      newErrors.principal_investigator = "Principal investigator is required";
    }

    if (!formData.date_of_sanction) {
      newErrors.date_of_sanction = "Date of sanction is required";
    }

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (!/^\d+$/.test(formData.amount)) {
      newErrors.amount = "Only numbers allowed";
    }

    if (!formData.duration.trim()) {
      newErrors.duration = "Duration is required";
    } else if (!/^\d+$/.test(formData.duration)) {
      newErrors.duration = "Only numbers allowed";
    }

    if (!formData.sponsoring_organization.trim()) {
      newErrors.sponsoring_organization = "Sponsoring organization is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ================= SAVE =================

  // ================= RESET =================

  const resetForm = () => {
    setFormData({
      project_type:
        projectTypeOptions.length > 0
          ? String(projectTypeOptions[0].value)
          : "",

      status: statusOptions.length > 0 ? String(statusOptions[0].value) : "",

      project_title: "",
      principal_investigator: "",
      co_investigator: "",
      sponsoring_organization: "",
      collaborating_organization: "",
      sanctioned_department: "",
      amount: "",
      duration: "",
      date_of_sanction: null,
      description: "",
    });

    setErrors({});
  };
  // ================= SEARCH FILTER =================

  const filteredData = Array.isArray(tableData)
    ? tableData.filter((item: any) => {
        // GLOBAL SEARCH
        const matchesSearch = Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        // COLUMN FILTERS
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
      })
    : [];

  // ================= PAGINATION =================

  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;

  const currentTableData = filteredData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  // ================= PAGE CHANGE =================

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* HEADER */}

      <div className="text-[#4f7f82] px-4 py-2 rounded-t flex justify-between mb-6">
        <h2 className="text-lg font-semibold">
          Sponsored Projects & Consultancy Works
        </h2>
      </div>

      {/* COLLAPSIBLE HEADER */}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border p-3 font-semibold text-[#4f7f82] cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        Sponsored Projects & Consultancy Works
      </div>

      {/* CONTENT */}

      {isOpen && (
        <div className="bg-white border border-t-0 p-4">
          {/* TABLE TOP */}

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span>Show</span>

              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1 w-20"
              >
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>

              <span>entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span>Search:</span>

              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded px-3 py-1"
              />
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full border border-collapse text-sm">
              <thead className="bg-[#f3f3f3]">
                <tr>
                  <th className="border px-3 py-2 text-left">Sl No.</th>

                  {(
                    [
                      { key: "project_title", label: "Project Title" },
                      {
                        key: "investigator",
                        label: "Principal Investigator",
                      },
                      {
                        key: "co_investigator",
                        label: "Co-Investigator(s)",
                      },
                      {
                        key: "spo_oganization",
                        label: "Sponsoring Organization",
                      },
                      {
                        key: "collaborating_organization",
                        label: "Collaborating Organization",
                      },
                      {
                        key: "duration",
                        label: "Duration",
                      },
                      {
                        key: "spo_status",
                        label: "Status",
                      },
                    ] as { key: ColumnKey; label: string }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="border px-3 py-2 text-left relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{col.label}</span>

                        <Filter
                          className="w-4 h-4 min-w-4 min-h-4 mt-1 text-black hover:text-blue-600 cursor-pointer flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();

                            setActiveFilter(
                              activeFilter === col.key ? "" : col.key,
                            );
                          }}
                        />
                      </div>

                      {/* FILTER POPUP */}
                      {activeFilter === col.key && (
                        <div
                          className="absolute z-50 bg-white border shadow p-2 mt-2 w-44"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            className="w-full border px-1 py-1 mb-2 text-sm"
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

                  <th className="border px-3 py-2 text-center">Upload</th>

                  <th className="border px-3 py-2 text-center">Edit</th>

                  <th className="border px-3 py-2 text-center">Delete</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length > 0 ? (
                  currentTableData.map((item, index) => (
                    <tr key={index}>
                      <td className="border px-3 py-2">{index + 1}</td>

                      <td className="border px-3 py-2">{item.project_title}</td>

                      <td className="border px-3 py-2">{item.investigator}</td>

                      <td className="border px-3 py-2 min-w-[170px]">
                        {item.co_investigator}
                      </td>

                      <td className="border px-3 py-2">
                        {item.spo_oganization}
                      </td>

                      <td className="border px-3 py-2">
                        {item.collaborating_organization}
                      </td>

                      <td className="border px-3 py-2">
                        {item.duration} Month(s)
                      </td>

                      <td className="border px-3 py-2">{item.spo_status}</td>

                      <td className="border px-3 py-2 text-center">
                        <button
                          className="flex items-center gap-1 text-[#4f7f82]"
                          onClick={async () => {
                            if (!item.s_id) return;

                            setSelectedProjectId(item.s_id);

                            await loadUploadedFiles(item.s_id);

                            setShowUploadModal(true);
                          }}
                        >
                          <Upload size={16} />
                          Upload
                        </button>
                      </td>

                      <td className="border px-3 py-2 text-center">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>

                      <td className="border px-3 py-2 text-center">
                        <button
                          onClick={() => {
                            if (item.s_id) {
                              handleDelete(item.s_id);
                            }
                          }}
                          className="text-red-600 font-bold text-xl"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="border px-3 py-4 text-center">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="flex justify-between items-center mt-4 text-sm">
            <div>
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredData.length)} of{" "}
              {filteredData.length} entries
            </div>

            <div className="flex border rounded overflow-hidden">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="px-4 py-2 border-r flex items-center gap-1 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button className="px-4 py-2 border-r bg-gray-100">
                {currentPage}
              </button>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 flex items-center gap-1 disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* FORM */}

          <div ref={formRef} className="border mt-8 p-5">
            <h2 className="text-lg font-semibold text-[#4f7f82] mb-5">
              {editId
                ? "Edit Sponsored Projects & Consultancy Works"
                : "Add Sponsored Projects & Consultancy Works"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-5">
              {/* LEFT SIDE */}

              <div className="space-y-5">
                <div>
                  <label className="text-sm">
                    Project Type: <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                  >
                    <option value="">Select</option>

                    {projectTypeOptions.map((item, index) => (
                      <option key={index} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm">
                    Project Title: <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="project_title"
                    value={formData.project_title}
                    onChange={handleChange}
                    placeholder="Enter Project Title"
                    className="w-full border rounded px-3 py-2 mt-1"
                  />

                  {errors.project_title && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.project_title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm">
                    Date of sanction: <span className="text-red-500">*</span>
                  </label>

                  <DatePicker
                    selected={formData.date_of_sanction}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        date_of_sanction: date,
                      })
                    }
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Select date"
                    customInput={<DateInput />}
                  />

                  {errors.date_of_sanction && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.date_of_sanction}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm">
                    Principal Investigator:{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="principal_investigator"
                    value={formData.principal_investigator}
                    onChange={handleChange}
                    placeholder="Enter Principal Investigator"
                    className="w-full border rounded px-3 py-2 mt-1"
                  />

                  {errors.principal_investigator && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.principal_investigator}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm">Co-Investigator:</label>

                  <textarea
                    name="co_investigator"
                    value={formData.co_investigator}
                    onChange={handleChange}
                    placeholder="Enter Co-Investigator(s)"
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm">
                    Amount (in ₹): <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter Amount"
                    className="w-full border rounded px-3 py-2 mt-1"
                  />

                  {errors.amount && (
                    <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE */}

              <div className="space-y-5">
                <div>
                  <label className="text-sm">
                    Status: <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                  >
                    <option value="">Select</option>

                    {statusOptions.map((item, index) => (
                      <option key={index} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm">
                    Duration (in months):{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="Enter duration in month(s)"
                    className="w-full border rounded px-3 py-2 mt-1"
                  />

                  {errors.duration && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.duration}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm">
                    Sponsoring Organization:{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    name="sponsoring_organization"
                    value={formData.sponsoring_organization}
                    onChange={handleChange}
                    placeholder="Enter Sponsoring Organization"
                    className="w-full border rounded px-3 py-2 mt-1"
                  />

                  {errors.sponsoring_organization && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.sponsoring_organization}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm">Collaborating Organization:</label>

                  <textarea
                    name="collaborating_organization"
                    value={formData.collaborating_organization}
                    onChange={handleChange}
                    placeholder="Enter Collaborating Organization"
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm">Sanctioned Department:</label>

                  <input
                    type="text"
                    name="sanctioned_department"
                    value={formData.sanctioned_department}
                    onChange={handleChange}
                    placeholder="Enter Sanctioned Department"
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}

            <div className="mt-6">
              <label className="text-sm">Description:</label>

              <Editor
                apiKey="no-api-key"
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                value={formData.description}
                onEditorChange={(content) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: content,
                  }))
                }
                init={{
                  height: 300,
                  menubar: "file edit view insert format tools table help",
                  plugins: [
                    "advlist",
                    "autolink",
                    "lists",
                    "link",
                    "image",
                    "charmap",
                    "preview",
                    "anchor",
                    "searchreplace",
                    "visualblocks",
                    "code",
                    "fullscreen",
                    "insertdatetime",
                    "media",
                    "table",
                    "wordcount",
                  ],
                  toolbar:
                    "undo redo | formatselect | bold italic underline | " +
                    "alignleft aligncenter alignright alignjustify | " +
                    "bullist numlist outdent indent | link image table | " +
                    "code fullscreen",
                  branding: false,
                  promotion: false,
                  statusbar: true,
                  resize: true,
                }}
              />
            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="bg-amber-600 hover:bg-amber-600 text-white px-5 py-2 rounded"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded w-[400px]">
                <h2 className="text-lg font-semibold mb-4">
                  Delete Confirmation
                </h2>

                <p className="mb-6">Do you want to delete this record?</p>

                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded"
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
          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="w-[1000px] bg-white rounded shadow-2xl border flex flex-col max-h-[90vh]">
                {/* HEADER */}
                <div className=" text-[#4f7f82] px-5 py-3 flex justify-between items-center rounded-t">
                  <h2 className="text-[18px] font-semibold">Uploaded Files</h2>

                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedProjectId(null);
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
                    Sponsored Projects
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
                  {/* UPLOAD NOTE */}
                  <div className="mt-6">
                    <p className="text-[16px]">
                      <span className="font-semibold">Upload Note :</span>{" "}
                      Sanction Letter Utilization Certificate
                    </p>
                  </div>
                  {/* NOTE */}
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

                        if (!file || !selectedProjectId) return;

                        const today = new Date().toISOString().split("T")[0];

                        const formData = new FormData();

                        formData.append("file", file);

                        formData.append(
                          "project_id",
                          String(selectedProjectId),
                        );

                        formData.append("user_id", "1");

                        formData.append("actual_date", today);

                        const response = await fetch(
                          "http://localhost:8000/sponsored-projects/sponsored-project/upload",
                          {
                            method: "POST",
                            body: formData,
                          },
                        );

                        const data = await response.json();

                        if (data.status) {
                          toast.success("Uploaded Successfully");

                          loadUploadedFiles(selectedProjectId);
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
                      setSelectedProjectId(null);
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
                <h2 className="text-lg font-semibold mb-4">
                  Delete Confirmation
                </h2>

                <p className="mb-6">
                  Do you want to delete this uploaded file?
                </p>

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
      )}
    </div>
  );
};

export default SponsoredProjectsPage;
