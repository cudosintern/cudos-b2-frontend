import React, { useState, useMemo, useCallback } from "react";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";

// Component Imports
import DynamicFormBuilder from "../../../../../components/FormBuilder/DynamicFormBuilder";
import ConfirmDialog from "../../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../../components/Table/DataTable";

import {
  Schema,
  SchemaColumnDefs,
  SchemaFields,
} from "./courseSpecializationSchema";
import { useAxios } from "../../../../../hooks/useAxios";
import { ApiEndpoint } from "../../../../../utils/ApiEndpoint/emsapiEndpoint";

export interface CourseSpecializationResponse {
  crs_domain_id: number;
  crs_domain_name: string;
  crs_domain_description: string;
}

const CourseSpecializationPage: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Custom Toast Notification State (Replaces alert)
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Form & Dialog States
  const [editingData, setEditingData] =
    useState<CourseSpecializationResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --- API DATA FETCH ---
  const { responseData, refetch, customApiCall } = useAxios<
    CourseSpecializationResponse[],
    any
  >(ApiEndpoint.cudos.course_specialization, {
    method: "get",
    shouldFetch: true,
  });

  const data: CourseSpecializationResponse[] = Array.isArray(responseData)
    ? responseData
    : [];

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.crs_domain_name?.toLowerCase().includes(lowerSearch) ||
        item.crs_domain_description?.toLowerCase().includes(lowerSearch),
    );
  }, [data, searchTerm]);

  // --- HANDLERS ---
  const handleEdit = useCallback((rowData: CourseSpecializationResponse) => {
    setEditingData(rowData);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, []);

  const handleReset = () => {
    setEditingData(null);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      const enteredName = formData.crs_domain_name?.trim().toLowerCase() || "";

      const isDuplicate = data.some((item) => {
        const isDifferentRecord = editingData
          ? item.crs_domain_id !== editingData.crs_domain_id
          : true;
        const isSameName =
          item.crs_domain_name?.trim().toLowerCase() === enteredName;

        return isDifferentRecord && isSameName;
      });

      if (isDuplicate) {
        showToast("The Course Specialization name already exists.", "error");
        return;
      }

      // 2. Prepare Payload
      const payload = {
        crs_domain_name: formData.crs_domain_name,
        crs_domain_description: formData.crs_domain_description || "",
        dept_id: 95,
      };

      const isEditing = !!editingData;

      if (isEditing && editingData) {
        const baseUrl = ApiEndpoint.cudos.course_specialization.replace(
          /\/$/,
          "",
        );

        await customApiCall(
          `${baseUrl}/${editingData.crs_domain_id}`,
          "put",
          payload,
          true,
          { returnFullResponse: true },
        );
      } else {
        await customApiCall(
          ApiEndpoint.cudos.course_specialization,
          "post",
          payload,
          true,
          { returnFullResponse: true },
        );
      }

      handleReset();
      await refetch();
    } catch (error: any) {
      console.error("Error saving:", error);
      const backendMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;
      showToast(
        backendMessage || "An error occurred while saving the record.",
        "error",
      );
    }
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        const baseUrl = ApiEndpoint.cudos.course_specialization.replace(
          /\/$/,
          "",
        );

        await customApiCall(`${baseUrl}/${deleteId}`, "delete", null, true, {
          returnFullResponse: true,
        });

        await refetch();
      } catch (error) {
        console.error("Delete error:", error);
        showToast("Error deleting record", "error");
      } finally {
        setDeleteId(null);
      }
    }
  };

  // --- COLUMN DEFINITIONS ---
  const columnDefs = useMemo(
    () => [
      ...SchemaColumnDefs,
      {
        headerName: "Action",
        field: "action",
        cellRenderer: (params: any) => (
          <div className="flex space-x-2 justify-center items-center h-full">
            <GoPencil
              size={18}
              onClick={() => handleEdit(params.node.data)}
              className="cursor-pointer text-yellow-600 hover:text-yellow-700"
              title="Edit"
            />
            <MdOutlineDoNotDisturbAlt
              size={18}
              onClick={() => setDeleteId(params.node.data.crs_domain_id)}
              className="cursor-pointer text-red-600 hover:text-red-700"
              title="Delete"
            />
          </div>
        ),
        width: 100,
        maxWidth: 120,
        cellStyle: { textAlign: "center" as const },
        filter: false,
        editable: false,
        sortable: false,
      },
    ],
    [handleEdit],
  );

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }

        .course-spec-form-container form {
          position: relative !important;
        }
        .course-spec-form-container form > div:last-child {
          position: absolute !important;
          bottom: 0 !important;
          right: 0 !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
      `}</style>

      {/* Custom Toast UI for local errors */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] px-6 py-3 rounded shadow-lg text-white font-medium transition-all duration-300 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
          {toast.message}
        </div>
      )}

      <div className="-mt-4 w-full">
        {/* --- TOP TABLE SECTION --- */}
        <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="bg-[#1f2937] text-white px-4 py-3 rounded-t-lg flex items-center justify-start">
            <h2 className="font-semibold text-sm m-0 p-0 text-left">
              Course Specialization List
            </h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-end items-start md:items-center pb-5 space-y-4 md:space-y-0">
              <div className="w-full md:w-auto flex justify-start md:justify-end">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div
              className="mb-4 w-full transition-all duration-300"
              style={{
                height:
                  filteredData.length > 0
                    ? `${Math.max(380, filteredData.length * 50 + 180)}px`
                    : "380px",
              }}
            >
              <DataTable
                columnDefs={columnDefs}
                rowData={filteredData}
                showAddButton={false}
                showExportButton={false}
                headerFilter={false}
                pageSize={20}
              />
            </div>
          </div>
        </div>

        {/* --- BOTTOM FORM SECTION --- */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="bg-[#1f2937] text-white px-4 py-3 rounded-t-lg flex items-center justify-start">
            <h2 className="font-semibold text-sm m-0 p-0 text-left">
              {editingData
                ? "Edit Course Specialization"
                : "Add Course Specialization"}
            </h2>
          </div>
          <div className="p-6 course-spec-form-container">
            <DynamicFormBuilder
              key={
                editingData ? `edit-${editingData.crs_domain_id}` : "add-new"
              }
              fields={SchemaFields}
              schema={Schema}
              onSubmit={handleFormSubmit}
              columnLayout={2}
              submitbuttonposition="end"
              submitbuttonName={editingData ? "Update" : "Save"}
              resetbuttonName="Reset"
              onReset={handleReset}
              initialValues={
                editingData
                  ? {
                      crs_domain_name: editingData.crs_domain_name || "",
                      crs_domain_description:
                        editingData.crs_domain_description || "",
                    }
                  : {
                      crs_domain_name: "",
                      crs_domain_description: "",
                    }
              }
            />
          </div>
        </div>

        <ConfirmDialog
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Confirm"
          message="Are you sure you want to delete this Course Specialization?"
        />
      </div>
    </>
  );
};

export default CourseSpecializationPage;
