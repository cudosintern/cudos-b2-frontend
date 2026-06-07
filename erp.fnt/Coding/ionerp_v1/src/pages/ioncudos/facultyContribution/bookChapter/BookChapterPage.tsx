import React, { useMemo, useState, useEffect, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Upload,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getBookChapters,
  saveBookChapter,
  updateBookChapter,
  deleteBookChapter,
  uploadBookChapterFile,
  getBookChapterFiles,
  updateBookChapterFile,
  deleteBookChapterFile,
} from "./bookChapterApi";

interface BookChapter {
  bc_id?: number;

  // API fields
  book_title?: string;
  chapter_title?: string;
  isbn_no?: string;
  publisher_details?: string;
  year?: string;

  // Form fields
  bookTitle: string;
  chapterTitle: string;
  authors: string;
  editor: string;
  isbn: string;
  monthYear: Date | null | string;
  publisher: string;
  description: string;
}

interface FormErrors {
  bookTitle?: string;
  chapterTitle?: string;
}

type ColumnKey =
  | "book_title"
  | "chapter_title"
  | "authors"
  | "editor"
  | "isbn_no"
  | "year"
  | "publisher_details";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

const BookChapterPage: React.FC = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedBookChapterId, setSelectedBookChapterId] = useState<
    number | null
  >(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);

  // ================= LOAD UPLOADED FILES =================
  const loadUploadedFiles = async (bookChapterId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/book-chapter/upload-list/book_chapter/${bookChapterId}`,
      );

      const data = await response.json();

      if (data.status) {
        setUploadedFiles(data.data);

        setEditableFiles(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ================= SAVE FILE DETAILS =================
  const handleSaveUploadedFiles = async () => {
    try {
      for (const file of editableFiles) {
        const formData = new FormData();

        formData.append("description", file.description || "");

        formData.append("actual_date", file.actual_date || "");

        await fetch(
          `http://localhost:8000/book-chapter/upload/update/${file.id}`,
          {
            method: "PUT",
            body: formData,
          },
        );
      }

      toast.success("Updated Successfully");

      if (selectedBookChapterId) {
        loadUploadedFiles(selectedBookChapterId);
      }
    } catch (error) {
      console.error(error);

      toast.error("Something went wrong");
    }
  };

  // ================= DELETE FILE =================
  const confirmUploadDelete = async () => {
    try {
      if (!uploadDeleteId) return;

      const response = await fetch(
        `http://localhost:8000/book-chapter/upload/${uploadDeleteId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.status) {
        toast.success("Deleted Successfully");

        setShowUploadDeleteModal(false);

        if (selectedBookChapterId) {
          loadUploadedFiles(selectedBookChapterId);
        }
      }
    } catch (error) {
      console.error(error);

      toast.error("Delete failed");
    }
  };

  const formRef = useRef<HTMLDivElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      book_title: "",
      chapter_title: "",
      authors: "",
      editor: "",
      isbn_no: "",
      year: "",
      publisher_details: "",
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
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [bookChapters, setBookChapters] = useState<BookChapter[]>([]);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getBookChapters(1);
    setBookChapters(res);
  };
  const [formData, setFormData] = useState<BookChapter>({
    bookTitle: "",
    chapterTitle: "",
    authors: "",
    editor: "",
    isbn: "",
    monthYear: null,
    publisher: "",
    description: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // INPUT CHANGE
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // VALIDATION (ONLY 2 FIELDS REQUIRED)
  const validateForm = (): boolean => {
    let newErrors: FormErrors = {};

    if (!formData.bookTitle.trim()) {
      newErrors.bookTitle = "Book Title is required";
    }

    if (!formData.chapterTitle.trim()) {
      newErrors.chapterTitle = "Chapter Title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SUBMIT
  const handleSubmit = async () => {
    try {
      if (!validateForm()) return;

      const payload = {
        user_id: 1,
        book_title: formData.bookTitle,
        chapter_title: formData.chapterTitle,
        authors: formData.authors,
        editor: formData.editor,
        isbn_no: formData.isbn,
        description: formData.description,
        publisher_details: formData.publisher,
        year:
          formData.monthYear instanceof Date
            ? `${formData.monthYear.getFullYear()}-${String(
                formData.monthYear.getMonth() + 1,
              ).padStart(2, "0")}-01`
            : null,
      };

      if (editId !== null) {
        await updateBookChapter(editId, payload);
        toast.success("Updated Successfully");
      } else {
        await saveBookChapter(payload);
        toast.success("Saved Successfully");
      }

      resetForm();
      setEditId(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  // RESET
  const resetForm = () => {
    setFormData({
      bookTitle: "",
      chapterTitle: "",
      authors: "",
      editor: "",
      isbn: "",
      monthYear: null,
      publisher: "",
      description: "",
    });

    setErrors({});
  };

  // EDIT
  const handleEdit = (item: any) => {
    setFormData({
      bookTitle: item.book_title || item.bookTitle,
      chapterTitle: item.chapter_title || item.chapterTitle,
      authors: item.authors || "",
      editor: item.editor || "",
      isbn: item.isbn_no || item.isbn,
      monthYear: item.year ? new Date(item.year) : null,
      publisher: item.publisher_details || item.publisher,
      description: item.description || "",
    });

    setEditId(item.bc_id);

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // DELETE
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    await deleteBookChapter(deleteId);
    toast.success("Deleted Successfully");

    setShowDeleteModal(false);
    setDeleteId(null);
    loadData();
  };

  // SEARCH
  const filteredData = useMemo(() => {
    return bookChapters.filter((item: any) => {
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

        if (key === "year") {
          cellValue = item.year
            ? `${String(new Date(item.year).getMonth() + 1).padStart(
                2,
                "0",
              )}-${new Date(item.year).getFullYear()}`
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
  }, [bookChapters, searchTerm, columnFilters, filterType]);

  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentData = filteredData.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  const startIndex = (currentPage - 1) * entriesPerPage;

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
    <div className="bg-[#f2f2f2] min-h-screen p-4">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 mb-4">
        <h2 className="text-lg font-semibold">Book Chapter</h2>
      </div>

      {/* COLLAPSE */}
      <div
        className="bg-white border px-4 py-3 flex items-center gap-2 cursor-pointer font-semibold text-[#4f7f82]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "▼" : "▶"} <span>Book Chapter</span>
      </div>

      {isOpen && (
        <div className="bg-white border p-4">
          {/* TOP FILTER */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Show</span>

              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
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
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded px-3 py-1 text-sm"
              />
            </div>
          </div>
          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border text-sm mt-3 min-w-max">
              <thead className="bg-[#f3f3f3]">
                <tr>
                  <th className="border px-3 py-2">Sl No.</th>

                  {(
                    [
                      { key: "book_title", label: "Book Title" },
                      { key: "chapter_title", label: "Chapter Title" },
                      { key: "authors", label: "Author(s)" },
                      { key: "editor", label: "Editor" },
                      { key: "isbn_no", label: "ISBN" },
                      { key: "year", label: "Year" },
                      { key: "publisher_details", label: "Publisher Details" },
                    ] as { key: ColumnKey; label: string }[]
                  ).map((col) => (
                    <th key={col.key} className="border px-3 py-2 relative">
                      <div className="flex items-center justify-between gap-1 min-h-[40px]">
                        <span className="leading-5">{col.label}</span>

                        <Filter
                          size={16}
                          strokeWidth={2}
                          className="min-w-[16px] min-h-[16px] cursor-pointer text-black hover:text-blue-600 flex-shrink-0"
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

                  <th className="border px-3 py-2">Upload</th>
                  <th className="border px-3 py-2">Edit</th>
                  <th className="border px-3 py-2">Delete</th>
                </tr>
              </thead>

              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((item: any, index) => (
                    <tr key={index}>
                      <td className="border px-3 py-2">
                        {indexOfFirst + index + 1}
                      </td>

                      <td className="border px-3 py-2">{item.book_title}</td>

                      <td className="border px-3 py-2">{item.chapter_title}</td>

                      <td className="border px-3 py-2">{item.authors}</td>

                      <td className="border px-3 py-2">{item.editor}</td>

                      <td className="border px-3 py-2">{item.isbn_no}</td>

                      <td className="border px-3 py-2">
                        {item.year
                          ? `${String(
                              new Date(item.year).getMonth() + 1,
                            ).padStart(2, "0")}-${new Date(
                              item.year,
                            ).getFullYear()}`
                          : ""}
                      </td>

                      <td className="border px-3 py-2">
                        {item.publisher_details}
                      </td>

                      {/* UPLOAD */}
                      <td className="border px-3 py-2 text-center">
                        <button
                          className="text-[#4f7f82] flex"
                          onClick={async () => {
                            setSelectedBookChapterId(item.bc_id);

                            setShowUploadModal(true);

                            await loadUploadedFiles(item.bc_id);
                          }}
                        >
                          <Upload className="w-4 h-4" />
                          Upload
                        </button>
                      </td>

                      {/* EDIT */}
                      <td className="border px-3 py-2 text-center">
                        <button onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4 text-yellow-600" />
                        </button>
                      </td>

                      {/* DELETE */}
                      <td className="border px-3 py-2 text-center">
                        <button
                          onClick={() => {
                            setDeleteId(item.bc_id);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-gray-500">
                      No Data Found
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
              {Math.min(startIndex + entriesPerPage, filteredData.length)} of{" "}
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
          <div ref={formRef} className="mt-8 border-t pt-8">
            <h2 className="text-lg font-semibold text-[#4f7f82] mb-5">
              Add / Edit Book Chapter
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT */}
              <div className="space-y-5">
                {/* BOOK TITLE */}
                <div>
                  <label>
                    Book Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="bookTitle"
                    value={formData.bookTitle}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                  {errors.bookTitle && (
                    <p className="text-red-500 text-sm">{errors.bookTitle}</p>
                  )}
                </div>

                {/* CHAPTER TITLE */}
                <div>
                  <label>
                    Chapter Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="chapterTitle"
                    value={formData.chapterTitle}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                  {errors.chapterTitle && (
                    <p className="text-red-500 text-sm">
                      {errors.chapterTitle}
                    </p>
                  )}
                </div>

                {/* OPTIONAL FIELDS */}
                <div>
                  <label>Author(s)</label>
                  <input
                    name="authors"
                    value={formData.authors}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label>Editor</label>
                  <input
                    name="editor"
                    value={formData.editor}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label>ISBN</label>
                  <input
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label>Month & Year</label>

                  <div className="relative">
                    <DatePicker
                      selected={
                        formData.monthYear instanceof Date
                          ? formData.monthYear
                          : null
                      }
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          monthYear: date,
                        }))
                      }
                      showMonthYearPicker
                      dateFormat="yyyy-MM"
                      className="w-full border rounded px-3 py-2 pr-10"
                    />

                    <Calendar className="absolute right-3 top-2.5 text-gray-500 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label>Publisher</label>
                  <textarea
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              {/* RIGHT */}
              <div className="mt-6">
                <label className="text-sm">Description:</label>

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
          </div>
          {/* BUTTONS */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleSubmit}
              className="bg-[#4f7f82] text-white px-4 py-2 rounded"
            >
              {editId !== null ? "Update" : "Save"}
            </button>

            <button
              onClick={resetForm}
              className="bg-amber-600 text-white px-4 py-2 rounded"
            >
              Reset
            </button>
          </div>
        </div>
      )}
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
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-[#4f7f82] text-white rounded hover:bg-[#4f7f82]"
              >
                Ok
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
              <h3 className="font-semibold text-[18px] mb-4">Book Chapter</h3>

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

                    if (!file || !selectedBookChapterId) {
                      return;
                    }

                    const formData = new FormData();

                    const currentDate = new Date().toISOString().split("T")[0];

                    formData.append("file", file);

                    formData.append("user_id", "1");

                    formData.append(
                      "table_ref_id",
                      String(selectedBookChapterId),
                    );

                    formData.append("tab_ref_id", "book_chapter");

                    formData.append("table_name", "cudos_book_chapter");

                    formData.append("actual_date", currentDate);

                    const response = await fetch(
                      "http://localhost:8000/book-chapter/upload",
                      {
                        method: "POST",
                        body: formData,
                      },
                    );

                    const data = await response.json();

                    if (data.status) {
                      toast.success("Uploaded Successfully");

                      await loadUploadedFiles(selectedBookChapterId);
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
    </div>
  );
};

export default BookChapterPage;
