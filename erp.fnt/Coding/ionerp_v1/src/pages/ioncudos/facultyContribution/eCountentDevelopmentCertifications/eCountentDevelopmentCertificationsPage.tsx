import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Upload,
  Calendar,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import {
  getDropdown,
  getList,
  saveRecord,
  updateRecord,
  deleteRecord,
  getUploadedFiles,
  deleteUploadedFile,
  updateUploadedFile,
} from "./eCountentDevelopmentCertificationsApi";

type ColumnKey =
  | "econtent_type"
  | "econtent_crs_dev"
  | "ass_year"
  | "econtent_crs_passed"
  | "econtent_crs_offered"
  | "grade_obtained";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

const EContentDevelopmentCertificationsPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const loadUploadedFiles = async (id: number) => {
    const res = await getUploadedFiles(id);

    if (res.status) {
      setUploadedFiles(res.data);

      setEditableFiles(res.data);
    }
  };

  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        await updateUploadedFile(
          file.id,
          file.description || "",
          file.actual_date || "",
        );
      }

      toast.success("Saved Successfully");

      if (selectedId) {
        loadUploadedFiles(selectedId);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteUpload = async () => {
    if (!uploadDeleteId || !selectedId) return;

    const res = await deleteUploadedFile(uploadDeleteId);

    if (res.status) {
      toast.success("Deleted Successfully");

      loadUploadedFiles(selectedId);
    }

    setShowUploadDeleteModal(false);

    setUploadDeleteId(null);
  };

  const [activeTab, setActiveTab] = useState<"developed" | "certification">(
    "developed",
  );
  useEffect(() => {
    fetchDropdown();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const fetchDropdown = async () => {
    const res = await getDropdown();
    setEContentTypeDropdown(res);
  };

  const loadData = async () => {
    const flag = activeTab === "developed" ? 0 : 1;

    const res = await getList(1, flag);

    if (flag === 0) {
      setDevelopedData(res);
    } else {
      setCertificationData(res);
    }
  };

  const [entries, setEntries] = useState(20);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [activeFilter, setActiveFilter] = useState<string | "">("");

  const [filterType, setFilterType] = useState<Record<string, FilterType>>({});

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    econtent_type: "",
    econtent_crs_dev: "",
    ass_year: "",
    econtent_crs_passed: "",
    econtent_crs_offered: "",
    grade_obtained: "",
  });

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveFilter("");
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const [editingDevelopedId, setEditingDevelopedId] = useState<number | null>(
    null,
  );

  const [editingCertificationId, setEditingCertificationId] = useState<
    number | null
  >(null);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null as number | null,
    type: "",
  });

  // ================= DEVELOPED FORM =================

  const [developedForm, setDevelopedForm] = useState({
    eContentType: "",
    courseTitle: "",
    year: "",
  });

  // ================= CERTIFICATION FORM =================

  const [certificationForm, setCertificationForm] = useState({
    coursePassed: "",
    agency: "",
    grade: "",
    year: "",
  });

  const [errors, setErrors] = useState<any>({});

  const [eContentTypeDropdown, setEContentTypeDropdown] = useState<any[]>([]);

  // ================= DUMMY DATA =================
  // Replace with API later

  const [developedData, setDevelopedData] = useState<any[]>([
    {
      id: 1,
      e_content_type: "SWAYAM PLUS/NPTEL",
      course_title: "xyz",
      year: "2026-05-20",
    },
  ]);

  const [certificationData, setCertificationData] = useState<any[]>([
    {
      id: 1,
      course_passed: "xyz crs",
      agency: "abc crs",
      grade: "no",
      year: "2026-05-06",
    },
  ]);

  // ================= FILTER DATA =================

  const currentData =
    activeTab === "developed" ? developedData : certificationData;

  const filteredData = useMemo(() => {
    return currentData.filter((item: any) => {
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesColumnFilters = Object.keys(columnFilters).every((key) => {
        const filterValue = (columnFilters[key] || "").toLowerCase();

        const cellValue = (item[key] || "").toString().toLowerCase();

        const type = filterType[key] || "contains";

        if (!filterValue && type !== "blank" && type !== "notBlank") {
          return true;
        }

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
            return cellValue.trim() === "";

          case "notBlank":
            return cellValue.trim() !== "";

          default:
            return true;
        }
      });

      return matchesSearch && matchesColumnFilters;
    });
  }, [currentData, search, columnFilters, filterType]);

  // ================= PAGINATION =================

  const totalPages = Math.ceil(filteredData.length / entries);

  const startIndex = (currentPage - 1) * entries;

  const paginatedData = filteredData.slice(startIndex, startIndex + entries);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // ================= VALIDATION =================

  const validateDevelopedForm = () => {
    let tempErrors: any = {};

    if (!developedForm.eContentType.trim()) {
      tempErrors.eContentType = "E-content type is required";
    }

    if (!developedForm.courseTitle.trim()) {
      tempErrors.courseTitle = "Course title is required";
    }

    if (!developedForm.year.trim()) {
      tempErrors.year = "Year is required";
    }

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  const validateCertificationForm = () => {
    let tempErrors: any = {};

    if (!certificationForm.coursePassed.trim()) {
      tempErrors.coursePassed = "Course passed is required";
    }

    if (!certificationForm.agency.trim()) {
      tempErrors.agency = "Agency name is required";
    }

    if (!certificationForm.year.trim()) {
      tempErrors.year = "Year is required";
    }

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };
  // ================= SAVE DEVELOPED =================

  const handleDevelopedSave = async () => {
    if (!validateDevelopedForm()) return;

    const payload = {
      econtent_type: developedForm.eContentType,
      econtent_crs_dev: developedForm.courseTitle,
      econtent_crs_passed: null,
      econtent_crs_offered: null,
      grade_obtained: null,
      econtent_dev_cert_flag: 0,
      ass_year: developedForm.year,
      user_id: "1",
    };

    try {
      if (editingDevelopedId !== null) {
        await updateRecord(editingDevelopedId, payload);

        toast.success("Updated Successfully");
      } else {
        await saveRecord(payload);

        toast.success("Saved Successfully");
      }

      await loadData();

      // RESET FORM
      setDevelopedForm({
        eContentType: "",
        courseTitle: "",
        year: "",
      });

      // CLEAR EDIT MODE
      setEditingDevelopedId(null);

      // CLEAR ERRORS
      setErrors({});
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  // ================= SAVE CERTIFICATION =================

  const handleCertificationSave = async () => {
    if (!validateCertificationForm()) return;

    const payload = {
      econtent_type: null,
      econtent_crs_dev: null,
      econtent_crs_passed: certificationForm.coursePassed,
      econtent_crs_offered: certificationForm.agency,
      grade_obtained: certificationForm.grade || null,
      econtent_dev_cert_flag: 1,
      ass_year: certificationForm.year,
      user_id: "1",
    };

    try {
      if (editingCertificationId !== null) {
        await updateRecord(editingCertificationId, payload);

        toast.success("Updated Successfully");
      } else {
        await saveRecord(payload);

        toast.success("Saved Successfully");
      }

      await loadData();

      setCertificationForm({
        coursePassed: "",
        agency: "",
        grade: "",
        year: "",
      });

      setEditingCertificationId(null);
      setErrors({});
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // ================= EDIT =================

  const handleDevelopedEdit = (item: any) => {
    setDevelopedForm({
      eContentType: item.econtent_type || "",
      courseTitle: item.econtent_crs_dev || "",
      year: item.ass_year || "",
    });

    setEditingDevelopedId(item.fec_id);

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleCertificationEdit = (item: any) => {
    setCertificationForm({
      coursePassed: item.econtent_crs_passed || "",
      agency: item.econtent_crs_offered || "",
      grade: item.grade_obtained || "",
      year: item.ass_year || "",
    });

    setEditingCertificationId(item.fec_id);

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ================= DELETE =================

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    await deleteRecord(deleteModal.id);

    toast.success("Deleted Successfully");

    loadData();

    setDeleteModal({
      open: false,
      id: null,
      type: "",
    });
  };

  // ================= RETURN =================

  return (
    <div className="p-4 bg-[#efefef] min-h-screen">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 rounded-t flex justify-between mb-6">
        <h2 className="text-lg font-semibold">
          E-Content Development / Certifications (MOOCs through SWAYAM, etc.)
        </h2>
      </div>

      {/* COLLAPSIBLE HEADER */}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border p-3 font-semibold text-[#4f7f82] cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        E-Content Development / Certifications (MOOCs through SWAYAM, etc.)
      </div>

      {isOpen && (
        <div className="bg-white border border-t-0">
          {/* TABS */}

          <div className="flex border-b px-3 pt-3 gap-2">
            <button
              onClick={() => setActiveTab("developed")}
              className={`px-4 py-2 text-[13px] border rounded-t ${
                activeTab === "developed"
                  ? "bg-white border-b-white text-[#4f7f82] font-semibold"
                  : "bg-[#f3f3f3]"
              }`}
            >
              E-Content Developed/Published
            </button>

            <button
              onClick={() => setActiveTab("certification")}
              className={`px-4 py-2 text-[13px] border rounded-t ${
                activeTab === "certification"
                  ? "bg-white border-b-white text-[#4f7f82] font-semibold"
                  : "bg-[#f3f3f3]"
              }`}
            >
              E-Content Certifications
            </button>
          </div>

          {/* TABLE SECTION */}

          <div className="p-4">
            {/* SEARCH + ENTRIES */}

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Show</span>

                <select
                  value={entries}
                  onChange={(e) => setEntries(Number(e.target.value))}
                  className="border px-2 py-1"
                >
                  {[10, 20, 50, 100].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <span>entries</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span>Search:</span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border px-2 py-1 w-[200px]"
                />
              </div>
            </div>
            {/* TABLE */}

            {activeTab === "developed" ? (
              <div className="overflow-x-auto border">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-[#f3f3f3]">
                    <tr>
                      <th className="border px-3 py-2">Sl No.</th>
                      {[
                        {
                          label: "E-Content Types",
                          key: "econtent_type",
                        },
                        {
                          label: "Name/title of the course developed",
                          key: "econtent_crs_dev",
                        },
                        {
                          label: "Year",
                          key: "ass_year",
                        },
                      ].map((col) => (
                        <th key={col.key} className="border px-3 py-2 relative">
                          <div className="flex items-center justify-between gap-2">
                            <span>{col.label}</span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();

                                setActiveFilter(
                                  activeFilter === col.key ? "" : col.key,
                                );
                              }}
                            >
                              <Filter size={14} />
                            </button>
                          </div>

                          {activeFilter === col.key && (
                            <div
                              className="absolute top-full right-0 z-50 bg-white border shadow-lg rounded p-3 mt-1 w-52"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                placeholder="Filter value"
                                value={columnFilters[col.key] || ""}
                                onChange={(e) =>
                                  setColumnFilters({
                                    ...columnFilters,
                                    [col.key]: e.target.value,
                                  })
                                }
                                className="w-full border px-2 py-1 text-sm mb-2"
                              />

                              <select
                                value={filterType[col.key] || "contains"}
                                onChange={(e) =>
                                  setFilterType({
                                    ...filterType,
                                    [col.key]: e.target.value as FilterType,
                                  })
                                }
                                className="w-full border px-2 py-1 text-sm"
                              >
                                <option value="contains">Contains</option>
                                <option value="startsWith">Starts With</option>
                                <option value="endsWith">Ends With</option>
                                <option value="notContains">
                                  Does Not Contain
                                </option>
                                <option value="equals">Equals</option>
                                <option value="notEquals">Not Equals</option>
                                <option value="blank">Blank</option>
                                <option value="notBlank">Not Blank</option>
                              </select>
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
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item: any, index: number) => (
                        <tr key={item.fec_id}>
                          <td className="border px-3 py-2">
                            {startIndex + index + 1}
                          </td>

                          <td className="border px-3 py-2">
                            {item.econtent_type}
                          </td>

                          <td className="border px-3 py-2">
                            {item.econtent_crs_dev}
                          </td>

                          <td className="border px-3 py-2">{item.ass_year}</td>

                          <td className="border px-3 py-2 text-center">
                            <div
                              className="flex items-center justify-center gap-1 cursor-pointer text-[#4f7f82]"
                              onClick={() => {
                                setSelectedId(item.fec_id);

                                setShowUploadModal(true);

                                loadUploadedFiles(item.fec_id);
                              }}
                            >
                              <Upload size={16} />
                              <span>Upload</span>
                            </div>
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <Pencil
                              size={16}
                              className="cursor-pointer text-yellow-600"
                              onClick={() => handleDevelopedEdit(item)}
                            />
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <Trash2
                              size={16}
                              className="cursor-pointer text-red-600"
                              onClick={() =>
                                setDeleteModal({
                                  open: true,
                                  id: item.fec_id,
                                  type: "developed",
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-2 border">
                          No Data to Display.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto border">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-[#f3f3f3]">
                    <tr>
                      <th className="border px-3 py-2">Sl No.</th>

                      {[
                        {
                          label: "Name of Course Passed",
                          key: "econtent_crs_passed",
                        },
                        {
                          label: "Course Offered by (agency)",
                          key: "econtent_crs_offered",
                        },
                        {
                          label: "Grade obtained if any",
                          key: "grade_obtained",
                        },
                        {
                          label: "Year",
                          key: "ass_year",
                        },
                      ].map((col) => (
                        <th key={col.key} className="border px-3 py-2 relative">
                          <div className="flex items-center justify-between gap-2">
                            <span>{col.label}</span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();

                                setActiveFilter(
                                  activeFilter === col.key ? "" : col.key,
                                );
                              }}
                            >
                              <Filter size={14} />
                            </button>
                          </div>

                          {activeFilter === col.key && (
                            <div
                              className="absolute top-full right-0 z-50 bg-white border shadow-lg rounded p-3 mt-1 w-52"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                placeholder="Filter value"
                                value={columnFilters[col.key] || ""}
                                onChange={(e) =>
                                  setColumnFilters({
                                    ...columnFilters,
                                    [col.key]: e.target.value,
                                  })
                                }
                                className="w-full border px-2 py-1 text-sm mb-2"
                              />

                              <select
                                value={filterType[col.key] || "contains"}
                                onChange={(e) =>
                                  setFilterType({
                                    ...filterType,
                                    [col.key]: e.target.value as FilterType,
                                  })
                                }
                                className="w-full border px-2 py-1 text-sm"
                              >
                                <option value="contains">Contains</option>
                                <option value="startsWith">Starts With</option>
                                <option value="endsWith">Ends With</option>
                                <option value="notContains">
                                  Does Not Contain
                                </option>
                                <option value="equals">Equals</option>
                                <option value="notEquals">Not Equals</option>
                                <option value="blank">Blank</option>
                                <option value="notBlank">Not Blank</option>
                              </select>
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
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item: any, index: number) => (
                        <tr key={item.fec_id}>
                          <td className="border px-3 py-2">
                            {startIndex + index + 1}
                          </td>

                          <td className="border px-3 py-2">
                            {item.econtent_crs_passed}
                          </td>

                          <td className="border px-3 py-2">
                            {item.econtent_crs_offered}
                          </td>

                          <td className="border px-3 py-2">
                            {item.grade_obtained}
                          </td>

                          <td className="border px-3 py-2">{item.ass_year}</td>

                          <td className="border px-3 py-2 text-center">
                            <div
                              className="flex items-center justify-center gap-1 cursor-pointer text-[#4f7f82]"
                              onClick={() => {
                                setSelectedId(item.fec_id);

                                setShowUploadModal(true);

                                loadUploadedFiles(item.fec_id);
                              }}
                            >
                              <Upload size={16} />
                              <span>Upload</span>
                            </div>
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <Pencil
                              size={16}
                              className="cursor-pointer text-yellow-600"
                              onClick={() => handleCertificationEdit(item)}
                            />
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <Trash2
                              size={16}
                              className="cursor-pointer text-red-600"
                              onClick={() =>
                                setDeleteModal({
                                  open: true,
                                  id: item.fec_id,
                                  type: "certification",
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-2 border">
                          No Data to Display.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION */}

            <div className="flex justify-between items-center mt-4 text-sm">
              <p>
                Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + entries, filteredData.length)} of{" "}
                {filteredData.length} entries
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="border px-3 py-1"
                >
                  <ChevronLeft size={14} />
                </button>

                <button className="bg-[#4f7f82] text-white px-3 py-1 rounded">
                  {currentPage}
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="border px-3 py-1"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* FORM SECTION */}

          <div ref={formRef} className="border-t p-6">
            {activeTab === "developed" ? (
              <div>
                <h2 className="text-lg font-semibold text-[#4f7f82] mb-5">
                  Add / Edit E-Content Developed
                </h2>

                {/* form fields continue */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT SIDE */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm">
                        E-Content Types :<span className="text-red-500">*</span>
                      </label>

                      <select
                        value={developedForm.eContentType}
                        onChange={(e) =>
                          setDevelopedForm({
                            ...developedForm,
                            eContentType: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                      >
                        {eContentTypeDropdown.map((item: any) => (
                          <option key={item.id} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>

                      {errors.eContentType && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.eContentType}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm">
                        Name/title of the course developed :
                        <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        rows={2}
                        value={developedForm.courseTitle}
                        onChange={(e) =>
                          setDevelopedForm({
                            ...developedForm,
                            courseTitle: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm resize-none h-[40px]"
                        placeholder="Enter course title"
                      />

                      {errors.courseTitle && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.courseTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm">
                        Year :<span className="text-red-500">*</span>
                      </label>

                      <div className="relative">
                        <DatePicker
                          selected={
                            developedForm.year
                              ? new Date(developedForm.year)
                              : null
                          }
                          onChange={(date: Date | null) =>
                            setDevelopedForm({
                              ...developedForm,
                              year: date
                                ? date.toISOString().split("T")[0]
                                : "",
                            })
                          }
                          dateFormat="dd-MM-yyyy"
                          placeholderText="Select Date"
                          className="w-full border px-3 py-2 pr-10 text-sm"
                        />

                        <Calendar
                          size={18}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                      </div>

                      {errors.year && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.year}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* BUTTONS BELOW FORM */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleDevelopedSave}
                    className="bg-[#4f7f82] text-white px-5 py-2 rounded"
                  >
                    {editingDevelopedId !== null ? "Update" : "Save"}
                  </button>

                  <button
                    onClick={() => {
                      setDevelopedForm({
                        eContentType: "",
                        courseTitle: "",
                        year: "",
                      });

                      setErrors({});

                      setEditingDevelopedId(null);
                    }}
                    className="bg-amber-600 text-white px-5 py-2 rounded "
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-[#4f7f82] mb-5">
                  Add / Edit E-Content Certifications
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* LEFT */}

                  <div className="space-y-5">
                    <div>
                      <label className="text-sm">
                        Name of Course Passed :
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        value={certificationForm.coursePassed}
                        onChange={(e) =>
                          setCertificationForm({
                            ...certificationForm,
                            coursePassed: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter course name"
                      />

                      {errors.coursePassed && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.coursePassed}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm">
                        Course Offered by (agency) :
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        value={certificationForm.agency}
                        onChange={(e) =>
                          setCertificationForm({
                            ...certificationForm,
                            agency: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter agency"
                      />

                      {errors.agency && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.agency}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div className="space-y-5">
                    <div>
                      <label className="text-sm">Grade obtained if any:</label>

                      <input
                        type="text"
                        value={certificationForm.grade}
                        onChange={(e) =>
                          setCertificationForm({
                            ...certificationForm,
                            grade: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter grade"
                      />
                    </div>

                    <div>
                      <label className="text-sm">
                        Year :<span className="text-red-500">*</span>
                      </label>

                      <div className="relative">
                        <DatePicker
                          selected={
                            certificationForm.year
                              ? new Date(certificationForm.year)
                              : null
                          }
                          onChange={(date: Date | null) =>
                            setCertificationForm({
                              ...certificationForm,
                              year: date
                                ? date.toISOString().split("T")[0]
                                : "",
                            })
                          }
                          dateFormat="dd-MM-yyyy"
                          placeholderText="Select Date"
                          className="w-full border px-3 py-2 pr-10 text-sm"
                        />

                        <Calendar
                          size={18}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                      </div>

                      {errors.year && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.year}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-5">
                      <button
                        onClick={handleCertificationSave}
                        className="bg-[#4f7f82] text-white px-5 py-2 rounded"
                      >
                        {editingCertificationId !== null ? "Update" : "Save"}
                      </button>

                      <button
                        onClick={() => {
                          setCertificationForm({
                            coursePassed: "",
                            agency: "",
                            grade: "",
                            year: "",
                          });

                          setErrors({});

                          setEditingCertificationId(null);
                        }}
                        className="bg-amber-600 text-white px-5 py-2 rounded"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-[350px]">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>

            <p className="text-sm mb-5">
              Are you sure you want to delete this record?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    id: null,
                    type: "",
                  })
                }
                className="px-4 py-2 bg-red-600 text-white rounded"
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
                E-Countent Development/Certifications (MOOCs through SWAYAM,
                etc.)
              </h3>

              <div className="border rounded overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-[#f7f7f7]">
                    <tr>
                      <th className="border px-3 py-2">Select</th>

                      <th className="border px-3 py-2">Sl No.</th>

                      <th className="border px-3 py-2">File Name</th>

                      <th className="border px-3 py-2">Description</th>

                      <th className="border px-3 py-2">Date</th>

                      <th className="border px-3 py-2">Delete</th>
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
                              value={file.actual_date || ""}
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

                    uploadForm.append("fec_id", String(selectedId));

                    uploadForm.append("user_id", "1");

                    uploadForm.append("actual_date", today);

                    const response = await fetch(
                      "http://localhost:8000/faculty-econtent-development-certification/upload",
                      {
                        method: "POST",
                        body: uploadForm,
                      },
                    );

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

              <label
                onClick={handleSaveUploadedFiles}
                className="bg-[#4f7f82] text-white px-5 py-2 rounded"
              >
                Save
              </label>

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

export default EContentDevelopmentCertificationsPage;
