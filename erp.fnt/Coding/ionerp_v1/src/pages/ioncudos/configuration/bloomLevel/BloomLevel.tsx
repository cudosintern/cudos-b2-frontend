import React, { useState, useEffect, useMemo, useCallback } from "react";
import { z } from "zod";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { toast } from "react-toastify"; // Added react-toastify import

import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../components/Table/DataTable";

import { useAxios } from "../../../../hooks/useAxios";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import {
  saveBloomLevel,
  getBloomLevels,
  deleteBloomLevel,
} from "./bloomLevelService";

// --- ZOD SCHEMA ---
const Schema = z.object({
  bld_id: z.union([z.string(), z.number()]).refine((val) => !!val, {
    message: "Bloom's Domain is required",
  }),
  level: z.string().min(1, { message: "Level is required" }),
  learning: z.string().min(1, { message: "Level of Learning is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  bloom_actionverbs: z.string().optional().nullable(),
});

interface BloomLevelData {
  bloom_id: number;
  bld_id: number;
  level: string;
  learning: string;
  description: string;
  bloom_actionverbs: string;
}

const BloomLevel: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [tableData, setTableData] = useState<BloomLevelData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>("");

  // Modal & Dialog States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<BloomLevelData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // --- FETCH DOMAINS ---
  const { responseData: domainList } = useAxios<any, any>(
    ApiEndpoint.cudos.bloom_domain_list,
    { method: "post", shouldFetch: true, payload: {} },
  );

  const domains = useMemo(() => {
    const rawDomains = Array.isArray(domainList)
      ? domainList
      : domainList?.data && Array.isArray(domainList.data)
        ? domainList.data
        : [];

    return rawDomains.filter(
      (d: any) =>
        d.status !== 0 &&
        d.status !== "Inactive" &&
        d.is_active !== 0 &&
        d.is_active !== false,
    );
  }, [domainList]);

  useEffect(() => {
    if (domains.length > 0 && !selectedDomainFilter) {
      setSelectedDomainFilter(domains[0].bld_id.toString());
    }
  }, [domains, selectedDomainFilter]);

  // --- FETCH LEVELS ---
  const fetchLevels = useCallback(async () => {
    try {
      const result = (await getBloomLevels()) as { data: BloomLevelData[] };
      if (result && result.data) {
        setTableData(result.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const matchesDomain = selectedDomainFilter
        ? item.bld_id.toString() === selectedDomainFilter
        : true;

      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.level?.toLowerCase().includes(lowerSearch) ||
        item.learning?.toLowerCase().includes(lowerSearch) ||
        item.description?.toLowerCase().includes(lowerSearch) ||
        item.bloom_actionverbs?.toLowerCase().includes(lowerSearch);

      return matchesDomain && matchesSearch;
    });
  }, [tableData, searchTerm, selectedDomainFilter]);

  // --- HANDLERS ---
  const closeModalHandler = useCallback(() => {
    setIsModalOpen(false);
    setEditingData(null);
  }, []);

  const openModalHandler = useCallback(() => {
    setEditingData(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((data: BloomLevelData) => {
    setEditingData(data);
    setIsModalOpen(true);
  }, []);

  const handleFormSubmit = async (formData: any) => {
    try {
      const enteredLevel = formData.level.trim().toLowerCase();

      const isDuplicate = tableData.some((item) => {
        const isDifferentRecord = editingData
          ? item.bloom_id !== editingData.bloom_id
          : true;
        const isSameDomain =
          item.bld_id.toString() === formData.bld_id.toString();
        return (
          isDifferentRecord &&
          item.level.toLowerCase() === enteredLevel &&
          isSameDomain
        );
      });

      if (isDuplicate) {
        toast.error(
          `A Bloom's Level with the name "${formData.level}" already exists!`,
        );
        return;
      }

      const payload = {
        bloom_id: editingData ? editingData.bloom_id : null,
        bld_id: Number(formData.bld_id),
        level: formData.level,
        learning: formData.learning,
        description: formData.description,
        bloom_actionverbs: formData.bloom_actionverbs || "",
      };

      const isEditing = !!editingData;

      const result: any = await saveBloomLevel(payload);
      if (result && (result.status === 0 || result.status === false)) {
        throw new Error(result.message || "Operation failed");
      }

      toast.success(
        isEditing
          ? "Successfully updated the Bloom level"
          : "Successfully added the Bloom level",
      );

      fetchLevels();
      closeModalHandler();
    } catch (error: any) {
      console.error("Error saving:", error);
      const backendMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;
      toast.error(
        backendMessage || "An error occurred while saving the record.",
      );
    }
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        const result: any = await deleteBloomLevel(deleteId);
        if (result && (result.status === 0 || result.status === false)) {
          toast.error(result.message || "Delete failed");
        } else {
          toast.success("Successfully deleted the Bloom level");
          fetchLevels();
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Error deleting record");
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
            type: "select",
            name: "bld_id",
            label: "Bloom's Domain",
            loadOptions: async () => {
              return domains.map((d: any) => ({
                label: d.bld_name,
                value: d.bld_id,
              }));
            },
            required: true,
          },
          {
            type: "text",
            name: "level",
            label: "Level",
            placeholder: "e.g., L1",
            required: true,
          },
          {
            type: "text",
            name: "learning",
            label: "Level Of Learning",
            placeholder: "e.g., Remembering",
            required: true,
          },
          {
            type: "textarea",
            name: "description",
            label: "Description",
            placeholder: "Enter description",
            required: true,
          },
          {
            type: "textarea",
            name: "bloom_actionverbs",
            label: "Bloom's Action Verbs (Optional)",
            placeholder: "e.g., List, Identify, Outline...",
            required: false,
            helperText:
              "Note: Enter the Action Verb and Press Enter or comma(,) or Tab to add the Action Verb as a Tag.",
            description:
              "Note: Enter the Action Verb and Press Enter or comma(,) or Tab to add the Action Verb as a Tag.",
          },
        ],
      },
    ],
    [domains],
  );

  // --- COLUMN DEFINITIONS ---
  const columnDefs = useMemo(
    () => [
      {
        headerName: "Bloom's Levels",
        field: "level",
        sortable: true,
        filter: true,
        minWidth: 150,
        wrapHeaderText: true,
        autoHeaderHeight: true,
      },
      {
        headerName: "Level Of Learning",
        field: "learning",
        sortable: true,
        filter: true,
        minWidth: 160,
        flex: 1,
        wrapText: true,
        autoHeight: true,
        wrapHeaderText: true,
        autoHeaderHeight: true,
      },
      {
        headerName: "Description",
        field: "description",
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 300,
        wrapText: true,
        autoHeight: true,
      },
      {
        headerName: "Bloom's Action Verbs",
        field: "bloom_actionverbs",
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 250,
        wrapText: true,
        autoHeight: true,
      },
      {
        headerName: "Action",
        field: "action",
        cellRenderer: (params: any) => (
          <div className="flex space-x-3 justify-center items-center h-full">
            <GoPencil
              size={18}
              onClick={() => handleEdit(params.node.data)}
              className="cursor-pointer text-yellow-600"
              title="Edit"
            />
            <MdOutlineDoNotDisturbAlt
              size={18}
              onClick={() => setDeleteId(params.node.data.bloom_id)}
              className="cursor-pointer text-red-600"
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
    [handleEdit],
  );

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
      `}</style>

      <div>
        <div className="flex justify-between items-end pb-5">
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg leading-6 font-medium">
              Bloom's Level Details
            </h3>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Bloom's Domain: <span className="text-red-500">*</span>
              </span>
              <select
                value={selectedDomainFilter}
                onChange={(e) => setSelectedDomainFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
              >
                {domains.map((domain: any) => (
                  <option key={domain.bld_id} value={domain.bld_id}>
                    {domain.bld_name || "Name Missing"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-3">
            <button
              onClick={openModalHandler}
              className="button-bg px-3 py-1.5 text-sm rounded flex items-center"
            >
              Add
            </button>

            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div
          className="w-full transition-all duration-300"
          style={{
            height:
              filteredData.length > 0
                ? `${Math.max(380, filteredData.length * 50 + 150)}px`
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

        {/* --- MODAL SECTION --- */}
        {isModalOpen && (
          <ModalWithForm
            title="Bloom's Level"
            isOpen={isModalOpen}
            onSubmit={handleFormSubmit}
            onClose={closeModalHandler}
            formFields={SchemaFields}
            schema={Schema}
            size="lg"
            columnLayout={1}
            resetbuttonName="Reset"
            initialValues={
              editingData || {
                bld_id:
                  selectedDomainFilter ||
                  (domains.length > 0 ? domains[0].bld_id : ""),
                level: "",
                learning: "",
                description: "",
                bloom_actionverbs: "",
              }
            }
          >
            <div className="mt-4 mb-2 text-sm text-gray-700 bg-blue-50/50 p-3 rounded border border-blue-100">
              <span className="font-semibold">Note:</span> Enter the Action Verb
              and Press Enter or comma(,) or Tab to add the Action Verb as a
              Tag.
            </div>
          </ModalWithForm>
        )}

        <ConfirmDialog
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Confirm"
          message="Are you sure you want to delete this level?"
        />
      </div>
    </>
  );
};

export default BloomLevel;
