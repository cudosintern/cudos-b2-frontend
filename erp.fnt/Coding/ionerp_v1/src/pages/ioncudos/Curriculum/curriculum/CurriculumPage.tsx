import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./Curriculum.css";
// Icons
import { FaSearch, FaCheck, FaCheckCircle, FaTimes, FaDownload, FaArrowLeft, FaArrowRight, FaTrash } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Components
import { 
  getAllCurriculum, 
  toggleCurriculumStatus,
} from "./curriculumSchema";
import { Curriculum } from "./curriculumResponseInterface";
import DataTable from "../../../../components/Table/DataTable";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";

// Interfaces for local state
interface ConfirmationModal {
  isOpen: boolean;
  type: "rollback" | "disable" | "enable" | "competency_disable" | "course_mapping_toggle" | "student_reg_toggle" | "mandatory_toggle" | "import_data";
  id?: number;
  data?: any; 
}

const CurriculumPage: React.FC = () => {
    const navigate = useNavigate();

    // --- State ---
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState<Curriculum[]>([]);
    
    // Pagination & Search
    const [pageSize, setPageSize] = useState(20);
    const [searchTerm, setSearchTerm] = useState("");

    // Modals
    const [modal, setModal] = useState<ConfirmationModal>({ isOpen: false, type: "disable" });

    // Import Data State
    const [importMode, setImportMode] = useState<"entities" | "entire">("entities");
    const [importCurriculum, setImportCurriculum] = useState<number | "">("");
    const [importCb, setImportCb] = useState({
        peo: true,
        peo_me: false,
        po: true,
        po_peo: false
    });

    // --- Effects ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getAllCurriculum();
            const data = Array.isArray(res) ? res : (res.data || []);
            setList(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load list data");
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---
    const handleAddClick = () => {
        navigate("create");
    };

    const handleEditClick = (id: number) => {
        navigate(`edit/${id}`);
    };

    const openConfirmModal = (type: ConfirmationModal['type'], id: number, data?: any) => {
        setModal({ isOpen: true, type, id, data });
    };

    const handleModalConfirm = async () => {
        if (!modal.id) return;
        try {
            if (modal.type === "disable" || modal.type === "enable") {
                const res = await toggleCurriculumStatus(modal.id);
                if (res.status !== false) {
                    toast.success(`Curriculum ${modal.type}d successfully`);
                    loadData();
                } else {
                    toast.error(`Failed to ${modal.type} curriculum`);
                }
            } else if (modal.type === "competency_disable") {
                setList(prev => prev.map(item => 
                    item.crclm_id === modal.id ? { ...item, competency_pi_status: "Optional Faded" } : item
                ));
                toast.success("Competencies and PIs made optional");
            } else if (modal.type === "course_mapping_toggle") {
                setList(prev => prev.map(item => 
                    item.crclm_id === modal.id ? { ...item, course_mapping_status: modal.data } : item
                ));
                toast.success(`Course mapping set to ${modal.data}`);
            } else if (modal.type === "student_reg_toggle") {
                setList(prev => prev.map(item => 
                    item.crclm_id === modal.id ? { ...item, student_registration_status: modal.data } : item
                ));
                toast.success(`Student registration set to ${modal.data}`);
            } else if (modal.type === "import_data") {
                toast.success("Data imported successfully from previous curriculum");
                loadData();
            } else if (modal.type === "rollback") {
                toast.success("Curriculum rolled back successfully. Data has been wiped.");
                loadData();
            }
            setModal({ isOpen: false, type: "disable" });
        } catch (e: any) { 
            console.error(e); 
            toast.error(e?.message || "An unexpected error occurred");
        }
    };

    const renderStatusBadge = useCallback((status: string, onClick?: () => void) => {
        let colorClass = "bg-[#f8cc59] text-white";
        let isFaded = false;
        
        if (status === "Mandatory") colorClass = "bg-[#5cb85c]";
        else if (status === "Optional") colorClass = "bg-[#f0ad4e]";
        else if (status === "Optional Faded") {
            colorClass = "bg-[#f0ad4e] opacity-60";
            isFaded = true;
        }

        return (
            <div className="flex justify-center h-full items-center">
                <span 
                    className={`px-3 py-1.5 text-white font-medium text-[10px] text-center inline-block w-24 align-middle shadow-sm transition-all duration-150 cursor-pointer ${colorClass} ${isFaded ? "cursor-default" : "hover:brightness-95 active:scale-95"}`}
                    style={{ borderRadius: '12px' }}
                    onClick={() => !isFaded && onClick && onClick()}
                >
                    {isFaded ? "Optional" : status}
                </span>
            </div>
        );
    }, []);

    const filteredList = useMemo(() => {
        if (!searchTerm) return list;
        const lower = searchTerm.toLowerCase();
        return list.filter(item => 
            (item.crclm_name || "").toLowerCase().includes(lower) ||
            (item.program_name || "").toLowerCase().includes(lower) ||
            (item.dept_name || "").toLowerCase().includes(lower)
        );
    }, [list, searchTerm]);

    const columnDefs = [
        {
            headerName: "Curriculum",
            field: "crclm_name",
            flex: 1.5,
            cellClass: "text-blue-600 font-medium"
        },
        {
            headerName: "Dept.",
            field: "dept_name",
            flex: 1
        },
        {
            headerName: "From",
            field: "start_year",
            width: 80
        },
        {
            headerName: "To",
            field: "end_year",
            width: 80
        },
        {
            headerName: "Program Owner",
            field: "program_owner_name",
            flex: 1.2
        },
        {
            headerName: "PEO / PO Creation",
            field: "peo_po_creation_status",
            flex: 1.2,
            cellRenderer: (params: any) => (
                <div className="flex justify-center h-full items-center">
                    <span 
                        className={`px-2 py-1.5 text-white font-medium text-[10px] text-center inline-block w-24 align-middle shadow-sm ${params.value === "Pending" ? "bg-[#f8cc59]" : "bg-[#5cb85c] opacity-60"}`}
                        style={{ borderRadius: '12px' }}
                    >
                        {params.value === "Pending" ? "Pending" : "Initiated"}
                    </span>
                </div>
            )
        },
        {
            headerName: "Import",
            flex: 1.2,
            cellRenderer: (params: any) => (
                <div className="flex justify-center h-full items-center text-[12px]">
                    {params.data.peo_po_creation_status === "Pending" ? (
                        <span 
                            className="text-blue-600 cursor-pointer hover:underline font-medium"
                            onClick={() => openConfirmModal("import_data", params.data.crclm_id)}
                        >
                            <FaDownload className="inline mr-1" /> Import Data
                        </span>
                    ) : (
                        <span 
                            className="text-red-500 cursor-pointer hover:underline font-medium" 
                            onClick={() => openConfirmModal("rollback", params.data.crclm_id)}
                        >
                            Roll-back
                        </span>
                    )}
                </div>
            )
        },
        {
            headerName: "Edit",
            width: 70,
            cellRenderer: (params: any) => (
                <div className="flex justify-center h-full items-center">
                    <GoPencil
                        size={18}
                        className="cursor-pointer text-yellow-600 hover:scale-110 transition-transform"
                        onClick={() => handleEditClick(params.data.crclm_id)}
                    />
                </div>
            )
        },
        {
            headerName: "Status",
            width: 80,
            cellRenderer: (params: any) => (
                <div className="flex justify-center h-full items-center">
                    <button
                        title={params.data.status ? "Disable Curriculum" : "Enable Curriculum"}
                        onClick={() => openConfirmModal(params.data.status ? "disable" : "enable", params.data.crclm_id)}
                        className={`transition-colors duration-150 ${params.data.status ? "text-green-600 hover:text-green-800" : "text-red-600 hover:text-red-800"}`}
                    >
                        {params.data.status ? <FaCheckCircle size={18} /> : <MdOutlineDoNotDisturbAlt size={18} />}
                    </button>
                </div>
            )
        },
        {
            headerName: "Competency & PI",
            flex: 1.2,
            cellRenderer: (params: any) => renderStatusBadge(params.data.competency_pi_status || "Mandatory", () => {
                if ((params.data.competency_pi_status || "Mandatory") === "Mandatory") openConfirmModal("competency_disable", params.data.crclm_id);
            })
        },
        {
            headerName: "Course Mapping",
            flex: 1.2,
            cellRenderer: (params: any) => renderStatusBadge(params.data.course_mapping_status || "Optional", () => {
                const current = params.data.course_mapping_status || "Optional";
                openConfirmModal("course_mapping_toggle", params.data.crclm_id, current === "Mandatory" ? "Optional" : "Mandatory");
            })
        },
        {
            headerName: "Student Reg.",
            flex: 1.2,
            cellRenderer: (params: any) => renderStatusBadge(params.data.student_registration_status || "Mandatory", () => {
                const current = params.data.student_registration_status || "Mandatory";
                openConfirmModal("student_reg_toggle", params.data.crclm_id, current === "Mandatory" ? "Optional" : "Mandatory");
            })
        }
    ];

    return (
        <div className="">
            <h3 className="text-lg font-medium pb-5">Curriculum (Regulations) List</h3>

            <div className="">
                <div className="flex justify-between items-end mb-4">
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
                        </select>
                        <span>entries</span>
                    </div>

                    <div className="flex flex-col items-end space-y-4">
                        <UIButton
                            variant="primary"
                            size="sm"
                            onClick={handleAddClick}
                        >
                            Add
                        </UIButton>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Search:</span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#437880] focus:border-[#437880] w-64"
                                placeholder="Search records..."
                            />
                        </div>
                    </div>
                </div>

                <DataTable
                    columnDefs={columnDefs}
                    rowData={filteredList}
                    pageSize={pageSize}
                    autoHeight={true}
                    showSearch={false}
                    showEntries={false}
                />
            </div>

            {/* Confirmation Modals (Styled standardly) */}
            {modal.isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-semibold text-[#437880]">
                                {modal.type.replace(/_/g, ' ').toUpperCase()}
                            </h3>
                            <button onClick={() => setModal({ ...modal, isOpen: false })} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <FaTimes size={18} />
                            </button>
                        </div>
                        <div className="p-8 text-sm text-gray-700 leading-relaxed">
                            {modal.type === "disable" && "Are you sure you want to disable this curriculum?"}
                            {modal.type === "enable" && "Are you sure you want to enable this curriculum?"}
                            {modal.type === "competency_disable" && (
                                <div className="space-y-3">
                                    <p className="font-medium">Are you sure that you want to make Competencies and Performance Indicators optional?</p>
                                    <p className="text-red-500 text-xs italic">Caution: This action cannot be reverted once confirmed.</p>
                                </div>
                            )}
                            {modal.type === "course_mapping_toggle" && `Are you sure you want to make Course Mapping ${modal.data.toLowerCase()}?`}
                            {modal.type === "student_reg_toggle" && `Are you sure you want to make Student Registration ${modal.data.toLowerCase()}?`}
                            {modal.type === "rollback" && (
                                <div className="space-y-4">
                                    <p className="text-red-600 font-bold uppercase text-xs tracking-wider">Permanent Data Loss Warning</p>
                                    <p>All data entered or imported for this curriculum will be <span className="underline font-bold">permanently deleted</span>. This cannot be undone.</p>
                                    <div className="pt-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Verification Password:</label>
                                        <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all outline-none" />
                                    </div>
                                </div>
                            )}
                            {modal.type === "import_data" && (
                                <div className="space-y-6">
                                    <div className="flex gap-4 justify-center">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="radio" name="import_mode" checked={importMode === "entities"} onChange={() => setImportMode("entities")} className="text-[#437880] focus:ring-[#437880]" />
                                            <span className="group-hover:text-gray-900 transition-colors">Select Entities</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="radio" name="import_mode" checked={importMode === "entire"} onChange={() => setImportMode("entire")} className="text-[#437880] focus:ring-[#437880]" />
                                            <span className="group-hover:text-gray-900 transition-colors">Entire Curriculum</span>
                                        </label>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Source Curriculum:</label>
                                        <select 
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-[#437880] focus:border-[#437880] outline-none"
                                            value={importCurriculum}
                                            onChange={(e) => setImportCurriculum(Number(e.target.value))}
                                        >
                                            <option value="">-- Choose Curriculum --</option>
                                            {list.filter(c => c.crclm_id !== modal.id).map(c => (
                                                <option key={c.crclm_id} value={c.crclm_id}>{c.crclm_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-8 py-5 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/20">
                             <UIButton
                                className="bg-[#d9534f] text-white hover:bg-[#c9302c] shadow-md border-none"
                                size="sm"
                                onClick={() => setModal({ ...modal, isOpen: false })}
                            >
                                <FaTimes className="mr-2" /> Cancel
                            </UIButton>
                            <UIButton
                                className="button-bg"
                                size="sm"
                                onClick={handleModalConfirm}
                            >
                                <FaCheck className="mr-2" /> {modal.type === "import_data" ? "Import" : "Confirm"}
                            </UIButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurriculumPage;