import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
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
  getPatentDropdowns,
  getPatents,
  savePatent,
  updatePatent,
  deletePatent,
} from "./patentInnovationActivitiesApi";

interface PatentActivity {
  id: number;
  title: string;
  patentNo: string;
  year: string;
  status: number;
  activityType: number;
  date: string;
  abstract: string;
}
type ColumnKey = "title" | "patentNo" | "year" | "status";

const PatentInnovationActivitiesPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {},
  );

  const [filterType, setFilterType] = useState<Record<string, string>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedPatentId, setSelectedPatentId] = useState<number | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const loadUploadedFiles = async (patentId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/patentInnovation_activities/upload-list/${patentId}`,
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
  const [editId, setEditId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityTypes, setActivityTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const fetchPatents = async () => {
    try {
      const data = await getPatents();

      const formatted = data.map((item: any) => ({
        id: item.patent_id,
        title: item.patent_title,
        patentNo: item.patent_no,
        year: item.year,
        status: item.status,
        activityType: item.patent_type,
        date: item.year,
        abstract: item.abstract,
      }));

      setActivities(formatted);
    } catch (error) {
      toast.error("Failed to fetch patents");
    }
  };

  const [statuses, setStatuses] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    fetchDropdowns();
    fetchPatents();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const data = await getPatentDropdowns();

      console.log("Dropdown API Response:", data);

      const activityData = data.activity_types || [];
      const statusData = data.statuses || [];

      setActivityTypes(activityData);
      setStatuses(statusData);

      setFormData((prev) => ({
        ...prev,
        activityType: activityData.length > 0 ? String(activityData[0].id) : "",

        status: statusData.length > 0 ? String(statusData[0].id) : "",
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch dropdowns");
    }
  };
  const [isOpen, setIsOpen] = useState(true);

  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const [activities, setActivities] = useState<PatentActivity[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    patentNo: "",
    activityType: "",
    date: "",
    status: "",
    abstract: "",
  });

  const [errors, setErrors] = useState<any>({});

  // =========================
  // FORM HANDLERS
  // =========================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const handleAbstractChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      abstract: e.target.value,
    });

    setErrors({
      ...errors,
      abstract: "",
    });
  };
  const isValidText = (value: string) => {
    return /^[a-zA-Z0-9\s.,\-_/()]+$/.test(value);
  };

  // Check non-negative number
  const isNonNegativeNumber = (value: string) => {
    return /^\d+$/.test(value);
  };

  const validateForm = () => {
    let newErrors: any = {};

    // TITLE
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (!isValidText(formData.title)) {
      newErrors.title = "Invalid title";
    }

    // PATENT NUMBER
    if (formData.patentNo) {
      if (!isNonNegativeNumber(formData.patentNo)) {
        newErrors.patentNo =
          "Patent/activity number must be a valid and non-negative number";
      }
    }

    // DATE
    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    // STATUS
    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    // ACTIVITY TYPE
    if (!formData.activityType) {
      newErrors.activityType = "Activity type is required";
    }

    // ABSTRACT
    const plainAbstract = formData.abstract.replace(/<[^>]*>/g, "").trim();

    if (!plainAbstract) {
      newErrors.abstract = "Abstract is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: "",
      patentNo: "",
      activityType: activityTypes.length > 0 ? String(activityTypes[0].id) : "",

      status: statuses.length > 0 ? String(statuses[0].id) : "",

      date: "",
      abstract: "",
    });

    setErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        patent_title: formData.title,
        patent_no: formData.patentNo,
        patent_type: Number(formData.activityType),
        status: Number(formData.status),
        abstract: formData.abstract,
        year: formData.date,
        inventors: "",
        link: "",
      };

      console.log("SAVE PAYLOAD", payload);

      if (editId) {
        const response = await updatePatent(editId, payload);

        console.log("UPDATE RESPONSE", response);

        toast.success("Patent updated successfully");
      } else {
        const response = await savePatent(payload);

        console.log("SAVE RESPONSE", response);

        toast.success("Patent saved successfully");
      }

      await fetchPatents();

      resetForm();

      setEditId(null);
    } catch (error) {
      console.log(error);

      toast.error("Failed to save data");
    }
  };

  const handleDelete = async () => {
    try {
      if (!deleteId) return;

      await deletePatent(deleteId);

      toast.success("Patent deleted successfully");

      fetchPatents();

      setShowDeleteModal(false);

      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // =========================
  // FILTER + PAGINATION
  // =========================

  const filteredData = activities.filter((item) => {
    // Global Search
    const matchesSearch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    // Column Filters
    const matchesColumnFilters = (
      Object.keys(columnFilters) as ColumnKey[]
    ).every((key) => {
      const filterValue = (columnFilters[key] || "").toLowerCase();

      const rawValue =
        key === "status"
          ? String(
              statuses.find((s) => s.id === item.status)?.name || item.status,
            )
          : String(item[key] || "");

      const value = rawValue.toLowerCase();

      const type = filterType[key] || "contains";

      switch (type) {
        case "contains":
          return value.includes(filterValue);

        case "notContains":
          return !value.includes(filterValue);

        case "equals":
          return value === filterValue;

        case "notEquals":
          return value !== filterValue;

        case "startsWith":
          return value.startsWith(filterValue);

        case "endsWith":
          return value.endsWith(filterValue);

        case "blank":
          return value.trim() === "";

        case "notBlank":
          return value.trim() !== "";

        default:
          return true;
      }
    });

    return matchesSearch && matchesColumnFilters;
  });

  const totalPages = Math.ceil(filteredData.length / entries);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * entries,
    currentPage * entries,
  );

  return (
    <div className="p-4 bg-[#f3f3f3] min-h-screen">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 rounded-t flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">
          Patent, Innovation & Development activities
        </h2>
      </div>

      {/* COLLAPSIBLE HEADER */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border p-3 font-semibold text-[#4f7f82] cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        Patent, Innovation & Development activities
      </div>

      {isOpen && (
        <div className="bg-white border border-t-0 p-6">
          {/* TABLE CONTROLS */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-5 gap-4">
            <div className="flex items-center gap-2">
              <span>Show</span>

              <select
                value={entries}
                onChange={(e) => {
                  setEntries(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-3 py-2 outline-none"
              >
                {[10, 20, 50, 100].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>

              <span>entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span>Search:</span>

              <input
                type="text"
                className="border rounded px-3 py-2 outline-none w-[250px]"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border rounded">
            <table className="w-full border-collapse">
              <thead className="bg-[#f3f3f3]">
                <tr>
                  <th className="border px-4 py-3">Sl No.</th>

                  {(
                    [
                      { key: "title", label: "Title" },
                      { key: "patentNo", label: "Patent No." },
                      { key: "year", label: "Year" },
                      { key: "status", label: "Status" },
                    ] as { key: ColumnKey; label: string }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="border px-4 py-3 text-left relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span>{col.label}</span>

                        <Filter
                          size={16}
                          strokeWidth={2}
                          className="min-w-[16px] min-h-[16px] w-4 h-4 flex-shrink-0 cursor-pointer text-gray-500 hover:text-blue-600"
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

                  <th className="border px-4 py-3 text-center">Upload</th>

                  <th className="border px-4 py-3 text-center">Edit</th>

                  <th className="border px-4 py-3 text-center">Delete</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border px-4 py-3">
                        {(currentPage - 1) * entries + index + 1}
                      </td>

                      <td className="border px-4 py-3">{item.title}</td>

                      <td className="border px-4 py-3">{item.patentNo}</td>

                      <td className="border px-4 py-3">{item.year}</td>

                      <td className="border px-4 py-3">
                        {statuses.find((s) => s.id === item.status)?.name ||
                          item.status}
                      </td>

                      <td className="border px-4 py-3">
                        <button
                          className="text-[#4f7f82] flex"
                          onClick={() => {
                            setSelectedPatentId(item.id);
                            setShowUploadModal(true);
                            loadUploadedFiles(item.id);
                          }}
                        >
                          <Upload size={18} />
                          Upload
                        </button>
                      </td>

                      <td className="border px-4 py-3">
                        <button
                          className="text-yellow-600"
                          onClick={() => {
                            setEditId(item.id);

                            setFormData({
                              title: item.title,
                              patentNo: item.patentNo,
                              activityType: String(item.activityType),
                              date: item.date,
                              status: String(item.status),
                              abstract: item.abstract,
                            });

                            setTimeout(() => {
                              formRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }, 100);
                          }}
                        >
                          <Pencil size={18} />
                        </button>
                      </td>

                      <td className="border px-4 py-3">
                        <button
                          className="text-red-600"
                          onClick={() => {
                            setDeleteId(item.id);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center border px-4 py-5 text-gray-500"
                    >
                      No Data to Display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FORM SECTION */}
          <div ref={formRef} className="border mt-10 p-6 rounded bg-[#fafafa]">
            <h2 className="text-lg font-semibold text-[#4f7f82] mb-5">
              Add / Edit Patent, Innovation & Development activities
            </h2>
            {/* TOP 2 COLUMN SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* LEFT SIDE */}
              <div className="space-y-5">
                {/* TITLE */}
                <div>
                  <label className="block mb-2 font-medium">
                    Title: <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter Patent title"
                    className={`w-full border rounded px-3 py-2 outline-none ${
                      errors.title ? "border-red-500" : ""
                    }`}
                  />

                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* PATENT NUMBER */}
                <div>
                  <label className="block mb-2 font-medium">
                    Patent/activity No:
                  </label>

                  <input
                    type="text"
                    name="patentNo"
                    value={formData.patentNo}
                    onChange={handleChange}
                    placeholder="Enter Patent no."
                    className={`w-full border rounded px-3 py-2 outline-none ${
                      errors.patentNo ? "border-red-500" : ""
                    }`}
                  />

                  {errors.patentNo && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.patentNo}
                    </p>
                  )}
                </div>

                {/* ACTIVITY TYPE */}
                <div>
                  <label className="block mb-2 font-medium">
                    Activity Type: <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="activityType"
                    value={formData.activityType}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 outline-none ${
                      errors.activityType ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Select Activity</option>

                    {activityTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {errors.activityType && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.activityType}
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="space-y-5">
                {/* DATE */}
                <div>
                  <label className="block mb-2 font-medium">
                    Date: <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 outline-none ${
                      errors.date ? "border-red-500" : ""
                    }`}
                  />

                  {errors.date && (
                    <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                  )}
                </div>

                {/* STATUS */}
                <div>
                  <label className="block mb-2 font-medium">
                    Status: <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 outline-none ${
                      errors.status ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Select Status</option>

                    {statuses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {errors.status && (
                    <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ABSTRACT FULL WIDTH */}
            <div className="mt-8">
              <label className="block mb-2 font-medium">
                Abstract: <span className="text-red-500">*</span>
              </label>

              <div
                className={`border rounded ${
                  errors.abstract ? "border-red-500" : "border-gray-300"
                }`}
              >
                <Editor
                  apiKey="no-api-key"
                  tinymceScriptSrc="/tinymce/tinymce.min.js"
                  value={formData.abstract}
                  onEditorChange={(content) => {
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

              {errors.abstract && (
                <p className="text-red-500 text-sm mt-1">{errors.abstract}</p>
              )}

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 mt-5">
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
          </div>
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[400px] shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>

                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this record?
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-[#4f7f82] text-white rounded"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ================= UPLOAD MODAL ================= */}
          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="w-[1000px] bg-white rounded shadow-2xl border flex flex-col max-h-[90vh]">
                {/* HEADER */}
                <div className="text-[#4f7f82] px-5 py-3 flex justify-between items-center rounded-t border-b">
                  <h2 className="text-[18px] font-semibold">Uploaded Files</h2>

                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedPatentId(null);
                      setUploadedFiles([]);
                    }}
                    className="text-black text-xl font-bold"
                  >
                    ✖
                  </button>
                </div>

                {/* BODY */}
                <div className="p-5 overflow-y-auto flex-1">
                  <h3 className="font-semibold text-[18px] mb-4">Patent</h3>

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
                      <span className="font-semibold">Upload Note :</span> Grant
                      Certificate
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

                        if (!file || !selectedPatentId) return;

                        const today = new Date().toISOString().split("T")[0];

                        const formData = new FormData();

                        formData.append("file", file);

                        formData.append("patent_id", String(selectedPatentId));

                        formData.append("user_id", "1");

                        formData.append("actual_date", today);

                        const response = await fetch(
                          "http://localhost:8000/patentInnovation_activities/upload",
                          {
                            method: "POST",
                            body: formData,
                          },
                        );

                        const data = await response.json();

                        if (data.status) {
                          toast.success("Uploaded Successfully");

                          loadUploadedFiles(selectedPatentId);
                        } else {
                          toast.error(data.message);
                        }
                      }}
                    />
                  </label>

                  {/* SAVE */}
                  <label
                    onClick={async () => {
                      try {
                        for (const file of editableFiles) {
                          const formData = new FormData();

                          formData.append(
                            "description",
                            file.description || "",
                          );

                          formData.append(
                            "actual_date",
                            file.actual_date || "",
                          );

                          await fetch(
                            `http://localhost:8000/patentInnovation_activities/upload/update/${file.id}`,
                            {
                              method: "PUT",
                              body: formData,
                            },
                          );
                        }

                        toast.success("Updated Successfully");

                        if (selectedPatentId) {
                          loadUploadedFiles(selectedPatentId);
                        }
                      } catch (error) {
                        toast.error("Failed to update");
                      }
                    }}
                    className="bg-[#4f7f82] text-white px-5 py-2 rounded"
                  >
                    Save
                  </label>

                  {/* CLOSE */}
                  <label
                    className="bg-red-600 text-white px-5 py-2 rounded"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedPatentId(null);
                      setUploadedFiles([]);
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
                    onClick={async () => {
                      try {
                        if (!uploadDeleteId) return;

                        const response = await fetch(
                          `http://localhost:8000/patentInnovation_activities/upload/${uploadDeleteId}`,
                          {
                            method: "DELETE",
                          },
                        );

                        const data = await response.json();

                        if (data.status) {
                          toast.success("Deleted Successfully");

                          setShowUploadDeleteModal(false);

                          if (selectedPatentId) {
                            loadUploadedFiles(selectedPatentId);
                          }
                        } else {
                          toast.error(data.message);
                        }
                      } catch (error) {
                        toast.error("Failed to delete");
                      }
                    }}
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

export default PatentInnovationActivitiesPage;
