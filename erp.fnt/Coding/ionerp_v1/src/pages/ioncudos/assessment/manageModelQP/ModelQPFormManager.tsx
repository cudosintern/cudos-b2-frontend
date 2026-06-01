import React, { useState, useEffect, useMemo } from "react";
import { FaTrashAlt, FaPencilAlt } from "react-icons/fa";
import {
    PieChart,
    Pie,
    Tooltip,
    Legend,
    Cell,
    ResponsiveContainer
} from "recharts";
import {
    fetchFramework,
    fetchQPContext,
    fetchCOs,
    fetchBloomLevels,
    fetchPIByCO,
    saveDraftQP,
    submitQP
} from "./modelQPApi";
import {
    ModelQPForm,
    SectionUI,
    ModelQPApi,
    DropdownOption,
    ModelQPStatus,
    QuestionGroupApi,
    QuestionApi
} from "./types";
import { normalizeQP, normalizeSections, recalcMaxMarks, buildFrameworkPayload, normalizeFullQP, createEmptySection } from "./utils/qpMappers";
import AddQuestionModal from "./AddQuestionModal";
import type { QuestionFormData, UnitOption } from "./AddQuestionModal";
import { toast } from "react-toastify";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";

interface ModelQPFormManagerProps {
    qpData: ModelQPApi | null;
    courseId: number;
    metaData: {
        curriculum: string;
        curriculum_id: number;
        term: string;
        semester_id: number;
        course: string;
    };
    onClose: () => void;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B"];

const ModelQPFormManager: React.FC<ModelQPFormManagerProps> = ({ qpData, courseId, metaData, onClose }) => {
    // ==================== STATE MANAGEMENT ====================
    const [qpId, setQpId] = useState<number | null>(null);
    const [sections, setSections] = useState<SectionUI[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [qp, setQp] = useState<ModelQPForm>({
        title: "",
        duration: 3,
        maxMarks: 0,
        totalMarks: 100,
        note: "",
    });

    const [fullMetadata, setFullMetadata] = useState<any>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);

    // Dropdowns data (shared for all questions)
    const [coOptions, setCoOptions] = useState<DropdownOption[]>([]);
    const [bloomOptions, setBloomOptions] = useState<DropdownOption[]>([]);
    const [piOptionsMap, setPiOptionsMap] = useState<Record<number, DropdownOption[]>>({});

    // UI State: Collapsible sections
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        framework: true,
        questions: false,
        analysis: false,
    });

    const [newSection, setNewSection] = useState({
        name: "",
        numberOfGroups: "1",
        maxMarks: "10",
    });

    const [newSectionErrors, setNewSectionErrors] = useState<{
        name?: string;
        numberOfGroups?: string;
        maxMarks?: string;
    }>({});

    const [updateError, setUpdateError] = useState<string>("");

    // Add Question Modal state
    const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<QuestionFormData | null>(null);

    // Confirmation State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { }
    });

    // ==================== HELPERS ====================


    // ==================== EFFECTS ====================

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Phase 6 will integrate real context, keeping hooks for now
                const [cos, blooms] = await Promise.all([
                    fetchCOs(courseId),
                    fetchBloomLevels()
                ]);
                setCoOptions(cos);
                setBloomOptions(blooms);

                if (qpData) {
                    // EDIT MODE
                    const { form, sections: normSections } = normalizeFullQP(qpData);
                    setQpId(qpData.qpd_id || qpData.id || null);
                    setQp(form);
                    setSections(normSections);
                } else {
                    // CREATE MODE — start with empty sections; user adds them via the form
                    setQpId(null);
                    setSections([]);
                    setQp({
                        title: "",
                        duration: 3,
                        maxMarks: 0,
                        totalMarks: 100,
                        note: "",
                    });
                }
            } catch (err) {
                console.error("Initialization failed:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [qpData, courseId]);

    // Derived Analysis
    const bloomsData = useMemo(() => {
        if (!sections) return [];
        const counts: Record<string, number> = {};
        (sections || []).forEach((s: SectionUI) => (s.questions || []).forEach((g: QuestionGroupApi) => (g.questions || []).forEach((q: QuestionApi) => {
            const key = q.bloom_level || "Unknown";
            counts[key] = (counts[key] || 0) + ((q.marks || 0) / 2); // Average choice weight
        })));
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [sections]);

    const coData = useMemo(() => {
        if (!sections) return [];
        const counts: Record<string, number> = {};
        (sections || []).forEach((s: SectionUI) => (s.questions || []).forEach((g: QuestionGroupApi) => (g.questions || []).forEach((q: QuestionApi) => {
            const key = q.co_id ? `CO${q.co_id}` : "Unmapped";
            counts[key] = (counts[key] || 0) + ((q.marks || 0) / 2);
        })));
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [sections]);

    const totalMarksProduced = useMemo(() => {
        return (sections || []).reduce((total: number, section: SectionUI) => {
            return total + ((section.questions || []).reduce((sTotal: number, group: QuestionGroupApi) => {
                return sTotal + (group.questions?.[0]?.marks || 0);
            }, 0) || 0);
        }, 0);
    }, [sections]);

    // Unit options fed to AddQuestionModal
    const unitOptions = useMemo((): UnitOption[] => {
        return (sections || []).map((s: SectionUI) => {
            const marksPerGroup = s.questions?.[0]?.questions?.[0]?.marks ?? 0;
            const usedMarks = (s.questions || []).reduce((acc: number, g: QuestionGroupApi) => acc + (g.questions?.[0]?.marks ?? 0), 0);
            return {
                id: s.tempId, // Use tempId for lookup in handleSaveQuestion
                name: s.name,
                groupCount: s.questions?.length || 0,
                usedMarks,
                totalMarks: (s.questions?.length || 0) * marksPerGroup,
            };
        });
    }, [sections]);

    // ==================== BLOOM'S ANALYSIS COMPUTATION ====================

    const analysisResult = useMemo(() => {
        if (!qp) return null;

        const BLOOM_LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6"];
        const BLOOM_LABELS: Record<string, string> = {
            L1: "L1 - Remember",
            L2: "L2 - Understanding",
            L3: "L3 - Applying",
            L4: "L4 - Analyzing",
            L5: "L5 - Evaluating",
            L6: "L6 - Creating",
        };
        const BLOOM_COLORS: Record<string, string> = {
            L1: "#ef4444",
            L2: "#f59e0b",
            L3: "#10b981",
            L4: "#3b82f6",
            L5: "#a855f7",
            L6: "#06b6d4",
            A1: "#6366f1",
            A2: "#f97316",
            A3: "#14b8a6",
            A4: "#ec4899",
            A5: "#84cc16",
            P1: "#0ea5e9",
            P2: "#e11d48",
            P3: "#8b5cf6",
            P4: "#22c55e",
            P5: "#f43f5e",
            P6: "#eab308",
            P7: "#06b6d4",
        };
        // Extended palette for any levels not explicitly mapped above
        const EXTRA_PALETTE = [
            "#e67e22", "#16a085", "#2980b9", "#8e44ad", "#c0392b",
            "#d35400", "#7f8c8d", "#27ae60", "#2c3e50", "#f1c40f",
            "#1abc9c", "#3498db", "#9b59b6", "#e74c3c", "#34495e",
        ];

        // Flatten all questions with display SL numbers
        const allQuestions: Array<{
            displaySlNo: string;
            marks: number;
            bloom_level: string;
            unitName: string;
        }> = [];

        let globalGroupStart = 0;
        sections.forEach((section: SectionUI) => {
            section.questions?.forEach((group: any, gIdx: number) => {
                group.questions?.forEach((q: any, qIdx: number) => {
                    const displaySlNo =
                        group.questions.length > 1
                            ? `${globalGroupStart + gIdx + 1}${String.fromCharCode(97 + qIdx)}`
                            : `${globalGroupStart + gIdx + 1}`;
                    allQuestions.push({
                        displaySlNo,
                        marks: q.marks,
                        bloom_level: q.bloom_level || "",
                        unitName: section.name,
                    });
                });
            });
            globalGroupStart += (section.questions?.length || 0);
        });

        // Detect extra bloom levels not in L1-L6 and assign colors dynamically
        const extraLevels = new Set<string>();
        let extraColorIdx = 0;
        allQuestions.forEach((q) => {
            if (q.bloom_level && !BLOOM_LEVELS.includes(q.bloom_level)) {
                extraLevels.add(q.bloom_level);
            }
        });
        // Assign colors for any extra level not already in BLOOM_COLORS
        Array.from(extraLevels).sort().forEach((level) => {
            if (!BLOOM_COLORS[level]) {
                BLOOM_COLORS[level] = EXTRA_PALETTE[extraColorIdx % EXTRA_PALETTE.length];
                extraColorIdx++;
            }
        });
        const allLevels = [...BLOOM_LEVELS, ...Array.from(extraLevels).sort()];

        // Totals per bloom level
        const bloomTotals: Record<string, number> = {};
        allLevels.forEach((l) => {
            bloomTotals[l] = 0;
        });
        allQuestions.forEach((q) => {
            if (q.bloom_level && bloomTotals.hasOwnProperty(q.bloom_level)) {
                bloomTotals[q.bloom_level] += q.marks;
            }
        });

        const bloomGrandTotal = Object.values(bloomTotals).reduce((a, b) => a + b, 0);

        const summary = allLevels.map((level) => ({
            level,
            label: BLOOM_LABELS[level] || level,
            marks: bloomTotals[level],
            percentage: bloomGrandTotal > 0 ? (bloomTotals[level] / bloomGrandTotal) * 100 : 0,
            color: BLOOM_COLORS[level] || "#95a5a6",
        }));

        const maxLevelMarks = Math.max(...Object.values(bloomTotals), 1);

        // CSS pie chart (conic-gradient)
        let cumulativePercent = 0;
        const pieSegments = summary
            .filter((s) => s.marks > 0)
            .map((s) => {
                const start = cumulativePercent;
                cumulativePercent += s.percentage;
                return {
                    level: s.level,
                    label: s.label,
                    color: s.color,
                    start,
                    end: cumulativePercent,
                    percentage: s.percentage,
                };
            });

        const conicGradient =
            pieSegments.length > 0
                ? `conic-gradient(${pieSegments.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(", ")})`
                : "conic-gradient(#e5e7eb 0% 100%)";

        return {
            allQuestions,
            bloomTotals,
            summary,
            bloomGrandTotal,
            maxLevelMarks,
            allLevels,
            BLOOM_LEVELS,
            BLOOM_LABELS,
            BLOOM_COLORS,
            pieSegments,
            conicGradient,
        };
    }, [sections]);

    // ==================== HANDLERS ====================

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // Save question from AddQuestionModal (add or edit)
    const handleSaveQuestion = (data: QuestionFormData) => {
        setSections(prev => {
            const sIdx = (prev || []).findIndex((s: SectionUI) => String(s.tempId) === data.unitId || String(s.id) === data.unitId);
            if (sIdx === -1) return prev;
            const gIdx = parseInt(data.mainQNo) - 1;
            const qInGroupIdx = data.subQNo === "a" ? 0 : 1;

            return prev.map((s: SectionUI, si: number): SectionUI => {
                if (si !== sIdx) return s;
                return {
                    ...s,
                    questions: (s.questions || []).map((g: QuestionGroupApi, gi: number) => {
                        if (gi !== gIdx) return g;
                        const nextQs = (g.questions || []).map((q: QuestionApi, qi: number) => {
                            if (qi !== qInGroupIdx) return q;
                            return {
                                ...q,
                                question_text: data.content,
                                co_id: data.co_id ? Number(data.co_id) : null,
                                bloom_level: data.bloom_level,
                                marks: data.marks ? Number(data.marks) : q.marks,
                            };
                        });
                        return { ...g, questions: nextQs };
                    }),
                };
            });
        });

        setIsAddQuestionModalOpen(false);
        setEditingQuestion(null);
    };

    const handleUpdateQuestion = async (mIdx: number, gIdx: number, qIdx: number, field: string, value: any) => {
        setSections(prev => {
            const nextSections = [...prev];
            const unit = nextSections[mIdx];
            if (!unit.questions) unit.questions = [];
            
            const nextQuestions = [...(unit.questions[gIdx].questions || [])];
            nextQuestions[qIdx] = { ...nextQuestions[qIdx], [field]: value };
            unit.questions[gIdx].questions = nextQuestions;
            
            return nextSections;
        });

        if (field === "co_id" && value) {
            if (!piOptionsMap[value as number]) {
                const pis = await fetchPIByCO(Number(value));
                setPiOptionsMap(prev => ({ ...prev, [Number(value)]: pis }));
            }
        }
    };

    const handleUpdateFramework = (tempId: string, field: string, value: any) => {
        setSections(prev => {
            const updated = prev.map((s: SectionUI): SectionUI => {
                if (s.tempId === tempId) {
                    if (field === "name") return { ...s, name: value };
                    if (field === "groups") {
                        const count = Math.max(1, Number(value));
                        const currentMarks = s.questions?.[0]?.questions?.[0]?.marks ?? 10;
                        return { 
                            ...s, 
                            questions: Array.from({ length: count }).map((_, i) => (s.questions || [])[i] || {
                                type: "EITHER_OR",
                                questions: [
                                    { question_text: "", co_id: null, bloom_level: "", pi_code: "", marks: currentMarks },
                                    { question_text: "", co_id: null, bloom_level: "", pi_code: "", marks: currentMarks }
                                ]
                            })
                        };
                    }
                    if (field === "marks") {
                        const m = Number(value) || 0;
                        return {
                            ...s,
                            questions: (s.questions || []).map((g: QuestionGroupApi) => ({
                                ...g,
                                questions: (g.questions || []).map((q: QuestionApi) => ({ ...q, marks: m }))
                            }))
                        };
                    }
                }
                return s;
            });

            // Recalculate maxMarks after state is determined
            const newMaxMarks = recalcMaxMarks(updated);
            setQp(v => ({ ...v, maxMarks: newMaxMarks }));
            
            return updated;
        });
    };

    // Validate Add Unit form
    const validateNewSection = (): boolean => {
        const errors: { name?: string; numberOfGroups?: string; maxMarks?: string } = {};
        const specialCharRegex = /[^a-zA-Z0-9 ]/;
        const numericRegex = /^\d+$/;

        if (!newSection.name.trim()) {
            errors.name = "All fields are required";
        } else if (specialCharRegex.test(newSection.name)) {
            errors.name = "Special characters are not allowed";
        }

        if (!newSection.numberOfGroups.trim()) {
            errors.numberOfGroups = "All fields are required";
        } else if (!numericRegex.test(newSection.numberOfGroups)) {
            errors.numberOfGroups = "Only numbers are allowed";
        } else if (Number(newSection.numberOfGroups) < 1) {
            errors.numberOfGroups = "Must be at least 1";
        }

        if (!newSection.maxMarks.trim()) {
            errors.maxMarks = "All fields are required";
        } else if (!numericRegex.test(newSection.maxMarks)) {
            errors.maxMarks = "Only numbers are allowed";
        } else if (Number(newSection.maxMarks) < 1) {
            errors.maxMarks = "Must be at least 1";
        }

        setNewSectionErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddSection = () => {
        if (!validateNewSection()) return;

        const groups = Number(newSection.numberOfGroups);
        const marks = Number(newSection.maxMarks);

        // Uses mapper to create empty section then overrides defaults
        const newSec: SectionUI = {
            ...createEmptySection(),
            name: newSection.name.trim(),
            numQuestions: groups,
            maxMarks: marks,
            questions: Array.from({ length: groups }).map(() => ({
                type: "EITHER_OR",
                questions: [
                    { question_text: "", co_id: null, bloom_level: "", pi_code: "", marks },
                    { question_text: "", co_id: null, bloom_level: "", pi_code: "", marks }
                ]
            }))
        };
        
        setSections(prev => {
            const updated = [...prev, newSec];
            setQp(q => ({ ...q, maxMarks: recalcMaxMarks(updated) }));
            return updated;
        });

        setNewSection({ name: "", numberOfGroups: "1", maxMarks: "10" });
        setNewSectionErrors({});
    };

    const handleRemoveSection = (tempId: string) => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete Section",
            message: "Are you sure you want to delete this section? All questions within it will also be removed.",
            onConfirm: () => {
                setSections(prev => {
                    const updated = prev.filter((s: SectionUI) => s.tempId !== tempId);
                    setQp(q => ({ ...q, maxMarks: recalcMaxMarks(updated) }));
                    return updated;
                });
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                toast.success("Section removed successfully.");
            }
        });
    };

    // Validate all table rows before update
    const handleUpdateUnits = () => {
        const specialCharRegex = /[^a-zA-Z0-9 ]/;

        for (let i = 0; i < sections.length; i++) {
            const s = sections[i];
            if (!s.name?.trim()) {
                setUpdateError(`Row ${i + 1}: Section name cannot be empty.`);
                return;
            }
            if (specialCharRegex.test(s.name)) {
                setUpdateError(`Row ${i + 1}: Special characters are not allowed in section name.`);
                return;
            }
            const gCount = s.questions?.length || 0;
            if (gCount < 1) {
                setUpdateError(`Row ${i + 1}: No. of Q. Groups must be at least 1.`);
                return;
            }
            const marks = s.questions?.[0]?.questions?.[0]?.marks;
            if (!marks || marks < 1) {
                setUpdateError(`Row ${i + 1}: Max Marks must be at least 1.`);
                return;
            }
        }

        setUpdateError("");
        const newMaxMarks = recalcMaxMarks(sections);
        setQp(prev => ({ ...prev, maxMarks: newMaxMarks }));
        toast.success("Units updated successfully!");
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const payload = {
                qp_definition_id: qpId,
                course_id: courseId,
                curriculum_id: qpData?.curriculum_id || fullMetadata?.curriculum_id,
                semester_id: qpData?.semester_id || fullMetadata?.semester_id,
                ...buildFrameworkPayload(qp, sections)
            };
            const result = await saveDraftQP(payload);
            if (result?.qpd_id || result?.qp_definition?.qpd_id) {
                setQpId(result.qpd_id || result.qp_definition.qpd_id);
                toast.success("Draft saved successfully!");
            }
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            // Logic similar to draft but maybe with status check if backend allows
            await handleSaveDraft();
            toast.success("Model QP submitted successfully!");
            onClose();
        } catch (error) {
            console.error("Submit failed:", error);
        } finally {
            setSaving(false);
        }
    };

    // UI Helper
    const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
        <svg
            className={`w-6 h-6 transform transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#f4f7f9]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!qp) return null;

    return (
        <>
        <div className="p-6 bg-[#f4f7f9] min-h-screen font-sans">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                
                {/* Header Title Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-2">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl leading-6 font-medium text-gray-900 border-b pb-4 w-full">
                            Manage Model Question Paper Details
                        </h2>
                        <button
                            onClick={onClose}
                            className="ml-auto px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 shadow-sm transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* SECTION 1: Edit Framework */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <button
                        type="button"
                        className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 border-b hover:bg-gray-100 transition-colors"
                        onClick={() => toggleSection("framework")}
                    >
                        <h3 className="text-lg font-semibold text-gray-800 uppercase tracking-tight">
                            Edit Model QP Framework
                        </h3>
                        <ChevronIcon expanded={expandedSections.framework} />
                    </button>

                    {expandedSections.framework && (
                        <div className="p-6 transition-all duration-300">
                            {/* Curriculum Details Header */}
                            <div className="mb-8">
                                <h4 className="text-md font-semibold text-gray-700 mb-4 border-b pb-2">
                                    Curriculum Details
                                </h4>
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Curriculum</span>
                                        <p className="text-md font-medium text-gray-900 border-b border-gray-200 pb-1">{metaData.curriculum}</p>
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Term</span>
                                        <p className="text-md font-medium text-gray-900 border-b border-gray-200 pb-1">{metaData.term}</p>
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Course</span>
                                        <p className="text-md font-medium text-gray-900 border-b border-gray-200 pb-1">{metaData.course}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Info Grid */}
                            <div className="bg-gray-50/50 border hover:border-blue-300 transition-colors duration-200 rounded-lg p-5 mb-8">
                                <h4 className="text-md font-semibold text-gray-700 mb-4 border-b pb-2">
                                    Manage MTE Framework
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Paper Title <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={qp.title}
                                            onChange={(e) => setQp({ ...qp, title: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Duration (Hours) <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={qp.duration}
                                            onChange={(e) => setQp({ ...qp, duration: Number(e.target.value) })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Marks</label>
                                        <input
                                            type="number"
                                            value={qp.maxMarks}
                                            onChange={(e) => setQp({ ...qp, maxMarks: Number(e.target.value) })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Grand Total <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            value={qp.totalMarks || ''}
                                            onChange={(e) => setQp({ ...qp, totalMarks: e.target.valueAsNumber || 0 })}
                                            placeholder="Enter total marks"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Note :</label>
                                        <textarea
                                            value={qp.note || ""}
                                            onChange={(e) => setQp({ ...qp, note: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y"
                                            placeholder="e.g. Part A has 6 questions, each carrying 5 marks..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sections Builder Table */}
                             <div className="mb-8">
                                <h4 className="text-md font-semibold text-gray-700 mb-4">
                                    Manage Section / Parts (Units) Distribution
                                </h4>
                                <div className="bg-white border border-gray-200 rounded-lg p-5">
                                    <div className="overflow-x-auto mb-4">
                                        <table className="w-full text-sm text-left text-gray-500 border-collapse">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200 font-bold">
                                                <tr>
                                                    <th className="px-4 py-3 border-r w-16 text-center">SL No.</th>
                                                    <th className="px-4 py-3 border-r">Section Name</th>
                                                    <th className="px-4 py-3 border-r text-center">No. of Q. Groups</th>
                                                    <th className="px-4 py-3 border-r text-center">Max Marks</th>
                                                    <th className="px-4 py-3 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sections.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-400 italic">
                                                            No units defined. Use the form below to add units.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    sections.map((section, index) => (
                                                        <tr key={section.tempId} className="border-b hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 border-r text-center font-medium text-gray-900">{index + 1}</td>
                                                            <td className="px-4 py-2 border-r">
                                                                <input
                                                                    type="text"
                                                                    value={section.name}
                                                                    onChange={(e) => handleUpdateFramework(section.tempId, "name", e.target.value)}
                                                                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 border-r">
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    value={section.questions?.length || 0}
                                                                    onChange={(e) => handleUpdateFramework(section.tempId, "groups", e.target.value)}
                                                                    onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                                                                    className="w-full px-2 py-1 text-sm text-center border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 border-r">
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    value={section.questions?.[0]?.questions?.[0]?.marks || ""}
                                                                    onChange={(e) => handleUpdateFramework(section.tempId, "marks", e.target.value)}
                                                                    onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                                                                    className="w-full px-2 py-1 text-sm text-center border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                <button
                                                                    onClick={() => handleRemoveSection(section.tempId)}
                                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                                    title="Delete section"
                                                                >
                                                                    <FaTrashAlt className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                            {sections.length > 0 && (
                                                <tfoot>
                                                    <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold text-gray-700">
                                                        <td colSpan={2} className="px-4 py-2 border-r text-right text-xs uppercase tracking-wider">Total</td>
                                                        <td className="px-4 py-2 border-r text-center text-xs">
                                                            {sections.reduce((acc: number, s: SectionUI) => acc + (s.questions?.length || 0), 0)}
                                                        </td>
                                                        <td className="px-4 py-2 border-r text-center text-xs">
                                                            {qp.maxMarks.toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-2"></td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                    {updateError && (
                                        <p className="text-red-500 text-xs mb-2 px-1">{updateError}</p>
                                    )}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handleUpdateUnits}
                                            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-all"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Add Unit Form Section */}
                            <div>
                                <h4 className="text-md font-semibold text-gray-700 mb-4 italic">Add Unit</h4>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                                    <div className="flex flex-col md:flex-row gap-4 items-start mb-4">
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Section/Parts Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Unit V"
                                                value={newSection.name}
                                                onChange={(e) => {
                                                    setNewSection({ ...newSection, name: e.target.value });
                                                    if (newSectionErrors.name) setNewSectionErrors(prev => ({ ...prev, name: undefined }));
                                                }}
                                                className={`w-full px-3 py-2 text-sm border rounded-md bg-white focus:ring-2 focus:ring-blue-500 ${
                                                    newSectionErrors.name ? "border-red-400" : "border-gray-300"
                                                }`}
                                            />
                                            {newSectionErrors.name && (
                                                <p className="text-red-500 text-xs mt-1">{newSectionErrors.name}</p>
                                            )}
                                        </div>
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">No. of Q. Groups <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="e.g. 2"
                                                value={newSection.numberOfGroups}
                                                onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                                                onChange={(e) => {
                                                    setNewSection({ ...newSection, numberOfGroups: e.target.value });
                                                    if (newSectionErrors.numberOfGroups) setNewSectionErrors(prev => ({ ...prev, numberOfGroups: undefined }));
                                                }}
                                                className={`w-full px-3 py-2 text-sm border rounded-md bg-white focus:ring-2 focus:ring-blue-500 ${
                                                    newSectionErrors.numberOfGroups ? "border-red-400" : "border-gray-300"
                                                }`}
                                            />
                                            {newSectionErrors.numberOfGroups && (
                                                <p className="text-red-500 text-xs mt-1">{newSectionErrors.numberOfGroups}</p>
                                            )}
                                        </div>
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Max Marks (per group) <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="e.g. 10"
                                                value={newSection.maxMarks}
                                                onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                                                onChange={(e) => {
                                                    setNewSection({ ...newSection, maxMarks: e.target.value });
                                                    if (newSectionErrors.maxMarks) setNewSectionErrors(prev => ({ ...prev, maxMarks: undefined }));
                                                }}
                                                className={`w-full px-3 py-2 text-sm border rounded-md bg-white focus:ring-2 focus:ring-blue-500 ${
                                                    newSectionErrors.maxMarks ? "border-red-400" : "border-gray-300"
                                                }`}
                                            />
                                            {newSectionErrors.maxMarks && (
                                                <p className="text-red-500 text-xs mt-1">{newSectionErrors.maxMarks}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4 border-t border-gray-200 mt-2">
                                        <button
                                            onClick={handleAddSection}
                                            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-all"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION 2: Manage Questions */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <button
                        type="button"
                        className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 border-b hover:bg-gray-100 transition-colors"
                        onClick={() => toggleSection("questions")}
                    >
                        <h3 className="text-lg font-semibold text-gray-800 uppercase tracking-tight">
                            Manage Questions
                        </h3>
                        <ChevronIcon expanded={expandedSections.questions} />
                    </button>

                    {expandedSections.questions && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-md font-semibold text-gray-700">
                                    Questions List
                                </h4>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingQuestion(null);
                                            setIsAddQuestionModalOpen(true);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors"
                                    >
                                        Add Question
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-[10px] text-gray-700 uppercase bg-gray-50 border-b border-gray-200 font-bold tracking-wider">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 border-r w-24 text-center">SL NO.</th>
                                            <th scope="col" className="px-6 py-4 border-r min-w-[300px]">QUESTION</th>
                                            <th scope="col" className="px-6 py-4 border-r text-center w-32">COS</th>
                                            <th scope="col" className="px-6 py-4 border-r text-center w-40">BLOOM'S LEVEL</th>
                                            <th scope="col" className="px-6 py-4 border-r text-center w-32">MARKS</th>
                                            <th scope="col" className="px-6 py-4 text-center">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sections.map((section, mIdx) => {
                                            const sectionMarks = section.questions?.reduce((acc: number, group: any) => acc + (group.questions[0]?.marks || 0), 0) || 0;
                                            let globalGroupStartIndex = 0;
                                            for (let i = 0; i < mIdx; i++) {
                                                globalGroupStartIndex += (sections[i].questions?.length || 0);
                                            }

                                            return (
                                                <React.Fragment key={section.id}>
                                                    {/* UNIT HEADER ROW */}
                                                    <tr style={{ backgroundColor: "#d1d5db", borderTop: "2px solid #9ca3af", borderBottom: "2px solid #9ca3af" }}>
                                                        <td colSpan={6} style={{ padding: "8px 16px" }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                <span style={{ fontWeight: 900, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#111827" }}>
                                                                    {section.name}
                                                                </span>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#374151" }}>
                                                                    <span>
                                                                        Section Marks :&nbsp;
                                                                        <strong style={{ color: "#111827", fontWeight: 900 }}>{sectionMarks.toFixed(2)} / {sectionMarks.toFixed(2)}</strong>
                                                                    </span>
                                                                    <span>
                                                                        Grand Total Marks :&nbsp;
                                                                        <strong style={{ color: "#111827", fontWeight: 900 }}>{totalMarksProduced.toFixed(2)} / {qp.maxMarks.toFixed(2)}</strong>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* QUESTION ROWS */}
                                                    {(section.questions || []).length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-4 text-center text-gray-400 italic bg-gray-50">
                                                                 No questions defined for this unit.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        (section.questions || []).flatMap((group: any, gIdx: number) =>
                                                            group.questions.map((q: any, qIdx: number) => ({
                                                                ...q, mIdx, gIdx, qIdx,
                                                                displaySlNo: group.questions.length > 1
                                                                    ? `${globalGroupStartIndex + gIdx + 1}${String.fromCharCode(97 + qIdx)}`
                                                                    : `${globalGroupStartIndex + gIdx + 1}`
                                                            }))
                                                        ).map((q: any, idx: number) => (
                                                            <tr key={`${mIdx}-${idx}`} className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 font-bold text-gray-900 border-r text-center">{q.displaySlNo}</td>
                                                                <td className="px-6 py-4 border-r text-gray-700 text-[13px] font-medium leading-relaxed">
                                                                    {q.question_text
                                                                        ? <span dangerouslySetInnerHTML={{ __html: q.question_text }} />
                                                                        : <span className="text-gray-300 italic font-normal">Enter question text...</span>
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 border-r text-center font-bold text-blue-700 text-xs">{q.co_id ? `CO${q.co_id}` : "—"}</td>
                                                                <td className="px-6 py-4 border-r text-center font-bold text-gray-600 text-xs">{q.bloom_level || "—"}</td>
                                                                <td className="px-6 py-4 border-r text-center font-bold text-gray-900 text-xs">{q.marks.toFixed(2)}</td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <div className="flex justify-center items-center gap-6">
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingQuestion({
                                                                                    unitId: String(sections[q.mIdx].id),
                                                                                    mainQNo: String(q.gIdx + 1),
                                                                                    subQNo: q.qIdx === 0 ? "a" : "b",
                                                                                    isMandatory: true,
                                                                                    co_id: q.co_id ? String(q.co_id) : "",
                                                                                    bloom_level: q.bloom_level,
                                                                                    marks: String(q.marks),
                                                                                    content: q.question_text,
                                                                                    mIdx: q.mIdx,
                                                                                    gIdx: q.gIdx,
                                                                                    qIdx: q.qIdx,
                                                                                });
                                                                                setIsAddQuestionModalOpen(true);
                                                                            }}
                                                                            className="text-orange-500 hover:text-orange-700 transition-colors"
                                                                            title="Edit question"
                                                                        >
                                                                            <FaPencilAlt className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setConfirmDialog({
                                                                                    isOpen: true,
                                                                                    title: "Delete Question",
                                                                                    message: `Are you sure you want to delete question ${q.displaySlNo}?`,
                                                                                    onConfirm: () => {
                                                                                        const nextSections = [...sections];
                                                                                        const targetGroup = (nextSections[q.mIdx].questions || [])[q.gIdx];
                                                                                        targetGroup.questions = targetGroup.questions.filter((_: any, i: number) => i !== q.qIdx);
                                                                                        setSections(nextSections);
                                                                                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                                                                        toast.success(`Question ${q.displaySlNo} deleted.`);
                                                                                    }
                                                                                });
                                                                            }}
                                                                            className="text-red-600 hover:text-red-800 transition-colors"
                                                                            title="Delete question"
                                                                        >
                                                                            <FaTrashAlt className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION 3: Analysis */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <button
                        type="button"
                        className="w-full px-6 py-4 flex justify-between items-center bg-gray-100 hover:bg-gray-200 transition-colors"
                        onClick={() => toggleSection("analysis")}
                    >
                        <h3 className="text-lg font-semibold text-gray-800">
                            Question Paper Analysis
                        </h3>
                        <ChevronIcon expanded={expandedSections.analysis} />
                    </button>

                    {expandedSections.analysis && (
                        <div className="p-6 space-y-10">

                            {/* ====== NEW: Bloom's Distribution Analysis ====== */}
                            {(!analysisResult || analysisResult.allQuestions.length === 0 || analysisResult.bloomGrandTotal === 0) ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-bold uppercase text-xs text-gray-700 tracking-tight">
                                        Question-wise Bloom's Level Marks Distribution
                                    </div>
                                    <div className="p-12 text-center">
                                        <p className="text-gray-400 italic text-sm font-medium">
                                            No data available for analysis
                                        </p>
                                        <p className="text-gray-300 text-xs mt-1">Add questions with Bloom's levels to see distribution analytics.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* ── Single Combined Panel: Bar Chart (left) + Matrix Table (right) ── */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-bold uppercase text-xs text-gray-700 tracking-tight flex items-center gap-2">
                                            <span className="w-1 h-4 bg-[#4a8494] rounded-full inline-block" />
                                            Question-wise Bloom's Level Marks Distribution
                                        </div>
                                        <div className="p-5 flex flex-col xl:flex-row gap-6 items-start">
                                            {/* ── LEFT: Per-Question Bar Chart ── */}
                                            <div className="w-full xl:w-1/2">
                                                <p className="text-xs font-semibold text-gray-600 mb-4 text-center uppercase tracking-wider">
                                                    Question-wise Bloom's Level Marks Distribution
                                                </p>
                                                {/* Chart area */}
                                                {(() => {
                                                    const questions = analysisResult.allQuestions;
                                                    const maxMarks = Math.max(...questions.map(q => q.marks), 1);
                                                    // Compute nice Y-axis ceiling (round up to nearest 5)
                                                    const yMax = Math.ceil(maxMarks / 5) * 5;
                                                    const tickCount = 5;
                                                    const step = yMax / tickCount;
                                                    const ticks: number[] = [];
                                                    for (let v = yMax; v >= 0; v -= step) {
                                                        ticks.push(Math.round(v));
                                                    }
                                                    const chartHeight = 240;

                                                    return (
                                                        <>
                                                            {/* Y-axis + bars */}
                                                            <div className="flex" style={{ minHeight: chartHeight + 40 }}>
                                                                {/* Y-axis labels */}
                                                                <div
                                                                    className="flex flex-col justify-between items-end pr-2"
                                                                    style={{ height: chartHeight, minWidth: 30 }}
                                                                >
                                                                    {ticks.map((v, i) => (
                                                                        <span key={i} className="text-[10px] text-gray-500 font-semibold leading-none">{v}</span>
                                                                    ))}
                                                                </div>

                                                                {/* Bars container with grid */}
                                                                <div
                                                                    className="flex-1 relative border-l border-b border-gray-300"
                                                                    style={{ height: chartHeight }}
                                                                >
                                                                    {/* Horizontal dashed grid lines */}
                                                                    {ticks.slice(0, -1).map((v, i) => {
                                                                        const pct = (v / yMax) * 100;
                                                                        return (
                                                                            <div
                                                                                key={i}
                                                                                className="absolute w-full"
                                                                                style={{
                                                                                    bottom: `${pct}%`,
                                                                                    left: 0,
                                                                                    borderTop: "1px dashed #e5e7eb",
                                                                                }}
                                                                            />
                                                                        );
                                                                    })}

                                                                    {/* Bars */}
                                                                    <div
                                                                        className="flex items-end w-full h-full relative z-10"
                                                                        style={{ padding: "0 6px", gap: questions.length > 20 ? 2 : 6 }}
                                                                    >
                                                                        {questions.map((q, idx) => {
                                                                            const barPct = q.marks > 0 ? (q.marks / yMax) * 100 : 0;
                                                                            const color = analysisResult.BLOOM_COLORS[q.bloom_level] || "#bdc3c7";
                                                                            return (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="flex flex-col items-center justify-end"
                                                                                    style={{ flex: 1, height: "100%" }}
                                                                                >
                                                                                    {/* Marks label ABOVE the bar */}
                                                                                    {q.marks > 0 && (
                                                                                        <span
                                                                                            className="text-[10px] font-bold leading-none mb-1"
                                                                                            style={{ color }}
                                                                                        >
                                                                                            {q.marks}
                                                                                        </span>
                                                                                    )}
                                                                                    {/* Bar */}
                                                                                    <div
                                                                                        style={{
                                                                                            width: "100%",
                                                                                            maxWidth: 36,
                                                                                            height: `${barPct}%`,
                                                                                            minHeight: q.marks > 0 ? 4 : 2,
                                                                                            backgroundColor: color,
                                                                                            borderRadius: "3px 3px 0 0",
                                                                                            transition: "height 0.4s ease",
                                                                                            boxShadow: q.marks > 0 ? "0 -1px 3px rgba(0,0,0,0.08)" : "none",
                                                                                        }}
                                                                                        title={`${q.displaySlNo}: ${q.marks} marks (${q.bloom_level || "—"})`}
                                                                                    />
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* X-axis labels */}
                                                            <div className="flex" style={{ marginLeft: 30 }}>
                                                                <div
                                                                    className="flex-1 flex w-full"
                                                                    style={{ padding: "0 6px", gap: questions.length > 20 ? 2 : 6 }}
                                                                >
                                                                    {questions.map((q, idx) => (
                                                                        <div key={idx} className="flex-1 text-center pt-1.5">
                                                                            <span className="text-[9px] font-bold text-gray-500 leading-none whitespace-nowrap">
                                                                                {q.displaySlNo}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Legend */}
                                                            <div className="flex flex-wrap justify-center gap-3 mt-4 pt-3 border-t border-gray-100">
                                                                {analysisResult.allLevels
                                                                    .filter(level => analysisResult.bloomTotals[level] > 0)
                                                                    .map((level) => (
                                                                        <div key={level} className="flex items-center gap-1.5">
                                                                            <span
                                                                                className="inline-block w-3 h-3 rounded-sm"
                                                                                style={{ backgroundColor: analysisResult.BLOOM_COLORS[level] || "#95a5a6" }}
                                                                            />
                                                                            <span className="text-[10px] font-semibold text-gray-600">
                                                                                {analysisResult.BLOOM_LABELS[level] || level}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* ── RIGHT: Matrix Table ── */}
                                            <div className="w-full xl:w-1/2 overflow-x-auto">
                                                <table className="w-full text-sm text-left text-gray-500 border border-gray-200 rounded-lg overflow-hidden">
                                                    <thead>
                                                        <tr className="bg-[#f8fafc]">
                                                            <th
                                                                className="px-3 py-2 border-r border-b border-gray-200 text-center text-[10px] font-bold text-gray-700 uppercase tracking-wider"
                                                                rowSpan={2}
                                                                style={{ minWidth: 70 }}
                                                            >
                                                                Question
                                                            </th>
                                                            <th
                                                                className="px-2 py-1.5 text-center text-[10px] font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                                                                colSpan={analysisResult.allLevels.length}
                                                            >
                                                                Bloom's Level
                                                            </th>
                                                        </tr>
                                                        <tr className="bg-[#f8fafc]">
                                                            {analysisResult.allLevels.map((level) => (
                                                                <th
                                                                    key={level}
                                                                    className="px-1 py-1.5 text-center text-[9px] font-bold border-r border-b border-gray-200 uppercase"
                                                                    style={{
                                                                        minWidth: 36,
                                                                        color: analysisResult.BLOOM_COLORS[level] || "#6b7280",
                                                                    }}
                                                                >
                                                                    {level}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {analysisResult.allQuestions.map((q, idx) => (
                                                            <tr
                                                                key={idx}
                                                                className={`border-b ${
                                                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                                                } hover:bg-blue-50/20 transition-colors`}
                                                            >
                                                                <td className="px-3 py-1.5 border-r text-center font-bold text-gray-700 text-[11px]">
                                                                    {q.displaySlNo}
                                                                </td>
                                                                {analysisResult.allLevels.map((level) => (
                                                                    <td
                                                                        key={level}
                                                                        className="px-1 py-1.5 border-r text-center text-[11px]"
                                                                    >
                                                                        {q.bloom_level === level ? (
                                                                            <span className="font-bold" style={{ color: analysisResult.BLOOM_COLORS[level] || "#374151" }}>
                                                                                {q.marks.toFixed(0)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-300 text-[10px]">-</span>
                                                                        )}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                        {/* Total row */}
                                                        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                                            <td className="px-3 py-1.5 border-r text-center text-[10px] uppercase tracking-wider text-gray-700">
                                                                Total
                                                            </td>
                                                            {analysisResult.allLevels.map((level) => (
                                                                <td
                                                                    key={level}
                                                                    className="px-1 py-1.5 border-r text-center text-[10px] font-bold text-gray-800"
                                                                >
                                                                    {analysisResult.bloomTotals[level] > 0
                                                                        ? analysisResult.bloomTotals[level].toFixed(0)
                                                                        : "-"}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {/* ====== END: Bloom's Distribution Analysis ====== */}


                            {/* TABLE 2: Bloom's Actual Weightage */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-bold uppercase text-xs text-gray-700 tracking-tight">
                                    Bloom's Level Marks Distribution Based on Actual Weightage %
                                </div>
                                <div className="p-5 flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                                    {/* Pie Chart */}
                                    <div className="w-full lg:w-1/2 h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={bloomsData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {bloomsData.map((_, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Table */}
                                    <div className="w-full lg:w-1/2">
                                        <table className="w-full text-sm text-left text-gray-500 border border-gray-200 rounded-lg overflow-hidden">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b font-bold">
                                                <tr>
                                                    <th className="px-4 py-3 border-r">Bloom's Level</th>
                                                    <th className="px-4 py-3 border-r text-center">Marks Distribution (X)</th>
                                                    <th className="px-4 py-3 text-right">% Distribution</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bloomsData.length === 0 ? (
                                                    <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-400 italic">No data yet — map questions to Bloom's levels.</td></tr>
                                                ) : (
                                                    <>
                                                        {bloomsData.map((item, idx) => (
                                                            <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3 border-r font-medium text-gray-700">{item.name}</td>
                                                                <td className="px-4 py-3 border-r text-center">{item.value.toFixed(2)}</td>
                                                                <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                                                    {((item.value / bloomsData.reduce((acc, i) => acc + i.value, 0)) * 100).toFixed(2)} %
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                                            <td className="px-4 py-3 border-r text-gray-800">Total</td>
                                                            <td className="px-4 py-3 border-r text-center text-gray-800">
                                                                {(() => { const t = bloomsData.reduce((acc, i) => acc + i.value, 0); return `${t.toFixed(2)} (${t.toFixed(2)})`; })()}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-gray-800">100.00 %</td>
                                                        </tr>
                                                    </>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/* Note */}
                                <div className="px-5 pb-5">
                                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                        <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                            <span className="font-bold underline mr-2 italic">Note:</span>
                                            The above pie chart depicts the individual Bloom's Level actual marks percentage distribution as in the question paper. X = Individual Bloom's Level marks, Y = Sum of all Bloom's Level marks, % Distribution = (X / Y) * 100
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CO Analysis */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-bold uppercase text-xs text-gray-700 tracking-tight">
                                    Course Outcome Marks Distribution
                                </div>
                                <div className="p-5 flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                                    {/* Pie Chart */}
                                    <div className="w-full lg:w-1/2 h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={coData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    fill="#82ca9d"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {coData.map((_, i) => <Cell key={`co-${i}`} fill={COLORS[(i + 3) % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Table */}
                                    <div className="w-full lg:w-1/2">
                                        <table className="w-full text-sm text-left text-gray-500 border border-gray-200 rounded-lg overflow-hidden">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b font-bold">
                                                <tr>
                                                    <th className="px-4 py-3 border-r">COs Level</th>
                                                    <th className="px-4 py-3 border-r text-center">Marks Distribution (X)</th>
                                                    <th className="px-4 py-3 text-right">% Distribution</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {coData.length === 0 ? (
                                                    <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-400 italic">No data yet — map questions to Course Outcomes.</td></tr>
                                                ) : (
                                                    <>
                                                        {coData.map((item, idx) => (
                                                            <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3 border-r font-medium text-gray-700">{item.name}</td>
                                                                <td className="px-4 py-3 border-r text-center">{item.value.toFixed(2)}</td>
                                                                <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                                    {((item.value / coData.reduce((acc, i) => acc + i.value, 0)) * 100).toFixed(2)} %
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {/* Total Row */}
                                                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                                            <td className="px-4 py-3 border-r text-gray-800">Total</td>
                                                            <td className="px-4 py-3 border-r text-center text-gray-800">
                                                                {(() => { const t = coData.reduce((acc, i) => acc + i.value, 0); return `${t.toFixed(2)} (${t.toFixed(2)})`; })()}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-gray-800">100.00 %</td>
                                                        </tr>
                                                    </>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/* Note */}
                                <div className="px-5 pb-5">
                                    <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                                        <p className="text-xs text-green-800 leading-relaxed font-medium">
                                            <span className="font-bold underline mr-2 italic">Note:</span>
                                            The above pie chart depicts the individual Course Outcome(COs) wise actual marks percentage distribution as in the question paper. X = Individual Course Outcome marks, Y = Sum of all Course Outcomes marks, % Distribution = (X / Y) * 100
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t mt-8 bg-white/50 p-6 rounded-xl shadow-inner">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-red-500 rounded-md hover:bg-red-600 transition-all shadow-md uppercase tracking-widest"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-md uppercase tracking-widest flex items-center gap-2"
                    >
                        {saving ? "Saving..." : "Save Draft"}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-8 py-2.5 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 shadow-md uppercase tracking-widest"
                    >
                        Submit Final QP
                    </button>
                </div>

            </div>
        </div>

        {/* Add / Edit Question Modal */}
        <AddQuestionModal
            isOpen={isAddQuestionModalOpen}
            onClose={() => {
                setIsAddQuestionModalOpen(false);
                setEditingQuestion(null);
            }}
            onSave={handleSaveQuestion}
            units={unitOptions}
            initialData={editingQuestion}
            grandTotalUsed={totalMarksProduced}
            grandTotalMax={qp?.maxMarks ?? 0}
            coOptions={coOptions}
            bloomOptions={bloomOptions}
        />

        <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            onConfirm={confirmDialog.onConfirm}
            title={confirmDialog.title}
            message={confirmDialog.message}
        />
        </>
    );
};

export default ModelQPFormManager;
