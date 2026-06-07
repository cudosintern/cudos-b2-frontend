import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Upload, Calendar, Filter } from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import DatePicker from "react-datepicker";
import "./ResearchPublicationPage.css";
import "react-datepicker/dist/react-datepicker.css";
import {
  getDropdowns,
  getPublications,
  savePublication,
  updatePublication,
  deletePublication,
  uploadResearchPublicationFile,
  getResearchPublicationUploadList,
  deleteResearchPublicationUpload,
  updateResearchPublicationUpload,
  bulkSavePublications,
} from "./researchPublicationApi";
import * as XLSX from "xlsx";

import {
  downloadResearchPublicationTemplate,
  validateResearchPublicationExcel,
} from "./researchPublicationExcel";
type ColumnKey =
  | "title"
  | "co_authors"
  | "page_no"
  | "publication_title"
  | "publication_date"
  | "publisher"
  | "vol_no"
  | "issn"
  | "citation_count"
  | "doi"
  | "impact_factor";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";
type DateInputProps = {
  value?: string;
  onClick?: () => void;
};

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onClick }, ref) => (
    <div className="relative w-full">
      <input
        onClick={onClick}
        ref={ref}
        value={value}
        readOnly
        placeholder="Select Month & Year"
        className="border w-full px-2 py-1 pr-10 cursor-pointer"
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
        <Calendar size={18} />
      </div>
    </div>
  ),
);

