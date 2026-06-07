import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";
import "./AwardHonorsPage.css";
import DatePicker from "react-datepicker";
import {
  Pencil,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
} from "lucide-react";

import {
  getAwards,
  saveAward,
  updateAward,
  deleteAward,
  uploadAwardFile,
  getAwardUploadedFiles,
  updateAwardUploadFile,
  deleteAwardUploadFile,
} from "./awardHonorsApi";

interface AwardItem {
  id: number;
  awarded_name: string;
  awarded_for: string;
  awarded_organization: string;
  awarded_year: string;
  venue: string;
  award_details: string;
}

type ColumnKey =
  | "awarded_name"
  | "awarded_for"
  | "awarded_organization"
  | "awarded_year";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

const AwardHonorsPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement | null>(null);

  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>({
    awarded_name: "contains",
    awarded_for: "contains",
    awarded_organization: "contains",
    awarded_year: "contains",
  });

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      awarded_name: "",
      awarded_for: "",
      awarded_organization: "",
      awarded_year: "",
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

  const [formData, setFormData] = useState({
    awarded_name: "",
    awarded_for: "",
    awarded_organization: "",
    awarded_year: null as Date | null,
    venue: "",
    award_details: "",
  });
  const [errors, setErrors] = useState({
    awarded_name: "",
    awarded_for: "",
    awarded_year: "",
    awarded_organization: "",
    venue: "",
    award_details: "",
  });
  const validateForm = () => {
    const newErrors = {
      awarded_name: "",
      awarded_for: "",
      awarded_year: "",
      awarded_organization: "",
      venue: "",
      award_details: "",
    };

    let isValid = true;

    // Awarded Name
    if (!formData.awarded_name.trim()) {
      newErrors.awarded_name = "Awarded Name is required";
      isValid = false;
    }

    // Awarded For
    if (!formData.awarded_for.trim()) {
      newErrors.awarded_for = "Awarded For is required";
      isValid = false;
    }

    // Awarded Year
    if (!formData.awarded_year) {
      newErrors.awarded_year = "Awarded Year is required";
      isValid = false;
    }

    // Length validations
    if (formData.awarded_name.length > 255) {
      newErrors.awarded_name = "Awarded Name should not exceed 255 characters";
      isValid = false;
    }

    if (formData.awarded_organization.length > 500) {
      newErrors.awarded_organization =
        "Organization should not exceed 500 characters";
      isValid = false;
    }

    if (formData.venue.length > 500) {
      newErrors.venue = "Venue should not exceed 500 characters";
      isValid = false;
    }

    setErrors(newErrors);

    return isValid;
  };

  // ================= FETCH DATA =================
  const fetchAwards = async () => {
    try {
      const data = await getAwards();

      if (data.status) {
        setAwards(data.data || []);
      } else {
        toast.error(data.message || "Failed to load data");
      }
    } catch (error: any) {
      toast.error(error.message || "Error fetching data");
    }
  };

  useEffect(() => {
    fetchAwards();
  }, []);

  // ================= SAVE / UPDATE =================
  const handleSave = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      const payload = {
        ...formData,
        awarded_year: formData.awarded_year
          ? formData.awarded_year.getFullYear().toString()
          : "",
      };

      const data = editId
        ? await updateAward(editId, payload)
        : await saveAward(payload);

      if (data.status) {
        toast.success(editId ? "Updated successfully" : "Saved successfully");

        resetForm();

        fetchAwards();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Error saving data");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id: number) => {
    try {
      const data = await deleteAward(id);

      if (data.status) {
        toast.success("Deleted successfully");

        fetchAwards();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Delete error");
    }
  };

  // ================= EDIT =================
  const handleEdit = (item: AwardItem) => {
    setEditId(item.id);

    setFormData({
      awarded_name: item.awarded_name,
      awarded_for: item.awarded_for,
      awarded_organization: item.awarded_organization,
      awarded_year: item.awarded_year
        ? new Date(`${item.awarded_year}-01-01`)
        : null,
      venue: item.venue,
      award_details: item.award_details,
    });

    formRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // ================= RESET =================
  const resetForm = () => {
    setEditId(null);

    setFormData({
      awarded_name: "",
      awarded_for: "",
      awarded_organization: "",
      awarded_year: null,
      venue: "",
      award_details: "",
    });
    setErrors({
      awarded_name: "",
      awarded_for: "",
      awarded_year: "",
      awarded_organization: "",
      venue: "",
      award_details: "",
    });
  };

  // ================= FILTER =================
  const filteredData = awards.filter((item) => {
    const globalSearch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesColumnFilters = (
      Object.keys(columnFilters) as ColumnKey[]
    ).every((key) => {
      const filterValue = columnFilters[key]?.toLowerCase();

      if (!filterValue) return true;

      let cellValue = "";

      switch (key) {
        case "awarded_name":
          cellValue = item.awarded_name || "";
          break;

        case "awarded_for":
          cellValue = item.awarded_for || "";
          break;

        case "awarded_organization":
          cellValue = item.awarded_organization || "";
          break;

        case "awarded_year":
          cellValue = item.awarded_year?.toString() || "";
          break;
      }

      cellValue = cellValue.toLowerCase();

      const type = filterType[key];

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

    return globalSearch && matchesColumnFilters;
  });

  const totalPages = Math.ceil(filteredData.length / entries);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * entries,
    currentPage * entries,
  );
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  const [isOpen, setIsOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedAwardId, setSelectedAwardId] = useState<number | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDate, setUploadDate] = useState("");
  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);

  const manualUserId = 1;
  const loadUploadedFiles = async (awardId: number) => {
    try {
      const res = await getAwardUploadedFiles(awardId);

      if (res.status) {
        const formattedFiles = (res.data || []).map((file: any) => ({
          ...file,
          actual_date: file.actual_date ? file.actual_date.split("T")[0] : "",
        }));

        setUploadedFiles(formattedFiles);
        setEditableFiles(formattedFiles);
      }
    } catch (error) {
      toast.error("Failed to load files");
    }
  };

  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        const formData = new FormData();

        formData.append("description", file.description || "");

        formData.append("actual_date", file.actual_date || "");

        await updateAwardUploadFile(file.id, formData);
      }

      toast.success("Files updated successfully");

      if (selectedAwardId) {
        loadUploadedFiles(selectedAwardId);
      }
    } catch (error) {
      toast.error("Failed to update files");
    }
  };

  const confirmUploadDelete = async () => {
    try {
      if (!uploadDeleteId) return;

      const res = await deleteAwardUploadFile(uploadDeleteId);

      if (res.status) {
        toast.success("Deleted Successfully");

        setShowUploadDeleteModal(false);

        if (selectedAwardId) {
          loadUploadedFiles(selectedAwardId);
        }
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen p-4">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 rounded-t flex justify-between mb-6">
        <h2 className="text-lg font-semibold">Award & Honors</h2>
      </div>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border p-3 font-semibold text-[#4f7f82] cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        Award & Honors
      </div>
      {isOpen && (
        <>
          {/* TABLE SECTION */}
          <div className="bg-white border border-t-0 p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm">
                Show{" "}
                <select
                  value={entries}
                  onChange={(e) => {
                    setEntries(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border px-2 py-1 mx-1"
                >
                  {[10, 20, 50, 100].map((num) => (
                    <option key={num}>{num}</option>
                  ))}
                </select>
                entries
              </div>

              <div className="text-sm">
                Search:{" "}
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border px-2 py-1"
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full border border-collapse text-sm">
                <thead className="bg-[#f3f3f3]">
                  <tr>
                    <th className="border px-3 py-2 text-left w-[70px]">
                      Sl No.
                    </th>

                    {[
                      { key: "awarded_name", label: "Awarded Name" },
                      { key: "awarded_for", label: "Awarded For" },
                      {
                        key: "awarded_organization",
                        label: "Awarded Organization",
                      },
                      { key: "awarded_year", label: "Awarded Year" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className="border px-3 py-2 text-left relative"
                      >
                        <div className="flex justify-between items-center">
                          {col.label}

                          <Filter
                            size={14}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();

                              setActiveFilter(
                                activeFilter === col.key
                                  ? ""
                                  : (col.key as ColumnKey),
                              );
                            }}
                          />
                        </div>

                        {activeFilter === col.key && (
                          <div
                            className="absolute bg-white border shadow p-2 mt-2 w-44 z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              className="w-full border mb-2"
                              value={filterType[col.key as ColumnKey]}
                              onChange={(e) =>
                                setFilterType((prev) => ({
                                  ...prev,
                                  [col.key]: e.target.value as FilterType,
                                }))
                              }
                            >
                              <option value="contains">Contains</option>
                              <option value="notContains">Not contains</option>
                              <option value="equals">Equals</option>
                              <option value="notEquals">Not equals</option>
                              <option value="startsWith">Starts with</option>
                              <option value="endsWith">Ends with</option>
                              <option value="blank">Blank</option>
                              <option value="notBlank">Not blank</option>
                            </select>

                            {filterType[col.key as ColumnKey] !== "blank" &&
                              filterType[col.key as ColumnKey] !==
                                "notBlank" && (
                                <input
                                  className="w-full border px-2 py-1"
                                  value={columnFilters[col.key as ColumnKey]}
                                  onChange={(e) =>
                                    setColumnFilters((prev) => ({
                                      ...prev,
                                      [col.key]: e.target.value,
                                    }))
                                  }
                                />
                              )}
                          </div>
                        )}
                      </th>
                    ))}

                    <th className="border px-3 py-2 text-left">
                      Award Details
                    </th>

                    <th className="border px-3 py-2 text-center">Upload</th>

                    <th className="border px-3 py-2 text-center">Edit</th>

                    <th className="border px-3 py-2 text-center">Delete</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border px-3 py-2">
                          {(currentPage - 1) * entries + index + 1}
                        </td>

                        <td className="border px-3 py-2">
                          {item.awarded_name}
                        </td>

                        <td className="border px-3 py-2">{item.awarded_for}</td>

                        <td className="border px-3 py-2">
                          {item.awarded_organization}
                        </td>

                        <td className="border px-3 py-2">
                          {item.awarded_year}
                        </td>

                        <td className="border px-3 py-2">
                          {item.award_details}
                        </td>

                        <td className="border px-3 py-2 text-center">
                          <button
                            className="flex items-center gap-1 text-[#4f7f82] hover:text-[#4f7f82] mx-auto"
                            onClick={async () => {
                              setSelectedAwardId(item.id);

                              setShowUploadModal(true);

                              await loadUploadedFiles(item.id);
                            }}
                          >
                            <Upload size={16} />
                            <span>Upload</span>
                          </button>
                        </td>

                        <td className="border px-3 py-2 text-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-yellow-600 hover:text-yellow"
                          >
                            <Pencil size={16} />
                          </button>
                        </td>

                        <td className="border px-3 py-2 text-center">
                          <button
                            onClick={() => {
                              setDeleteId(item.id);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-4 border">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <div>
                Showing{" "}
                {filteredData.length === 0
                  ? 0
                  : (currentPage - 1) * entries + 1}{" "}
                to {Math.min(currentPage * entries, filteredData.length)} of{" "}
                {filteredData.length} entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className={`border px-3 py-1 flex items-center gap-1 ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                {Array.from({ length: totalPages || 1 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`border px-3 py-1 rounded ${
                      currentPage === i + 1
                        ? "bg-[#4f7f82] text-white"
                        : "bg-[#f3f3f3] hover:bg-gray-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`border px-3 py-1 flex items-center gap-1 ${
                    currentPage === totalPages || totalPages === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div ref={formRef} className="bg-white border border-t-0 p-6">
            <h2 className="text-lg font-semibold text-[#4f7f82] mb-5">
              Add / Edit Award & Honors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
              {/* LEFT */}
              <div className="space-y-5">
                <div className="flex items-start">
                  <label className="w-48 text-sm pt-2">
                    Awarded Name: <span className="text-red-500">*</span>
                  </label>

                  <div className="w-full">
                    <input
                      type="text"
                      value={formData.awarded_name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          awarded_name: e.target.value,
                        });

                        setErrors({
                          ...errors,
                          awarded_name: "",
                        });
                      }}
                      className="border w-full px-3 py-2"
                    />

                    {errors.awarded_name && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.awarded_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <label className="w-48 text-sm pt-2">
                    Awarded Organization:
                  </label>

                  <textarea
                    value={formData.awarded_organization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        awarded_organization: e.target.value,
                      })
                    }
                    className="border w-full px-3 py-2 h-12"
                  />
                </div>

                <div className="flex items-start">
                  <label className="w-48 text-sm pt-2">
                    Awarded for: <span className="text-red-500">*</span>
                  </label>

                  <div className="w-full">
                    <textarea
                      value={formData.awarded_for}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          awarded_for: e.target.value,
                        });

                        setErrors({
                          ...errors,
                          awarded_for: "",
                        });
                      }}
                      className="border w-full px-3 py-2 h-12"
                    />

                    {errors.awarded_for && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.awarded_for}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-5">
                <div className="flex items-start">
                  <label className="w-44 text-sm pt-2">
                    Awarded Year: <span className="text-red-500">*</span>
                  </label>

                  <div className="w-full relative">
                    <DatePicker
                      selected={formData.awarded_year}
                      onChange={(date: Date | null) => {
                        setFormData({
                          ...formData,
                          awarded_year: date,
                        });

                        setErrors({
                          ...errors,
                          awarded_year: "",
                        });
                      }}
                      showYearPicker
                      dateFormat="yyyy"
                      yearItemNumber={12}
                      placeholderText="Select Year"
                      className="border w-full px-3 py-2 pr-10"
                      popperClassName="designation-year-popper"
                      calendarClassName="designation-year-calendar"
                      popperPlacement="bottom-start"
                    />

                    <Calendar
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black-500 pointer-events-none"
                    />

                    {errors.awarded_year && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.awarded_year}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <label className="w-44 text-sm pt-2">Venue:</label>

                  <textarea
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venue: e.target.value,
                      })
                    }
                    className="border w-full px-3 py-2 h-12"
                  />
                </div>

                <div className="flex items-start">
                  <label className="w-44 text-sm pt-2">
                    Any other detail about award:
                  </label>

                  <textarea
                    value={formData.award_details}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        award_details: e.target.value,
                      })
                    }
                    className="border w-full px-3 py-2 h-28"
                  />
                </div>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={handleSave}
                className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded flex items-center gap-2"
              >
                Save
              </button>

              <button
                onClick={resetForm}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded"
              >
                Reset
              </button>
            </div>
          </div>
        </>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded w-[400px]">
            <h2 className="text-lg font-semibold mb-4">Delete Award</h2>

            <p className="mb-6">Are you sure you want to delete this record?</p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-[#4f7f82] text-white rounded"
                onClick={async () => {
                  if (!deleteId) return;

                  await handleDelete(deleteId);

                  setShowDeleteModal(false);
                }}
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
            {/* ================= HEADER ================= */}
            <div className="text-[#4f7f82] px-5 py-3 flex justify-between items-center border-b">
              <h2 className="text-[18px] font-semibold">Uploaded Files</h2>

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

            {/* ================= BODY ================= */}
            <div className="p-5 overflow-y-auto flex-1">
              <h3 className="font-semibold text-[18px] mb-4">
                Award and Honour
              </h3>

              {/* TABLE */}
              <div className="border rounded overflow-hidden">
                <table className="w-full border-collapse">
                  {/* TABLE HEADER */}
                  <thead className="sticky top-0 bg-[#f7f7f7] z-10">
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

                  {/* TABLE BODY */}
                  <tbody>
                    {uploadedFiles.length > 0 ? (
                      uploadedFiles.map((row: any, index: number) => (
                        <tr key={row.id}>
                          {/* CHECKBOX */}
                          <td className="border px-3 py-2 text-center">
                            <input type="checkbox" />
                          </td>

                          {/* SERIAL */}
                          <td className="border px-3 py-2">{index + 1}</td>

                          {/* FILE NAME */}
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
                              value={editableFiles[index]?.description || ""}
                              onChange={(e) => {
                                const updated = [...editableFiles];

                                updated[index].description = e.target.value;

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

                                updated[index].actual_date = e.target.value;

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
                  <b>Note :</b> Files allowed are .doc, .docx, .xls, .xlsx,
                  .jpg, .png, .txt, .ppt, .pptx, .pdf, .odt, .rtf.
                </p>

                <p className="ml-12">Maximum file size allowed is 10MB.</p>
              </div>
            </div>

            {/* ================= FOOTER ================= */}
            <div className="bg-[#f5f5f5] border-t px-5 py-4 flex justify-end gap-3">
              {/* UPLOAD */}
              <label className="px-4 py-2 text-sm rounded bg-[#4f7f82] text-white hover:bg-[#3f6668] cursor-pointer">
                {uploadedFiles.length > 0 ? "Upload More" : "Upload"}

                <input
                  type="file"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];

                    if (!file || !selectedAwardId) {
                      return;
                    }

                    const formData = new FormData();

                    const currentDate = new Date().toISOString().split("T")[0];

                    formData.append("file", file);

                    formData.append("user_id", String(manualUserId));

                    formData.append("table_ref_id", String(selectedAwardId));

                    formData.append("tab_ref_id", "award_honors");

                    formData.append("table_name", "cudos_user_awards_honours");

                    formData.append("actual_date", currentDate);

                    const res = await uploadAwardFile(formData);

                    if (res?.status) {
                      toast.success("Uploaded Successfully");

                      await loadUploadedFiles(selectedAwardId);
                    } else {
                      toast.error(res.message || "Upload failed");
                    }
                  }}
                />
              </label>

              {/* SAVE */}
              <label
                className="bg-[#4f7f82] hover:bg-[#3f6668] text-white px-5 py-2 rounded font-medium"
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
                className="px-4 py-2 bg-red-500 text-white rounded"
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
  );
};

export default AwardHonorsPage;
