import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import { toast } from "react-toastify";
import axiosInstance from "../../../../utils/api";

import DataTable from "../../../../components/Table/DataTable";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { BosMember } from "./responseInterface";
import { getAllCurriculum } from "../../curriculum/curriculum/curriculumSchema";

// --- INLINED API FUNCTIONS (Replicating bosApi to ensure stability) ---
const getAllBos = async () => {
    return axiosInstance.get(ApiEndpoint.cudos.board_of_studies + "list", { withCredentials: false });
};

const deleteBosMember = async (id: number) => {
    return axiosInstance.delete(`${ApiEndpoint.cudos.board_of_studies}${id}`, { withCredentials: false });
};

const Bos: React.FC = () => {
    const navigate = useNavigate();

    // --- STATE ---
    const [members, setMembers] = useState<BosMember[]>([]);
    const [deleteMember, setDeleteMember] = useState<BosMember | null>(null);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [searchText, setSearchText] = useState<string>("");
    const [pageSize, setPageSize] = useState<number>(20);

    // --- DATA LOADING (Manually controlled for reliability) ---
    const loadData = async () => {
        try {
            const res = await getAllBos();
            // Ensure we handle response wrappers correctly (wrapper.data or wrapper.data.data)
            const data = Array.isArray(res.data)
                ? res.data
                : (res.data as any)?.data
                    ? (res.data as any).data
                    : [];

            if (Array.isArray(data)) {
                setMembers(data);
            } else {
                setMembers([]);
            }
        } catch (error) {
            console.error("Failed to load BOS members:", error);
            // Optionally set empty state on error to prevent spinning/stale data
            setMembers([]);
        }
    };

    // Load on mount
    useEffect(() => {
        loadData();
    }, []);

    // --- FILTERING (Frontend side per 'Old Code' logic) ---
    const filteredData = useMemo(() => {
        // Filter out inactive/deleted members (status 0)
        const activeMembers = members.filter(item => item.status === 1 || item.status === undefined);
        
        if (!searchText) return activeMembers;
        
        const lowerSearch = searchText.toLowerCase();
        return activeMembers.filter((item) =>
            item.first_name?.toLowerCase().includes(lowerSearch) ||
            item.email?.toLowerCase().includes(lowerSearch) ||
            item.designation?.toLowerCase().includes(lowerSearch) ||
            (item.bos_for && item.bos_for.toLowerCase().includes(lowerSearch))
        );
    }, [members, searchText]);


    // --- ACTIONS ---
    const handleEdit = useCallback((id: number) => {
        navigate(`edit/${id}`);
    }, [navigate]);

    const handleDeleteClick = useCallback(async (member: BosMember) => {
        try {
            const res = await getAllCurriculum();
            const curriculums = Array.isArray(res.data) ? res.data : ((res.data as any).data || []);
            const isAssigned = curriculums.some((c: any) => c.academic_batch_owner === member.user_id);
            if (isAssigned) {
                toast.warning(`You cannot delete the User, as the User is assigned as a Curriculum Approval Authority.`);
                return;
            }
        } catch (e) {
            console.error("Failed to fetch curriculum to check dependencies", e);
        }

        setConfirmMessage(`Are you sure you want to delete ${member.first_name} ${member.last_name}?`);
        setDeleteMember(member);
    }, []);

    const confirmDelete = async () => {
        if (deleteMember) {
            try {
                await deleteBosMember(deleteMember.bos_id);
                // Refresh immediately after delete
                await loadData();
                setDeleteMember(null);
                toast.success("BoS member deleted successfully");
            } catch (error: any) {
                console.error("Failed to delete member", error);
                const errorMsg = error.response?.data?.detail || error.response?.data?.message || "Failed to delete member";
                toast.error(errorMsg);
            }
        }
    };

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    // --- COLUMNS (Preserved from New Code) ---
    const columnDefs = useMemo(() => [
        {
            headerName: "Faculty Type",
            field: "faculty_type",
            sortable: true,
            filter: true,
            flex: 1,
        },
        {
            headerName: "First Name",
            field: "first_name",
            sortable: true,
            filter: true,
            flex: 1,
        },
        {
            headerName: "Middle Name",
            field: "middle_name",
            sortable: true,
            filter: true,
            flex: 1,
        },
        {
            headerName: "Last Name",
            field: "last_name",
            sortable: true,
            filter: true,
            flex: 1,
        },
        {
            headerName: "Designation",
            field: "designation",
            sortable: true,
            filter: true,
            flex: 1,
        },
        {
            headerName: "School",
            field: "school",
            valueGetter: (params: any) => params.data.bos_for || params.data.organization,
            sortable: true,
            filter: true,
            flex: 1,
        },
        {
            headerName: "Email",
            field: "email",
            sortable: true,
            filter: true,
            flex: 1.5,
        },
        {
            headerName: "Action",
            field: "action",
            cellRenderer: (params: any) => {
                if (!params.data) return null;
                return (
                    <div className="flex space-x-3 justify-left items-center h-full">
                        <GoPencil
                            size={20}
                            onClick={() => handleEdit(params.data.bos_id)}
                            className="cursor-pointer text-yellow-600"
                            title="Edit"
                        />
                        <FaTimes
                            className="cursor-pointer text-red-600"
                            size={18}
                            title="Delete"
                            onClick={() => handleDeleteClick(params.data)}
                        />
                    </div>
                );
            },
            width: 100,
            cellStyle: { textAlign: "left" },
            sortable: false,
            filter: false,
            flex: 0,
        },
    ], [handleEdit, handleDeleteClick]);

    return (
        <div className="">
            {/* Header / Actions */}
            <h3 className="text-lg leading-6 font-medium pb-5">Board Of Studies(BoS) Member List</h3>
            
            <div className="flex justify-between items-end mb-4">
                {/* Show entries on the left */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Show</span>
                    <select 
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#437880]"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span>entries</span>
                </div>

                <div className="flex flex-col items-end space-y-4">
                    <div className="flex space-x-2">
                        <UIButton
                            variant="primary"
                            size="sm"
                            onClick={() => navigate("add-existing")}
                        >
                            Add Existing User
                        </UIButton>
                        <UIButton
                            variant="primary"
                            size="sm"
                            onClick={() => navigate("add-new")}
                        >
                            Add New Member
                        </UIButton>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Search:</span>
                        <input
                            type="text"
                            value={searchText}
                            onChange={onSearchChange}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#437880] focus:border-[#437880] w-64"
                            placeholder="Search members..."
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columnDefs={columnDefs}
                rowData={filteredData}
                showAddButton={false}
                showExportButton={false}
                headerFilter={true}
                pageSize={pageSize}
                showSearch={false}
                showEntries={false}
            />

            <ConfirmDialog
                isOpen={deleteMember !== null}
                title="Confirm"
                message={confirmMessage}
                onClose={() => setDeleteMember(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default Bos;
