import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Upload, Filter } from "lucide-react";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "./courseCompletedApi";
interface Course {
  id: number;
  title: string;
  from_date: string;
  to_date: string;
  duration: number;
  platform: string;
}

type ColumnKey = "title" | "date" | "duration" | "platform";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

const CourseCompletedPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);
  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);
  const loadUploadedFiles = async (courseId: number) => {
    try {
      const res = await fetch(
        `http://localhost:8000/course-completed/course/upload-list/${courseId}`,
      );

      const data = await res.json();

      if (data.status) {
        setUploadedFiles(data.data);
        setEditableFiles(data.data); // 👈 IMPORTANT for editing fields
      } else {
        setUploadedFiles([]);
        setEditableFiles([]);
        toast.error(data.message || "Failed to load files");
      }
    } catch (error: any) {
      toast.error(error?.message || "Error loading files");
    }
  };
  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        await fetch(
          `http://localhost:8000/course-completed/course/upload/update/${file.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              description: file.description ?? "",
              actual_date:
                file.actual_date && file.actual_date !== "None"
                  ? file.actual_date.slice(0, 10)
                  : "",
            }),
          },
        );
      }

      toast.success("Saved successfully");

      if (selectedCourseId) {
        await loadUploadedFiles(selectedCourseId);
      }
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    }
  };
  const handleDeleteUpload = async () => {
    try {
      if (!uploadDeleteId) return;

      const res = await fetch(
        `http://localhost:8000/course-completed/course/upload/${uploadDeleteId}`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      if (data.status) {
        toast.success("Deleted successfully");
        setShowUploadDeleteModal(false);

        if (selectedCourseId) {
          await loadUploadedFiles(selectedCourseId);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const storedUserId = localStorage.getItem("user_id");
  const userId = storedUserId ? Number(storedUserId) : 1;
  const [tableData, setTableData] = useState<Course[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  // ✅ NEW FILTER STATES (same as Faculty page)
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");
  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>({
    title: "contains",
    date: "contains",
    duration: "contains",
    platform: "contains",
  });

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      title: "",
      date: "",
      duration: "",
      platform: "",
    },
  );

  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // close filter on outside click
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const data = await getCourses();
    setTableData(data as Course[]);
  };
  const [form, setForm] = useState({
    id: 0,
    title: "",
    from_date: "",
    to_date: "",
    duration: "",
    platform: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [editMode, setEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  // ✅ FILTER LOGIC (same as Faculty page)
  const filteredData = tableData.filter((row: Course) => {
    const matchesSearch =
      row.title.toLowerCase().includes(search.toLowerCase()) ||
      row.platform.toLowerCase().includes(search.toLowerCase()) ||
      String(row.duration).includes(search) ||
      `${row.from_date} ${row.to_date}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesColumnFilters = (
      Object.keys(columnFilters) as ColumnKey[]
    ).every((key) => {
      const filterValue = columnFilters[key]?.toLowerCase();
      if (!filterValue) return true;

      let cellValue = "";

      switch (key) {
        case "title":
          cellValue = row.title;
          break;

        case "platform":
          cellValue = row.platform;
          break;

        case "duration":
          cellValue = String(row.duration);
          break;

        case "date":
          cellValue = `${row.from_date} ${row.to_date}`;
          break;
      }

      cellValue = cellValue.toLowerCase();
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
  const validate = () => {
    let newErrors: any = {};

    const start = form.from_date;
    const end = form.to_date;

    if (!form.title.trim()) newErrors.title = "Course title is required";

    if (!start) newErrors.from_date = "Start date is required";
    if (!end) newErrors.to_date = "End date is required";

    // ✅ date validation
    if (start && end && new Date(end) < new Date(start)) {
      newErrors.to_date = "End date cannot be earlier than start date";
    }

    if (!form.duration || Number(form.duration) <= 0) {
      newErrors.duration = "Duration must be greater than 0";
    }

    if (!form.platform.trim()) newErrors.platform = "Platform is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
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
  const handleSave = async () => {
    try {
      if (!validate()) return;

      const payload = {
        title: form.title,
        from_date: form.from_date,
        to_date: form.to_date,
        duration: Number(form.duration),
        platform: form.platform,
      };

      if (editMode) {
        await updateCourse(form.id, payload);
        toast.success("Updated successfully");
      } else {
        await createCourse(payload);
        toast.success("Created successfully");
      }

      fetchCourses();
      handleReset();
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong");
    }
  };
  const confirmDelete = async () => {
    try {
      if (deleteId) {
        await deleteCourse(deleteId);
        toast.success("Deleted successfully");
        fetchCourses();
        setDeleteId(null);
      }
    } catch (error: any) {
      toast.error(error?.message || "Delete failed");
    }
  };
  const handleReset = () => {
    setForm({
      id: 0,
      title: "",
      from_date: "",
      to_date: "",
      duration: "",
      platform: "",
    });
    setEditMode(false);
    setErrors({});
  };
  const columns: { key: ColumnKey; label: string }[] = [
    { key: "title", label: "Course Title" },
    { key: "date", label: "Date" },
    { key: "duration", label: "Duration" },
    { key: "platform", label: "Platform" },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="text-[#4f7f82] px-4 py-2 rounded-t flex justify-between mb-6">
        <h2 className="text-lg font-semibold">Course Completed</h2>
      </div>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border p-3 font-semibold text-[#4f7f82] cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        Course Completed
      </div>

      {isOpen && (
        <div className="bg-white border p-4">
          <div className="flex justify-between mb-3">
            <div>
              Show{" "}
              <select
                value={entries}
                onChange={(e) => {
                  setEntries(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border px-2 py-1"
              >
                {[10, 20, 50, 100].map((num) => (
                  <option key={num}>{num}</option>
                ))}
              </select>{" "}
              entries
            </div>

            <div>
              Search:{" "}
              <input
                type="text"
                className="border px-2 py-1"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="border rounded overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#f3f3f3]">
                <tr>
                  {/* Sl.No column (fixed column) */}
                  <th className="border px-3 py-2">Sl.No</th>

                  {columns.map((col) => (
                    <th key={col.key} className="border px-3 py-2 relative">
                      <div className="flex justify-between items-center">
                        {col.label}

                        <Filter
                          size={14}
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
                          className="absolute bg-white border shadow p-2 mt-2 w-44 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            className="w-full border mb-2"
                            onChange={(e) =>
                              setFilterType((p) => ({
                                ...p,
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

                          {filterType[col.key] !== "blank" &&
                            filterType[col.key] !== "notBlank" && (
                              <input
                                className="w-full border px-2 py-1"
                                value={columnFilters[col.key]}
                                onChange={(e) =>
                                  setColumnFilters((p) => ({
                                    ...p,
                                    [col.key]: e.target.value,
                                  }))
                                }
                              />
                            )}
                        </div>
                      )}
                    </th>
                  ))}

                  <th className="border px-3 py-2">Upload</th>
                  <th className="border px-3 py-2">Edit</th>
                  <th className="border px-3 py-2">Delete</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((row: Course, index: number) => (
                  <tr key={row.id}>
                    <td className="border px-3 py-2">{index + 1}</td>
                    <td className="border px-3 py-2">{row.title}</td>
                    <td className="border px-3 py-2">
                      {row.from_date} - {row.to_date}
                    </td>
                    <td className="border px-3 py-2">{row.duration}</td>
                    <td className="border px-3 py-2">{row.platform}</td>

                    <td className="border px-3 py-2">
                      <button
                        onClick={() => {
                          setSelectedCourseId(row.id);
                          setShowUploadModal(true);
                          loadUploadedFiles(row.id);
                        }}
                        className="flex items-center gap-1 text-[#4f7f82] underline"
                      >
                        <Upload size={16} />
                        Upload certificate
                      </button>
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <Pencil
                        size={16}
                        className="text-yellow-600 cursor-pointer "
                        onClick={() => {
                          setForm({
                            ...row,
                            duration: String(row.duration),
                          });

                          setEditMode(true);

                          setTimeout(() => {
                            formRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }, 100);
                        }}
                      />
                    </td>

                    <td className="border px-3 py-2 text-center">
                      <Trash2
                        size={16}
                        className="text-red-800 cursor-pointer"
                        onClick={() => setDeleteId(row.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div ref={formRef} className="mt-6 border p-6 bg-white">
        <h2 className="text-lg font-semibold text-[#4f7f82] mb-5">
          Add / Edit Course Completed
        </h2>
        {/* ROW 1 */}
        <div className="flex items-center mb-3">
          <label className="w-32 text-sm">
            Course title <span className="text-red-500">*</span>
          </label>

          <input
            className="border px-3 py-1 rounded w-[350px]"
            value={form.title}
            placeholder="Enter course title"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        {errors.title && (
          <div className="ml-32 text-red-500 text-sm mb-2">{errors.title}</div>
        )}

        {/* ROW 2 - DATE */}
        <div className="flex items-center mb-3">
          <label className="w-32 text-sm">
            Date <span className="text-red-500">*</span>
          </label>

          <div className="flex gap-2">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Start date</label>
              <input
                type="date"
                className="border px-3 py-1 rounded w-[160px]"
                value={form.from_date}
                onChange={(e) =>
                  setForm({ ...form, from_date: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">End date</label>
              <input
                type="date"
                className="border px-3 py-1 rounded w-[160px]"
                value={form.to_date}
                onChange={(e) => setForm({ ...form, to_date: e.target.value })}
              />
            </div>
          </div>
        </div>
        {(errors.from_date || errors.to_date) && (
          <div className="ml-32 text-red-500 text-sm mb-2">
            {errors.from_date || errors.to_date}
          </div>
        )}

        {/* ROW 3 - DURATION (NOW BELOW DATE) */}
        <div className="flex items-center mb-3">
          <label className="w-32 text-sm">
            Duration <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            inputMode="numeric"
            className="border px-3 py-1 rounded w-[150px]"
            value={form.duration}
            placeholder="Enter duration"
            min={1}
            onChange={(e) => {
              const value = e.target.value;

              // ✅ allow only digits
              if (!/^\d*$/.test(value)) {
                setErrors((prev: any) => ({
                  ...prev,
                  duration: "Only digits are allowed",
                }));
                return;
              }

              // ✅ clear error if valid
              setErrors((prev: any) => {
                const updated = { ...prev };
                delete updated.duration;
                return updated;
              });

              setForm({ ...form, duration: value });
            }}
          />
        </div>

        {errors.duration && (
          <div className="ml-32 text-red-500 text-sm mb-2">
            {errors.duration}
          </div>
        )}

        {/* ROW 4 */}
        <div className="flex items-center mb-3">
          <label className="w-32 text-sm">
            Platform <span className="text-red-500">*</span>
          </label>

          <input
            className="border px-3 py-1 rounded w-[350px]"
            value={form.platform}
            placeholder="Enter platform name"
            onChange={(e) => setForm({ ...form, platform: e.target.value })}
          />
        </div>

        {errors.platform && (
          <div className="ml-32 text-red-500 text-sm mb-2">
            {errors.platform}
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleSave}
            className="bg-[#4f7f82] text-white px-5 py-1 rounded"
          >
            Save
          </button>

          <button
            onClick={handleReset}
            className="bg-amber-600 text-white px-5 py-1 rounded shadow"
          >
            Reset
          </button>
        </div>
      </div>
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-[400px]">
            <h2 className="text-lg font-semibold mb-4">Delete Workload</h2>

            <p className="mb-6">Are you sure you want to delete this record?</p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => setDeleteId(null)}
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
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-[1000px] bg-white rounded shadow-2xl border flex flex-col max-h-[90vh]">
            {/* ================= HEADER ================= */}
            <div className="text-[#4f7f82] px-5 py-3 flex justify-between items-center border-b">
              <h2 className="text-[18px] font-semibold">Uploaded Files</h2>

              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedCourseId(null);
                  setUploadedFiles([]);
                }}
                className="text-black text-xl font-bold"
              >
                ✖
              </button>
            </div>

            {/* ================= BODY (SCROLL ONLY HERE) ================= */}
            <div className="p-5 overflow-y-auto flex-1">
              <h3 className="font-semibold text-[18px] mb-4">
                Course Completed
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

                  <tbody>
                    {uploadedFiles.length > 0 ? (
                      uploadedFiles.map((file: any, index: number) => (
                        <tr key={file.id}>
                          {/* CHECKBOX */}
                          <td className="border px-3 py-2 text-center">
                            <input type="checkbox" />
                          </td>

                          {/* SL NO */}
                          <td className="border px-3 py-2">{index + 1}</td>

                          {/* FILE NAME */}
                          <td className="border px-3 py-2 truncate max-w-[200px]">
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-[#4f7f82] underline"
                            >
                              {file.file_name}
                            </a>
                          </td>

                          {/* DESCRIPTION */}
                          <td className="border px-3 py-2 align-top">
                            <textarea
                              className="w-full resize-none border rounded px-2 py-1 text-sm"
                              value={file.description}
                              onChange={(e) => {
                                const updated = [...uploadedFiles];
                                updated[index].description = e.target.value;

                                setUploadedFiles(updated);
                                setEditableFiles(updated); // ✅ ADD THIS
                              }}
                            />
                          </td>

                          {/* DATE */}
                          <td className="border px-3 py-2">
                            <input
                              type="date"
                              className="w-full border px-2 py-1 rounded"
                              value={
                                file.actual_date && file.actual_date !== "None"
                                  ? file.actual_date.slice(0, 10)
                                  : ""
                              }
                              onChange={(e) => {
                                const updated = [...uploadedFiles];
                                updated[index] = {
                                  ...updated[index],
                                  actual_date: e.target.value,
                                };

                                setUploadedFiles(updated);
                                setEditableFiles(updated); // ✅ ADD THIS
                              }}
                            />
                          </td>

                          {/* DELETE */}
                          <td className="border px-3 py-2 text-center">
                            <button
                              onClick={() => {
                                setUploadDeleteId(file.id);
                                setShowUploadDeleteModal(true);
                              }}
                              className="text-red-600 font-bold text-xl"
                            >
                              <Trash2 size={18} />
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

              {/* ================= NOTE (ADDED BACK EXACTLY LIKE FIRST) ================= */}
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
              <label className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded cursor-pointer font-medium">
                {uploadedFiles.length > 0 ? "Upload More" : "Upload"}

                <input
                  type="file"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !selectedCourseId) return;

                    const today = new Date().toISOString().split("T")[0];

                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("user_id", String(userId));
                    formData.append("course_id", String(selectedCourseId));
                    formData.append("actual_date", today); // ✅ AUTO DATE

                    const res = await fetch(
                      "http://localhost:8000/course-completed/course/upload",
                      {
                        method: "POST",
                        body: formData,
                      },
                    );

                    const data = await res.json();

                    if (data.status) {
                      toast.success("Uploaded Successfully");
                      await loadUploadedFiles(selectedCourseId);
                    }
                  }}
                />
              </label>

              {/* SAVE */}
              <label
                onClick={handleSaveUploadedFiles}
                className="bg-[#4f7f82] text-white px-5 py-2 rounded font-medium"
              >
                Save
              </label>

              {/* CLOSE */}
              <label
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedCourseId(null);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded w-[400px]">
            <h2 className="text-lg font-semibold mb-4">Delete File</h2>

            <p className="mb-6">Are you sure you want to delete this file?</p>

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

export default CourseCompletedPage;
