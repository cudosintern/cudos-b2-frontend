import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSync, FaEye, FaTimes } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import { toast } from "react-toastify";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../components/Table/DataTable";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import { 
    getAccreditationTypes, 
    deleteAccreditationType,
    getPoTypes 
} from "./genericPOSchema";
import { AccreditationType, PoType } from "./genericPOResponseInterface";
import { useMemo, useCallback } from "react";

const GenericPOPage: React.FC = () => {
    const navigate = useNavigate();
    
    // --- State ---
    const [types, setTypes] = useState<AccreditationType[]>([]);
    const [poTypes, setPoTypes] = useState<PoType[]>([]);
    const [selectedType, setSelectedType] = useState<AccreditationType | null>(null);
    
    const [typeSearch, setTypeSearch] = useState("");
    const [pageSize, setPageSize] = useState(20);
    
    // Derived POs from selectedType for View Modal
    const currentPos = useMemo(() => {
        return (selectedType?.pos || []).slice().sort((a, b) => 
            a.po_code.localeCompare(b.po_code, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [selectedType]);

    // Modal State
    const [showPoModal, setShowPoModal] = useState(false);

    // --- Effects ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [typesRes, poTypesRes] = await Promise.all([
                getAccreditationTypes(),
                getPoTypes()
            ]);
            
            if (typesRes.status) {
                setTypes(typesRes.data || []);
            }
            if (poTypesRes.status) {
                setPoTypes(poTypesRes.data || []);
            }
        } catch (error) {
            console.error("Failed to load data", error);
        }
    };

    // --- Actions ---
    const handleAddType = () => {
        navigate("create");
    };
 
    const handleEditType = useCallback((type: AccreditationType) => {
        navigate(`edit/${type.atype_id}`);
    }, [navigate]);
 
    const [deleteId, setDeleteId] = useState<number | null>(null);
 
    const handleDeleteType = useCallback((id: number) => {
        setDeleteId(id);
    }, []);
 
    const confirmDelete = async () => {
        if (deleteId) {
            try {
                await deleteAccreditationType(deleteId);
                toast.success("Accreditation Type deleted successfully");
                setDeleteId(null);
                loadData();
            } catch (error: any) {
                toast.error("Failed to delete: " + (error.response?.data?.detail || error.message));
            }
        }
    };
 
    const handleViewPos = useCallback((type: AccreditationType) => {
        setSelectedType(type);
        setShowPoModal(true);
    }, []);
 
    const closePoModal = () => {
        setShowPoModal(false);
        setSelectedType(null);
    };

    // --- Data Filtering ---
    const filteredTypes = useMemo(() => {
        if (!typeSearch) return types;
        const lower = typeSearch.toLowerCase();
        return types.filter(t => 
            t.atype_name.toLowerCase().includes(lower) || 
            t.atype_description.toLowerCase().includes(lower)
        );
    }, [types, typeSearch]);

    const columnDefs = useMemo(() => [
        {
            headerName: "Accreditation Type",
            field: "atype_name",
            sortable: true,
            filter: true,
            flex: 1,
            minWidth: 150,
        },
        {
            headerName: "Description",
            field: "atype_description",
            sortable: true,
            filter: true,
            flex: 2,
            minWidth: 200,
        },
        {
            headerName: "List of POs",
            field: "list_of_pos",
            cellRenderer: (params: any) => (
                <span 
                    className="text-blue-600 cursor-pointer hover:text-blue-800 font-medium flex items-center h-full underline" 
                    onClick={() => handleViewPos(params.data)}
                >
                    View POs
                </span>
            ),
            flex: 1,
            minWidth: 120,
        },
        {
            headerName: "Action",
            field: "action",
            cellRenderer: (params: any) => (
                <div className="flex space-x-3 justify-left items-center h-full">
                    <GoPencil
                        size={20}
                        onClick={() => handleEditType(params.data)}
                        className="cursor-pointer text-yellow-600"
                        title="Edit"
                    />
                    <FaTimes
                        className="cursor-pointer text-red-600"
                        size={18}
                        title="Delete"
                        onClick={() => handleDeleteType(params.data.atype_id)}
                    />
                </div>
            ),
            width: 100,
            sortable: false,
            filter: false,
            flex: 0,
        }
    ], [handleViewPos, handleEditType, handleDeleteType]);

    // --- Renders ---
    
    // --- Render Modal ---
    const renderPoModal = () => {
        if (!showPoModal || !selectedType) return null;

        // Get PO Type Name helper
        const getPoTypeName = (id: number | null) => {
             if (!id) return "";
             const found = poTypes.find(t => t.po_type_id === id);
             return found ? found.po_type_name : "";
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-y-auto p-6">
                     <div className="flex justify-between items-center mb-4 border-b pb-2">
                         <h3 className="text-xl font-bold text-gray-800">Generic Program Outcomes (POs) List</h3>
                         <button onClick={closePoModal} className="text-gray-500 hover:text-gray-700">
                            <FaTimes size={20} />
                         </button>
                    </div>
                    
                    <div className="mb-4">
                         <div className="mb-4 text-sm text-gray-700">
                              <strong>Accreditation Type: </strong> {selectedType.atype_name}
                         </div>

                        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PO Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PO Reference</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PO Statement</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PO Type</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPos.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No POs found</td></tr>
                                    ) : (
                                        currentPos.map((po, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.po_code}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.po_reference}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{po.po_statement}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPoTypeName(po.po_type_id ?? null)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button 
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            onClick={closePoModal}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Main Render ---
    return (
        <div className="">
            {showPoModal && renderPoModal()}
            <ConfirmDialog 
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this Accreditation Type and its associated POs?"
            />
            
            <h3 className="text-lg font-medium pb-5">List of Accreditation Types & Generic Program Outcomes (POs)</h3>

            <div className="flex justify-between items-end mb-4">
                {/* Left side: Show entries */}
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

                {/* Right side: Add button and Search */}
                <div className="flex flex-col items-end space-y-4">
                    <UIButton
                        variant="primary"
                        size="sm"
                        onClick={handleAddType}
                    >
                        Add
                    </UIButton>
                    
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Search:</span>
                        <input
                            type="text"
                            value={typeSearch}
                            onChange={(e) => setTypeSearch(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#437880] focus:border-[#437880] w-64"
                            placeholder="Search records..."
                        />
                    </div>
                </div>
            </div>

            <DataTable
                columnDefs={columnDefs}
                rowData={filteredTypes}
                showAddButton={false}
                showExportButton={false}
                headerFilter={true}
                pageSize={pageSize}
                showSearch={false}
                showEntries={false}
            />
        </div>
    );
};

export default GenericPOPage;
