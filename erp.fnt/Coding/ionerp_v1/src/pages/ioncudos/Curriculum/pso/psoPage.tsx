import React, { useCallback, useMemo, useState, useEffect } from "react";
import DataTable from "../../../../components/Table/DataTable";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { SchemaColumnDefs } from "./psoSchema";
import {
  PsoItem,
  CurriculumOption,
  PsoListByAcademicBatch,
  PoTypeOption,
} from "./responseInterface";
import { useAxios } from "../../../../hooks/useAxios";
import axiosInstance from "../../../../utils/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// API endpoint configuration for PSO module
const ApiEndpoint = {
  master_soft_delete: "comman_function/soft_delete",
  pso: {
    get_academic_batch_dropdown: "cudos/po/get_academic_batch_dropdown",
    create_po: "cudos/po/po",
    list_po: "cudos/po/po",
    get_po: "cudos/po/po",
    update_po: "cudos/po/po",
    delete_po: "cudos/po/po",
    get_po_by_academic_batch: "cudos/po/get_po_pso_by_academic_batch",
    get_po_types: "cudos/po/get_po_type_dropdown",
  },
};

const PsoPage: React.FC = () => {
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    item: PsoItem | null;
    targetStatus: number | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    item: null,
    targetStatus: null,
  });

  const [searchTerm, setSearchTerm] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem("poPsoSession");
      return saved ? JSON.parse(saved).searchTerm || "" : "";
    } catch {
      return "";
    }
  });
  const [academicBatchOptions, setAcademicBatchOptions] = useState<
    CurriculumOption[]
  >([]);
  const [poTypes, setPoTypes] = useState<PoTypeOption[]>([]);

  const [selectedAcademicBatch, setSelectedAcademicBatch] =
    useState<CurriculumOption | null>(() => {
      try {
        const saved = sessionStorage.getItem("poPsoSession");
        return saved ? JSON.parse(saved).selectedAcademicBatch || null : null;
      } catch {
        return null;
      }
    });

  const academicBatchAxiosOptions = useMemo(
    () => ({
      method: "get" as const,
      loader: false,
      shouldFetch: true,
    }),
    [],
  );

  const poTypesAxiosOptions = useMemo(
    () => ({
      method: "get" as const,
      loader: false,
      shouldFetch: true,
    }),
    [],
  );

  const psosAxiosOptions = useMemo(
    () => ({
      method: "get" as const,
      loader: true,
      shouldFetch: !!selectedAcademicBatch,
    }),
    [selectedAcademicBatch],
  );

  const { responseData: academicBatchResponse } = useAxios<
    any,
    CurriculumOption[]
  >(ApiEndpoint.pso.get_academic_batch_dropdown, academicBatchAxiosOptions);

  const { responseData: poTypesResponse } = useAxios<any, PoTypeOption[]>(
    ApiEndpoint.pso.get_po_types,
    poTypesAxiosOptions,
  );

  const {
    editItem,
    refetch: refetchPsos,
    responseData: psosResponse,
  } = useAxios<any, PsoListByAcademicBatch>(
    ApiEndpoint.pso.list_po,
    psosAxiosOptions,
  );

  useEffect(() => {
    if (academicBatchResponse) setAcademicBatchOptions(academicBatchResponse);
  }, [academicBatchResponse]);

  useEffect(() => {
    if (poTypesResponse) setPoTypes(poTypesResponse);
  }, [poTypesResponse]);

  const displayData = useMemo(() => {
    if (!psosResponse) return [];
    let allData: PsoItem[] = [];
    if (Array.isArray(psosResponse)) {
      allData = psosResponse;
    } else if (psosResponse && typeof psosResponse === "object") {
      const data: any = psosResponse;
      allData = Array.isArray(data.po_pso)
        ? data.po_pso
        : Array.isArray(data.psos)
          ? data.psos
          : [];
    }
    allData.sort(
      (a, b) => (Number(a.pso_flag) || 0) - (Number(b.pso_flag) || 0),
    );

    // FIX: Filter out deleted items (state_id === 0) so they immediately disappear
    allData = allData.filter((item: PsoItem) => item.state_id !== 0);

    if (selectedAcademicBatch) {
      return allData.filter(
        (item: PsoItem) =>
          item.academic_batch_id === selectedAcademicBatch.value,
      );
    }
    return allData;
  }, [psosResponse, selectedAcademicBatch]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return displayData;
    const lowerSearch = searchTerm.toLowerCase();
    return displayData.filter(
      (item: PsoItem) =>
        item.po_code?.toLowerCase().includes(lowerSearch) ||
        item.po_reference?.toLowerCase().includes(lowerSearch) ||
        item.po_statement?.toLowerCase().includes(lowerSearch),
    );
  }, [displayData, searchTerm]);

  const handleAdd = useCallback(() => {
    navigate("create", {
      state: { academic_batch_id: selectedAcademicBatch?.value },
    });
  }, [navigate, selectedAcademicBatch]);

  const handleEdit = useCallback(
    (data: PsoItem) => {
      navigate(`edit/${data.po_id}`, {
        state: { academic_batch_id: selectedAcademicBatch?.value },
      });
    },
    [navigate, selectedAcademicBatch],
  );

  // FIX: Updated to a specific delete trigger instead of toggle
  const handleDeleteTrigger = useCallback((item: PsoItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Confirm Deletion",
      message: `Are you sure you want to delete '${item.po_code}'?`,
      item: item,
      targetStatus: null, // Target status null tells handleConfirmAction to trigger the DELETE endpoint
    });
  }, []);

  const handleConfirmAction = useCallback(async () => {
    const { item, targetStatus } = confirmDialog;
    if (!item) return;

    if (targetStatus === null) {
      try {
        const response = await axiosInstance.delete(
          `${ApiEndpoint.pso.delete_po}/${item.po_id}`,
        );
        if (response.status === 200 || response.status === 204) {
          toast.success("Deleted successfully");
          refetchPsos();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to delete");
      }
    } else {
      const updatePayload = {
        academic_batch_id: item.academic_batch_id,
        state_id: targetStatus,
        modified_by: 1,
      };
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user && user.id) updatePayload.modified_by = user.id;
      } catch {}

      const response = await editItem(
        item.po_id,
        updatePayload,
        ApiEndpoint.pso.update_po,
      );
      if (response !== null) refetchPsos();
    }
    setConfirmDialog((prev) => ({ ...prev, isOpen: false, item: null }));
  }, [confirmDialog, refetchPsos, editItem]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("poPsoSession");
      const existing = saved ? JSON.parse(saved) : {};

      sessionStorage.setItem(
        "poPsoSession",
        JSON.stringify({
          ...existing,
          searchTerm,
          selectedAcademicBatch,
        }),
      );
    } catch {}
  }, [searchTerm, selectedAcademicBatch]);

  useEffect(() => {
    if (selectedAcademicBatch) refetchPsos();
  }, [selectedAcademicBatch, refetchPsos]);

  const columnDefs = useMemo(() => {
    const cols = SchemaColumnDefs.map((col) => {
      const baseCol = { ...col, flex: 1, minWidth: 100 };
      if (col.field === "po_type_id") {
        return {
          ...baseCol,
          valueFormatter: (params: any) => {
            const found = poTypes.find((t) => t.value === params.value);
            return found ? found.label : "";
          },
        };
      }
      return baseCol;
    });

    const mappedCols: any[] = [];
    cols.forEach((col) => {
      mappedCols.push(col);
      if (col.field === "po_type_id") {
        mappedCols.push({
          headerName: "Knowledge and Attitude Profile (KP)",
          field: "kp_mapping",

          valueGetter: (params: any) => {
            try {
              const saved = sessionStorage.getItem("poPsoSession");
              const poSession = saved ? JSON.parse(saved) : {};
              const mapKp = poSession.mapKp || {};

              const key = `${params.data.po_code}_${params.data.academic_batch_id}`;
              const value = mapKp[key];

              if (!value) return "";

              const kpOptions = JSON.parse(
                sessionStorage.getItem("kpOptions") || "[]",
              );

              const found = kpOptions.find((k: any) => k.value === value);

              return found ? found.label : value;
            } catch {
              return "";
            }
          },
          flex: 1,
          minWidth: 200,
          wrapText: true,
          sortable: false,
          filter: false,
        });
      }
    });

    mappedCols.push({
      headerName: "Action",
      field: "action",
      cellRenderer: (params: any) => (
        <div className="flex space-x-3 justify-center items-center h-full">
          <GoPencil
            size={18}
            className="cursor-pointer text-yellow-600 hover:text-yellow-700"
            title="Edit"
            onClick={() => handleEdit(params.data)}
          />
          {/* FIX: Consistent Delete icon mapped to the delete trigger */}
          <MdOutlineDoNotDisturbAlt
            size={18}
            className="cursor-pointer text-red-600 hover:text-red-800"
            title="Delete"
            onClick={() => handleDeleteTrigger(params.data)}
          />
        </div>
      ),
      width: 90,
      maxWidth: 100,
      cellStyle: { textAlign: "center" as const },
      filter: false,
      editable: false,
      sortable: false,
    });

    return mappedCols;
  }, [handleEdit, handleDeleteTrigger, poTypes]);

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
        .pso-row { color: blue !important; }
      `}</style>
      <div className="">
        <div className="pb-0">
          <div className="flex justify-between items-start pb-5">
            {/* LEFT */}
            <h3 className="text-lg leading-6 font-medium">
              Program Outcomes (POs) / Program Specific Outcomes (PSOs)
            </h3>

            {/* RIGHT */}
            <div className="flex flex-col items-end space-y-2">
              <UIButton type="button" onClick={handleAdd}>
                Add
              </UIButton>

              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <div className="">
              <select
                id="academic-batch-select"
                value={selectedAcademicBatch?.value || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const batch =
                    academicBatchOptions.find(
                      (b: CurriculumOption) => b.value === Number(value),
                    ) || null;
                  setSelectedAcademicBatch(batch);
                }}
                className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a Curriculum</option>
                {academicBatchOptions.map((batch: CurriculumOption) => (
                  <option key={batch.value} value={batch.value}>
                    {batch.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DataTable
          key={selectedAcademicBatch?.value}
          columnDefs={columnDefs}
          rowData={filteredData}
          showAddButton={false}
          showExportButton={false}
          addButtonHandler={handleAdd}
          headerFilter={false}
          pageSize={filteredData.length || 10}
          getRowClass={(params: any) => {
            const isChecked =
              params.data.pso_flag === true ||
              params.data.pso_flag === 1 ||
              params.data.pso_flag === "true";
            return isChecked ? "pso-row" : "";
          }}
        />

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onClose={() =>
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
          }
          onConfirm={handleConfirmAction}
        />
      </div>
    </>
  );
};

export default PsoPage;
