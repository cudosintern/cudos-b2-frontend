// src/pages/ioncudos/attainment/firstYearCourseCoAttainment/FirstYearCourseCoAttainment.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { HelpCircle, ChevronDown, ChevronUp, X, FileText, Database, Book } from 'lucide-react';
import ConfirmDialog from '../../../../components/Dialog/ConfirmDialog';
import DataTable from '../../../../components/Table/DataTable';
import FirstYearSelectors from './FirstYearSelectors';
import FirstYearCceSelectors from './FirstYearCceSelectors';
import MultiSelect from '../../../../components/FormBuilder/fields/MultiSelect';
import {
    fetchPageContext,
    fetchCoursesForTerm,
    fetchCourseContext,
    fetchSectionContext,
    fetchDirectAttainment,
    fetchCourseAttainment,
    fetchCloQuestions,
    exportAttainmentReport,
    Curriculum,
    Term,
    Course,
    Section,
    CceOccasion,
    StudentDetailRow,
    CourseAttainmentRow,
    CceAttainmentGraphRow
} from './FirstYearCoApi';
import CceAttainmentChart from './CceAttainmentChart';
import FirstYearWebHelpModal from './FirstYearWebHelpModal';
import LogHistoryModal from '../mteCOAttainment/MteLogHistoryModal';

// Type for CO details table row (used in CCE tab)
interface CceTableCoRow {
    siNo?: number;
    clo_id: number;
    co_code: string;
    co_statement: string;
    threshold_percent: number;
    attainment_level: number;
    average_attainment: number;
}

// Formula Note Section (kept for CCE tab)
const FormulaNoteSection: React.FC = () => {
    return (
        <div className="mt-8 p-4 border border-gray-200 bg-[#f8f8f6] rounded-lg text-sm text-left shadow-sm">
            <div className="text-gray-700 mb-1">
                <span className="font-bold text-gray-800">Note: </span>
                The above bar graph depicts the overall class performance with respect to the Threshold % for individual Course Outcomes (COs). The Average based Attainment % is calculated using the below formula.
            </div>
            <div className="font-bold text-gray-800 mt-2">
                For Attainment % = Average Secured Attainment Percentage of Attempted Students .
            </div>
        </div>
    );
};

interface ValidationFailures {
    missing_marks: string[];
    missing_qp: string[];
    not_rolled_out: string[];
    missing_mapping: string[];
    missing_attainment: string[];
}

interface ValidationFailuresViewProps {
    failures: ValidationFailures;
    onNavigate: (path: string) => void;
}

