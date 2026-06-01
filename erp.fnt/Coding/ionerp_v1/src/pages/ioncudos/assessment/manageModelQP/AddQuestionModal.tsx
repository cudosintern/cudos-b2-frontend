import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Editor } from "@tinymce/tinymce-react";
import { FaTimes, FaSave, FaFileImport } from "react-icons/fa";
import { DropdownOption } from "./types";

// ── Public contract ──────────────────────────────────────────────────────────
export interface QuestionFormData {
    unitId: string;       // module_id as string
    mainQNo: string;      // "1" … "N" — group index inside the unit
    subQNo: string;       // "a" or "b" — position inside the EITHER_OR group
    isMandatory: boolean;
    co_id: string;        // co_id as string, "" → null
    bloom_level: string;
    marks: string;
    content: string;      // HTML from TinyMCE
    // Identifiers used during edit (set by parent, not the user)
    mIdx?: number;
    gIdx?: number;
    qIdx?: number;
}

export interface UnitOption {
    id: string;             // module_id
    name: string;           // module_name
    groupCount: number;     // number of EITHER_OR groups
    usedMarks: number;      // sum of marks already assigned in this unit
    totalMarks: number;     // groupCount × marksPerGroup
}

interface AddQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: QuestionFormData) => void;
    units: UnitOption[];
    coOptions: DropdownOption[];
    bloomOptions: DropdownOption[];
    initialData?: QuestionFormData | null; // pre-filled when editing
    grandTotalUsed: number;
    grandTotalMax: number;
}

