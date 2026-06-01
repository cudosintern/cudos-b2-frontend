import React, { useState, useEffect, useMemo, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FaPlus,
    FaEdit,
    FaPencilAlt,
    FaTrash,
    FaTrashAlt,
    FaSave,
    FaUndo,
    FaTimes,
    FaExternalLinkAlt,
    FaCheck,
    FaQuestionCircle
} from "react-icons/fa";
import {
    fetchCurriculums,
    fetchTerms,
    fetchCourses,
    fetchUnits,
    fetchTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    fetchDeliveryMethods,
    fetchTLOs,
    createTLO,
    updateTLO,
    deleteTLO,
    fetchLessonSchedules,
    submitToPublish,
    DeliveryMethodOption
} from "./manageTopicsApi";
import {
    CurriculumOption,
    TermOption,
    CourseOption,
    UnitOption,
    Topic
} from "./types";
import LessonScheduleManager from "./LessonScheduleManager";
import CourseUtilizationManager from "./CourseUtilizationManager";
import { TLOCoMappingManager } from "./TLOCoMappingManager";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";

// Delivery methods will be fetched from API


// Helper: strip HTML tags and return plain text preview
const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
};


// ---- Warning Modal ----
interface WarningModalProps {
    title: string;
    message: string;
    onClose: () => void;
}

const WarningModal: React.FC<WarningModalProps> = ({ title, message, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-down">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <button className="text-gray-400 hover:text-gray-500 transition-colors" onClick={onClose}>
                        <FaTimes className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6 bg-white text-sm text-gray-800 text-center">
                    {message}
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-center border-t border-gray-100">
                    <button
                        className="bg-blue-600 text-white font-medium px-8 py-2 rounded hover:bg-blue-700 transition-colors shadow-sm"
                        onClick={onClose}
                    >
                        Ok
                    </button>
                </div>
            </div>
        </div>
    );
};

// ---- TLO Manager (defined before ManageTopicsPage to avoid forward-reference) ----
const BLOOM_LEVELS = [
    "L1-Remember", "L2-Understanding", "L3-Applying",
    "L4-Analyzing", "L5-Evaluating", "L6-Creating"
];

const TLO_DELIVERY_METHODS = [
    "Classroom Delivery", "Demonstration", "Case Study",
    "Guest Lecture", "Flipped Class", "Workshop or Seminar"
];

interface TLORecord {
    id: number;
    code: string;
    outcome: string;
    bloom: string;
    deliveryMethod: string;
    deliveryApproach: string;
}

interface TLOManagerProps {
    topic: Topic | null;
    curriculumLabel: string;
    termLabel: string;
    courseLabel: string;
    tloList: TLORecord[];
    setTloList: React.Dispatch<React.SetStateAction<TLORecord[]>>;
    editingTLO: number | null;
    setEditingTLO: React.Dispatch<React.SetStateAction<number | null>>;
    formData: { deliveryMethod: string; cognitiveDomain: string; statement: string; deliveryApproach: string };
    setFormData: React.Dispatch<React.SetStateAction<{ deliveryMethod: string; cognitiveDomain: string; statement: string; deliveryApproach: string }>>;
    onClose: () => void;
}

