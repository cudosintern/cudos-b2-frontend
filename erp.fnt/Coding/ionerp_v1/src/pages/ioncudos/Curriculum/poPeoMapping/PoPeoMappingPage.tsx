import React, { useState, useEffect } from "react";
import { FaSync, FaPaperPlane, FaCheck, FaTimes } from "react-icons/fa";
import {
    fetchCurriculumOptions,
    fetchPoList,
    fetchPeoList,
    saveMapping,
    fetchExistingMappings,
    deleteMapping
} from "./poPeoApi";
import { CurriculumOption, Po, Peo, PoPeoSavePayload } from "./types";
import { toast } from "react-toastify";

// ==================== INTERFACES ====================

interface MappingCell {
    level: number;
    justification: string;
    pp_id: number | null;
}

const cloneMappings = (
    source: Record<number, Record<number, MappingCell>>
): Record<number, Record<number, MappingCell>> => {
    return Object.fromEntries(
        Object.entries(source).map(([poId, peoMap]) => [
            Number(poId),
            Object.fromEntries(
                Object.entries(peoMap).map(([peoId, cell]) => [
                    Number(peoId),
                    { ...cell },
                ])
            ),
        ])
    );
};

// ==================== MAIN COMPONENT ====================

const PoPeoMappingPage: React.FC = () => {
    // ==================== STATE MANAGEMENT ====================

    // Mode management
    const [editMode, setEditMode] = useState<boolean>(false);
    const [mappingStatus, setMappingStatus] = useState<string>("Not Initiated");

    // Loading
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    // Curriculum selection
    const [selectedCurriculum, setSelectedCurriculum] = useState<string>("");
    const [curriculumOptions, setCurriculumOptions] = useState<CurriculumOption[]>([]);

    // PO and PEO lists from API
    const [poList, setPoList] = useState<Po[]>([]);
    const [peoList, setPeoList] = useState<Peo[]>([]);

    // Mapping data structure: { [po_id]: { [peo_id]: MappingCell } }
    const [mappings, setMappings] = useState<Record<number, Record<number, MappingCell>>>({});
    const [savedMappings, setSavedMappings] = useState<Record<number, Record<number, MappingCell>>>({});

    // Overall fields
    const [overallJustification, setOverallJustification] = useState<string>("");
    const [reviewComment, setReviewComment] = useState<string>("");

    // Modal states
    const [showJustifyModal, setShowJustifyModal] = useState(false);
    const [showRemapModal, setShowRemapModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showSkipModal, setShowSkipModal] = useState(false);
    const [activeCell, setActiveCell] = useState<{ poId: number; peoId: number } | null>(null);
    const [tempJustification, setTempJustification] = useState("");

    // Validation status
    const [invalidRows, setInvalidRows] = useState<number[]>([]);
    const [showValidationModal, setShowValidationModal] = useState(false);

    // ==================== EFFECTS ====================

    // Load curriculum dropdown on mount
    useEffect(() => {
        const loadCurriculums = async () => {
            setLoading(true);
            try {
                const opts = await fetchCurriculumOptions();
                setCurriculumOptions(opts);
            } catch (err) {
                console.error("Failed to load curriculum options", err);
            } finally {
                setLoading(false);
            }
        };
        loadCurriculums();
    }, []);

    // ==================== HANDLER FUNCTIONS ====================

    // Curriculum change — load PO + PEO lists in parallel
    const loadMappingData = async (academicBatchId: number) => {
        try {
            const [pos, peos, existingMap] = await Promise.all([
                fetchPoList(academicBatchId),
                fetchPeoList(academicBatchId),
                fetchExistingMappings(academicBatchId)
            ]);
            setPoList(pos);
            setPeoList(peos);

            const initMappings: Record<number, Record<number, MappingCell>> = {};
            for (const po of pos) {
                initMappings[po.po_id] = {};
                for (const peo of peos) {
                    initMappings[po.po_id][peo.peo_id] = { level: 0, justification: "", pp_id: null };
                }
            }

            existingMap.forEach((m: any) => {
                if (initMappings[m.po_id] && initMappings[m.po_id][m.peo_id]) {
                    initMappings[m.po_id][m.peo_id] = {
                        level: Number(m.map_level),
                        justification: m.justification || "",
                        pp_id: m.pp_id
                    };
                }
            });
            setMappings(initMappings);
            setSavedMappings(cloneMappings(initMappings));
            setMappingStatus(existingMap.length > 0 ? "Approved" : "Not Initiated");
        } catch (err) {
            console.error("Failed to load PO/PEO data", err);
            toast.error("Failed to load PO and PEO data. Please try again.");
            setPoList([]);
            setPeoList([]);
            setSavedMappings({});
        }
    };

    const handleCurriculumChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const academicBatchId = e.target.value;
        setSelectedCurriculum(academicBatchId);
        setEditMode(false);
        setMappings({});
        setSavedMappings({});
        setOverallJustification("");
        setReviewComment("");
        setMappingStatus("Not Initiated");

        if (!academicBatchId) {
            setPoList([]);
            setPeoList([]);
            return;
        }

        setLoading(true);
        await loadMappingData(Number(academicBatchId));
        setLoading(false);
    };

    // Re-map workflow
    const handleRemapClick = () => {
        setShowRemapModal(true);
    };

    const confirmRemap = () => {
        setEditMode(true);
        setShowRemapModal(false);
        setMappingStatus("Approval Rework");
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setMappings(cloneMappings(savedMappings));
        setMappingStatus(Object.keys(savedMappings).length > 0 ? "Approved" : "Not Initiated");
        setInvalidRows([]);
    };

    // Level change in edit mode
    const handleLevelChange = (poId: number, peoId: number, level: number) => {
        setMappings((prev) => ({
            ...prev,
            [poId]: {
                ...prev[poId],
                [peoId]: {
                    level,
                    justification: prev?.[poId]?.[peoId]?.justification || "",
                    pp_id: prev?.[poId]?.[peoId]?.pp_id || null,
                },
            },
        }));

        // Dynamically remove row from invalid list if a level is selected
        if (level > 0) {
            const rowIndex = poList.findIndex(p => p.po_id === poId);
            if (rowIndex !== -1) {
                setInvalidRows(prev => prev.filter(idx => idx !== rowIndex));
            }
        }
    };

    // Justification modal handlers
    const openJustifyModal = (poId: number, peoId: number) => {
        const existing = mappings?.[poId]?.[peoId]?.justification || "";
        setTempJustification(existing);
        setActiveCell({ poId, peoId });
        setShowJustifyModal(true);
    };

    const saveJustification = () => {
        if (!activeCell) return;

        setMappings((prev) => ({
            ...prev,
            [activeCell.poId]: {
                ...prev[activeCell.poId],
                [activeCell.peoId]: {
                    ...prev[activeCell.poId]?.[activeCell.peoId],
                    level: prev[activeCell.poId]?.[activeCell.peoId]?.level || 0,
                    justification: tempJustification,
                },
            },
        }));

        setShowJustifyModal(false);
        setTempJustification("");
        setActiveCell(null);
    };

    // Validation function
    const validateMappingData = (): boolean => {
        // Check if at least one mapping exists
        let hasMappings = false;
        for (const poId in mappings) {
            for (const peoId in mappings[poId]) {
                if (mappings[poId][peoId].level > 0) {
                    hasMappings = true;
                }
            }
        }

        if (!hasMappings) {
            toast.warning("Please fill at least one mapping level before saving");
            return false;
        }

        return true;
    };

    const validateAllRowsMapped = (): boolean => {
        const invalid: number[] = [];

        poList.forEach((po, index) => {
            const rowMappings = mappings[po.po_id] || {};
            const hasMapping = Object.values(rowMappings).some(cell => Number(cell.level) > 0);

            if (!hasMapping) {
                invalid.push(index);
            }
        });

        setInvalidRows(invalid);
        return invalid.length === 0;
    };

    // Approval workflow handlers
    const handleSendForApproval = () => {
        const isAllMapped = validateAllRowsMapped();
        if (!isAllMapped) {
            setShowValidationModal(true);
            setTimeout(() => {
                document
                    .querySelector(".invalid-row")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
            return;
        }

        if (!validateMappingData()) {
            return;
        }
        setShowApprovalModal(true);
    };

    const handleSkipApprovalClick = () => {
        setShowApprovalModal(false);
        setShowSkipModal(true);
    };

    // Build save payload from mappings state
    const buildSavePayload = (): PoPeoSavePayload[] => {
        const payload: PoPeoSavePayload[] = [];
        const academic_batch_id = Number(selectedCurriculum);

        Object.entries(mappings).forEach(([poId, peoMap]) => {
            Object.entries(peoMap).forEach(([peoId, cell]) => {
                if (cell.level > 0) {
                    payload.push({
                        pp_id: cell.pp_id,                    // null = INSERT new record
                        peo_id: Number(peoId),
                        po_id: Number(poId),
                        academic_batch_id,
                        map_level: String(cell.level),  // MUST be string
                        justification: cell.justification || "",
                    });
                }
            });
        });

        return payload;
    };

    const confirmPublish = async () => {
        const payload = buildSavePayload();

        const deletes: number[] = [];
        Object.values(mappings).forEach(peoMap => {
            Object.values(peoMap).forEach(cell => {
                if (cell.level === 0 && cell.pp_id !== null) {
                    deletes.push(cell.pp_id);
                }
            });
        });

        setSaving(true);
        try {
            if (payload.length > 0) {
                await saveMapping(payload);
            }
            for (const pp_id of deletes) {
                await deleteMapping({ pp_id });
            }

            // Success — reload data from backend
            await loadMappingData(Number(selectedCurriculum));

            setEditMode(false);
            setMappingStatus("Approved");
            setShowSkipModal(false);
            toast.success("Mapping saved and published successfully!");
        } catch (err) {
            console.error("Failed to save mapping", err);
            toast.error("Failed to save mapping. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // ==================== RENDER ====================

    return (
        <div className="curriculum-container p-6 bg-white rounded-xl shadow-sm border border-gray-100 relative">
            <div className="curriculum-card">
                {/* ==================== HEADER ==================== */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                        Mapping between Program Outcomes (POs) and Program Educational Objectives (PEOs)
                    </h3>
                </div>

                {/* ==================== CURRICULUM SELECTION ==================== */}
                <div className="mb-6 px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Curriculum *
                            </label>
                            <select
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={selectedCurriculum}
                                onChange={handleCurriculumChange}
                                disabled={loading}
                            >
                                <option value="">
                                    {loading ? "Loading..." : "Select Curriculum"}
                                </option>
                                {curriculumOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedCurriculum && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    PO<span className="lowercase">s</span> to PEO<span className="lowercase">s</span> Mapping Current Status
                                </label>
                                <div
                                    className={`px-4 py-2 rounded-md text-sm font-medium ${mappingStatus === "Approved"
                                        ? "bg-green-100 text-green-800"
                                        : mappingStatus === "Approval Rework"
                                            ? "bg-orange-100 text-orange-800"
                                            : "bg-blue-100 text-blue-800"
                                        }`}
                                >
                                    {mappingStatus}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ==================== LOADING STATE ==================== */}
                {loading && selectedCurriculum && (
                    <div className="px-6 mb-4 text-sm text-gray-500">Loading PO and PEO data...</div>
                )}

                {/* ==================== MAPPING TABLE ==================== */}
                {selectedCurriculum && !loading && (
                    <div className="px-6">
                        {poList.length === 0 || peoList.length === 0 ? (
                            <div className="text-sm text-gray-500 mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                                {poList.length === 0 && peoList.length === 0
                                    ? "No POs or PEOs found for this curriculum."
                                    : poList.length === 0
                                        ? "No POs found for this curriculum."
                                        : "No PEOs found for this curriculum."}
                            </div>
                        ) : (
                            <div className="overflow-x-auto mb-6 border border-gray-300 rounded-lg">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-white">
                                            <th
                                                className="border border-gray-300 px-4 py-3 text-left text-red-700 font-semibold"
                                                style={{ width: "40%" }}
                                            >
                                                Program Outcomes (POs) / Program Educational Objectives (PEOs)
                                            </th>
                                            {peoList.map((peo) => (
                                                <th
                                                    key={peo.peo_id}
                                                    className="border border-gray-300 px-4 py-3 text-center text-red-700 font-semibold"
                                                >
                                                    {peo.peo_reference || `PEO${peo.peo_id}`}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {poList.map((po, idx) => (
                                            <tr
                                                key={po.po_id}
                                                className={`${invalidRows.includes(idx)
                                                    ? "invalid-row"
                                                    : idx % 2 === 0
                                                        ? "bg-white"
                                                        : "bg-gray-50"
                                                    }`}
                                            >
                                                <td className="border border-gray-300 px-4 py-3">
                                                    <strong>{po.po_code}.</strong> {po.po_statement}
                                                </td>
                                                {peoList.map((peo) => {
                                                    const cell = mappings?.[po.po_id]?.[peo.peo_id];
                                                    const level = cell?.level || 0;

                                                    return (
                                                        <td key={peo.peo_id} className="border border-gray-300 text-center align-middle h-20">
                                                            {editMode ? (
                                                                <div className="flex flex-col items-center justify-center gap-1">
                                                                    <select
                                                                        value={level}
                                                                        onChange={(e) => handleLevelChange(po.po_id, peo.peo_id, Number(e.target.value))}
                                                                        className="w-16 border border-gray-300 rounded px-1 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                                                                    >
                                                                        <option value="0">-</option>
                                                                        <option value="1">1</option>
                                                                        <option value="2">2</option>
                                                                        <option value="3">3</option>
                                                                    </select>
                                                                    {level > 0 && (
                                                                        <button
                                                                            onClick={() => openJustifyModal(po.po_id, peo.peo_id)}
                                                                            className="text-xs text-blue-600 hover:underline"
                                                                        >
                                                                            Justify
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center gap-1">
                                                                    {level > 0 && (
                                                                        <>
                                                                            <div className="font-semibold text-base">{level}</div>
                                                                            <button
                                                                                onClick={() => openJustifyModal(po.po_id, peo.peo_id)}
                                                                                className="text-xs text-blue-600 hover:underline cursor-pointer"
                                                                            >
                                                                                Justify
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ==================== JUSTIFICATION & REVIEW COMMENTS ==================== */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Overall Justification</label>
                                <textarea
                                    disabled={!editMode}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md h-32 text-sm ${!editMode ? "bg-gray-100 cursor-not-allowed" : ""
                                        }`}
                                    value={overallJustification}
                                    onChange={(e) => setOverallJustification(e.target.value)}
                                    placeholder="Enter text here"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Review <span className="text-orange-600">Comment</span> from BoS
                                </label>
                                <textarea
                                    disabled={true}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md h-32 text-sm bg-gray-100 cursor-not-allowed"
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Enter text here"
                                />
                            </div>
                        </div>

                        {/* ==================== ACTION BUTTONS ==================== */}
                        <div className="flex justify-between items-center border-t border-gray-100 pt-6 mb-6">
                            {!editMode ? (
                                <button
                                    onClick={handleRemapClick}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
                                >
                                    <FaSync className="w-4 h-4" />
                                    Re-map
                                </button>
                            ) : (
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-6 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors shadow-sm text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            )}

                            <button
                                onClick={editMode ? handleSendForApproval : undefined}
                                disabled={!editMode}
                                className={`px-6 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm ${editMode
                                    ? "bg-[#2A4DD0] text-white hover:opacity-90 cursor-pointer"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                <FaPaperPlane className="w-4 h-4" />
                                Send for Approval
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ==================== RE-MAP CONFIRMATION MODAL ==================== */}
            {showRemapModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Re-mapping</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to remap entire mapping between POs and PEOs?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRemapModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemap}
                                className="px-4 py-2 bg-[#2A4DD0] text-white rounded-md hover:opacity-90 text-sm font-medium"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CELL JUSTIFICATION MODAL ==================== */}
            {showJustifyModal && activeCell && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">Justification:</h3>
                        <div className="mb-4">
                            <div className="text-xs text-gray-500 mb-2">
                                PO{activeCell.poId} - PEO{activeCell.peoId}
                            </div>
                            <textarea
                                value={tempJustification}
                                disabled={!editMode}
                                onChange={(e) => setTempJustification(e.target.value)}
                                rows={5}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${!editMode ? "bg-gray-100 cursor-not-allowed" : ""
                                    }`}
                                placeholder={editMode ? "Enter justification for this mapping..." : ""}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowJustifyModal(false)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center gap-1"
                            >
                                <FaTimes className="w-3 h-3" />
                                Close
                            </button>
                            {editMode && (
                                <button
                                    onClick={saveJustification}
                                    className="px-4 py-2 bg-[#2A4DD0] text-white rounded-md hover:opacity-90 text-sm font-medium flex items-center gap-1"
                                >
                                    <FaCheck className="w-3 h-3" />
                                    Save
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== SEND FOR APPROVAL MODAL ==================== */}
            {showApprovalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Send for Approval</h3>
                        <div className="space-y-3 text-sm text-gray-700 mb-6">
                            <p>
                                <strong>Current step:</strong> Mapping between POs and PEOs has completed.
                            </p>
                            <p>
                                <strong>Next step:</strong> Review of entire mapping between POs and PEOs.
                            </p>
                            <p className="text-blue-600">Email will be sent to BoS.</p>
                            <p>
                                <strong>Current State of Curriculum:</strong>{" "}
                                <span className="text-orange-600">{mappingStatus}</span>
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSkipApprovalClick}
                                className="px-4 py-2 bg-[#2A4DD0] text-white rounded-md hover:opacity-90 text-sm font-medium"
                            >
                                Skip Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== SKIP APPROVAL CONFIRMATION MODAL ==================== */}
            {showSkipModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Publication</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Mapping between Program Outcomes to Program Educational objectives will be published to Program Owner.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowSkipModal(false)}
                                disabled={saving}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPublish}
                                disabled={saving}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Ok"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== VALIDATION STATUS MODAL ==================== */}
            {showValidationModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                            Mapping between POs and PEOs Status
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            Entire mapping between POs and PEOs has to be completed before sending it for approval.
                        </p>
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowValidationModal(false)}
                                className="px-10 py-2 bg-[#2A4DD0] text-white rounded-md hover:opacity-90 text-sm font-medium shadow-sm transition-all"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== STYLES ==================== */}
            <style>{`
                .invalid-row {
                    background-color: #ffe6e6 !important;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-box {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    width: 450px;
                    text-align: center;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default PoPeoMappingPage;
