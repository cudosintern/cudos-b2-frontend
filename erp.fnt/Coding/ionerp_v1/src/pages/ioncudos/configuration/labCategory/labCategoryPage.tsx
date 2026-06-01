import React, { useEffect, useState, useMemo } from "react";
import {
  getLabCategories,
  createLabCategory,
  updateLabCategory,
  deleteLabCategory,
} from "./labCategorySchema";
import { FaSave, FaSync, FaTimes } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { LabCategory } from "./types";
import { toast } from "react-toastify";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../components/Table/DataTable";
import UIButton from "../../../../components/FormBuilder/fields/Button";

const emptyForm = {
  lab_cat_name: "",
  lab_cat_description: "",
};

const LabCategoryPage: React.FC = () => {
  const [list, setList] = useState<LabCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [showForm, setShowForm] = useState(false);

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      const res = await getLabCategories();
      if (res.status) {
        setList(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ================= HANDLERS ================= */
  const handleSave = async () => {
    if (!form.lab_cat_name.trim()) {
      setErrors({ lab_cat_name: "Lab Category Name is required" });
      return;
    }

    try {
      if (editingId) {
        await updateLabCategory(editingId, form);
        toast.success("Lab Category updated successfully");
      } else {
        await createLabCategory(form);
        toast.success("Lab Category added successfully");
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "An error occurred",
      );
    }
  };

  const handleCancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteLabCategory(deleteId);
        toast.success("Lab Category deleted successfully");
        load();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to delete");
      } finally {
        setDeleteId(null);
      }
    }
  };

  // Filter Data
  const filteredList = useMemo(() => {
    if (!search) return list;
    return list.filter(
      (item) =>
        item.lab_cat_name.toLowerCase().includes(search.toLowerCase()) ||
        (item.lab_cat_description &&
          item.lab_cat_description
            .toLowerCase()
            .includes(search.toLowerCase())),
    );
  }, [list, search]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "SL No.",
        valueGetter: "node.rowIndex + 1",
        width: 80,
        maxWidth: 100,
        sortable: false,
        filter: false,
        cellStyle: { textAlign: "center" },
      },
      {
        headerName: "Lab Category Name",
        field: "lab_cat_name",
        sortable: true,
        filter: true,
        flex: 1,
      },
      {
        headerName: "Description",
        field: "lab_cat_description",
        sortable: true,
        filter: true,
        flex: 2,
        wrapText: true,
        autoHeight: true,
      },
      {
        headerName: "Action",
        cellRenderer: (params: any) => (
          <div className="flex space-x-3 justify-center items-center h-full">
            <GoPencil
              size={18}
              onClick={() => {
                setEditingId(params.data.lab_cat_id);
                setForm({
                  lab_cat_name: params.data.lab_cat_name,
                  lab_cat_description: params.data.lab_cat_description || "",
                });
                setShowForm(true);
                setErrors({});
                // Smooth scroll down to form
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth",
                });
              }}
              className="cursor-pointer text-yellow-600 hover:text-yellow-700"
              title="Edit"
            />
            <MdOutlineDoNotDisturbAlt
              size={18}
              onClick={() => setDeleteId(params.data.lab_cat_id)}
              className="cursor-pointer text-red-600 hover:text-red-700"
              title="Delete"
            />
          </div>
        ),
        width: 100,
        maxWidth: 120,
        cellStyle: { textAlign: "center" },
        sortable: false,
        filter: false,
      },
    ],
    [],
  );

  return (
    <div>
      <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
      `}</style>

      {/* ===== HEADER & ADD BUTTON ===== */}
      <div className="flex justify-between items-end pb-5">
        <h3 className="text-lg leading-6 font-medium">Lab Category</h3>

        <div className="flex flex-col items-end space-y-3">
          <button
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setShowForm(true);
              setErrors({});
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              });
            }}
            className="button-bg px-3 py-1.5 text-sm rounded flex items-center text-white"
          >
            Add
          </button>

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]"
          />
        </div>
      </div>

      <div className="w-full transition-all duration-300">
        <DataTable
          columnDefs={columnDefs}
          rowData={filteredList}
          showAddButton={false}
          showExportButton={false}
          headerFilter={false}
          pageSize={pageSize}
        />
      </div>

      {/* ===== INLINE ADD/EDIT FORM ===== */}
      {showForm && (
        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="bg-[#1f2937] text-white px-4 py-3 rounded-t-lg flex items-center">
            <h2 className="font-semibold text-sm m-0 p-0">
              {editingId ? "Edit" : "Add"} Lab Category
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Lab Category Name: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.lab_cat_name}
                  onChange={(e) => {
                    setForm({ ...form, lab_cat_name: e.target.value });
                    if (e.target.value)
                      setErrors({ ...errors, lab_cat_name: "" });
                  }}
                  className={`border rounded p-2 text-sm focus:ring-[#437880] focus:border-[#437880] ${errors.lab_cat_name ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  placeholder="Enter category name"
                />
                {errors.lab_cat_name && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.lab_cat_name}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Description:
                </label>
                <textarea
                  value={form.lab_cat_description}
                  onChange={(e) =>
                    setForm({ ...form, lab_cat_description: e.target.value })
                  }
                  maxLength={2000}
                  placeholder="Enter description"
                  className="border border-gray-300 rounded p-2 text-sm focus:ring-[#437880] focus:border-[#437880]"
                  rows={3}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {(form.lab_cat_description || "").length} / 2000
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <UIButton className="button-bg" onClick={handleSave}>
                <FaSave className="mr-2" /> {editingId ? "Update" : "Save"}
              </UIButton>
              <UIButton
                className="panel-bg-1 main-page-text-color border border-[#437880] !shadow-none"
                onClick={() => setForm(emptyForm)}
              >
                <FaSync className="mr-2" /> Reset
              </UIButton>
              <UIButton className="bg-[#d9534f]" onClick={handleCancelForm}>
                <FaTimes className="mr-2" /> Cancel
              </UIButton>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION ===== */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Confirm"
        message="Are you sure you want to delete this lab category?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};

export default LabCategoryPage;
