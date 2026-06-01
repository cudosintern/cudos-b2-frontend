import React, { useState, useEffect } from 'react';
import './CiaQp.css';
import '../cia/cia.css';
import { 
    FaFileImport, FaTimes, FaSearch, FaExclamationCircle, 
    FaQuestionCircle, FaCloudDownloadAlt 
} from 'react-icons/fa';
import { 
    getDepartments, getPrograms, getCurriculums, 
    getTerms, getCourses, getCourseDetails, 
    importQp 
} from './CiaQpApi';

interface Props {
    targetAo: any;
    onClose: () => void;
    onImportSuccess: () => void;
}

const CiaRubricImportModal: React.FC<Props> = ({ targetAo, onClose, onImportSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [availableRubrics, setAvailableRubrics] = useState<any[]>([]);
    const [selectedRubric, setSelectedRubric] = useState<any>(null);
    const [importWithCo, setImportWithCo] = useState(true);
    
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

    const fetchSourceRubrics = async () => {
        if (!sourceFilters.crs_id) return;
        setSearching(true);
        setSelectedRubric(null);
        try {
            const data = await getCourseDetails(sourceFilters);
            // In a real scenario, we'd filter for rubrics. For now, matching QP import logic.
            const rubrics = (data.assessment_occasions || []).filter((ao: any) => [3, 106].includes(Number(ao.ao_type_id)));
            setAvailableRubrics(rubrics);
        } catch (err) {
            console.error(err);
            setAvailableRubrics([]);
        } finally {
            setSearching(false);
        }
    };

    const handleImport = async () => {
        if (!selectedRubric) return;
        setLoading(true);
        try {
            // Placeholder for rubric-specific import API call
            // Using same importQp but would eventually need specific rubric payload
            alert("Rubric import initialised...");
            onImportSuccess();
            onClose();
        } catch (err: any) {
            alert("Import failed. Connectivity issue.");
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
                         Import Assessment Rubrics (CCE)
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
                                <select className="cia-select border-slate-200 focus:border-[#4a8494] rounded-xl outline-none" value={sourceFilters.school_id} onChange={(e) => handleFilterChange('school_id', e.target.value)}>
                                    <option value="">Select School</option>
                                    {dropdowns.schools.map((s: any) => <option key={s.id} value={s.id}>{s.name || s.dept_name}</option>)}
                                </select>
                            </div>
                            <div className="cia-input-group">
                                <label className="cia-label">Program <span className="text-red-500">*</span></label>
                                <select className="cia-select border-slate-200 focus:border-[#4a8494] rounded-xl outline-none" value={sourceFilters.program_id} onChange={(e) => handleFilterChange('program_id', e.target.value)} disabled={!sourceFilters.school_id}>
                                    <option value="">Select Program</option>
                                    {dropdowns.programs.map((p: any) => <option key={p.id} value={p.id}>{p.name || p.pgm_title}</option>)}
                                </select>
                            </div>
                            <div className="cia-input-group">
                                <label className="cia-label">Curriculum <span className="text-red-500">*</span></label>
                                <select className="cia-select border-slate-200 focus:border-[#4a8494] rounded-xl outline-none" value={sourceFilters.academic_batch_id} onChange={(e) => handleFilterChange('academic_batch_id', e.target.value)} disabled={!sourceFilters.program_id}>
                                    <option value="">Select Curriculum</option>
                                    {dropdowns.batches.map((b: any) => <option key={b.id} value={b.id}>{b.name || b.academic_batch_code}</option>)}
                                </select>
                            </div>
                            <div className="cia-input-group">
                                <label className="cia-label">Term <span className="text-red-500">*</span></label>
                                <select className="cia-select border-slate-200 focus:border-[#4a8494] rounded-xl outline-none" value={sourceFilters.semester_id} onChange={(e) => handleFilterChange('semester_id', e.target.value)} disabled={!sourceFilters.academic_batch_id}>
                                    <option value="">Select Term</option>
                                    {dropdowns.terms.map((t: any) => <option key={t.id} value={t.id}>{t.name || t.term_name}</option>)}
                                </select>
                            </div>
                            <div className="cia-input-group flex flex-col justify-end">
                                <label className="cia-label">Course <span className="text-red-500">*</span></label>
                                <div className="flex gap-3">
                                    <select className="cia-select flex-1 border-slate-200 focus:border-[#4a8494] rounded-xl outline-none" value={sourceFilters.crs_id} onChange={(e) => handleFilterChange('crs_id', e.target.value)} disabled={!sourceFilters.semester_id}>
                                        <option value="">Select Course</option>
                                        {dropdowns.courses.map((c: any) => <option key={c.id || c.crs_id} value={c.id || c.crs_id}>{c.name || c.course_title}</option>)}
                                    </select>
                                    <button onClick={fetchSourceRubrics} className="px-5 bg-[#4a8494] text-white rounded-xl hover:bg-[#3d6d7a] transition-all shadow-lg active:scale-95"><FaSearch /></button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 py-6 px-6 bg-blue-50/30 border border-blue-100 rounded-2xl max-w-fit">
                            <span className="text-sm font-bold text-blue-800">Import Rubrics along with Course Outcomes?</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase transition-colors ${!importWithCo ? 'text-blue-600' : 'text-slate-400'}`}>No</span>
                                <button 
                                    onClick={() => setImportWithCo(!importWithCo)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${importWithCo ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${importWithCo ? 'left-7' : 'left-1'}`}></div>
                                </button>
                                <span className={`text-[10px] font-bold uppercase transition-colors ${importWithCo ? 'text-blue-600' : 'text-slate-400'}`}>Yes</span>
                            </div>
                        </div>

                        {/* Result Table Placeholder */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 px-8 py-5 border-b border-slate-200">
                                <h5 className="text-[10px] font-bold text-[#4a8494] uppercase tracking-widest italic flex items-center gap-2">Discovery Result: Assessment Rubrics</h5>
                            </div>
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                {searching ? (
                                    <>
                                        <div className="w-10 h-10 border-4 border-[#4a8494] border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-slate-400 font-medium italic text-sm">Searching course repository...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center">
                                            <FaFileImport size={32} />
                                        </div>
                                        <span className="text-slate-400 font-medium italic text-sm">Select course criteria and search to reveal available rubrics</span>
                                    </>
                                )}
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
                        disabled={!selectedRubric && !availableRubrics.length}
                        className="px-8 py-2 bg-[#4a8494] hover:bg-[#3d6d7a] text-white font-medium rounded transition-all shadow-sm active:scale-95 text-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none flex items-center gap-2"
                    >
                        <FaCloudDownloadAlt size={16} /> Confirm Import
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CiaRubricImportModal;
