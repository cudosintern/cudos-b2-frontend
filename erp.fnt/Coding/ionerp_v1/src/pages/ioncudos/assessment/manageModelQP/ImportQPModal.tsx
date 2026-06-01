import React, { useState, useEffect } from "react";
import { 
    FaTimes, 
    FaFileImport, 
    FaSearch, 
    FaCheckCircle 
} from "react-icons/fa";
import { 
    fetchDepartments, 
    fetchPrograms, 
    fetchCurriculums, 
    fetchTerms, 
    fetchCourses, 
    fetchQPList,
    importQP
} from "./modelQPApi";
import { HHMMToHours, mapToDropdown } from "./utils/qpMappers";
import { 
    ModelQPApi, 
    CourseQPRowUI,
    DropdownOption 
} from "./types";

interface ImportQPModalProps {
    courseId: number;
    curriculumId: number;
    semesterId: number;
    onImport: (qp: ModelQPApi) => void;
    onClose: () => void;
}

const ImportQPModal: React.FC<ImportQPModalProps> = ({
    courseId,
    curriculumId,
    semesterId,
    onImport,
    onClose,
}) => {
    // ==================== STATE MANAGEMENT ====================
    const [loading, setLoading] = useState<boolean>(false);
    const [importing, setImporting] = useState<boolean>(false);

    // Dropdowns State (Source)
    const [departments, setDepartments] = useState<DropdownOption[]>([]);
    const [programs, setPrograms] = useState<DropdownOption[]>([]);
    const [curriculums, setCurriculums] = useState<DropdownOption[]>([]);
    const [terms, setTerms] = useState<DropdownOption[]>([]);
    const [courses, setCourses] = useState<DropdownOption[]>([]);

    // Selection State (Source)
    const [selectedDept, setSelectedDept] = useState<string>("");
    const [selectedProg, setSelectedProg] = useState<string>("");
    const [selectedCurr, setSelectedCurr] = useState<string>("");
    const [selectedTerm, setSelectedTerm] = useState<string>("");
    const [selectedCourse, setSelectedCourse] = useState<string>("");

    // QP List (Source)
    const [qpList, setQpList] = useState<CourseQPRowUI[]>([]);
    const [selectedQPId, setSelectedQPId] = useState<number | null>(null);

    // ==================== EFFECTS ====================

    useEffect(() => {
        fetchDepartments().then((data: any[]) => {
            const mapped = mapToDropdown(data, "dept_name", "dept_id");
            setDepartments(mapped);
        });
    }, []);

    useEffect(() => {
        if (selectedDept) {
            fetchPrograms(Number(selectedDept)).then((data: any[]) => {
                const mapped = mapToDropdown(data, "pgm_title", "pgm_id");
                setPrograms(mapped);
            });
        } else {
            setPrograms([]);
        }
    }, [selectedDept]);

    useEffect(() => {
        if (selectedProg) {
            fetchCurriculums(Number(selectedProg)).then((data: any[]) => {
                const mapped = mapToDropdown(data, "academic_batch_code", "academic_batch_id");
                setCurriculums(mapped);
            });
        } else {
            setCurriculums([]);
        }
    }, [selectedProg]);

    useEffect(() => {
        if (selectedCurr) {
            fetchTerms(Number(selectedCurr)).then((data: any[]) => {
                const mapped = mapToDropdown(data, "display_name", "semester_id");
                setTerms(mapped);
            });
        } else {
            setTerms([]);
        }
    }, [selectedCurr]);

    useEffect(() => {
        if (selectedTerm && selectedCurr) {
            fetchCourses(
                Number(selectedCurr),
                Number(selectedTerm),
                Number(selectedDept),
                Number(selectedProg),
            ).then(data => setCourses(data));
        } else {
            setCourses([]);
        }
    }, [selectedTerm, selectedCurr, selectedDept, selectedProg]);

    const handleSearch = async () => {
        if (!selectedDept || !selectedProg || !selectedCurr || !selectedTerm || !selectedCourse) return;
        
        console.log("QP List Params:", {
            schoolId: Number(selectedDept),
            programId: Number(selectedProg),
            curriculumId: Number(selectedCurr),
            semesterId: Number(selectedTerm),
            courseId: Number(selectedCourse),
        });

        setLoading(true);
        try {
            const list = await fetchQPList({
                schoolId: Number(selectedDept),
                programId: Number(selectedProg),
                curriculumId: Number(selectedCurr),
                semesterId: Number(selectedTerm),
            });
            const filtered = list.filter((qp) => qp.courseId === Number(selectedCourse) && !!qp.qpId);
            setQpList(filtered);
            setSelectedQPId(null);
        } catch (err) {
            console.error("Error fetching QPs:", err);
            setQpList([]);
        }
        setLoading(false);
    };

    const handleImportAction = async () => {
        if (!selectedQPId) return;
        setImporting(true);
        try {
            const imported = await importQP({
                sourceQpId: selectedQPId,
                targetCourseId: courseId,
                targetCurriculumId: curriculumId,
                targetSemesterId: semesterId,
            });
            if (imported) {
                onImport(imported);
            } else {
                alert("Import failed.");
            }
        } catch (err) {
            console.error("Import error:", err);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col scale-in-center transition-all">
                
                {/* Header */}
                <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-xl border border-teal-50">
                           <FaFileImport className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Import Model Question Paper</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Copy an existing QP from another course</p>
                        </div>

                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-xl shadow-sm border border-gray-100">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-10 overflow-y-auto space-y-8">
                    
                    {/* Source Course Selection Area */}
                    <div className="bg-white border-2 border-gray-100 p-8 rounded-3xl shadow-inner-lg">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span> Select Source Course Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">School</label>
                                <select 
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-sm"
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                >
                                    <option value="">Select School</option>
                                    {departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Program</label>
                                <select 
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-sm disabled:opacity-50"
                                    value={selectedProg}
                                    disabled={!selectedDept}
                                    onChange={(e) => setSelectedProg(e.target.value)}
                                >
                                    <option value="">Select Program</option>
                                    {programs.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Curriculum</label>
                                <select 
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-sm disabled:opacity-50"
                                    value={selectedCurr}
                                    disabled={!selectedProg}
                                    onChange={(e) => setSelectedCurr(e.target.value)}
                                >
                                    <option value="">Select Curriculum</option>
                                    {curriculums.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Term</label>
                                <select 
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-sm disabled:opacity-50"
                                    value={selectedTerm}
                                    disabled={!selectedCurr}
                                    onChange={(e) => setSelectedTerm(e.target.value)}
                                >
                                    <option value="">Select Term</option>
                                    {terms.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Course</label>
                                <div className="flex gap-4">
                                    <select 
                                        className="flex-1 bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-sm disabled:opacity-50"
                                        value={selectedCourse}
                                        disabled={!selectedTerm}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                    >
                                        <option value="">Select Course</option>
                                        {courses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                    <button 
                                        onClick={handleSearch}
                                        className="px-10 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center gap-3 hover:-translate-y-0.5"
                                        disabled={!selectedCourse}
                                    >
                                        <FaSearch className="w-3 h-3" /> Fetch QPs
                                    </button>


                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Source QP List Table */}
                    {loading ? (
                        <div className="py-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-3"></div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Searching available papers...</p>
                        </div>
                    ) : qpList.length > 0 ? (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Select Paper To Import
                            </h4>
                            <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[9px] font-black tracking-[0.2em]">
                                        <tr>
                                            <th className="px-6 py-4 text-left w-16 border-r border-slate-100">Select</th>
                                            <th className="px-6 py-4 text-left border-r border-slate-100">QP Title</th>
                                            <th className="px-6 py-4 text-center border-r border-slate-100">Duration</th>
                                            <th className="px-6 py-4 text-center">Max Marks</th>
                                        </tr>
                                    </thead>


                                    <tbody className="divide-y divide-gray-100">
                                        {qpList.map(qp => (
                                            <tr 
                                                key={qp.qpId} 
                                                className={`cursor-pointer transition-all ${selectedQPId === qp.qpId ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                                                onClick={() => setSelectedQPId(qp.qpId || null)}
                                            >
                                                <td className="px-6 py-4 text-center">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedQPId === qp.qpId ? 'bg-teal-500 border-teal-500 shadow-md' : 'border-gray-200 bg-white'}`}>
                                                        {selectedQPId === qp.qpId && <FaCheckCircle className="text-white text-xs" />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-black text-gray-800">{qp.courseTitle}</td>
                                                <td className="px-6 py-4 text-center font-bold text-gray-500">
                                                    {(qp.duration ?? 0).toFixed(1)} Hrs
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-blue-700">{qp.maxMarks ?? 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : selectedCourse && !loading && (
                        <div className="py-12 text-center text-gray-400 text-sm font-bold uppercase tracking-widest h-[230px] flex flex-col justify-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50">
                            No model question papers found for this course.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white p-8 border-t border-gray-100 flex justify-end gap-4 rounded-b-3xl">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleImportAction}
                        disabled={!selectedQPId || importing}
                        className={`px-12 py-3 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 active:scale-95 ${(!selectedQPId || importing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700'}`}
                    >
                        <FaFileImport className="w-3.5 h-3.5" /> {importing ? "Importing..." : "Import Paper"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportQPModal;