// ── Component ────────────────────────────────────────────────────────────────
const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    units,
    coOptions,
    bloomOptions,
    initialData,
    grandTotalUsed,
    grandTotalMax,
}) => {
    const emptyForm: QuestionFormData = {
        unitId: "",
        mainQNo: "",
        subQNo: "",
        isMandatory: true,
        co_id: "",
        bloom_level: "",
        marks: "",
        content: "",
    };

    const [formData, setFormData] = useState<QuestionFormData>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [coDropdownOpen, setCoDropdownOpen] = useState(false);
    const [bloomDropdownOpen, setBloomDropdownOpen] = useState(false);

    // Helpers for comma-separated multiselect
    const getSelectedArray = (val: string) => val ? val.split(',').filter(Boolean) : [];
    const toggleValue = (current: string, val: string) => {
        const arr = getSelectedArray(current);
        return arr.includes(val) ? arr.filter(v => v !== val).join(',') : [...arr, val].join(',');
    };

    // Sync form when modal opens or edit target changes
    useEffect(() => {
        setFormData(initialData ? { ...initialData } : emptyForm);
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, isOpen]);

    // ── Derived helpers ──────────────────────────────────────────────────────
    const selectedUnit = units.find(u => u.id === formData.unitId);
    const groupOptions = selectedUnit
        ? Array.from({ length: selectedUnit.groupCount }, (_, i) => String(i + 1))
        : [];
    const questionNo =
        formData.mainQNo && formData.subQNo
            ? `Q${formData.mainQNo}${formData.subQNo}`
            : "—";

    // ── Validation ───────────────────────────────────────────────────────────
    const validate = () => {
        const errs: Record<string, string> = {};
        
        // Use trim and check for empty strings explicitly
        if (!formData.unitId || String(formData.unitId).trim() === "") errs.unitId = "This field is required.";
        if (!formData.mainQNo || String(formData.mainQNo).trim() === "") errs.mainQNo = "This field is required.";
        if (!formData.subQNo || String(formData.subQNo).trim() === "") errs.subQNo = "This field is required.";
        
        if (!formData.co_id || String(formData.co_id).trim() === "") errs.co_id = "This field is required.";
        if (!formData.marks || String(formData.marks).trim() === "") errs.marks = "This field is required.";
        
        if (!formData.content || formData.content.replace(/<[^>]*>/g, '').trim() === '') {
            errs.content = "Question content is required.";
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(formData);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog
                as="div"
                className="fixed inset-0 z-[110] overflow-y-auto"
                onClose={onClose}
            >
                <div className="min-h-screen px-4 text-center">
                    {/* Backdrop */}
                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black opacity-50" />
                    </Transition.Child>

                    {/* Vertical centering trick */}
                    <span className="inline-block h-screen align-middle" aria-hidden="true">
                        &#8203;
                    </span>

                    {/* Panel */}
                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <div className="inline-block w-full max-w-6xl overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative">

                            {/* ── Header ── */}
                            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200">
                                <Dialog.Title as="h3" className="text-lg font-semibold text-gray-800">
                                    {initialData ? "Edit Question" : "Add Question"}
                                </Dialog.Title>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            {/* ── Body ── */}
                            <div className="p-6 bg-gray-50 flex flex-col gap-6">

                                {/* Top row: dropdowns + Import button */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">

                                    {/* Section / Parts (Units) */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-baseline pr-1">
                                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                                Section / Parts (Units) <span className="text-red-500">*</span>
                                            </label>
                                            {errors.unitId && (
                                                <span className="text-[10px] text-red-500 font-bold italic tracking-tight">{errors.unitId}</span>
                                            )}
                                        </div>
                                        <select
                                            value={formData.unitId}
                                            onChange={(e) =>
                                                setFormData({ ...formData, unitId: e.target.value, mainQNo: "", subQNo: "" })
                                            }
                                            className={`w-full px-3 py-2 text-sm border ${
                                                errors.unitId ? "border-red-500 bg-red-50/10" : "border-gray-300"
                                            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        >
                                            <option value="">Select Unit</option>
                                            {units.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Main Q.No. */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-baseline pr-1">
                                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                                Main Q.No. <span className="text-red-500">*</span>
                                            </label>
                                            {errors.mainQNo && (
                                                <span className="text-[10px] text-red-500 font-bold italic tracking-tight">{errors.mainQNo}</span>
                                            )}
                                        </div>
                                        <select
                                            value={formData.mainQNo}
                                            onChange={(e) =>
                                                setFormData({ ...formData, mainQNo: e.target.value, subQNo: "" })
                                            }
                                            disabled={!formData.unitId}
                                            className={`w-full px-3 py-2 text-sm border ${
                                                errors.mainQNo ? "border-red-500 bg-red-50/10" : "border-gray-300"
                                            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                                        >
                                            <option value="">Select</option>
                                            {groupOptions.map(n => (
                                                <option key={n} value={n}>{n}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Sub Q.No. */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-baseline pr-1">
                                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                                Sub Q.No. <span className="text-red-500">*</span>
                                            </label>
                                            {errors.subQNo && (
                                                <span className="text-[10px] text-red-500 font-bold italic tracking-tight">{errors.subQNo}</span>
                                            )}
                                        </div>
                                        <select
                                            value={formData.subQNo}
                                            onChange={(e) =>
                                                setFormData({ ...formData, subQNo: e.target.value })
                                            }
                                            disabled={!formData.mainQNo}
                                            className={`w-full px-3 py-2 text-sm border ${
                                                errors.subQNo ? "border-red-500 bg-red-50/10" : "border-gray-300"
                                            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                                        >
                                            <option value="">Select</option>
                                            <option value="a">a</option>
                                            <option value="b">b</option>
                                        </select>
                                    </div>

                                    {/* Import Question */}
                                    <div className="pt-6 flex justify-end">
                                        <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 flex items-center gap-2">
                                            <FaFileImport size={12} />
                                            Import Question
                                        </button>
                                    </div>
                                </div>

                                {/* Main body: two-column layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                    {/* Left column: metadata */}
                                    <div className="lg:col-span-4 space-y-4">

                                        {/* Mandatory checkbox */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="qp-mandatory"
                                                checked={formData.isMandatory}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, isMandatory: e.target.checked })
                                                }
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="qp-mandatory" className="text-sm font-medium text-gray-700">
                                                Mandatory
                                            </label>
                                        </div>

                                        {/* Question No. (auto) */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Question No.
                                            </label>
                                            <input
                                                type="text"
                                                value={questionNo}
                                                readOnly
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>

                                        {/* Course Outcome - Multiselect */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Course Outcome <span className="text-red-500">*</span>
                                                </label>
                                                {errors.co_id && (
                                                    <span className="text-[10px] text-red-500 font-bold italic tracking-tight">{errors.co_id}</span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => { setCoDropdownOpen(v => !v); setBloomDropdownOpen(false); }}
                                                    className={`w-full px-3 py-2 text-sm border ${errors.co_id ? "border-red-500 bg-red-50/10" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex justify-between items-center min-h-[38px]`}
                                                >
                                                    <span className="flex flex-wrap gap-1 flex-1">
                                                        {getSelectedArray(formData.co_id).length === 0
                                                            ? <span className="text-gray-400">Select CO(s)</span>
                                                            : getSelectedArray(formData.co_id).map(v => {
                                                                const opt = coOptions.find(o => String(o.value) === v);
                                                                return <span key={v} className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{opt ? opt.label.split(' - ')[0] : v}</span>;
                                                            })
                                                        }
                                                    </span>
                                                    <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${coDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                                {coDropdownOpen && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
                                                        {coOptions.map(co => {
                                                            const selected = getSelectedArray(formData.co_id).includes(String(co.value));
                                                            return (
                                                                <label key={String(co.value)} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${selected ? 'bg-blue-50' : ''}`}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selected}
                                                                        onChange={() => setFormData({ ...formData, co_id: toggleValue(formData.co_id, String(co.value)) })}
                                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                    />
                                                                    <span className={`${selected ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>{co.label}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bloom's Level - Multiselect */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bloom's Level
                                            </label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => { setBloomDropdownOpen(v => !v); setCoDropdownOpen(false); }}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex justify-between items-center min-h-[38px]"
                                                >
                                                    <span className="flex flex-wrap gap-1 flex-1">
                                                        {getSelectedArray(formData.bloom_level).length === 0
                                                            ? <span className="text-gray-400">Select Level(s)</span>
                                                            : getSelectedArray(formData.bloom_level).map(v => (
                                                                <span key={v} className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{v}</span>
                                                            ))
                                                        }
                                                    </span>
                                                    <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${bloomDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                                {bloomDropdownOpen && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
                                                        {bloomOptions.map(b => {
                                                            const selected = getSelectedArray(formData.bloom_level).includes(String(b.value));
                                                            return (
                                                                <label key={String(b.value)} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-purple-50 text-sm ${selected ? 'bg-purple-50' : ''}`}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selected}
                                                                        onChange={() => setFormData({ ...formData, bloom_level: toggleValue(formData.bloom_level, String(b.value)) })}
                                                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                                                    />
                                                                    <span className={`${selected ? 'text-purple-700 font-semibold' : 'text-gray-700'}`}>{b.label}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Marks */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Marks <span className="text-red-500">*</span>
                                                </label>
                                                {errors.marks && (
                                                    <span className="text-[10px] text-red-500 font-bold italic tracking-tight">{errors.marks}</span>
                                                )}
                                            </div>
                                            <input
                                                type="number"
                                                min={0}
                                                value={formData.marks}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, marks: e.target.value })
                                                }
                                                placeholder="Enter marks"
                                                className={`w-full px-3 py-2 text-sm border ${errors.marks ? "border-red-500 bg-red-50/10" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            />
                                        </div>
                                    </div>

                                    {/* Right column: TinyMCE */}
                                    <div className="lg:col-span-8 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                                                Enter Question in below textarea :
                                            </label>
                                            {errors.content && (
                                                <span className="text-[10px] text-red-500 font-bold italic tracking-tight">{errors.content}</span>
                                            )}
                                        </div>
                                        <div className={`border ${errors.content ? "border-red-500 bg-red-50/10" : "border-gray-300"} rounded-md overflow-hidden bg-white`}>
                                            <Editor
                                                apiKey="no-api-key"
                                                tinymceScriptSrc="/tinymce/tinymce.min.js"
                                                value={formData.content}
                                                onEditorChange={(content) =>
                                                    setFormData({ ...formData, content })
                                                }
                                                init={{
                                                    height: 350,
                                                    menubar: "file edit insert view format table tools",
                                                    plugins: [
                                                        "advlist", "autolink", "lists", "link", "image",
                                                        "charmap", "preview", "anchor", "searchreplace",
                                                        "visualblocks", "code", "fullscreen",
                                                        "insertdatetime", "media", "table", "wordcount",
                                                    ],
                                                    toolbar:
                                                        "undo redo | formatselect | bold italic underline | " +
                                                        "alignleft aligncenter alignright alignjustify | " +
                                                        "bullist numlist outdent indent | link image table | " +
                                                        "code fullscreen",
                                                    branding: false,
                                                    promotion: false,
                                                    statusbar: true,
                                                    resize: true,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2 pt-6 border-t border-gray-200">

                                    {/* Stats */}
                                    <div className="flex gap-8">
                                        <div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Section / Parts (Units) Marks
                                            </span>
                                            <p className="text-lg font-bold text-gray-800">
                                                {selectedUnit
                                                    ? `${selectedUnit.usedMarks.toFixed(2)} / ${selectedUnit.totalMarks.toFixed(2)}`
                                                    : "— / —"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Grand Total Marks
                                            </span>
                                            <p className="text-lg font-bold text-gray-800">
                                                {grandTotalUsed.toFixed(2)} / {grandTotalMax.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSave}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                                        >
                                            {initialData ? <><FaSave /> Update</> : <><FaSave /> Save</>}
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-2 bg-red-500 text-white rounded-md text-sm font-bold hover:bg-red-600 transition-all shadow-md flex items-center gap-2"
                                        >
                                            <FaTimes />
                                            Close
                                        </button>
                                    </div>
                                </div>

                            </div>{/* /.body */}
                        </div>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
};

export default AddQuestionModal;
