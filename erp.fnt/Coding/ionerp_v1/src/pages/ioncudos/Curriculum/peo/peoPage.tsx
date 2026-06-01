import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt, MdDelete } from "react-icons/md";
import { FaCheckCircle, FaPlus } from "react-icons/fa";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../components/Table/DataTable";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import TextInput from "../../../../components/FormBuilder/fields/TextInput";
import Textarea from "../../../../components/FormBuilder/fields/Textarea";
import { Schema, SchemaColumnDefs } from "./peoSchema";
import { useAxios } from "../../../../hooks/useAxios";
import axiosInstance from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  PeoItem,
  CurriculumOption,
  PeoListByCurriculum,
  PoTypeOption,
} from "./responseInterface";
import ProceedToPOModal from "./ProceedToPOModal";

const ApiEndpoint = {
  master_soft_delete: "comman_function/soft_delete",
  peo: {
    get_academic_batch_dropdown: "cudos/peo/get_academic_batch_dropdown",
    get_peos_by_academic_batch: "cudos/peo/get_peos_by_academic_batch",
    create_peo: "cudos/peo/create_peo",
    update_peo: "cudos/peo/update_peo",
    delete_peo: "cudos/peo/delete_peo",
    get_po_types: "cudos/peo/get_po_types",
  },
};

