import React, { useState, useEffect, useMemo } from "react";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaEye,
    FaFileImport,
    FaQuestionCircle,
    FaSearch,
    FaCheck,
    FaCloudDownloadAlt,
    FaArrowLeft,
    FaArrowRight
} from "react-icons/fa";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import {
    fetchSchools,
    fetchPrograms,
    fetchCurriculums,
    fetchTerms,
    fetchCourses,
    fetchQPList,
    fetchCourseQPList,
    deleteQP,
    fetchQPDetails
} from "./modelQPApi";
import { 
    CourseQPRowUI, 
    ModelQPApi, 
    DropdownOption 
} from "./types";
import { normalizeCourseRow, mapToDropdown } from "./utils/qpMappers";
import ViewQPModal from "./ViewQPModal";
import ImportQPModal from "./ImportQPModal";
import ModelQPFormManager from "./ModelQPFormManager";

type ViewType = "list" | "builder" | "view" | "import";



const ManageModelQPPage: React.FC = () => {
    const navigate = useNavigate();
    // ==================== STATE MANAGEMENT ====================
    const [view, setView] = useState<ViewType>("list");
    const [loading, setLoading] = useState<boolean>(false);
    const [tableLoading, setTableLoading] = useState<boolean>(false);

    // Dropdowns State
    const [schools, setSchools] = useState<DropdownOption[]>([]);
    const [programs, setPrograms] = useState<DropdownOption[]>([]);
    const [curriculums, setCurriculums] = useState<DropdownOption[]>([]);
    const [terms, setTerms] = useState<DropdownOption[]>([]);
    // const [courses, setCourses] = useState<DropdownOption[]>([]); // Removed

    // Selection State
    const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
    const [selectedCurr, setSelectedCurr] = useState<string>("");
    const [selectedTerm, setSelectedTerm] = useState<string>("");
    
    // [NEW] Context for row-specific actions
    const [actionContext, setActionContext] = useState<{
        courseId: number;
        courseTitle: string;
        qpId: number | null;
        curriculumId: number;
        semesterId: number;
    } | null>(null);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        qpId: number | null;
    }>({
        isOpen: false,
        title: "",
        message: "",
        qpId: null,
    });

    // QP Data State
    const [qpList, setQpList] = useState<CourseQPRowUI[]>([]);
    const [courseQPRows, setCourseQPRows] = useState<CourseQPRowUI[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedQP, setSelectedQP] = useState<ModelQPApi | null>(null);

    // Pagination State
    const [entries, setEntries] = useState(10);
    const [page, setPage] = useState(1);

    // Modal Visibility
    const [showViewModal, setShowViewModal] = useState<boolean>(false);
    const [showImportModal, setShowImportModal] = useState<boolean>(false);

    // const isCourseSelected = !!selectedCourse; // Removed

    // ==================== EFFECTS ====================

    // Initial Load: Schools
    useEffect(() => {
        const loadSchools = async () => {
            setLoading(true);
            try {
                const data = await fetchSchools();
                const mapped = mapToDropdown(data, "dept_name", "dept_id");
                setSchools(mapped);
            } catch (err) {
                console.error("Error loading schools:", err);
                setSchools([]);
            }
            setLoading(false);
        };
        loadSchools();
    }, []);

    // Chain: School -> Program
    useEffect(() => {
        if (!selectedSchool) {
            setPrograms([]);
            return;
        }

        const loadPrograms = async () => {
            try {
                const data = await fetchPrograms(selectedSchool);
                const mapped = mapToDropdown(data, "pgm_title", "pgm_id");
                setPrograms(mapped);
            } catch (err) {
                console.error("Error loading programs:", err);
                setPrograms([]);
            }
        };

        loadPrograms();
    }, [selectedSchool]);

    // Chain: Program -> Curriculum
    useEffect(() => {
        if (selectedProgram) {
            fetchCurriculums(selectedProgram).then((data: any[]) => {
                const mapped = mapToDropdown(data, "academic_batch_code", "academic_batch_id");
                setCurriculums(mapped);
            }).catch(() => {
                setCurriculums([]);
            });
        } else {
            setCurriculums([]);
            setSelectedCurr("");
        }
    }, [selectedProgram]);

    // Curriculum -> Term
    useEffect(() => {
        if (selectedCurr) {
            fetchTerms(Number(selectedCurr)).then((data: any[]) => {
                const mapped = mapToDropdown(data, "display_name", "semester_id");
                setTerms(mapped);
            }).catch(() => {
                setTerms([]);
            });
        } else {
            setTerms([]);
            setSelectedTerm("");
        }
    }, [selectedCurr]);

    // Removed: Chain Term -> Course

    // Full Hierarchy -> Fetch QP List
    useEffect(() => {
        if (!selectedSchool || !selectedProgram || !selectedCurr || !selectedTerm) {
            setQpList([]);
            return;
        }

        loadQPList();
    }, [selectedSchool, selectedProgram, selectedCurr, selectedTerm]);

    const loadQPList = async () => {
        if (!selectedSchool || !selectedProgram || !selectedCurr || !selectedTerm) return;

        setTableLoading(true);
        console.log("QP List Params:", {
            schoolId: Number(selectedSchool),
            programId: Number(selectedProgram),
            curriculumId: Number(selectedCurr),
            semesterId: Number(selectedTerm),
        });

        try {
            const list = await fetchQPList({
                schoolId: Number(selectedSchool),
                programId: Number(selectedProgram),
                curriculumId: Number(selectedCurr),
                semesterId: Number(selectedTerm),
            });

            setQpList(list);
            setCourseQPRows(list);
        } catch (err) {
            console.error("fetchQPList error:", err);
            setQpList([]);
            setCourseQPRows([]);
        } finally {
            setTableLoading(false);
        }
    };

    // Load course+QP rows removed - merged into loadQPList
    // ==================== HANDLERS ====================

    const handleViewQP = async (row: CourseQPRowUI) => {
        if (!row.qpId) return;
        setLoading(true);
        const details = await fetchQPDetails(row.qpId);
        if (details) {
            setSelectedQP(details);
            setShowViewModal(true);
        }
        setLoading(false);
    };

    const handleManageQP = async (row: CourseQPRowUI) => {
        setActionContext({
            courseId: row.courseId,
            courseTitle: row.courseTitle,
            qpId: row.qpId || null,
            curriculumId: Number(selectedCurr),
            semesterId: Number(selectedTerm),
        });

        if (row.qpId) {
            setLoading(true);
            const details = await fetchQPDetails(row.qpId);
            if (details) {
                setSelectedQP(details);
                setView("builder");
            }
            setLoading(false);
        } else {
            setSelectedQP(null);
            setView("builder");
        }
    };

    const handleImportQP = (row: CourseQPRowUI) => {
        setActionContext({
            courseId: row.courseId,
            courseTitle: row.courseTitle,
            qpId: row.qpId || null,
            curriculumId: Number(selectedCurr),
            semesterId: Number(selectedTerm),
        });
        setShowImportModal(true);
    };

    const handleAddNewQP = () => {
        // This button usually removed in term-wise view as "Add" is per-row
        alert("Please use the 'Add / Edit' button in the course list.");
    };

    const handleDeleteQP = (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Delete",
            message: "Are you sure you want to delete this Model QP? Once deleted, data cannot be retrieved back.",
            qpId: id,
        });
    };

    const handleConfirmDelete = async () => {
        const id = confirmDialog.qpId;
        if (!id) return;

        setTableLoading(true);
        const success = await deleteQP(id);
        if (success) {
            const updatedList = qpList.filter(q => q.qpId !== id);
            setQpList(updatedList);
            // alert("QP deleted successfully!"); // Optional: use toast
        }
        setTableLoading(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false, qpId: null }));
    };

    const filteredRows = useMemo(() => {
        let rows = courseQPRows;
        
        // Filter by course removed as dropdown is gone
        
        if (!searchTerm) return rows;
        const lower = searchTerm.toLowerCase();
        return rows.filter(r =>
            r.courseCode.toLowerCase().includes(lower) ||
            r.courseTitle.toLowerCase().includes(lower) ||
            r.courseOwner.toLowerCase().includes(lower)
        );
    }, [courseQPRows, searchTerm]);

    const filteredQPList = useMemo(() => {
        if (!searchTerm) return qpList;
        return qpList.filter(qp =>
            qp.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [qpList, searchTerm]);

    const totalPages = Math.ceil(filteredRows.length / entries);
    const start = (page - 1) * entries;
    const paginatedRows = filteredRows.slice(start, start + entries);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "COMPLETED": return "bg-green-700";
            case "INITIATED": return "bg-green-600";
            case "PENDING": return "bg-orange-500";
            default: return "bg-gray-500";
        }
    };

    // ==================== RENDERING ====================

    if (view === "builder" && actionContext) {
        return (
            <ModelQPFormManager
                qpData={selectedQP}
                courseId={actionContext.courseId}
                metaData={{
                    curriculum: curriculums.find(c => Number(c.value) === actionContext.curriculumId)?.label || "—",
                    curriculum_id: actionContext.curriculumId,
                    term: terms.find(t => Number(t.value) === actionContext.semesterId)?.label || "—",
                    semester_id: actionContext.semesterId,
                    course: actionContext.courseTitle
                }}
                onClose={() => {
                    setView("list");
                    // Refresh list
                    loadQPList();
                }}
            />
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            {/* Header Area */}
            <div className="mb-2 flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-[#4a8494] mb-1">Manage TEE/ESE Model QP</h3>
                    <p className="text-sm text-gray-500">Add, edit, view, import or delete the TEE/ESE Model Question Paper</p>
                </div>
            </div>

            <div className="border-b border-gray-100 my-6"></div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">School <span className="text-red-500">*</span></label>
                    <select
                        className="block w-full px-3 py-2 border border-gray-400 rounded outline-none sm:text-sm shadow-sm disabled:bg-gray-100"
                        value={selectedSchool ?? ""}
                        onChange={(e) => {
                            const value = Number(e.target.value);
                            setSelectedSchool(value);
                            setSelectedProgram(null);
                            setPrograms([]);
                        }}
                    >
                        <option value="">Select School</option>
                        {schools.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Program <span className="text-red-500">*</span></label>
                    <select
                        className="block w-full px-3 py-2 border border-gray-400 rounded outline-none sm:text-sm shadow-sm disabled:bg-gray-100"
                        value={selectedProgram ?? ""}
                        disabled={!selectedSchool}
                        onChange={(e) => setSelectedProgram(Number(e.target.value))}
                    >
                        <option value="">Select Program</option>
                        {programs.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Curriculum <span className="text-red-500">*</span></label>
                    <select
                        className="block w-full px-3 py-2 border border-gray-400 rounded outline-none sm:text-sm shadow-sm disabled:bg-gray-100"
                        value={selectedCurr}
                        disabled={!selectedProgram}
                        onChange={(e) => setSelectedCurr(e.target.value)}
                    >
                        <option value="">Select Curriculum</option>
                        {curriculums.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Term <span className="text-red-500">*</span></label>
                    <select
                        className="block w-full px-3 py-2 border border-gray-400 rounded outline-none sm:text-sm shadow-sm disabled:bg-gray-100"
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                        disabled={!selectedCurr}
                    >
                        <option value="">Select Term</option>
                        {terms.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                {/* Course select removed from layout */}
            </div>

            {/* List Table Area */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center text-sm text-gray-700">
                    <span>Show</span>
                    <select
                        value={entries}
                        onChange={(e) => { setEntries(Number(e.target.value)); setPage(1); }}
                        className="mx-2 px-2 py-1 border rounded sm:text-sm shadow-sm border-gray-300"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span>entries</span>
                </div>
                <div className="flex items-center">
                    <span className="text-sm text-gray-700 mr-2">Search:</span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filter results..."
                        className="shadow-sm border border-gray-300 rounded px-3 py-1.5 sm:text-sm outline-none"
                    />
                </div>
            </div>

            <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="bg-[#f0f9ff] px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#4a8494]">MODEL QUESTION PAPER (QP) LIST - TERMWISE</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f8fafc]">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Sl No.</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Course Code</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Course Title</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Core / Elective</th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Credits</th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Total Marks</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Course Owner</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Mode</th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">View QP Details</th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Manage Model QP</th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Import Model QP</th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Delete</th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-[#334155] uppercase tracking-wider">Model QP Status</th>
                            </tr>
                        </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tableLoading ? (
                                        <tr>
                                            <td colSpan={13} className="px-4 py-12 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                            </td>
                                        </tr>
                                    ) : !selectedTerm ? (
                                        <tr>
                                            <td colSpan={13} className="px-4 py-12 text-center text-sm text-gray-500 bg-gray-50 italic">
                                                Please select School, Program, Curriculum, and Term to view the Model Question Papers.
                                            </td>
                                        </tr>
                                    ) : paginatedRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={13} className="px-4 py-12 text-center text-sm text-gray-400 bg-gray-50 italic">
                                                No courses found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedRows.map((row, idx) => (
                                            <tr key={row.courseId} className="hover:bg-blue-50 transition-colors duration-150">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100">{start + idx + 1}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-blue-700 border-r border-gray-100">{row.courseCode}</td>
                                                <td className="px-4 py-4 text-sm text-gray-700 border-r border-gray-100">{row.courseTitle}</td>
                                                <td className="px-4 py-4 text-sm text-gray-600 border-r border-gray-100">{row.type}</td>
                                                <td className="px-4 py-4 text-center text-sm text-gray-600 border-r border-gray-100">{row.credits}</td>
                                                <td className="px-4 py-4 text-center text-sm text-gray-600 border-r border-gray-100">{row.totalMarks}</td>
                                                <td className="px-4 py-4 text-sm text-gray-600 border-r border-gray-100">{row.courseOwner}</td>
                                                <td className="px-4 py-4 text-sm text-gray-600 border-r border-gray-100">REGULAR</td> {/* Fallback for Mode if missing */}

                                                {/* View QP Details */}
                                                <td className="px-4 py-4 text-center border-r border-gray-100">
                                                    {row.qpId ? (
                                                        <button
                                                            onClick={() => handleViewQP(row)}
                                                            className="text-indigo-500 hover:text-indigo-700 text-sm font-bold underline transition-all"
                                                        >
                                                            View Model QP Details
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">QP not defined</span>
                                                    )}
                                                </td>

                                                {/* Manage Model QP */}
                                                <td className="px-4 py-4 text-center border-r border-gray-100">
                                                    <button
                                                        onClick={() => handleManageQP(row)}
                                                        className="text-indigo-500 hover:text-indigo-700 text-sm font-bold underline transition-all"
                                                    >
                                                        Add / Edit Model QP
                                                    </button>
                                                </td>

                                                {/* Import Model QP */}
                                                <td className="px-4 py-4 text-center border-r border-gray-100">
                                                    <button
                                                        onClick={() => handleImportQP(row)}
                                                        className="text-indigo-500 hover:text-indigo-700 text-sm font-bold underline transition-all"
                                                    >
                                                        Import Model QP
                                                    </button>
                                                </td>

                                                {/* Delete */}
                                                <td className="px-4 py-4 border-r border-gray-100">
                                                    <div className="flex items-center justify-center">
                                                        {row.qpId ? (
                                                            <button
                                                                onClick={() => handleDeleteQP(row.qpId!)}
                                                                className="flex items-center justify-center transition-all text-red-600 hover:text-red-800"
                                                            >
                                                                <FaTrash size={16} />
                                                            </button>
                                                        ) : (
                                                            <span className="flex items-center justify-center text-red-300"><FaTrash size={16} /></span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-4 text-center">
                                                    {row.qpId ? (
                                                        <span className={`${getStatusStyle(row.status || "")} text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm`}>
                                                            {row.status}
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                            NOT DEFINED
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500 italic">
                    Showing <span className="font-semibold">{filteredRows.length ? start + 1 : 0}</span> to <span className="font-semibold">{Math.min(start + entries, filteredRows.length)}</span> of <span className="font-semibold">{filteredRows.length}</span> entries
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-md text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-30"
                    >
                        PREVIOUS
                    </button>
                    <div className="px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold shadow-md uppercase tracking-wider">
                        PAGE {page} OF {totalPages || 1}
                    </div>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages || totalPages === 0}
                        className="px-4 py-2 border rounded-md text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-30"
                    >
                        NEXT
                    </button>
                </div>
            </div>

            {/* Modals */}
            {showViewModal && selectedQP && (
                <ViewQPModal
                    qp={selectedQP}
                    onClose={() => setShowViewModal(false)}
                />
            )}

            {showImportModal && actionContext && (
                <ImportQPModal
                    courseId={actionContext.courseId}
                    curriculumId={actionContext.curriculumId}
                    semesterId={actionContext.semesterId}
                    onImport={(qp) => {
                        setSelectedQP(qp);
                        setShowImportModal(false);
                        setView("builder");
                    }}
                    onClose={() => {
                        setShowImportModal(false);
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false, qpId: null }))}
                onConfirm={handleConfirmDelete}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />
        </div>
    );
};

export default ManageModelQPPage;
