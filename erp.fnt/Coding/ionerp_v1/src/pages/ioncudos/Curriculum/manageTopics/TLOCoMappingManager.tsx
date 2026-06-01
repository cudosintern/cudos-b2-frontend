import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaSave, FaTimes, FaCheck } from "react-icons/fa";
import { Topic } from "./types";
import {
    fetchTLOs,
    fetchCourseOutcomes,
    fetchTLOCoMappings,
    saveTLOCoMapping,
    TLORecord,
    CourseOutcome,
} from "./manageTopicsApi";

const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
};

interface TLOCoMappingManagerProps {
    curriculumLabel: string;
    termLabel: string;
    courseLabel: string;
    courseId: number;
    topics: Topic[];
    selectedTopicId: number | null;
    tloList: { id?: number; code: string; outcome: string; bloom: string; deliveryMethod: string; deliveryApproach: string }[];
    onClose: () => void;
    onSaveMapping: (topicId: number, mappingMatrix: Record<string, number>, justification: string) => void;
}

export const TLOCoMappingManager: React.FC<TLOCoMappingManagerProps> = ({
    curriculumLabel,
    termLabel,
    courseLabel,
    courseId,
    topics,
    selectedTopicId,
    onClose,
    onSaveMapping,
}) => {
    const [currentTopicId, setCurrentTopicId] = useState<number | null>(selectedTopicId);

    // Local TLOs (fetched per topic)
    const [localTLOs, setLocalTLOs] = useState<(TLORecord & { id: number })[]>([]);
    const [loadingTLOs, setLoadingTLOs] = useState(false);

    // Local COs (fetched per course)
    const [coList, setCoList] = useState<CourseOutcome[]>([]);
    const [loadingCOs, setLoadingCOs] = useState(false);

    // Mapping matrix: key = "tlo_<id>_co_<id>", value = 1 (mapped)
    const [mappingMatrix, setMappingMatrix] = useState<Record<string, number>>({});

    // Cell-level justifications
    const [justifications, setJustifications] = useState<Record<string, string>>({});

    // Saving state
    const [saving, setSaving] = useState(false);

    // Modal state for cell justification
    const [showJustifyModal, setShowJustifyModal] = useState(false);
    const [activeCell, setActiveCell] = useState<{ tloId: number; tloCode: string; coId: number } | null>(null);
    const [tempJustification, setTempJustification] = useState("");

    // ─── Fetch COs when courseId changes ──────────────────────────────────────
    useEffect(() => {
        if (!courseId) {
            setCoList([]);
            return;
        }
        const load = async () => {
            setLoadingCOs(true);
            try {
                const cos = await fetchCourseOutcomes(courseId);
                setCoList(cos);
            } catch (err) {
                console.error("Failed to load course outcomes:", err);
                setCoList([]);
            } finally {
                setLoadingCOs(false);
            }
        };
        load();
    }, [courseId]);

    // ─── Fetch TLOs when topic changes ────────────────────────────────────────
    useEffect(() => {
        if (!currentTopicId) {
            setLocalTLOs([]);
            setMappingMatrix({});
            setJustifications({});
            return;
        }
        const load = async () => {
            setLoadingTLOs(true);
            try {
                const currentTopic = topics.find(topic => topic.id === currentTopicId);
                const [tlos, mappings] = await Promise.all([
                    fetchTLOs(currentTopicId),
                    fetchTLOCoMappings({
                        topic_id: currentTopicId,
                        academic_batch_id: currentTopic?.academic_batch_id,
                        semester_id: currentTopic?.semester_id,
                        crs_id: currentTopic?.crs_id,
                    }),
                ]);
                setLocalTLOs(tlos);
                const nextMatrix: Record<string, number> = {};
                const nextJustifications: Record<string, string> = {};
                mappings.forEach((mapping) => {
                    const key = `tlo_${mapping.tlo_id}_co_${mapping.clo_id}`;
                    nextMatrix[key] = 1;
                    nextJustifications[key] = mapping.justification || "";
                });
                setMappingMatrix(nextMatrix);
                setJustifications(nextJustifications);
            } catch (err) {
                console.error("Failed to load TLOs:", err);
                setLocalTLOs([]);
                setMappingMatrix({});
                setJustifications({});
            } finally {
                setLoadingTLOs(false);
            }
        };
        load();
    }, [currentTopicId, topics]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleMappingChange = (tloId: number, coId: number) => {
        const key = `tlo_${tloId}_co_${coId}`;
        setMappingMatrix(prev => {
            const current = prev[key] ?? 0;
            // Toggle: if mapped → remove, else → map
            if (current > 0) {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            }
            return { ...prev, [key]: 1 };
        });
    };

    const openJustifyModal = (tloId: number, tloCode: string, coId: number) => {
        const key = `tlo_${tloId}_co_${coId}`;
        setTempJustification(justifications[key] || "");
        setActiveCell({ tloId, tloCode, coId });
        setShowJustifyModal(true);
    };

    const saveJustification = () => {
        if (!activeCell) return;
        const key = `tlo_${activeCell.tloId}_co_${activeCell.coId}`;
        setJustifications(prev => ({ ...prev, [key]: tempJustification }));
        setShowJustifyModal(false);
        setTempJustification("");
        setActiveCell(null);
    };

    const handleSave = async () => {
        if (!currentTopicId) {
            toast.warning("No topic selected");
            return;
        }
        if (Object.keys(mappingMatrix).length === 0) {
            toast.warning("At least one mapping must exist to save.");
            return;
        }

        const currentTopic = topics.find(topic => topic.id === currentTopicId);
        if (!currentTopic?.academic_batch_id || !currentTopic?.semester_id || !currentTopic?.crs_id) {
            toast.error("Topic context is incomplete. Reload the page and try again.");
            return;
        }

        setSaving(true);
        try {
            const existingMappings = await fetchTLOCoMappings({
                topic_id: currentTopicId,
                academic_batch_id: currentTopic.academic_batch_id,
                semester_id: currentTopic.semester_id,
                crs_id: currentTopic.crs_id,
            });
            const existingByPair = new Map(
                existingMappings.map((mapping) => [`${mapping.tlo_id}_${mapping.clo_id}`, mapping.tlo_map_id])
            );
            const mappings = Object.entries(mappingMatrix)
                .filter(([, val]) => val > 0)
                .map(([key]) => {
                    const parts = key.split("_");
                    const tlo_id = Number(parts[1]);
                    const co_id = Number(parts[3]);
                    const justification = justifications[key] ?? "";
                    return {
                        tlo_map_id: existingByPair.get(`${tlo_id}_${co_id}`),
                        tlo_id,
                        co_id,
                        justification,
                    };
                });
            await saveTLOCoMapping({
                academic_batch_id: currentTopic.academic_batch_id,
                semester_id: currentTopic.semester_id,
                crs_id: currentTopic.crs_id,
                topic_id: currentTopicId,
                mappings,
            });
            onSaveMapping(currentTopicId, mappingMatrix, "");
            toast.success("Mapping saved successfully!");
        } catch (err) {
            console.error("Failed to save mapping:", err);
            toast.error("Failed to save mapping. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const isCellMapped = (tloId: number, coId: number) =>
        (mappingMatrix[`tlo_${tloId}_co_${coId}`] ?? 0) > 0;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="curriculum-container p-6 bg-white rounded-xl shadow-sm border border-gray-100 relative max-w-6xl mx-auto mt-6">
            <div className="curriculum-card">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 mb-6 -mx-6 -mt-6 rounded-t-xl bg-white">
                    <h3 className="text-xl font-bold text-gray-800">
                        Mapping between Topic Learning Outcomes (TLOs) and Course Outcomes (COs) - Topicswise
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Readonly Context & Topic Selector */}
                <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Curriculum <span className="text-red-500">*</span></label>
                            <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm focus:outline-none" disabled>
                                <option>{curriculumLabel}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Term <span className="text-red-500">*</span></label>
                            <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm focus:outline-none" disabled>
                                <option>{termLabel}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Course <span className="text-red-500">*</span></label>
                            <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm focus:outline-none" disabled>
                                <option>{courseLabel}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Topics <span className="text-red-500">*</span></label>
                            <select
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                value={currentTopicId || ""}
                                onChange={(e) => {
                                    setCurrentTopicId(Number(e.target.value) || null);
                                    setMappingMatrix({});
                                    setJustifications({});
                                }}
                            >
                                <option value="">Select Topic</option>
                                {topics.map(t => (
                                    <option key={t.id} value={t.id}>{t.sl_no}. {t.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading States */}
                {(loadingCOs || loadingTLOs) && (
                    <div className="text-sm text-gray-500 italic px-2 mb-4">
                        {loadingCOs ? "Loading course outcomes..." : "Loading TLOs..."}
                    </div>
                )}

                {currentTopicId && !loadingCOs && !loadingTLOs ? (
                    <>
                        {/* No data messages */}
                        {coList.length === 0 && (
                            <div className="text-sm text-gray-500 italic p-4 border border-gray-200 rounded-lg bg-gray-50 mb-4">
                                No Course Outcomes (COs) found for this course.
                            </div>
                        )}
                        {localTLOs.length === 0 && (
                            <div className="text-sm text-gray-500 italic p-4 border border-gray-200 rounded-lg bg-gray-50 mb-4">
                                No TLOs found for this topic.
                            </div>
                        )}

                        {coList.length > 0 && localTLOs.length > 0 && (
                            <div className="overflow-x-auto mb-6 border border-gray-300 rounded-lg">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-white">
                                            <th className="border border-gray-300 px-4 py-3 text-left text-red-700 font-semibold sticky left-0 bg-white z-10 w-1/2">
                                                Topics Name - Topic Learning Outcomes / Course Outcomes
                                            </th>
                                            {coList.map(co => (
                                                <th
                                                    key={co.co_id}
                                                    className="border border-gray-300 px-2 py-3 text-center text-red-700 font-semibold"
                                                    title={co.co_statement}
                                                >
                                                    {co.co_code}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Topic row header */}
                                        <tr className="bg-gray-50">
                                            <td colSpan={coList.length + 1} className="border border-gray-300 px-4 py-3 text-blue-800 font-bold bg-blue-50">
                                                {topics.find(t => t.id === currentTopicId)?.sl_no}. {topics.find(t => t.id === currentTopicId)?.title}
                                            </td>
                                        </tr>
                                        {localTLOs.map((tlo, idx) => (
                                            <tr key={tlo.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                <td className="border border-gray-300 px-4 py-3 text-gray-800">
                                                    <div className="flex flex-col">
                                                        <strong>{tlo.code}.</strong>
                                                        <span className="mt-1">{stripHtml(tlo.outcome)}</span>
                                                    </div>
                                                </td>
                                                {coList.map(co => {
                                                    const mapped = isCellMapped(tlo.id, co.co_id);
                                                    const cellKey = `tlo_${tlo.id}_co_${co.co_id}`;
                                                    return (
                                                        <td key={co.co_id} className="border border-gray-300 text-center align-middle h-20">
                                                            <div className="flex flex-col items-center justify-center h-full gap-1 pt-2">
                                                                <input
                                                                    type="radio"
                                                                    name={`${tlo.id}_${co.co_id}`}
                                                                    checked={mapped}
                                                                    onChange={() => handleMappingChange(tlo.id, co.co_id)}
                                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                                                />
                                                                {mapped && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => openJustifyModal(tlo.id, tlo.code, co.co_id)}
                                                                            className="text-[10px] text-purple-600 hover:underline bg-transparent border-none cursor-pointer"
                                                                        >
                                                                            Justify
                                                                        </button>
                                                                        {justifications[cellKey] && (
                                                                            <span className="text-[9px] text-green-600 font-bold">✓</span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </>
                ) : null}

                {/* Bottom Actions */}
                <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[#df2c2c] text-white rounded-md hover:bg-red-700 transition-colors shadow-sm text-sm font-bold flex items-center gap-2"
                    >
                        <FaTimes className="w-4 h-4" /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!currentTopicId || saving}
                        className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors shadow-sm ${
                            !currentTopicId || saving
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                        <FaSave className="w-4 h-4" />
                        {saving ? "Saving..." : "Save Mapping"}
                    </button>
                </div>
            </div>

            {/* Cell Justification Modal */}
            {showJustifyModal && activeCell && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-base font-semibold text-gray-700 mb-1">Justification</h3>
                        <p className="text-xs text-blue-600 font-bold mb-3">
                            {activeCell.tloCode} → {coList.find(c => c.co_id === activeCell.coId)?.co_code}
                        </p>
                        <textarea
                            value={tempJustification}
                            onChange={(e) => setTempJustification(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 mb-4"
                            placeholder="Enter justification for this mapping..."
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowJustifyModal(false)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center gap-1"
                            >
                                <FaTimes className="w-3 h-3" /> Cancel
                            </button>
                            <button
                                onClick={saveJustification}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
                            >
                                <FaCheck className="w-3 h-3" /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
