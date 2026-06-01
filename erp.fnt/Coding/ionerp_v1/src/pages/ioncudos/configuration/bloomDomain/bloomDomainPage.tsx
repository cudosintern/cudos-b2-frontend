import React, { useCallback, useState, useMemo } from "react";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa"; 
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../components/Table/DataTable";
import { Schema, SchemaColumnDefs, SchemaFields } from "./bloomDomainSchema";
import { useAxios } from "../../../../hooks/useAxios";
import { getBloomDomainList } from "./responseInterface";
import { toast } from "react-toastify"; 
import axiosInstance from "../../../../utils/api"; 

const ApiEndpoint = {
  master_soft_delete: "bloom_domain/update_bloom_domain_status",
  bloomDomain: {
    save_bloom_domain: "bloom_domain/save_bloom_domain",
    bloom_domain_list: "bloom_domain/bloom_domain_list",
    delete_bloom_domain: "bloom_domain/delete_bloom_domain/", 
  },
};

const BloomDomainPage: React.FC = () => {
  const [targetId, setTargetId] = useState<getBloomDomainList | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [targetStatus, setTargetStatus] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);

  const axiosPayload = useMemo(
    () => ({
      show_delete: 1,
      equal_or_not_equal: 0,
      no_batch: 1,
    }),
    []
  );

  const axiosOptions = useMemo(
    () => ({
      method: "post" as const,
      loader: true,
      payload: axiosPayload,
      shouldFetch: true,
    }),
    [axiosPayload]
  );

  const { responseData, addItem, refetch } =
    useAxios<any, getBloomDomainList[]>(
      ApiEndpoint.bloomDomain.bloom_domain_list,
      axiosOptions
    );

  const displayData = useMemo(
    () => (Array.isArray(responseData) ? responseData : []),
    [responseData]
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return displayData;

    const lowerSearch = searchTerm.toLowerCase();

    return displayData.filter(
      (item) =>
        item.bld_name?.toLowerCase().includes(lowerSearch) ||
        item.bld_acronym?.toLowerCase().includes(lowerSearch) ||
        item.bld_description?.toLowerCase().includes(lowerSearch)
    );
  }, [displayData, searchTerm]);

  const closeModalHandler = useCallback(() => {
    setIsModalOpen(false);
    setEditingData(null);
  }, []);

  const OpenModalHandler = useCallback(() => {
    if (displayData.length >= 3) {
      toast.error(
        "You can only add up to 3 Bloom's Domains.",
        { toastId: "bloom-limit-error" } 
      );
      return;
    }
    setIsModalOpen(true);
  }, [displayData]);

  const handleEdit = useCallback(
    (data: getBloomDomainList) => {
      const latest = displayData.find((item) => item.bld_id === data.bld_id) || data;
      setEditingData(latest);
      setIsModalOpen(true);
    },
    [displayData]
  );

  const handleStatusTrigger = useCallback(
    (item: getBloomDomainList, message: string, status: number) => {
      setConfirmMessage(message);
      setTargetId(item);
      setTargetStatus(status);
      setIsDeleteMode(false);
    },
    []
  );

  const handleDeleteTrigger = useCallback(
    (item: getBloomDomainList) => {
      setConfirmMessage(`Are you sure you want to permanently delete '${item.bld_name}'?`);
      setTargetId(item);
      setIsDeleteMode(true);
    },
    []
  );

  const confirmAction = useCallback(async () => {
    if (!targetId) return;

    if (isDeleteMode) {
      try {
        const response: any = await axiosInstance.delete(`${ApiEndpoint.bloomDomain.delete_bloom_domain}${targetId.bld_id}`);
        if (response.data?.status || response.status === 200 || response.status === 204) {
          toast.success(response.data?.message || "Bloom Domain deleted successfully.");
          await refetch();
        } else {
           toast.error(response.data?.message || "Failed to delete Bloom Domain.");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.response?.data?.detail || "Error deleting record.");
      }
    } else {
      if (targetStatus !== null) {
        const payload = {
          bld_id: targetId.bld_id,
          status: targetStatus,
        };
        const response = await addItem(payload, ApiEndpoint.master_soft_delete);
        if (response) {
          await refetch();
        }
      }
    }

    setTargetId(null);
    setTargetStatus(null);
    setIsDeleteMode(false);
  }, [addItem, targetId, targetStatus, isDeleteMode, refetch]);

  const handleFormSubmit = useCallback(
    async (formData: any) => {
      const payload: any = {
        bld_name: formData.bld_name,
        bld_acronym: formData.bld_acronym,
        bld_description: formData.bld_description || null,
      };

      if (editingData) {
        payload.bld_id = editingData.bld_id;
        payload.status = editingData.status;
      }

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(
          ([_, v]) => v !== undefined && v !== ""
        )
      );

      const response = await addItem(
        cleanPayload,
        ApiEndpoint.bloomDomain.save_bloom_domain
      );

      if (response) {
        await refetch();
        closeModalHandler();
      }
    },
    [addItem, editingData, closeModalHandler, refetch]
  );

  const columnDefs = useMemo(
    () => [
      ...SchemaColumnDefs.map((col) => ({
        ...col,
        flex: 1,
        minWidth: 100,
      })),
      {
        headerName: "Action",
        field: "action",
        cellRenderer: (params: any) => (
          <div className="flex space-x-3 justify-center items-center h-full">
            <GoPencil
              size={18}
              onClick={() => handleEdit(params.data)}
              className="cursor-pointer text-yellow-600 hover:text-yellow-700"
              title="Edit"
            />

            {/*Delete Icon */}
            <MdOutlineDoNotDisturbAlt
                className="cursor-pointer text-red-600 hover:text-red-800"
                size={18}
                title="Delete"
                onClick={() => handleDeleteTrigger(params.data)}
            />

            {/* Status Icons */}
            {params.data.status === 1 ? (
              <FaCheckCircle
                className="cursor-pointer text-green-600 hover:text-green-700"
                size={18}
                title="Active"
                onClick={() => handleStatusTrigger(params.data, "Deactivate this domain?", 0)}
              />
            ) : (
              <MdOutlineDoNotDisturbAlt
                className="cursor-pointer text-red-600 hover:text-red-700"
                size={18}
                title="Inactive"
                onClick={() => handleStatusTrigger(params.data, "Activate this domain?", 1)}
              />
            )}
          </div>
        ),
        width: 120,
        maxWidth: 130,
        cellStyle: { textAlign: "center" as const },
        filter: false,
        editable: false,
        sortable: false,
      },
    ],
    [handleEdit, handleStatusTrigger, handleDeleteTrigger]
  );

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll,
        .ag-body-vertical-scroll {
          display: none !important;
        }

        .ag-body-viewport {
          overflow-x: hidden !important;
          overflow-y: auto !important;
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        .ag-body-viewport::-webkit-scrollbar {
          display: none !important;
        }

        .ag-row:hover,
        .ag-row-selected {
          background-color: transparent !important;
        }
      `}</style>

      <div>
        <div className="flex justify-between items-end pb-5">
          <h3 className="text-lg leading-6 font-medium">
            Bloom's Domain Details
          </h3>

          <div className="flex flex-col items-end space-y-3">
            <button
              onClick={OpenModalHandler}
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

        {isModalOpen && (
          <ModalWithForm
            title="Bloom's Domain"
            isOpen={isModalOpen}
            onSubmit={handleFormSubmit}
            onClose={closeModalHandler}
            formFields={SchemaFields}
            schema={Schema}
            size="lg"
            columnLayout={1}
            initialValues={{
              ...editingData,
              bld_description: editingData?.bld_description ?? ""
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
          pageSize={filteredData.length || 3}
        />

        <ConfirmDialog
          isOpen={targetId !== null}
          onClose={() => {
             setTargetId(null);
             setIsDeleteMode(false);
          }}
          onConfirm={confirmAction}
          title="Confirm"
          message={confirmMessage}
        />
      </div>
    </>
  );
};

export default BloomDomainPage;