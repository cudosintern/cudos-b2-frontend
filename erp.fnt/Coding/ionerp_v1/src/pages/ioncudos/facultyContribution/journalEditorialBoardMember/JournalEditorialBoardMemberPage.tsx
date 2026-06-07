import React, { useMemo, useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getDropdowns,
  getBoardMembers,
  createBoardMember,
  updateBoardMember,
  deleteBoardMember,
} from "./journalEditorialBoardMemberApi";
type ColumnKey = "member_position" | "journal_name";

type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

interface JournalItem {
  members_id: number;
  member_position: string;
  journal_name: string;
}

const JournalEditorialBoardMemberPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );

  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      member_position: "",
      journal_name: "",
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
  // =========================
  // STATES
  // =========================
  const [tableData, setTableData] = useState<JournalItem[]>([]);
  const [positionOptions, setPositionOptions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    position: "",
    journal_name: "",
  });
  useEffect(() => {
    loadDropdowns();
    loadBoardMembers();
  }, []);
  const loadDropdowns = async () => {
    try {
      const response = await getDropdowns();

      setPositionOptions(response.positions || []);
    } catch (error) {
      console.error("Dropdown Error:", error);
    }
  };
  const loadBoardMembers = async () => {
    try {
      const response = await getBoardMembers();

      setTableData(response.data || []);
    } catch (error) {
      console.error("List Error:", error);
    }
  };
  const [errors, setErrors] = useState<any>({});

  const [search, setSearch] = useState("");

  const [entriesPerPage, setEntriesPerPage] = useState(20);

  const [currentPage, setCurrentPage] = useState(1);

  const [editId, setEditId] = useState<number | null>(null);

  // =========================
  // VALIDATION
  // =========================
  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.position) {
      newErrors.position = "Position is required";
    }

    if (!formData.journal_name.trim()) {
      newErrors.journal_name = "Journal Name is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================
  // SAVE
  // =========================
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        member_position: formData.position,
        journal_name: formData.journal_name,
      };

      if (editId) {
        await updateBoardMember(editId, payload);

        toast.success("Board Member updated successfully");
      } else {
        await createBoardMember(payload);

        toast.success("Board Member saved successfully");
      }

      await loadBoardMembers();

      resetForm();
    } catch (error) {
      console.error("Save Error:", error);

      toast.error("Something went wrong");
    }
  };

  // =========================
  // EDIT
  // =========================
  const handleEdit = (item: JournalItem) => {
    setEditId(item.members_id);

    setFormData({
      position: item.member_position,
      journal_name: item.journal_name,
    });

    // 👇 scroll to form after data loads
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id: number) => {
    try {
      await deleteBoardMember(id);

      toast.success("Board Member deleted successfully");

      await loadBoardMembers();
    } catch (error) {
      console.error("Delete Error:", error);

      toast.error("Delete failed");
    }
  };
  // =========================
  // RESET
  // =========================
  const resetForm = () => {
    setEditId(null);

    setFormData({
      position: "",
      journal_name: "",
    });

    setErrors({});
  };

  // =========================
  // SEARCH FILTER
  // =========================
  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

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
  }, [tableData, search, columnFilters, filterType]);

  // =========================
  // PAGINATION
  // =========================
  const indexOfLast = currentPage * entriesPerPage;

  const indexOfFirst = indexOfLast - entriesPerPage;

  const currentData = filteredData.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  // =========================
  // PREVIOUS PAGE
  // =========================
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // =========================
  // NEXT PAGE
  // =========================
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  const formRef = React.useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const confirmDelete = async () => {
    if (!deleteId) return;

    await handleDelete(deleteId);

    setShowDeleteModal(false);

    setDeleteId(null);
  };
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="bg-[#f5f5f5] min-h-screen p-6">
      <div className="text-[#4f7f82] px-4 py-2 mb-4">
        <h2 className="text-lg font-semibold">
          Journal Editorial Board Member
        </h2>
      </div>

      {/* COLLAPSE HEADER */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border px-4 py-3 flex items-center gap-2 cursor-pointer font-semibold text-[#4f7f82]"
      >
        {isOpen ? "▼" : "▶"}

        <span>Journal Editorial Board Member</span>
      </div>

      {/* CONTENT */}
      {isOpen && (
        <div className="bg-white border border-gray-300">
          {/* =========================
            TABLE SECTION
        ========================= */}
          <div className="p-6">
            {/* TOP BAR */}
            <div className="flex justify-between items-center mb-5">
              {/* ENTRIES */}
              <div className="flex items-center gap-2 text-[15px]">
                <span>Show</span>

                <select
                  className="border border-gray-300 rounded px-2 py-1 w-[80px]"
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>

                  <option value={20}>20</option>

                  <option value={50}>50</option>
                </select>

                <span>entries</span>
              </div>

              {/* SEARCH */}
              <div className="flex items-center gap-2 text-[15px]">
                <span>Search:</span>

                <input
                  type="text"
                  className="border border-gray-300 rounded px-3 py-1 w-[250px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse">
                {/* TABLE HEADER */}
                <thead className="bg-[#f3f3f3]">
                  <tr className="">
                    <th className="border border-gray-300 px-3 py-3 text-left w-[70px]">
                      Sl No.
                    </th>

                    {(
                      [
                        {
                          key: "member_position",
                          label: "Position (Editor/Member)",
                        },
                        {
                          key: "journal_name",
                          label: "Journal Name",
                        },
                      ] as {
                        key: ColumnKey;
                        label: string;
                      }[]
                    ).map((col) => (
                      <th
                        key={col.key}
                        className="border border-gray-300 px-3 py-3 text-left relative"
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

                    <th className="border border-gray-300 px-3 py-3 text-left w-[120px]">
                      Edit
                    </th>

                    <th className="border border-gray-300 px-3 py-3 text-left w-[120px]">
                      Delete
                    </th>
                  </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <tr key={item.members_id}>
                        <td className="border border-gray-300 px-3 py-3">
                          {indexOfFirst + index + 1}
                        </td>

                        <td className="border border-gray-300 px-3 py-3">
                          {item.member_position}
                        </td>

                        <td className="border border-gray-300 px-3 py-3">
                          {item.journal_name}
                        </td>

                        {/* EDIT */}
                        <td className="border border-gray-300 px-3 py-3">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-yellow-600"
                          >
                            <Pencil size={18} />
                          </button>
                        </td>

                        {/* DELETE */}
                        <td className="border border-gray-300 px-3 py-3">
                          <button
                            onClick={() => {
                              setDeleteId(item.members_id);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm">
                Showing {filteredData.length > 0 ? indexOfFirst + 1 : 0} to{" "}
                {Math.min(indexOfLast, filteredData.length)} of{" "}
                {filteredData.length} entries
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
          </div>

          {/* =========================
    FORM SECTION
========================= */}
          <div
            ref={formRef}
            className="border-t border-gray-300 bg-white px-10 py-6"
          >
            <h3 className="text-[#4f7f82] font-semibold text-lg mb-4">
              Add / Edit Journal Editorial Board Member
            </h3>
            <div className="w-full max-w-[900px]">
              {/* POSITION */}
              <div className="grid grid-cols-[100px_350px] items-start gap-x-4 mb-8">
                <label className="pt-2 text-[16px]">
                  Position:
                  <span className="text-red-500">*</span>
                </label>

                <div>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Position</option>

                    <option value="Editor">Editor</option>

                    <option value="Member">Member</option>
                  </select>

                  {errors.position && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.position}
                    </p>
                  )}
                </div>
              </div>

              {/* JOURNAL NAME */}
              <div className="grid grid-cols-[100px_350px] items-start gap-x-4 mb-8">
                <label className="pt-2 text-[16px]">
                  Journal Name:
                  <span className="text-red-500">*</span>
                </label>

                <div>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none"
                    value={formData.journal_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        journal_name: e.target.value,
                      })
                    }
                  />

                  {errors.journal_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.journal_name}
                    </p>
                  )}
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 mt-10 ml-auto">
                <button
                  onClick={handleSave}
                  className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-6 py-2 rounded"
                >
                  Save
                </button>

                <button
                  onClick={resetForm}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
          {/* DELETE MODAL */}
          {showDeleteModal && (
            <div
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
              onClick={() => setShowDeleteModal(false)} // click outside closes modal
            >
              <div
                className="bg-white rounded shadow-lg p-6 w-[400px]"
                onClick={(e) => e.stopPropagation()} // prevent close on inside click
              >
                <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>

                <p className="mb-6">
                  Are you sure you want to delete this record?
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="border bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmDelete}
                    className="bg-[#4f7f82] text-white px-4 py-2 rounded hover:opacity-90"
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

export default JournalEditorialBoardMemberPage;