const ValidationFailuresView: React.FC<ValidationFailuresViewProps> = ({ failures, onNavigate }) => {
    const getRedirects = (item: string) => {
        const itemUpper = item.toUpperCase();
        if (itemUpper.includes("CCE") || itemUpper.includes("CIA")) {
            return {
                uploadMarks: '/attainment/cce_data_import',
                createQp: '/assessment/manage_cia_qp',
                finalize: '/attainment/cce_data_import'
            };
        } else if (itemUpper.includes("MTE")) {
            return {
                uploadMarks: '/attainment/mte_data_import',
                createQp: '/assessment/manage_mte_qp',
                finalize: '/attainment/mte_co_attainment'
            };
        } else {
            return {
                uploadMarks: '/attainment/see_data_import',
                createQp: '/assessment/manage_model_qp',
                finalize: '/attainment/see_data_import'
            };
        }
    };

    return (
        <div className="p-6 text-center bg-white rounded-lg min-h-[300px] flex flex-col justify-center items-center">
            <p className="text-red-600 font-semibold text-base mb-6 max-w-2xl">
                You cannot view/finalize the Course Outcomes(COs) Attainment. Kindly complete the below activities :
            </p>
            <div className="space-y-6 w-full max-w-2xl text-center">
                {failures.missing_marks && failures.missing_marks.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-red-500 font-medium text-sm">
                            &gt;&gt; Assessment data (student marks) are not uploaded/imported for: <span className="font-bold">{failures.missing_marks.join(' , ')}</span>
                        </p>
                        <div className="flex flex-col items-center space-y-1 text-sm">
                            {failures.missing_marks.map((item, idx) => {
                                const r = getRedirects(item);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onNavigate(r.uploadMarks)}
                                        className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                                    >
                                        Click here to upload marks for {item}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {failures.missing_qp && failures.missing_qp.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-red-500 font-medium text-sm">
                            &gt;&gt; Question paper is not created for: <span className="font-bold">{failures.missing_qp.join(' , ')}</span>
                        </p>
                        <div className="flex flex-col items-center space-y-1 text-sm">
                            {failures.missing_qp.map((item, idx) => {
                                const r = getRedirects(item);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onNavigate(r.createQp)}
                                        className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                                    >
                                        Click here to Create QP for {item}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {failures.not_rolled_out && failures.not_rolled_out.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-red-500 font-medium text-sm">
                            &gt;&gt; Question paper is not rolled out for: <span className="font-bold">{failures.not_rolled_out.join(' , ')}</span>
                        </p>
                        <div className="flex flex-col items-center space-y-1 text-sm">
                            {failures.not_rolled_out.map((item, idx) => {
                                const r = getRedirects(item);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onNavigate(r.createQp)}
                                        className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                                    >
                                        Click here to Rollout QP for {item}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {failures.missing_mapping && failures.missing_mapping.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-red-500 font-medium text-sm">
                            &gt;&gt; CO mapped questions are missing for: <span className="font-bold">{failures.missing_mapping.join(' , ')}</span>
                        </p>
                        <div className="flex flex-col items-center space-y-1 text-sm">
                            {failures.missing_mapping.map((item, idx) => {
                                const r = getRedirects(item);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onNavigate(r.createQp)}
                                        className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                                    >
                                        Click here to Map questions to COs for {item}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {failures.missing_attainment && failures.missing_attainment.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-red-500 font-medium text-sm">
                            &gt;&gt; Attainment data is not finalized/generated for: <span className="font-bold">{failures.missing_attainment.join(' , ')}</span>
                        </p>
                        <div className="flex flex-col items-center space-y-1 text-sm">
                            {failures.missing_attainment.map((item, idx) => {
                                const r = getRedirects(item);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onNavigate(r.finalize)}
                                        className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                                    >
                                        Click here to finalize attainment for {item}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const FirstYearCourseCoAttainment: React.FC = () => {
    const navigate = useNavigate();

    // Selectors list state
    const [curricula, setCurricula] = useState<Curriculum[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [occasions, setOccasions] = useState<CceOccasion[]>([]);
    const [schools, setSchools] = useState<string[]>([]); // student departments in section context

    // Page Context Configuration States
    const [orgType, setOrgType] = useState<string>("TIER-I");
    const [orgName, setOrgName] = useState<string>("");
    const [univTypeFlag, setUnivTypeFlag] = useState<number>(0);
    const [teeSectionFlag, setTeeSectionFlag] = useState<number>(0);
    const [mteFlag, setMteFlag] = useState<number>(0);

    // Filter values
    const [selectedCurriculum, setSelectedCurriculum] = useState<number | null>(null);
    const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [selectedSection, setSelectedSection] = useState<number | null>(null);
    const [selectedOccasions, setSelectedOccasions] = useState<number[]>([]);
    const [selectedSchools, setSelectedSchools] = useState<string[]>([]);

    // Course Attainment Tab Filters
    const [selectedType, setSelectedType] = useState<string[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]);
    const [courseDepartments, setCourseDepartments] = useState<string[]>([]); // departments from course context
    const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);

    // Active navigation tab
    const [activeTab, setActiveTab] = useState<'cce' | 'course'>('cce');

    // CCE Direct Attainment States
    const [studentRows, setStudentRows] = useState<StudentDetailRow[]>([]);
    const [cceCoRows, setCceCoRows] = useState<any[]>([]);
    const [cceChartData, setCceChartData] = useState<any>(null);
    const [cceWarnings, setCceWarnings] = useState<string[]>([]);
    const [cceNotes, setCceNotes] = useState<string[]>([]);
    const [cceError, setCceError] = useState<string | null>(null);
    const [cceErrorMarks, setCceErrorMarks] = useState<string | null>(null);
    const [cceTargetLevels, setCceTargetLevels] = useState<any[]>([]);
    const [ciaWeightage, setCiaWeightage] = useState<number>(50);

    // Course Attainment State
    const [courseAttainmentData, setCourseAttainmentData] = useState<any>(null);

    // Modal state for CO details
    const [selectedCoForDetails, setSelectedCoForDetails] = useState<any | null>(null);
    const [cloQuestions, setCloQuestions] = useState<any[]>([]);

    // Expansion & dialogs
    const [isStudentDetailsExpanded, setIsStudentDetailsExpanded] = useState(true);
    const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
    const [isWebHelpOpen, setIsWebHelpOpen] = useState(false);
    const [isLogHistoryOpen, setIsLogHistoryOpen] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exporting, setExporting] = useState(false);

    const studentDetailsRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const [studentPage, setStudentPage] = useState(1);
    const [studentPageSize, setStudentPageSize] = useState(10);
    const [studentSearch, setStudentSearch] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load page context on mount
    useEffect(() => {
        const loadPageContext = async () => {
            try {
                const data = await fetchPageContext();
                if (data.access_granted) {
                    setCurricula(data.curriculums || []);
                    setOrgType(data.org_type || "TIER-I");
                    setOrgName(data.org_name || "");
                    setUnivTypeFlag(data.univ_type_flag || 0);
                    setTeeSectionFlag(data.tee_section_flag || 0);
                    setMteFlag(data.mte_flag || 0);
                } else {
                    toast.error(data.error || "Access denied.");
                }
            } catch (err: any) {
                console.error(err);
                toast.error("Failed to load page context.");
            }
        };
        loadPageContext();
    }, []);

    // Load terms when curriculum changes
    useEffect(() => {
        if (!selectedCurriculum) {
            setTerms([]);
            setSelectedTerm(null);
            setSelectedCourse(null);
            setSelectedSection(null);
            setSelectedOccasions([]);
            setSelectedSchools([]);
            setStudentRows([]);
            setSelectedType([]);
            setSelectedDepartment([]);
            return;
        }
        const curr = curricula.find(c => c.crclm_id === selectedCurriculum);
        setTerms(curr?.terms || []);
        setSelectedTerm(null);
        setSelectedCourse(null);
        setSelectedSection(null);
        setSelectedOccasions([]);
        setSelectedSchools([]);
        setStudentRows([]);
        setSelectedType([]);
        setSelectedDepartment([]);
    }, [selectedCurriculum, curricula]);

    // Load courses when term changes
    useEffect(() => {
        const loadCourses = async () => {
            const curr = curricula.find(c => c.crclm_id === selectedCurriculum);
            const validTerms = curr?.terms || [];
            const isTermValid = validTerms.some(t => t.term_id === selectedTerm);
            if (!selectedTerm || !selectedCurriculum || !isTermValid) {
                setCourses([]);
                setSelectedCourse(null);
                setSelectedSection(null);
                setSelectedOccasions([]);
                setSelectedSchools([]);
                setStudentRows([]);
                setSelectedType([]);
                setSelectedDepartment([]);
                return;
            }
            try {
                const res = await fetchCoursesForTerm(selectedCurriculum, selectedTerm);
                setCourses(res || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load courses.");
            }
            setSelectedCourse(null);
            setSelectedSection(null);
            setSelectedOccasions([]);
            setSelectedSchools([]);
            setStudentRows([]);
            setSelectedType([]);
            setSelectedDepartment([]);
        };
        loadCourses();
    }, [selectedTerm, selectedCurriculum, curricula]);

    // Load course context when course changes
    useEffect(() => {
        const loadCourseContext = async () => {
            const curr = curricula.find(c => c.crclm_id === selectedCurriculum);
            const validTerms = curr?.terms || [];
            const isTermValid = validTerms.some(t => t.term_id === selectedTerm);
            const isCourseValid = courses.some(c => c.crs_id === selectedCourse);
            if (!selectedCourse || !selectedTerm || !selectedCurriculum || !isTermValid || !isCourseValid) {
                setSections([]);
                setCourseDepartments([]);
                setAssessmentTypes([]);
                setSelectedSection(null);
                setSelectedOccasions([]);
                setSelectedSchools([]);
                setStudentRows([]);
                setIsStudentDetailsExpanded(false);
                setSelectedType([]);
                setSelectedDepartment([]);
                return;
            }
            try {
                const res = await fetchCourseContext(selectedCurriculum, selectedTerm, selectedCourse);
                const fetchedSections = res.sections || [];
                setSections(fetchedSections);
                setCourseDepartments(res.departments || []);
                setAssessmentTypes(res.assessment_types || []);
                if (fetchedSections.length > 0) {
                    setSelectedSection(fetchedSections[0].section_id);
                } else {
                    setSelectedSection(null);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load course context.");
                setSelectedSection(null);
            }
            setSelectedOccasions([]);
            setSelectedSchools([]);
            setStudentRows([]);
            setIsStudentDetailsExpanded(false);
            setSelectedType([]);
            setSelectedDepartment([]);
        };
        loadCourseContext();
    }, [selectedCourse, selectedTerm, selectedCurriculum, curricula, courses]);

    // Load section context when section changes
    useEffect(() => {
        const loadSectionContext = async () => {
            const isCourseValid = courses.some(c => c.crs_id === selectedCourse);
            const isSectionValid = sections.some(s => s.section_id === selectedSection);
            if (!selectedSection || !selectedCourse || !selectedTerm || !selectedCurriculum || !isCourseValid || !isSectionValid) {
                setOccasions([]);
                setSchools([]);
                setSelectedOccasions([]);
                setSelectedSchools([]);
                setStudentRows([]);
                return;
            }
            try {
                const res = await fetchSectionContext(selectedCurriculum, selectedTerm, selectedCourse, selectedSection);
                setOccasions(res.occasions || []);
                setSchools(res.departments || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load section context.");
            }
            setSelectedOccasions([]);
            setSelectedSchools([]);
            setStudentRows([]);
        };
        loadSectionContext();
    }, [selectedSection, selectedCourse, selectedTerm, selectedCurriculum, courses, sections]);

    const isSelectorsSelected = selectedCurriculum !== null &&
        selectedTerm !== null &&
        selectedCourse !== null;

    // Options for Type dropdown (dynamically bound to assessment types from course context)
    const typeOptions = useMemo(() => {
        if (!isSelectorsSelected || assessmentTypes.length === 0) return [];
        return assessmentTypes.map(t => ({
            value: t.type.toLowerCase(),
            label: t.label
        }));
    }, [isSelectorsSelected, assessmentTypes]);

    // Options for Department dropdown (from course context)
    const departmentOptions = useMemo(() => {
        if (!isSelectorsSelected) return [];
        return courseDepartments.map(dept => ({
            value: dept,
            label: dept,
        }));
    }, [isSelectorsSelected, courseDepartments]);

    // ----- Filter flags -----
    const isCourseSelected = selectedCourse !== null;

    const areAllFiltersSelected = selectedCurriculum !== null &&
        selectedTerm !== null &&
        selectedCourse !== null &&
        selectedSection !== null &&
        selectedOccasions.length > 0 &&
        selectedSchools.length > 0;

    const isCourseTabReady = selectedCurriculum !== null &&
        selectedTerm !== null &&
        selectedCourse !== null;

    const isAllOccasions = selectedOccasions.length === occasions.length && occasions.length > 0;
    const typeNotSelected = (selectedType.length === typeOptions.length && typeOptions.length > 0) ? 0 : 1;

    const isExportVisible = (activeTab === 'cce' && areAllFiltersSelected) ||
        (activeTab === 'course' && isCourseTabReady && selectedType.length > 0 && selectedDepartment.length > 0);

    // Auto-fetch direct attainment when CCE tab filters are valid
    const loadDirectAttainment = useCallback(async () => {
        if (!areAllFiltersSelected) return;
        try {
            const params = {
                crclm_id: selectedCurriculum!,
                term_id: selectedTerm!,
                course_id: selectedCourse!,
                section_id: selectedSection!,
                occasion_ids: selectedOccasions,
                department_ids: selectedSchools,
                occasion_not_selected: isAllOccasions ? 0 : 1,
                tier: orgType
            };
            const res = await fetchDirectAttainment(params);
            setStudentRows(res.students || []);
            setCceCoRows(res.rows || []);
            setCceChartData(res.chart || null);
            setCceWarnings(res.warnings || []);
            setCceNotes(res.notes || []);
            setCceError(res.error || null);
            setCceErrorMarks(res.error_marks || null);
            setCceTargetLevels(res.target_levels || []);
            setCiaWeightage(res.cia_weightage !== undefined ? res.cia_weightage : 50);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load direct attainment data.");
        }
    }, [areAllFiltersSelected, selectedCurriculum, selectedTerm, selectedCourse, selectedSection, selectedOccasions, selectedSchools, isAllOccasions, orgType]);

    useEffect(() => {
        if (activeTab === 'cce' && areAllFiltersSelected) {
            loadDirectAttainment();
        } else {
            setStudentRows([]);
            setCceCoRows([]);
            setCceChartData(null);
            setCceWarnings([]);
            setCceNotes([]);
            setCceTargetLevels([]);
            setCceError(null);
            setCceErrorMarks(null);
        }
    }, [activeTab, areAllFiltersSelected, loadDirectAttainment]);

    // Auto-expand student details when all required selections are available
    useEffect(() => {
        if (activeTab === 'cce' && areAllFiltersSelected) {
            setIsStudentDetailsExpanded(true);
        }
    }, [activeTab, areAllFiltersSelected]);

    // View Student Details click handler
    const handleViewStudentDetails = () => {
        if (!areAllFiltersSelected) {
            return;
        }
        loadDirectAttainment();
        setIsStudentDetailsExpanded(true);
        setTimeout(() => {
            studentDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Auto-fetch course attainment when Course tab filters are valid
    const loadCourseAttainment = useCallback(async () => {
        if (!isCourseTabReady || selectedType.length === 0 || selectedDepartment.length === 0) {
            setCourseAttainmentData(null);
            return;
        }
        try {
            const params = {
                crclm_id: selectedCurriculum!,
                term_id: selectedTerm!,
                course_id: selectedCourse!,
                type_values: selectedType,
                type_not_selected: typeNotSelected,
                department_ids: selectedDepartment,
                tier: orgType
            };
            const res = await fetchCourseAttainment(params);
            setCourseAttainmentData(res || null);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load course attainment data.");
        }
    }, [isCourseTabReady, selectedCurriculum, selectedTerm, selectedCourse, selectedType, typeNotSelected, selectedDepartment, orgType]);

    useEffect(() => {
        if (activeTab === 'course') {
            loadCourseAttainment();
        } else {
            setCourseAttainmentData(null);
        }
    }, [activeTab, loadCourseAttainment]);

    // Fetch CLO Questions when details modal opens
    useEffect(() => {
        const loadCloQuestions = async () => {
            if (!selectedCoForDetails) {
                setCloQuestions([]);
                return;
            }
            try {
                const params = {
                    clo_id: selectedCoForDetails.clo_id,
                    occasion_id: activeTab === 'cce' ? (selectedOccasions.length === 1 ? selectedOccasions[0] : null) : null,
                    section_id: activeTab === 'cce' ? selectedSection : null,
                    occasion_not_selected: activeTab === 'cce' ? (isAllOccasions ? 0 : 1) : 0,
                };
                const res = await fetchCloQuestions(params);
                setCloQuestions(res.questions || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load CLO mapped questions.");
            }
        };
        loadCloQuestions();
    }, [selectedCoForDetails, activeTab, selectedOccasions, selectedSection, isAllOccasions]);

    // -------- Export Functionality using Backend APIs --------
    const handleExport = async (format: 'pdf' | 'docx') => {
        try {
            setExporting(true);
            const canvasId = activeTab === 'cce' ? 'cce-chart-canvas' : 'course-chart-canvas';
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
            const chartImage = canvas ? canvas.toDataURL('image/png') : null;

            const body = {
                export_type: format === 'pdf' ? ('pdf' as const) : ('docx' as const),
                tab_name: activeTab === 'cce' ? ('direct_attainment' as const) : ('course' as const),
                crclm_id: selectedCurriculum!,
                term_id: selectedTerm!,
                course_id: selectedCourse!,
                section_id: activeTab === 'cce' ? selectedSection : null,
                occasion_ids: activeTab === 'cce' ? selectedOccasions : [],
                department_ids: activeTab === 'cce' ? selectedSchools : selectedDepartment,
                type_values: activeTab === 'course' ? selectedType : [],
                type_not_selected: activeTab === 'course' ? typeNotSelected : 1,
                occasion_not_selected: activeTab === 'cce' ? (isAllOccasions ? 0 : 1) : 1,
                chart_image: chartImage,
                tier: orgType
            };

            toast.info(`Generating ${format.toUpperCase()} report...`);
            const blob = await exportAttainmentReport(body);
            const url = window.URL.createObjectURL(blob);
            if (format === 'pdf') {
                window.open(url, '_blank');
                toast.success('PDF report opened in a new tab.');
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.download = `attainment_report_${activeTab}_${new Date().toISOString().slice(0, 10)}.docx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success('DOCX report downloaded successfully.');
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to export report.");
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const exportPDF = () => handleExport('pdf');
    const exportDOCX = () => handleExport('docx');

    // ---- CCE Tab Tables Data ----
    const targetLevelColumnDefs = useMemo(() => {
        return [
            { headerName: "SI No.", field: "siNo", sortable: false, filter: false, maxWidth: 90 },
            { headerName: "Attainment Level Name", field: "level_name", sortable: false, filter: false },
            { headerName: "Attainment Level Value", field: "level_value", sortable: false, filter: false, maxWidth: 170 },
            { headerName: "Target", field: "target_text", sortable: false, filter: false, flex: 2 }
        ];
    }, []);

    const targetLevelRowData = useMemo(() => {
        if (cceTargetLevels && cceTargetLevels.length > 0) {
            const mapped = cceTargetLevels.map((l: any) => {
                if (orgType === "TIER-I") {
                    return {
                        level_name: l.attainment_level === 1 ? "Low" : l.attainment_level === 2 ? "Medium" : "High",
                        level_value: l.attainment_level,
                        target_text: l.dal_justification
                    };
                } else {
                    return {
                        level_name: l.attainment_level_name,
                        level_value: l.attainment_level_value,
                        target_text: `${l.cia_direct_percentage}% students scoring >= ${l.cia_target_percentage}% marks`
                    };
                }
            });
            if (orgType === "TIER-I" && !mapped.some((m: any) => m.level_value === 0)) {
                mapped.unshift({
                    level_name: "Zero",
                    level_value: 0,
                    target_text: "0% students scoring >= 50% marks out of relevant maximum marks."
                });
            }
            return mapped.map((row: any, idx: number) => ({ ...row, siNo: idx + 1 }));
        }

        const staticLevels = [
            { level_name: "Zero", level_value: 0, target_text: "0% students scoring >= 50% marks out of relevant maximum marks." },
            { level_name: "Low", level_value: 1, target_text: "50% students scoring >= 50% marks out of relevant maximum marks." },
            { level_name: "Medium", level_value: 2, target_text: "60% students scoring >= 50% marks out of relevant maximum marks." },
            { level_name: "High", level_value: 3, target_text: "70% students scoring >= 50% marks out of relevant maximum marks." }
        ];
        return staticLevels.map((row, idx) => ({
            ...row,
            siNo: idx + 1
        }));
    }, [cceTargetLevels, orgType]);

    const coAttainmentColumnDefs = useMemo(() => {
        return [
            { headerName: "SI No.", field: "siNo", sortable: false, filter: false, maxWidth: 90 },
            {
                headerName: "CO Code",
                field: "co_code",
                sortable: false,
                filter: false,
                maxWidth: 130,
                cellStyle: {
                    paddingTop: '2px',
                    paddingBottom: '2px',
                    paddingLeft: '2px',
                    paddingRight: '2px',
                    lineHeight: '1.2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                cellRenderer: (params: any) => {
                    const row = params.data;
                    if (!row) return null;
                    return (
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="font-semibold text-gray-800 text-xs leading-none">{row.co_code}</span>
                            <span
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedCoForDetails(row);
                                }}
                                className="text-[10px] text-blue-600 hover:text-blue-800 underline cursor-pointer font-semibold leading-none mt-0.5"
                            >
                                View details
                            </span>
                        </div>
                    );
                }
            },
            {
                headerName: "Threshold based Attainment %",
                field: "threshold_attainment_display",
                sortable: false,
                filter: false
            },
            {
                headerName: "Attainment Level",
                field: "attainment_level_display",
                sortable: false,
                filter: false,
                maxWidth: 150
            },
            {
                headerName: "Average based Attainment %",
                field: "average_attainment_display",
                sortable: false,
                filter: false
            }
        ];
    }, []);

    const coAttainmentRowData = useMemo(() => {
        return cceCoRows.map((row: any, idx: number) => ({
            ...row,
            siNo: idx + 1,
            co_code: row.clo_code || "",
            co_statement: row.clo_statement || "",
            threshold_attainment_display: row.threshold_percent !== null && row.threshold_percent !== undefined ? `${row.threshold_percent.toFixed(2)}%` : "-",
            attainment_level_display: row.attainment_level !== null && row.attainment_level !== undefined ? row.attainment_level.toFixed(2) : "-",
            average_attainment_display: row.average_attainment !== null && row.average_attainment !== undefined ? `${row.average_attainment.toFixed(2)}%` : "-"
        }));
    }, [cceCoRows]);

    const actualCceAttainment = useMemo(() => {
        if (cceCoRows.length === 0) return 0;
        const sum = cceCoRows.reduce((acc, row) => acc + (row.average_attainment || 0), 0);
        return sum / cceCoRows.length;
    }, [cceCoRows]);

    const weightedCceAttainment = useMemo(() => {
        return actualCceAttainment * (ciaWeightage / 100);
    }, [actualCceAttainment, ciaWeightage]);

    // Student details columns
    const studentColumnDefs = useMemo(() => {
        return [
            { headerName: 'SI No.', field: 'siNo', maxWidth: 90, sortable: false, filter: false },
            { headerName: 'Department', field: 'department', sortable: true, filter: true, flex: 1.2 },
            { headerName: 'Student PNR / USN', field: 'usn', maxWidth: 180, sortable: true, filter: true },
            { headerName: 'Student Name', field: 'studentName', sortable: true, filter: true, flex: 1.2 },
            { headerName: 'Email', field: 'email', sortable: true, filter: true, flex: 1.5 }
        ];
    }, []);

    const studentRowData = useMemo(() => {
        return studentRows.map((student: any, idx) => ({
            ...student,
            siNo: idx + 1,
            department: student.department || "-",
            usn: student.usn || "-",
            studentName: student.studentName || student.student_name || "-",
            email: student.email || "-"
        }));
    }, [studentRows]);

    const filteredStudents = useMemo(() => {
        return studentRowData.filter(s =>
            s.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.usn.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.department.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.email.toLowerCase().includes(studentSearch.toLowerCase())
        );
    }, [studentRowData, studentSearch]);

    const paginatedStudents = useMemo(() => {
        return filteredStudents.slice((studentPage - 1) * studentPageSize, studentPage * studentPageSize);
    }, [filteredStudents, studentPage, studentPageSize]);

    const totalStudentPages = useMemo(() => {
        return Math.ceil(filteredStudents.length / studentPageSize) || 1;
    }, [filteredStudents, studentPageSize]);

    // Modal (CO questions) columns & rows
    const modalColumnDefs = useMemo(() => {
        return [
            { headerName: "Occasion", field: "occasion", sortable: false, filter: false },
            { headerName: "Q No.", field: "qNo", sortable: false, filter: false, maxWidth: 100 },
            { headerName: "Question Content", field: "questionContent", sortable: false, filter: false, flex: 2 },
            { headerName: "Marks", field: "marks_display", sortable: false, filter: false, maxWidth: 100 }
        ];
    }, []);

    const modalRowData = useMemo(() => {
        return cloQuestions.map(r => ({
            occasion: r.occasion || "-",
            qNo: r.q_no || "-",
            questionContent: r.question_content || "-",
            marks_display: r.marks !== undefined && r.marks !== null ? Number(r.marks).toFixed(2) : "-"
        }));
    }, [cloQuestions]);

    const selectedCurriculumName = useMemo(() => {
        return curricula.find(c => c.crclm_id === selectedCurriculum)?.name || "";
    }, [curricula, selectedCurriculum]);

    const selectedTermName = useMemo(() => {
        return terms.find(t => t.term_id === selectedTerm)?.name || "";
    }, [terms, selectedTerm]);

    const selectedCourseName = useMemo(() => {
        const c = courses.find(course => course.crs_id === selectedCourse);
        return c ? `${c.crs_code} - ${c.crs_name}` : "";
    }, [courses, selectedCourse]);

    const selectedSectionName = useMemo(() => {
        return sections.find(s => s.section_id === selectedSection)?.name || "";
    }, [sections, selectedSection]);

    const showCceTarget = useMemo(() => {
        return selectedType.some(t => {
            const lower = t.toLowerCase();
            return lower === 'cce' || lower === 'cia';
        });
    }, [selectedType]);

    const showMteTarget = useMemo(() => {
        return selectedType.some(t => t.toLowerCase() === 'mte');
    }, [selectedType]);

    const showSeeTarget = useMemo(() => {
        return selectedType.some(t => {
            const lower = t.toLowerCase();
            return lower === 'see' || lower === 'tee';
        });
    }, [selectedType]);

    const cceHeaderClass = `px-3 py-2 ${showMteTarget || showSeeTarget ? 'border-r border-slate-200' : ''}`;
    const mteHeaderClass = `px-3 py-2 ${showSeeTarget ? 'border-r border-slate-200' : ''}`;
    const seeHeaderClass = "px-3 py-2";

    const cceCellClass = `px-3 py-2 ${showMteTarget || showSeeTarget ? 'border-r border-slate-100' : ''} text-slate-600 font-medium`;
    const mteCellClass = `px-3 py-2 ${showSeeTarget ? 'border-r border-slate-100' : ''} text-slate-600 font-medium`;
    const seeCellClass = "px-3 py-2 text-slate-600 font-medium";

    // ---- Course Tab Tables Data ----
    const courseTargetLevelColumnDefs = useMemo(() => {
        return [
            { headerName: "SI No.", field: "siNo", sortable: false, filter: false, maxWidth: 90 },
            { headerName: "Attainment Level Name", field: "level_name", sortable: false, filter: false },
            { headerName: "Attainment Level Value", field: "level_value", sortable: false, filter: false, maxWidth: 170 },
            { headerName: "CCE Target %", field: "cce_target", sortable: false, filter: false, flex: 1.5, autoHeight: true, wrapText: true },
            { headerName: "SEE Target %", field: "see_target", sortable: false, filter: false, flex: 1.5, autoHeight: true, wrapText: true }
        ];
    }, []);

    const courseTargetLevelRowData = useMemo(() => {
        if (courseAttainmentData?.target_levels && courseAttainmentData.target_levels.length > 0) {
            const mapped = courseAttainmentData.target_levels.map((l: any) => {
                if (orgType === "TIER-I") {
                    return {
                        level_name: l.attainment_level === 1 ? "Low" : l.attainment_level === 2 ? "Medium" : "High",
                        level_value: l.attainment_level,
                        cce_target: l.dal_justification,
                        mte_target: l.dal_justification,
                        see_target: l.ial_justification || l.dal_justification
                    };
                } else {
                    return {
                        level_name: l.attainment_level_name,
                        level_value: l.attainment_level_value,
                        cce_target: `${l.cia_direct_percentage}% students scoring >= ${l.cia_target_percentage}% marks`,
                        mte_target: `${l.mte_direct_percentage ?? 0}% students scoring >= ${l.mte_target_percentage ?? 0}% marks`,
                        see_target: `${l.tee_direct_percentage}% students scoring >= ${l.tee_target_percentage}% marks`
                    };
                }
            });
            return mapped.map((row: any, idx: number) => ({ ...row, siNo: idx + 1 }));
        }

        const defaultTargetLevels = [
            { level_name: "Low", level_value: 1, cce_target: "50% students scoring >= 50% marks", mte_target: "50% students scoring >= 50% marks", see_target: "50% students scoring >= 40% marks" },
            { level_name: "Medium", level_value: 2, cce_target: "60% students scoring >= 50% marks", mte_target: "60% students scoring >= 50% marks", see_target: "60% students scoring >= 40% marks" },
            { level_name: "High", level_value: 3, cce_target: "70% students scoring >= 50% marks", mte_target: "70% students scoring >= 50% marks", see_target: "70% students scoring >= 40% marks" }
        ];
        return defaultTargetLevels.map((row: any, idx: number) => ({
            ...row,
            siNo: idx + 1
        }));
    }, [courseAttainmentData, orgType]);

    const courseCoAttainmentColumnDefs = useMemo(() => {
        return [
            { headerName: "SI No.", field: "siNo", sortable: false, filter: false, maxWidth: 90 },
            { headerName: "CO Code", field: "co_code", sortable: false, filter: false, maxWidth: 130 },
            { headerName: "Threshold based Attainment %", field: "threshold_attainment_display", sortable: false, filter: false },
            { headerName: "Attainment Level", field: "attainment_level_display", sortable: false, filter: false, maxWidth: 150 },
            { headerName: "Average based Attainment %", field: "average_attainment_display", sortable: false, filter: false }
        ];
    }, []);

    const courseCoAttainmentRowData = useMemo(() => {
        if (!courseAttainmentData || !courseAttainmentData.co_rows) return [];
        return courseAttainmentData.co_rows.map((row: any, idx: number) => ({
            siNo: idx + 1,
            co_code: row.clo_code || "",
            threshold_attainment_display: row.threshold_percent !== null && row.threshold_percent !== undefined ? `${row.threshold_percent.toFixed(2)}%` : "-",
            attainment_level_display: row.attainment_level !== null && row.attainment_level !== undefined ? row.attainment_level.toFixed(2) : "-",
            average_attainment_display: row.average_attainment !== null && row.average_attainment !== undefined ? `${row.average_attainment.toFixed(2)}%` : "-"
        }));
    }, [courseAttainmentData]);

    const coursePoAttainmentMatrixColumnDefs = useMemo(() => {
        const cols = [
            { headerName: "CO", field: "co_code", sortable: false, filter: false, flex: 1, minWidth: 60 },
        ];
        for (let i = 1; i <= 12; i++) {
            cols.push({
                headerName: String(i),
                field: `po_${i}`,
                sortable: false,
                filter: false,
                flex: 1,
                minWidth: 50
            });
        }
        return cols;
    }, []);

    const poList = useMemo(() => {
        return courseAttainmentData?.po_list || Array.from({ length: 12 }, (_, i) => ({
            po_id: i + 1,
            po_code: `PO${i + 1}`,
            po_statement: `Program Outcome ${i + 1}`
        }));
    }, [courseAttainmentData]);

    const poMatrixRowData = useMemo(() => {
        if (!courseAttainmentData || !courseAttainmentData.po_mapping_rows) return [];
        return courseAttainmentData.po_mapping_rows.map((row: any) => {
            const mappedRow: any = {
                co_code: row.co_code || row.clo_code || ""
            };
            poList.forEach((po: any) => {
                const num = po.po_code.replace("PO", "");
                const poKey = `po_${num}`;
                const val = row[poKey] !== undefined ? row[poKey] : row[`PO${num}`];
                mappedRow[poKey] = val !== undefined && val !== null ? val : "-";
            });
            return mappedRow;
        });
    }, [courseAttainmentData, poList]);

    const coursePoAttainmentByCourseColumnDefs = useMemo(() => {
        return [
            { headerName: "SI No.", field: "siNo", sortable: false, filter: false, maxWidth: 80 },
            {
                headerName: "PO",
                field: "po",
                sortable: false,
                filter: false,
                maxWidth: 100,
                cellRenderer: (params: any) => {
                    return (
                        <div className="flex items-center gap-1">
                            <span>{params.value}</span>
                            <span className="text-[#4a8494] cursor-pointer hover:text-[#3a6a77] text-xs">📊</span>
                        </div>
                    );
                }
            },
            { headerName: "Attainment based on Threshold method %", field: "threshold_method_pct", sortable: false, filter: false },
            { headerName: "Attainment Level", field: "threshold_level", sortable: false, filter: false, maxWidth: 130 },
            { headerName: "Attainment based on Weighted Average Method %", field: "weighted_average_method_pct", sortable: false, filter: false },
            { headerName: "Attainment Level", field: "weighted_level", sortable: false, filter: false, maxWidth: 130 },
            { headerName: "Attainment based on Relative Weighted Average Method %", field: "relative_weighted_average_method_pct", sortable: false, filter: false },
            { headerName: "Attainment Level", field: "relative_level", sortable: false, filter: false, maxWidth: 130 }
        ];
    }, []);

    const poSummaryRowData = useMemo(() => {
        if (!courseAttainmentData || !courseAttainmentData.po_rows) return [];
        return courseAttainmentData.po_rows.map((row: any, idx: number) => ({
            siNo: idx + 1,
            po: row.po_code || row.po_id || String(idx + 1),
            actual_secured_method_pct: row.actual_secured_percent !== null && row.actual_secured_percent !== undefined ? `${row.actual_secured_percent.toFixed(2)} %` : "-",
            actual_secured_level: row.attainment_level !== null && row.attainment_level !== undefined ? row.attainment_level.toFixed(2) : "-",
            threshold_method_pct: row.threshold_attainment !== null && row.threshold_attainment !== undefined ? `${row.threshold_attainment.toFixed(2)} %` : "-",
            threshold_level: row.threshold_level !== null && row.threshold_level !== undefined ? row.threshold_level.toFixed(2) : "-",
            weighted_average_method_pct: row.weighted_average_attainment !== null && row.weighted_average_attainment !== undefined ? `${row.weighted_average_attainment.toFixed(2)} %` : "-",
            weighted_level: row.weighted_level !== null && row.weighted_level !== undefined ? row.weighted_level.toFixed(2) : "-",
            relative_weighted_average_method_pct: row.relative_weighted_attainment !== null && row.relative_weighted_attainment !== undefined ? `${row.relative_weighted_attainment.toFixed(2)} %` : "-",
            relative_level: row.relative_level !== null && row.relative_level !== undefined ? row.relative_level.toFixed(2) : "-"
        }));
    }, [courseAttainmentData]);

    const courseMapLevelWeightageColumnDefs = useMemo(() => {
        return [
            { headerName: "SI No.", field: "siNo", sortable: false, filter: false, maxWidth: 90 },
            { headerName: "Map Level Name", field: "map_level_name", sortable: false, filter: false },
            { headerName: "Value", field: "value", sortable: false, filter: false, maxWidth: 120 },
            { headerName: "Map Level Weightage %", field: "weightage_pct", sortable: false, filter: false }
        ];
    }, []);

    const courseMapLevelWeightageRowData = useMemo(() => {
        if (!courseAttainmentData || !courseAttainmentData.map_level_weightage) return [];
        return courseAttainmentData.map_level_weightage.map((row: any, idx: number) => ({
            siNo: idx + 1,
            map_level_name: row.map_level_name || row.map_level_name_alias,
            value: row.map_level,
            weightage_pct: row.map_level_weightage !== null && row.map_level_weightage !== undefined ? `${row.map_level_weightage}%` : "0%"
        }));
    }, [courseAttainmentData]);

    return (
        <div className="w-full font-['Inter'] p-8 max-w-full mx-auto mt-4 min-h-screen text-left">
            {/* Header Banner */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#4a8494]">
                    First Year Course Outcomes (COs) Attainment (CCE, SEE, MTE)
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsWebHelpOpen(true)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-[#4a8494] transition-colors flex items-center justify-center"
                        title="Web Help"
                    >
                        <HelpCircle size={18} />
                    </button>
                </div>
            </div>

            {/* CARD: Filters and Content wrapped in a single card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                    {/* Curriculum Select */}
                    <div className="w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Curriculum <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedCurriculum || ""}
                            onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                setSelectedCurriculum(val);
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white h-[38px]"
                        >
                            <option value="">Select Curriculum</option>
                            {curricula.map((c) => (
                                <option key={c.crclm_id} value={c.crclm_id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Term Select */}
                    <div className="w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Term <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedTerm || ""}
                            onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                setSelectedTerm(val);
                            }}
                            disabled={!selectedCurriculum}
                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 h-[38px]"
                        >
                            <option value="">Select Term</option>
                            {terms.map((t) => (
                                <option key={t.term_id} value={t.term_id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Course Select */}
                    <div className="w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Course <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedCourse || ""}
                            onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                setSelectedCourse(val);
                            }}
                            disabled={!selectedTerm}
                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 h-[38px]"
                        >
                            <option value="">Select Course</option>
                            {courses.map((c) => (
                                <option key={c.crs_id} value={c.crs_id}>
                                    {c.crs_code} - {c.crs_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 mb-6 mt-4 text-left bg-white">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('cce')}
                            className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all duration-200 ${activeTab === 'cce'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            CCE Attainment
                        </button>
                        <button
                            onClick={() => setActiveTab('course')}
                            className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all duration-200 ${activeTab === 'course'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Course - Attainment
                        </button>
                    </div>

                    {isExportVisible && (
                        <div className="relative inline-block text-left" ref={exportMenuRef}>
                            <button
                                type="button"
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={exporting}
                                className={`inline-flex items-center gap-2 px-5 py-2 rounded-md font-semibold transition ${exporting
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#4a8494] text-white hover:bg-[#3a6a77] focus:outline-none focus:ring-2 focus:ring-[#4a8494] focus:ring-offset-2'
                                    }`}
                            >
                                <Book size={18} />
                                <span>{exporting ? 'Exporting...' : 'Export'}</span>
                                <ChevronDown size={16} className={`transition-transform duration-200 ${showExportMenu ? 'transform rotate-180' : ''}`} />
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 focus:outline-none">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <button
                                            type="button"
                                            onClick={exportPDF}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 transition"
                                            role="menuitem"
                                        >
                                            <FileText className="text-red-500" size={16} />
                                            <span>.pdf</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={exportDOCX}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 transition"
                                            role="menuitem"
                                        >
                                            <FileText className="text-blue-500" size={16} />
                                            <span>.doc</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Tab Contents */}
                <div>
                    {activeTab === 'cce' ? (
                        // --- CCE Attainment Tab ---
                        <div className="space-y-6">
                            <FirstYearCceSelectors
                                sections={sections}
                                occasions={occasions}
                                schools={schools}
                                selectedSection={selectedSection}
                                selectedOccasions={selectedOccasions}
                                selectedSchools={selectedSchools}
                                onSectionChange={setSelectedSection}
                                onOccasionsChange={setSelectedOccasions}
                                onSchoolsChange={setSelectedSchools}
                                onViewStudentDetailsClick={handleViewStudentDetails}
                                isCourseSelected={isCourseSelected}
                            />

                            <div className="border border-gray-200 rounded-lg bg-white p-5 shadow-sm text-left">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-[#4a8494] mb-6 text-left">Course - CCE Attainment</h3>
                                    <HelpCircle onClick={() => setIsWebHelpOpen(true)} className="w-4.5 h-4.5 cursor-pointer text-[#4a8494] opacity-80 hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="space-y-4">
                                    {areAllFiltersSelected ? (
                                        <div className="space-y-6">
                                            {/* Warnings Section */}
                                            {cceWarnings.length > 0 && (
                                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                                    <div className="flex">
                                                        <div className="flex-shrink-0">
                                                            <span className="text-yellow-700">⚠️</span>
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm text-yellow-700 font-medium">Warnings / Alerts:</p>
                                                            <ul className="list-disc pl-5 text-sm text-yellow-700">
                                                                {cceWarnings.map((w, idx) => <li key={idx}>{w}</li>)}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {cceChartData && (
                                                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                                                    <CceAttainmentChart
                                                        key="cce-chart"
                                                        id="cce-chart-canvas"
                                                        labels={cceChartData.labels}
                                                        series={cceChartData.series}
                                                        coStatements={cceCoRows.reduce((acc: any, r: any) => {
                                                            acc[r.clo_code] = r.clo_statement;
                                                            return acc;
                                                        }, {})}
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                                                <div className="flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h3 className="text-xl font-bold text-[#4a8494] text-left">
                                                            Direct Attainment / Target Levels
                                                        </h3>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setIsLogHistoryOpen(true)}
                                                                className="p-1.5 rounded-full hover:bg-gray-100 text-[#4a8494] transition-colors flex items-center justify-center"
                                                                title="Log History"
                                                            >
                                                                <Database size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => setIsWebHelpOpen(true)}
                                                                className="p-1.5 rounded-full hover:bg-gray-100 text-[#4a8494] transition-colors flex items-center justify-center"
                                                                title="Web Help"
                                                            >
                                                                <HelpCircle size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm text-left">
                                                                    <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                                                        <tr>
                                                                            <th className="px-3 py-2 border-r border-slate-200 w-16">Sl No</th>
                                                                            <th className="px-3 py-2 border-r border-slate-200">Attainment Level Name</th>
                                                                            <th className="px-3 py-2 border-r border-slate-200">Attainment Level Value</th>
                                                                            <th className="px-3 py-2">Target</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200">
                                                                        {targetLevelRowData.map((row: any, idx: number) => (
                                                                            <tr key={idx} className="hover:bg-slate-50 transition-colors text-sm group">
                                                                                <td className="px-3 py-2 border-r border-slate-100 text-slate-500 font-mono text-xs">{row.siNo}</td>
                                                                                <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.level_name}</td>
                                                                                <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.level_value}</td>
                                                                                <td className="px-3 py-2 text-slate-600 font-medium">{row.target_text}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h3 className="text-xl font-bold text-[#4a8494] text-left">
                                                            Course Outcomes(COs) Attainment
                                                        </h3>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setIsLogHistoryOpen(true)}
                                                                className="p-1.5 rounded-full hover:bg-gray-100 text-[#4a8494] transition-colors flex items-center justify-center"
                                                                title="Log History"
                                                            >
                                                                <Database size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => setIsWebHelpOpen(true)}
                                                                className="p-1.5 rounded-full hover:bg-gray-100 text-[#4a8494] transition-colors flex items-center justify-center"
                                                                title="Web Help"
                                                            >
                                                                <HelpCircle size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 flex flex-col justify-between">
                                                        <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm w-full">
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm text-left">
                                                                    <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                                                        <tr>
                                                                            <th className="px-3 py-2 border-r border-slate-200 w-16">Sl No</th>
                                                                            <th className="px-3 py-2 border-r border-slate-200">CO Code</th>
                                                                            <th className="px-3 py-2 border-r border-slate-200">Threshold based Attainment %</th>
                                                                            <th className="px-3 py-2 border-r border-slate-200">Attainment Level</th>
                                                                            <th className="px-3 py-2">Average based Attainment %</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200">
                                                                        {coAttainmentRowData.map((row: any, idx: number) => (
                                                                            <tr key={idx} className="hover:bg-slate-50 transition-colors text-sm group">
                                                                                <td className="px-3 py-2 border-r border-slate-100 text-slate-500 font-mono text-xs">{row.siNo}</td>
                                                                                <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">
                                                                                    <div className="flex flex-col items-start justify-center">
                                                                                        <span className="font-semibold text-gray-800 text-xs leading-none">{row.co_code}</span>
                                                                                        <span
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                setSelectedCoForDetails(row);
                                                                                            }}
                                                                                            className="text-[10px] text-blue-600 hover:text-blue-800 underline cursor-pointer font-semibold leading-none mt-1"
                                                                                        >
                                                                                            View details
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.threshold_attainment_display}</td>
                                                                                <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.attainment_level_display}</td>
                                                                                <td className="px-3 py-2 text-slate-600 font-medium">{row.average_attainment_display}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 flex flex-wrap gap-6 text-sm text-left border-t pt-3 font-bold text-gray-800">
                                                            <div>
                                                                Actual Course Attainment: {actualCceAttainment.toFixed(2)} %
                                                            </div>
                                                            <div>
                                                                Course Attainment After Weightage : {weightedCceAttainment.toFixed(2)} %
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <FormulaNoteSection />
                                        </div>
                                    ) : (
                                        <div className="border border-gray-200 rounded-lg bg-white p-8 flex items-center justify-center min-h-[200px]">
                                            <div className="text-gray-500 text-center text-sm font-medium">

                                            </div>
                                        </div>
                                    )}

                                    {/* Student Details */}
                                    <div
                                        ref={studentDetailsRef}
                                        className="border border-gray-200 rounded-lg bg-white overflow-hidden mt-6"
                                    >
                                        <button
                                            onClick={() => setIsStudentDetailsExpanded(!isStudentDetailsExpanded)}
                                            className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
                                        >
                                            <span className="font-bold text-gray-800 flex items-center gap-1.5">
                                                {isStudentDetailsExpanded ? <ChevronUp size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />}
                                                Student Details
                                            </span>
                                        </button>

                                        {isStudentDetailsExpanded && (
                                            <div className="p-4 bg-white min-h-[120px] block w-full">
                                                {areAllFiltersSelected && studentRows.length > 0 ? (
                                                    <div className="w-full">
                                                        <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm text-left">
                                                                    <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                                                        <tr>
                                                                            <th className="px-3 py-2 border-r border-slate-200">Sl No</th>
                                                                            <th className="px-3 py-2 border-r border-slate-200">Department</th>
                                                                            <th className="px-3 py-2 border-r border-slate-200">Student PNR / USN</th>
                                                                            <th className="px-3 py-2 border-r border-slate-200">Student Name</th>
                                                                            <th className="px-3 py-2">Email</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200">
                                                                        {paginatedStudents.length === 0 ? (
                                                                            <tr>
                                                                                <td colSpan={5} className="text-center py-10 text-slate-400 font-medium italic">
                                                                                    No data available
                                                                                </td>
                                                                            </tr>
                                                                        ) : (
                                                                            paginatedStudents.map((row, index) => (
                                                                                <tr key={index} className="hover:bg-slate-50 transition-colors text-sm group">
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500 font-mono text-xs">{(studentPage - 1) * studentPageSize + index + 1}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.department}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.usn}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.studentName}</td>
                                                                                    <td className="px-3 py-2 text-slate-600 font-medium">{row.email}</td>
                                                                                </tr>
                                                                            ))
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <div className="flex justify-end items-center px-4 py-2 border-t bg-slate-50 text-[13px] text-slate-800 gap-8 h-12">
                                                                <div className="flex items-center gap-2">
                                                                    <span>Page Size:</span>
                                                                    <select 
                                                                        value={studentPageSize}
                                                                        onChange={(e) => { setStudentPageSize(Number(e.target.value)); setStudentPage(1); }}
                                                                        className="border border-slate-300 rounded px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer shadow-sm min-w-[50px]"
                                                                    >
                                                                        <option value={10}>10</option>
                                                                        <option value={20}>20</option>
                                                                        <option value={50}>50</option>
                                                                    </select>
                                                                </div>
                                                                <div className="font-bold">
                                                                    {filteredStudents.length > 0 ? (studentPage - 1) * studentPageSize + 1 : 0} to {Math.min(studentPage * studentPageSize, filteredStudents.length)} of {filteredStudents.length}
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <button 
                                                                            disabled={studentPage === 1} 
                                                                            onClick={() => setStudentPage(1)}
                                                                            className={`p-1 px-1.5 text-slate-400 hover:text-blue-600 ${studentPage === 1 ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer'}`}
                                                                        >
                                                                            <span className="text-sm font-mono tracking-tighter">|&lt;</span>
                                                                        </button>
                                                                        <button 
                                                                            disabled={studentPage === 1} 
                                                                            onClick={() => setStudentPage(prev => Math.max(prev - 1, 1))}
                                                                            className={`p-1 px-1.5 text-slate-400 hover:text-blue-600 ${studentPage === 1 ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer'}`}
                                                                        >
                                                                            <span className="text-sm font-mono tracking-tighter">&lt;</span>
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center whitespace-nowrap">
                                                                        Page <span className="font-bold mx-1.5">{studentPage} of {totalStudentPages}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button 
                                                                            disabled={studentPage === totalStudentPages} 
                                                                            onClick={() => setStudentPage(prev => Math.min(prev + 1, totalStudentPages))}
                                                                            className={`p-1 px-1.5 text-slate-400 hover:text-blue-600 ${studentPage === totalStudentPages ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer'}`}
                                                                        >
                                                                            <span className="text-sm font-mono tracking-tighter">&gt;</span>
                                                                        </button>
                                                                        <button 
                                                                            disabled={studentPage === totalStudentPages} 
                                                                            onClick={() => setStudentPage(totalStudentPages)}
                                                                            className={`p-1 px-1.5 text-slate-400 hover:text-blue-600 ${studentPage === totalStudentPages ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer'}`}
                                                                        >
                                                                            <span className="text-sm font-mono tracking-tighter">&gt;|</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500 text-center text-sm font-medium w-full py-8">
                                                        No data to display.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // --- Course Attainment Tab ---
                        <div className="relative">
                            <div className="space-y-6">
                                {/* Type and Department Selectors */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                            Type:<span className="text-red-500 ml-0.5">*</span>
                                        </label>
                                        <MultiSelect
                                            name="course-type"
                                            label=""
                                            options={typeOptions}
                                            value={selectedType}
                                            onChange={(val: any) => setSelectedType(val ?? [])}
                                            placeholder="Select Type"
                                            isMulti={true}
                                            isSelectAll={true}
                                            allSelectedLabel="All Selected"
                                            customLabelBehavior={true}
                                            disabled={!isCourseSelected}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                            Department:<span className="text-red-500 ml-0.5">*</span>
                                        </label>
                                        <MultiSelect
                                            name="course-department"
                                            label=""
                                            options={departmentOptions}
                                            value={selectedDepartment}
                                            onChange={(val: any) => setSelectedDepartment(val ?? [])}
                                            placeholder="Select Department"
                                            isMulti={true}
                                            isSelectAll={true}
                                            allSelectedLabel="All Selected"
                                            customLabelBehavior={true}
                                            disabled={!isCourseSelected}
                                        />
                                    </div>
                                </div>

                                {/* Warnings for Course Tab */}
                                {selectedType.length > 0 && selectedDepartment.length > 0 && courseAttainmentData?.warnings?.length > 0 && (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <span className="text-yellow-700">⚠️</span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-yellow-700 font-medium">Warnings / Alerts:</p>
                                                <ul className="list-disc pl-5 text-sm text-yellow-700">
                                                    {courseAttainmentData.warnings.map((w: string, idx: number) => <li key={idx}>{w}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Course Outcomes (COs) Attainment Section */}
                                <div className="border border-gray-200 rounded-lg bg-white p-5 shadow-sm text-left">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold text-[#4a8494] mb-6 text-left">Course Outcomes (COs) Attainment</h3>
                                        <HelpCircle onClick={() => setIsWebHelpOpen(true)} className="w-4.5 h-4.5 cursor-pointer text-[#4a8494] opacity-80 hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="space-y-6">
                                        {selectedType.length > 0 && selectedDepartment.length > 0 && courseAttainmentData?.validation_failures ? (
                                            <ValidationFailuresView
                                                failures={courseAttainmentData.validation_failures}
                                                onNavigate={navigate}
                                            />
                                        ) : selectedType.length > 0 && selectedDepartment.length > 0 && courseAttainmentData && courseAttainmentData.co_rows?.length > 0 ? (
                                            <div className="space-y-6">
                                                {/* Chart */}
                                                {courseAttainmentData.chart && (
                                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                                                        <CceAttainmentChart
                                                            key="course-chart"
                                                            id="course-chart-canvas"
                                                            labels={courseAttainmentData.chart.labels}
                                                            series={courseAttainmentData.chart.series}
                                                            coStatements={courseAttainmentData.co_rows?.reduce((acc: any, r: any) => {
                                                                acc[r.clo_code] = r.clo_statement;
                                                                return acc;
                                                            }, {})}
                                                        />
                                                    </div>
                                                )}

                                                {/* Side-by-Side Tables */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                                                    {/* Target Levels Table */}
                                                    <div className="flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
                                                        <div className="flex justify-between items-center mb-6">
                                                            <h3 className="text-xl font-bold text-[#4a8494] text-left">
                                                                Direct Attainment / Target Levels
                                                            </h3>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => setIsWebHelpOpen(true)}
                                                                    className="p-1.5 rounded-full hover:bg-gray-100 text-[#4a8494] transition-colors flex items-center justify-center"
                                                                    title="Web Help"
                                                                >
                                                                    <HelpCircle size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm text-left">
                                                                        <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                                                        <tr>
                                                                        <th className="px-3 py-2 border-r border-slate-200 w-16">Sl No</th>
                                                                        <th className="px-3 py-2 border-r border-slate-200">Attainment Level Name</th>
                                                                        <th className="px-3 py-2 border-r border-slate-200">Attainment Level Value</th>
                                                                        {showCceTarget && <th className={cceHeaderClass}>CCE Target %</th>}
                                                                        {showMteTarget && <th className={mteHeaderClass}>MTE Target %</th>}
                                                                        {showSeeTarget && <th className={seeHeaderClass}>SEE Target %</th>}
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-200">
                                                                        {courseTargetLevelRowData.map((row: any, idx: number) => (
                                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors text-sm group">
                                                                        <td className="px-3 py-2 border-r border-slate-100 text-slate-500 font-mono text-xs">{row.siNo}</td>
                                                                        <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.level_name}</td>
                                                                        <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.level_value}</td>
                                                                        {showCceTarget && <td className={cceCellClass}>{row.cce_target}</td>}
                                                                        {showMteTarget && <td className={mteCellClass}>{row.mte_target}</td>}
                                                                        {showSeeTarget && <td className={seeCellClass}>{row.see_target}</td>}
                                                                        </tr>
                                                                        ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Course Outcomes Attainment Table */}
                                                    <div className="flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
                                                        <div className="flex justify-between items-center mb-6">
                                                            <h3 className="text-xl font-bold text-[#4a8494] text-left">
                                                                Course Outcomes(COs) Attainment
                                                            </h3>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => setIsWebHelpOpen(true)}
                                                                    className="p-1.5 rounded-full hover:bg-gray-100 text-[#4a8494] transition-colors flex items-center justify-center"
                                                                    title="Web Help"
                                                                >
                                                                    <HelpCircle size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-between">
                                                            <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm w-full">
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm text-left">
                                                                        <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                                                            <tr>
                                                                                <th className="px-3 py-2 border-r border-slate-200 w-16">Sl No</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">CO Code</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">Threshold based Attainment %</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">Attainment Level</th>
                                                                                <th className="px-3 py-2">Average based Attainment %</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-200">
                                                                            {courseCoAttainmentRowData.map((row: any, idx: number) => (
                                                                                <tr key={idx} className="hover:bg-slate-50 transition-colors text-sm group">
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500 font-mono text-xs">{row.siNo}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.co_code}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.threshold_attainment_display}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.attainment_level_display}</td>
                                                                                    <td className="px-3 py-2 text-slate-600 font-medium">{row.average_attainment_display}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Formula Note Section for Course Tab */}
                                                <div className="mt-4 p-4 border border-gray-200 bg-[#f8f8f6] rounded-lg text-sm text-left shadow-sm">
                                                    <div className="text-gray-700 mb-1">
                                                        <span className="font-bold text-gray-800">Note: </span>
                                                        The above bar graph depicts the overall class performance with respect to the Threshold % for individual Course Outcomes (COs). The Average based Attainment % is calculated using the below formula.
                                                    </div>
                                                    <div className="font-bold text-gray-800 mt-2">
                                                        For Attainment % = Average Secured Attainment Percentage of Attempted Students (includes all sections).
                                                    </div>
                                                </div>

                                                {/* Matrix Table */}
                                                <div className="border border-gray-200 rounded-lg bg-white p-5 shadow-sm text-left mt-8">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h3 className="text-xl font-bold text-[#4a8494] mb-6 text-left">Course - Course Outcomes (COs) to Program Outcomes (POs) Attainment Matrix</h3>
                                                        <HelpCircle onClick={() => setIsWebHelpOpen(true)} className="w-4.5 h-4.5 cursor-pointer text-[#4a8494] opacity-80 hover:opacity-100 transition-opacity self-start mt-[5px]" />
                                                    </div>
                                                    <div>
                                                        <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm text-left">
                                                                    <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                                                        <tr>
                                                                            <th className="px-3 py-2 border-r border-slate-200 w-16">CO</th>
                                                                            {poList.map((po: any, idx: number) => {
                                                                                const poNum = po.po_code.replace("PO", "");
                                                                                return (
                                                                                    <th 
                                                                                        key={po.po_id} 
                                                                                        title={`${poNum}. ${po.po_statement}`}
                                                                                        className={`px-3 py-2 ${idx < poList.length - 1 ? 'border-r border-slate-200' : ''} text-center cursor-help`}
                                                                                    >
                                                                                        {poNum}
                                                                                    </th>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200">
                                                                        {poMatrixRowData.map((row: any, idx: number) => (
                                                                            <tr key={idx} className="hover:bg-slate-50 transition-colors text-sm group">
                                                                                <td className="px-3 py-2 border-r border-slate-100 font-bold text-slate-700">{row.co_code}</td>
                                                                                {poList.map((po: any, i: number) => {
                                                                                    const poKey = `po_${po.po_code.replace("PO", "")}`;
                                                                                    return (
                                                                                        <td 
                                                                                            key={po.po_id} 
                                                                                            className={`px-3 py-2 ${i < poList.length - 1 ? 'border-r border-slate-100' : ''} text-center text-slate-600 font-medium`}
                                                                                        >
                                                                                            {row[poKey]}
                                                                                        </td>
                                                                                    );
                                                                                })}
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* PO summaries & Map Level Tables */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mt-8">
                                                    {/* Program Outcomes POs Attainment by the Course */}
                                                    <div className="flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h3 className="text-xl font-bold text-[#4a8494] mb-6 text-left">
                                                                Program Outcomes POs Attainment by the Course
                                                            </h3>
                                                            <HelpCircle onClick={() => setIsWebHelpOpen(true)} className="w-4.5 h-4.5 cursor-pointer text-[#4a8494] opacity-80 hover:opacity-100 transition-opacity self-start mt-[5px]" />
                                                        </div>
                                                        <div className="flex-grow">
                                                            <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm text-left">
                                                                        <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                                                            <tr>
                                                                                <th className="px-3 py-2 border-r border-slate-200 w-16">Sl No</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">PO</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">Attainment based on Threshold method %</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">Attainment Level</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">Attainment based on Weighted Average Method %</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">Attainment Level</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">Attainment based on Relative Weighted Average Method %</th>
                                                                                <th className="px-3 py-2">Attainment Level</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-200">
                                                                            {poSummaryRowData.map((row: any, idx: number) => (
                                                                                <tr key={idx} className="hover:bg-slate-50 transition-colors text-sm group">
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500 font-mono text-xs">{row.siNo}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">
                                                                                        <div className="flex items-center gap-1">
                                                                                            <span>{row.po}</span>
                                                                                            <span className="text-[#4a8494] text-xs">📊</span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.threshold_method_pct}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.threshold_level}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.weighted_average_method_pct}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.weighted_level}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.relative_weighted_average_method_pct}</td>
                                                                                    <td className="px-3 py-2 text-slate-600 font-medium">{row.relative_level}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Map Level Weightage Table */}
                                                    <div className="flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h3 className="text-xl font-bold text-[#4a8494] mb-6 text-left">
                                                                Map Level Weightage
                                                            </h3>
                                                            <HelpCircle onClick={() => setIsWebHelpOpen(true)} className="w-4.5 h-4.5 cursor-pointer text-[#4a8494] opacity-80 hover:opacity-100 transition-opacity self-start mt-[5px]" />
                                                        </div>
                                                        <div className="flex-grow">
                                                            <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm text-left">
                                                                        <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                                                            <tr>
                                                                                <th className="px-3 py-2 border-r border-slate-200 w-16">Sl No</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">Map Level Name</th>
                                                                                <th className="px-3 py-2 border-r border-slate-200">Value</th>
                                                                                <th className="px-3 py-2">Map Level Weightage %</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-200">
                                                                            {courseMapLevelWeightageRowData.map((row: any, idx: number) => (
                                                                                <tr key={idx} className="hover:bg-slate-50 transition-colors text-sm group">
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500 font-mono text-xs">{row.siNo}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.map_level_name}</td>
                                                                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.value}</td>
                                                                                    <td className="px-3 py-2 text-slate-600 font-medium">{row.weightage_pct}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Note Section for Program Outcomes */}
                                                <div className="p-4 border border-gray-200 bg-[#f8f8f6] rounded-lg text-sm text-left shadow-sm mt-4">
                                                    <div className="font-semibold text-gray-700 mb-2">
                                                        <span className="font-bold text-gray-800">Note: </span>
                                                        The above bar graph depicts the overall class performance with respect to the Threshold % for individual Program Outcomes (POs). The Attainment % for respective columns is calculated using the below formula.
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pt-3 border-t border-gray-200">
                                                        <div>
                                                            <div className="font-bold text-gray-800 mb-1">
                                                                For Attainment based on Threshold method %
                                                            </div>
                                                            <div className="text-gray-600 text-xs mt-1">
                                                                = Average of all the Course Outcomes(COs) Threshold based Attainment % mapped to the respective Program Outcome((PO)). (as per the COs to (POs) mapping matrix).
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800 mb-1">
                                                                For Attainment based on Weighted Average Method %
                                                            </div>
                                                            <div className="text-gray-600 text-xs mt-1">
                                                                = Average of all the Course Outcomes(COs) Attainment % (Map Level Weighted Attainment %) mapped to the respective Program Outcome(PO). (as per the COs to POs mapping matrix).
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800 mb-1">
                                                                For Attainment based on Relative Weighted Average Method %
                                                            </div>
                                                            <div className="text-gray-600 text-xs mt-1">
                                                                = Sum of all the Course Outcomes(COs) Attainment % (Map Level Weighted * Mapped Value) / Sum of all Mapped Value of the respective Program Outcome((PO)). (as per the COs to (POs) mapping matrix).
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border border-gray-200 rounded-lg bg-white p-8 flex items-center justify-center min-h-[200px]">
                                                <div className="text-gray-500 text-center text-sm font-medium">
                                                    {selectedType.length > 0 && selectedDepartment.length > 0 ? 'No data available for the selected filters.' : 'Please select Type and Department to view data'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={isFinalizeDialogOpen}
                onClose={() => setIsFinalizeDialogOpen(false)}
                onConfirm={() => { }}
                title="Finalize First Year Course Attainment"
                message="Finalizing the attainment values for this course will freeze the CCE, MTE, and SEE outcome calculations. Do you want to proceed?"
            />

            <FirstYearWebHelpModal
                open={isWebHelpOpen}
                onClose={() => setIsWebHelpOpen(false)}
            />

            <LogHistoryModal
                open={isLogHistoryOpen}
                onClose={() => setIsLogHistoryOpen(false)}
            />

                {selectedCoForDetails !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200 text-left flex flex-col max-h-[90vh]">
                            <div className="bg-slate-50 text-[#4a8494] px-4 py-3 font-semibold flex justify-between items-center border-b border-slate-200 shrink-0">
                                <span>Course Outcome (CO) Assessment Details</span>
                                <HelpCircle onClick={() => setIsWebHelpOpen(true)} className="w-4.5 h-4.5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity text-[#4a8494]" />
                            </div>
                            <div className="p-6 overflow-y-auto space-y-4 flex-grow">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded border border-gray-100">
                                    <div>
                                        <span className="font-semibold text-gray-700">Curriculum: </span>
                                        <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 hover:underline font-medium">
                                            {selectedCurriculumName}
                                        </a>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Term: </span>
                                        <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 hover:underline font-medium">
                                            {selectedTermName}
                                        </a>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Course: </span>
                                        <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 hover:underline font-medium">
                                            {selectedCourseName}
                                        </a>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Section: </span>
                                        <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 hover:underline font-medium">
                                            {selectedSectionName}
                                        </a>
                                    </div>
                                </div>
                                <div className="text-base font-bold text-gray-800 border-b pb-2">
                                    {selectedCoForDetails.co_code}: {selectedCoForDetails.co_statement || selectedCoForDetails.clo_statement}
                                </div>
                                <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                                <tr>
                                                    <th className="px-3 py-2 border-r border-slate-200">Occasion</th>
                                                    <th className="px-3 py-2 border-r border-slate-200">Q No.</th>
                                                    <th className="px-3 py-2 border-r border-slate-200">Question Content</th>
                                                    <th className="px-3 py-2">Marks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {modalRowData.map((row: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors text-sm group">
                                                        <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.occasion}</td>
                                                        <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.qNo}</td>
                                                        <td className="px-3 py-2 border-r border-slate-100 text-slate-600 font-medium">{row.questionContent}</td>
                                                        <td className="px-3 py-2 text-slate-600 font-medium">{row.marks_display}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 flex justify-end bg-gray-50 border-t border-gray-100 shrink-0">
                                <button
                                    onClick={() => setSelectedCoForDetails(null)}
                                    className="px-4 py-2 bg-[#d9534f] hover:bg-[#c9302c] text-white rounded font-semibold text-sm flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                                >
                                    <X size={14} className="stroke-[3]" /> Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FirstYearCourseCoAttainment;