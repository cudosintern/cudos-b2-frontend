import React, { useState, useEffect } from 'react';
import './CiaQp.css';
import '../cia/cia.css';
import { 
    FaFileImport, FaTimes, FaSearch, FaExclamationCircle, 
    FaQuestionCircle, FaCloudDownloadAlt, FaLink
} from 'react-icons/fa';
import { 
    getDepartments, getPrograms, getCurriculums, 
    getTerms, getCourses, getCourseDetails, 
    getQp, importQp 
} from './CiaQpApi';

interface Props {
    targetAo: any;
    onClose: () => void;
    onImportSuccess: () => void;
}

const CiaQpImportModal: React.FC<Props> = ({ targetAo, onClose, onImportSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [availableQps, setAvailableQps] = useState<any[]>([]);
    const [selectedSourceAo, setSelectedSourceAo] = useState<any>(null);
    
    // Import source filters
    const [sourceFilters, setSourceFilters] = useState({
        school_id: '',
        program_id: '',
        academic_batch_id: '',
        semester_id: '',
        crs_id: ''
    });

    const [dropdowns, setDropdowns] = useState({
        schools: [] as any[],
        programs: [] as any[],
        batches: [] as any[],
        terms: [] as any[],
        courses: [] as any[]
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const depts = await getDepartments();
            setDropdowns(prev => ({ ...prev, schools: depts || [] }));
        } catch (err) { console.error(err); }
    };

    const handleFilterChange = async (name: string, value: string) => {
        const newFilters = { ...sourceFilters, [name]: value };
        
        if (name === 'school_id') {
            const pgms = await getPrograms(value);
            setDropdowns(prev => ({ ...prev, programs: pgms || [], batches: [], terms: [], courses: [] }));
            newFilters.program_id = '';
            newFilters.academic_batch_id = '';
            newFilters.semester_id = '';
            newFilters.crs_id = '';
        } else if (name === 'program_id') {
            const currs = await getCurriculums(value);
            setDropdowns(prev => ({ ...prev, batches: currs || [], terms: [], courses: [] }));
            newFilters.academic_batch_id = '';
            newFilters.semester_id = '';
            newFilters.crs_id = '';
        } else if (name === 'academic_batch_id') {
            const terms = await getTerms(value);
            setDropdowns(prev => ({ ...prev, terms: terms || [], courses: [] }));
            newFilters.semester_id = '';
            newFilters.crs_id = '';
        } else if (name === 'semester_id') {
            const courses = await getCourses(value, sourceFilters.academic_batch_id);
            setDropdowns(prev => ({ ...prev, courses: courses || [] }));
            newFilters.crs_id = '';
        }

        setSourceFilters(newFilters);
    };

    const fetchSourceQps = async () => {
        if (!sourceFilters.crs_id) return;
        setSearching(true);
        setSelectedSourceAo(null);
        try {
            const data = await getCourseDetails(sourceFilters);
            const qpsWithConfig = (data.assessment_occasions || []).filter((ao: any) => ao.qpd_id !== null);
            setAvailableQps(qpsWithConfig);
        } catch (err) {
            console.error(err);
            setAvailableQps([]);
        } finally {
            setSearching(false);
        }
    };

    const handleImport = async () => {
        if (!selectedSourceAo) return;
        if (!window.confirm(`Import framework from ${selectedSourceAo.ao_name}? This will overwrite current configurations.`)) return;
        setLoading(true);
        try {
            const sourceQp = await getQp(selectedSourceAo.qpd_id);
            if (sourceQp) {
                const importPayload = {
                    ao_id: targetAo.ao_id,
                    crs_id: targetAo.crs_id,
                    academic_batch_id: targetAo.academic_batch_id,
                    semester_id: targetAo.semester_id,
                    qpd_title: sourceQp.qp_name || `Imported ${targetAo.ao_name}`,
                    qpd_type: targetAo.ao_type_id,
                    qpd_timing: sourceQp.qpd_timing || '90 Mins',
                    qpd_max_marks: targetAo.max_marks,
                    qpd_gt_marks: targetAo.max_marks,
                    qpd_num_units: sourceQp.units?.length || 1,
                    ao_method_id: targetAo.ao_method_id || 1,
                    units: sourceQp.units?.map((u: any) => ({
                        unit_no: u.unit_name || u.qp_unit_code,
                        qp_total_unitquestion: u.questions?.length || 0,
                        qp_attempt_unitquestion: u.qp_attempt_unitquestion || 1,
                        qp_utotal_marks: u.qp_utotal_marks || 0,
                        questions: (u.questions || u.main_questions)?.map((q: any) => ({
                            question_no: q.question_no || q.qp_mq_code,
                            question_text: q.question_text || q.qp_content,
                            marks: q.marks || q.qp_subq_marks,
                            mappings: q.mappings || []
                        }))
                    })) || []
                };

                const res = await importQp(importPayload);
                if (res.status) {
                    alert("Framework imported successfully.");
                    onImportSuccess();
                    onClose();
                } else {
                    alert(res.message || "Import failed.");
                }
            }
        } catch (err: any) {
            alert(err.response?.data?.detail || "Import failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 md:p-12">
            <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in border border-white">
                {/* Header */}
                <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-[#4a8494] flex items-center gap-3">
                         Import Assessment Framework (CCE)
                    </h2>
                    <div className="flex items-center gap-4 text-slate-400">
                        <FaQuestionCircle size={20} className="hover:text-blue-500 cursor-pointer transition-colors" />
                        <button onClick={onClose} className="hover:text-red-500 transition-colors">
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-10 space-y-10">
                    {/* Breadcrumbs Info Bar */}
                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-12">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Curriculum</span>
                                <span className="text-sm font-bold text-slate-700">{targetAo.academic_batch_code || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Term</span>
                                <span className="text-sm font-bold text-slate-700">{targetAo.term_name || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Section</span>
                                <span className="text-sm font-bold text-slate-700">{targetAo.section_name || targetAo.section || 'All'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course</span>
                                <span className="text-sm font-bold text-slate-700">{targetAo.crs_code} - {targetAo.crs_title}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assessment Occasion</span>
                                <span className="text-sm font-bold text-slate-700">{targetAo.ao_name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Source Selection Filters */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold text-[#4a8494] uppercase tracking-widest border-b border-slate-100 pb-4 italic flex items-center gap-2">
                             Import Source Details
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="cia-input-group">
                                <label className="cia-label">School <span className="text-red-500">*</span></label>
                                <select className="cia-select border-slate-200 focus:border-[#4a8494] rounded-xl" value={sourceFilters.school_id} onChange={(e) => handleFilterChange('school_id', e.target.value)}>
                                    <option value="">Select School</option>
                                    {dropdowns.schools.map((s: any) => <option key={s.id} value={s.id}>{s.name || s.dept_name}</option>)}
                                </select>
                            </div>
                            <div className="cia-input-group">
                                <label className="cia-label">Program <span className="text-red-500">*</span></label>
                                <select className="cia-select border-slate-200 focus:border-[#4a8494] rounded-xl" value={sourceFilters.program_id} onChange={(e) => handleFilterChange('program_id', e.target.value)} disabled={!sourceFilters.school_id}>
                                    <option value="">Select Program</option>
                                    {dropdowns.programs.map((p: any) => <option key={p.id} value={p.id}>{p.name || p.pgm_title}</option>)}
                                </select>
                            </div>
                            <div className="cia-input-group">
                                <label className="cia-label">Curriculum <span className="text-red-500">*</span></label>
                                <select className="cia-select border-slate-200 focus:border-[#4a8494] rounded-xl" value={sourceFilters.academic_batch_id} onChange={(e) => handleFilterChange('academic_batch_id', e.target.value)} disabled={!sourceFilters.program_id}>
                                    <option value="">Select Curriculum</option>
                                    {dropdowns.batches.map((b: any) => <option key={b.id} value={b.id}>{b.name || b.academic_batch_code}</option>)}
                                </select>
                            </div>
                            <div className="cia-input-group">
                                <label className="cia-label">Term <span className="text-red-500">*</span></label>
                                <select className="cia-select border-slate-200 focus:border-[#4a8494] rounded-xl" value={sourceFilters.semester_id} onChange={(e) => handleFilterChange('semester_id', e.target.value)} disabled={!sourceFilters.academic_batch_id}>
                                    <option value="">Select Term</option>
                                    {dropdowns.terms.map((t: any) => <option key={t.id} value={t.id}>{t.name || t.term_name}</option>)}
                                </select>
                            </div>
                            <div className="cia-input-group flex flex-col justify-end">
                                <label className="cia-label">Course <span className="text-red-500">*</span></label>
                                <div className="flex gap-3">
                                    <select className="cia-select flex-1 border-slate-200 focus:border-[#4a8494] rounded-xl" value={sourceFilters.crs_id} onChange={(e) => handleFilterChange('crs_id', e.target.value)} disabled={!sourceFilters.semester_id}>
                                        <option value="">Select Course</option>
                                        {dropdowns.courses.map((c: any) => <option key={c.id || c.crs_id} value={c.id || c.crs_id}>{c.name || c.course_title}</option>)}
                                    </select>
                                    <button onClick={fetchSourceQps} className="px-5 bg-[#4a8494] text-white rounded-xl hover:bg-[#3d6d7a] transition-all shadow-lg active:scale-95"><FaSearch /></button>
                                </div>
                            </div>
                        </div>

                        {/* Result Table Placeholder */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 px-8 py-5 border-b border-slate-200">
                                <h5 className="text-[10px] font-bold text-[#4a8494] uppercase tracking-widest italic flex items-center gap-2">Available frameworks for selection</h5>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Occasion Name</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Framework Title</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duration</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Marks</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-l border-slate-100 bg-blue-50/20">Assessment Weight</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {availableQps.length > 0 ? availableQps.map(ao => (
                                            <tr key={ao.ao_id} 
                                                className={`transition-colors cursor-pointer ${selectedSourceAo?.ao_id === ao.ao_id ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
                                                onClick={() => setSelectedSourceAo(ao)}
                                            >
                                                <td className="px-6 py-5 text-center">
                                                    <input type="radio" className="accent-[#4a8494] w-4 h-4" checked={selectedSourceAo?.ao_id === ao.ao_id} readOnly />
                                                </td>
                                                <td className="px-6 py-5 font-bold text-slate-700 text-sm">{ao.ao_name}</td>
                                                <td className="px-6 py-5 italic text-slate-500 text-sm font-medium">{ao.qpd_title || 'Unnamed Framework'}</td>
                                                <td className="px-6 py-5 text-center text-slate-600 text-sm">{ao.qpd_timing || '-'}</td>
                                                <td className="px-6 py-5 text-center font-bold text-slate-700 text-sm">{ao.max_marks}</td>
                                                <td className="px-6 py-5 text-center font-bold text-[#4a8494] text-sm bg-blue-50/10 border-l border-slate-50">{ao.max_marks}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="py-24 text-center text-slate-300 italic text-sm font-medium">
                                                    {searching ? (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-8 h-8 border-3 border-[#4a8494] border-t-transparent rounded-full animate-spin"></div>
                                                            <span>Searching course repository...</span>
                                                        </div>
                                                    ) : "Select course and click search to discover frameworks"}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-[#ef4444] hover:bg-red-600 text-white font-medium rounded transition-all shadow-sm active:scale-95 text-sm"
                    >
                        Close
                    </button>
                    <button 
                        onClick={handleImport} 
                        disabled={!selectedSourceAo || loading}
                        className="px-8 py-2 bg-[#4a8494] hover:bg-[#3d6d7a] text-white font-medium rounded transition-all shadow-sm active:scale-95 text-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center gap-2"
                    >
                        <FaCloudDownloadAlt size={16} /> Confirm Import
                    </button>
                </div>
            </div>

            {loading && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[10000] flex items-center justify-center">
                    <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#4a8494] border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-[10px] font-bold uppercase text-gray-400 tracking-tighter">Processing...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CiaQpImportModal;
