import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './CiaQp.css';
import '../cia/cia.css';
import {
    FaList, FaQuestionCircle, FaTimes, FaSearch,
    FaFileImport, FaEye, FaFileUpload, FaChartPie, FaCheckCircle, FaExclamationTriangle, FaPencilAlt, FaSyncAlt
} from 'react-icons/fa';
import CiaQpImportModal from './CiaQpImportModal';
import CiaRubricImportModal from './CiaRubricImportModal';
import CiaArtifactModal from './CiaArtifactModal';
import CiaQpUploadModal from './CiaQpUploadModal';
import CiaViewRubricsModal from './CiaViewRubricsModal';
import CiaViewQpModal from './CiaViewQpModal';
import ConfirmDialog from '../../../../components/Dialog/ConfirmDialog';
import DataTable from '../../../../components/Table/DataTable';
import {
    deleteQp, getAssessmentOccasionGrid, getCourseDetails,
    getCourses, getCurriculums, getDepartments, getPrograms,
    getQp, getTerms, uploadQpFile, getQpFileUrl
} from './CiaQpApi';
// getCourseDetails is used in fetchInitialDropdowns below

const CHART_COLORS = ['#4a8494', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const CiaQpList: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [dropdowns, setDropdowns] = useState<any>({
        schools: [],
        programs: [],
        curriculums: [],
        terms: [],
        courses: [],
        sections: []
    });

    const [filters, setFilters] = useState(() => {
        const saved = sessionStorage.getItem('cia_qp_filters');
        return saved ? JSON.parse(saved) : {
            school_id: '',
            program_id: '',
            curriculum_id: '',
            term_id: '',
            crs_id: '',
            section_id: ''
        };
    });

    useEffect(() => {
        sessionStorage.setItem('cia_qp_filters', JSON.stringify(filters));
    }, [filters]);

    const [gridData, setGridData] = useState<any[]>([]);
    const [qpData, setQpData] = useState<any>(null);
    const [selectedAo, setSelectedAo] = useState<any>(null);

    // Modal Toggles
    const [showImportModal, setShowImportModal] = useState(false);
    const [showRubricImportModal, setShowRubricImportModal] = useState(false);
    const [showArtifactModal, setShowArtifactModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showRubricsModal, setShowRubricsModal] = useState(false);
    const [showQpModal, setShowQpModal] = useState(false);
    const [showMarksWarning, setShowMarksWarning] = useState(false);
    const [showViewError, setShowViewError] = useState(false);
    const [viewError, setViewError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingAoId, setUploadingAoId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<any>(null);

    const selectedCourseRecord = useMemo(() => {
        return dropdowns.courses.find((c: any) => Number(c.crs_id || c.id) === Number(filters.crs_id));
    }, [dropdowns.courses, filters.crs_id]);

    const curriculumName = useMemo(() =>
        dropdowns.curriculums.find((c: any) => String(c.id || c.academic_batch_id) === String(filters.curriculum_id))?.name,
        [dropdowns.curriculums, filters.curriculum_id]);

    const termName = useMemo(() =>
        dropdowns.terms.find((t: any) => String(t.id || t.semester_id) === String(filters.term_id))?.name,
        [dropdowns.terms, filters.term_id]);

    useEffect(() => {
        fetchInitialDropdowns();
    }, []);

    const fetchInitialDropdowns = async () => {
        try {
            const depts = await getDepartments();
            setDropdowns((prev: any) => ({ ...prev, schools: depts || [] }));

            if (filters.school_id) {
                const pgms = await getPrograms(filters.school_id);
                setDropdowns((prev: any) => ({ ...prev, programs: pgms || [] }));

                if (filters.program_id) {
                    const currs = await getCurriculums(filters.program_id);
                    setDropdowns((prev: any) => ({ ...prev, curriculums: currs || [] }));

                    if (filters.curriculum_id) {
                        const terms = await getTerms(filters.curriculum_id);
                        setDropdowns((prev: any) => ({ ...prev, terms: terms || [] }));

                        if (filters.term_id) {
                            const courses = await getCourses(filters.term_id, filters.curriculum_id);
                            setDropdowns((prev: any) => ({ ...prev, courses: courses || [] }));

                            if (filters.crs_id) {
                                const details = await getCourseDetails(filters);
                                setDropdowns((prev: any) => ({ ...prev, sections: details?.sections || [] }));
                            }
                        }
                    }
                }
            }
        } catch (err) { console.error(err); }
    };

    const handleFilterChange = async (name: string, value: string) => {
        const newFilters = { ...filters, [name]: value };
        if (name === 'school_id') {
            newFilters.program_id = '';
            const pgms = await getPrograms(value);
            setDropdowns((prev: any) => ({ ...prev, programs: pgms || [], curriculums: [], terms: [], courses: [] }));
        } else if (name === 'program_id') {
            newFilters.curriculum_id = '';
            const currs = await getCurriculums(value);
            setDropdowns((prev: any) => ({ ...prev, curriculums: currs || [], terms: [], courses: [] }));
        } else if (name === 'curriculum_id') {
            newFilters.term_id = '';
            const terms = await getTerms(value);
            setDropdowns((prev: any) => ({ ...prev, terms: terms || [], courses: [] }));
        } else if (name === 'term_id') {
            newFilters.crs_id = '';
            newFilters.section_id = '';
            const courses = await getCourses(value, filters.curriculum_id);
            setDropdowns((prev: any) => ({ ...prev, courses: courses || [], sections: [] }));
        } else if (name === 'crs_id') {
            newFilters.section_id = '';
        }
        setFilters(newFilters);
    };

    const fetchGridData = async () => {
        if (!filters.crs_id || !filters.term_id) return;
        setLoading(true);
        try {
            const res = await getAssessmentOccasionGrid({
                crs_id: filters.crs_id,
                term_id: filters.term_id
            });
            setGridData(res || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (filters.crs_id && filters.term_id) fetchGridData();
    }, [filters.crs_id, filters.term_id]);

    const handleViewQpPreview = async (ao: any) => {
        if (!ao.qpd_id) return;
        setLoading(true);
        try {
            const data = await getQp(ao.qpd_id);
            setQpData(data);
            setSelectedAo(ao);
            setShowQpModal(true);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleViewArtifact = (ao: any) => {
        setSelectedAo(ao);
        setShowArtifactModal(true);
    };

    const handleFileUpload = async (e: any, ao: any) => {
        const file = e.target.files[0];
        if (!file || !ao.ao_id) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ao_id', ao.ao_id);
        try {
            await uploadQpFile(formData);
            fetchGridData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteQp = (qpd_id: any) => {
        setDeleteTargetId(qpd_id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteTargetId) return;
        try {
            await deleteQp(deleteTargetId);
            fetchGridData();
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
        } catch (err) { console.error(err); }
    };

    const columnDefs = useMemo(() => [
        {
            headerName: "Sl.No",
            field: "si_no",
            width: 70,
            minWidth: 70,
            cellStyle: { textAlign: "center" },
            pinned: 'left'
        },
        {
            headerName: "Section",
            field: "section_name",
            width: 130,
            minWidth: 130,
            cellStyle: { fontWeight: '700', color: '#4a8494', background: '#f0f9ff' }
        },
        {
            headerName: "Assessment Occasion",
            field: "assessment_occasion_name",
            minWidth: 180,
            flex: 2,
            cellStyle: { fontWeight: '600', color: '#334155' }
        },
        {
            headerName: "Assessment Type",
            field: "assessment_type",
            width: 150
        },
        {
            headerName: "Manage CCE QP/Rubrics",
            field: "manage_cce_qp",
            width: 185,
            minWidth: 185,
            cellRenderer: (params: any) => {
                const ao = params.data;
                const label: string = ao.manage_cce_qp || '';
                if (label === 'Not Linked to QP') return <span className="text-gray-400 text-[11px]">Not Linked to QP</span>;
                return (
                    <div className="flex items-center h-full">
                        <button
                            className="text-blue-600 hover:text-blue-800 font-bold text-[11px] uppercase tracking-tight hover:underline underline-offset-4 transition-all"
                            onClick={() => navigate(`/assessment/manage_cia_qp/edit/${ao.ao_id}`, {
                                state: {
                                    filters,
                                    aoData: ao,
                                    courseRecord: selectedCourseRecord,
                                    curriculumName,
                                    termName
                                }
                            })}
                        >
                            {label}
                        </button>
                    </div>
                );
            }
        },
        {
            headerName: "Course Mode",
            field: "course_mode",
            width: 120,
            minWidth: 110,
            cellRenderer: (params: any) => (
                <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">
                        {params.data.course_mode || 'Theory'}
                    </span>
                </div>
            )
        },
        {
            headerName: "Course Owner / Instructor",
            field: "course_owner",
            width: 170,
            minWidth: 165,
            cellRenderer: (params: any) => params.data.course_owner || 'N/A'
        },
        {
            headerName: "Import CCE QP From Other Curriculum/Courses",
            field: "import_cce_qp_from_other",
            width: 180,
            minWidth: 180,
            cellRenderer: (params: any) => {
                const ao = params.data;
                const label: string = ao.import_cce_qp_from_other || '--';
                if (label === '--') return <span className="text-gray-300">--</span>;
                if (label === 'Marks Uploaded') {
                    return <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Marks Uploaded</span>;
                }
                return (
                    <div className="flex items-center h-full">
                        <button
                            className="text-blue-600 hover:text-blue-800 font-bold text-[11px] uppercase tracking-tight flex items-center gap-1.5 transition-colors hover:underline"
                            onClick={() => {
                                setSelectedAo(ao);
                                const isRubric = String(ao.assessment_type || '').toLowerCase().includes('rubric');
                                if (isRubric) setShowRubricImportModal(true);
                                else setShowImportModal(true);
                            }}
                        >
                            {label}
                        </button>
                    </div>
                );
            }
        },
        {
            headerName: "View CCE QP/Rubrics",
            field: "view_qp",
            width: 130,
            cellRenderer: (params: any) => {
                const ao = params.data;
                const label: string = ao.view_qp || '';
                if (!label || label === 'QP not defined') {
                    return <span className="text-gray-400 text-[11px]">QP not defined</span>;
                }
                return (
                    <div className="flex items-center justify-center h-full">
                        <button
                            className="text-blue-600 hover:text-blue-800 flex flex-col items-center gap-0.5 transition-colors hover:underline"
                            onClick={() => handleViewQpPreview(ao)}
                        >
                            <span className="text-[11px] font-bold uppercase tracking-tight">{label}</span>
                        </button>
                    </div>
                );
            }
        },
        {
            headerName: "Artifacts / Reference QP Upload",
            width: 180,
            minWidth: 165,
            cellRenderer: (params: any) => (
                <div className="flex items-center justify-center gap-3 h-full">
                    <label className="text-blue-600 hover:text-blue-800 cursor-pointer flex flex-col items-center gap-0.5 transition-colors hover:underline">
                        <span className="text-[11px] font-bold uppercase tracking-tight">Upload</span>
                        <input type="file" className="hidden" onChange={(e: any) => handleFileUpload(e, params.data)} />
                    </label>
                    <div className="w-px h-6 bg-gray-100"></div>
                    <button
                        className="text-blue-600 hover:text-blue-800 flex flex-col items-center gap-0.5 transition-colors hover:underline"
                        onClick={() => handleViewArtifact(params.data)}
                    >
                        <span className="text-[11px] font-bold uppercase tracking-tight">View</span>
                    </button>
                </div>
            )
        },
        {
            headerName: "Import CCE QP (Standard Template)",
            field: "import_cce_qp_std",
            width: 220,
            minWidth: 220,
            cellRenderer: (params: any) => {
                const ao = params.data;
                const label: string = ao.import_cce_qp_std || '--';
                if (label === '--') return <span className="text-gray-300">--</span>;
                if (label === 'Marks Uploaded') {
                    return <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Marks Uploaded</span>;
                }
                return (
                    <div className="flex items-center h-full">
                        <button
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 leading-tight transition-all uppercase tracking-tight"
                            onClick={() => { setSelectedAo(ao); setShowUploadModal(true); }}
                        >
                            {label}
                        </button>
                    </div>
                );
            }
        },
        {
            headerName: "Delete",
            width: 80,
            minWidth: 80,
            cellRenderer: (params: any) => {
                const ao = params.data;
                if (!ao.can_delete) {
                    return <div className="flex items-center justify-center h-full"><span className="text-gray-300">--</span></div>;
                }
                return (
                    <div className="flex items-center justify-center h-full">
                        <FaTimes
                            size={18}
                            className="cursor-pointer text-red-600 hover:scale-110 transition-transform mx-auto"
                            title="Delete QP"
                            onClick={() => ao.qpd_id && handleDeleteQp(ao.qpd_id)}
                        />
                    </div>
                );
            }
        }
    ], [filters, selectedCourseRecord, curriculumName, termName]);


    return (
        <div className="cia-container animate-fade-in">
            <h3 className="text-lg font-semibold pb-5 text-[#4a8494]">Manage CIA QP & Rubrics</h3>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div className="space-y-1.5 focus-within:text-[#4a8494]">
                        <label className="text-[11px] font-bold text-gray-600 tracking-tight">School <span className="text-red-500">*</span></label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#4a8494] focus:ring-1 focus:ring-[#4a8494]" value={filters.school_id} onChange={(e) => handleFilterChange('school_id', e.target.value)}>
                            <option value="">Select School</option>
                            {dropdowns.schools.map((s: any) => <option key={s.id} value={s.id}>{s.name || s.dept_name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5 focus-within:text-[#4a8494]">
                        <label className="text-[11px] font-bold text-gray-600 tracking-tight">Program <span className="text-red-500">*</span></label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#4a8494] focus:ring-1 focus:ring-[#4a8494]" value={filters.program_id} onChange={(e) => handleFilterChange('program_id', e.target.value)} disabled={!filters.school_id}>
                            <option value="">Select Program</option>
                            {dropdowns.programs.map((p: any) => <option key={p.id} value={p.id}>{p.name || p.pgm_title}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5 focus-within:text-[#4a8494]">
                        <label className="text-[11px] font-bold text-gray-600 tracking-tight">Curriculum <span className="text-red-500">*</span></label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#4a8494] focus:ring-1 focus:ring-[#4a8494]" value={filters.curriculum_id} onChange={(e) => handleFilterChange('curriculum_id', e.target.value)} disabled={!filters.program_id}>
                            <option value="">Select Curriculum</option>
                            {dropdowns.curriculums.map((c: any) => <option key={c.id} value={c.id}>{c.name || c.academic_batch_code}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5 focus-within:text-[#4a8494]">
                        <label className="text-[11px] font-bold text-gray-600 tracking-tight">Term <span className="text-red-500">*</span></label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#4a8494] focus:ring-1 focus:ring-[#4a8494]" value={filters.term_id} onChange={(e) => handleFilterChange('term_id', e.target.value)} disabled={!filters.curriculum_id}>
                            <option value="">Select Term</option>
                            {dropdowns.terms.map((t: any) => <option key={t.id} value={t.id}>{t.name || t.term_name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5 focus-within:text-[#4a8494]">
                        <label className="text-[11px] font-bold text-gray-600 tracking-tight">Course <span className="text-red-500">*</span></label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#4a8494] focus:ring-1 focus:ring-[#4a8494]" value={filters.crs_id} onChange={(e) => handleFilterChange('crs_id', e.target.value)} disabled={!filters.term_id}>
                            <option value="">Select Course</option>
                            {dropdowns.courses.map((c: any) => (
                                <option key={c.crs_id || c.id} value={c.crs_id || c.id}>
                                    {c.name || `${c.crs_code} - ${c.crs_title}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mb-4 border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-[#4a8494] tracking-tight pl-1">Cia Assessment List</h3>
            </div>

            <DataTable
                columnDefs={columnDefs}
                rowData={gridData}
                headerFilter={true}
                pagination={true}
                pageSize={10}
                autoHeight={true}
                loading={loading}
            />

            {showQpModal && (
                <CiaViewQpModal
                    qpData={qpData}
                    selectedAo={selectedAo}
                    onClose={() => setShowQpModal(false)}
                />
            )}

            {/* Standard Popups */}
            {showMarksWarning && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl animate-scale-in border border-red-50">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-3xl flex items-center justify-center mb-6 mx-auto"><FaExclamationTriangle size={24} /></div>
                        <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Action Restricted</h2>
                        <p className="text-slate-500 text-center mb-8 font-medium">Question paper modification is disabled as marks have already been uploaded for this occasion.</p>
                        <button className="px-6 py-2 bg-[#ef4444] hover:bg-red-600 text-white font-medium rounded transition-all shadow-sm active:scale-95 text-sm w-full" onClick={() => setShowMarksWarning(false)}>Understood</button>
                    </div>
                </div>
            )}

            {/* Other Modals Linked via state/props */}
            {showImportModal && selectedAo && (
                <CiaQpImportModal
                    targetAo={{
                        ...selectedAo,
                        academic_batch_code: curriculumName,
                        term_name: termName,
                        crs_code: selectedCourseRecord?.crs_code || 'N/A',
                        crs_title: selectedCourseRecord?.course_title || 'N/A'
                    }}
                    onClose={() => setShowImportModal(false)}
                    onImportSuccess={() => { setShowImportModal(false); fetchGridData(); }}
                />
            )}
            {showRubricImportModal && selectedAo && (
                <CiaRubricImportModal
                    targetAo={{
                        ...selectedAo,
                        academic_batch_code: curriculumName,
                        term_name: termName,
                        crs_code: selectedCourseRecord?.crs_code || 'N/A',
                        crs_title: selectedCourseRecord?.course_title || 'N/A'
                    }}
                    onClose={() => setShowRubricImportModal(false)}
                    onImportSuccess={() => { setShowRubricImportModal(false); fetchGridData(); }}
                />
            )}
            {showArtifactModal && selectedAo && (
                <CiaArtifactModal targetAo={selectedAo} onClose={() => setShowArtifactModal(false)} />
            )}
            {showUploadModal && selectedAo && (
                <CiaQpUploadModal data={selectedAo} onClose={() => setShowUploadModal(false)} onUploadSuccess={() => fetchGridData()} />
            )}
            {showRubricsModal && selectedAo && (
                <CiaViewRubricsModal
                    data={{
                        ...selectedAo,
                        academic_batch_code: dropdowns.curriculums.find((c: any) => Number(c.id) === Number(filters.curriculum_id))?.name || 'N/A',
                        term_name: dropdowns.terms.find((t: any) => Number(t.id) === Number(filters.term_id))?.name || 'N/A',
                        crs_code: dropdowns.courses.find((c: any) => Number(c.crs_id || c.id) === Number(filters.crs_id))?.course_title || 'N/A'
                    }}
                    onClose={() => setShowRubricsModal(false)}
                />
            )}
            <ConfirmDialog 
                isOpen={isDeleteModalOpen} 
                onClose={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }} 
                onConfirm={executeDelete} 
                title="Confirm Delete" 
                message="Are you sure you want to delete this QP configuration?" 
            />
        </div>
    );
};

export default CiaQpList;
