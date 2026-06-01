import React, { useCallback, useState, useMemo } from "react";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { FaCheckCircle, FaTrashAlt } from "react-icons/fa";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../components/Table/DataTable";
import { ProgramModeSchema, ProgramModeSchemaFields } from "./programModeSchema";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { useAxios, ApiResponse } from "../../../../hooks/useAxios";
import { ProgramMode, ProgramModePayload } from "./programModeApi";
import axiosInstance from "../../../../utils/api";
import { toast } from "react-toastify";
import UIButton from "../../../../components/FormBuilder/fields/Button";

/**
 * Program Mode Page Component
 * Manages CRUD operations for Program Modes with status toggle and soft delete
 */
const ProgramModePage = () => {
    // State management
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        item: ProgramMode | null;
        targetStatus: number | null; // null for delete, 0/1 for toggle
    }>({
        isOpen: false,
        title: "",
        message: "",
        item: null,
        targetStatus: null,
    });

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingData, setEditingData] = useState<Record<string, any> | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchText, setSearchText] = useState<string>("");

    // API connectivity
    const { responseData, addItem, addStateItem, editStateItem, deleteStateItem, refetch } = useAxios<ProgramModePayload, ProgramMode[]>(ApiEndpoint.program_mode.list, {
        method: "get",
        shouldFetch: true,
        withCredentials: false,
    });

    // Computed data
    const displayData = useMemo(() => (Array.isArray(responseData) ? responseData : []), [responseData]);

    const filteredData = useMemo(() => {
        if (!searchText) return displayData;
        const lowerSearch = searchText.toLowerCase();
        return displayData.filter((item) =>
            item.prg_mode_name?.toLowerCase().includes(lowerSearch) ||
            item.prg_mode_desc?.toLowerCase().includes(lowerSearch)
        );
    }, [displayData, searchText]);

    // Handlers
    const closeModalHandler = useCallback(() => {
        setIsModalOpen(false);
        setEditingData(null);
        setEditingId(null);
    }, []);

    const OpenModalHandler = useCallback(() => {
        setIsModalOpen(true);
        setEditingData(null);
        setEditingId(null);
    }, []);

    const handleEdit = useCallback((data: ProgramMode) => {
        setEditingData({
            program_mode_name: data.prg_mode_name,
            program_mode_description: data.prg_mode_desc,
        });
        setEditingId(data.prg_mode_id);
        setIsModalOpen(true);
    }, []);

    const handleToggleTrigger = useCallback((item: ProgramMode, message: string, status: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Status Change",
            message: message,
            item: item,
            targetStatus: status,
        });
    }, []);

    const handleDeleteTrigger = useCallback((item: ProgramMode) => {
        // Support both status formats: status === 1/ACTIVE or is_active === true
        const isActive = item.status === 1 || (item as any).status === 'ACTIVE' || (item as any).is_active === true;

        if (isActive) {
            toast.error("This record is active. Please deactivate it before deleting.");
            return;
        }
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Delete",
            message: "Are you sure you want to delete it?",
            item: item,
            targetStatus: 2, // 2 for soft delete
        });
    }, []);

    const handleConfirmAction = useCallback(async () => {
        const { item, targetStatus } = confirmDialog;
        if (!item || targetStatus === null) return;

        try {
            const payload = {
                flag: "program_mode",
                record_id: item.prg_mode_id,
                status: targetStatus,
            };

            const response = await axiosInstance.post<ApiResponse<any>>(ApiEndpoint.master_soft_delete, payload, { withCredentials: false });

            if (response.data.status) {
                let successMsg = response.data.message === "Completed" ? "Saved Successfully" : response.data.message;

                if (response.data.message === "Completed") {
                    if (targetStatus === 1) successMsg = "Activated Successfully";
                    else if (targetStatus === 0) successMsg = "Deactivated Successfully";
                    else if (targetStatus === 2) successMsg = "Deleted Successfully";
                }

                toast.success(successMsg);
                if (targetStatus === 2) {
                    deleteStateItem('prg_mode_id', item.prg_mode_id);
                } else {
                    // Update the status in local state
                    editStateItem('prg_mode_id', item.prg_mode_id, { ...item, status: targetStatus } as any);
                }
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Action failed");
        } finally {
            setConfirmDialog(prev => ({ ...prev, isOpen: false, item: null }));
        }
    }, [confirmDialog, deleteStateItem, editStateItem]);

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
                cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center" },
            },
            {
                headerName: "Program Mode",
                field: "prg_mode_name",
                sortable: true,
                filter: true,
                flex: 1,
                minWidth: 200,
                cellStyle: { borderRight: "1px solid #e2e8f0", display: "flex", alignItems: "center" },
            },
            {
                headerName: "Description",
                field: "prg_mode_desc",
                sortable: true,
                filter: true,
                flex: 2,
                minWidth: 300,
                cellStyle: { borderRight: "1px solid #e2e8f0", whiteSpace: "normal", lineHeight: "1.4", display: "flex", alignItems: "center" },
                autoHeight: true,
            },
            {
                headerName: "Action",
                cellRenderer: (params: any) => {
                    if (!params || !params.data) return null;
                    return (
                        <div className="flex space-x-2 justify-center items-center h-full w-full">
                            <GoPencil
                                size={18}
                                onClick={() => handleEdit(params.data)}
                                className="cursor-pointer text-yellow-600"
                                title="Edit"
                            />
                            <FaTrashAlt
                                className="size-[18px] text-red-600 cursor-pointer"
                                title={
                                    (params.data.status === 1 || params.data.status === 'ACTIVE' || params.data.is_active === true)
                                        ? "Deactivate before deleting"
                                        : "Delete"
                                }
                                onClick={() => handleDeleteTrigger(params.data)}
                            />
                            {params.data.status === 1 ? (
                                <FaCheckCircle
                                    className="cursor-pointer text-green-600"
                                    size={18}
                                    title="Active"
                                    onClick={() => handleToggleTrigger(params.data, "Deactivate this Program Mode?", 0)}
                                />
                            ) : (
                                <MdOutlineDoNotDisturbAlt
                                    className="cursor-pointer text-red-500 hover:text-red-700"
                                    size={18}
                                    title="Inactive"
                                    onClick={() => handleToggleTrigger(params.data, "Activate this Program Mode?", 1)}
                                />
                            )}
                        </div>
                    );
                },
                width: 120,
                maxWidth: 130,
                cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", padding: "0" },
                filter: false,
                editable: false,
                sortable: false,
            },
        ];
    }, [handleEdit, handleDeleteTrigger, handleToggleTrigger]);

    const handleFormSubmit = useCallback(
        async (data: any) => {
            const payload = {
                program_mode_name: data.program_mode_name,
                description: data.program_mode_description,
            };

            if (editingId) {
                try {
                    const response = await axiosInstance.put<ApiResponse<any>>(`${ApiEndpoint.program_mode.update.replace(/\/$/, '')}/${editingId}`, payload, { withCredentials: false });
                    if (response.data.status) {
                        toast.success(response.data.message === "Completed" ? "Saved Successfully" : response.data.message);
                        editStateItem('prg_mode_id', editingId, { ...payload, prg_mode_id: editingId, prg_mode_name: payload.program_mode_name, prg_mode_desc: payload.description } as any);
                    } else {
                        toast.error(response.data.message);
                    }
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to update item");
                }
            } else {
                try {
                    const response = await axiosInstance.post<ApiResponse<any>>(ApiEndpoint.program_mode.create, payload, { withCredentials: false });
                    if (response.data.status) {
                        toast.success(response.data.message === "Completed" ? "Saved Successfully" : response.data.message);
                        if (typeof response.data.data === 'object') {
                            addStateItem(response.data.data);
                        } else {
                            refetch(); // Fallback
                        }
                    } else {
                        toast.error(response.data.message);
                    }
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to add item");
                }
            }
            closeModalHandler();
        },
        [editingId, addStateItem, editStateItem, refetch, closeModalHandler],
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
                <div className="flex justify-between items-center pb-5">
                    <h3 className="text-lg leading-6 font-medium">Program Mode List</h3>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={onSearchChange}
                            className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <UIButton onClick={OpenModalHandler} size="sm">
                            Add
                        </UIButton>
                    </div>
                </div>

                {isModalOpen && (
                    <ModalWithForm
                        title="Program Mode"
                        isOpen={isModalOpen}
                        onSubmit={handleFormSubmit}
                        onClose={closeModalHandler}
                        formFields={ProgramModeSchemaFields}
                        schema={ProgramModeSchema}
                        size="lg"
                        columnLayout={1}
                        initialValues={editingData || {}}
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
                    pageSize={filteredData.length || 20}
                />

                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={handleConfirmAction}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                />
            </div>
        </>
    );
};
export default ProgramModePage;
