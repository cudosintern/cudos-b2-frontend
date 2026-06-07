import React, { useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import {
  Pencil,
  Trash2,
  Upload,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Filter,
} from "lucide-react";
import {
  getDropdowns,
  getProfessionalBodies,
  createProfessionalBody,
  updateProfessionalBody,
  deleteProfessionalBody,
} from "./professionalBodiesApi";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { toast } from "react-toastify";

type ColumnKey =
  | "organization_name"
  | "membership_type"
  | "membership_no"
  | "from_date";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

interface ProfessionalBody {
  prof_body_id: number;

  organization_name: string;

  membership_type: string;

  membership_no: string;

  from_date: string;

  to_date: string;

  description: string;
}

const BASE_URL = "http://localhost:8000/professional-bodies";

const ProfessionalBodiesPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [membershipTypes, setMembershipTypes] = useState<any[]>([]);
  useEffect(() => {
    loadDropdowns();

    fetchProfessionalBodies();
  }, []);
  const loadDropdowns = async () => {
    try {
      const data = await getDropdowns();

      setMembershipTypes(data.data || []);
    } catch (error) {
      toast.error("Failed to load dropdowns");
    }
  };

  const [tableData, setTableData] = useState<ProfessionalBody[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      organization_name: "",
      membership_type: "",
      membership_no: "",
      from_date: "",
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

  const [currentPage, setCurrentPage] = useState(1);

  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [loading, setLoading] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [errors, setErrors] = useState<any>({});

  // =========================================
  // INITIAL FORM
  // =========================================

  const initialForm = {
    organization_name: "",
    membership_type: "",
    membership_no: "",
    from_date: null as Date | null,
    to_date: null as Date | null,
    description: "",
  };

  const [formData, setFormData] = useState(initialForm);

  // =========================================
  // FETCH DATA
  // =========================================
  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);
  const fetchProfessionalBodies = async () => {
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
      toast.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchProfessionalBodies();
  }, []);

  // =========================================
  // PAGINATION
  // =========================================

  const indexOfLastItem = currentPage * entriesPerPage;

  const indexOfFirstItem = indexOfLastItem - entriesPerPage;

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

  const currentTableData = filteredData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
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
      toast.error("Update failed");
    }
  };
  const handleDeleteUpload = async () => {
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
      toast.error("Delete failed");
    }
  };

  // =========================================
  // HANDLE CHANGE
  // =========================================

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>,
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

  // =========================================
  // VALIDATION
  // =========================================

  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.organization_name.trim()) {
      newErrors.organization_name = "Organization Name is required";
    }

    if (!formData.membership_type) {
      newErrors.membership_type = "Membership Type is required";
    }

    if (!formData.membership_no.trim()) {
      newErrors.membership_no = "Membership No. is required";
    }

    if (!formData.from_date) {
      newErrors.from_date = "From Date is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================================
  // SAVE / UPDATE
  // =========================================

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");

      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const payload = {
        ...formData,

        from_date: formData.from_date
          ? formData.from_date.toISOString().split("T")[0]
          : null,

        to_date: formData.to_date
          ? formData.to_date.toISOString().split("T")[0]
          : null,
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
        toast.success(editId ? "Updated Successfully" : "Saved Successfully");

        resetForm();

        fetchProfessionalBodies();
      } else {
        toast.error(data.detail || "Something went wrong");
      }
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // EDIT
  // =========================================

  const handleEdit = (row: ProfessionalBody) => {
    setEditId(row.prof_body_id);

    setFormData({
      organization_name: row.organization_name || "",

      membership_type: row.membership_type || "",

      membership_no: row.membership_no || "",

      from_date: row.from_date ? new Date(row.from_date) : null,

      to_date: row.to_date ? new Date(row.to_date) : null,

      description: row.description || "",
    });

    formRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // =========================================
  // DELETE
  // =========================================

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

      fetchProfessionalBodies();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // =========================================
  // RESET
  // =========================================

  const resetForm = () => {
    setEditId(null);

    setErrors({});

    setFormData(initialForm);
  };

  // =========================================
  // LOAD FILES
  // =========================================

  const loadUploadedFiles = async (id: number) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/upload-list/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setUploadedFiles(data.data || []);

      setEditableFiles(data.data || []);
    } catch (error) {
      toast.error("Failed to load uploads");
    }
  };
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* HEADER */}

      <div className="text-[#4f7f82] px-4 py-2 rounded-t flex justify-between mb-6">
        <h2 className="text-lg font-semibold">Professional Bodies</h2>
      </div>

      {/* MAIN CONTENT */}
