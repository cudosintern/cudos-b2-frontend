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
  getConferenceSeminarList,
  getDropdowns,
  saveConferenceSeminar,
  updateConferenceSeminar,
  deleteConferenceSeminar,
} from "./conferenceSeminarWorkshopOrganizedApi";
interface DropdownOption {
  id: number;
  name: string;
}

interface SeminarItem {
  id?: number;

  program_title: string;
  type: number | string;
  level: number | string;

  event_organizer: string;
  collaboration: string;

  start_date: Date | null;
  end_date: Date | null;

  sponsored_by: string;
  your_role: string;

  duration_hours: string;
  duration_minutes: string;

  no_of_participants: string;

  venue: string;
  amount: string;

  days: string;

  highlights: string;

  level_name?: string;
  type_name?: string;
}

interface DropdownResponse {
  types: DropdownOption[];
  levels: DropdownOption[];
}

interface CommonApiResponse {
  status: boolean;
  message: string;
}

type ColumnKey =
  | "program_title"
  | "level_name"
  | "event_organizer"
  | "collaboration"
  | "date"
  | "sponsored_by"
  | "your_role";

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
const ConferenceSeminarWorkshopOrganizedPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(true);

  const [tableData, setTableData] = useState<SeminarItem[]>([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      program_title: "",
      level_name: "",
      event_organizer: "",
      collaboration: "",
      date: "",
      sponsored_by: "",
      your_role: "",
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

  const [entriesPerPage, setEntriesPerPage] = useState(20);

  const [currentPage, setCurrentPage] = useState(1);

  const [editId, setEditId] = useState<number | null>(null);

  const [typeDropdown, setTypeDropdown] = useState<DropdownOption[]>([]);

  const [levelDropdown, setLevelDropdown] = useState<DropdownOption[]>([]);

  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState<any>({
    program_title: "",
    type: "",
    event_organizer: "",
    no_of_participants: "",
    venue: "",
    amount: "",

    duration_hours: "",
    duration_minutes: "",
    level: "",
    collaboration: "",
    your_role: "",
    start_date: null,
    end_date: null,
    days: "",
    sponsored_by: "",
    highlights: "",
  });

  // ==========================
  // FETCH DATA
  // ==========================
  useEffect(() => {
    fetchTableData();
    fetchDropdowns();
  }, []);

  const fetchTableData = async () => {
    try {
      setLoading(true);

      const data = (await getConferenceSeminarList()) as SeminarItem[];

      const formatted = data.map((item: SeminarItem) => ({
        ...item,
        start_date: item.start_date ? new Date(item.start_date) : null,

        end_date: item.end_date ? new Date(item.end_date) : null,
      }));

      setTableData(formatted || []);
    } catch (error) {
      console.error(error);

      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const data = (await getDropdowns()) as DropdownResponse;

      setTypeDropdown(data.types || []);
      setLevelDropdown(data.levels || []);

      setFormData((prev: any) => ({
        ...prev,
        type: data.types?.length ? data.types[0].id : "",
        level: data.levels?.length ? data.levels[0].id : "",
      }));
    } catch (error) {
      toast.error("Failed to fetch dropdowns");
    }
  };

  // ==========================
  // VALIDATION
  // ==========================
  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.program_title?.trim()) {
      newErrors.program_title = "Program Title is required";
    }

    if (!formData.type) {
      newErrors.type = "Type is required";
    }

    if (!formData.level) {
      newErrors.level = "Level is required";
    }

    if (!formData.your_role?.trim()) {
      newErrors.your_role = "Your Role is required";
    }

    // START DATE
    if (!formData.start_date) {
      newErrors.start_date = "Start Date is required";
    }

    // END DATE
    if (!formData.end_date) {
      newErrors.end_date = "End Date is required";
    }

    if (
      formData.start_date &&
      formData.end_date &&
      formData.end_date < formData.start_date
    ) {
      newErrors.end_date = "End Date cannot be less than Start Date";
    }

    // DAYS
    if (formData.days !== "" && Number(formData.days) < 0) {
      newErrors.days = "Negative numbers are not allowed";
    }

    // PARTICIPANTS
    if (
      formData.no_of_participants !== "" &&
      Number(formData.no_of_participants) < 0
    ) {
      newErrors.no_of_participants = "Negative numbers are not allowed";
    }

    // HOURS
    if (formData.duration_hours !== "" && Number(formData.duration_hours) < 0) {
      newErrors.duration_hours = "Negative numbers are not allowed";
    }

    // MINUTES
    if (
      formData.duration_minutes !== "" &&
      Number(formData.duration_minutes) < 0
    ) {
      newErrors.duration_minutes = "Negative numbers are not allowed";
    }

    if (!formData.sponsored_by?.trim()) {
      newErrors.sponsored_by = "Sponsored By is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ==========================
  // DATE FORMAT
  // ==========================
  const formatDate = (date: Date | null) => {
    if (!date) return "";

    return date.toISOString().split("T")[0];
  };

  // ==========================
  // SAVE
  // ==========================
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,

        duration_hours:
          formData.duration_hours === "" ? 0 : Number(formData.duration_hours),

        duration_minutes:
          formData.duration_minutes === ""
            ? 0
            : Number(formData.duration_minutes),

        no_of_participants:
          formData.no_of_participants === ""
            ? 0
            : Number(formData.no_of_participants),

        amount: formData.amount === "" ? 0 : Number(formData.amount),

        days: formData.days === "" ? 0 : Number(formData.days),

        start_date: formatDate(formData.start_date),

        end_date: formatDate(formData.end_date),

        user_id: 1,
        created_by: 1,
        modified_by: 1,
      };

      let result: CommonApiResponse;

      if (editId) {
        result = await updateConferenceSeminar(editId, payload);
      } else {
        result = await saveConferenceSeminar(payload);
      }

      if (result.status) {
        toast.success(editId ? "Updated Successfully" : "Saved Successfully");

        resetForm();

        fetchTableData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);

      toast.error("Save failed");
    }
  };

  // ==========================
  // EDIT
  // ==========================
  const handleEdit = (item: SeminarItem) => {
    setEditId(item.id || null);

    setFormData({
      ...item,
    });

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 200);
  };

  // ==========================
  // DELETE
  // ==========================
  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      const result: CommonApiResponse = await deleteConferenceSeminar(
        deleteModal.id,
      );

      if (result.status) {
        toast.success("Deleted Successfully");

        fetchTableData();

        setDeleteModal({
          open: false,
          id: null,
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);

      toast.error("Delete failed");
    }
  };

  // ==========================
  // RESET
  // ==========================
  const resetForm = () => {
    setEditId(null);

    setErrors({});

    setFormData({
      program_title: "",
      type: "",
      event_organizer: "",
      no_of_participants: "",
      venue: "",
      amount: "",

      duration_hours: "",
      duration_minutes: "",
      level: "",
      collaboration: "",
      your_role: "",
      start_date: null,
      end_date: null,
      days: "",
      sponsored_by: "",
      highlights: "",
    });
  };

  // ==========================
  // FILTER
  // ==========================
  const filteredData = useMemo(() => {
    return tableData.filter((item: any) => {
      // GLOBAL SEARCH
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      // COLUMN FILTER
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

        let cellValue = "";

        if (key === "date") {
          cellValue =
            item.start_date && item.end_date
              ? `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`
              : "";
        } else {
          cellValue = (item[key] || "").toString().toLowerCase();
        }

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

  // ==========================
  // PAGINATION
  // ==========================
  const indexOfLast = currentPage * entriesPerPage;

  const indexOfFirst = indexOfLast - entriesPerPage;

  const currentData = filteredData.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: number | null;
  }>({
    open: false,
    id: null,
  });
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedConferenceId, setSelectedConferenceId] = useState<
    number | null
  >(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);
  const loadUploadedFiles = async (conferenceId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/conference-seminar/upload-list/${conferenceId}`,
      );

      const data = await response.json();

      if (data.status) {
        setUploadedFiles(data.data || []);
        setEditableFiles(data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load uploaded files");
    }
  };
  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        await fetch(
          `http://localhost:8000/conference-seminar/upload/update/${file.id}`,
          {
            method: "PUT",
            body: new URLSearchParams({
              description: file.description || "",
              actual_date: file.actual_date || "",
            }),
          },
        );
      }

      toast.success("Updated Successfully");

      if (selectedConferenceId) {
        loadUploadedFiles(selectedConferenceId);
      }
    } catch (error) {
      console.error(error);
      toast.error("Update failed");
    }
  };
  const handleDeleteUpload = async () => {
    if (!uploadDeleteId) return;

    try {
      const response = await fetch(
        `http://localhost:8000/conference-seminar/upload/${uploadDeleteId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.status) {
        toast.success("Deleted Successfully");

        setShowUploadDeleteModal(false);

        if (selectedConferenceId) {
          loadUploadedFiles(selectedConferenceId);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="bg-[#f2f2f2] min-h-screen p-4">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 mb-4">
        <h2 className="text-lg font-semibold">
          Conference / Seminar / Training / Development / Workshop Organized
        </h2>
      </div>

      {/* COLLAPSE HEADER */}
      <div
        className="bg-white border px-4 py-3 flex items-center gap-2 cursor-pointer font-semibold text-[#4f7f82]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "▼" : "▶"}

        <span>
          Conference / Seminar / Training / Development / Workshop Organized
        </span>
      </div>

      {isOpen && (
        <div className="bg-white border border-t-0 p-6">
          {/* TABLE TOP */}
          <div className="flex justify-between items-center mb-4">
            <div>
              Show{" "}
              <select
                className="border px-2 py-1"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>

                <option value={20}>20</option>

                <option value={50}>50</option>
              </select>{" "}
              entries
            </div>

            <div>
              Search:{" "}
              <input
                type="text"
                className="border px-2 py-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="w-full overflow-auto border max-h-[500px]">
            <table className="min-w-[1400px] w-full border-collapse text-sm">
              <thead className="bg-[#f3f3f3] sticky top-0 z-10">
                <tr>
                  {(
                    [
                      {
                        key: "program_title",
                        label: "Program Title",
                      },
                      {
                        key: "level_name",
                        label: "Level",
                      },
                      {
                        key: "event_organizer",
                        label: "Event Organizer",
                      },
                      {
                        key: "collaboration",
                        label: "Collaboration",
                      },
                      {
                        key: "date",
                        label: "Date",
                      },
                      {
                        key: "sponsored_by",
                        label: "Sponsored By",
                      },
                      {
                        key: "your_role",
                        label: "Your Role",
                      },
                    ] as {
                      key: ColumnKey;
                      label: string;
                    }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="border px-3 py-3 relative text-left"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>{col.label}</span>

                        <Filter
                          size={16}
                          strokeWidth={2}
                          className="cursor-pointer text-black hover:text-blue-600 flex-shrink-0"
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

                  <th className="border px-3 py-3 text-center">Upload</th>

                  <th className="border px-3 py-3 text-center">Edit</th>

                  <th className="border px-3 py-3 text-center">Delete</th>
                </tr>
              </thead>

              <tbody>
                {currentData.length > 0 ? (
                  (() => {
                    // GROUP DATA BY TYPE
                    const groupedData = currentData.reduce(
                      (acc: any, item: any) => {
                        const key = item.type_name || "--";

                        if (!acc[key]) {
                          acc[key] = [];
                        }

                        acc[key].push(item);

                        return acc;
                      },
                      {},
                    );

                    return Object.entries(groupedData).map(
                      ([typeName, items]: any, groupIndex: number) => (
                        <React.Fragment key={groupIndex}>
                          {/* TYPE HEADER */}
                          <tr className="bg-gray-300">
                            <td
                              colSpan={10}
                              className="border px-3 py-3 font-semibold text-black text-left"
                            >
                              {typeName}
                            </td>
                          </tr>

                          {/* TYPE ROWS */}
                          {items.map((item: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {/* PROGRAM TITLE */}
                              <td className="border px-3 py-2">
                                {item.program_title || "--"}
                              </td>

                              {/* LEVEL */}
                              <td className="border px-3 py-2">
                                {item.level_name || "--"}
                              </td>

                              {/* EVENT ORGANIZER */}
                              <td className="border px-3 py-2">
                                {item.event_organizer || "--"}
                              </td>

                              {/* COLLABORATION */}
                              <td className="border px-3 py-2">
                                {item.collaboration || "--"}
                              </td>

                              {/* DATE */}
                              <td className="border px-3 py-2 whitespace-nowrap">
                                {formatDate(item.start_date)} -{" "}
                                {formatDate(item.end_date)}
                              </td>

                              {/* SPONSORED BY */}
                              <td className="border px-3 py-2">
                                {item.sponsored_by || "--"}
                              </td>

                              {/* YOUR ROLE */}
                              <td className="border px-3 py-2">
                                {item.your_role || "--"}
                              </td>

                              {/* UPLOAD */}
                              <td className="border px-3 py-2 text-center">
                                <button
                                  className="text-[#4f7f82] flex items-center gap-1 justify-center mx-auto"
                                  onClick={() => {
                                    setSelectedConferenceId(item.id || null);
                                    setShowUploadModal(true);

                                    if (item.id) {
                                      loadUploadedFiles(item.id);
                                    }
                                  }}
                                >
                                  <Upload size={15} />
                                  Upload
                                </button>
                              </td>

                              {/* EDIT */}
                              <td className="border px-3 py-2 text-center">
                                <button
                                  className="text-yellow-600"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Pencil size={15} />
                                </button>
                              </td>

                              {/* DELETE */}
                              <td className="border px-3 py-2 text-center">
                                <button
                                  onClick={() =>
                                    setDeleteModal({
                                      open: true,
                                      id: item.id || null,
                                    })
                                  }
                                  className="text-red-600"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ),
                    );
                  })()
                ) : (
                  <tr>
                    <td colSpan={10} className="border px-3 py-4 text-center">
                      {loading ? "Loading..." : "No Data Found"}
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
          <div ref={formRef} className="border-t mt-8 pt-6">
            <h3 className="text-[#4f7f82] font-semibold text-lg mb-6">
              Add/ Edit Conference / Seminar / Training / Development / Workshop Organized
            </h3>
            {/* 3 ROW LAYOUT */}
            <div className="space-y-5">
              {/* ROW 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* PROGRAM TITLE */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Program Title:
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={formData.program_title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        program_title: e.target.value,
                      })
                    }
                    className="border px-3 py-2 w-full rounded text-sm"
                    placeholder="Enter Title"
                  />

                  {errors.program_title && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.program_title}
                    </p>
                  )}
                </div>

                {/* TYPE */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Type:
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: Number(e.target.value),
                      })
                    }
                    className="border px-3 py-2 w-full rounded text-sm"
                  >
                    <option value="">Select Type</option>

                    {typeDropdown.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {errors.type && (
                    <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                  )}
                </div>

                {/* LEVEL */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Select Level:
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: Number(e.target.value),
                      })
                    }
                    className="border px-3 py-2 w-full rounded text-sm"
                  >
                    <option value="">Select Level</option>

                    {levelDropdown.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {errors.level && (
                    <p className="text-red-500 text-xs mt-1">{errors.level}</p>
                  )}
                </div>
              </div>

              {/* ROW 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* EVENT ORGANIZER */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Event Organizer
                  </label>

                  <input
                    type="text"
                    value={formData.event_organizer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        event_organizer: e.target.value,
                      })
                    }
                    className="border px-3 py-2 w-full rounded text-sm"
                    placeholder="Enter Event Organizer"
                  />
                </div>

                {/* COLLABORATION */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Collaboration
                  </label>

                  <input
                    type="text"
                    value={formData.collaboration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        collaboration: e.target.value,
                      })
                    }
                    className="border px-3 py-2 w-full rounded text-sm"
                    placeholder="Enter Collaboration"
                  />
                </div>

                {/* YOUR ROLE */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Your Role:
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={formData.your_role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        your_role: e.target.value,
                      })
                    }
                    className="border px-3 py-2 w-full rounded text-sm"
                    placeholder="Enter Your Role"
                  />

                  {errors.your_role && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.your_role}
                    </p>
                  )}
                </div>
              </div>

              {/* ROW 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* DATE */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Date:
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {/* START DATE */}
                    <div>
                      <div className="relative">
                        <DatePicker
                          selected={formData.start_date}
                          onChange={(date) => {
                            setFormData({
                              ...formData,
                              start_date: date,
                            });

                            setErrors({
                              ...errors,
                              start_date: "",
                            });
                          }}
                          dateFormat="dd-MM-yyyy"
                          className="border px-3 py-2 w-full rounded pr-10 text-sm"
                          placeholderText="Start Date"
                        />

                        <Calendar
                          size={15}
                          className="absolute right-3 top-3 text-gray-500"
                        />
                      </div>

                      {errors.start_date && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.start_date}
                        </p>
                      )}
                    </div>

                    {/* END DATE */}
                    <div>
                      <div className="relative">
                        <DatePicker
                          selected={formData.end_date}
                          onChange={(date) => {
                            setFormData({
                              ...formData,
                              end_date: date,
                            });

                            setErrors({
                              ...errors,
                              end_date: "",
                            });
                          }}
                          minDate={formData.start_date}
                          dateFormat="dd-MM-yyyy"
                          className="border px-3 py-2 w-full rounded pr-10 text-sm"
                          placeholderText="End Date"
                        />

                        <Calendar
                          size={15}
                          className="absolute right-3 top-3 text-gray-500"
                        />
                      </div>

                      {errors.end_date && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.end_date}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* DURATION */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Duration (H:M)
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {/* HOURS */}
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Hours"
                        value={formData.duration_hours}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (/^\d*$/.test(value)) {
                            setFormData({
                              ...formData,
                              duration_hours: value,
                            });

                            setErrors({
                              ...errors,
                              duration_hours: "",
                            });
                          } else {
                            setErrors({
                              ...errors,
                              duration_hours: "Only digits are allowed",
                            });
                          }
                        }}
                        className="border px-3 py-2 rounded text-sm w-full"
                      />

                      {errors.duration_hours && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.duration_hours}
                        </p>
                      )}
                    </div>

                    {/* MINUTES */}
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Minutes"
                        value={formData.duration_minutes}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (/^\d*$/.test(value)) {
                            setFormData({
                              ...formData,
                              duration_minutes: value,
                            });

                            setErrors({
                              ...errors,
                              duration_minutes: "",
                            });
                          } else {
                            setErrors({
                              ...errors,
                              duration_minutes: "Only digits are allowed",
                            });
                          }
                        }}
                        className="border px-3 py-2 rounded text-sm w-full"
                      />

                      {errors.duration_minutes && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.duration_minutes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* PARTICIPANTS */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    No.of Participants
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.no_of_participants}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (/^\d*$/.test(value)) {
                        setFormData({
                          ...formData,
                          no_of_participants: value,
                        });

                        setErrors({
                          ...errors,
                          no_of_participants: "",
                        });
                      } else {
                        setErrors({
                          ...errors,
                          no_of_participants: "Only digits are allowed",
                        });
                      }
                    }}
                    className="border px-3 py-2 w-full rounded text-sm"
                    placeholder="Enter Participants"
                  />

                  {errors.no_of_participants && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.no_of_participants}
                    </p>
                  )}
                </div>
              </div>

              {/* ROW 4 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {/* DAYS */}
                <div>
                  <label className="block mb-1 text-sm font-medium">Days</label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.days}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (/^\d*$/.test(value)) {
                        setFormData({
                          ...formData,
                          days: value,
                        });

                        setErrors({
                          ...errors,
                          days: "",
                        });
                      } else {
                        setErrors({
                          ...errors,
                          days: "Only digits are allowed",
                        });
                      }
                    }}
                    className="border px-3 py-2 w-full rounded text-sm"
                    placeholder="Enter Days"
                  />

                  {errors.days && (
                    <p className="text-red-500 text-xs mt-1">{errors.days}</p>
                  )}
                </div>

                {/* AMOUNT */}
                {/* AMOUNT */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Amount
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.amount}
                    onChange={(e) => {
                      const value = e.target.value;

                      // only digits allowed
                      if (/^\d*$/.test(value)) {
                        setFormData({
                          ...formData,
                          amount: value,
                        });

                        setErrors({
                          ...errors,
                          amount: "",
                        });
                      } else {
                        setErrors({
                          ...errors,
                          amount: "Only digits are allowed",
                        });
                      }
                    }}
                    className="border px-3 py-2 w-full rounded text-sm"
                    placeholder="Enter Amount"
                  />

                  {errors.amount && (
                    <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                  )}
                </div>

                {/* VENUE */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Venue
                  </label>

                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venue: e.target.value,
                      })
                    }
                    className="border px-3 py-2 w-full rounded text-sm"
                    placeholder="Enter Venue"
                  />
                </div>

                {/* SPONSORED BY */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Sponsored By:
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={formData.sponsored_by}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sponsored_by: e.target.value,
                      })
                    }
                    className="border px-3 py-2 w-full rounded text-sm"
                    placeholder="Enter Sponsor"
                  />

                  {errors.sponsored_by && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.sponsored_by}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* HIGHLIGHTS */}
            <div className="mt-8">
              <label className="block mb-2 text-sm font-medium">
                Highlights
              </label>

              <Editor
                apiKey="no-api-key"
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                value={formData.highlights}
                onEditorChange={(content) =>
                  setFormData({
                    ...formData,
                    highlights: content,
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

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleSave}
                className="bg-[#4f7f82] hover:bg-[#3d6668] text-white px-6 py-2 rounded"
              >
                Save
              </button>

              <button
                onClick={resetForm}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[350px]">
            <h2 className="text-lg font-semibold mb-4 text-[#4f7f82]">
              Confirm Delete
            </h2>

            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete this record?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    id: null,
                  })
                }
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="bg-[#4f7f82] hover:bg-[#3d6668] text-white px-4 py-2 rounded"
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
            <div className="text-[#4f7f82] px-5 py-3 flex justify-between items-center rounded-t">
              <h2 className="text-[18px] font-semibold">Uploaded Files</h2>

              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedConferenceId(null);
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
                Conference / Seminar / Training / Workshop Organized
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

                    if (!file || !selectedConferenceId) return;

                    const today = new Date().toISOString().split("T")[0];

                    const formData = new FormData();

                    formData.append("file", file);

                    formData.append("twc_id", String(selectedConferenceId));

                    formData.append("user_id", "1");

                    formData.append("actual_date", today);

                    const response = await fetch(
                      "http://localhost:8000/conference-seminar/upload",
                      {
                        method: "POST",
                        body: formData,
                      },
                    );

                    const data = await response.json();

                    if (data.status) {
                      toast.success("Uploaded Successfully");

                      loadUploadedFiles(selectedConferenceId);
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
                  setSelectedConferenceId(null);
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

export default ConferenceSeminarWorkshopOrganizedPage;
