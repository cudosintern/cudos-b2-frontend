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
  getFellowshipScholarshipList,
  getFellowshipScholarshipDropdowns,
  saveFellowshipScholarship,
  updateFellowshipScholarship,
  deleteFellowshipScholarship,
} from "./fellowshipScholarshipApi";

const BASE_URL = "http://localhost:8000/fellowship-scholarship";

interface FellowshipItem {
  scholar_id?: number;

  fellow_scholar_for: string;

  awarded_by: string;

  awardee_name: string;

  year: Date | null;

  end_year: Date | null;

  amount: string;

  type: number | string;

  abstract: string;

  attachment?: string;

  type_name?: string;
}

interface DropdownOption {
  id: number;
  name: string;
}

type ColumnKey = "fellow_scholar_for" | "awarded_by" | "type" | "year";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

const FellowshipScholarshipPage: React.FC = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [selectedScholarshipId, setSelectedScholarshipId] = useState<
    number | null
  >(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(true);
  const [tableData, setTableData] = useState<FellowshipItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      fellow_scholar_for: "",
      awarded_by: "",
      type: "",
      year: "",
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

  const [typeDropdown, setTypeDropdown] = useState<DropdownOption[]>([]);

  const [formData, setFormData] = useState<FellowshipItem>({
    fellow_scholar_for: "",
    awarded_by: "",
    awardee_name: "",
    year: null,
    end_year: null,
    amount: "",
    type: "",
    abstract: "",
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    fetchTableData();
    fetchDropdowns();
  }, []);

  // FETCH TABLE DATA
  const fetchTableData = async () => {
    try {
      setLoading(true);

      const data = await getFellowshipScholarshipList();

      const formattedData = data?.map((item: any) => ({
        ...item,
        year: item.year ? new Date(item.year) : null,
        end_year: item.end_year ? new Date(item.end_year) : null,
      }));

      setTableData(formattedData || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch table data");
    } finally {
      setLoading(false);
    }
  };

  // FETCH DROPDOWNS
  const fetchDropdowns = async () => {
    try {
      const data = await getFellowshipScholarshipDropdowns();

      setTypeDropdown(data?.types || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch dropdowns");
    }
  };

  // VALIDATION
  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.fellow_scholar_for.trim()) {
      newErrors.fellow_scholar_for = "Fellowship / Scholarship is required";
    }

    if (!formData.year) {
      newErrors.year = "Year is required";
    }

    if (!formData.end_year) {
      newErrors.end_year = "End year is required";
    }

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    }

    if (!formData.type) {
      newErrors.type = "Type is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const formatMonthYear = (date: Date | null) => {
    if (!date) return "";

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}-01`;
  };

  const displayMonthYear = (date: Date | null) => {
    if (!date) return "";

    return date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  // SAVE
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        user_id: 1,
        created_by: 1,
        modified_by: 1,

        year: formatMonthYear(formData.year),
        end_year: formatMonthYear(formData.end_year),
      };

      let result;

      if (editId) {
        result = await updateFellowshipScholarship(editId, payload);
      } else {
        result = await saveFellowshipScholarship(payload);
      }

      if (result.status) {
        toast.success(editId ? "Updated successfully" : "Saved successfully");

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

  // EDIT
  const handleEdit = (item: FellowshipItem) => {
    setEditId(item.scholar_id || null);

    setFormData({
      ...item,
    });

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 200);
  };

  // DELETE
  const handleDelete = (id?: number) => {
    if (!id) return;

    setDeleteId(id);

    setShowDeleteModal(true);
  };

  // CONFIRM DELETE
  const confirmDelete = async () => {
    try {
      if (!deleteId) return;

      const result = await deleteFellowshipScholarship(deleteId);

      if (result.status) {
        toast.success("Deleted successfully");

        setShowDeleteModal(false);

        setDeleteId(null);

        fetchTableData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);

      toast.error("Delete failed");
    }
  };

  const loadUploadedFiles = async (id: number) => {
    try {
      const response = await fetch(
        `${BASE_URL}/upload-list/fellowship_scholarship/${id}`,
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

  // OPEN UPLOAD MODAL
  const handleOpenUploadModal = async (item: FellowshipItem) => {
    if (!item.scholar_id) {
      toast.error("Please save record first");

      return;
    }

    setSelectedScholarshipId(item.scholar_id);

    setShowUploadModal(true);

    await loadUploadedFiles(item.scholar_id);
  };

  // SAVE UPLOADED FILE DETAILS
  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        const formData = new FormData();

        formData.append("description", file.description || "");

        formData.append("actual_date", file.actual_date || "");

        const response = await fetch(`${BASE_URL}/upload/update/${file.id}`, {
          method: "PUT",
          body: formData,
        });

        const data = await response.json();

        if (!data.status) {
          toast.error(data.message || "Update failed");

          return;
        }
      }

      toast.success("Updated Successfully");

      if (selectedScholarshipId) {
        loadUploadedFiles(selectedScholarshipId);
      }
    } catch (error) {
      console.error(error);

      toast.error("Failed to update files");
    }
  };

  // DELETE FILE
  const confirmUploadDelete = async () => {
    try {
      if (!uploadDeleteId) return;

      const response = await fetch(`${BASE_URL}/upload/${uploadDeleteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.status) {
        toast.success("Deleted Successfully");

        setShowUploadDeleteModal(false);

        if (selectedScholarshipId) {
          loadUploadedFiles(selectedScholarshipId);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);

      toast.error("Delete failed");
    }
  };

  // RESET
  const resetForm = () => {
    setEditId(null);

    setFormData({
      fellow_scholar_for: "",
      awarded_by: "",
      awardee_name: "",
      year: null,
      end_year: null,
      amount: "",
      type: "",
      abstract: "",
    });

    setErrors({});
  };

  // FILTER
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

        if (key === "year") {
          cellValue = item.year
            ? displayMonthYear(item.year).toLowerCase()
            : "";
        } else if (key === "type") {
          cellValue = (
            item.type_name ||
            typeDropdown.find((t) => t.id === Number(item.type))?.name ||
            ""
          ).toLowerCase();
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
  }, [tableData, search, columnFilters, filterType, typeDropdown]);

  // PAGINATION
  const indexOfLast = currentPage * entriesPerPage;

  const indexOfFirst = indexOfLast - entriesPerPage;

  const currentData = filteredData.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  // PREVIOUS PAGE
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // NEXT PAGE
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="bg-[#f2f2f2] min-h-screen p-4">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 mb-4">
        <h2 className="text-lg font-semibold">Fellowship / Scholarship</h2>
      </div>

      {/* COLLAPSE HEADER */}
      <div
        className="bg-white border px-4 py-3 flex items-center gap-2 cursor-pointer font-semibold text-[#4f7f82]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "▼" : "▶"}
        <span>Fellowship / Scholarship</span>
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
          <div className="overflow-x-auto border">
            <table className="w-full border-collapse">
              <thead className="bg-[#f3f3f3]">
                <tr className="bg-[#f2f2f2]">
                  <th className="border p-2 text-left">Sl No.</th>

                  {/* Fellowship / Scholarship for */}
                  <th className="border p-2 text-left relative">
                    <div className="flex items-center justify-between">
                      Fellowship / Scholarship for
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          setActiveFilter(
                            activeFilter === "fellow_scholar_for"
                              ? ""
                              : "fellow_scholar_for",
                          );
                        }}
                      >
                        <Filter size={15} />
                      </button>
                    </div>

                    {activeFilter === "fellow_scholar_for" && (
                      <div
                        className="absolute top-full left-0 bg-white border shadow-md p-2 z-50 w-56"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          className="border w-full p-1 mb-2 text-sm"
                          value={filterType.fellow_scholar_for || "contains"}
                          onChange={(e) =>
                            setFilterType((prev) => ({
                              ...prev,
                              fellow_scholar_for: e.target.value as FilterType,
                            }))
                          }
                        >
                          <option value="contains">Contains</option>
                          <option value="notContains">Does Not Contain</option>
                          <option value="equals">Equals</option>
                          <option value="notEquals">Not Equals</option>
                          <option value="startsWith">Starts With</option>
                          <option value="endsWith">Ends With</option>
                          <option value="blank">Blank</option>
                          <option value="notBlank">Not Blank</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Filter..."
                          className="border px-2 py-1 w-full text-sm"
                          value={columnFilters.fellow_scholar_for}
                          onChange={(e) =>
                            setColumnFilters((prev) => ({
                              ...prev,
                              fellow_scholar_for: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </th>

                  {/* Awarded By */}
                  <th className="border p-2 text-left relative">
                    <div className="flex items-center justify-between">
                      Awarded by
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          setActiveFilter(
                            activeFilter === "awarded_by" ? "" : "awarded_by",
                          );
                        }}
                      >
                        <Filter size={15} />
                      </button>
                    </div>

                    {activeFilter === "awarded_by" && (
                      <div
                        className="absolute top-full left-0 bg-white border shadow-md p-2 z-50 w-56"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          className="border w-full p-1 mb-2 text-sm"
                          value={filterType.awarded_by || "contains"}
                          onChange={(e) =>
                            setFilterType((prev) => ({
                              ...prev,
                              awarded_by: e.target.value as FilterType,
                            }))
                          }
                        >
                          <option value="contains">Contains</option>
                          <option value="notContains">Does Not Contain</option>
                          <option value="equals">Equals</option>
                          <option value="notEquals">Not Equals</option>
                          <option value="startsWith">Starts With</option>
                          <option value="endsWith">Ends With</option>
                          <option value="blank">Blank</option>
                          <option value="notBlank">Not Blank</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Filter..."
                          className="border px-2 py-1 w-full text-sm"
                          value={columnFilters.awarded_by}
                          onChange={(e) =>
                            setColumnFilters((prev) => ({
                              ...prev,
                              awarded_by: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </th>

                  <th className="border p-2 text-left">Date</th>

                  {/* Type */}
                  <th className="border p-2 text-left relative">
                    <div className="flex items-center justify-between">
                      Type
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          setActiveFilter(
                            activeFilter === "type" ? "" : "type",
                          );
                        }}
                      >
                        <Filter size={15} />
                      </button>
                    </div>

                    {activeFilter === "type" && (
                      <div
                        className="absolute top-full left-0 bg-white border shadow-md p-2 z-50 w-56"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          className="border w-full p-1 mb-2 text-sm"
                          value={filterType.type || "contains"}
                          onChange={(e) =>
                            setFilterType((prev) => ({
                              ...prev,
                              type: e.target.value as FilterType,
                            }))
                          }
                        >
                          <option value="contains">Contains</option>
                          <option value="equals">Equals</option>
                          <option value="notEquals">Not Equals</option>
                          <option value="blank">Blank</option>
                          <option value="notBlank">Not Blank</option>
                        </select>

                        <select
                          className="border px-2 py-1 w-full text-sm"
                          value={columnFilters.type}
                          onChange={(e) =>
                            setColumnFilters((prev) => ({
                              ...prev,
                              type: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select Type</option>

                          {typeDropdown.map((item) => (
                            <option
                              key={item.id}
                              value={item.name.toLowerCase()}
                            >
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </th>

                  <th className="border p-2 text-left">Upload</th>

                  <th className="border p-2 text-left">Edit</th>

                  <th className="border p-2 text-left">Delete</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center p-4">
                      Loading...
                    </td>
                  </tr>
                ) : currentData.length > 0 ? (
                  currentData.map((item, index) => (
                    <tr key={index}>
                      <td className="border p-2">{indexOfFirst + index + 1}</td>

                      <td className="border p-2">{item.fellow_scholar_for}</td>

                      <td className="border p-2">{item.awarded_by}</td>

                      <td className="border p-2">
                        {displayMonthYear(item.year)} :{" "}
                        {displayMonthYear(item.end_year)}
                      </td>

                      <td className="border p-2">
                        {item.type_name ||
                          typeDropdown.find((t) => t.id === Number(item.type))
                            ?.name ||
                          "-"}
                      </td>

                      <td className="border p-2">
                        <button
                          className="text-[#4f7f82] flex items-center gap-1"
                          onClick={() => handleOpenUploadModal(item)}
                        >
                          <Upload size={16} />
                          Upload
                        </button>
                      </td>

                      <td className="border p-2">
                        <button
                          className="text-yellow-600"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil size={16} />
                        </button>
                      </td>

                      <td className="border p-2">
                        <button
                          className="text-red-600"
                          onClick={() => handleDelete(item.scholar_id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center p-4">
                      No data found
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
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`border px-3 py-1 flex items-center gap-1 rounded ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
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
                className={`border px-3 py-1 flex items-center gap-1 rounded ${
                  currentPage === totalPages || totalPages === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                }`}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* FORM */}
          <div ref={formRef} className="border-t mt-8 pt-6">
            <h3 className="text-[#4f7f82] font-semibold text-lg mb-6">
              Add / Edit Fellowship / Scholarship
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT */}
              <div className="space-y-6">
                {/* Fellowship */}
                <div>
                  <label className="block mb-1">
                    Fellowship / Scholarship for
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    className="w-full border px-3 py-2"
                    placeholder="Enter Fellowship / Scholarship for"
                    value={formData.fellow_scholar_for}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fellow_scholar_for: e.target.value,
                      })
                    }
                  />

                  {errors.fellow_scholar_for && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.fellow_scholar_for}
                    </p>
                  )}
                </div>

                {/* Awarded By */}
                <div>
                  <label className="block mb-1">Awarded by</label>

                  <textarea
                    className="w-full border px-3 py-2"
                    placeholder="Enter Awarded by"
                    value={formData.awarded_by}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        awarded_by: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Awardee */}
                <div>
                  <label className="block mb-1">Awardee Name</label>

                  <textarea
                    className="w-full border px-3 py-2"
                    placeholder="Enter Awardee Name"
                    value={formData.awardee_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        awardee_name: e.target.value,
                      })
                    }
                  />
                </div>

                {/* DATE */}
                <div>
                  <label className="block mb-1">
                    Date
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="flex gap-2">
                    {/* START DATE */}
                    <div className="relative w-full">
                      <DatePicker
                        selected={formData.year}
                        onChange={(date) =>
                          setFormData({
                            ...formData,
                            year: date,
                          })
                        }
                        placeholderText="Month-YYYY"
                        className="border px-3 py-2 pr-10 w-full"
                        dateFormat="MMMM-yyyy"
                        showMonthYearPicker
                      />

                      <Calendar
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                      />
                    </div>

                    {/* END DATE */}
                    <div className="relative w-full">
                      <DatePicker
                        selected={formData.end_year}
                        onChange={(date) =>
                          setFormData({
                            ...formData,
                            end_year: date,
                          })
                        }
                        placeholderText="Month-YYYY"
                        className="border px-3 py-2 pr-10 w-full"
                        dateFormat="MMMM-yyyy"
                        showMonthYearPicker
                      />

                      <Calendar
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                      />
                    </div>
                  </div>

                  {(errors.year || errors.end_year) && (
                    <p className="text-red-500 text-sm mt-1">
                      Date is required
                    </p>
                  )}
                </div>

                {/* AMOUNT */}
                <div>
                  <label className="block mb-1">
                    Amount (₹)
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    className="w-full border px-3 py-2"
                    placeholder="Only Digits!"
                    value={formData.amount}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Negative number check
                      if (value.includes("-")) {
                        setErrors({
                          ...errors,
                          amount: "Negative numbers are not allowed",
                        });

                        return;
                      }

                      // Letter/special character check
                      if (!/^\d*$/.test(value)) {
                        setErrors({
                          ...errors,
                          amount: "Only whole numbers are allowed",
                        });

                        return;
                      }

                      // Valid input
                      setErrors({
                        ...errors,
                        amount: "",
                      });

                      setFormData({
                        ...formData,
                        amount: value,
                      });
                    }}
                  />

                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>

                {/* TYPE */}
                <div>
                  <label className="block mb-1">
                    Type
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    className="w-full border px-3 py-2"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Type</option>

                    {typeDropdown.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div>
                <label className="block mb-1">Abstract</label>

                <Editor
                  apiKey="no-api-key"
                  tinymceScriptSrc="/tinymce/tinymce.min.js"
                  value={formData.abstract}
                  onEditorChange={(content: string) => {
                    setFormData({
                      ...formData,
                      abstract: content,
                    });

                    setErrors({
                      ...errors,
                      abstract: "",
                    });
                  }}
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
            </div>
            {/* BUTTONS BELOW FULL FORM */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="bg-[#4f7f82] text-white px-5 py-2 rounded"
                onClick={handleSave}
              >
                Save
              </button>

              <button
                className="bg-amber-600 text-white px-5 py-2 rounded"
                onClick={resetForm}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-[1000px] bg-white rounded shadow-2xl border flex flex-col max-h-[90vh]">
            {/* HEADER */}
            <div className="text-[#4f7f82] px-5 py-3 flex justify-between items-center border-b">
              <h2 className="text-[18px] font-semibold">Uploaded Files</h2>

              <button
                onClick={() => {
                  setShowUploadModal(false);
                }}
                className="text-black text-xl font-bold"
              >
                ✖
              </button>
            </div>

            {/* BODY */}
            <div className="p-5 overflow-y-auto flex-1">
              <h3 className="font-semibold text-[18px] mb-4">
                Fellowship / Scholarship
              </h3>

              <div className="border rounded overflow-hidden">
                <table className="w-full border-collapse">
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

                  <tbody>
                    {uploadedFiles.length > 0 ? (
                      uploadedFiles.map((row: any, index: number) => (
                        <tr key={row.id}>
                          <td className="border px-3 py-2 text-center">
                            <input type="checkbox" />
                          </td>

                          <td className="border px-3 py-2">{index + 1}</td>

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

                          <td className="border px-3 py-2">
                            <input
                              type="date"
                              className="w-full border px-2 py-1 rounded"
                              value={editableFiles[index]?.actual_date || ""}
                              onChange={(e) => {
                                const updated = [...editableFiles];

                                updated[index].actual_date = e.target.value;

                                setEditableFiles(updated);
                              }}
                            />
                          </td>

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

            {/* FOOTER */}
            <div className="bg-[#f5f5f5] border-t px-5 py-4 flex justify-end gap-3">
              {/* UPLOAD */}
              <label className="px-4 py-2 text-sm rounded bg-[#4f7f82] text-white hover:bg-[#3f6668] cursor-pointer">
                {uploadedFiles.length > 0 ? "Upload More" : "Upload"}

                <input
                  type="file"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];

                    if (!file || !selectedScholarshipId) {
                      return;
                    }

                    const formData = new FormData();

                    const currentDate = new Date().toISOString().split("T")[0];

                    formData.append("file", file);

                    formData.append("user_id", "1");

                    formData.append(
                      "table_ref_id",
                      String(selectedScholarshipId),
                    );

                    formData.append("tab_ref_id", "fellowship_scholarship");

                    formData.append(
                      "table_name",
                      "cudos_user_fellowship_scholar",
                    );

                    formData.append("actual_date", currentDate);

                    const response = await fetch(`${BASE_URL}/upload`, {
                      method: "POST",
                      body: formData,
                    });

                    const data = await response.json();

                    if (data.status) {
                      toast.success("Uploaded Successfully");

                      await loadUploadedFiles(selectedScholarshipId);
                    } else {
                      toast.error(data.message || "Upload failed");
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
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded font-medium"
                onClick={() => {
                  setShowUploadModal(false);
                }}
              >
                Close
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE FILE MODAL ================= */}
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
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-[400px]">
            <h2 className="text-lg font-semibold mb-4">
              Delete Fellowship / Scholarship
            </h2>

            <p className="mb-6">Do you want to delete this record?</p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => {
                  setShowDeleteModal(false);

                  setDeleteId(null);
                }}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-[#4f7f82] text-white rounded"
                onClick={confirmDelete}
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

export default FellowshipScholarshipPage;