const TLOManager: React.FC<TLOManagerProps> = ({
    topic, curriculumLabel, termLabel, courseLabel,
    tloList, setTloList, editingTLO, setEditingTLO,
    formData, setFormData, onClose
}) => {
    const [tloEntries, setTloEntries] = React.useState(20);
    const [tloSearch, setTloSearch] = React.useState("");
    const [tloPage, setTloPage] = React.useState(1);

    const [confirmDialog, setConfirmDialog] = React.useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { }
    });

    const filteredTLOs = tloList.filter(t =>
        t.code.toLowerCase().includes(tloSearch.toLowerCase()) ||
        t.bloom.toLowerCase().includes(tloSearch.toLowerCase())
    );

    const pagedTLOs = filteredTLOs.slice((tloPage - 1) * tloEntries, tloPage * tloEntries);

    const resetForm = () => {
        setFormData({ deliveryMethod: "", cognitiveDomain: "", statement: "", deliveryApproach: "" });
        setEditingTLO(null);
    };

    const handleSave = async () => {
        if (!formData.deliveryMethod) { toast.warning("Please select a Delivery Method."); return; }
        if (!formData.cognitiveDomain) { toast.warning("Please select a Cognitive Domain."); return; }
        if (!formData.statement || formData.statement.replace(/<[^>]*>/g, "").trim().length < 10) {
            toast.warning("TLO Statement is required (minimum 10 characters).");
            return;
        }
        if (!topic?.academic_batch_id || !topic?.semester_id || !topic?.crs_id) {
            toast.error("Topic context is incomplete. Reload the page and try again.");
            return;
        }

        try {
            if (editingTLO !== null) {
                const current = tloList[editingTLO];
                const updated = await updateTLO(current.id, {
                    topic_id: topic.id,
                    academic_batch_id: topic.academic_batch_id,
                    semester_id: topic.semester_id,
                    crs_id: topic.crs_id,
                    outcome: formData.statement,
                    bloom: formData.cognitiveDomain,
                    delivery_method: formData.deliveryMethod,
                    delivery_approach: formData.deliveryApproach,
                    code: current.code,
                });
                setTloList(prev => prev.map((t, i) => i === editingTLO ? updated : t));
            } else {
                const created = await createTLO({
                    topic_id: topic.id,
                    academic_batch_id: topic.academic_batch_id,
                    semester_id: topic.semester_id,
                    crs_id: topic.crs_id,
                    outcome: formData.statement,
                    bloom: formData.cognitiveDomain,
                    delivery_method: formData.deliveryMethod,
                    delivery_approach: formData.deliveryApproach,
                    code: `TLO${tloList.length + 1}`,
                });
                setTloList(prev => [...prev, created]);
            }
            resetForm();
        } catch (err) {
            console.error("Failed to save TLO:", err);
            toast.error("Failed to save TLO.");
        }
    };

    const handleEditRow = (idx: number) => {
        const tlo = tloList[idx];
        setFormData({ deliveryMethod: tlo.deliveryMethod, cognitiveDomain: tlo.bloom, statement: tlo.outcome, deliveryApproach: tlo.deliveryApproach });
        setEditingTLO(idx);
    };

    const handleDeleteRow = (idx: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Delete",
            message: "Are you sure that you want to delete this TLO? Once deleted, data cannot be retrieved back.",
            onConfirm: async () => {
                try {
                    await deleteTLO(tloList[idx].id);
                    setTloList(prev => prev.filter((_, i) => i !== idx));
                    if (editingTLO === idx) resetForm();
                    toast.success("TLO deleted successfully!");
                } catch (err) {
                    console.error("Failed to delete TLO:", err);
                    toast.error("Failed to delete TLO.");
                } finally {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* 1️⃣ HEADER */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Add / Edit Topic Learning Outcomes (TLO)
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <FaTimes className="w-5 h-5" />
                </button>
            </div>

            {/* 2️⃣ READONLY CONTEXT INFO */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Curriculum :</span>
                    <span className="text-sm font-semibold text-blue-700">{curriculumLabel || "—"}</span>
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Term :</span>
                    <span className="text-sm font-semibold text-blue-700">{termLabel || "—"}</span>
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Course :</span>
                    <span className="text-sm font-semibold text-blue-700">{courseLabel || "—"}</span>
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Topic :</span>
                    <span className="text-sm font-semibold text-blue-700">{topic?.title || "—"}</span>
                </div>
            </div>

            {/* 3️⃣ SHOW ENTRIES & SEARCH */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span>Show</span>
                    <select
                        className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        value={tloEntries}
                        onChange={e => { setTloEntries(Number(e.target.value)); setTloPage(1); }}
                    >
                        {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span>entries</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span>Search:</span>
                    <input
                        className="border border-gray-300 rounded px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Search TLOs..."
                        value={tloSearch}
                        onChange={e => { setTloSearch(e.target.value); setTloPage(1); }}
                    />
                </div>
            </div>

            {/* 4️⃣ TLO TABLE */}
            <div className="mb-6 overflow-x-auto border border-gray-300 rounded-lg">
                <table className="w-full border-collapse text-xs">
                    <thead className="bg-gray-100 text-gray-700 uppercase">
                        <tr>
                            <th className="border border-gray-300 px-3 py-2 text-left">TLO Code</th>
                            <th className="border border-gray-300 px-3 py-2 text-left">Topic Learning Outcomes</th>
                            <th className="border border-gray-300 px-3 py-2 text-left">Bloom's Level</th>
                            <th className="border border-gray-300 px-3 py-2 text-left">Delivery Method</th>
                            <th className="border border-gray-300 px-3 py-2 text-left">Delivery Approach</th>
                            <th className="border border-gray-300 px-3 py-2 text-center">Edit</th>
                            <th className="border border-gray-300 px-3 py-2 text-center">Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedTLOs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-4 text-gray-500 italic">No data available in table</td>
                            </tr>
                        ) : (
                            pagedTLOs.map((tlo, idx) => (
                                <tr key={tlo.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="border border-gray-300 px-3 py-2 font-bold text-blue-700">{tlo.code}</td>
                                    <td className="border border-gray-300 px-3 py-2 max-w-xs" dangerouslySetInnerHTML={{ __html: tlo.outcome }} />
                                    <td className="border border-gray-300 px-3 py-2">{tlo.bloom}</td>
                                    <td className="border border-gray-300 px-3 py-2">{tlo.deliveryMethod}</td>
                                    <td className="border border-gray-300 px-3 py-2">{tlo.deliveryApproach || "—"}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-center">
                                        <button onClick={() => handleEditRow((tloPage - 1) * tloEntries + idx)} className="text-orange-500 hover:text-orange-700 transition-colors" title="Edit TLO">
                                            <FaPencilAlt className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-center">
                                        <button onClick={() => handleDeleteRow((tloPage - 1) * tloEntries + idx)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete TLO">
                                            <FaTrashAlt className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 5️⃣ PAGINATION INFO & CONTROLS */}
            <div className="flex justify-between items-center text-xs text-gray-600 mb-8 px-1">
                <div>
                    Showing {filteredTLOs.length === 0 ? 0 : (tloPage - 1) * tloEntries + 1} to {Math.min(tloPage * tloEntries, filteredTLOs.length)} of {filteredTLOs.length} entries
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setTloPage(p => p - 1)}
                        disabled={tloPage === 1}
                        className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        &larr; Previous
                    </button>
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded font-bold">{tloPage}</span>
                    <button
                        onClick={() => setTloPage(p => p + 1)}
                        disabled={tloPage * tloEntries >= filteredTLOs.length}
                        className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Next &rarr;
                    </button>
                </div>
            </div>

            {/* 6️⃣ ADD/EDIT FORM */}
            <div className="space-y-5 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                {/* Delivery Method & Bloom's Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            Delivery Method <span className="text-red-500">*</span> :
                        </label>
                        <select
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                            value={formData.deliveryMethod}
                            onChange={e => setFormData({ ...formData, deliveryMethod: e.target.value })}
                        >
                            <option value="">Select Delivery Method</option>
                            {TLO_DELIVERY_METHODS.map(m => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            Cognitive domain <span className="text-red-500">*</span> :
                        </label>
                        <select
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                            value={formData.cognitiveDomain}
                            onChange={e => setFormData({ ...formData, cognitiveDomain: e.target.value })}
                        >
                            <option value="">Select Bloom's Level</option>
                            {BLOOM_LEVELS.map(b => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TLO Statement */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-700">TLO Statement <span className="text-red-500">*</span> :</label>
                        <span className="text-[11px] text-blue-600 cursor-pointer hover:underline">On-line Mathematical Editor</span>
                    </div>
                    <Editor
                        apiKey="no-api-key"
                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                        value={formData.statement}
                        onEditorChange={(content: string) => setFormData({ ...formData, statement: content })}
                        init={{
                            height: 300,
                            menubar: "file edit insert view format table tools",
                            plugins: ["advlist", "autolink", "lists", "link", "image", "charmap",
                                "preview", "anchor", "searchreplace", "visualblocks", "code",
                                "fullscreen", "insertdatetime", "media", "table", "wordcount"],
                            toolbar:
                                "undo redo | formatselect | bold italic underline | " +
                                "alignleft aligncenter alignright alignjustify | " +
                                "bullist numlist outdent indent | link image table | code fullscreen",
                            branding: false,
                            promotion: false,
                            statusbar: true,
                            resize: true
                        }}
                    />
                </div>

                {/* Delivery Approach */}
                <div className="space-y-1 pb-4">
                    <label className="block text-sm font-bold text-gray-700">
                        Delivery Approach :
                    </label>
                    <textarea
                        rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                        value={formData.deliveryApproach}
                        onChange={e => setFormData({ ...formData, deliveryApproach: e.target.value })}
                        placeholder="Enter delivery approach..."
                    />
                </div>
            </div>

            {/* 7️⃣ ACTION BUTTONS */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                    onClick={handleSave}
                    className="px-8 py-2 bg-[#4a8494] text-white rounded-lg text-sm font-bold hover:bg-[#3a6a78] transition-all shadow-md flex items-center gap-2"
                >
                    <FaSave className="w-4 h-4" />
                    {editingTLO !== null ? "Update Record" : "Add"}
                </button>
                <button
                    onClick={onClose}
                    className="px-8 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-md flex items-center gap-2"
                >
                    <FaTimes className="w-4 h-4" />
                    Close
                </button>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />
        </div>
    );
};

const ManageTopicsPage: React.FC = () => {
    // ==================== STATE MANAGEMENT ====================
    const [view, setView] = useState<"list" | "add" | "edit" | "tlo" | "lessonSchedule" | "courseUtilization" | "tloCoMapping">("list");
    const [loading, setLoading] = useState<boolean>(false);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { }
    });

    // Filters State
    const [curriculums, setCurriculums] = useState<CurriculumOption[]>([]);
    const [terms, setTerms] = useState<TermOption[]>([]);
    const [courses, setCourses] = useState<CourseOption[]>([]);

    const [selectedCurriculum, setSelectedCurriculum] = useState<string>(() => localStorage.getItem("manageTopics_curriculum") || "");
    const [selectedTerm, setSelectedTerm] = useState<string>(() => localStorage.getItem("manageTopics_term") || "");
    const [selectedCourse, setSelectedCourse] = useState<string>(() => localStorage.getItem("manageTopics_course") || "");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethodOption[]>([]);

    // Topics State
    const [topics, setTopics] = useState<Topic[]>([]);
    const [entries, setEntries] = useState(20);
    const [page, setPage] = useState(1);
    const [showWarning, setShowWarning] = useState(false);
    const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
    const [deliveryDropdownOpen, setDeliveryDropdownOpen] = useState(false);
    const deliveryDropdownRef = useRef<HTMLDivElement>(null);

    // Form Table State (for Add/Edit View)
    const [formSearchTerm, setFormSearchTerm] = useState<string>("");
    const [formEntries, setFormEntries] = useState(10);
    const [formPage, setFormPage] = useState(1);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // TLO Add/Edit View State
    const [tloAddEditTopic, setTloAddEditTopic] = useState<Topic | null>(null);
    const [tloAddEditList, setTloAddEditList] = useState<{
        id: number;
        code: string;
        outcome: string;
        bloom: string;
        deliveryMethod: string;
        deliveryApproach: string;
    }[]>([]);
    const [editingTLO, setEditingTLO] = useState<number | null>(null); // index of TLO being edited
    const [tloAddEditForm, setTloAddEditForm] = useState({
        deliveryMethod: "",
        cognitiveDomain: "",
        statement: "",
        deliveryApproach: ""
    });

    // TLO Modal State
    const [showTLOModal, setShowTLOModal] = useState(false);
    const [tloTopic, setTloTopic] = useState<Topic | null>(null);
    const [tloList, setTloList] = useState<{
        id?: number;
        code: string;
        outcome: string;
        bloom: string;
        deliveryMethod: string;
        deliveryApproach: string;
    }[]>([]);
    const [tloPage, setTloPage] = useState(1);
    const TLO_PAGE_SIZE = 10;

    // Lesson Schedule State
    const [lsTopic, setLsTopic] = useState<Topic | null>(null);
    const [lsList, setLsList] = useState<{
        lectureNo: number;
        portion: string;
        plannedDate: string;
        actualDate: string;
    }[]>([]);

    // Course Utilization State
    const [courseUtilizationTopic, setCourseUtilizationTopic] = useState<Topic | null>(null);
    const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showAddMoreModal, setShowAddMoreModal] = useState(false);

    // TLO CO Mapping State
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [mappingTopic, setMappingTopic] = useState<Topic | null>(null);

    const [cuBooks, setCuBooks] = useState<any[]>([]);
    const [cuAssessments, setCuAssessments] = useState<any[]>([]);
    const [cuShowTable, setCuShowTable] = useState(false);
    const [cuData, setCuData] = useState<Record<string, string>>({});

    const isFormComplete = !!(selectedCurriculum && selectedTerm && selectedCourse);

    const filteredTopics = useMemo(() => {
        if (!searchTerm) return topics;
        const lowerSearch = searchTerm.toLowerCase();
        return topics.filter(topic =>
            topic.title.toLowerCase().includes(lowerSearch) ||
            topic.topic_code.toLowerCase().includes(lowerSearch)
        );
    }, [topics, searchTerm]);

    const filteredFormTopics = useMemo(() => {
        if (!formSearchTerm) return topics;
        const lowerSearch = formSearchTerm.toLowerCase();
        return topics.filter(topic =>
            topic.title.toLowerCase().includes(lowerSearch) ||
            (topic.sl_no !== undefined && String(topic.sl_no).toLowerCase().includes(lowerSearch)) ||
            topic.unit.toLowerCase().includes(lowerSearch)
        );
    }, [topics, formSearchTerm]);

    const paginatedFormTopics = useMemo(() => {
        const start = (formPage - 1) * formEntries;
        return filteredFormTopics.slice(start, start + formEntries);
    }, [filteredFormTopics, formPage, formEntries]);

    // Form State (Add/Edit)
    const [units, setUnits] = useState<UnitOption[]>([]);
    const [formData, setFormData] = useState<{
        unit_id: number;
        sl_no: string;
        title: string;
        hours: string;
        deliveryMethods: string[];
        content: string;
    }>({
        unit_id: 0,
        sl_no: "",
        title: "",
        hours: "",
        deliveryMethods: [],
        content: ""
    });

    // ==================== EFFECTS ====================
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [currData, unitData, dmData] = await Promise.all([
                    fetchCurriculums(),
                    fetchUnits(),
                    fetchDeliveryMethods()
                ]);
                setCurriculums(currData);
                setUnits(unitData);
                setDeliveryMethods(dmData);
            } catch (err) {
                console.error("Failed to load initial data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Close delivery dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (deliveryDropdownRef.current && !deliveryDropdownRef.current.contains(e.target as Node)) {
                setDeliveryDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {

        if (selectedCurriculum) {
            fetchTerms(Number(selectedCurriculum)).then(setTerms);
        } else {
            setTerms([]);
            setSelectedTerm("");
        }
    }, [selectedCurriculum]);

    useEffect(() => {
        const curriculumId = Number(selectedCurriculum);
        if (selectedCurriculum && Number.isFinite(curriculumId) && curriculumId > 0) {
            fetchCourses(curriculumId, Number(selectedTerm)).then(setCourses);
        } else {
            setCourses([]);
            setSelectedCourse("");
        }
    }, [selectedCurriculum, selectedTerm]);

    useEffect(() => {
        if (selectedCourse) {
            fetchTopics(Number(selectedCourse)).then(setTopics);
        } else {
            setTopics([]);
        }
    }, [selectedCourse]);

    // Update localStorage when selections change
    useEffect(() => {
        localStorage.setItem("manageTopics_curriculum", selectedCurriculum);
    }, [selectedCurriculum]);

    useEffect(() => {
        localStorage.setItem("manageTopics_term", selectedTerm);
    }, [selectedTerm]);

    useEffect(() => {
        localStorage.setItem("manageTopics_course", selectedCourse);
    }, [selectedCourse]);

    // ==================== HANDLERS ====================
    const handleAddClick = () => {
        if (!isFormComplete) {
            setShowWarning(true);
            return;
        }
        if (publishStatus === "published") {
            setShowAddMoreModal(true);
            return;
        }
        setFormData({
            unit_id: 0,
            sl_no: "",
            title: "",
            hours: "",
            deliveryMethods: [],
            content: ""
        });
        setView("add");
    };

    const handleEditClick = (topic: Topic) => {
        setCurrentTopic(topic);
        setFormData({
            unit_id: topic.unit_id,
            sl_no: String(topic.sl_no || ""),
            title: topic.title,
            hours: String(topic.hours),
            deliveryMethods: topic.deliveryMethods,
            content: topic.content
        });
        setView("edit");
    };

    const handleDeleteClick = (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Delete",
            message: "Are you sure that you want to delete this topic? Once deleted, data cannot be retrieved back.",
            onConfirm: async () => {
                try {
                    await deleteTopic(id);
                    // Refresh data from server
                    if (selectedCourse) {
                        const freshTopics = await fetchTopics(Number(selectedCourse));
                        setTopics(freshTopics);
                    }
                    setPublishStatus("draft");
                    toast.success("Topic deleted successfully!");
                } catch (err) {
                    console.error("Delete failed:", err);
                    toast.error("Failed to delete topic.");
                } finally {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const validateForm = (): Record<string, string> => {
        const errors: Record<string, string> = {};
        if (!formData.unit_id) errors.unit_id = "Topic Unit is required.";
        if (!formData.sl_no.trim()) errors.sl_no = "Sl No. is required.";
        if (!formData.title.trim()) errors.title = "Topic Title is required.";
        else if (formData.title.trim().length < 3) errors.title = "Topic Title must be at least 3 characters.";
        if (!formData.hours || Number(formData.hours) <= 0) errors.hours = "Duration must be a positive number.";
        if (formData.deliveryMethods.length === 0) errors.deliveryMethods = "Select at least one Delivery Method.";
        const stripped = formData.content.replace(/<[^>]+>/g, "").trim();
        if (!stripped || formData.content === "<p>&nbsp;</p>" || formData.content === "<p></p>") errors.content = "Topic Content is required.";
        else if (stripped.length < 10) errors.content = "Topic Content too short (min 10 characters).";
        return errors;
    };

    const handleSave = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.warning("Please fix the highlighted errors before saving.");
            return;
        }
        setFormErrors({});

        setLoading(true);
        try {
            // Build the backend-compatible payload using correct field names
            const backendPayload = {
                topic_title: formData.title,
                t_unit_id: formData.unit_id,
                topic_content: formData.content,
                topic_hrs: String(formData.hours),
                academic_batch_id: Number(selectedCurriculum),
                semester_id: Number(selectedTerm),
                crs_id: Number(selectedCourse),
                delivery_methods: formData.deliveryMethods,
            };

            if (view === "add") {
                await createTopic(backendPayload);
                toast.success("Topic added successfully!");
            } else if (view === "edit" && currentTopic) {
                await updateTopic(currentTopic.id, backendPayload);
                toast.success("Topic updated successfully!");
            }

            // Refresh topics from server after create/update
            const freshTopics = await fetchTopics(Number(selectedCourse));
            setTopics(freshTopics);

            setPublishStatus("draft");

            // Stay on the same page (Add/Edit form) after saving
            if (view === "edit") {
                setView("add");
                setCurrentTopic(null);
            }

            // Reset form fields but preserve unit_id for "Add Another" efficiency
            setFormData(prev => ({
                unit_id: prev.unit_id,
                sl_no: "",
                title: "",
                hours: "",
                deliveryMethods: [],
                content: ""
            }));
        } catch (err: any) {
            console.error("Save topic failed:", err);
            const msg = err?.response?.data?.message || err?.message || "Failed to save topic.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };



    const handleViewTLO = async (topic: Topic) => {
        setTloTopic(topic);
        setTloPage(1);
        setShowTLOModal(true);
        try {
            const tlos = await fetchTLOs(topic.id);
            setTloList(tlos);
        } catch (err) {
            console.error("Failed to load TLOs for view:", err);
        }
    };

    const handleAddEditTLO = async (topic: Topic) => {
        setTloAddEditTopic(topic);
        setLoading(true);
        try {
            const tlos = await fetchTLOs(topic.id);
            setTloAddEditList(tlos);
            setEditingTLO(null);
            setTloAddEditForm({ deliveryMethod: "", cognitiveDomain: "", statement: "", deliveryApproach: "" });
            setView("tlo");
        } catch (err) {
            console.error("Failed to load TLOs:", err);
            toast.error("Failed to load TLOs");
        } finally {
            setLoading(false);
        }
    };

    const handleLessonSchedule = async (topic: Topic) => {
        setLsTopic(topic);
        setLoading(true);
        try {
            const [lessons, tlos] = await Promise.all([
                fetchLessonSchedules(topic.id),
                fetchTLOs(topic.id)
            ]);
            setLsList(lessons);
            setTloAddEditList(tlos); // Reuse this state as it's for the same topic
            setView("lessonSchedule");
        } catch (err) {
            console.error("Failed to load lesson schedule data:", err);
            toast.error("Failed to load lesson schedule data");
        } finally {
            setLoading(false);
        }
    };

    const handleCourseUtilization = (topic?: Topic) => {
        if (!isFormComplete) {
            setShowWarning(true);
            return;
        }
        setCourseUtilizationTopic(topic || topics[0] || null);
        setView("courseUtilization");
    };

    const handleDeliveryMethodChange = (method: string) => {
        setFormData(prev => {
            const current = prev.deliveryMethods.includes(method)
                ? prev.deliveryMethods.filter(m => m !== method)
                : [...prev.deliveryMethods, method];
            return { ...prev, deliveryMethods: current };
        });
    };

    // ==================== PUBLISH HANDLERS ====================
    const handleSubmitPublishClick = () => {
        if (!isFormComplete) {
            setShowWarning(true);
            return;
        }
        if (topics.length === 0) {
            toast.warning("Please add at least one topic before publishing.");
            return;
        }
        setShowPublishModal(true);
    };

    const handleConfirmPublish = async () => {
        if (!selectedCourse) return;
        setLoading(true);
        try {
            await submitToPublish({
                course_id: Number(selectedCourse),
                academic_batch_id: Number(selectedCurriculum) || undefined,
                semester_id: Number(selectedTerm) || undefined,
            });
            setPublishStatus("published");
            setShowPublishModal(false);
            toast.success("Course published successfully!");
        } catch (err) {
            console.error("Publish failed:", err);
            toast.error("Failed to publish course. Please ensure all mappings are completed.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAddMoreTopics = () => {
        setPublishStatus("draft");
        setShowAddMoreModal(false);
        setFormData({
            unit_id: 0,
            sl_no: "",
            title: "",
            hours: "",
            deliveryMethods: [],
            content: ""
        });
        setView("add");
    };

    // ==================== TLO CO MAPPING HANDLERS ====================
    const handleMappingClick = (topic: Topic) => {
        if (!isFormComplete) {
            setShowWarning(true);
            return;
        }
        setMappingTopic(topic);
        setShowMappingModal(true);
    };

    const handleConfirmMapping = () => {
        setShowMappingModal(false);
        setView("tloCoMapping");
    };

    const handleCancelMapping = () => {
        setShowMappingModal(false);
    };

    const handleSaveMapping = (topicId: number, mappingMatrix: Record<string, number>, justification: string) => {
        setTopics(prev => prev.map(t =>
            t.id === topicId ? { ...t, mappingStatus: "mapped" } : t
        ));
        setView("list");
    };

    // ==================== RENDERING ====================
    const selectedCrclmLabel = curriculums.find(c => String(c.value) === selectedCurriculum)?.label || "N/A";
    const selectedTermLabel = terms.find(t => String(t.value) === selectedTerm)?.label || "N/A";
    const selectedCourseLabel = courses.find(c => String(c.value) === selectedCourse)?.label || "N/A";

    return (
        <div className="curriculum-container p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="curriculum-card bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                {view === "list" ? (
                    <>
                        {/* 1️⃣ TOPIC LIST VIEW */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Topic List</h3>
                            <button
                                onClick={handleAddClick}
                                className="flex items-center gap-2 px-6 py-2 bg-[#4a8494] text-white rounded-md hover:bg-[#3a6a78] transition-colors shadow-sm text-sm font-bold uppercase tracking-wider"
                            >
                                Add
                            </button>
                        </div>

                        {/* Filters Section */}
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Curriculum</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm"
                                        value={selectedCurriculum}
                                        onChange={(e) => setSelectedCurriculum(e.target.value)}
                                    >
                                        <option value="">Select Curriculum</option>
                                        {curriculums.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Term</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm"
                                        value={selectedTerm}
                                        onChange={(e) => setSelectedTerm(e.target.value)}
                                        disabled={!selectedCurriculum}
                                    >
                                        <option value="">Select Term</option>
                                        {terms.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Course</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm"
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        disabled={!selectedCurriculum}
                                    >
                                        <option value="">Select Course</option>
                                        {courses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Table Controls */}
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-1 gap-4">
                            <div className="flex items-center text-sm text-gray-700 w-full md:w-1/3">
                                <span>Show</span>
                                <select
                                    className="mx-2 block w-16 px-2 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border shadow-sm"
                                    value={entries}
                                    onChange={(e) => {
                                        setEntries(Number(e.target.value));
                                        setPage(1);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>entries</span>
                            </div>

                            <div className="flex justify-center items-center w-full md:w-1/3 font-bold text-red-600 text-[13px]">
                                Review Status : Completed
                            </div>

                            <div className="flex items-center justify-end gap-2 w-full md:w-1/3">
                                <label className="text-sm text-gray-700 font-medium">Search:</label>
                                <input
                                    type="text"
                                    placeholder="Search Topic Title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm 
                                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                             outline-none w-full md:w-64 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="overflow-x-auto mb-6 border border-gray-300 rounded-lg shadow-sm">
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                                    <tr>
                                        <th className="border border-gray-300 px-4 py-3 text-left font-bold">Topic Code</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left font-bold">Topic Title</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left font-bold">Topic Content</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center font-bold">Hours</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left font-bold">Topic Delivery Method</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center font-bold">Actions</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center font-bold">TLOs</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center font-bold">Lesson Schedule</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center font-bold">TLO to CO Mapping</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        if (topics.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={9} className="text-center py-12 text-gray-500 bg-gray-50 italic">
                                                        {loading ? "Loading topics..." : selectedCourse ? "No topics found for this course." : "Please select filters to view topics."}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        if (filteredTopics.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={9} className="text-center py-12 text-gray-500 bg-gray-50 italic">
                                                        No topics found matching "{searchTerm}"
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        const start = (page - 1) * entries;
                                        const paginatedTopics = filteredTopics.slice(start, start + entries);

                                        return paginatedTopics.map((topic, idx) => (
                                            <tr key={topic.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-600">{topic.topic_code}</td>
                                                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800">{topic.title}</td>
                                                <td className="border border-gray-300 px-4 py-3 text-gray-600 truncate max-w-xs" title={stripHtml(topic.content)}>{stripHtml(topic.content)}</td>
                                                <td className="border border-gray-300 px-4 py-3 text-center">{topic.hours}</td>
                                                <td className="border border-gray-300 px-4 py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        {topic.deliveryMethods.map(m => (
                                                            <span key={m} className="text-[11px] text-gray-700 leading-5">
                                                                {m}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="border border-gray-300 px-4 py-3">
                                                    <div className="flex justify-center gap-3">
                                                        <button onClick={() => handleEditClick(topic)} className="text-orange-500 hover:text-orange-700 transition-colors" title="Edit Topic">
                                                            <FaPencilAlt className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(topic.id)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete Topic">
                                                            <FaTrashAlt className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="border border-gray-300 px-4 py-3 text-center">
                                                    <div className="flex flex-col gap-1 text-[10px]">
                                                        <button onClick={() => handleAddEditTLO(topic)} className="text-blue-600 hover:underline font-bold">Add/Edit</button>
                                                        <button onClick={() => handleViewTLO(topic)} className="text-green-600 hover:underline font-bold">View</button>
                                                    </div>
                                                </td>
                                                <td className="border border-gray-300 px-4 py-3 text-center text-[10px] font-bold">
                                                    <button onClick={() => handleLessonSchedule(topic)} className="text-blue-600 hover:underline">Add/Edit LS</button>
                                                </td>
                                                <td className="border border-gray-300 px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleMappingClick(topic)}
                                                        className={`w-32 py-1 rounded-md text-[10px] font-bold text-white transition-colors text-center ${topic.mappingStatus === 'mapped' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'
                                                            }`}
                                                    >
                                                        {topic.mappingStatus === 'mapped' ? 'TLO to CO Mapping' : 'Pending'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Section */}
                        <div className="flex justify-between items-center mt-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{filteredTopics.length ? (page - 1) * entries + 1 : 0}</span> to{" "}
                                <span className="font-medium">{Math.min(page * entries, filteredTopics.length)}</span> of{" "}
                                <span className="font-medium">{filteredTopics.length}</span> entries
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page * entries >= filteredTopics.length}
                                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                        {/* Bottom Section */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-100">
                            <div className="text-sm text-gray-600 italic">
                                "Once addition of all Topics in this Course is finished"
                                <button
                                    onClick={handleSubmitPublishClick}
                                    disabled={publishStatus === "published"}
                                    title={publishStatus === "published" ? "Course is already published" : (!isFormComplete ? "Please select Curriculum, Term and Course" : "")}
                                    className={`ml-4 px-4 py-1.5 text-white rounded-md text-xs font-bold transition-all shadow-md ${publishStatus === "published"
                                        ? "bg-gray-400 cursor-not-allowed opacity-70"
                                        : "bg-green-600 hover:bg-green-700"
                                        }`}
                                >
                                    Submit to Publish
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleCourseUtilization()}
                                    className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 text-sm font-bold transition-all flex items-center gap-2"
                                >
                                    <FaExternalLinkAlt className="w-3 h-3" />
                                    Course Utilization
                                </button>
                                <button
                                    onClick={handleAddClick}
                                    className="px-6 py-2 bg-[#4a8494] text-white rounded-md hover:bg-[#3a6a78] text-sm font-bold shadow-md flex items-center gap-2"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </>
                ) : view === "tlo" ? (
                    <TLOManager
                        topic={tloAddEditTopic}
                        curriculumLabel={curriculums.find(c => String(c.value) === selectedCurriculum)?.label ?? ""}
                        termLabel={terms.find(t => String(t.value) === selectedTerm)?.label ?? ""}
                        courseLabel={courses.find(c => String(c.value) === selectedCourse)?.label ?? ""}
                        tloList={tloAddEditList}
                        setTloList={setTloAddEditList}
                        editingTLO={editingTLO}
                        setEditingTLO={setEditingTLO}
                        formData={tloAddEditForm}
                        setFormData={setTloAddEditForm}
                        onClose={() => setView("list")}
                    />
                ) : view === "lessonSchedule" ? (
                    <LessonScheduleManager
                        topic={lsTopic}
                        curriculumLabel={selectedCrclmLabel}
                        termLabel={selectedTermLabel}
                        courseLabel={selectedCourseLabel}
                        lessonScheduleList={lsList}
                        tloList={tloAddEditList}
                        setLessonScheduleList={setLsList}
                        onClose={() => setView("list")}
                    />
                ) : view === "courseUtilization" ? (
                    <CourseUtilizationManager
                        topic={courseUtilizationTopic}
                        curriculumLabel={selectedCrclmLabel}
                        termLabel={selectedTermLabel}
                        courseLabel={selectedCourseLabel}
                        topics={topics}
                        onClose={() => setView("list")}
                        initialBooks={cuBooks}
                        initialAssessments={cuAssessments}
                        initialShowTable={cuShowTable}
                        initialData={cuData}
                        onSave={(books, assessments, showTable, data) => {
                            setCuBooks(books);
                            setCuAssessments(assessments);
                            setCuShowTable(showTable);
                            setCuData(data);
                        }}
                    />
                ) : view === "tloCoMapping" ? (
                    <TLOCoMappingManager
                        curriculumLabel={selectedCrclmLabel}
                        termLabel={selectedTermLabel}
                        courseLabel={selectedCourseLabel}
                        courseId={Number(selectedCourse)}
                        topics={topics}
                        selectedTopicId={mappingTopic?.id || null}
                        tloList={[]}
                        onClose={() => setView("list")}
                        onSaveMapping={handleSaveMapping}
                    />
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {/* 2️⃣ ADD/EDIT FORM VIEW */}
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {view === "add" ? "Add Topic" : "Edit Topic"}
                            </h3>
                            <button
                                onClick={() => setView("list")}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Readonly Info */}
                        <div className="flex flex-col md:flex-row gap-8 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Curriculum :</span>
                                <span className="text-sm font-semibold text-blue-700">{selectedCrclmLabel}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Term :</span>
                                <span className="text-sm font-semibold text-blue-700">{selectedTermLabel}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Course :</span>
                                <span className="text-sm font-semibold text-blue-700">{selectedCourseLabel}</span>
                            </div>
                        </div>

                        {/* SECTION 1 — Existing Topics Table Control */}
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="flex items-center gap-2 text-xs text-gray-700">
                                <span>Show</span>
                                <select
                                    className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    value={formEntries}
                                    onChange={(e) => { setFormEntries(Number(e.target.value)); setFormPage(1); }}
                                >
                                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span>entries</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-700">
                                <span>Search:</span>
                                <input
                                    type="text"
                                    className="border border-gray-300 rounded px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 w-48"
                                    placeholder="Search topic title or code..."
                                    value={formSearchTerm}
                                    onChange={(e) => { setFormSearchTerm(e.target.value); setFormPage(1); }}
                                />
                            </div>
                        </div>

                        {/* SECTION 1 — Existing Topics Table */}
                        <div className="mb-4 overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
                            <table className="w-full border-collapse text-xs">
                                <thead className="bg-gray-100 text-gray-700 uppercase">
                                    <tr>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Topic Code</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Topic Title</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Topic Content</th>
                                        <th className="border border-gray-300 px-3 py-2 text-center">Topic Hours</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Topic Delivery Methods</th>
                                        <th className="border border-gray-300 px-3 py-2 text-center">Edit</th>
                                        <th className="border border-gray-300 px-3 py-2 text-center">Delete</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        if (paginatedFormTopics.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-4 text-gray-500 italic">No data available in table</td>
                                                </tr>
                                            );
                                        }

                                        // Group by Unit
                                        const grouped: { [key: string]: Topic[] } = {};
                                        paginatedFormTopics.forEach(t => {
                                            if (!grouped[t.unit]) grouped[t.unit] = [];
                                            grouped[t.unit].push(t);
                                        });

                                        return Object.keys(grouped).map(unitLabel => (
                                            <React.Fragment key={unitLabel}>
                                                <tr className="bg-gray-100 font-bold border-y border-gray-300">
                                                    <td colSpan={7} className="px-3 py-1.5 text-gray-700 text-[10px] uppercase tracking-wider">{unitLabel}</td>
                                                </tr>
                                                {grouped[unitLabel].map(topic => (
                                                    <tr key={topic.id} className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
                                                        <td className="border border-gray-300 px-3 py-2 text-gray-600 font-medium">Topic {topic.sl_no}</td>
                                                        <td className="border border-gray-300 px-3 py-2 font-medium">
                                                            {topic.sl_no}. {topic.title}
                                                        </td>
                                                        <td className="border border-gray-300 px-3 py-2 text-gray-500 max-w-xs truncate" title={stripHtml(topic.content)}>{stripHtml(topic.content)}</td>
                                                        <td className="border border-gray-300 px-3 py-2 text-center">{topic.hours.toFixed(2)}</td>
                                                        <td className="border border-gray-300 px-3 py-2">
                                                            <div className="flex flex-col gap-0.5">
                                                                {topic.deliveryMethods.map(m => (
                                                                    <span key={m} className="text-[10px] text-gray-600">• {m}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-300 px-3 py-2 text-center">
                                                            <button onClick={() => handleEditClick(topic)} className="text-orange-500 hover:text-orange-700 transition-colors" title="Edit Topic">
                                                                <FaPencilAlt className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                        <td className="border border-gray-300 px-3 py-2 text-center">
                                                            <button onClick={() => handleDeleteClick(topic.id)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete Topic">
                                                                <FaTrashAlt className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-500 mb-8 px-1">
                            <div>
                                Showing {filteredFormTopics.length === 0 ? 0 : (formPage - 1) * formEntries + 1} to {Math.min(formPage * formEntries, filteredFormTopics.length)} of {filteredFormTopics.length} entries
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    disabled={formPage === 1}
                                    onClick={() => setFormPage(prev => prev - 1)}
                                >
                                    &larr; Previous
                                </button>
                                <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded font-bold shadow-sm shadow-blue-200">{formPage}</span>
                                <button
                                    className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    disabled={formPage * formEntries >= filteredFormTopics.length}
                                    onClick={() => setFormPage(prev => prev + 1)}
                                >
                                    Next &rarr;
                                </button>
                            </div>
                        </div>

                        {/* SECTION 2 — Add Topic Form */}
                        <div className="space-y-5 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            {/* Row 1: Topic Unit */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <label className="md:col-span-2 text-sm font-bold text-gray-700">Topic Units <span className="text-red-500">*</span> :</label>
                                <div className="md:col-span-4">
                                    <select
                                        className={`w-full px-3 py-1.5 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none ${
                                            formErrors.unit_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        value={formData.unit_id}
                                        onChange={(e) => {
                                            setFormData({ ...formData, unit_id: Number(e.target.value) });
                                            setFormErrors(prev => ({ ...prev, unit_id: '' }));
                                        }}
                                    >
                                        <option value={0}>Select Unit</option>
                                        {units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                    </select>
                                    {formErrors.unit_id && <p className="text-red-500 text-xs mt-1">{formErrors.unit_id}</p>}
                                </div>
                            </div>

                            {/* Row 2: Sl No. & Topic Title */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <label className="md:col-span-2 text-sm font-bold text-gray-700">Sl No. & Topic Title <span className="text-red-500">*</span> :</label>
                                <div className="md:col-span-10 flex gap-2">
                                    <div className="flex flex-col">
                                        <input
                                            type="text"
                                            className={`w-20 px-3 py-1.5 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none ${
                                                formErrors.sl_no ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            value={formData.sl_no}
                                            onChange={(e) => {
                                                setFormData({ ...formData, sl_no: e.target.value });
                                                setFormErrors(prev => ({ ...prev, sl_no: '' }));
                                            }}
                                            placeholder="Sl No"
                                        />
                                        {formErrors.sl_no && <p className="text-red-500 text-xs mt-1">{formErrors.sl_no}</p>}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <input
                                            type="text"
                                            className={`w-full px-3 py-1.5 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none ${
                                                formErrors.title ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            value={formData.title}
                                            onChange={(e) => {
                                                setFormData({ ...formData, title: e.target.value });
                                                setFormErrors(prev => ({ ...prev, title: '' }));
                                            }}
                                            placeholder="Topic Title"
                                        />
                                        {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Duration & Delivery Method */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                <label className="md:col-span-2 text-sm font-bold text-gray-700 mt-1.5">Duration in Hrs <span className="text-red-500">*</span> :</label>
                                <div className="md:col-span-3">
                                    <input
                                        type="text"
                                        className={`w-full px-3 py-1.5 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none ${
                                            formErrors.hours ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        value={formData.hours}
                                        onChange={(e) => {
                                            setFormData({ ...formData, hours: e.target.value });
                                            setFormErrors(prev => ({ ...prev, hours: '' }));
                                        }}
                                        placeholder="Ex: 3.5"
                                    />
                                    {formErrors.hours && <p className="text-red-500 text-xs mt-1">{formErrors.hours}</p>}
                                </div>
                                <label className="md:col-span-2 md:text-right text-sm font-bold text-gray-700 mt-1.5">Delivery Method :</label>
                                <div className="md:col-span-5 flex flex-col gap-1" ref={deliveryDropdownRef}>
                                    {/* Trigger button */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryDropdownOpen(prev => !prev)}
                                            className={`w-full flex items-center justify-between px-3 py-1.5 border rounded text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none ${
                                                formErrors.deliveryMethods ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        >
                                            <span className="text-gray-500 truncate">
                                                {formData.deliveryMethods.length === 0
                                                    ? "Select Delivery Method"
                                                    : `${formData.deliveryMethods.length} selected`}
                                            </span>
                                            <svg className="w-4 h-4 text-gray-500 flex-shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Dropdown panel */}
                                        {deliveryDropdownOpen && (
                                            <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                                                {/* Select All */}
                                                <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                                                    <input
                                                        type="checkbox"
                                                        className="accent-blue-600"
                                                        checked={formData.deliveryMethods.length === deliveryMethods.length && deliveryMethods.length > 0}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData(prev => ({ ...prev, deliveryMethods: deliveryMethods.map((m: any) => m.value) }));
                                                            } else {
                                                                setFormData(prev => ({ ...prev, deliveryMethods: [] }));
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700">Select All</span>
                                                </label>
                                                {/* Individual options */}
                                                {deliveryMethods.map((m: any) => (
                                                    <label key={m.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="accent-blue-600"
                                                            checked={formData.deliveryMethods.includes(m.value)}
                                                            onChange={() => handleDeliveryMethodChange(m.value)}
                                                        />
                                                        <span className="text-sm text-gray-700">{m.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected chips — stacked below the button, within the same column */}
                                    {formData.deliveryMethods.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {formData.deliveryMethods.map(m => (
                                                <span key={m} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200 flex items-center gap-1">
                                                    {m}
                                                    <FaTimes className="cursor-pointer hover:text-red-500" onClick={() => {
                                                        handleDeliveryMethodChange(m);
                                                        setFormErrors(prev => ({ ...prev, deliveryMethods: '' }));
                                                    }} />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {formErrors.deliveryMethods && <p className="text-red-500 text-xs mt-1">{formErrors.deliveryMethods}</p>}
                                </div>
                            </div>

                            {/* Row 4: Topic Content */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Topic Content <span className="text-red-500">*</span> :</label>
                                {formErrors.content && <p className="text-red-500 text-xs">{formErrors.content}</p>}
                                {/* CKEditor 5 Rich Text Editor */}
                                <div className="mt-2 topic-content-editor">
                                    <Editor
                                        apiKey="no-api-key"
                                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                                        value={formData.content}
                                        onEditorChange={(content: string) =>
                                            setFormData({ ...formData, content })
                                        }
                                        init={{
                                            height: 350,
                                            menubar: "file edit insert view format table tools",
                                            plugins: [
                                                "advlist",
                                                "autolink",
                                                "lists",
                                                "link",
                                                "image",
                                                "charmap",
                                                "preview",
                                                "anchor",
                                                "searchreplace",
                                                "visualblocks",
                                                "code",
                                                "fullscreen",
                                                "insertdatetime",
                                                "media",
                                                "table",
                                                "help",
                                                "wordcount"
                                            ],
                                            toolbar:
                                                "undo redo | formatselect | bold italic underline | " +
                                                "alignleft aligncenter alignright alignjustify | " +
                                                "bullist numlist outdent indent | " +
                                                "link image media | table | code fullscreen",
                                            content_style:
                                                "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                                            branding: false,
                                            promotion: false,
                                            statusbar: true,
                                            elementpath: true,
                                            resize: true
                                        }}
                                    />
                                    <style>{`
                                        .topic-content-editor .tox-editor-container {
                                            overflow: visible !important;
                                        }
                                        .topic-content-editor .tox-statusbar {
                                            display: flex !important;
                                            justify-content: space-between;
                                        }
                                        .topic-content-editor .tox-editor-header {
                                            border-bottom: 1px solid #ddd;
                                        }
                                        .topic-content-editor {
                                            margin-bottom: 2rem;
                                        }
                                    `}</style>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3 — Action Buttons */}
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-5 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
                            >
                                <FaSave className="w-3 h-3" />
                                {loading ? "Saving..." : (view === "add" ? "Save" : "Update")}
                            </button>
                            <button
                                onClick={() => setView("list")}
                                className="px-5 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 shadow-sm"
                            >
                                <FaTimes className="w-3 h-3" />
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* ===== TLO VIEW MODAL ===== */}
            {showTLOModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 backdrop-blur-[2px]">
                    <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-4xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <FaExternalLinkAlt className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 tracking-tight">
                                    Topic Learning Outcomes List
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowTLOModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                                aria-label="Close modal"
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* Topic name context */}
                            <div className="mb-6 bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mr-2">Topic :</span>
                                <h4 className="text-sm font-bold text-gray-800">
                                    {tloTopic?.title}
                                </h4>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="bg-[#f8fafc] text-gray-600 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider">TLOs Code</th>
                                            <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider">Session Learning Outcomes</th>
                                            <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider">Bloom's Level</th>
                                            <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider">Delivery Method</th>
                                            <th className="px-5 py-3 text-left font-bold text-xs uppercase tracking-wider">Delivery Approach</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {tloList.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-10 text-gray-500 italic text-sm">
                                                    No learning outcomes found for this topic.
                                                </td>
                                            </tr>
                                        ) : (
                                            tloList
                                                .slice((tloPage - 1) * TLO_PAGE_SIZE, tloPage * TLO_PAGE_SIZE)
                                                .map((tlo, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-4 py-3.5 font-bold text-blue-600">{tlo.code}</td>
                                                        <td className="px-4 py-3.5 text-gray-700 leading-relaxed">
                                                            {stripHtml(tlo.outcome)}
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-[11px] font-bold border border-teal-100">
                                                                {tlo.bloom}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-gray-700">{tlo.deliveryMethod}</td>
                                                        <td className="px-5 py-3.5 text-gray-600 font-medium italic">{tlo.deliveryApproach || "—"}</td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination info + controls */}
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 text-xs font-medium text-gray-500 bg-white p-2 rounded-lg">
                                <span>
                                    Showing <span className="text-gray-900 font-bold">{tloList.length === 0 ? 0 : (tloPage - 1) * TLO_PAGE_SIZE + 1}</span> to{" "}
                                    <span className="text-gray-900 font-bold">{Math.min(tloPage * TLO_PAGE_SIZE, tloList.length)}</span> of <span className="text-gray-900 font-bold">{tloList.length}</span> entries
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setTloPage(p => p - 1)}
                                        disabled={tloPage === 1}
                                        className="h-8 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                                    >
                                        ← Previous
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-8 w-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm shadow-blue-200">
                                            {tloPage}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setTloPage(p => p + 1)}
                                        disabled={tloPage * TLO_PAGE_SIZE >= tloList.length}
                                        className="h-8 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <button
                                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold text-sm px-6 py-2 rounded-lg transition-all shadow-sm"
                                onClick={() => setShowTLOModal(false)}
                            >
                                <FaTimes className="w-3.5 h-3.5" /> Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showWarning && (
                <WarningModal
                    title="Warning"
                    message="Select all the drop-downs."
                    onClose={() => setShowWarning(false)}
                />
            )}

            {showPublishModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-down border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Course Delivery Planning Publish Confirmation</h3>
                            <button className="text-gray-400 hover:text-gray-500 transition-colors" onClick={() => setShowPublishModal(false)}>
                                <FaTimes className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 bg-white text-sm text-gray-800 space-y-4">
                            <p><strong>Current step :</strong> Addition of all Topics has been completed.</p>
                            <p><strong>Next step :</strong> Mapping between TLOs and COs.</p>
                            <p className="font-bold text-orange-600">An email will be sent to Course Owner.</p>
                            <p className="pt-2 text-gray-600">Are you sure you want to release this Course for the Delivery Planning Phase?</p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                className="bg-blue-600 text-white font-medium px-6 py-2 rounded hover:bg-blue-700 transition-colors shadow-sm"
                                onClick={handleConfirmPublish}
                            >
                                Ok
                            </button>
                            <button
                                className="bg-red-600 text-white font-medium px-6 py-2 rounded hover:bg-red-700 transition-colors shadow-sm"
                                onClick={() => setShowPublishModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddMoreModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-down border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Add More Topics Confirmation</h3>
                            <button className="text-gray-400 hover:text-gray-500 transition-colors" onClick={() => setShowAddMoreModal(false)}>
                                <FaTimes className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 bg-white text-sm text-gray-800 space-y-4">
                            <p>You have already completed the addition of all the Topics under this Course.</p>
                            <p>Do you want to add more TLOs?</p>
                            <p>If yes, you should re-confirm completion by clicking Submit again after addition of new TLOs.</p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                className="bg-blue-600 text-white font-medium px-6 py-2 rounded hover:bg-blue-700 transition-colors shadow-sm"
                                onClick={handleConfirmAddMoreTopics}
                            >
                                Ok
                            </button>
                            <button
                                className="bg-red-600 text-white font-medium px-6 py-2 rounded hover:bg-red-700 transition-colors shadow-sm"
                                onClick={() => setShowAddMoreModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMappingModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all border border-slate-100/50">
                        {/* Premium Header */}
                        <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-50 rounded-lg">
                                    <FaQuestionCircle className="w-5 h-5 text-teal-600" />
                                </div>
                                <h3 className="text-[1.05rem] font-bold text-slate-800 tracking-wide">
                                    Lesson Schedule & Review Questions Confirmation
                                </h3>
                            </div>
                            <button
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors duration-200"
                                onClick={() => setShowMappingModal(false)}
                            >
                                <FaTimes className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 bg-white text-[15px] text-[#555] space-y-6">
                            <p>Lesson Schedule & Review Questions process needs to be completed.</p>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span>Click on</span>
                                    <span className="bg-[#337ab7] text-white px-2 py-1 rounded text-[14px] font-bold inline-flex items-center gap-1.5 shadow-sm"><FaCheck className="w-3 h-3" /> Ok</span>
                                </div>
                                <p className="text-[#666]">
                                    (If you have completed & proceed for TLO to CO Mapping).
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span>Click on</span>
                                    <span className="bg-[#d9534f] text-white px-2 py-1 rounded text-[14px] font-bold inline-flex items-center gap-1.5 shadow-sm"><FaTimes className="w-3 h-3" /> Cancel</span>
                                </div>
                                <p className="text-[#666] leading-relaxed">
                                    (If not completed make sure that you have defined the Lesson Schedule & then proceed for TLO to CO Mapping).
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                            <button
                                className="px-5 py-2 rounded font-bold text-white bg-[#286090] hover:bg-[#204d74] shadow-sm transition-colors flex items-center gap-2"
                                onClick={handleConfirmMapping}
                            >
                                <FaCheck className="w-3.5 h-3.5" /> Ok
                            </button>
                            <button
                                className="px-5 py-2 rounded font-bold text-white bg-[#d9534f] hover:bg-[#c9302c] shadow-sm transition-colors flex items-center gap-2"
                                onClick={handleCancelMapping}
                            >
                                <FaTimes className="w-3.5 h-3.5" /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />
        </div>
    );
};

export default ManageTopicsPage;
