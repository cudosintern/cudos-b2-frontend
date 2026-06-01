import React, { useState, useEffect, useMemo, useCallback } from "react";
import { z } from "zod";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";

// Component Imports
import DynamicFormBuilder from "../../../../../components/FormBuilder/DynamicFormBuilder";
import ConfirmDialog from "../../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../../components/Table/DataTable";

import { useAxios } from "../../../../../hooks/useAxios";
import { ApiEndpoint } from "../../../../../utils/ApiEndpoint/emsapiEndpoint";

export interface DeliveryMethodResponse {
  crclm_dm_id: number;
  academic_batch_id?: number | null;
  crs_id?: number | null;
  delivery_mtd_name: string;
  delivery_mtd_desc: string | null;
  bloom_levels?: any;
}

// --- ZOD SCHEMA ---
const Schema = z.object({
  delivery_mtd_name: z
    .string()
    .min(1, { message: "Delivery Method Name is required" }),
  delivery_mtd_desc: z.string().optional().nullable(),
  bloom_levels: z.any().optional().nullable(), 
});

const CurriculumDeliveryMethod: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCurriculumFilter, setSelectedCurriculumFilter] = useState<string>("");

  // Form & Dialog States
  const [editingData, setEditingData] = useState<DeliveryMethodResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // --- 1. MAIN TABLE DATA FETCH ---
  const {
    responseData: tableData,
    refetch,
    customApiCall,
  } = useAxios<DeliveryMethodResponse[], any>(
    ApiEndpoint.cudos.curriculum_delivery_method,
    { method: "get", shouldFetch: true },
  );

  const data: DeliveryMethodResponse[] = Array.isArray(tableData) ? tableData : [];

  // --- 2. FETCH CURRICULUM LIST ---
  const { responseData: curriculumList } = useAxios<any, any>(
    "/curriculum_list/curriculum",
    { method: "get", shouldFetch: true },
  );
  const curriculums = useMemo(() => {
    return Array.isArray(curriculumList)
      ? curriculumList
      : curriculumList?.data && Array.isArray(curriculumList.data)
        ? curriculumList.data
        : [];
  }, [curriculumList]);

  // --- 3. FETCH BLOOM'S LEVELS ---
  const { responseData: bloomData } = useAxios<any, any>(
    "/cudo_module/get_bloom_levels",
    { method: "get", shouldFetch: true },
  );
  
  const bloomLevelsList = useMemo(() => {
    const rawList = Array.isArray(bloomData)
      ? bloomData
      : bloomData?.data && Array.isArray(bloomData.data)
        ? bloomData.data
        : [];

    return [...rawList].sort((a: any, b: any) => {
      if (a.bld_id !== b.bld_id) {
        return (a.bld_id || 0) - (b.bld_id || 0);
      }
      return (a.level || "").localeCompare(b.level || "");
    });
  }, [bloomData]);

  // Auto-select the first curriculum for the list filter
  useEffect(() => {
    if (curriculums.length > 0 && !selectedCurriculumFilter) {
      setSelectedCurriculumFilter(curriculums[0].academic_batch_id.toString());
    }
  }, [curriculums, selectedCurriculumFilter]);

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesCurriculum = selectedCurriculumFilter
        ? String(item.academic_batch_id) === String(selectedCurriculumFilter)
        : true;

      const lowerSearch = searchTerm.toLowerCase();
      
      let bloomText = "";
      if (Array.isArray(item.bloom_levels)) {
        bloomText = item.bloom_levels.map((id: any) => {
          const found = bloomLevelsList.find(b => b.bloom_id?.toString() === id?.toString());
          return found ? found.level : id;
        }).join(" ");
      }

      const matchesSearch =
        !searchTerm ||
        item.delivery_mtd_name?.toLowerCase().includes(lowerSearch) ||
        item.delivery_mtd_desc?.toLowerCase().includes(lowerSearch) ||
        bloomText.toLowerCase().includes(lowerSearch);

      return matchesCurriculum && matchesSearch;
    });
  }, [data, searchTerm, selectedCurriculumFilter, bloomLevelsList]);

  // --- HANDLERS ---
  const handleEdit = useCallback((rowData: DeliveryMethodResponse) => {
    setEditingData(rowData);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, []);

  const handleReset = () => {
    setEditingData(null);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (!selectedCurriculumFilter) {
        alert("Please select a Curriculum from the top dropdown first.");
        return;
      }

      // 1. Frontend Duplicate Check
      const enteredName = formData.delivery_mtd_name?.trim().toLowerCase() || "";

      const isDuplicate = data.some((item) => {
        const isDifferentRecord = editingData ? item.crclm_dm_id !== editingData.crclm_dm_id : true;
        const isSameName = item.delivery_mtd_name?.trim().toLowerCase() === enteredName;
        const isSameCurriculum = String(item.academic_batch_id) === String(selectedCurriculumFilter);

        return isDifferentRecord && isSameName && isSameCurriculum;
      });

      if (isDuplicate) {
        alert("The Delivery Method name already exists in this Curriculum");
        return;
      }

      // --- FIX: Safely parse array of objects to array of values if needed ---
      let processedBloomLevels: any[] = [];
      if (Array.isArray(formData.bloom_levels)) {
        processedBloomLevels = formData.bloom_levels.map((item: any) => 
          typeof item === "object" ? item.value : item
        );
      } else if (typeof formData.bloom_levels === "string" && formData.bloom_levels.trim() !== "") {
        processedBloomLevels = [formData.bloom_levels];
      }

      // 2. Prepare Payload
      const payload = {
        delivery_mtd_name: formData.delivery_mtd_name,
        delivery_mtd_desc: formData.delivery_mtd_desc || "",
        academic_batch_id: editingData?.academic_batch_id || parseInt(selectedCurriculumFilter),
        bloom_levels: processedBloomLevels, 
      };

      const isEditing = !!editingData;

      if (isEditing && editingData) {
        // The 4th parameter `true` in customApiCall triggers the built-in global success toast!
        await customApiCall(
          `${ApiEndpoint.cudos.curriculum_delivery_method}/${editingData.crclm_dm_id}`,
          "put",
          payload,
          true,
          { returnFullResponse: true },
        );
      } else {
        await customApiCall(
          ApiEndpoint.cudos.curriculum_delivery_method,
          "post",
          payload,
          true,
          { returnFullResponse: true },
        );
      }

      // FIX: Removed the alert() pop-up so we don't get double messages!
      handleReset();
      await refetch();
      
    } catch (error: any) {
      console.error("Error saving:", error);
      const backendMessage = error.response?.data?.detail || error.response?.data?.message || error.message;
      alert(backendMessage || "An error occurred while saving the record.");
    }
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await customApiCall(
          `${ApiEndpoint.cudos.curriculum_delivery_method}/${deleteId}`,
          "delete",
          null,
          true, // Triggers global success toast
          { returnFullResponse: true },
        );
        await refetch();
      } catch (error) {
        console.error("Delete error:", error);
        alert("Error deleting record");
      } finally {
        setDeleteId(null);
      }
    }
  };

  // --- DYNAMIC FORM FIELDS ---
  const SchemaFields = useMemo(
    () => [
      {
        group: "",
        fields: [
          {
            type: "text",
            name: "delivery_mtd_name",
            label: "Delivery Method Name",
            placeholder: "e.g., Chalk and Talk",
            required: true,
          },
          {
            // FIX: Added multiple robust flags to ensure the UI component renders as a multi-select
            type: "select", 
            isMulti: true, 
            multiple: true, 
            mode: "multiple",
            name: "bloom_levels",
            label: "Bloom's Level (Optional)",
            options: bloomLevelsList.map((b: any) => ({
              label: b.level,
              value: b.bloom_id.toString(),
            })),
            required: false,
          },
          {
            type: "textarea",
            name: "delivery_mtd_desc",
            label: "Description",
            placeholder: "Enter description",
            required: false,
          },
        ],
      },
    ],
    [bloomLevelsList],
  );

  // --- COLUMN DEFINITIONS ---
  const columnDefs = useMemo(
    () => [
      {
        headerName: "SL No.",
        field: "sl_no",
        valueGetter: "node.rowIndex + 1",
        sortable: false,
        filter: false,
        editable: false,
        width: 60,
        maxWidth: 80,
        cellStyle: { textAlign: "center", padding: "0 5px" },
      },
      {
        headerName: "Delivery Method Name",
        field: "delivery_mtd_name",
        sortable: true,
        filter: true,
        minWidth: 200,
        wrapHeaderText: true,
        autoHeaderHeight: true,
      },
      {
        headerName: "Description",
        field: "delivery_mtd_desc",
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 250,
        wrapText: true,
        autoHeight: true,
      },
      {
        headerName: "Bloom's Level",
        field: "bloom_levels",
        valueGetter: (params: any) => {
          const levels = params.data?.bloom_levels;
          if (Array.isArray(levels)) {
            return levels.map((l: any) => {
              const idToFind = typeof l === 'object' ? (l.bloom_id || l.level) : l;
              const foundBloom = bloomLevelsList.find(
                (b: any) => b.bloom_id?.toString() === idToFind?.toString()
              );
              return foundBloom ? foundBloom.level : idToFind;
            }).join(", ");
          }
          return levels || "-";
        },
        sortable: false,
        filter: false,
        minWidth: 150,
        wrapText: true,
        autoHeight: true,
      },
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
              onClick={() => setDeleteId(params.node.data.crclm_dm_id)}
              className="cursor-pointer text-red-600 hover:text-red-700"
              title="Delete"
            />
          </div>
        ),
        width: 100,
        maxWidth: 120,
        cellStyle: { textAlign: "center" },
        filter: false,
        sortable: false,
      },
    ],
    [handleEdit, bloomLevelsList], 
  );

  // --- INITIAL VALUES DATA PARSER ---
  const getParsedInitialValues = () => {
    if (!editingData) {
      return {
        delivery_mtd_name: "",
        delivery_mtd_desc: "",
        bloom_levels: [],
      };
    }

    let parsedBloomLevels: string[] = [];
    if (Array.isArray(editingData.bloom_levels)) {
      parsedBloomLevels = editingData.bloom_levels.map((b: any) => 
        typeof b === 'object' ? b.bloom_id?.toString() : b?.toString()
      );
    } else if (typeof editingData.bloom_levels === "string" && editingData.bloom_levels) {
      parsedBloomLevels = editingData.bloom_levels.split(",").map(s => s.trim());
    }

    return {
      ...editingData,
      bloom_levels: parsedBloomLevels,
    };
  };

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }

        .curriculum-delivery-form-container form {
          position: relative !important;
        }
        .curriculum-delivery-form-container form > div:last-child {
          position: absolute !important;
          bottom: 0 !important;
          right: 0 !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
      `}</style>

      <div className="-mt-4 w-full">
        {/* --- TOP TABLE SECTION --- */}
        <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="bg-[#1f2937] text-white px-4 py-3 rounded-t-lg flex items-center justify-start">
            <h2 className="font-semibold text-sm m-0 p-0 text-left">
              Curriculum Delivery Method List
            </h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Curriculum:
                </span>
                <select
                  value={selectedCurriculumFilter}
                  onChange={(e) => {
                    setSelectedCurriculumFilter(e.target.value);
                    handleReset();
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
                >
                  {curriculums.map((c: any) => (
                    <option key={c.academic_batch_id} value={c.academic_batch_id}>
                      {c.academic_batch_name || c.academic_batch_code}
                    </option>
                  ))}
                </select>
              </div>

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
                height: filteredData.length > 0
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
              {editingData ? "Edit Delivery Method" : "Add Delivery Method"}
            </h2>
          </div>
          <div className="p-6 curriculum-delivery-form-container">
            <DynamicFormBuilder
              key={editingData ? `edit-${editingData.crclm_dm_id}` : "add-new"}
              fields={SchemaFields}
              schema={Schema}
              onSubmit={handleFormSubmit}
              columnLayout={2}
              submitbuttonposition="end"
              submitbuttonName={editingData ? "Update" : "Save"}
              resetbuttonName="Reset"
              onReset={handleReset}
              initialValues={getParsedInitialValues()}
            />
          </div>
        </div>

        <ConfirmDialog
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Confirm"
          message="Are you sure you want to delete this delivery method?"
        />
      </div>
    </>
  );
};

export default CurriculumDeliveryMethod;