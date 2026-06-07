import React, { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  createLecture,
  updateLecture,
  deleteLecture,
  getLectures,
  getDropdowns,
} from "./technicalSpecialLectureDeliveredApi";
type ColumnKey = "topic_of_lecture" | "nationality" | "date" | "institution";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";
interface LectureItem {
  topic_id: number;
  topic_of_lecture: string;
  nationality: string;
  date: string;
  institution: string;
}

const TechnicalSpecialLectureDeliveredPage: React.FC = () => {
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const loadDropdowns = async () => {
    try {
      const response = await getDropdowns();

      if (response?.status) {
        setNationalityOptions(response?.data?.nationality || []);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const formRef = useRef<HTMLDivElement | null>(null);

  // ================= STATES =================

  const [isOpen, setIsOpen] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      topic_of_lecture: "",
      nationality: "",
      date: "",
      institution: "",
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

  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ================= FORM =================

  const [formData, setFormData] = useState({
    topic_of_lecture: "",
    nationality: "",
    date: null as Date | null,
    institution: "",
  });

  const [errors, setErrors] = useState<any>({});

  // ================= TABLE DATA =================

  const [tableData, setTableData] = useState<LectureItem[]>([]);

  const loadLectures = async () => {
    try {
      const response = await getLectures();

      if (response?.status) {
        setTableData(response.data || []);
      }
    } catch (error) {
      console.error(error);

      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    loadLectures();
    loadDropdowns();
  }, []);

  // ================= VALIDATION =================

  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.topic_of_lecture.trim()) {
      newErrors.topic_of_lecture = "Topic of lecture is required";
    }

    if (!formData.nationality) {
      newErrors.nationality = "Nationality is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.institution.trim()) {
      newErrors.institution = "Institution is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ================= HANDLE CHANGE =================

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

  // ================= DATE CHANGE =================

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      date,
    }));

    setErrors((prev: any) => ({
      ...prev,
      date: "",
    }));
  };

  // ================= RESET =================

  const resetForm = () => {
    setFormData({
      topic_of_lecture: "",
      nationality: "",
      date: null,
      institution: "",
    });

    setErrors({});

    setEditingId(null);
  };

  // ================= SAVE / UPDATE =================

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        topic_of_lecture: formData.topic_of_lecture,
        nationality: Number(formData.nationality),
        lecture_date: formData.date
          ? formData.date.toISOString().split("T")[0]
          : "",
        institution: formData.institution,
        user_id: 1,
      };

      // ================= UPDATE =================

      if (editingId) {
        const response = await updateLecture(editingId, payload);

        if (response?.status) {
          toast.success("Updated Successfully");

          await loadLectures();

          resetForm();
        } else {
          toast.error(response?.message || "Update failed");
        }
      }

      // ================= CREATE =================
      else {
        const response = await createLecture(payload);

        if (response?.status) {
          toast.success("Saved Successfully");

          await loadLectures();

          resetForm();
        } else {
          toast.error(response?.message || "Save failed");
        }
      }
    } catch (error) {
      console.error(error);

      toast.error("Something went wrong");
    }
  };

  // ================= EDIT =================

  const handleEdit = (item: LectureItem) => {
    setEditingId(item.topic_id);

    setFormData({
      topic_of_lecture: item.topic_of_lecture,
      nationality: String(item.nationality),
      date: item.date ? new Date(item.date) : null,
      institution: item.institution,
    });

    formRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // ================= DELETE =================

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (!deleteId) return;

      const response = await deleteLecture(deleteId);

      if (response?.status) {
        toast.success("Deleted Successfully");

        await loadLectures();

        setShowDeleteModal(false);

        setDeleteId(null);
      } else {
        toast.error(response?.message || "Delete failed");
      }
    } catch (error) {
      console.error(error);

      toast.error("Something went wrong");
    }
  };

  // ================= SEARCH =================

  const filteredData = useMemo(() => {
    return tableData.filter((item: any) => {
      // GLOBAL SEARCH
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

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

        if (key === "nationality") {
          cellValue =
            nationalityOptions
              .find((n) => n.mt_details_id == item.nationality)
              ?.mt_details_name?.toLowerCase() || "";
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
  }, [tableData, searchTerm, columnFilters, filterType, nationalityOptions]);

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
          Technical Talk/Special Lecture Delivered
        </h2>
      </div>

      {/* COLLAPSIBLE */}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border p-3 font-semibold text-[#4f7f82] cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        Technical Talk/Special Lecture Delivered
      </div>

      {/* CONTENT */}

      {isOpen && (
        <div className="bg-white border border-t-0 p-5">
          {/* TOP CONTROLS */}

          <div className="flex justify-between items-center mb-4">
            <div>
              <label className="mr-2 text-sm">Show</label>

              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="border px-2 py-1 rounded"
              >
                <option value={10}>10</option>

                <option value={20}>20</option>

                <option value={50}>50</option>
              </select>

              <label className="ml-2 text-sm">entries</label>
            </div>

            <div>
              <label className="mr-2 text-sm">Search:</label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border px-3 py-1 rounded"
              />
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto border rounded">
            <table className="w-full border-collapse">
              <thead className="bg-[#f5f5f5]">
                <tr>
                  <th className="border px-3 py-2 text-left">Sl No.</th>

                  {(
                    [
                      {
                        key: "topic_of_lecture",
                        label: "Topic of lecture",
                      },
                      {
                        key: "nationality",
                        label: "National/International",
                      },
                      {
                        key: "date",
                        label: "Date",
                      },
                      {
                        key: "institution",
                        label: "Institution",
                      },
                    ] as {
                      key: ColumnKey;
                      label: string;
                    }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="border px-3 py-2 relative text-left"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>{col.label}</span>

                        <Filter
                          size={16}
                          className="cursor-pointer text-black hover:text-blue-600"
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

                  <th className="border px-3 py-2 text-center">Edit</th>

                  <th className="border px-3 py-2 text-center">Delete</th>
                </tr>
              </thead>

              <tbody>
                {currentTableData.length > 0 ? (
                  currentTableData.map((item: LectureItem, index: number) => (
                    <tr key={item.topic_id}>
                      <td className="border px-3 py-2">
                        {indexOfFirstItem + index + 1}
                      </td>

                      <td className="border px-3 py-2">
                        {item.topic_of_lecture}
                      </td>

                      <td className="border px-3 py-2">
                        {
                          nationalityOptions.find(
                            (n) => n.mt_details_id == item.nationality,
                          )?.mt_details_name
                        }
                      </td>

                      <td className="border px-3 py-2 w-[180px]">
                        {item.date}
                      </td>

                      <td className="border px-3 py-2">{item.institution}</td>

                      <td className="border px-3 py-2 text-center">
                        <button onClick={() => handleEdit(item)}>
                          <Pencil size={18} className="text-yellow-600" />
                        </button>
                      </td>

                      <td className="border px-3 py-2 text-center">
                        <button
                          className="text-red-600"
                          onClick={() => handleDelete(item.topic_id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4 border">
                      No Data Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredData.length)} of{" "}
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

          <div ref={formRef} className="mt-8 border-t pt-6">
            {/* Topic */}
            <h3 className="text-[#4f7f82] font-semibold text-lg mb-6">
              Add / Edit Technical Talk/Special Lecture Delivered
            </h3>
            <div className="grid grid-cols-12 mb-5 items-start">
              <label className="col-span-2 text-sm font-medium">
                Topic of lecture : <span className="text-red-500">*</span>
              </label>

              <div className="col-span-4">
                <input
                  type="text"
                  name="topic_of_lecture"
                  value={formData.topic_of_lecture}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 text-sm ${
                    errors.topic_of_lecture
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />

                {errors.topic_of_lecture && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.topic_of_lecture}
                  </p>
                )}
              </div>
            </div>

            {/* Nationality */}

            <div className="grid grid-cols-12 mb-5 items-start">
              <label className="col-span-2 text-sm font-medium">
                Nationality : <span className="text-red-500">*</span>
              </label>

              <div className="col-span-4">
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 text-sm ${
                    errors.nationality ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select</option>

                  {nationalityOptions.map((item) => (
                    <option key={item.mt_details_id} value={item.mt_details_id}>
                      {item.mt_details_name}
                    </option>
                  ))}
                </select>

                {errors.nationality && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.nationality}
                  </p>
                )}
              </div>
            </div>

            {/* Date */}

            <div className="grid grid-cols-12 mb-5 items-start">
              <label className="col-span-2 text-sm font-medium">
                Date : <span className="text-red-500">*</span>
              </label>

              <div className="col-span-4">
                <div className="relative">
                  <DatePicker
                    selected={formData.date}
                    onChange={handleDateChange}
                    dateFormat="yyyy-MM-dd"
                    className={`w-full border rounded px-3 py-2 pr-10 text-sm ${
                      errors.date ? "border-red-500" : "border-gray-300"
                    }`}
                  />

                  {/* Calendar Icon */}
                  <Calendar
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>

                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                )}
              </div>
            </div>

            {/* Institution */}

            <div className="grid grid-cols-12 mb-5 items-start">
              <label className="col-span-2 text-sm font-medium">
                Institution : <span className="text-red-500">*</span>
              </label>

              <div className="col-span-4">
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 text-sm ${
                    errors.institution ? "border-red-500" : "border-gray-300"
                  }`}
                />

                {errors.institution && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.institution}
                  </p>
                )}
              </div>
            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-[#4f7f82] hover:bg[#4f7f82] text-white px-5 py-2 rounded"
              >
                {editingId ? "Update" : "Save"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-[400px]">
            <h2 className="text-lg font-semibold mb-4">Delete Confirmation</h2>

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
    </div>
  );
};

export default TechnicalSpecialLectureDeliveredPage;
