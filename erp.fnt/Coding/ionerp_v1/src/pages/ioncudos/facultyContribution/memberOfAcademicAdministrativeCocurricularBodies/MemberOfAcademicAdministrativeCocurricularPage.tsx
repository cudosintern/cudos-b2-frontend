import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getBoardMembers,
  createBoardMember,
  updateBoardMember,
  deleteBoardMember,
} from "./memberOfAcademicAdminstrativeCocurricularApi";
// ================= TYPES =================

interface JournalItem {
  acd_member_id: number;
  academy: string;
  institute_name: string;
}

// ================= DUMMY API FUNCTIONS =================

const getDropdowns = async () => {
  return {
    positions: [
      { label: "Academic", value: "Academic" },
      { label: "Administrative", value: "Administrative" },
      { label: "Cocurricular", value: "Cocurricular" },
    ],
  };
};

// ================= COMPONENT =================

const MemberOfAcademicAdministrativeCocurricularPage: React.FC = () => {
  const [showFilter, setShowFilter] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    academy: "",
    institute_name: "",
  });
  // ================= STATES =================

  const [tableData, setTableData] = useState<JournalItem[]>([]);

  const [positionOptions, setPositionOptions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    position: "",
    journal_name: "",
  });

  const [errors, setErrors] = useState<any>({});

  const [search, setSearch] = useState("");

  const [entriesPerPage, setEntriesPerPage] = useState(20);

  const [currentPage, setCurrentPage] = useState(1);

  const [editId, setEditId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [isOpen, setIsOpen] = useState(true);

  const formRef = useRef<HTMLDivElement>(null);

  // ================= LOAD DATA =================

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

  // ================= VALIDATION =================

  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.position) {
      newErrors.position = "Member Of is required";
    }

    if (!formData.journal_name.trim()) {
      newErrors.journal_name = "Institution is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ================= SAVE =================

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        academy: formData.position,
        institute_name: formData.journal_name,
      };

      if (editId) {
        await updateBoardMember(editId, payload);

        toast.success("Updated successfully");
      } else {
        await createBoardMember(payload);

        toast.success("Saved successfully");
      }

      await loadBoardMembers();

      resetForm();
    } catch (error) {
      console.error("Save Error:", error);

      toast.error("Something went wrong");
    }
  };

  // ================= EDIT =================

  const handleEdit = (item: JournalItem) => {
    setEditId(item.acd_member_id);

    setFormData({
      position: item.academy,
      journal_name: item.institute_name,
    });

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // ================= DELETE =================

  const handleDelete = async (id: number) => {
    try {
      await deleteBoardMember(id);

      toast.success("Deleted successfully");

      await loadBoardMembers();
    } catch (error) {
      console.error("Delete Error:", error);

      toast.error("Delete failed");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    await handleDelete(deleteId);

    setShowDeleteModal(false);

    setDeleteId(null);
  };

  // ================= RESET =================

  const resetForm = () => {
    setEditId(null);

    setFormData({
      position: "",
      journal_name: "",
    });

    setErrors({});
  };

  // ================= SEARCH =================

  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const globalSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const academyMatch =
        !filters.academy ||
        item.academy?.toLowerCase().includes(filters.academy.toLowerCase());

      const instituteMatch =
        !filters.institute_name ||
        item.institute_name
          ?.toLowerCase()
          .includes(filters.institute_name.toLowerCase());

      return globalSearch && academyMatch && instituteMatch;
    });
  }, [tableData, search, filters]);

  // ================= PAGINATION =================

  const indexOfLast = currentPage * entriesPerPage;

  const indexOfFirst = indexOfLast - entriesPerPage;

  const currentData = filteredData.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // ================= UI =================

  return (
    <div className="bg-[#f4f4f4] min-h-screen p-4">
      {/* PAGE TITLE */}
      <div className="text-[#4f7f82] px-4 py-2 mb-4">
        <h2 className="text-lg font-semibold">
          Member of academic / administrative/cocurricular bodies
        </h2>
      </div>

      {/* COLLAPSE HEADER */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border px-4 py-3 flex items-center gap-2 cursor-pointer font-semibold text-[#4f7f82]"
      >
        {isOpen ? "▼" : "▶"}

        <span>Member of academic / administrative/cocurricular bodies</span>
      </div>

      {/* CONTENT */}
      {isOpen && (
        <div className="bg-white border border-gray-300 p-6">
          {/* TOP BAR */}
          <div className="flex justify-between items-center mb-4">
            {/* LEFT */}
            <div className="flex items-center gap-2 text-sm">
              <span>Show</span>

              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 w-[90px]"
              >
                <option value={10}>10</option>

                <option value={20}>20</option>

                <option value={50}>50</option>
              </select>

              <span>entries</span>
            </div>

            {/* SEARCH */}
            <div className="flex items-center gap-2 text-sm">
              <span>Search:</span>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 w-[260px]"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="border border-gray-300 overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#f3f3f3]">
                <tr className="">
                  <th className="border border-gray-300 px-3 py-3 text-left w-[70px]">
                    Sl No.
                  </th>

                  {/* MEMBER OF */}
                  <th className="border border-gray-300 px-3 py-3 text-left relative">
                    <div className="flex items-center justify-between">
                      <span>Member of</span>

                      <Filter
                        size={16}
                        className="cursor-pointer text-gray-600"
                        onClick={() =>
                          setShowFilter(
                            showFilter === "academy" ? null : "academy",
                          )
                        }
                      />
                    </div>

                    {showFilter === "academy" && (
                      <div className="absolute bg-white border shadow-md p-2 mt-2 z-10 w-[220px]">
                        <input
                          type="text"
                          placeholder="Filter Member Of"
                          value={filters.academy}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              academy: e.target.value,
                            })
                          }
                          className="border px-2 py-1 w-full rounded"
                        />
                      </div>
                    )}
                  </th>

                  {/* INSTITUTION */}
                  <th className="border border-gray-300 px-3 py-3 text-left relative">
                    <div className="flex items-center justify-between">
                      <span>Institution</span>

                      <Filter
                        size={16}
                        className="cursor-pointer text-gray-600"
                        onClick={() =>
                          setShowFilter(
                            showFilter === "institute_name"
                              ? null
                              : "institute_name",
                          )
                        }
                      />
                    </div>

                    {showFilter === "institute_name" && (
                      <div className="absolute bg-white border shadow-md p-2 mt-2 z-10 w-[220px]">
                        <input
                          type="text"
                          placeholder="Filter Institution"
                          value={filters.institute_name}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              institute_name: e.target.value,
                            })
                          }
                          className="border px-2 py-1 w-full rounded"
                        />
                      </div>
                    )}
                  </th>

                  <th className="border border-gray-300 px-3 py-3 text-left w-[100px]">
                    Edit
                  </th>

                  <th className="border border-gray-300 px-3 py-3 text-left w-[100px]">
                    Delete
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((item, index) => (
                    <tr key={item.acd_member_id}>
                      <td className="border border-gray-300 px-3 py-3">
                        {indexOfFirst + index + 1}
                      </td>

                      <td className="border border-gray-300 px-3 py-3">
                        {item.academy}
                      </td>

                      <td className="border border-gray-300 px-3 py-3">
                        {item.institute_name}
                      </td>

                      {/* EDIT */}
                      <td className="border border-gray-300 px-3 py-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-yellow-600"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>

                      {/* DELETE */}
                      <td className="border border-gray-300 px-3 py-3">
                        <button
                          onClick={() => {
                            setDeleteId(item.acd_member_id);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 size={16} />
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
          <div
            ref={formRef}
            className="border-t border-gray-300 px-6 py-6 bg-[#fafafa] mt-8"
          >
            <h3 className="text-[#4f7f82] font-semibold text-lg mb-4">
              Add / Edit Member of academic / administrative / cocurricular
              bodies
            </h3>
            {/* MEMBER OF */}
            <div className="grid grid-cols-[100px_280px] items-center mb-8">
              <label className="text-[16px]">
                Member Of :<span className="text-red-500">*</span>
              </label>

              <div>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      position: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />

                {errors.position && (
                  <p className="text-red-500 text-sm mt-1">{errors.position}</p>
                )}
              </div>
            </div>

            {/* INSTITUTION */}
            <div className="grid grid-cols-[100px_280px] items-center mb-8">
              <label className="text-[16px]">
                Institution :<span className="text-red-500">*</span>
              </label>

              <div>
                <input
                  type="text"
                  value={formData.journal_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      journal_name: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />

                {errors.journal_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.journal_name}
                  </p>
                )}
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-2 mt-10">
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

          {/* DELETE MODAL */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded w-[400px] shadow-lg">
                <h2 className="text-lg font-semibold mb-4">
                  Delete Confirmation
                </h2>

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
      )}
    </div>
  );
};

export default MemberOfAcademicAdministrativeCocurricularPage;
