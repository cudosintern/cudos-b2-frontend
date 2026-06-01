import React, { useCallback, useState, useMemo } from "react";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { FaCheckCircle, FaTrashAlt } from "react-icons/fa";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../components/Table/DataTable";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import { Schema, SchemaColumnDefs, getSchemaFields } from "./deliveryMethodSchema";
import { useAxios, ApiResponse } from "../../../../hooks/useAxios";
import { DeliveryMethodResponse } from "./responseInterface";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import axiosInstance from "../../../../utils/api";
import { toast } from "react-toastify";

type BloomDomainOption = {
    label: string;
    value: number;
    learning?: string;
    actionVerbs?: string;
};

/**
 * DeliveryMethodPage Component
 * Recreated to strictly follow Program Outcome module architecture.
 * Implements strict Refetch-after-CRUD logic.
 */
const DeliveryMethodPage: React.FC = () => {
    // 1. State Management (Matching OutcomePage/PsoPage)
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        item: DeliveryMethodResponse | null;
        targetStatus: number | null; // null for delete, 0/1 for toggle
    }>({
        isOpen: false,
        title: "",
        message: "",
        item: null,
        targetStatus: null,
    });
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingData, setEditingData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedBloomLevels, setSelectedBloomLevels] = useState<any[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    // 2. Data Fetching (Matching OutcomePage)
    const {
        responseData,
        addItem,
        refetch,
        customApiCall
    } = useAxios<DeliveryMethodResponse[], DeliveryMethodResponse[]>(ApiEndpoint.cudos.delivery_method, {
        method: "get",
        shouldFetch: true,
    });

    const { responseData: bloomLevelResponse } = useAxios<any, any>(
        "/cudo_module/get_bloom_levels",
        {
            method: "get",
            shouldFetch: true,
        },
    );

    // 3. Computed Data (Matching OutcomePage)
    const displayData = useMemo(() => (Array.isArray(responseData) ? responseData : []), [responseData]);
    const bloomDomainOptions = useMemo<BloomDomainOption[]>(() => {
        const rawLevels = Array.isArray(bloomLevelResponse)
            ? bloomLevelResponse
            : Array.isArray(bloomLevelResponse?.data)
                ? bloomLevelResponse.data
                : [];

        return rawLevels
            .map((level: any): BloomDomainOption => ({
                label: level.level ?? level.bloom_level_name ?? "",
                value: Number(level.bloom_id ?? level.id),
                learning: level.learning || "",
                actionVerbs: level.bloom_actionverbs || "",
            }))
            .filter((domain: BloomDomainOption) =>
                domain.label && !Number.isNaN(domain.value)
            );
    }, [bloomLevelResponse]);
    const schemaFields = useMemo(() => getSchemaFields(bloomDomainOptions), [bloomDomainOptions]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return displayData;
        const lowerSearch = searchTerm.toLowerCase();
        return displayData.filter((item) => {
            const matchesName = item.delivery_mtd_name?.toLowerCase().includes(lowerSearch);
            const matchesDesc = item.delivery_mtd_desc?.toLowerCase().includes(lowerSearch);

            let bloomLevels: any[] = [];
            if (Array.isArray(item.bloom_levels)) {
                bloomLevels = item.bloom_levels;
            } else if (typeof (item.bloom_levels as any) === "string" && item.bloom_levels) {
                bloomLevels = (item.bloom_levels as any).split(",").map((s: string) => s.trim());
            }

            const matchesBloom = bloomLevels.some((id) => {
                const idToFind = typeof id === "object" ? id.bloom_id || id.level : id;
                const domain = bloomDomainOptions.find((option: BloomDomainOption) => String(option.value) === String(idToFind));
                return domain?.label?.toLowerCase().includes(lowerSearch);
            });

            return matchesName || matchesDesc || matchesBloom;
        });
    }, [displayData, searchTerm, bloomDomainOptions]);

    // 4. Handlers (Matching OutcomePage)
    const closeModalHandler = useCallback(() => {
        setIsModalOpen(false);
        setEditingData(null);
        setSelectedBloomLevels([]);
    }, []);

    const openModalHandler = useCallback(() => {
        setIsModalOpen(true);
        setSelectedBloomLevels([]);
    }, []);

    const handleEdit = useCallback((data: DeliveryMethodResponse) => {
        const freshData = responseData?.find((item) => item.delivery_mtd_id === data.delivery_mtd_id) || data;

        setEditingData(freshData);
        setIsModalOpen(true);

        if (Array.isArray(freshData.bloom_levels)) {
            setSelectedBloomLevels(freshData.bloom_levels.map((id: any) => typeof id === "object" ? id.bloom_id || id.level : id));
        } else if (typeof (freshData.bloom_levels as any) === "string" && freshData.bloom_levels) {
            setSelectedBloomLevels((freshData.bloom_levels as any).split(",").map((s: string) => s.trim()));
        }
    }, [responseData]);

    const handleValidDataChange = useCallback((dataStr: string) => {
        try {
            const data = JSON.parse(dataStr);
            if (data.bloom_levels) {
                setSelectedBloomLevels(data.bloom_levels);
            }
        } catch (e) {
            // Silently fail
        }
    }, []);

    const handleToggleTrigger = useCallback((id: number, currentStatus: number) => {
        const item = displayData.find(d => d.delivery_mtd_id === id);
        if (!item) return;
        const toActive = currentStatus !== 1;
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Status Change",
            message: toActive
                ? "Are you sure you want to activate this delivery method?"
                : "Are you sure you want to deactivate this delivery method?",
            item,
            targetStatus: toActive ? 1 : 0,
        });
    }, [displayData]);

    const handleDeleteTrigger = useCallback((item: DeliveryMethodResponse) => {
        const isActive = item.status === 1;

        if (isActive) {
            toast.error("This record is active. Please deactivate it before deleting.");
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: "Confirm Delete",
            message: `Are you sure that you want to delete this delivery method? Once deleted, data cannot be retrieved back.`,
            item: item,
            targetStatus: 2, // 2 for soft delete
        });
    }, []);

    const handleConfirmAction = useCallback(async () => {
        const { item, targetStatus } = confirmDialog;
        if (!item || targetStatus === null) return;

        try {
            const payload = {
                flag: "delivery_method",
                record_id: item.delivery_mtd_id,
                status: targetStatus,
            };

            const response = await axiosInstance.post<ApiResponse<any>>(
                ApiEndpoint.master_soft_delete,
                payload,
                { withCredentials: false }
            );

            if (response.data.status) {
                let successMsg = "Saved Successfully";
                if (targetStatus === 1) successMsg = "Activated Successfully";
                else if (targetStatus === 0) successMsg = "Deactivated Successfully";
                else if (targetStatus === 2) successMsg = "Deleted Successfully";
                toast.success(successMsg);
                await refetch();
                setRefreshKey(k => k + 1);
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Action failed");
        } finally {
            setConfirmDialog(prev => ({ ...prev, isOpen: false, item: null }));
        }
    }, [confirmDialog, refetch]);

    // 6. Form Submission (Strict Refetch)
    const handleFormSubmit = useCallback(async (formData: any) => {
        const payload = {
            delivery_mtd_name: formData.delivery_mtd_name,
            delivery_mtd_desc: formData.delivery_mtd_desc || "",
            bloom_levels: Array.isArray(formData.bloom_levels)
                ? formData.bloom_levels.map((id: string | number) => Number(id))
                : [],
        };

        let success = false;

        if (editingData) {
            const res = await customApiCall(
                `${ApiEndpoint.cudos.delivery_method.replace(/\/$/, '')}/${editingData.delivery_mtd_id}`,
                "put",
                payload,
                true,
                { returnFullResponse: true }
            );
            if (res && res.status) {
                success = true;
            }
        } else {
            const newItem = await addItem(payload, ApiEndpoint.cudos.delivery_method);
            if (newItem) {
                success = true;
            }
        }

        if (success) {
            await refetch();
            closeModalHandler();
        }
    }, [editingData, addItem, customApiCall, refetch, closeModalHandler]);

    // 7. Memoized Initial Values
    const initialValues = useMemo(() => {
        if (editingData) {
            return {
                delivery_mtd_name: editingData.delivery_mtd_name || "",
                delivery_mtd_desc: editingData.delivery_mtd_desc || "",
                bloom_levels: Array.isArray(editingData.bloom_levels)
                    ? editingData.bloom_levels.map((id: any) =>
                        typeof id === "object" ? id.bloom_id?.toString() : id?.toString()
                    )
                    : typeof (editingData.bloom_levels as any) === "string" && editingData.bloom_levels
                        ? (editingData.bloom_levels as any).split(",").map((s: string) => s.trim())
                        : [],
            };
        }
        return {
            delivery_mtd_name: "",
            delivery_mtd_desc: "",
            bloom_levels: [],
        };
    }, [editingData]);

    // 8. Column Definitions
    const columnDefs = useMemo(() => [
        ...SchemaColumnDefs,
        {
            headerName: "Bloom Level",
            field: "bloom_levels",
            valueGetter: (params: any) => {
                const selectedDomains = params.data?.bloom_levels;

                if (Array.isArray(selectedDomains)) {
                    return selectedDomains
                        .map((id: any) => {
                            const idToFind = typeof id === "object" ? id.bloom_id || id.level : id;
                            return bloomDomainOptions.find((option: BloomDomainOption) => String(option.value) === String(idToFind))?.label || idToFind;
                        })
                        .join(", ");
                }

                if (typeof selectedDomains === "string" && selectedDomains) {
                    return selectedDomains
                        .split(",")
                        .map((id: string) => {
                            const trimmedId = id.trim();
                            return bloomDomainOptions.find((option: BloomDomainOption) => String(option.value) === String(trimmedId))?.label || trimmedId;
                        })
                        .join(", ");
                }

                return selectedDomains || "-";
            },
            sortable: true,
            filter: true,
            editable: false,
            flex: 1,
            minWidth: 180,
            wrapText: true,
            autoHeight: true,
            cellStyle: {
                lineHeight: "1.5",
                paddingTop: "10px",
                paddingBottom: "10px",
                whiteSpace: "normal",
                wordBreak: "break-word",
            },
        },
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
                    <FaTrashAlt
                        className="cursor-pointer text-red-600 hover:text-red-800"
                        size={18}
                        title={params.data.status === 1 ? "Deactivate before deleting" : "Delete"}
                        onClick={() => handleDeleteTrigger(params.data)}
                    />
                    {params.data.status === 1 ? (
                        <FaCheckCircle
                            size={18}
                            className="cursor-pointer text-green-600 hover:text-green-800"
                            title="Active - Click to Deactivate"
                            onClick={() => handleToggleTrigger(params.data.delivery_mtd_id, params.data.status)}
                        />
                    ) : (
                        <MdOutlineDoNotDisturbAlt
                            size={18}
                            className="cursor-pointer text-red-500 hover:text-red-700"
                            title="Inactive - Click to Activate"
                            onClick={() => handleToggleTrigger(params.data.delivery_mtd_id, params.data.status)}
                        />
                    )}
                </div>
            ),
            width: 100,
            maxWidth: 100,
            cellStyle: { textAlign: "center" as const },
            filter: false,
            editable: false,
            sortable: false,
        }
    ], [handleEdit, handleDeleteTrigger, handleToggleTrigger, bloomDomainOptions]);

    return (
        <>
            <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
      `}</style>
            <div className="">
                <div className="flex justify-between items-start pb-5">
                    <h3 className="text-lg leading-6 font-medium pt-1">Delivery Method</h3>
                    <div className="flex flex-col items-end gap-3">
                        <UIButton
                            onClick={openModalHandler}
                            size="sm"
                        >
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

                {isModalOpen && (
                    <ModalWithForm
                        title="Delivery Method"
                        isOpen={isModalOpen}
                        onSubmit={handleFormSubmit}
                        onClose={closeModalHandler}
                        formFields={schemaFields}
                        schema={Schema}
                        size="xl"
                        columnLayout={1}
                        onValidDataChange={handleValidDataChange}
                        initialValues={initialValues}
                        resetbuttonName="Reset"
                    >
                        {selectedBloomLevels.length > 0 && (
                            <div className="mt-6 border-t pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Bloom's Level Descriptions:</h4>
                                <div className="space-y-2">
                                    {selectedBloomLevels.map((id: string | number) => {
                                        const domain = bloomDomainOptions.find(d => String(d.value) === String(id));
                                        if (!domain) return null;
                                        return (
                                            <div key={id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-4 border-blue-500">
                                                <span className="font-bold text-blue-700">{domain.label}</span>
                                                <span className="mx-1 font-medium">-</span>
                                                <span className="font-medium text-gray-800">{domain.learning}</span>
                                                {domain.actionVerbs && (
                                                    <>
                                                        <span className="mx-1">-</span>
                                                        <span className="italic">{domain.actionVerbs}</span>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </ModalWithForm>
                )}

                <DataTable
                    key={refreshKey}
                    columnDefs={columnDefs}
                    rowData={filteredData}
                    showAddButton={false}
                    showExportButton={false}
                    headerFilter={false}
                    pageSize={10}
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

export default DeliveryMethodPage;