<div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border px-4 py-3 flex items-center gap-2 cursor-pointer font-semibold text-[#4f7f82]"
      >
        {isOpen ? "▼" : "▶"}

        <span>Professional Bodies</span>
      </div>

      {/* CONTENT */}
      {isOpen && (
      <div className="bg-white border p-5">
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
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto border rounded">
          <table className="w-full border-collapse">
            <thead className="bg-[#f3f3f3]">
              <tr>
                <th className="border px-3 py-2 text-left w-[70px]">Sl No.</th>

                {(
                  [
                    {
                      key: "organization_name",
                      label: "Organization Name",
                    },
                    {
                      key: "membership_type",
                      label: "Membership Type",
                    },
                    {
                      key: "membership_no",
                      label: "Membership No.",
                    },
                    {
                      key: "from_date",
                      label: "Date",
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
                            setFilterType((prev) => ({
                              ...prev,
                              [col.key]: e.target.value as FilterType,
                            }))
                          }
                        >
                          <option value="contains">Contains</option>

                          <option value="notContains">Does not contain</option>

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

                <th className="border px-3 py-2 text-center">Upload</th>

                <th className="border px-3 py-2 text-center">Edit</th>

                <th className="border px-3 py-2 text-center">Delete</th>
              </tr>
            </thead>

            <tbody>
              {currentTableData.length > 0 ? (
                currentTableData.map((row: ProfessionalBody, index: number) => (
                  <tr key={row.prof_body_id}>
                    <td className="border px-3 py-2">
                      {indexOfFirstItem + index + 1}
                    </td>

                    <td className="border px-3 py-2">
                      {row.organization_name}
                    </td>

                    <td className="border px-3 py-2">{row.membership_type}</td>

                    <td className="border px-3 py-2">{row.membership_no}</td>

                    <td className="border px-3 py-2">{row.from_date}</td>

                    {/* Upload */}

                    <td className="border px-3 py-2 text-center">
                      <button
                        className="text-[#4f7f82] flex gap-1"
                        onClick={() => {
                          setSelectedId(row.prof_body_id);

                          setShowUploadModal(true);

                          loadUploadedFiles(row.prof_body_id);
                        }}
                      >
                        <Upload size={18} />
                        Upload
                      </button>
                    </td>

                    {/* Edit */}

                    <td className="border px-3 py-2 text-center">
                      <button onClick={() => handleEdit(row)}>
                        <Pencil size={18} className="text-yellow-600" />
                      </button>
                    </td>

                    {/* Delete */}

                    <td className="border px-3 py-2 text-center">
                      <button
                        className="text-red-600"
                        onClick={() => {
                          setDeleteId(row.prof_body_id);

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
                  <td colSpan={8} className="text-center py-4 border">
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
            Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
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
          <h3 className="text-[#4f7f82] font-semibold text-lg mb-6">
            Add / Edit Professional Bodies
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT SIDE */}

            <div>
              {/* Organization Name */}

              <div className="grid grid-cols-12 mb-5 items-start">
                <label className="col-span-4 text-sm font-medium pt-2">
                  Organization Name : <span className="text-red-500">*</span>
                </label>

                <div className="col-span-8">
                  <input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 text-sm ${
                      errors.organization_name
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />

                  {errors.organization_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.organization_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Membership Type */}

              <div className="grid grid-cols-12 mb-5 items-start">
                <label className="col-span-4 text-sm font-medium pt-2">
                  Membership Type : <span className="text-red-500">*</span>
                </label>

                <div className="col-span-8">
                  <select
                    name="membership_type"
                    value={formData.membership_type}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 text-sm ${
                      errors.membership_type
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select</option>

                    {membershipTypes.map((item, index) => (
                      <option key={index} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  {errors.membership_type && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.membership_type}
                    </p>
                  )}
                </div>
              </div>

              {/* Membership No */}

              <div className="grid grid-cols-12 mb-5 items-start">
                <label className="col-span-4 text-sm font-medium pt-2">
                  Membership No. : <span className="text-red-500">*</span>
                </label>

                <div className="col-span-8">
                  <input
                    type="text"
                    name="membership_no"
                    value={formData.membership_no}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 text-sm ${
                      errors.membership_no
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />

                  {errors.membership_no && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.membership_no}
                    </p>
                  )}
                </div>
              </div>

              {/* Date */}

              <div className="grid grid-cols-12 mb-5 items-start">
                <label className="col-span-4 text-sm font-medium pt-2">
                  Date : <span className="text-red-500">*</span>
                </label>

                <div className="col-span-8">
                  <div className="relative">
                    <DatePicker
                      selected={formData.from_date}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          from_date: date,
                        }))
                      }
                      dateFormat="dd-MM-yyyy"
                      className={`w-full border rounded px-3 py-2 pr-10 text-sm ${
                        errors.from_date ? "border-red-500" : "border-gray-300"
                      }`}
                    />

                    <Calendar
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>

                  {errors.from_date && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.from_date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - DESCRIPTION */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Description :
              </label>

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
                  height: 320,
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

          {/* BUTTONS */}

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="bg-[#4f7f82] hover:bg-[#3f6668] text-white px-5 py-2 rounded"
            >
              {editId ? "Update" : "Save"}
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

      {/* UPLOAD MODAL */}

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
                Professional Bodies
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
                      "professional_body_id",
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

export default ProfessionalBodiesPage;
