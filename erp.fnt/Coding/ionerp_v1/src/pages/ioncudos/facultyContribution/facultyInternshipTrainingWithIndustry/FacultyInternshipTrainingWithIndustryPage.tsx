import React, { useMemo, useRef, useState } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Calendar,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useEffect } from "react";

import {
  getInternshipTrainingData,
  createInternshipTrainingData,
  updateInternshipTrainingData,
  deleteInternshipTrainingData,
  getDurationUnits,
} from "./facultyInternshipTrainingWithIndustryApi";

type ColumnKey =
  | "user_itci_name"
  | "user_itci_comp_place"
  | "duration"
  | "ass_year"
  | "outcome_itci";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

interface InternshipItem {
  fc_itci_id: number;

  user_itci_name: string;

  user_itci_comp_place: string;

  duration: string;

  duration_unit: number;

  duration_unit_name?: string;

  ass_year: string;

  outcome_itci: string;
}

const FacultyInternshipTrainingWithIndustryPage: React.FC = () => {
  // ================= STATES =================

  const [tableData, setTableData] = useState<InternshipItem[]>([]);
  const [durationUnits, setDurationUnits] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    internship_name: "",
    company_place: "",
    duration: "",
    duration_type: "",
    year: null as Date | null,
    outcome: "",
  });
  useEffect(() => {
    fetchInternshipList();

    fetchDurationUnits();
  }, []);
  const fetchInternshipList = async () => {
    try {
      const response = await getInternshipTrainingData(1);

      setTableData(response || []);
    } catch (error) {
      console.error(error);

      toast.error("Failed to fetch data");
    }
  };

  const fetchDurationUnits = async () => {
    try {
      const response = await getDurationUnits();

      setDurationUnits(response || []);
    } catch (error) {
      console.error(error);
    }
  };
  const [errors, setErrors] = useState<any>({});

  const [search, setSearch] = useState("");

  const [entriesPerPage, setEntriesPerPage] = useState(20);

  const [currentPage, setCurrentPage] = useState(1);

  const [editId, setEditId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // ================= VALIDATION =================

  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.internship_name.trim()) {
      newErrors.internship_name =
        "Internship/Training/Collaboration is required";
    }

    if (!formData.company_place.trim()) {
      newErrors.company_place = "Company and Place is required";
    }

    if (!formData.duration.trim()) {
      newErrors.duration = "Duration is required";
    } else if (!/^\d+$/.test(formData.duration)) {
      newErrors.duration = "Only digits are allowed";
    }

    if (!formData.duration_type) {
      newErrors.duration_type = "Select duration type";
    }

    if (!formData.year) {
      newErrors.year = "Year is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ================= SAVE =================

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        user_itci_name: formData.internship_name,

        user_itci_comp_place: formData.company_place,

        duration: Number(formData.duration),

        duration_unit: Number(formData.duration_type),

        ass_year: formData.year
          ? formData.year.toISOString().split("T")[0]
          : null,

        outcome_itci: formData.outcome,
      };

      if (editId) {
        await updateInternshipTrainingData(editId, payload);

        toast.success("Updated successfully");
      } else {
        await createInternshipTrainingData(payload);

        toast.success("Saved successfully");
      }

      fetchInternshipList();

      resetForm();
    } catch (error) {
      console.error(error);

      toast.error("Something went wrong");
    }
  };

  // ================= EDIT =================

  const handleEdit = (item: InternshipItem) => {
    setEditId(item.fc_itci_id);

    setFormData({
      internship_name: item.user_itci_name,

      company_place: item.user_itci_comp_place,

      duration: String(item.duration),

      duration_type: String(item.duration_unit),

      year: item.ass_year ? new Date(item.ass_year) : null,

      outcome: item.outcome_itci,
    });

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // ================= DELETE =================

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteInternshipTrainingData(deleteId);

      toast.success("Deleted successfully");

      fetchInternshipList();

      setShowDeleteModal(false);

      setDeleteId(null);
    } catch (error) {
      console.error(error);

      toast.error("Delete failed");
    }
  };

  // ================= RESET =================

  const resetForm = () => {
    setEditId(null);

    setFormData({
      internship_name: "",
      company_place: "",
      duration: "",
      duration_type: "",
      year: null,
      outcome: "",
    });

    setErrors({});
  };

  // ================= SEARCH =================

  // FILTER STATES (MOVE HERE)
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      user_itci_name: "",
      user_itci_comp_place: "",
      duration: "",
      ass_year: "",
      outcome_itci: "",
    },
  );

  // ================= SEARCH =================
  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

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

  // ================= PAGINATION =================

  const indexOfLast = currentPage * entriesPerPage;

  const indexOfFirst = indexOfLast - entriesPerPage;

  const currentData = filteredData.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const [isOpen, setIsOpen] = useState(true);

  const [showUploadModal, setShowUploadModal] = useState(false);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);
  const BASE_URL = "http://127.0.0.1:8000/faculty-internship-training-industry";
  const loadUploadedFiles = async (id: number) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/upload-list/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.status) {
        setUploadedFiles(data.data || []);

        setEditableFiles(data.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ================= SAVE UPLOADED FILES =================

  const handleSaveUploadedFiles = async () => {
    try {
      const token = localStorage.getItem("token");

      for (const file of editableFiles) {
        const formData = new FormData();

        formData.append("description", file.description || "");

        formData.append("actual_date", file.actual_date || "");

        await fetch(`${BASE_URL}/upload/update/${file.id}`, {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        });
      }

      toast.success("Updated Successfully");

      if (selectedId) {
        loadUploadedFiles(selectedId);
      }
    } catch (error) {
      console.error(error);

      toast.error("Update Failed");
    }
  };

  // ================= DELETE UPLOAD =================

  const handleDeleteUpload = async () => {
    if (!uploadDeleteId) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/upload/${uploadDeleteId}`, {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.status) {
        toast.success("Deleted Successfully");

        setShowUploadDeleteModal(false);

        if (selectedId) {
          loadUploadedFiles(selectedId);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);

      toast.error("Delete Failed");
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveFilter("");
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // ================= UI =================

  return (
    <div className="bg-[#f5f5f5] min-h-screen p-4">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 mb-4">
        <h2 className="text-lg font-semibold">
          Faculty Internship/Training/Collaboration with Industry
        </h2>
      </div>

      {/* COLLAPSE HEADER */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border px-4 py-3 flex items-center gap-2 cursor-pointer font-semibold text-[#4f7f82]"
      >
        {isOpen ? "▼" : "▶"}

        <span>Faculty Internship/Training/Collaboration with Industry</span>
      </div>

      {/* CONTENT */}
      {isOpen && (
        <div className="bg-white border border-gray-300 p-5">
          {/* TOP BAR */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-sm">
              <span>Show</span>

              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 w-[80px]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <span>entries</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span>Search:</span>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 w-[220px]"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-gray-300 w-full">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#f3f3f3]">
                <tr className="bg-[#f3f3f3]">
                  <th className="border border-gray-300 px-6 py-5 text-left w-[80px] min-w-[80px]">
                    Sl No.
                  </th>

                  {(
                    [
                      {
                        key: "user_itci_name",
                        label: "Name of the Internship/Training/Collaboration",
                        width: "min-w-[350px]",
                      },
                      {
                        key: "user_itci_comp_place",
                        label: "Name of the Company and Place",
                        width: "min-w-[280px]",
                      },
                      {
                        key: "duration",
                        label: "Duration",
                        width: "min-w-[140px]",
                      },
                      {
                        key: "ass_year",
                        label: "Year",
                        width: "min-w-[160px]",
                      },
                      {
                        key: "outcome_itci",
                        label: "Outcome of Internship/Training/Collaboration",
                        width: "min-w-[350px]",
                      },
                    ] as {
                      key: ColumnKey;
                      label: string;
                      width: string;
                    }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className={`border border-gray-300 px-6 py-5 text-left relative ${col.width}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{col.label}</span>

                        <Filter
                          size={16}
                          className="cursor-pointer flex-shrink-0"
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
                              setFilterType((prev) => ({
                                ...prev,
                                [col.key]: e.target.value as FilterType,
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
                                  setColumnFilters((prev) => ({
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

                  <th className="border border-gray-300 px-6 py-5 text-left w-[120px]">
                    Upload
                  </th>

                  <th className="border border-gray-300 px-6 py-5 text-left w-[90px]">
                    Edit
                  </th>

                  <th className="border border-gray-300 px-6 py-5 text-left w-[90px]">
                    Delete
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((item, index) => (
                    <tr key={item.fc_itci_id}>
                      <td className="border border-gray-300 px-3 py-3">
                        {indexOfFirst + index + 1}
                      </td>

                      <td className="border border-gray-300 px-3 py-3">
                        {item.user_itci_name}
                      </td>

                      <td className="border border-gray-300 px-3 py-3">
                        {item.user_itci_comp_place}
                      </td>

                      <td className="border border-gray-300 px-3 py-3">
                        {item.duration}
                      </td>

                      <td className="border border-gray-300 px-3 py-3">
                        {item.ass_year}
                      </td>

                      <td className="border border-gray-300 px-3 py-3">
                        {item.outcome_itci}
                      </td>

                      {/* UPLOAD */}
                      <td className="border border-gray-300 px-3 py-3">
                        <button
                          onClick={() => {
                            setSelectedId(item.fc_itci_id);

                            setShowUploadModal(true);

                            loadUploadedFiles(item.fc_itci_id);
                          }}
                          className="text-[#4f7f82] flex items-center gap-1"
                        >
                          <Upload size={15} />
                          Upload
                        </button>
                      </td>

                      {/* EDIT */}
                      <td className="border border-gray-300 px-3 py-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-yellow-600"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>

                      {/* DELETE */}
                      <td className="border border-gray-300 px-3 py-3">
                        <button
                          onClick={() => {
                            setDeleteId(item.fc_itci_id);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="border border-gray-300 text-center py-5"
                    >
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm">
              Showing {filteredData.length > 0 ? indexOfFirst + 1 : 0} to{" "}
              {Math.min(indexOfLast, filteredData.length)} of{" "}
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
          <div ref={formRef} className="border-t border-gray-300 mt-8 pt-8">
            <h3 className="text-[#4f7f82] font-semibold text-lg mb-6">
              Add / Edit Faculty Internship/Training/Collaboration with Industry
            </h3>

            <div className="grid grid-cols-2 gap-x-24 gap-y-8">
              {/* INTERNSHIP */}
              <div>
                <label className="block mb-2 text-sm">
                  Internship/Training/Collaboration :
                  <span className="text-red-500">*</span>
                </label>

                <textarea
                  value={formData.internship_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      internship_name: e.target.value,
                    })
                  }
                  placeholder="Internship/Training/Collaboration"
                  className="w-full border border-gray-300 rounded px-3 py-2 h-[50px]"
                />

                {errors.internship_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.internship_name}
                  </p>
                )}
              </div>

              {/* DURATION */}
              <div>
                <label className="block mb-2 text-sm">
                  Duration :<span className="text-red-500">*</span>
                </label>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => {
                      const value = e.target.value;

                      setFormData({
                        ...formData,
                        duration: value,
                      });

                      // Dynamic validation
                      if (value && !/^\d+$/.test(value)) {
                        setErrors((prev: any) => ({
                          ...prev,
                          duration: "Only digits are allowed",
                        }));
                      } else {
                        setErrors((prev: any) => ({
                          ...prev,
                          duration: "",
                        }));
                      }
                    }}
                    placeholder="Enter Duration"
                    className={`w-full border rounded px-3 py-2 ${
                      errors.duration ? "border-red-500" : "border-gray-300"
                    }`}
                  />

                  <select
                    value={formData.duration_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_type: e.target.value,
                      })
                    }
                    className="border border-gray-300 rounded px-3 py-2 w-[180px]"
                  >
                    <option value="">Select Duration</option>

                    {durationUnits.map((unit) => (
                      <option key={unit.unit_id} value={unit.unit_id}>
                        {unit.unit_name}
                      </option>
                    ))}
                  </select>
                </div>

                {(errors.duration || errors.duration_type) && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.duration || errors.duration_type}
                  </p>
                )}
              </div>

              {/* COMPANY */}
              <div>
                <label className="block mb-2 text-sm">
                  Company and Place :<span className="text-red-500">*</span>
                </label>

                <textarea
                  value={formData.company_place}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_place: e.target.value,
                    })
                  }
                  placeholder="Enter Company and Place"
                  className="w-full border border-gray-300 rounded px-3 py-2 h-[50px]"
                />

                {errors.company_place && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.company_place}
                  </p>
                )}
              </div>

              {/* OUTCOME */}
              <div>
                <label className="block mb-2 text-sm">Outcome/Result :</label>

                <textarea
                  value={formData.outcome}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      outcome: e.target.value,
                    })
                  }
                  placeholder="Outcome / Result"
                  className="w-full border border-gray-300 rounded px-3 py-2 h-[50px]"
                />
              </div>

              {/* YEAR */}
              <div>
                <label className="block mb-2 text-sm">
                  Year :<span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <DatePicker
                    selected={formData.year}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        year: date,
                      })
                    }
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Select Year"
                    className={`w-full border rounded px-3 py-2 pr-10 text-sm ${
                      errors.year ? "border-red-500" : "border-gray-300"
                    }`}
                  />

                  <Calendar
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>

                {errors.year && (
                  <p className="text-red-500 text-sm mt-1">{errors.year}</p>
                )}
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 mt-10">
              <button
                onClick={handleSave}
                className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-6 py-2 rounded flex items-center gap-2"
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
      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-[350px]">
            <h2 className="text-lg font-semibold mb-4">Delete Confirmation</h2>

            <p className="mb-6">Do you want to delete this record?</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-red-600 px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="bg-[#4f7f82] text-white px-4 py-2 rounded"
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

                  setSelectedId(null);

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
                Faculty Internship/Training/Collaboration with Industry
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

                    if (!file || !selectedId) return;

                    const today = new Date().toISOString().split("T")[0];

                    const uploadForm = new FormData();

                    uploadForm.append("file", file);

                    uploadForm.append(
                      "internship_training_id",
                      String(selectedId),
                    );

                    uploadForm.append("user_id", "1");

                    uploadForm.append("actual_date", today);

                    const token = localStorage.getItem("token");

                    const response = await fetch(`${BASE_URL}/upload`, {
                      method: "POST",

                      headers: {
                        Authorization: `Bearer ${token}`,
                      },

                      body: uploadForm,
                    });

                    const data = await response.json();

                    if (data.status) {
                      toast.success("Uploaded Successfully");

                      loadUploadedFiles(selectedId);
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

                  setSelectedId(null);

                  setUploadedFiles([]);
                }}
              >
                Close
              </label>
            </div>
          </div>
        </div>
      )}

      {/* DELETE FILE MODAL */}
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

export default FacultyInternshipTrainingWithIndustryPage;