DateInput.displayName = "DateInput";
const ResearchPublicationPage = () => {
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      title: "",
      co_authors: "",
      page_no: "",
      publication_title: "",
      publication_date: "",
      publisher: "",
      vol_no: "",
      issn: "",
      citation_count: "",
      doi: "",
      impact_factor: "",
    },
  );
  const formRef = React.useRef<HTMLDivElement | null>(null);
  const [showImportSuccessModal, setShowImportSuccessModal] = useState(false);

  const [showFileNotUploadedModal, setShowFileNotUploadedModal] =
    useState(false);
  const [uploadedExcelFile, setUploadedExcelFile] = useState<File | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkErrors, setBulkErrors] = useState<any[]>([]);
  const [bulkSuccessData, setBulkSuccessData] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [uploadPublicationId, setUploadPublicationId] = useState<number | null>(
    null,
  );

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);
  const loadUploadedFiles = async (publicationId: number) => {
    const res = await getResearchPublicationUploadList(publicationId);

    if (res.status) {
      setUploadedFiles(res.data || []);
      setEditableFiles(res.data || []);
    }
  };
  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        const formData = new FormData();

        formData.append("description", file.description || "");

        formData.append("actual_date", file.actual_date || "");

        await updateResearchPublicationUpload(file.id, formData);
      }

      toast.success("Updated Successfully");

      if (uploadPublicationId) {
        loadUploadedFiles(uploadPublicationId);
      }
    } catch {
      toast.error("Update Failed");
    }
  };
  const confirmUploadDelete = async () => {
    if (!uploadDeleteId) return;

    const res = await deleteResearchPublicationUpload(uploadDeleteId);

    if (res.status) {
      toast.success("Deleted Successfully");

      if (uploadPublicationId) {
        loadUploadedFiles(uploadPublicationId);
      }
    } else {
      toast.error("Delete Failed");
    }

    setShowUploadDeleteModal(false);
    setUploadDeleteId(null);
  };
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };
  const userId = 1;
  const [publicationYear, setPublicationYear] = useState<Date | null>(null);
  // const [abstract, setAbstract] = useState("");
  const [showAwardSpec, setShowAwardSpec] = useState(false);
  const [showInstitutionSpec, setShowInstitutionSpec] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [entries, setEntries] = useState(10);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [data, setData] = useState<any[]>([]);
  const [filterTypes, setFilterTypes] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<number | undefined>(
    undefined,
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
  // 🔥 LOAD FILTER DROPDOWN
  useEffect(() => {
    fetchFilterTypes();
  }, []);

  // 🔥 LOAD TABLE DATA WHEN FILTER CHANGES
  useEffect(() => {
    fetchPublications();
  }, [selectedFilter]);
  const fetchFilterTypes = async () => {
    try {
      const res = await getDropdowns();

      const types = res.types || [];
      const levels = res.levels || [];
      const status = res.status || [];

      setDropdowns({
        types,
        levels,
        status,
      });

      setFilterTypes(types);

      // 🔥 AUTO SELECT FIRST VALUES
      setSelectedFilter(types.length > 0 ? types[0].mt_details_id : undefined);

      setFormData((prev: any) => ({
        ...prev,

        // Type dropdown first value
        type: types.length > 0 ? types[0].mt_details_id : "",

        // Level dropdown first value
        level: levels.length > 0 ? levels[0].mt_details_id : "",

        // Status dropdown first value
        status: status.length > 0 ? status[0].mt_details_id : "",
      }));
    } catch {
      toast.error("Failed to load filter types");
    }
  };
  const fetchPublications = async () => {
    try {
      const res = await getPublications(userId, selectedFilter);
      setData(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch data");
    }
  };
  const [dropdowns, setDropdowns] = useState<any>({
    types: [],
    levels: [],
    status: [],
  });

  // useEffect(() => {
  //   loadDropdowns();
  // }, []);

  const [formData, setFormData] = useState<any>({
    title: "",
    publicationTitle: "",
    type: "",
    level: "",
    authors: "",
    pageNo: "",
    volume: "",
    issue: "",
    year: "",
    issn: "",
    doi: "",
    publisher: "",
    indexTerms: "",
    abstract: "",
    impactFactor: "",
    snip: "",
    sjr: "",
    conference: "",
    organizer: "",
    award: "",
    institution: "",
    status: "",
    hIndex: "",
    i10Index: "",
    citation_count: "",
    publishedUrl: "",
    quartile: "",
  });
  const showError = (field: string) =>
    errors[field] && (
      <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
    );
  const [errors, setErrors] = useState<any>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const handleSave = async () => {
    console.log("Save clicked");
    console.log(formData);

    if (!validateForm()) return;

    const payload = {
      user_id: userId,

      title: formData.title,

      publication_title: formData.publicationTitle,

      publication_type: Number(formData.type),

      publication_level: Number(formData.level),

      co_authors: formData.authors,

      citation_count: formData.citationCount,

      hindex: formData.hIndex ? Number(formData.hIndex) : 0,

      i10_index: formData.i10Index ? Number(formData.i10Index) : 0,

      vol_no: formData.volume,

      issue_no: formData.issue,

      pages: formData.pageNo,

      page_no: formData.pageNo,

      publication_date: formData.year,

      issn: formData.issn,

      doi: formData.doi,

      publisher: formData.publisher,

      publication_online: formData.publishedUrl,

      index_terms: formData.indexTerms,

      abstract: formData.abstract,

      impact_factor: formData.impactFactor,

      snip: formData.snip,

      sjr: formData.sjr,

      quartile: formData.quartile,

      conference_name: formData.conference,

      event_organizer_name: formData.organizer,

      publication_prize_won: showAwardSpec ? formData.award : "",

      inst_affiliation_name: showInstitutionSpec ? formData.institution : "",

      status: Number(formData.status),
    };

    try {
      const res = editId
        ? await updatePublication(editId, payload)
        : await savePublication(payload);

      console.log("API RESPONSE:", res);

      if (res.status) {
        toast.success(res.message || "Saved successfully");
        fetchPublications();
        handleReset();
        setShowAwardSpec(false);
        setShowInstitutionSpec(false);
      } else {
        toast.error(res.message || "Save failed");
      }
    } catch (error: any) {
      console.error("SAVE ERROR:", error);
      toast.error(error.message || "Network/API error");
    }
  };
  const handleReset = () => {
    setFormData({
      title: "",
      publicationTitle: "",
      type: dropdowns.types.length > 0 ? dropdowns.types[0].mt_details_id : "",
      level:
        dropdowns.levels.length > 0 ? dropdowns.levels[0].mt_details_id : "",
      status:
        dropdowns.status.length > 0 ? dropdowns.status[0].mt_details_id : "",
      authors: "",
      pageNo: "",
      volume: "",
      issue: "",
      year: "",
      issn: "",
      doi: "",
      publisher: "",
      indexTerms: "",
      abstract: "",
      impactFactor: "",
      snip: "",
      sjr: "",
      conference: "",
      organizer: "",
      award: "",
      institution: "",
      hIndex: "",
      i10Index: "",
      citationCount: "",
      publishedUrl: "",
      quartile: "",
    });

    setPublicationYear(null);
    setEditId(null);

    // ✅ ADD THIS (IMPORTANT)
    setShowAwardSpec(false);
    setShowInstitutionSpec(false);
  };
  const handleEdit = (row: any) => {
    setEditId(row.id);

    setFormData({
      title: row.title || "",
      publicationTitle: row.publication_title || "",
      type: Number(row.publication_type) || "",
      level: Number(row.publication_level) || "",
      status: Number(row.status) || "",
      authors: row.co_authors || "",
      pageNo: row.page_no || "",
      volume: row.vol_no || "",
      issue: row.issue_no || "",
      year: row.publication_date || "",
      issn: row.issn || "",
      doi: row.doi || "",
      publisher: row.publisher || "",
      indexTerms: row.index_terms || "",
      citationCount: row.citation_count || "",
      abstract: row.abstract || "",
      impactFactor: row.impact_factor || "",
      snip: row.snip || "",
      sjr: row.sjr || "",
      conference: row.conference_name || "",
      organizer: row.event_organizer_name || "",
      award: row.publication_prize_won || "",
      institution: row.inst_affiliation_name || "",
      hIndex: row.hindex || "",
      i10Index: row.i10_index || "",
      publishedUrl: row.publication_online || "",
      quartile: row.quartile || "",
    });

    const publicationDate =
      row.publication_date && !isNaN(new Date(row.publication_date).getTime())
        ? new Date(row.publication_date)
        : null;

    setPublicationYear(publicationDate);

    setShowAwardSpec(!!row.publication_prize_won);
    setShowInstitutionSpec(!!row.inst_affiliation_name);

    // ✅ SCROLL TO FORM
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;

    const res = await deletePublication(deleteId);

    if (res.status === true) {
      toast.success("Deleted successfully");
      fetchPublications();
    } else {
      toast.error("Delete failed");
    }

    setShowDeleteModal(false);
    setDeleteId(null);
  };
  const validateForm = () => {
    let err: any = {};

    // REQUIRED
    if (!formData.title.trim()) err.title = "Title is required";

    if (!formData.publicationTitle.trim())
      err.publicationTitle = "Publication title required";

    if (!formData.type) err.type = "Type required";

    if (!formData.level) err.level = "Level required";

    const plainAbstract = formData.abstract
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/&nbsp;/g, "")
      ?.trim();

    if (!plainAbstract) {
      err.abstract = "Abstract required";
    }

    // ONLY NUMBERS
    if (formData.hIndex && !/^[0-9]+$/.test(formData.hIndex)) {
      err.hIndex = "Only numbers allowed";
    }

    if (formData.i10Index && !/^[0-9]+$/.test(formData.i10Index)) {
      err.i10Index = "Only numbers allowed";
    }

    // PAGE NUMBER
    if (formData.pageNo && !/^[0-9,-]+$/.test(formData.pageNo)) {
      err.pageNo = "Only numbers, comma and hyphen allowed";
    }

    // DOI
    if (formData.doi && formData.doi.length > 100) {
      err.doi = "DOI too long";
    }

    // ISSN
    if (formData.issn && !/^[A-Za-z0-9-]+$/.test(formData.issn)) {
      err.issn = "Only letters, numbers and hyphen allowed";
    }

    // // URL
    // if (
    //   formData.publishedUrl &&
    //   !/^https?:\/\/.+/.test(formData.publishedUrl)
    // ) {
    //   err.publishedUrl =
    //     "Enter valid URL";
    // }

    // IMPACT FACTOR
    if (formData.impactFactor && !/^[0-9.]+$/.test(formData.impactFactor)) {
      err.impactFactor = "Only numeric values allowed";
    }

    // AWARD
    if (showAwardSpec && !formData.award.trim()) {
      err.award = "Award details required";
    }

    // INSTITUTION
    if (showInstitutionSpec && !formData.institution.trim()) {
      err.institution = "Institution required";
    }
    console.log("VALIDATION ERRORS:", err);
    setErrors(err);

    return Object.keys(err).length === 0;
  };

  // 🔍 SEARCH FILTER
  const filteredData = Array.isArray(data)
    ? data.filter((item: any) => {
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
      })
    : [];

  // 📄 PAGINATION
  const startIndex = (currentPage - 1) * entries;
  const currentData = filteredData.slice(startIndex, startIndex + entries);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 mb-6">
        <h2 className="text-lg font-semibold">Research Publication</h2>
      </div>

      {/* COLLAPSIBLE */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border p-3 font-semibold text-[#4f7f82] cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        Research Publication
      </div>

      {isOpen && (
        <div className="bg-white border p-4">
          {/* 🔥 FILTER TYPE DROPDOWN */}
          <div className="mb-4 flex items-center gap-2">
            <label className="font-semibold whitespace-nowrap">
              Filter Type by:
            </label>

            <select
              value={selectedFilter}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedFilter(value ? Number(value) : undefined);
              }}
              className="border w-[250px] px-2 py-1 text-sm"
            >
              {dropdowns.types.map((item: any) => (
                <option key={item.mt_details_id} value={item.mt_details_id}>
                  {item.mt_details_name}
                </option>
              ))}
            </select>

            {showError("type")}
          </div>

          {/* CONTROLS */}
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
                  <option key={num} value={num}>
                    {num}
                  </option>
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

          {/* 🔥 TABLE WITH HORIZONTAL SCROLL */}
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1200px] border mb-20">
              <thead className="bg-[#f3f3f3]">
                <tr>
                  {(
                    [
                      { key: "title", label: "Title" },
                      { key: "co_authors", label: "Co Authors" },
                      { key: "page_no", label: "Page No" },
                      { key: "publication_title", label: "Publication Title" },
                      { key: "publication_date", label: "Publication Date" },
                      { key: "publisher", label: "Publisher" },
                      { key: "vol_no", label: "Volume" },
                      { key: "issn", label: "ISSN" },
                      { key: "citation_count", label: "Citation Count" },
                      { key: "doi", label: "DOI" },
                      { key: "impact_factor", label: "Impact Factor" },
                    ] as { key: ColumnKey; label: string }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="border px-3 py-2 text-left relative"
                    >
                      <div className="flex items-center justify-between">
                        <span>{col.label}</span>
                        <Filter
                          className="w-4 h-4 min-w-4 min-h-4 mt-1 text-black hover:text-blue-600 cursor-pointer flex-shrink-0"
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

                  <th className="border px-3 py-2 text-center">Upload</th>
                  <th className="border px-3 py-2 text-center">Edit</th>
                  <th className="border px-3 py-2 text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(
                  currentData.reduce((acc: any, item: any) => {
                    const levelName =
                      dropdowns.levels.find(
                        (x: any) => x.mt_details_id == item.publication_level,
                      )?.mt_details_name || "-";

                    if (!acc[levelName]) {
                      acc[levelName] = [];
                    }

                    acc[levelName].push(item);

                    return acc;
                  }, {}),
                ).map(([levelName, items]: any) => (
                  <React.Fragment key={levelName}>
                    {/* GROUP HEADER */}
                    <tr className="bg-gray-300 font-semibold">
                      <td colSpan={14} className="border p-2">
                        {levelName}
                      </td>
                    </tr>

                    {/* ROWS */}
                    {items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="border p-2">{item.title}</td>

                        <td className="border p-2">{item.co_authors}</td>

                        <td className="border p-2">{item.page_no}</td>

                        <td className="border p-2">{item.publication_title}</td>

                        <td className="border p-2">
                          {item.publication_date &&
                          !isNaN(new Date(item.publication_date).getTime())
                            ? new Date(
                                item.publication_date,
                              ).toLocaleDateString("en-CA", {
                                year: "numeric",
                                month: "2-digit",
                              })
                            : ""}
                        </td>

                        <td className="border p-2">{item.publisher}</td>

                        <td className="border p-2">{item.vol_no}</td>

                        <td className="border p-2">{item.issn}</td>

                        <td className="border p-2">{item.citation_count}</td>

                        <td className="border p-2">{item.doi}</td>

                        <td className="border p-2">{item.impact_factor}</td>

                        {/* UPLOAD */}
                        <td className="border p-2 text-center">
                          <button
                            className="flex items-center gap-1 text-[#4f7f82] hover:underline"
                            onClick={async () => {
                              setUploadPublicationId(item.id);
                              await loadUploadedFiles(item.id);
                              setShowUploadModal(true);
                            }}
                          >
                            <Upload size={16} />
                            Upload
                          </button>
                        </td>

                        {/* EDIT */}
                        <td className="border p-2 text-center">
                          <button
                            className="text-yellow-600 hover:text-yellow-800"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil size={16} />
                          </button>
                        </td>

                        {/* DELETE */}
                        <td className="border p-2 text-center">
                          <button
                            className="text-red-600"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {/* ===================== FORM SECTION ===================== */}
          <div ref={formRef} className="mt-10 bg-white border p-4">
            <h3 className="text-[#4f7f82] font-semibold mb-4">
              Add / Edit Research Publication
            </h3>

            {/* 3 COLUMN LAYOUT (Abstract moved to next column) */}
            <div className="grid grid-cols-3 gap-6">
              {/* ================= LEFT COLUMN ================= */}
              <div className="space-y-3">
                <div>
                  <label>
                    Title of Paper:<span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="border w-full px-2 py-1"
                    placeholder="Enter title of paper"
                  />
                  {showError("title")}
                </div>

                <div>
                  <label>
                    Publication/Journal Title:
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.publicationTitle}
                    onChange={(e) =>
                      handleChange("publicationTitle", e.target.value)
                    }
                    className="border w-full px-2 py-1"
                    placeholder="Enter Publication / Journal title"
                  />
                  {showError("publicationTitle")}
                </div>

                <div>
                  <label>Author(s)</label>
                  <textarea
                    value={formData.authors}
                    onChange={(e) => handleChange("authors", e.target.value)}
                    className="border w-full px-2 py-1"
                    placeholder="Enter Author(s)"
                  />
                </div>

                <div>
                  <label>Page No.</label>
                  <input
                    type="text"
                    value={formData.pageNo}
                    onChange={(e) => {
                      const value = e.target.value;

                      handleChange("pageNo", value);

                      setErrors((prev: any) => ({
                        ...prev,
                        pageNo:
                          value && !/^[0-9,-]+$/.test(value)
                            ? "Only numbers, comma and hyphen allowed"
                            : "",
                      }));
                    }}
                    className="border w-full px-2 py-1"
                    placeholder="Enter Page No. Ex:1-10,13,19"
                  />
                  {showError("pageNo")}
                </div>

                <div>
                  <label>Scimago h-Index</label>
                  <input
                    type="text"
                    value={formData.hIndex}
                    onChange={(e) => {
                      const value = e.target.value;

                      handleChange("hIndex", value);

                      setErrors((prev: any) => ({
                        ...prev,
                        hIndex:
                          value && !/^[0-9]+$/.test(value)
                            ? "Only numbers allowed"
                            : "",
                      }));
                    }}
                    className="border w-full px-2 py-1"
                    placeholder="Only Digits!"
                  />
                  {showError("hIndex")}
                </div>

                <div>
                  <label>i10-Index Author</label>
                  <input
                    type="text"
                    value={formData.i10Index}
                    onChange={(e) => handleChange("i10Index", e.target.value)}
                    className="border w-full px-2 py-1"
                    placeholder="Enter i10-Index"
                  />
                  {showError("i10Index")}
                </div>

                <div>
                  <label>Indexing Scopus / SCI / Peer Reviewed</label>

                  <input
                    type="text"
                    className="border w-full px-2 py-1"
                    placeholder="Enter Scopus / SCI / ESCI / SCIE / Non-Scopus"
                    value={formData.citationCount}
                    onChange={(e) =>
                      handleChange("citationCount", e.target.value)
                    }
                  />

                  {showError("citationCount")}
                </div>

                <div>
                  <label>Scopus SNIP</label>
                  <input
                    type="text"
                    value={formData.snip}
                    onChange={(e) => handleChange("snip", e.target.value)}
                    className="border w-full px-2 py-1"
                    placeholder="Enter Source Normalized Impact per Paper"
                  />
                </div>

                <div>
                  <label>Digital Object Identifier (DOI):</label>
                  <input
                    className="border w-full px-2 py-1"
                    value={formData.doi}
                    onChange={(e) => handleChange("doi", e.target.value)}
                    placeholder="Enter Digital Object Identifier"
                  />
                  {showError("doi")}
                </div>
              </div>
              {/* ================= MIDDLE COLUMN ================= */}
              <div className="space-y-3">
                <div>
                  <label>
                    Type:<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      handleChange("type", Number(e.target.value))
                    }
                    className="border w-full px-2 py-1"
                  >
                    {showError("type")}

                    {dropdowns.types.map((item: any) => (
                      <option
                        key={item.mt_details_id}
                        value={item.mt_details_id}
                      >
                        {item.mt_details_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>
                    Level / Status: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      handleChange("level", Number(e.target.value))
                    }
                    className="border w-full px-2 py-1"
                  >
                    {showError("level")}
                    {dropdowns.levels.map((item: any) => (
                      <option
                        key={item.mt_details_id}
                        value={item.mt_details_id}
                      >
                        {item.mt_details_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>ISSN / ISBN</label>
                  <input
                    className="border w-full px-2 py-1"
                    value={formData.issn}
                    onChange={(e) => handleChange("issn", e.target.value)}
                    placeholder="nternational Standard Serial Number"
                  />
                  {showError("issn")}
                </div>

                <div>
                  <label>Published URL</label>
                  <input
                    className="border w-full px-2 py-1"
                    value={formData.publishedUrl}
                    onChange={(e) =>
                      handleChange("publishedUrl", e.target.value)
                    }
                    placeholder="Enter Published URL"
                  />
                </div>

                <div>
                  <label>Index Term(s)</label>
                  <textarea
                    className="border w-full px-2 py-1"
                    value={formData.indexTerms}
                    onChange={(e) => handleChange("indexTerms", e.target.value)}
                    placeholder="Enter Index Term(s)"
                  />
                </div>

                <div>
                  <label>Quartile</label>
                  <select
                    className="border w-full px-2 py-1"
                    value={formData.quartile}
                    onChange={(e) => handleChange("quartile", e.target.value)}
                  >
                    <option>Q1</option>
                    <option>Q2</option>
                    <option>Q3</option>
                    <option>Q4</option>
                  </select>
                </div>

                <div>
                  <label>Volume No.</label>
                  <input
                    className="border w-full px-2 py-1"
                    value={formData.volume}
                    onChange={(e) => handleChange("volume", e.target.value)}
                    placeholder="Enter Volume No."
                  />
                </div>

                <div>
                  <label>Issue No.</label>
                  <input
                    className="border w-full px-2 py-1"
                    value={formData.issue}
                    onChange={(e) => handleChange("issue", e.target.value)}
                    placeholder="Enter Issue Number"
                  />
                </div>

                <div className="relative w-full">
                  <label>Publication Year:</label>
                  <DatePicker
                    selected={publicationYear}
                    onChange={(date: Date | null) => {
                      setPublicationYear(date);

                      handleChange(
                        "year",
                        date
                          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`
                          : "",
                      );
                    }}
                    showMonthYearPicker
                    dateFormat="yyyy-MM"
                    customInput={<DateInput />}
                  />
                </div>
              </div>
              {/* ================= RIGHT COLUMN ================= */}
              <div className="space-y-3">
                <div>
                  <label>Scopus SJR Index</label>
                  <input
                    type="text"
                    className="border w-full px-2 py-1"
                    value={formData.sjr}
                    onChange={(e) => handleChange("sjr", e.target.value)}
                    placeholder="Enter Scientific Journal Rankings Index"
                  />
                </div>

                <div>
                  <label>
                    Status: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleChange("status", Number(e.target.value))
                    }
                    className="border w-full px-2 py-1"
                  >
                    {dropdowns.status.map((item: any) => (
                      <option
                        key={item.mt_details_id}
                        value={item.mt_details_id}
                      >
                        {item.mt_details_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Publisher</label>
                  <textarea
                    className="border w-full px-2 py-1"
                    value={formData.publisher}
                    onChange={(e) => handleChange("publisher", e.target.value)}
                    placeholder="Enter Publisher"
                  />
                </div>

                {/* AWARDS */}
                <div className="flex ">
                  <label>Any awards it has won:</label>
                  <input
                    type="checkbox"
                    checked={showAwardSpec}
                    onChange={(e) => setShowAwardSpec(e.target.checked)}
                  />
                </div>

                {showAwardSpec && (
                  <div>
                    <label>
                      Specify <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="border w-full px-2 py-1"
                      value={formData.award}
                      onChange={(e) => handleChange("award", e.target.value)}
                    />
                    {showError("award")}
                  </div>
                )}

                <div>
                  <label>Impact Factor</label>
                  <input
                    className="border w-full px-2 py-1"
                    value={formData.impactFactor}
                    onChange={(e) => {
                      const value = e.target.value;

                      handleChange("impactFactor", value);

                      setErrors((prev: any) => ({
                        ...prev,
                        impactFactor:
                          value && !/^[0-9.]+$/.test(value)
                            ? "Only numeric values allowed"
                            : "",
                      }));
                    }}
                    placeholder="Enter Impact Factor"
                  />
                  {showError("impactFactor")}
                </div>

                {/* INSTITUTION */}
                <div className="flex ">
                  <label>Institutional affiliation (If yes, check): </label>
                  <input
                    type="checkbox"
                    checked={showInstitutionSpec}
                    onChange={(e) => setShowInstitutionSpec(e.target.checked)}
                  />
                </div>

                {showInstitutionSpec && (
                  <div>
                    <label>
                      Specify <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="border w-full px-2 py-1"
                      value={formData.institution}
                      onChange={(e) =>
                        handleChange("institution", e.target.value)
                      }
                    />
                    {showError("institution")}
                  </div>
                )}
                <div>
                  <label>Event Organizer</label>
                  <input
                    className="border w-full px-2 py-1"
                    value={formData.organizer}
                    onChange={(e) => handleChange("organizer", e.target.value)}
                    placeholder="Enter Name of the Event Organizer"
                  />
                </div>
                <div>
                  <label>Name of Conference</label>
                  <input
                    className="border w-full px-2 py-1"
                    value={formData.conference}
                    onChange={(e) => handleChange("conference", e.target.value)}
                    placeholder="Enter Name of the Conference"
                  />
                </div>
              </div>
            </div>
            {/* ================= ABSTRACT FULL WIDTH ================= */}
            <div className="mt-6 flex flex-col gap-2">
              <label className="font-semibold text-gray-700">
                Abstract <span className="text-red-500">*</span>
              </label>

              <div className="border rounded-md overflow-hidden bg-white">
                <Editor
                  apiKey="no-api-key"
                  tinymceScriptSrc="/tinymce/tinymce.min.js"
                  value={formData.abstract}
                  onEditorChange={(content) =>
                    handleChange("abstract", content)
                  }
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
                {showError("abstract")}
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-4 py-2 rounded"
                onClick={() => setShowBulkImport((prev) => !prev)}
              >
                Bulk Import
              </button>

              <button
                className="px-4 py-2 text-sm rounded bg-amber-600 text-white hover:bg-amber-500"
                onClick={handleReset}
              >
                Reset
              </button>

              <button
                onClick={handleSave}
                type="button"
                className="bg-[#4f7f82] text-white px-5 py-2 rounded font-medium"
              >
                Save
              </button>
            </div>
          </div>
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded w-[400px] shadow-lg">
                <h2 className="text-lg mb-4 font-medium">
                  Delete Research Publication
                </h2>

                <p className="mb-6">
                  Are you sure you want to delete this record?
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-4 py-2 bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded font-medium"
                    onClick={confirmDelete}
                  >
                    OK
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
                    }}
                    className="text-black text-xl font-bold"
                  >
                    ✖
                  </button>
                </div>

                {/* ================= BODY (SCROLL ONLY HERE) ================= */}
                <div className="p-5 overflow-y-auto flex-1">
                  <h3 className="font-semibold text-[18px] mb-4">Research</h3>

                  {/* TABLE */}
                  <div className="border rounded overflow-hidden">
                    <table className="w-full border-collapse">
                      {/* FIXED TABLE HEADER */}
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
                              {/* CHECKBOX */}
                              <td className="border px-3 py-2 text-center">
                                <input type="checkbox" />
                              </td>

                              {/* SERIAL */}
                              <td className="border px-3 py-2">{index + 1}</td>

                              {/* FILE */}
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
                                  value={
                                    editableFiles[index]?.description || ""
                                  }
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
                  <div className="mt-4 mb-2 p-3 text-sm ">
                    <label>
                      <span className="font-semibold">Upload Note:</span>
                      Participation Certificate
                    </label>
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
                  <label className="bg-[#4f7f82] text-white px-5 py-2 rounded cursor-pointer">
                    {uploadedFiles.length > 0 ? "Upload more" : "Upload"}

                    <input
                      type="file"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];

                        if (!file || !uploadPublicationId) return;

                        const formData = new FormData();

                        formData.append("file", file);

                        formData.append("user_id", String(userId));

                        formData.append(
                          "publication_id",
                          String(uploadPublicationId),
                        );

                        const res =
                          await uploadResearchPublicationFile(formData);

                        if (res.status) {
                          toast.success("Uploaded Successfully");

                          loadUploadedFiles(uploadPublicationId);
                        }
                      }}
                    />
                  </label>

                  {/* SAVE */}
                  <label
                    className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded font-medium"
                    onClick={handleSaveUploadedFiles}
                  >
                    Save
                  </label>

                  {/* CLOSE */}
                  <label
                    className="bg-red-500 text-white px-5 py-2 rounded"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Close
                  </label>
                </div>
              </div>
            </div>
          )}
          {showUploadDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded w-[400px] shadow-lg">
                <h2 className="text-lg font-semibold mb-4">
                  Delete Uploaded File
                </h2>

                <p className="mb-6">
                  Are you sure you want to delete this file?
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded"
                    onClick={() => {
                      setShowUploadDeleteModal(false);
                      setUploadDeleteId(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-4 py-2 bg-[#4f7f82] text-white rounded"
                    onClick={confirmUploadDelete}
                  >
                    Ok
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ================= BULK IMPORT SECTION ================= */}
          {showBulkImport && (
            <div className="mt-6 border p-6">
              {/* HEADER */}
              <div className="bg-[#4f7f82] text-white px-6 py-3 font-bold flex justify-between items-center rounded-tl-[20px] rounded-tr-[0px] rounded-br-[20px] rounded-bl-[0px]">
                <h2 className="text-[20px]">
                  Upload Research publication List
                </h2>
              </div>

              {/* BODY */}
              <div className="bg-white border border">
                <div className="px-4 py-3 border-b font-semibold text-[16px]">
                  Steps to upload Research publication papers List:
                </div>

                <div className="px-4 py-3 border-b text-[15px]">
                  1. Click here to{" "}
                  <a
                    href="#"
                    className="text-[#4f7f82] font-semibold cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault(); // prevents page jump
                      downloadResearchPublicationTemplate(dropdowns);
                    }}
                  >
                    Download Template.
                  </a>
                </div>

                <div className="px-4 py-3 border-b text-[15px] leading-8">
                  2. Fill all the mandatory fields (
                  <span className="text-[#8b1c1c] font-semibold">
                    Type,Title of Paper, Publication/Journal Title, Indexing
                    Scopus/SCI/Peer Reviewed, Status,Level/Status, Publication
                    Year,Publisher
                  </span>
                  ) in the template and save it.
                </div>

                <div className="px-4 py-3 border-b text-[15px] leading-8">
                  3. Click on{" "}
                  <span className="text-[#4f7f82] font-bold italic">
                    "Upload"
                  </span>{" "}
                  button to upload .xls file from your computer. Make sure that
                  file name and headers are not altered.
                </div>

                <div className="px-4 py-3 border-b text-[15px] leading-8">
                  4. Click on{" "}
                  <span className="text-[#4f7f82] font-bold italic">
                    "Accept"
                  </span>{" "}
                  button to save the data and return to list page. Make sure
                  that all the remarks are resolved before proceeding.
                </div>

                <div className="px-4 py-3 text-[15px] leading-8">
                  5. Click on{" "}
                  <span className="text-red-600 font-bold">"Cancel"</span>{" "}
                  button to discard (if file has been uploaded) and return to
                  list page.
                </div>
              </div>

              {/* SUCCESS MESSAGE */}
              {bulkSuccessData.length > 0 && (
                <div className="mt-10">
                  <div className="text-center text-red-600 font-bold text-[18px] mb-5">
                    The following is the List of Research publication data.
                  </div>

                  <div className="text-green-700 font-bold text-[20px] leading-10 mb-5">
                    File imported successfully. Kindly verify / check the
                    uploaded data, if there are any remarks correct those and
                    re-upload the file.
                    <br />
                    If no remarks were found then click on Accept button for
                    final upload to the database
                  </div>

                  {/* TABLE */}
                  <div className="overflow-auto border bg-white">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-[#f3f3f3]">
                        <tr className="bg-[#f5f5f5]">
                          {Object.keys(bulkSuccessData[0]).map((key) => (
                            <th
                              key={key}
                              className={`border px-4 py-3 text-left whitespace-nowrap
                  ${key === "Remarks" ? "text-[#800000]" : ""}`}
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {bulkSuccessData.map((row: any, index: number) => (
                          <tr key={index}>
                            {Object.values(row).map((val: any, i: number) => (
                              <td
                                key={i}
                                className={`border px-4 py-3 align-top ${
                                  Object.keys(row)[i] === "Remarks"
                                    ? "text-[#800000]"
                                    : ""
                                }`}
                              >
                                {Object.keys(row)[i] === "Remarks" ? (
                                  <div className="min-w-[300px] max-w-[400px] whitespace-normal break-words leading-7">
                                    {String(val || "")
                                      .split(",")
                                      .map((msg) => msg.trim())
                                      .filter(Boolean)
                                      .map((msg, idx) => (
                                        <div key={idx}>
                                          <span className="font-bold">
                                            {msg.split(" ")[0]}
                                          </span>{" "}
                                          {msg.split(" ").slice(1).join(" ")}.
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  String(val || "")
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 mt-6">
                {/* UPLOAD */}
                <label className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded cursor-pointer font-medium">
                  Upload .xls
                  <input
                    type="file"
                    hidden
                    accept=".xls,.xlsx"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];

                      if (!file) return;

                      // CLEAR OLD DATA
                      setBulkSuccessData([]);
                      setBulkErrors([]);

                      // STORE FILE
                      setUploadedExcelFile(file);

                      try {
                        const data = await file.arrayBuffer();

                        const workbook = XLSX.read(data);

                        const sheet = workbook.Sheets[workbook.SheetNames[0]];

                        const rows = XLSX.utils.sheet_to_json(sheet, {
                          defval: "",
                          raw: false,
                          blankrows: false,
                        });

                        console.log("EXCEL ROWS:", rows);

                        // EMPTY FILE CHECK
                        if (!rows || rows.length === 0) {
                          toast.error("Excel file is empty");

                          setBulkSuccessData([
                            {
                              "Sl No.": 1,
                              Remarks: "File is empty",
                              Type: "",
                              "Title of Paper": "",
                              "Publication/Journal Title": "",
                              "Indexing Scopus/SCI/Peer Reviewed": "",
                              Status: "",
                              "Level/Status": "",
                              "Publication Year": "",
                              Publisher: "",
                            },
                          ]);

                          // RESET INPUT
                          e.target.value = "";

                          return;
                        }

                        // VALIDATE
                        const validatedRows = validateResearchPublicationExcel(
                          rows,
                          dropdowns,
                        );

                        console.log("VALIDATED ROWS:", validatedRows);

                        // UPDATE TABLE
                        setBulkSuccessData(validatedRows);

                        // CHECK ERRORS
                        const hasErrors = validatedRows.some(
                          (x: any) => String(x.Remarks || "").trim() !== "",
                        );

                        if (hasErrors) {
                        } else {
                          toast.success("File imported successfully");
                        }
                      } catch (error) {
                        console.log(error);

                        toast.error("Invalid Excel File");

                        setBulkSuccessData([]);
                      }

                      // IMPORTANT:
                      // ALLOW RE-UPLOAD OF SAME/CORRECTED FILE
                      e.target.value = "";
                    }}
                  />
                </label>

                {/* ACCEPT */}
                <label
                  className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded font-medium"
                  onClick={async () => {
                    // SHOW ONLY IF FILE NOT UPLOADED
                    if (!uploadedExcelFile || bulkSuccessData.length === 0) {
                      setShowFileNotUploadedModal(true);

                      return;
                    }

                    // VALIDATION ERRORS
                    const hasErrors = bulkSuccessData.some(
                      (row: any) => String(row.Remarks || "").trim() !== "",
                    );

                    if (hasErrors) {
                      toast.error(
                        "Please resolve all remarks before accepting",
                      );

                      return;
                    }

                    try {
                      const payloadData = bulkSuccessData.map((row: any) => {
                        const typeId = dropdowns.types.find(
                          (x: any) => x.mt_details_name === row["Type"],
                        )?.mt_details_id;

                        const statusId = dropdowns.status.find(
                          (x: any) => x.mt_details_name === row["Status"],
                        )?.mt_details_id;

                        const levelId = dropdowns.levels.find(
                          (x: any) => x.mt_details_name === row["Level/Status"],
                        )?.mt_details_id;

                        return {
                          user_id: userId,

                          title: row["Title of Paper"],

                          publication_title: row["Publication/Journal Title"],

                          publication_type: typeId,

                          citation_count:
                            row["Indexing Scopus/SCI/Peer Reviewed"],

                          status: statusId,

                          publication_level: levelId,

                          publication_date: row["Publication Year"]
                            ? `${row["Publication Year"]}-01`
                            : "",

                          publisher: row["Publisher"],

                          co_authors: row["Author(s)"],

                          page_no: row["Page No."],

                          hindex: row["Scimago h-Index"],

                          i10_index: row["i10-Index Author"],

                          snip: row["Scopus SNIP"],

                          doi: row["DOI"],

                          issn: row["ISSN / ISBN"],

                          publication_online: row["Published URL"],

                          index_terms: row["Index Terms"],

                          vol_no: row["Volume No."] || "",

                          issue_no: row["Issue No."] || "",

                          sjr: row["Scopus SJR Index"],

                          impact_factor: row["Impact Factor"],

                          conference_name: row["Conference Name"],

                          event_organizer_name: row["Event Organizer"],
                        };
                      });

                      const res = await bulkSavePublications(payloadData);

                      if (res.status === true) {
                        fetchPublications();

                        setBulkSuccessData([]);

                        setUploadedExcelFile(null);

                        setShowImportSuccessModal(true);
                      } else {
                        toast.error(res.message || "Failed to upload data");
                      }
                    } catch (error) {
                      toast.error("Backend insertion failed");
                    }
                  }}
                >
                  Accept .xls
                </label>

                {/* CANCEL */}
                <label
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded font-medium"
                  onClick={() => {
                    setBulkSuccessData([]);

                    setUploadedExcelFile(null);

                    setShowBulkImport(false);
                  }}
                >
                  Cancel
                </label>
              </div>
            </div>
          )}
          {showImportSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white w-[450px] rounded shadow-lg">
                <div className="text-[#4f7f82] px-4 py-3 rounded-t">
                  <h2 className="font-semibold">Data Imported Confirmation</h2>
                </div>

                <div className="p-6">
                  <p>The data has been uploaded successfully.</p>
                </div>

                <div className="flex justify-end p-4 border-t">
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded"
                    onClick={() => {
                      setShowImportSuccessModal(false);
                      setShowBulkImport(false);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* FILE NOT UPLOADED */}
          {showFileNotUploadedModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white w-[450px] rounded shadow-lg">
                <div className="bg-yellow-600 text-white px-4 py-3 rounded-t">
                  <h2 className="font-semibold">Warning</h2>
                </div>

                <div className="p-6">
                  Kindly upload the file before proceeding to accept.
                </div>

                <div className="flex justify-end p-4 border-t">
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded"
                    onClick={() => setShowFileNotUploadedModal(false)}
                  >
                    Close
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

export default ResearchPublicationPage;