const PeoPage: React.FC = () => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<PeoItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isProceedModalOpen, setIsProceedModalOpen] = useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [targetStatus, setTargetStatus] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem("peoSession");
      return saved ? JSON.parse(saved).searchTerm || "" : "";
    } catch {
      return "";
    }
  });

  const [curriculaOptions, setCurriculaOptions] = useState<CurriculumOption[]>(
    [],
  );
  const [poTypes, setPoTypes] = useState<PoTypeOption[]>([]);

  const [selectedCurriculum, setSelectedCurriculum] =
    useState<CurriculumOption | null>(() => {
      try {
        const saved = sessionStorage.getItem("peoSession");
        return saved ? JSON.parse(saved).selectedCurriculum || null : null;
      } catch {
        return null;
      }
    });

  const [peosData, setPeosData] = useState<PeoItem[]>([]);

  const curriculumAxiosOptions = useMemo(
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

  const peosAxiosOptions = useMemo(
    () => ({
      method: "post" as const,
      loader: true,
      data: selectedCurriculum
        ? { academic_batch_id: selectedCurriculum.value }
        : {},
      shouldFetch: !!selectedCurriculum,
    }),
    [selectedCurriculum],
  );

  const { responseData: curriculumResponse } = useAxios<
    any,
    CurriculumOption[]
  >(ApiEndpoint.peo.get_academic_batch_dropdown, curriculumAxiosOptions);

  const { responseData: poTypesResponse } = useAxios<any, PoTypeOption[]>(
    ApiEndpoint.peo.get_po_types,
    poTypesAxiosOptions,
  );

  const {
    responseData: peosResponse,
    addItem,
    editItem,
    deleteItem,
    editStateItem,
    addStateItem,
    refetch: refetchPeos,
    setResponseData,
  } = useAxios<any, PeoListByCurriculum>(
    ApiEndpoint.peo.get_peos_by_academic_batch,
    peosAxiosOptions,
  );

  useEffect(() => {
    if (curriculumResponse && Array.isArray(curriculumResponse)) {
      setCurriculaOptions(curriculumResponse);
    }
  }, [curriculumResponse]);

  useEffect(() => {
    if (poTypesResponse && Array.isArray(poTypesResponse)) {
      setPoTypes(poTypesResponse);
    }
  }, [poTypesResponse]);

  useEffect(() => {
    if (peosResponse && Array.isArray(peosResponse.peos)) {
      setPeosData(
        peosResponse.peos.map((peo: PeoItem) => ({
          ...peo,
          academic_batch_id:
            peo.academic_batch_id || peosResponse.academic_batch_id,
        })),
      );
    } else {
      setPeosData([]);
    }
  }, [peosResponse]);

  useEffect(() => {
    sessionStorage.setItem(
      "peoSession",
      JSON.stringify({ searchTerm, selectedCurriculum }),
    );
  }, [searchTerm, selectedCurriculum]);

  const SchemaFields = useMemo(
    () => [
      {
        group: "",
        fields: [
          {
            type: "select",
            name: "academic_batch_id",
            label: "Curriculum",
            placeholder: "Select Curriculum",
            required: true,
            options: curriculaOptions.map((curriculum: CurriculumOption) => ({
              value: curriculum.value.toString(),
              label: curriculum.label,
            })),
          },
          {
            type: "text",
            name: "peo_reference",
            label: "PEO Code",
            placeholder: "Enter PEO Code (e.g., PEO1, PEO2)",
            required: true,
          },
          {
            type: "textarea",
            name: "peo_statement",
            label: "PEO Statement",
            placeholder: "Enter detailed PEO statement",
            required: true,
          },
          {
            type: "text",
            name: "attendees_name",
            label: "Attendees Name",
            placeholder: "Enter Attendees Name",
            required: true,
          },
          {
            type: "textarea",
            name: "meeting_notes",
            label: "Meeting Notes",
            placeholder: "Enter Meeting Notes",
            required: false,
            rows: 3,
          },
        ],
      },
    ],
    [curriculaOptions, poTypes],
  );

  const customSchema = useMemo(() => {
    return Schema.superRefine((data, ctx) => {
      const trimmedRef = data.peo_reference?.trim().toLowerCase();
      const trimmedStatement = data.peo_statement?.trim().toLowerCase();

      const duplicateRef = peosData.find(
        (peo) =>
          peo.peo_reference?.trim().toLowerCase() === trimmedRef &&
          (!editingData || peo.peo_id !== editingData.peo_id),
      );

      if (duplicateRef) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `PEO Code '${data.peo_reference}' already exists`,
          path: ["peo_reference"],
        });
      }

      const duplicateStatement = peosData.find(
        (peo) =>
          peo.peo_statement?.trim().toLowerCase() === trimmedStatement &&
          (!editingData || peo.peo_id !== editingData.peo_id),
      );

      if (duplicateStatement) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Program Educational Objective Name '${data.peo_statement}' already exists`,
          path: ["peo_statement"],
        });
      }
    });
  }, [peosData, editingData]);

  const displayData = useMemo(() => peosData, [peosData]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return displayData;
    const lowerSearch = searchTerm.toLowerCase();
    return displayData.filter(
      (item: PeoItem) =>
        item.peo_reference?.toLowerCase().includes(lowerSearch) ||
        item.peo_statement?.toLowerCase().includes(lowerSearch),
    );
  }, [displayData, searchTerm]);

  const closeModalHandler = useCallback(() => {
    setIsModalOpen(false);
    setEditingData(null);
  }, []);

  const OpenModalHandler = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback(
    (data: PeoItem) => {
      const batchId = data.academic_batch_id;
      const editingDataComplete = {
        peo_id: data.peo_id,
        peo_reference: data.peo_reference || "",
        peo_statement: data.peo_statement || "",
        academic_batch_id: batchId?.toString() || "",
        state_id: data.state_id || 1,
        attendees_name: data.attendees?.[0]?.attendees_name || "",
        meeting_notes: data.attendees?.[0]?.attendees_notes || "",
      };

      setEditingData(editingDataComplete);
      setIsModalOpen(true);
    },
    [curriculaOptions],
  );

  const handleDeleteTrigger = useCallback(
    (item: PeoItem, message: string, status: number) => {
      setConfirmMessage(message);
      setDeleteId(item);
      setTargetStatus(status);
    },
    [],
  );

  const confirmDelete = useCallback(async () => {
    if (deleteId && targetStatus !== null) {
      if (targetStatus === 2) {
        try {
          const response = await axiosInstance.delete(
            `${ApiEndpoint.peo.delete_peo}/${deleteId.peo_id}`,
          );
          if (response.status === 200 || response.status === 204) {
            toast.success("PEO deleted successfully");
            setPeosData((prev: PeoItem[]) =>
              prev.filter((peo) => peo.peo_id !== deleteId.peo_id),
            );
          } else {
            toast.error("Failed to delete PEO");
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to delete PEO");
        }
      } else {
        const updatePayload: any = {
          academic_batch_id:
            selectedCurriculum?.value || deleteId.academic_batch_id,
          state_id: targetStatus,
          modified_by: 1,
        };
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          if (user && user.id) updatePayload.modified_by = user.id;
        } catch {}

        await editItem(
          deleteId.peo_id,
          updatePayload,
          ApiEndpoint.peo.update_peo,
        );
        refetchPeos();
        setPeosData((prev: PeoItem[]) =>
          prev.map((peo: PeoItem) =>
            peo.peo_id === deleteId.peo_id
              ? { ...peo, state_id: targetStatus }
              : peo,
          ),
        );
      }
      setDeleteId(null);
      setTargetStatus(null);
    }
  }, [
    editItem,
    deleteId,
    targetStatus,
    refetchPeos,
    setPeosData,
    selectedCurriculum,
  ]);

  const handleFormSubmit = useCallback(
    async (formData: any) => {
      const numericAcademicBatchId = Number(formData.academic_batch_id);
      let modifiedBy = 1;

      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user && user.id) {
          modifiedBy = user.id;
        }
      } catch {}

      const validAttendees = formData.attendees_name
        ? [
            {
              attendees_name: formData.attendees_name,
              attendees_notes: formData.meeting_notes || "",
            },
          ]
        : [];

      if (editingData && editingData.peo_id) {
        const updatePayload: any = {
          peo_reference: formData.peo_reference,
          peo_statement: formData.peo_statement,
          academic_batch_id: numericAcademicBatchId,
          state_id: editingData.state_id,
          modified_by: modifiedBy,
          attendees: validAttendees,
        };

        await editItem(
          editingData.peo_id,
          updatePayload,
          ApiEndpoint.peo.update_peo,
        );
        toast.dismiss();
        toast.success("PEO updated successfully");

        setPeosData((prev: PeoItem[]) =>
          prev.map((item: PeoItem) =>
            item.peo_id === editingData.peo_id
              ? {
                  ...item,
                  peo_reference: formData.peo_reference,
                  peo_statement: formData.peo_statement,
                  academic_batch_id: numericAcademicBatchId,
                  attendees: validAttendees,
                }
              : item,
          ),
        );

        closeModalHandler();
      } else {
        const payload: any = {
          peo_reference: formData.peo_reference,
          peo_statement: formData.peo_statement,
          academic_batch_id: numericAcademicBatchId,
          state_id: 1,
          created_by: modifiedBy,
          attendees: validAttendees,
        };

        const response: any = await addItem(
          payload,
          ApiEndpoint.peo.create_peo,
        );

        if (response) {
          toast.dismiss();
          toast.success("PEO created successfully");

          const newPeo: PeoItem = {
            peo_id: response.peo_id || Date.now(),
            peo_reference: formData.peo_reference,
            peo_statement: formData.peo_statement,
            academic_batch_id: numericAcademicBatchId,
            state_id: 1,
            attendees: validAttendees,
          };

          setPeosData((prev: PeoItem[]) => [...prev, newPeo]);
          closeModalHandler();
        }
      }
    },
    [editItem, addItem, editingData, peosData, closeModalHandler],
  );

  // Handle Proceed to PO without backend API call
  const confirmProceedToPO = useCallback(() => {
    if (!selectedCurriculum) {
      toast.error("Please select a curriculum first");
      return;
    }

    toast.success("Proceeding to POs...");

    // Preserve curriculum context for PO module
    const poPsoSession = {
      searchTerm: "",
      selectedAcademicBatch: selectedCurriculum,
    };
    sessionStorage.setItem("poPsoSession", JSON.stringify(poPsoSession));

    setIsProceedModalOpen(false);
    navigate("/curriculum/program_outcomes");
  }, [selectedCurriculum, navigate]);

  const columnDefs = useMemo(
    () => [
      ...SchemaColumnDefs.map((col) => ({ ...col, flex: 1, minWidth: 100 })),
      {
        headerName: "Action",
        field: "action",
        cellRenderer: (params: any) => (
          <div className="flex space-x-2 justify-center items-center h-full">
            <GoPencil
              size={18}
              onClick={() => handleEdit(params.data)}
              className="cursor-pointer text-yellow-600"
              title="Edit"
            />
            {params.data.state_id === 1 ? (
              <FaCheckCircle
                className="cursor-pointer text-green-600"
                size={18}
                title="Active"
                onClick={() =>
                  handleDeleteTrigger(params.data, "Deactivate this PEO?", 0)
                }
              />
            ) : (
              <MdOutlineDoNotDisturbAlt
                className="cursor-pointer text-red-600"
                size={18}
                title="Inactive"
                onClick={() =>
                  handleDeleteTrigger(params.data, "Activate this PEO?", 1)
                }
              />
            )}
          </div>
        ),
        width: 90,
        maxWidth: 100,
        cellStyle: { textAlign: "center" as const },
        filter: false,
        editable: false,
        sortable: false,
      },
    ],
    [handleEdit, handleDeleteTrigger],
  );

  useEffect(() => {
    if (selectedCurriculum) {
      refetchPeos();
    }
  }, [selectedCurriculum]);

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
      `}</style>
      <div className="">
        <div className="pb-0">
          <div className="flex justify-between items-start pb-5">
            <h3 className="text-lg leading-6 font-medium">
              Program Educational Objectives (PEOs)
            </h3>

            <div className="flex flex-col items-end space-y-2">
              <UIButton type="button" onClick={OpenModalHandler}>
                Add
              </UIButton>

              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center space-x-8">
              <select
                id="curriculum-select"
                value={selectedCurriculum?.value || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const curriculum =
                    curriculaOptions.find(
                      (c: CurriculumOption) => c.value === Number(value),
                    ) || null;
                  setSelectedCurriculum(curriculum);
                }}
                className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]"
              >
                <option value="">Select a Curriculum</option>
                {curriculaOptions.map((curriculum: CurriculumOption) => (
                  <option key={curriculum.value} value={curriculum.value}>
                    {curriculum.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <ModalWithForm
            title={editingData ? "Edit PEO" : "Add PEO"}
            isOpen={isModalOpen}
            onSubmit={handleFormSubmit}
            onClose={closeModalHandler}
            formFields={SchemaFields}
            schema={customSchema}
            size="lg"
            columnLayout={1}
            initialValues={
              editingData || {
                academic_batch_id: selectedCurriculum?.value?.toString() ?? "",
                peo_reference: "",
                peo_statement: "",
              }
            }
            resetbuttonName="Reset"
          />
        )}

        <DataTable
          key={selectedCurriculum?.value}
          columnDefs={columnDefs}
          rowData={filteredData}
          showAddButton={false}
          showExportButton={false}
          headerFilter={false}
          pageSize={filteredData.length || 10}
        />

        <ConfirmDialog
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Confirm"
          message={confirmMessage}
        />

        <ProceedToPOModal
          isOpen={isProceedModalOpen}
          onClose={() => setIsProceedModalOpen(false)}
          onConfirm={confirmProceedToPO}
          curriculumName={selectedCurriculum?.label || ""}
        />

        <div className="flex justify-end mt-4">
          <div
            className={
              peosData.length === 0 ? "opacity-60 cursor-not-allowed" : ""
            }
          >
            <UIButton
              type="button"
              disabled={peosData.length === 0}
              onClick={() => {
                if (selectedCurriculum) {
                  setIsProceedModalOpen(true);
                } else {
                  toast.warning("Please select a curriculum to proceed.");
                }
              }}
            >
              Proceed to PO
            </UIButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default PeoPage;
