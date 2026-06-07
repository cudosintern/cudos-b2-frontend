import React, { useEffect, useMemo, useState, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Upload,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRightIcon,
  Calendar,
  Filter,
} from "lucide-react";
import {
  getDropdowns,
  getBooks,
  saveBook,
  getSingleBook,
  updateBook,
  deleteBook,
} from "./bookPublishedApi";
import { toast } from "react-toastify";

interface DropdownOption {
  id: number;
  name: string;
}

interface BookData {
  id?: number;
  book_title: string;
  type: string;
  published_date: Date | null;
  isbn: string;
  book_no: string;
  copyright_date: Date | null;
  no_of_chapters: number | "";
  author: string;
  co_authors: string;
  languages: string;
  published_in: string;
  publisher: string;
  about_book: string;
}

type ColumnKey =
  | "book_title"
  | "author"
  | "co_authors"
  | "isbn"
  | "languages"
  | "publisher"
  | "published_year";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

const BookPublishedPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      book_title: "",
      author: "",
      co_authors: "",
      isbn: "",
      languages: "",
      publisher: "",
      published_year: "",
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
  const [isOpen, setIsOpen] = useState(true);

  // TABLE
  const [tableData, setTableData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // DROPDOWNS
  const [bookTypes, setBookTypes] = useState<DropdownOption[]>([]);
  const [authors, setAuthors] = useState<DropdownOption[]>([]);

  // FORM
  const [formData, setFormData] = useState<BookData>({
    book_title: "",
    type: "",
    published_date: null,
    isbn: "",
    book_no: "",
    copyright_date: null,
    no_of_chapters: "",
    author: "",
    co_authors: "",
    languages: "",
    published_in: "",
    publisher: "",
    about_book: "",
  });

  // ERRORS
  const [errors, setErrors] = useState<any>({});

  // FETCH DROPDOWNS
  useEffect(() => {
    fetchDropdowns();
    fetchBookData();
  }, []);

  const fetchDropdowns = async () => {
    try {
      // Pass user_id, default 1
      const userId = 1;

      const data = await getDropdowns(userId);

      console.log("Dropdown Data:", data);

      setBookTypes(data.book_types || []);
      setAuthors(data.authors || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch dropdowns");
    }
  };

  // FETCH TABLE DATA
  const fetchBookData = async () => {
    try {
      const response = await fetch("http://localhost:8000/book-published/list");

      const data = await response.json();

      console.log("API RESPONSE:", data);

      // HANDLE DIFFERENT RESPONSE STRUCTURES
      if (Array.isArray(data)) {
        setTableData(data);
      } else if (Array.isArray(data.data)) {
        setTableData(data.data);
      } else if (Array.isArray(data.results)) {
        setTableData(data.results);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch book data");
      setTableData([]);
    }
  };

  // SEARCH FILTER
  const filteredData = useMemo(() => {
    if (!Array.isArray(tableData)) return [];

    return tableData.filter((item: any) => {
      // GLOBAL SEARCH
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      // COLUMN FILTERS
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

        if (key === "published_year") {
          cellValue = item.published_year
            ? `${new Date(item.published_year).getFullYear()}-${String(
                new Date(item.published_year).getMonth() + 1,
              ).padStart(2, "0")}`.toLowerCase()
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

  // PAGINATION
  const totalPages = Math.ceil(filteredData.length / entries);

  const startIndex = (currentPage - 1) * entries;

  const paginatedData = filteredData.slice(startIndex, startIndex + entries);

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

  // INPUT CHANGE
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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

  // VALIDATION
  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.book_title.trim()) {
      newErrors.book_title = "Book title is required";
    }

    if (!formData.type) {
      newErrors.type = "Type is required";
    }

    if (!formData.published_date) {
      newErrors.published_date = "Published date is required";
    }

    if (!formData.isbn.trim()) {
      newErrors.isbn = "ISBN is required";
    }

    if (!formData.copyright_date) {
      newErrors.copyright_date = "Copyright date is required";
    }

    if (!formData.author) {
      newErrors.author = "Author is required";
    }

    if (!formData.publisher.trim()) {
      newErrors.publisher = "Publisher is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // SAVE
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const payload = {
        text_ref_id: formData.id,

        book_title: formData.book_title,
        type: formData.type,
        isbn: formData.isbn,
        book_no: formData.book_no,
        author: formData.author,
        co_authors: formData.co_authors,
        languages: formData.languages,
        published_in: formData.published_in,
        publisher: formData.publisher,
        about_book: formData.about_book,

        no_of_chapters:
          formData.no_of_chapters === "" || formData.no_of_chapters === null
            ? null
            : Number(formData.no_of_chapters),

        published_date: formData.published_date
          ? formData.published_date.toISOString().split("T")[0]
          : null,

        copyright_date: formData.copyright_date
          ? formData.copyright_date.toISOString().split("T")[0]
          : null,
      };

      let response;

      // UPDATE
      if (formData.id) {
        response = await fetch(
          `http://localhost:8000/book-published/update/${formData.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
      } else {
        // SAVE
        response = await fetch("http://localhost:8000/book-published/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast.success(
          formData.id ? "Book updated successfully" : "Book saved successfully",
        );

        resetForm();

        fetchBookData();
      } else {
        toast.error("Failed to save data");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  // RESET
  const resetForm = () => {
    setFormData({
      id: undefined,
      book_title: "",
      type: "",
      published_date: null,
      isbn: "",
      book_no: "",
      copyright_date: null,
      no_of_chapters: "",
      author: "",
      co_authors: "",
      languages: "",
      published_in: "",
      publisher: "",
      about_book: "",
    });

    setErrors({});
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteBook(deleteId);

      toast.success("Deleted successfully");

      fetchBookData();

      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    }
  };

  // UPLOAD MODAL
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);

  const manualUserId = 1;
  const loadUploadedFiles = async (bookId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/book-published/upload-list/book_published/${bookId}`,
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

  // SAVE FILE DETAILS
  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        const formData = new FormData();

        formData.append("description", file.description || "");

        formData.append("actual_date", file.actual_date || "");

        await fetch(
          `http://localhost:8000/book-published/upload/update/${file.id}`,
          {
            method: "PUT",
            body: formData,
          },
        );
      }

      toast.success("Updated successfully");

      if (selectedBookId) {
        await loadUploadedFiles(selectedBookId);
      }
    } catch (error) {
      console.error(error);

      toast.error("Failed to update files");
    }
  };

  // DELETE FILE
  const confirmUploadDelete = async () => {
    if (!uploadDeleteId) return;

    try {
      const response = await fetch(
        `http://localhost:8000/book-published/upload/${uploadDeleteId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.status) {
        toast.success("Deleted Successfully");

        setShowUploadDeleteModal(false);

        if (selectedBookId) {
          await loadUploadedFiles(selectedBookId);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);

      toast.error("Delete failed");
    }
  };

  const getBookTypeName = (id: number | string) => {
    const match = bookTypes.find((t) => String(t.id) === String(id));
    return match ? match.name : "--";
  };

  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {};

    paginatedData.forEach((item) => {
      const key = getBookTypeName(item.book_type) || "--";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  }, [paginatedData]);
  const handleEdit = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/book-published/${id}`);
      const data = await res.json();

      setFormData({
        id: data.text_ref_id,
        book_title: data.book_title || "",
        type: data.book_type || "",
        published_date: data.year_of_publication
          ? new Date(data.year_of_publication)
          : null,
        isbn: data.isbn_no || "",
        book_no: data.book_no || "",
        copyright_date: data.copright_year
          ? new Date(data.copright_year)
          : null,
        no_of_chapters: data.no_of_chapters || "",
        author: data.author_id || "",
        co_authors: data.co_author || "",
        languages: data.book_in_the_language || "",
        published_in: data.printed_at || "",
        publisher: data.published_by || "",
        about_book: data.about_book || "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load book details");
    }
  };

  return (
    <div className="bg-[#f2f2f2] min-h-screen p-4">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 rounded-t mb-6">
        <h2 className="text-lg font-semibold">Book Published</h2>
      </div>

      {/* COLLAPSE HEADER */}
      <div
        className="bg-white border border-t-0 px-4 py-3 flex items-center gap-2 cursor-pointer font-semibold text-[#4f7f82]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "▼" : "▶"}

        <span>Book Published</span>
      </div>

      {/* BODY */}
      {isOpen && (
        <div className="bg-white border border-t-0 p-4">
          {/* TOP FILTER */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Show</span>

              <select
                value={entries}
                onChange={(e) => setEntries(Number(e.target.value))}
                className="border px-2 py-1 rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <span className="text-sm">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Search:</span>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#f3f3f3]">
                <tr>
                  {(
                    [
                      { key: "book_title", label: "Book Title" },
                      { key: "author", label: "Author" },
                      { key: "co_authors", label: "Co-author(s)" },
                      { key: "isbn", label: "ISBN" },
                      { key: "languages", label: "Language(s)" },
                      { key: "publisher", label: "Publisher" },
                      { key: "published_year", label: "Published Year" },
                    ] as { key: ColumnKey; label: string }[]
                  ).map((col) => (
                    <th key={col.key} className="border p-2 text-left relative">
                      <div className="flex items-center justify-between">
                        <span>{col.label}</span>

                        <Filter
                          size={14}
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

                  <th className="border p-2 text-center">Upload</th>
                  <th className="border p-2 text-center">Edit</th>
                  <th className="border p-2 text-center">Delete</th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(groupedData).length > 0 ? (
                  Object.entries(groupedData).map(([type, items]) => (
                    <React.Fragment key={type}>
                      {/* 🔥 INSERTED TYPE ROW */}
                      <tr className="bg-gray-200">
                        <td
                          colSpan={10}
                          className="font-bold px-3 py-2 text-gray-800"
                        >
                          {type}
                        </td>
                      </tr>

                      {/* DATA ROWS */}
                      {items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="border p-2">{item.book_title}</td>
                          <td className="border p-2">{item.author}</td>
                          <td className="border p-2">{item.co_authors}</td>
                          <td className="border p-2">{item.isbn}</td>
                          <td className="border p-2">{item.languages}</td>
                          <td className="border p-2">{item.publisher}</td>
                          <td className="border p-2">
                            {item.published_year
                              ? `${new Date(item.published_year).getFullYear()}-${String(
                                  new Date(item.published_year).getMonth() + 1,
                                ).padStart(2, "0")}`
                              : ""}
                          </td>

                          <td
                            className="border p-2 text-center text-[#4f7f82] cursor-pointer"
                            onClick={() => {
                              setSelectedBookId(item.text_ref_id);
                              setShowUploadModal(true);
                              loadUploadedFiles(item.text_ref_id);
                            }}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Upload size={18} />
                              <span>Upload</span>
                            </div>
                          </td>

                          <td className="border p-2 text-center">
                            <Pencil
                              size={18}
                              className="cursor-pointer text-yellow-600 mx-auto"
                              onClick={() => {
                                handleEdit(item.text_ref_id);
                                formRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                });
                              }}
                            />
                          </td>

                          <td className="border p-2 text-center">
                            <Trash2
                              size={18}
                              className="cursor-pointer text-red-600 mx-auto"
                              onClick={() => {
                                setDeleteId(item.text_ref_id);
                                setShowDeleteModal(true);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center p-4">
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
              Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + entries, filteredData.length)} of{" "}
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
          <div ref={formRef} className="border mt-6 p-5">
            <h2 className="text-lg font-semibold text-[#4f7f82] mb-5">
              Add / Edit Book Published
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT SIDE */}
              <div className="space-y-4">
                {/* BOOK TITLE */}
                <div>
                  <label className="block text-sm mb-1">
                    Book Title:
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="book_title"
                    value={formData.book_title}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />

                  {errors.book_title && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.book_title}
                    </p>
                  )}
                </div>

                {/* PUBLISHED DATE */}
                <div>
                  <label className="block text-sm mb-1">
                    Published Date:
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <DatePicker
                      selected={formData.published_date}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          published_date: date,
                        }))
                      }
                      showMonthYearPicker
                      dateFormat="yyyy-MM"
                      placeholderText="Select Month & Year"
                      className="w-full border rounded px-3 py-2"
                    />

                    <Calendar
                      size={18}
                      className="absolute right-3 top-3 text-gray-500 pointer-events-none"
                    />
                  </div>

                  {errors.published_date && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.published_date}
                    </p>
                  )}
                </div>

                {/* BOOK NUMBER */}
                <div>
                  <label className="block text-sm mb-1">Book No:</label>

                  <input
                    type="text"
                    name="book_no"
                    value={formData.book_no}
                    onChange={handleChange}
                    placeholder="Enter Book No"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {/* COPYRIGHT DATE */}
                <div>
                  <label className="block text-sm mb-1">
                    Copyright Date:
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <DatePicker
                      selected={formData.copyright_date}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          copyright_date: date,
                        }))
                      }
                      dateFormat="yyyy-MM-dd"
                      customInput={
                        <input
                          className="w-full border rounded px-3 py-2 bg-[#f5f5f5] cursor-pointer"
                          disabled
                        />
                      }
                    />

                    <Calendar
                      size={18}
                      className="absolute right-3 top-3 text-gray-500 pointer-events-none"
                    />
                  </div>

                  {errors.copyright_date && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.copyright_date}
                    </p>
                  )}
                </div>

                {/* NO OF CHAPTERS */}
                <div>
                  <label className="block text-sm mb-1">No. of Chapters:</label>

                  <input
                    type="text"
                    name="no_of_chapters"
                    value={formData.no_of_chapters}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (/^\d*$/.test(value)) {
                        setFormData((prev) => ({
                          ...prev,
                          no_of_chapters: value === "" ? "" : Number(value),
                        }));

                        setErrors((prev: any) => ({
                          ...prev,
                          no_of_chapters: "",
                        }));
                      } else {
                        setErrors((prev: any) => ({
                          ...prev,
                          no_of_chapters: "Only numbers are allowed",
                        }));
                      }
                    }}
                    className={`w-full border rounded px-3 py-2 ${
                      errors.no_of_chapters ? "border-red-500" : ""
                    }`}
                  />

                  {errors.no_of_chapters && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.no_of_chapters}
                    </p>
                  )}
                </div>

                {/* AUTHOR */}
                <div>
                  <label className="block text-sm mb-1">
                    Author:
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Author</option>

                    {authors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.name}
                      </option>
                    ))}
                  </select>

                  {errors.author && (
                    <p className="text-red-500 text-xs mt-1">{errors.author}</p>
                  )}
                </div>

                {/* CO AUTHORS */}
                <div>
                  <label className="block text-sm mb-1">Co-author(s):</label>

                  <textarea
                    rows={2}
                    name="co_authors"
                    value={formData.co_authors}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              {/* CENTER */}
              <div className="space-y-4">
                {/* TYPE */}
                <div>
                  <label className="block text-sm mb-1">
                    Type:
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Type</option>

                    {bookTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>

                  {errors.type && (
                    <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                  )}
                </div>

                {/* ISBN */}
                <div>
                  <label className="block text-sm mb-1">
                    ISBN:
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />

                  {errors.isbn && (
                    <p className="text-red-500 text-xs mt-1">{errors.isbn}</p>
                  )}
                </div>

                {/* LANGUAGES */}
                <div>
                  <label className="block text-sm mb-1">Language(s):</label>

                  <textarea
                    rows={2}
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {/* PUBLISHED IN */}
                <div>
                  <label className="block text-sm mb-1">Published in:</label>

                  <textarea
                    rows={2}
                    name="published_in"
                    value={formData.published_in}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {/* PUBLISHER */}
                <div>
                  <label className="block text-sm mb-1">
                    Publisher:
                    <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    rows={2}
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />

                  {errors.publisher && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.publisher}
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div>
                <label className="block text-sm mb-1">About the book:</label>

                <Editor
                  apiKey="no-api-key"
                  tinymceScriptSrc="/tinymce/tinymce.min.js"
                  value={formData.about_book}
                  onEditorChange={(content: string) => {
                    setFormData((prev) => ({
                      ...prev,
                      about_book: content,
                    }));

                    setErrors((prev: any) => ({
                      ...prev,
                      about_book: "",
                    }));
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

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleSave}
                className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded"
              >
                Save
              </button>

              <button
                onClick={resetForm}
                className="bg-amber-600 hover:bg-amber-600 text-white px-5 py-2 rounded"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[400px] p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Delete
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this record?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-[#4f7f82] text-white rounded hover:bg-[#4f7f82]"
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

            {/* BODY */}
            <div className="p-5 overflow-y-auto flex-1">
              <h3 className="font-semibold text-[18px] mb-4">Book Published</h3>

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

                    if (!file || !selectedBookId) {
                      return;
                    }

                    const formData = new FormData();

                    const currentDate = new Date().toISOString().split("T")[0];

                    formData.append("file", file);

                    formData.append("user_id", String(manualUserId));

                    formData.append("table_ref_id", String(selectedBookId));

                    formData.append("tab_ref_id", "book_published");

                    formData.append(
                      "table_name",
                      "cudos_user_text_reference_book",
                    );

                    formData.append("actual_date", currentDate);

                    const response = await fetch(
                      "http://localhost:8000/book-published/upload",
                      {
                        method: "POST",
                        body: formData,
                      },
                    );

                    const data = await response.json();

                    if (data.status) {
                      toast.success("Uploaded Successfully");

                      await loadUploadedFiles(selectedBookId);
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
                className="bg-red-600 hover:bg-red-600 text-white px-5 py-2 rounded font-medium"
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
    </div>
  );
};

export default BookPublishedPage;
