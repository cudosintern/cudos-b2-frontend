import React, { useCallback, useState, useMemo, useRef } from "react";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../components/Table/DataTable";
import { OutcomeSchema, OutcomeSchemaColumnDefs, OutcomeSchemaFields } from "./outcomeSchema";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { useAxios } from "../../../../hooks/useAxios";
import { ProgramOutcomeListResponse } from "./outcomeResponseInterface";
import { updateCookieCommonApiData } from "../../../../utils/commonHelper";
import axiosInstance from "../../../../utils/api";
import { toast } from "react-toastify";
import { getAccreditationTypes } from "../genericPO/genericPOSchema";
const OutcomePage = () => {
  const [statusTriggerItem, setStatusTriggerItem] = useState<ProgramOutcomeListResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [editingData, setEditingData] = useState<Record<string, any> | null>(null);
  const [searchText, setSearchText] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem("poPsoSession");
      return saved ? JSON.parse(saved).searchText || "" : "";
    } catch {
      return "";
    }
  });

  React.useEffect(() => {
    sessionStorage.setItem("poPsoSession", JSON.stringify({ searchText }));
  }, [searchText]);

  const { responseData, addItem, editItem, deleteItem, refetch, addStateItem, editStateItem, deleteStateItem } = useAxios<any, ProgramOutcomeListResponse[]>(ApiEndpoint.program.outcome_list, {
    method: "get",
    shouldFetch: true,
  });

  const displayData = useMemo(() => (Array.isArray(responseData) ? responseData : []), [responseData]);

  const filteredData = useMemo(() => {
    if (!searchText) return displayData;
    const lowerSearch = searchText.toLowerCase();
    return displayData.filter((item) =>
      item.po_type_name?.toLowerCase().includes(lowerSearch) ||
      item.po_type_description?.toLowerCase().includes(lowerSearch)
    );
  }, [displayData, searchText]);

  const closeModalHandler = () => {
    setIsModalOpen(false);
    setEditingData(null);
  };

  const OpenModalHandler = () => {
    setIsModalOpen(true);
  };

  const handleEdit = useCallback((data: Record<string, any>) => {
    setEditingData(data);
    setIsModalOpen(true);
  }, []);

  const handleStatusToggle = useCallback((item: ProgramOutcomeListResponse, status: number) => {
    setConfirmMessage(status === 1 ? "Activate this Program Outcome Type?" : "Deactivate this Program Outcome Type?");
    setStatusTriggerItem(item);
    setTargetStatus(status);
  }, []);

  const [targetStatus, setTargetStatus] = useState<number | null>(null);

  // const confirmStatusChange = useCallback(async () => {
  //   if (statusTriggerItem === null || targetStatus === null) {
  //     return;
  //   }
  //   const payload = {
  //     po_type_id: statusTriggerItem.po_type_id,
  //     status: targetStatus,
  //   };
  //   await editItem(statusTriggerItem.po_type_id, payload, ApiEndpoint.program.outcome_update);
  //   editStateItem('po_type_id', statusTriggerItem.po_type_id, { ...statusTriggerItem, status: targetStatus } as any);
  //   setStatusTriggerItem(null);
  //   setTargetStatus(null);
  // }, [statusTriggerItem, targetStatus, editItem, editStateItem]);

  const confirmStatusChange = useCallback(async () => {
  if (statusTriggerItem === null || targetStatus === null) {
    return;
  }

  // try {
  //   const payload = {
  //     po_type_id: statusTriggerItem.po_type_id,
  //     status: targetStatus,
  //   };
  try {

    // Prevent deactivation if PO Type is mapped
    if (targetStatus === 0) {

      const genericPoResponse = await getAccreditationTypes();

      const accreditationTypes = genericPoResponse?.data || [];

      const isMapped = accreditationTypes.some((atype: any) =>
        (atype.pos || []).some(
          (po: any) =>
            po.po_type_id === statusTriggerItem.po_type_id
        )
      );

      if (isMapped) {

        toast.warning(
          "You cannot deactivate this PO Type, as it has been assigned to a Generic Program Outcome (PO)."
        );

        setStatusTriggerItem(null);
        setTargetStatus(null);

        return;
      }
    }

    const payload = {
      po_type_id: statusTriggerItem.po_type_id,
      status: targetStatus,
    };

    const response: any = await axiosInstance.put(
      `${ApiEndpoint.program.outcome_update}${statusTriggerItem.po_type_id}`,
      payload
    );

    if (response.data.status) {
      editStateItem(
        "po_type_id",
        statusTriggerItem.po_type_id,
        {
          ...statusTriggerItem,
          status: targetStatus,
        } as any
      );

      if (targetStatus === 1) {
        toast.success("Program Outcome Activated Successfully");
      } else {
        toast.success("Program Outcome Deactivated Successfully");
      }
    }

    setStatusTriggerItem(null);
    setTargetStatus(null);

  } catch (error: any) {
    toast.error("Status Update Failed");
  }

}, [statusTriggerItem, targetStatus, editStateItem]);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const columnDefs = useMemo(() => {
    return [
      {
        headerName: "Sl No.",
        valueGetter: "node.rowIndex + 1",
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        suppressMovable: true,
        sortable: false,
        filter: false,
        cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "center" },
      },
      {
        headerName: "Program Outcome Type",
        field: "po_type_name",
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 200,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Description",
        field: "po_type_description",
        sortable: true,
        filter: true,
        flex: 2,
        minWidth: 300,
        cellStyle: { borderRight: "1px solid #e2e8f0", whiteSpace: "normal", lineHeight: "1.4" },
        autoHeight: true,
      },
      {
        headerName: "Action",
        cellRenderer: (params: any) => {
          if (!params || !params.data) return null;
          return (
            <div className="flex space-x-2 justify-center items-center h-full">
              <GoPencil
                size={18}
                onClick={() => handleEdit(params.data)}
                className="cursor-pointer text-yellow-600"
                title="Edit"
              />
              {params.data.status === 1 ? (
                <FaCheckCircle
                  className="cursor-pointer text-green-600"
                  size={18}
                  title="Active"
                  onClick={() => handleStatusToggle(params.data, 0)}
                />
              ) : (
                <MdOutlineDoNotDisturbAlt
                  className="cursor-pointer text-red-600"
                  size={18}
                  title="Inactive"
                  onClick={() => handleStatusToggle(params.data, 1)}
                />
              )}
            </div>
          );
        },
        width: 90,
        maxWidth: 100,
        cellStyle: { textAlign: "center" as const },
        filter: false,
        editable: false,
        sortable: false,
      },
    ];
  }, [handleEdit, handleStatusToggle]);

  const handleFormSubmit = useCallback(
    async (data: any) => {
      if (editingData) {
        const updatedItem = await editItem(editingData.po_type_id, data, ApiEndpoint.program.outcome_update);
        if (updatedItem) {
          editStateItem('po_type_id', editingData.po_type_id, updatedItem);
        }
      } else {
        const newItem = await addItem(data, ApiEndpoint.program.outcome_create);
        if (newItem) {
          addStateItem(newItem);
        }
      }
      closeModalHandler();
    },
    [editingData, addItem, editItem, addStateItem, editStateItem],
  );

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
      `}</style>
      <div className="">
       <div className="flex justify-between items-end pb-5">
  
  {/* LEFT - TITLE */}
  <h3 className="text-lg leading-6 font-medium">
    Program Outcome (PO) Type
  </h3>

  {/* RIGHT - ADD + SEARCH */}
  <div className="flex flex-col items-end space-y-3">
    
    {/* ADD BUTTON */}
    <button
      onClick={OpenModalHandler}
      className="button-bg px-3 py-1.5 text-sm rounded flex items-center"
    >
       Add
    </button>

    {/* SEARCH */}
    <input
      type="text"
      placeholder="Search..."
      value={searchText}
      onChange={onSearchChange}
      className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]"
    />
    
  </div>
</div>

        {isModalOpen && (
          <ModalWithForm
            title="Program Outcome"
            isOpen={isModalOpen}
            onSubmit={handleFormSubmit}
            onClose={closeModalHandler}
            formFields={OutcomeSchemaFields}
            schema={OutcomeSchema}
            size="lg"
            columnLayout={1}
            //initialValues={editingData || {}}
            initialValues={{
           ...editingData,
          po_type_description: editingData?.po_type_description ?? "",
          }}
            resetbuttonName="Reset"
          />
        )}

        <DataTable
          columnDefs={columnDefs}
          rowData={filteredData}
          showAddButton={false}
          showExportButton={false}
          addButtonHandler={OpenModalHandler}
          headerFilter={false}
          pageSize={10}
        />

        <ConfirmDialog
          isOpen={statusTriggerItem !== null}
          onClose={() => setStatusTriggerItem(null)}
          onConfirm={confirmStatusChange}
          title="Confirm"
          message={confirmMessage}
        />
      </div>
    </>
  );
};
export default OutcomePage;