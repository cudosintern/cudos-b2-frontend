import React, { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "react-toastify";
import {
    FaPencilAlt,
    FaTrashAlt,
    FaSave,
    FaTimes,
    FaPlus,
    FaExternalLinkAlt,
    FaRegQuestionCircle,
    FaCalendarAlt,
    FaBook,
} from "react-icons/fa";
import { Topic } from "./types";
import {
    LessonScheduleRecord,
    TLORecord,
    QuestionRecord,
    createLessonSchedule,
    updateLessonSchedule,
    deleteLessonSchedule,
    createAssignmentQuestion,
    fetchAssignmentQuestions,
    deleteAssignmentQuestion,
    importAssignmentQuestions,
    searchQuestionBankQuestions,
} from "./manageTopicsApi";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import QuestionBankModal from "./QuestionBankModal";


interface LessonScheduleManagerProps {
    topic: Topic | null;
    curriculumLabel: string;
    termLabel: string;
    courseLabel: string;
    lessonScheduleList: LessonScheduleRecord[];
    tloList: TLORecord[];
    setLessonScheduleList: React.Dispatch<React.SetStateAction<LessonScheduleRecord[]>>;
    onClose: () => void;
    // Context IDs required by backend for create/update
    curriculumId?: number;
    termId?: number;
    courseId?: number;
}

const BLOOM_LEVELS = [
    "L1-Remembering", "L2-Understanding", "L3-Applying",
    "L4-Analyzing", "L5-Evaluating", "L6-Creating"
];

const QUESTION_TYPES = ["Review", "Assignment / Exercise"];

const LessonScheduleManager: React.FC<LessonScheduleManagerProps> = ({
    topic, curriculumLabel, termLabel, courseLabel,
    lessonScheduleList, tloList, setLessonScheduleList, onClose,
    curriculumId = 0, termId = 0, courseId = 0
}) => {
    const [loading, setLoading] = useState(false);

    // Lesson Form State
    const [lessonForm, setLessonForm] = useState<LessonScheduleRecord>({
        lectureNo: (lessonScheduleList.length + 1),
        portion: "",
        plannedDate: "",
        actualDate: ""
    });
    const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

    // Pagination & Search State for Lesson Schedule
    const [lsEntries, setLsEntries] = useState(20);
    const [lsSearch, setLsSearch] = useState("");
    const [lsPage, setLsPage] = useState(1);

    // Filter and Page Logic
    const filteredLessons = lessonScheduleList.filter(l =>
        l.portion.toLowerCase().includes(lsSearch.toLowerCase()) ||
        String(l.lectureNo).includes(lsSearch)
    );

    const pagedLessons = filteredLessons.slice((lsPage - 1) * lsEntries, lsPage * lsEntries);

    // Question State
    const [questionList, setQuestionList] = useState<QuestionRecord[]>([]);
    const [questionsLoaded, setQuestionsLoaded] = useState<number | null>(null);
    const [questionForm, setQuestionForm] = useState({
        type: "Review",
        tlos: "", // This will store TLO ID as string
        bloom: "",
        piCodes: "",
        question: ""
    });
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
    const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);

    // Fetch existing questions when topic changes
    React.useEffect(() => {
        if (!topic?.id || topic.id === questionsLoaded) return;
        fetchAssignmentQuestions(topic.id).then(list => {
            setQuestionList(list);
            setQuestionsLoaded(topic.id);
        });
    }, [topic?.id]);

    // Section Visibility State
    const [hideSchedule, setHideSchedule] = useState(false);
    const [hideQuestions, setHideQuestions] = useState(false);

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { }
    });


    // Lesson Handlers
    const handleSaveLesson = async () => {
        if (!lessonForm.portion) { toast.warning("Please enter portion."); return; }
        if (!lessonForm.plannedDate) { toast.warning("Planned Delivery date is required."); return; }
        if (!lessonForm.actualDate) { toast.warning("Actual Delivery date is required."); return; }
        if (!topic) return;

        setLoading(true);
        try {
            // Backend requires: portion_per_hour, academic_batch_id, semester_id, crs_id, topic_id
            // Optional: portion_ref (lecture number as string), conduction_date, actual_delivery_date
            const payload = {
                topic_id: topic.id,
                portion_per_hour: lessonForm.portion,
                portion_ref: String(lessonForm.lectureNo),
                academic_batch_id: topic.academic_batch_id ?? curriculumId,
                semester_id: topic.semester_id ?? termId,
                crs_id: topic.crs_id ?? courseId,
                conduction_date: lessonForm.plannedDate || undefined,
                actual_delivery_date: lessonForm.actualDate || undefined,
            };

            if (editingLessonId !== null) {
                const updated = await updateLessonSchedule(editingLessonId, payload);
                setLessonScheduleList(prev => prev.map(l => l.id === editingLessonId ? updated : l));
                setEditingLessonId(null);
                toast.success("Lesson updated successfully");
            } else {
                const newLesson = await createLessonSchedule(payload);
                setLessonScheduleList(prev => [...prev, newLesson]);
                toast.success("Lesson added successfully");
            }
            setLessonForm({ lectureNo: lessonScheduleList.length + 2, portion: "", plannedDate: "", actualDate: "" });
        } catch (err: any) {
            console.error("Save lesson failed:", err);
            const msg = err?.response?.data?.message || err?.message || "Failed to save lesson schedule";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleEditLesson = (lesson: LessonScheduleRecord) => {
        setLessonForm(lesson);
        setEditingLessonId(lesson.id || null);
    };

    const handleDeleteLesson = (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Delete",
            message: "Are you sure that you want to delete this lesson schedule? Once deleted, data cannot be retrieved back.",
            onConfirm: async () => {
                setLoading(true);
                try {
                    await deleteLessonSchedule(id);
                    setLessonScheduleList(prev => prev.filter(l => l.id !== id));
                    toast.success("Lesson deleted successfully!");
                } catch (err) {
                    console.error("Delete failed:", err);
                    toast.error("Failed to delete lesson");
                } finally {
                    setLoading(false);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    // Question Handlers
    const handleSaveQuestion = async () => {
        if (!questionForm.question) { toast.warning("Please enter a question."); return; }
        if (!topic) return;

        setLoading(true);
        try {
            // Find selected TLO object to get its code for local display
            const selectedTlo = tloList.find(t => String(t.id) === questionForm.tlos);

            const payload = {
                topic_id: topic.id,
                academic_batch_id: topic.academic_batch_id ?? curriculumId,
                semester_id: topic.semester_id ?? termId,
                crs_id: topic.crs_id ?? courseId,
                tlo_id: questionForm.tlos ? Number(questionForm.tlos) : null,
                question: questionForm.question,
                bloom_level: questionForm.bloom,
                type: questionForm.type,
                pi_code: questionForm.piCodes
            };

            if (editingQuestionId !== null) {
                // For now backend might not have update-question, but let's assume create for now 
                // as per user instructions focus was on creation
                toast.info("Edit functionality for questions not yet implemented in backend.");
            } else {
                const res = await createAssignmentQuestion(payload);
                const newQuestion: QuestionRecord = {
                    id: res.question_id ?? res.id ?? Date.now(),
                    type: questionForm.type,
                    question: questionForm.question,
                    tlos: selectedTlo?.code || questionForm.tlos,
                    bloom: questionForm.bloom,
                    piCodes: questionForm.piCodes,
                };
                setQuestionList((prev: QuestionRecord[]) => [...prev, newQuestion]);
                toast.success("Question added successfully");
            }
            setQuestionForm({ type: "Review", tlos: "", bloom: "", piCodes: "", question: "" });
        } catch (err) {
            console.error("Save question failed:", err);
            toast.error("Failed to save question");
        } finally {
            setLoading(false);
        }
    };

    const handleEditQuestion = (q: QuestionRecord) => {
        // TLO in state might be code, need to find ID
        const tloObj = tloList.find(t => t.code === q.tlos);
        setQuestionForm({
            type: q.type,
            tlos: tloObj ? String(tloObj.id) : q.tlos,
            bloom: q.bloom,
            piCodes: q.piCodes,
            question: q.question
        });
        setEditingQuestionId(q.id);
    };

    const handleDeleteQuestion = (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Delete",
            message: "Are you sure that you want to delete this question? Once deleted, data cannot be retrieved back.",
            onConfirm: async () => {
                setLoading(true);
                try {
                    await deleteAssignmentQuestion(id);
                    setQuestionList((prev: QuestionRecord[]) => prev.filter((q: QuestionRecord) => q.id !== id));
                    toast.success("Question deleted successfully!");
                } catch {
                    toast.error("Failed to delete question");
                } finally {
                    setLoading(false);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleImportQuestions = async (questionIds: number[]) => {
        if (!topic) return;

        setLoading(true);
        try {
            const result = await importAssignmentQuestions({
                question_ids: questionIds,
                target_topic_id: topic.id,
                target_academic_batch_id: topic.academic_batch_id ?? curriculumId,
                target_semester_id: topic.semester_id ?? termId,
                target_crs_id: topic.crs_id ?? courseId,
                target_tlo_id: questionForm.tlos ? Number(questionForm.tlos) : null,
            });

            const refreshedList = await fetchAssignmentQuestions(topic.id);
            setQuestionList(refreshedList);

            if (result?.imported_count) {
                toast.success(`Imported ${result.imported_count} question${result.imported_count > 1 ? "s" : ""} successfully`);
            }
            if (result?.skipped_count) {
                toast.info(`${result.skipped_count} duplicate or invalid question${result.skipped_count > 1 ? "s were" : " was"} skipped`);
            }
        } catch (err: any) {
            console.error("Import question failed:", err);
            toast.error(err?.response?.data?.message || "Failed to import questions");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 ${loading ? 'opacity-70 pointer-events-none' : ''}`}>

            {/* 1️⃣ MAIN WRAPPER */}
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">

                {/* Header */}
                <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800 tracking-tight">
                            Lesson Schedule Management
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        aria-label="Close"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">

                    {/* Section 1: Chapter Wise Plan */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FaBook className="text-blue-600 w-4 h-4" />
                            <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Chapter Wise Plan</h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Curriculum</label>
                                <div className="text-xs font-bold text-gray-700 truncate">{curriculumLabel}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Term</label>
                                <div className="text-xs font-bold text-gray-700 truncate">{termLabel}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Course</label>
                                <div className="text-xs font-bold text-gray-700 truncate">{courseLabel}</div>
                            </div>
                        </div>

                        {/* Topic Context Block */}
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mr-2">Topic :</span>
                            <h4 className="text-sm font-bold text-gray-800">
                                {topic?.title}
                            </h4>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="grid grid-cols-12 bg-[#f8fafc] border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                                <div className="col-span-10 px-4 py-3 border-r border-gray-200">Lesson Contents</div>
                                <div className="col-span-2 px-4 py-3 text-center">Topic Hours</div>
                            </div>
                            <div className="grid grid-cols-12 text-sm">
                                <div className="col-span-10 px-4 py-4 border-r border-gray-200 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: topic?.content || "" }} />
                                <div className="col-span-2 px-4 py-4 text-center flex items-center justify-center font-bold text-blue-600 text-base">
                                    {topic?.hours?.toFixed(2) || "0.00"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Lesson Schedule */}
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-indigo-600 w-4 h-4" />
                                <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Lesson Schedule</h5>
                            </div>
                            <button
                                onClick={() => setHideSchedule(!hideSchedule)}
                                className="h-9 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 border border-indigo-100/50 group"
                            >
                                <span className="text-base font-bold group-hover:scale-110 transition-transform leading-none">{hideSchedule ? "+" : "−"}</span> {hideSchedule ? "Show Schedule Table" : "Hide Schedule Table"}
                            </button>
                        </div>

                        {!hideSchedule && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                {/* Search & Entries */}
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-700">
                                        <span>Show</span>
                                        <select
                                            className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                            value={lsEntries}
                                            onChange={e => { setLsEntries(Number(e.target.value)); setLsPage(1); }}
                                        >
                                            {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                        <span>entries</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-700">
                                        <span>Search:</span>
                                        <input
                                            type="text"
                                            className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 w-48"
                                            value={lsSearch}
                                            onChange={e => { setLsSearch(e.target.value); setLsPage(1); }}
                                        />
                                    </div>
                                </div>

                                <div className="border border-gray-100 rounded-xl overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold text-gray-600 border-b">Sl. No.</th>
                                                <th className="px-4 py-3 text-left font-bold text-gray-600 border-b">Portion of the course to be covered</th>
                                                <th className="px-4 py-3 text-left font-bold text-gray-600 border-b">Planned Date</th>
                                                <th className="px-4 py-3 text-left font-bold text-gray-600 border-b">Actual Date</th>
                                                <th className="px-4 py-3 text-center font-bold text-gray-600 border-b">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {pagedLessons.length === 0 ? (
                                                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No records found</td></tr>
                                            ) : (
                                                pagedLessons.map((l, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50">
                                                        <td className="px-4 py-3 font-medium">{l.lectureNo}</td>
                                                        <td className="px-4 py-3 text-gray-600">{l.portion}</td>
                                                        <td className="px-4 py-3">{l.plannedDate || "—"}</td>
                                                        <td className="px-4 py-3">{l.actualDate || "—"}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={() => handleEditLesson(l)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors"><FaPencilAlt /></button>
                                                                <button onClick={() => l.id && handleDeleteLesson(l.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"><FaTrashAlt /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="flex justify-between items-center mt-6 px-4 py-3 bg-gray-50/30 border-t border-gray-100 rounded-b-xl">
                                    <div className="text-[11px] font-medium text-gray-500 italic">
                                        Showing <span className="text-gray-900 font-bold">{filteredLessons.length === 0 ? 0 : (lsPage - 1) * lsEntries + 1}</span> to <span className="text-gray-900 font-bold">{Math.min(lsPage * lsEntries, filteredLessons.length)}</span> of <span className="text-gray-900 font-bold">{filteredLessons.length}</span> entries
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            disabled={lsPage === 1}
                                            onClick={() => setLsPage(lsPage - 1)}
                                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            Previous
                                        </button>
                                        <div className="min-w-[32px] h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                                            {lsPage}
                                        </div>
                                        <button
                                            disabled={lsPage * lsEntries >= filteredLessons.length}
                                            onClick={() => setLsPage(lsPage + 1)}
                                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lesson Entry Form */}
                        <div className="mt-8 bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-6">
                            <h6 className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.15em] mb-2">Add / Edit Lesson Schedule</h6>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-6 items-start">
                                {/* Row 1: The 4 Fields */}
                                <div className="md:col-span-1.5 lg:col-span-2">
                                    <label className="block text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase mb-2 ml-0.5 whitespace-nowrap">Lecture No. <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white font-bold"
                                        value={lessonForm.lectureNo}
                                        onChange={e => setLessonForm({ ...lessonForm, lectureNo: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="md:col-span-4.5 lg:col-span-4">
                                    <label className="block text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase mb-2 ml-0.5 whitespace-nowrap">Portion to be covered per hour <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white placeholder:text-gray-300"
                                        placeholder="e.g. Introduction to logic gates"
                                        value={lessonForm.portion}
                                        onChange={e => setLessonForm({ ...lessonForm, portion: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase mb-2 ml-0.5 whitespace-nowrap">Planned Delivery date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white font-medium"
                                        value={lessonForm.plannedDate}
                                        onChange={e => setLessonForm({ ...lessonForm, plannedDate: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase mb-2 ml-0.5 whitespace-nowrap">Actual Delivery date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white font-medium"
                                        value={lessonForm.actualDate}
                                        onChange={e => setLessonForm({ ...lessonForm, actualDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Row 2: Actions */}
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                {editingLessonId !== null && (
                                    <button
                                        onClick={() => { setEditingLessonId(null); setLessonForm({ lectureNo: lessonScheduleList.length + 1, portion: "", plannedDate: "", actualDate: "" }); }}
                                        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                                    >
                                        <FaTimes /> Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveLesson}
                                    className={`px-8 py-2 ${editingLessonId !== null ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2`}
                                >
                                    {editingLessonId !== null ? <><FaPencilAlt /> Update</> : <><FaSave /> Save</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Questions */}
                    <div className="space-y-4 pt-6 border-t border-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <FaRegQuestionCircle className="text-teal-600 w-4 h-4" />
                                <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Review & Assignment Questions</h5>
                            </div>
                            <button
                                onClick={() => setHideQuestions(!hideQuestions)}
                                className="h-9 px-4 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 border border-teal-100/50 group"
                            >
                                <span className="text-base font-bold group-hover:scale-110 transition-transform leading-none">{hideQuestions ? "+" : "−"}</span> {hideQuestions ? "Show Questions Table" : "Hide Questions Table"}
                            </button>
                        </div>

                        {!hideQuestions && (
                            <div className="animate-in fade-in zoom-in-95 duration-300 border border-gray-100 rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold text-gray-600">Type</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-600">Learning Outcome</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-600">Question</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-600">Bloom's Level</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-600">PI Codes</th>
                                            <th className="px-4 py-3 text-center font-bold text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {questionList.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic">No questions added yet</td></tr>
                                        ) : (
                                            questionList.map((q: QuestionRecord) => (
                                                <tr key={q.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 font-medium text-teal-600">{q.type}</td>
                                                    <td className="px-4 py-3 font-bold">{q.tlos}</td>
                                                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" dangerouslySetInnerHTML={{ __html: q.question }} />
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-600">{q.bloom}</span>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-gray-500">{q.piCodes}</td>
                                                    <td className="px-4 py-3 text-center flex justify-center gap-2">
                                                        <button onClick={() => handleEditQuestion(q)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded"><FaPencilAlt /></button>
                                                        <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><FaTrashAlt /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Question Form */}
                        <div className="bg-teal-50/30 p-6 rounded-xl border border-teal-100/50 space-y-6">
                            <div className="flex items-center justify-between gap-3">
                                <h6 className="text-[11px] font-bold text-teal-700 uppercase tracking-[0.15em] flex items-center gap-2">
                                    <FaPlus className="w-3 h-3" /> {editingQuestionId !== null ? "Edit Question" : "Add New Question"}
                                </h6>
                                <button
                                    type="button"
                                    onClick={() => setIsQuestionBankOpen(true)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 shadow-md"
                                >
                                    <FaExternalLinkAlt className="w-3 h-3" />
                                    Import Question
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Type</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                        value={questionForm.type}
                                        onChange={e => setQuestionForm({ ...questionForm, type: e.target.value })}
                                    >
                                        {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Learning Outcome</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                        value={questionForm.tlos}
                                        onChange={e => setQuestionForm({ ...questionForm, tlos: e.target.value })}
                                    >
                                        <option value="">Select TLO</option>
                                        {tloList.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Bloom's Level</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                        value={questionForm.bloom}
                                        onChange={e => setQuestionForm({ ...questionForm, bloom: e.target.value })}
                                    >
                                        <option value="">Select Level</option>
                                        {BLOOM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">PI Codes</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white font-mono"
                                        placeholder="e.g. 01.1.2"
                                        value={questionForm.piCodes}
                                        onChange={e => setQuestionForm({ ...questionForm, piCodes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Question Content</label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden ring-offset-2 focus-within:ring-2 focus-within:ring-teal-500 transition-shadow bg-white">
                                    <Editor
                                        apiKey="no-api-key"
                                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                                        value={questionForm.question}
                                        onEditorChange={(content: string) => setQuestionForm({ ...questionForm, question: content })}
                                        init={{
                                            height: 180,
                                            menubar: false,
                                            branding: false,
                                            plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'],
                                            toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                                            content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    onClick={handleSaveQuestion}
                                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-teal-200/50 transition-all flex items-center gap-2"
                                >
                                    {editingQuestionId !== null ? <FaPencilAlt /> : <FaPlus />} {editingQuestionId !== null ? "Update Question" : "Add to Question List"}
                                </button>
                                {editingQuestionId !== null && (
                                    <button
                                        onClick={() => { setEditingQuestionId(null); setQuestionForm({ type: "Review", tlos: "", bloom: "", piCodes: "", question: "" }); }}
                                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={() => { toast.success("Changes saved! You can continue adding or editing records."); }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                    >
                        <FaSave /> Save
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-md flex items-center gap-2"
                    >
                        <FaTimes /> Close
                    </button>
                </div>

                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmDialog.onConfirm}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                />

                <QuestionBankModal
                    isOpen={isQuestionBankOpen}
                    onClose={() => setIsQuestionBankOpen(false)}
                    onImport={handleImportQuestions}
                    fetchQuestions={(courseName: string) => searchQuestionBankQuestions({ course_name: courseName })}
                />
            </div>
        </div>
    );
};

export default LessonScheduleManager;
