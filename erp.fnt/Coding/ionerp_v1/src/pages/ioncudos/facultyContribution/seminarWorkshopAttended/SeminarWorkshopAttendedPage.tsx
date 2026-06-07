import React, { useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Upload,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getDropdowns,
  getSeminarWorkshopList,
  saveSeminarWorkshop,
  updateSeminarWorkshop,
  deleteSeminarWorkshop,
  uploadSeminarWorkshopFile,
  getUploadList,
  deleteUploadFile,
  updateUploadFile,
} from "./seminarWorkshopAttendedApi";
// ==========================
// TYPES
// ==========================
interface DropdownOption {
  value: number;
  label: string;
}
interface SeminarItem {
  twca_id?: number;

  program_title: string;

  training_type: string;
  training_type_label?: string;

  level: string;
  level_label?: string;

  user_role: string;
  user_role_label?: string;

  invited: string;
  invited_label?: string;

  event_organizer: string;

  venue: string;

  from_date: Date | null;

  to_date: Date | null;

  highlight: string;
}

type ColumnKey = "program_title" | "level" | "event_organizer" | "user_role";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

// ==========================
// COMPONENT
// ==========================
const SeminarWorkshopAttendedPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [showMainDeleteModal, setShowMainDeleteModal] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [isOpen, setIsOpen] = useState(true);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [entriesPerPage, setEntriesPerPage] = useState(20);

  const [currentPage, setCurrentPage] = useState(1);

  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>({
    program_title: "contains",
    level: "contains",
    event_organizer: "contains",
    user_role: "contains",
  });

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      program_title: "",
      level: "",
      event_organizer: "",
      user_role: "",
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

  const [editId, setEditId] = useState<number | null>(null);

  // ==========================
  // DROPDOWNS FROM BACKEND
  // ==========================
  const [typeOptions, setTypeOptions] = useState<DropdownOption[]>([]);
  const [levelOptions, setLevelOptions] = useState<DropdownOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<DropdownOption[]>([]);
  const [inviteOptions, setInviteOptions] = useState<DropdownOption[]>([]);

  // ==========================
  // TABLE DATA FROM BACKEND
  // ==========================
  const [tableData, setTableData] = useState<SeminarItem[]>([]);

  // ==========================
  // FORM
  // ==========================
  const initialForm: SeminarItem = {
    program_title: "",
    training_type: "",
    level: "",
    user_role: "",
    invited: "",
    event_organizer: "",
    venue: "",
    from_date: null,
    to_date: null,
    highlight: "",
  };

  const [formData, setFormData] = useState<SeminarItem>(initialForm);

  const [errors, setErrors] = useState<any>({});

  // ==========================
  // FETCH DROPDOWNS
  // ==========================
  useEffect(() => {
    fetchDropdowns();
    fetchTableData();
  }, []);

  const fetchDropdowns = async () => {
    try {
      setLoading(true);

      const response = await getDropdowns();

      setTypeOptions(response.types || []);
      setLevelOptions(response.levels || []);
      setRoleOptions(response.roles || []);
      setInviteOptions(response.invites || []);

      // PRESELECT FIRST VALUE
      setFormData((prev) => ({
        ...prev,

        training_type:
          response.types && response.types.length > 0
            ? response.types[0].value.toString()
            : "",

        level:
          response.levels && response.levels.length > 0
            ? response.levels[0].value.toString()
            : "",

        user_role:
          response.roles && response.roles.length > 0
            ? response.roles[0].value.toString()
            : "",

        invited:
          response.invites && response.invites.length > 0
            ? response.invites[0].value.toString()
            : "",
      }));
    } catch (error) {
      toast.error("Failed to fetch dropdowns");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // FETCH TABLE DATA
  // ==========================
  const fetchTableData = async () => {
    try {
      setLoading(true);

      const response = await getSeminarWorkshopList();

      const formatted = response.map((item: any) => ({
        twca_id: item.twca_id,

        program_title: item.program_title,

        // store ids for dropdown preselect
        training_type: item.training_type?.toString() || "",

        level: item.level?.toString() || "",

        user_role: item.user_role?.toString() || "",

        invited: item.invited?.toString() || "",

        // store labels separately for table display
        training_type_label: item.training_type_label || "",

        level_label: item.level_label || "",

        user_role_label: item.user_role_label || "",

        invited_label: item.invited_label || "",

        event_organizer: item.event_organizer || "",

        venue: item.venue || "",

        from_date: item.from_date ? new Date(item.from_date) : null,

        to_date: item.to_date ? new Date(item.to_date) : null,

        highlight: item.highlight || "",
      }));

      setTableData(formatted);
    } catch (error) {
      toast.error("Failed to fetch table data");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // HANDLE CHANGE
  // ==========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev: any) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ==========================
  // VALIDATION
  // ==========================
  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.program_title.trim()) {
      newErrors.program_title = "Program title is required";
    }

    if (!formData.training_type) {
      newErrors.type = "Type is required";
    }

    if (!formData.level) {
      newErrors.level = "Level is required";
    }

    if (!formData.user_role) {
      newErrors.role = "Role is required";
    }

    if (!formData.invited) {
      newErrors.invited_deputed = "Invited/Deputed is required";
    }

    if (!formData.from_date) {
      newErrors.from_date = "Start date is required";
    }

    if (!formData.to_date) {
      newErrors.to_date = "End date is required";
    }

    // START DATE SHOULD NOT BE GREATER THAN END DATE
    if (
      formData.from_date &&
      formData.to_date &&
      formData.from_date > formData.to_date
    ) {
      newErrors.to_date =
        "End date must be greater than or equal to start date";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ==========================
  // SAVE
  // ==========================
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        program_title: formData.program_title,

        training_type: Number(formData.training_type),

        level: Number(formData.level),

        user_role: Number(formData.user_role),

        invited: Number(formData.invited),

        event_organizer: formData.event_organizer,

        venue: formData.venue,

        from_date: formData.from_date?.toISOString().split("T")[0],

        to_date: formData.to_date?.toISOString().split("T")[0],

        highlight: formData.highlight,
      };

      if (editId) {
        await updateSeminarWorkshop(editId, payload);

        toast.success("Updated Successfully");
      } else {
        await saveSeminarWorkshop(payload);

        toast.success("Saved Successfully");
      }

      resetForm();

      fetchTableData();
    } catch (error) {
      console.log(error);

      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // EDIT
  // ==========================
  const handleEdit = (item: SeminarItem) => {
    setEditId(item.twca_id || null);

    setFormData({
      ...item,
    });

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ==========================
  // DELETE
  // ==========================
  const handleDelete = (id?: number) => {
    if (!id) return;

    setDeleteId(id);

    setShowMainDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteSeminarWorkshop(deleteId);

      toast.success("Deleted Successfully");

      fetchTableData();

      setShowMainDeleteModal(false);

      setDeleteId(null);
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // ==========================
  // RESET
  // ==========================
  const resetForm = () => {
    setFormData(initialForm);
    setErrors({});
    setEditId(null);
  };

  // ==========================
  // SEARCH FILTER
  // ==========================
  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      // Global Search
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      // Column Filters
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
  }, [tableData, search, columnFilters, filterType]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [selectedSeminarId, setSelectedSeminarId] = useState<number | null>(
    null,
  );

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const loadUploadedFiles = async (twcaId: number) => {
    try {
      const response = await getUploadList(twcaId);

      if (response.status) {
        setUploadedFiles(response.data || []);
        setEditableFiles(response.data || []);
      }
    } catch (error) {
      toast.error("Failed to load uploaded files");
    }
  };

  // ==========================
  // OPEN UPLOAD MODAL
  // ==========================
  const handleOpenUploadModal = async (id?: number) => {
    if (!id) return;

    setSelectedSeminarId(id);

    setShowUploadModal(true);

    await loadUploadedFiles(id);
  };

  // ==========================
  // SAVE UPLOAD DETAILS
  // ==========================
  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        const formData = new FormData();

        formData.append("description", file.description || "");

        formData.append("actual_date", file.actual_date || "");

        await updateUploadFile(file.id, formData);
      }

      toast.success("Updated Successfully");

      if (selectedSeminarId) {
        loadUploadedFiles(selectedSeminarId);
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  // ==========================
  // DELETE UPLOAD
  // ==========================
  const handleDeleteUpload = async () => {
    if (!uploadDeleteId) return;

    try {
      const response = await deleteUploadFile(uploadDeleteId);

      if (response.status) {
        toast.success("Deleted Successfully");

        setShowUploadDeleteModal(false);

        if (selectedSeminarId) {
          loadUploadedFiles(selectedSeminarId);
        }
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };
  // ==========================
  // PAGINATION
  // ==========================
  const indexOfFirst = (currentPage - 1) * entriesPerPage;

  const indexOfLast = indexOfFirst + entriesPerPage;
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  const paginatedData = filteredData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="bg-[#f2f2f2] min-h-screen p-4">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 mb-4">
        <h2 className="text-lg font-semibold">
          Seminar / Training / Development / Workshop Attended
        </h2>
      </div>

      {/* COLLAPSE HEADER */}
      <div
        className="bg-white border px-4 py-3 flex items-center gap-2 cursor-pointer font-semibold text-[#4f7f82]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "▼" : "▶"}

        <span>Seminar / Training / Development / Workshop Attended</span>
      </div>

      {isOpen && (
        <div className="bg-white border border-t-0 p-4">
          {/* TABLE CONTROLS */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span>Show</span>

              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="border px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <span>entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span>Search:</span>

              <input
                type="text"
                className="border px-2 py-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border border-collapse text-sm">
              <thead className="bg-[#f3f3f3]">
                <tr className="bg-[#f2f2f2]">
                  <th className="border p-2 text-left">
                    <div className="flex items-center justify-between relative">
                      Program Title
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter(
                            activeFilter === "program_title"
                              ? ""
                              : "program_title",
                          );
                        }}
                      >
                        <Filter size={15} />
                      </button>
                      {activeFilter === "program_title" && (
                        <div
                          className="absolute top-8 right-0 bg-white border shadow-md p-2 z-50 w-52"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            placeholder="Filter..."
                            className="border px-2 py-1 w-full text-sm"
                            value={columnFilters.program_title}
                            onChange={(e) =>
                              setColumnFilters({
                                ...columnFilters,
                                program_title: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </th>

                  <th className="border p-2 text-left">
                    <div className="flex items-center justify-between relative">
                      Level
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter(
                            activeFilter === "level" ? "" : "level",
                          );
                        }}
                      >
                        <Filter size={15} />
                      </button>
                      {activeFilter === "level" && (
                        <div
                          className="absolute top-8 right-0 bg-white border shadow-md p-2 z-50 w-52"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            placeholder="Filter..."
                            className="border px-2 py-1 w-full text-sm"
                            value={columnFilters.level}
                            onChange={(e) =>
                              setColumnFilters({
                                ...columnFilters,
                                level: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </th>

                  <th className="border p-2 text-left">
                    <div className="flex items-center justify-between relative">
                      Event Organizer
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter(
                            activeFilter === "event_organizer"
                              ? ""
                              : "event_organizer",
                          );
                        }}
                      >
                        <Filter size={15} />
                      </button>
                      {activeFilter === "event_organizer" && (
                        <div
                          className="absolute top-8 right-0 bg-white border shadow-md p-2 z-50 w-52"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            placeholder="Filter..."
                            className="border px-2 py-1 w-full text-sm"
                            value={columnFilters.event_organizer}
                            onChange={(e) =>
                              setColumnFilters({
                                ...columnFilters,
                                event_organizer: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </th>

                  <th className="border p-2 text-left">Date</th>

                  <th className="border p-2 text-left">
                    <div className="flex items-center justify-between relative">
                      Your Role
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter(
                            activeFilter === "user_role" ? "" : "user_role",
                          );
                        }}
                      >
                        <Filter size={15} />
                      </button>
                      {activeFilter === "user_role" && (
                        <div
                          className="absolute top-8 right-0 bg-white border shadow-md p-2 z-50 w-52"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            placeholder="Filter..."
                            className="border px-2 py-1 w-full text-sm"
                            value={columnFilters.user_role}
                            onChange={(e) =>
                              setColumnFilters({
                                ...columnFilters,
                                user_role: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </th>

                  <th className="border p-2 text-center">Upload</th>

                  <th className="border p-2 text-center">Edit</th>

                  <th className="border p-2 text-center">Delete</th>
                </tr>
              </thead>

              <tbody>
                <tr className="bg-gray-300">
                  <td
                    colSpan={8}
                    className="border px-3 py-3 font-semibold text-black text-left"
                  >
                    {paginatedData[0]?.training_type_label || "--"}
                  </td>
                </tr>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={index}>
                      <td className="border p-2">{item.program_title}</td>

                      <td className="border p-2">{item.level_label}</td>

                      <td className="border p-2">{item.event_organizer}</td>

                      <td className="border p-2">
                        {item.from_date?.toLocaleDateString("en-GB")} -{" "}
                        {item.to_date?.toLocaleDateString("en-GB")}
                      </td>

                      <td className="border p-2">{item.user_role_label}</td>

                      <td className="border p-2 text-center">
                        <button
                          className="gap-1 flex items-center text-[#4f7f82]"
                          onClick={() => handleOpenUploadModal(item.twca_id)}
                        >
                          <Upload size={16} />
                          Upload
                        </button>
                      </td>

                      <td className="border p-2 text-center">
                        <button className="text-yellow-600" onClick={() => handleEdit(item)}>
                          <Pencil size={16} />
                        </button>
                      </td>

                      <td className="border p-2 text-center">
                        <button className="text-red-600" onClick={() => handleDelete(item.twca_id)}>
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))
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

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-4 text-sm flex-wrap gap-3">
            <p>
              Showing {filteredData.length === 0 ? 0 : indexOfFirst + 1} to{" "}
              {Math.min(indexOfFirst + entriesPerPage, filteredData.length)} of{" "}
              {filteredData.length} entries
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="border px-3 py-1 rounded flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              {Array.from(
                {
                  length: totalPages || 1,
                },
                (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`border px-3 py-1 rounded ${
                      currentPage === i + 1 ? "bg-[#4f7f82] text-white" : ""
                    }`}
                  >
                    {i + 1}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="border px-3 py-1 rounded flex items-center gap-1"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* FORM */}
          <div ref={formRef} className="border-t mt-6 pt-6">
            {/* HEADING */}
            <h3 className="text-[#4f7f82] font-semibold text-lg mb-6">
              Add / Edit Conference / Seminar / Training / Development /
              Workshop Attended
            </h3>

            {/* FORM GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* LEFT */}
              <div className="space-y-4">
                {/* Program Title */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Program Title
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="program_title"
                    value={formData.program_title}
                    onChange={handleChange}
                    className="w-full border px-3 py-2"
                  />

                  {errors.program_title && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.program_title}
                    </p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Type
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="training_type"
                    value={formData.training_type}
                    onChange={handleChange}
                    className="w-full border px-3 py-2"
                  >
                    {typeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  {errors.type && (
                    <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                  )}
                </div>

                {/* Organizer */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Event Organizer
                  </label>

                  <input
                    type="text"
                    name="event_organizer"
                    value={formData.event_organizer}
                    onChange={handleChange}
                    className="w-full border px-3 py-2"
                  />
                </div>

                {/* Venue */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Venue
                  </label>

                  <textarea
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange as any}
                    className="w-full border px-3 py-2 h-28 resize-none"
                  />
                </div>
              </div>

              {/* CENTER */}
              <div className="space-y-4">
                {/* Level */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Select Level
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full border px-3 py-2"
                  >
                    {levelOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  {errors.level && (
                    <p className="text-red-500 text-xs mt-1">{errors.level}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Your Role
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="user_role"
                    value={formData.user_role}
                    onChange={handleChange}
                    className="w-full border px-3 py-2"
                  >
                    {roleOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  {errors.role && (
                    <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                  )}
                </div>

                {/* Invite */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Invited/Deputed
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="invited"
                    value={formData.invited}
                    onChange={handleChange}
                    className="w-full border px-3 py-2"
                  >
                    {inviteOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  {errors.invited_deputed && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.invited_deputed}
                    </p>
                  )}
                </div>

                {/* Dates */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Date
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="flex gap-2">
                    {/* FROM DATE */}
                    <div className="relative w-full">
                      <DatePicker
                        selected={formData.from_date}
                        onChange={(date) =>
                          setFormData((prev) => ({
                            ...prev,
                            from_date: date,
                          }))
                        }
                        dateFormat="dd-MM-yyyy"
                        className="w-full border px-3 py-2 pr-10"
                        placeholderText="Start Date"
                      />

                      <Calendar
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                      />
                    </div>

                    {/* TO DATE */}
                    <div className="relative w-full">
                      <DatePicker
                        selected={formData.to_date}
                        onChange={(date) =>
                          setFormData((prev) => ({
                            ...prev,
                            to_date: date,
                          }))
                        }
                        dateFormat="dd-MM-yyyy"
                        className="w-full border px-3 py-2 pr-10"
                        placeholderText="End Date"
                        minDate={formData.from_date || undefined}
                      />

                      <Calendar
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                      />
                    </div>
                  </div>

                  {(errors.from_date || errors.to_date) && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.from_date || errors.to_date}
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Highlights
                </label>

                <Editor
                  apiKey="no-api-key"
                  tinymceScriptSrc="/tinymce/tinymce.min.js"
                  value={formData.highlight}
                  onEditorChange={(content) =>
                    setFormData({
                      ...formData,
                      highlight: content,
                    })
                  }
                  init={{
                    height: 350,
                    menubar: true,
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
                      "bullist numlist outdent indent | " +
                      "link image table | code fullscreen",

                    branding: false,
                    promotion: false,
                    resize: true,
                  }}
                />
              </div>

              {/* FULL WIDTH BUTTON ROW */}
              <div className="md:col-span-3 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-[#4f7f82] text-white px-5 py-2 rounded"
                >
                  Save
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
      {showMainDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-xl w-[420px] overflow-hidden">
            {/* HEADER */}
            <div className=" text-white px-5 py-3">
              <h2 className="text-lg text-[#4f7f82] font-semibold">Delete Confirmation</h2>
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
                  setShowMainDeleteModal(false);
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
                  setSelectedSeminarId(null);
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
                Conference / Seminar / Training / Workshop Attended
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
              <div className="mt-4 mb-2 p-3 text-sm ">
                <label>
                  <span className="font-semibold">Upload Note:</span>
                  Participation Certificate
                </label>
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

                    if (!file || !selectedSeminarId) return;

                    const today = new Date().toISOString().split("T")[0];

                    const formData = new FormData();

                    formData.append("file", file);

                    formData.append("twca_id", String(selectedSeminarId));

                    formData.append("user_id", "1");

                    formData.append("actual_date", today);

                    const data = await uploadSeminarWorkshopFile(formData);

                    if (data.status) {
                      toast.success("Uploaded Successfully");

                      loadUploadedFiles(selectedSeminarId);
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
                  setSelectedSeminarId(null);
                  setUploadedFiles([]);
                }}
              >
                Close
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ==========================
DELETE MODAL
========================== */}
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

export default SeminarWorkshopAttendedPage;
