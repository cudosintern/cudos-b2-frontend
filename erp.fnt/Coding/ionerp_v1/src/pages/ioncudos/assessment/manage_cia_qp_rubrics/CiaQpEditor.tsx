import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './CiaQp.css';
import '../cia/cia.css';
import { 
    FaSave, FaArrowLeft, FaPlus, FaCheckCircle, FaLayerGroup, 
    FaQuestionCircle, FaFilePdf, FaTimes, FaRedo, FaPencilAlt, FaLink, FaFileUpload, FaEye,
    FaExclamationCircle, FaList, FaChartBar, FaFileImport, FaChevronDown, FaChevronRight, FaEdit
} from 'react-icons/fa';
import { GoPencil } from 'react-icons/go';
import { 
    getAoDropdowns, getCourseDetails, getQp, saveQp, 
    getQpFileUrl, saveAo 
} from './CiaQpApi';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip 
} from 'recharts';
import Select from 'react-select';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CiaQpImportModal from './CiaQpImportModal';
import CiaRubricImportModal from './CiaRubricImportModal';
import CiaOrMappingModal from './CiaOrMappingModal';
import CiaAddQuestionModal from './CiaAddQuestionModal';

const COLORS = ['#4a8494', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const PRIMARY_TEAL = '#4a8494';
const PRIMARY_TEAL_HOVER = '#3d6d7a';

const CiaQpEditor: React.FC = () => {
    const { ao_id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { filters, aoData: initialAoData, courseRecord, curriculumName, termName } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [courseDetails, setCourseDetails] = useState<any>(null);
    const [dropdownData, setDropdownData] = useState<any>({
        ao_methods: [],
        ao_types: [],
        course_outcomes: [],
        bloom_levels: []
    });
    
    // UI Toggles
    const [isFrameworkEditOpen, setIsFrameworkEditOpen] = useState(true);
    const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [isQpImportModalOpen, setIsQpImportModalOpen] = useState(false);
    const [isRubricImportModalOpen, setIsRubricImportModalOpen] = useState(false);
    const [isOrMappingModalOpen, setIsOrMappingModalOpen] = useState(false);
    const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Legacy if needed

    // QP Framework State
    const [qpData, setQpData] = useState<any>({
        qpd_id: null,
        qpd_title: '',
        qpd_timing: '90 Mins',
        qpd_max_marks: 0,
        qpd_gt_marks: 0,
        cia_model_qp: 0,
        cia_qp_note: '',
        qpd_num_units: 1,
        crs_id: filters?.crs_id || initialAoData?.crs_id,
        academic_batch_id: filters?.curriculum_id || initialAoData?.academic_batch_id,
        semester_id: filters?.term_id || initialAoData?.semester_id,
        ao_method_id: initialAoData?.ao_method_id || 1,
        qpd_type: initialAoData?.ao_type_id || 1,
        qp_file: null,
        units: [
            {
                qp_unit_code: 'UNIT 1',
                qp_total_unitquestion: 0,
                qp_attempt_unitquestion: 1,
                qp_utotal_marks: 0,
                main_questions: []
            }
        ]
    });

    // Rubrics State
    const [rubricColumnCount, setRubricColumnCount] = useState(4);
    const [rubricCriteria, setRubricCriteria] = useState<any[]>([]);
    const [rubricMode, setRubricMode] = useState<'custom' | 'co'>('custom');
    const [isRubricsFinalized, setIsRubricsFinalized] = useState(false);
    const [rubricForm, setRubricForm] = useState<any>({
        criteria: '',
        coCode: '',
        scales: []
    });
    const [editingRubricIndex, setEditingRubricIndex] = useState<number | null>(null);
    const [isMatrixVisible, setIsMatrixVisible] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isFinalizeConfirmOpen, setIsFinalizeConfirmOpen] = useState(false);

    const addRubricCriteria = () => {
        setRubricForm({
            criteria: '',
            coCode: '',
            scales: Array(rubricColumnCount).fill(null).map((_, i) => ({
                label: `Level ${i + 1}`,
                range: '',
                description: ''
            }))
        });
        setEditingRubricIndex(null);
        // Scroll to form if needed
        const formElement = document.querySelector('.cia-section-title')?.parentElement;
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const isRubricsType = useMemo(() => {
        const typeName = String(courseDetails?.ao?.assessment_type || initialAoData?.assessment_type || '').toLowerCase();
        return typeName.includes('rubric') || Number(courseDetails?.ao?.ao_type_id || initialAoData?.ao_type_id) === 3;
    }, [courseDetails, initialAoData]);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [courseRes, dropdownRes] = await Promise.all([
                getCourseDetails({
                    crs_id: initialAoData?.crs_id,
                    curriculum_id: initialAoData?.academic_batch_id,
                    term_id: initialAoData?.semester_id
                }),
                getAoDropdowns(initialAoData?.crs_id, initialAoData?.academic_batch_id)
            ]);

            const ao = courseRes?.ao || initialAoData;
            setCourseDetails(courseRes);
            setDropdownData({
                ao_methods: dropdownRes.ao_methods || [],
                ao_types: dropdownRes.ao_types || [],
                course_outcomes: dropdownRes.course_outcomes || [],
                bloom_levels: dropdownRes.bloom_levels || [],
                performance_indicators: dropdownRes.performance_indicators || dropdownRes.pis || []
            });

            if (ao) {
                setQpData((prev: any) => ({
                    ...prev,
                    qpd_title: prev.qpd_title || ao.ao_name || '',
                    qpd_max_marks: prev.qpd_max_marks || ao.max_marks || 0,
                    ao_method_id: ao.ao_method_id || prev.ao_method_id,
                    qp_file: ao.qp_file || prev.qp_file
                }));

                if (ao.qpd_id) {
                    const existingQp = await getQp(ao.qpd_id);
                    if (existingQp) {
                        setQpData((prev: any) => ({
                            ...prev,
                            qpd_id: existingQp.qp_id,
                            qpd_title: existingQp.qp_name || prev.qpd_title,
                            qpd_timing: existingQp.qpd_timing || '90 Mins',
                            qpd_max_marks: existingQp.qpd_max_marks || prev.qpd_max_marks,
                            qpd_gt_marks: existingQp.qpd_gt_marks || prev.qpd_gt_marks,
                            cia_model_qp: existingQp.cia_model_qp || 0,
                            cia_qp_note: existingQp.cia_qp_note || '',
                            units: existingQp.units?.map((u: any) => ({
                                qp_unit_code: u.unit_name || u.qp_unit_code,
                                qp_total_unitquestion: u.qp_total_unitquestion || u.questions?.length,
                                qp_attempt_unitquestion: u.qp_attempt_unitquestion || 1,
                                qp_utotal_marks: u.qp_utotal_marks,
                                main_questions: u.questions?.map((q: any) => ({
                                    ...q,
                                    qp_mq_code: q.question_no || q.qp_mq_code,
                                    qp_content: q.question_text || q.qp_content,
                                    qp_subq_marks: q.marks || q.qp_subq_marks,
                                    mappings: q.mappings?.length >= 2 ? q.mappings : [
                                        { entity_id: 1, actual_mapped_id: q.mappings?.[0]?.actual_mapped_id || '' },
                                        { entity_id: 3, actual_mapped_id: q.mappings?.[1]?.actual_mapped_id || '' }
                                    ]
                                })) || []
                            })) || prev.units
                        }));
                    }
                }
                
                if (ao.rubrics_data) {
                    try {
                        const rubData = JSON.parse(ao.rubrics_data);
                        setRubricCriteria(rubData.criteria || []);
                        setRubricColumnCount(rubData.column_count || 4);
                        setIsRubricsFinalized(rubData.finalized || false);
                    } catch (e) { console.error("Error parsing rubrics data", e); }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [initialAoData]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleUnitChange = (idx: number, field: string, value: any) => {
        const newUnits = [...qpData.units];
        newUnits[idx] = { ...newUnits[idx], [field]: value };
        setQpData({ ...qpData, units: newUnits });
    };

    const addUnit = () => {
        setQpData({
            ...qpData,
            units: [...qpData.units, {
                qp_unit_code: `UNIT ${qpData.units.length + 1}`,
                qp_total_unitquestion: 0,
                qp_attempt_unitquestion: 1,
                qp_utotal_marks: 0,
                main_questions: []
            }]
        });
    };

    const removeUnit = (idx: number) => {
        if (qpData.units.length === 1) return;
        const newUnits = qpData.units.filter((_: any, i: number) => i !== idx);
        setQpData({ ...qpData, units: newUnits });
    };

    const addQuestion = (unitIdx: number) => {
        const newUnits = [...qpData.units];
        const unit = newUnits[unitIdx];
        unit.main_questions.push({
            qp_mq_code: `Q${unit.main_questions.length + 1}`,
            qp_content: '',
            qp_subq_marks: 0,
            mappings: [
                { entity_id: 1, actual_mapped_id: '' },
                { entity_id: 3, actual_mapped_id: '' }
            ]
        });
        unit.qp_total_unitquestion = unit.main_questions.length;
        setQpData({ ...qpData, units: newUnits });
    };

    const handleQuestionChange = (unitIdx: number, qIdx: number, field: string, value: any) => {
        const newUnits = [...qpData.units];
        const question = newUnits[unitIdx].main_questions[qIdx];
        
        if (!question.mappings || question.mappings.length < 2) {
            question.mappings = [
                { entity_id: 1, actual_mapped_id: '' },
                { entity_id: 3, actual_mapped_id: '' }
            ];
        }

        if (field === 'co') {
            question.mappings[0].actual_mapped_id = value;
        } else if (field === 'bloom') {
            question.mappings[1].actual_mapped_id = value;
        } else {
            question[field] = value;
        }

        newUnits[unitIdx].qp_utotal_marks = newUnits[unitIdx].main_questions.reduce((sum: number, q: any) => sum + (parseFloat(q.qp_subq_marks) || 0), 0);
        setQpData({ ...qpData, units: newUnits });
    };

    const removeQuestion = (unitIdx: number, qIdx: number) => {
        if (!window.confirm("Delete this question?")) return;
        const newUnits = [...qpData.units];
        newUnits[unitIdx].main_questions.splice(qIdx, 1);
        newUnits[unitIdx].qp_total_unitquestion = newUnits[unitIdx].main_questions.length;
        newUnits[unitIdx].qp_utotal_marks = newUnits[unitIdx].main_questions.reduce((sum: number, q: any) => sum + (parseFloat(q.qp_subq_marks) || 0), 0);
        setQpData({ ...qpData, units: newUnits });
    };

    const analysisData = useMemo(() => {
        const bloomCounts: Record<string, number> = {};
        const coCounts: Record<string, number> = {};
        let totalMarksDefined = 0;

        qpData.units.forEach((u: any) => {
            u.main_questions.forEach((q: any) => {
                const marks = parseFloat(q.qp_subq_marks) || 0;
                totalMarksDefined += marks;

                const bloomId = q.mappings[1]?.actual_mapped_id;
                const bloom = dropdownData.bloom_levels.find((b: any) => String(b.id) === String(bloomId));
                if (bloom) {
                    bloomCounts[bloom.name] = (bloomCounts[bloom.name] || 0) + marks;
                }

                const coId = q.mappings[0]?.actual_mapped_id;
                const co = dropdownData.course_outcomes.find((c: any) => String(c.id) === String(coId));
                if (co) {
                    coCounts[co.name] = (coCounts[co.name] || 0) + marks;
                }
            });
        });

        const bloomChart = Object.entries(bloomCounts).map(([name, value]) => ({ name, value }));
        const coChart = Object.entries(coCounts).map(([name, value]) => ({ name, value }));

        return { bloomChart, coChart, totalMarksDefined };
    }, [qpData.units, dropdownData.bloom_levels, dropdownData.course_outcomes]);

    const handleSave = async () => {
        if (Number(qpData.qpd_max_marks) !== analysisData.totalMarksDefined) {
            toast.error(`Validation Error: Sum of Question Marks (${analysisData.totalMarksDefined}) must equal Max Marks (${qpData.qpd_max_marks})`);
            return;
        }
        
        setActionLoading(true);
        try {
            const payload = {
                ...qpData,
                qpd_max_marks: Number(qpData.qpd_max_marks),
                qpd_gt_marks: Number(qpData.qpd_gt_marks),
                units: qpData.units.map((u: any) => ({
                    ...u,
                    qp_total_unitquestion: u.main_questions.length,
                    main_questions: u.main_questions.map((q: any) => ({
                        ...q,
                        mappings: q.mappings.map((m: any) => ({
                            ...m,
                            actual_mapped_id: Number(m.actual_mapped_id),
                            mapped_marks: Number(q.qp_subq_marks),
                            mapped_percentage: 100
                        }))
                    }))
                }))
            };
            const res = await saveQp(payload);
            if (res.status) {
                toast.success("Framework saved successfully!");
                navigate(-1);
            } else {
                toast.error(res.message || "Failed to save");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Error saving framework");
        } finally {
            setActionLoading(false);
        }
    };

    // Rubrics Handlers
    const generateRubricsTable = () => {
        if (rubricCriteria.length > 0) {
            setIsConfirmModalOpen(true);
            return;
        }
        confirmedGenerate();
    };

    const confirmedGenerate = () => {
        const scales = Array.from({ length: rubricColumnCount }).map((_, i) => ({
            range: '',
            label: `${i + 1}`,
            description: ''
        }));
        setRubricForm({ criteria: '', coCode: '', scales });
        setRubricCriteria([]); // Clear per warning
        setIsMatrixVisible(true);
        setIsConfirmModalOpen(false);
    };

    const handleAddCriteria = () => {
        // Determine what to use as criteria based on mode
        const criteriaToSave = rubricMode === 'co' ? rubricForm.coCode : rubricForm.criteria;
        
        // Context-aware validation
        if (!criteriaToSave?.trim()) {
            return toast.warning(rubricMode === 'co' ? "Please select at least one Course Outcome (CO)" : "Criteria is required");
        }

        const finalEntry = { ...rubricForm, criteria: criteriaToSave };

        if (editingRubricIndex !== null) {
            const updated = [...rubricCriteria];
            updated[editingRubricIndex] = finalEntry;
            setRubricCriteria(updated);
            setEditingRubricIndex(null);
        } else {
            setRubricCriteria([...rubricCriteria, finalEntry]);
        }
        setIsMatrixVisible(false);
        setRubricForm({ criteria: '', coCode: '', scales: [] });
    };

    const handleFinalizeRubrics = async () => {
        if (rubricCriteria.length === 0) return toast.warning("Add at least one criteria");
        setIsFinalizeConfirmOpen(true);
    };

    const confirmedFinalize = async () => {
        setIsFinalizeConfirmOpen(false);
        setActionLoading(true);
        try {
            const rubState = {
                criteria: rubricCriteria,
                column_count: rubricColumnCount,
                finalized: true
            };
            const rubricType = dropdownData.ao_types?.find((t: any) => 
                t.name.toLowerCase().includes('rubric')
            );
            const rubricTypeId = rubricType ? Number(rubricType.id) : (Number(initialAoData?.ao_type_id) || 106);

            const payload = {
                ao_id: Number(ao_id),
                ao_name: initialAoData?.sub_occasion_type || initialAoData?.ao_name || qpData.qpd_title || 'CIA',
                ao_sl_no: String(initialAoData?.ao_sl_no || '1'),
                ao_method_id: Number(initialAoData?.ao_method_id || qpData.ao_method_id || 1),
                ao_type_id: rubricTypeId,
                max_marks: Number(initialAoData?.max_marks || qpData.qpd_max_marks || 0),
                crs_code: String(initialAoData?.crs_code || qpData.crs_code || '-'),
                crs_id: Number(initialAoData?.crs_id || qpData.crs_id || filters.crs_id),
                academic_batch_id: Number(initialAoData?.academic_batch_id || filters.curriculum_id),
                semester_id: Number(initialAoData?.semester_id || filters.term_id),
                org_id: 1,
                rubrics_data: JSON.stringify(rubState)
            };
            const res = await saveAo(payload);
            if (res.status) {
                setIsRubricsFinalized(true);
                toast.success("Rubrics finalized successfully!");
            } else {
                toast.error(res.message || "Failed to finalize rubrics: Server returned error status.");
            }
        } catch (e: any) {
            console.error("Finalize error:", e);
            toast.error(e.response?.data?.message || e.message || "Failed to finalize rubrics");
        } finally {
            setActionLoading(false);
        }
    };

    const summary = useMemo(() => {
        const base = courseDetails?.ao || initialAoData || {};
        return {
            ...base,
            crs_code: courseRecord?.crs_code || base.crs_code || '-',
            crs_title: courseRecord?.crs_title || base.crs_title || '-',
            academic_batch_code: curriculumName || base.academic_batch_code || '-',
            term_name: termName || base.term_name || '-',
            ao_name: base.ao_name || initialAoData?.main_occasion_type || '-'
        };
    }, [courseDetails, initialAoData, courseRecord, curriculumName, termName]);

    const handleExportPdf = () => {
        if (rubricCriteria.length === 0) {
            toast.warning("No criteria to export");
            return;
        }

        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // --- INSTITUTIONAL HEADER ---
        // Placeholder for Logo
        doc.setDrawColor(200);
        doc.rect(14, 10, 30, 30);
        doc.setFontSize(8);
        doc.text("YOUR LOGO HERE", 15, 25);

        // Institution Text
        doc.setFontSize(11);
        doc.setTextColor(30);
        doc.text("IonIdea Institute of Technology and Management", pageWidth - 14, 15, { align: 'right' });
        doc.setFontSize(10);
        doc.text("IonIdea Institute of Technology and Management, Bangalore", pageWidth - 14, 21, { align: 'right' });
        doc.setFontSize(9);
        doc.text("Testing QA Build", pageWidth - 14, 27, { align: 'right' });

        doc.setDrawColor(220);
        doc.line(14, 45, pageWidth - 14, 45);

        // --- TITLE ---
        doc.setFontSize(12);
        doc.setTextColor(180, 0, 0); // Red Title
        doc.text("CIA Rubrics Criteria List", 14, 55);

        // --- METADATA GRID ---
        doc.setTextColor(0);
        doc.setFontSize(9);
        
        // Column 1
        doc.setFont('helvetica', 'bold'); doc.text("Curriculum:", 14, 65);
        doc.setFont('helvetica', 'normal'); doc.text(summary.academic_batch_code, 45, 65);
        
        doc.setFont('helvetica', 'bold'); doc.text("Course:", 14, 75);
        doc.setFont('helvetica', 'normal'); doc.text(`${summary.crs_code} - ${summary.crs_title}`, 45, 75);

        doc.setFont('helvetica', 'bold'); doc.text("Assessment Occasion:", 14, 85);
        doc.setFont('helvetica', 'normal'); doc.text(summary.ao_name, 55, 85);

        // Column 2
        const col2X = pageWidth / 1.5;
        doc.setFont('helvetica', 'bold'); doc.text("Term:", col2X, 65);
        doc.setFont('helvetica', 'normal'); doc.text(summary.term_name, col2X + 25, 65);

        doc.setFont('helvetica', 'bold'); doc.text("Section:", col2X, 75);
        doc.setFont('helvetica', 'normal'); doc.text(filters.section_name || 'A', col2X + 25, 75);

        // Border around metadata if desired (Screenshot has boxes)
        doc.setDrawColor(230);
        doc.rect(14, 60, pageWidth - 28, 32); 
        doc.line(14, 70, pageWidth - 14, 70);
        doc.line(14, 80, pageWidth - 14, 80);
        doc.line(col2X - 5, 60, col2X - 5, 80);

        // --- RUBRICS TABLE ---
        const tableHeader = ['Sl No.', 'Criteria', 'CO Code'];
        // Dynamic scale columns
        for(let i=0; i<rubricColumnCount; i++) {
            tableHeader.push(`Assessment Scale`);
        }

        const tableBody = rubricCriteria.flatMap((rc, idx) => {
            // Content Row (Labels and Ranges)
            const mainRow = [
                idx + 1,
                rc.criteria,
                rc.coCode
            ];
            rc.scales.forEach((s: any) => {
                mainRow.push(`${s.range}\n${s.label}`);
            });

            // Description Row (Optional if matches screenshot)
            const descRow = [
                '', '', ''
            ];
            rc.scales.forEach((s: any) => {
                descRow.push(s.description || '-');
            });

            return [mainRow, descRow];
        });

        autoTable(doc, {
            startY: 100,
            head: [tableHeader],
            body: tableBody,
            theme: 'grid',
            headStyles: { 
                fillColor: [255, 255, 255], 
                textColor: [30, 41, 59], 
                lineColor: [220, 220, 220],
                lineWidth: 0.1,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: { fontSize: 8, cellPadding: 4, lineColor: [230, 230, 230] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                1: { cellWidth: 60 },
                2: { halign: 'center', cellWidth: 25 }
            },
            didParseCell: (data) => {
                if (data.row.index % 2 === 1 && data.section === 'body') {
                    data.cell.styles.fontStyle = 'italic';
                    data.cell.styles.textColor = [120, 120, 120];
                    data.cell.styles.fontSize = 7;
                }
            }
        });

        const pdfURL = doc.output('bloburl');
        window.open(pdfURL, '_blank', 'titlebar=yes');
    };

    if (loading) return (
        <div className="cia-container flex items-center justify-center min-h-[500px]">
            <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-[#4a8494] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Initialising Premium Editor...</div>
            </div>
        </div>
    );


    return (
        <div className="cia-container">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-[#4a8494]">
                        {isRubricsType ? 'Manage Rubrics Details' : 'Edit CCE Model Question Paper'}
                    </h3>
                    <p className="text-[small] text-gray-500 font-medium mt-1">
                        {isRubricsType 
                            ? 'Configure assessment criteria and scaling for the selected occasion' 
                            : 'Configure the selected assessment occasion question paper framework'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-2 bg-white border border-gray-300 rounded font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Back
                    </button>
                </div>
            </div>

            {/* Metadata Breadcrumb Bar - Aligned with Screenshot */}
            <div className="bg-[#f1f5f9] border border-slate-200 px-6 py-2.5 mb-6 flex items-center gap-6 text-[10px] uppercase font-bold text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap rounded">
                <div className="flex items-center gap-2">Curriculum: <span className="text-slate-900">{summary?.academic_batch_code}</span></div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-2">Term: <span className="text-slate-900">{summary?.term_name}</span></div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-2">Course: <span className="text-slate-900">{summary?.crs_code} - {summary?.crs_title}</span></div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-2">Assessment Occasion: <span className="text-[#4a8494]">{summary?.ao_name}</span></div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-2">Max Marks: <span className="text-slate-900">{summary?.qpd_max_marks}</span></div>
            </div>

            {!isRubricsType ? (
                <>
                    {/* Edit CCE Framework Accordion */}
                    <div className="border border-slate-200 rounded overflow-hidden mb-6 bg-white shadow-sm">
                        <div 
                            className="bg-slate-50 px-6 py-3 flex justify-between items-center cursor-pointer border-b border-slate-100"
                            onClick={() => setIsFrameworkEditOpen(!isFrameworkEditOpen)}
                        >
                            <div className="flex items-center gap-3 text-blue-600 font-bold text-sm uppercase tracking-tight">
                                {isFrameworkEditOpen ? <FaChevronDown /> : <FaChevronRight />}
                                Edit CCE Framework
                            </div>
                            <button className="px-5 py-1.5 bg-[#ef4444] hover:bg-red-600 text-white rounded text-xs font-medium transition-all flex items-center gap-2" onClick={(e) => { e.stopPropagation(); navigate(-1); }}>
                                <FaTimes /> Close
                            </button>
                        </div>
                        
                        {isFrameworkEditOpen && (
                            <div className="p-8 space-y-8 animate-slide-up-fade">
                                {/* Form Row 1 */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                    <div className="md:col-span-12">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Question Paper Title <span className="text-red-500 text-[12px]">*</span></label>
                                        <input className="cia-input" value={qpData.qpd_title} onChange={(e) => setQpData({...qpData, qpd_title: e.target.value})} placeholder="e.g. CIA 1" />
                                    </div>
                                </div>

                                {/* Form Row 2 - Refined Grid for Alignment */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block whitespace-nowrap line-clamp-1">Total Duration (H:M) <span className="text-red-500 text-[11px]">*</span></label>
                                        <input className="cia-input" value={qpData.qpd_timing} onChange={(e) => setQpData({...qpData, qpd_timing: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block whitespace-nowrap">Course <span className="text-red-500 text-[11px]">*</span></label>
                                        <input className="cia-input bg-slate-50 text-slate-500 font-bold" value={`${summary?.crs_code} - ${summary?.crs_title}`} readOnly />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block whitespace-nowrap">Maximum Marks <span className="text-red-500 text-[11px]">*</span></label>
                                        <input className="cia-input text-center font-bold text-[#4a8494]" value={qpData.qpd_max_marks} onChange={(e) => setQpData({...qpData, qpd_max_marks: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block whitespace-nowrap">Total Marks <span className="text-red-500 text-[11px]">*</span></label>
                                        <input className="cia-input text-center bg-slate-50" value={analysisData.totalMarksDefined.toFixed(2)} readOnly />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block whitespace-nowrap">Grand Total <span className="text-red-500 text-[11px]">*</span></label>
                                        <input className="cia-input text-center" value={qpData.qpd_gt_marks || '0.00'} readOnly />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Note</label>
                                    <textarea className="cia-input min-h-[60px]" value={qpData.cia_qp_note} onChange={(e) => setQpData({...qpData, cia_qp_note: e.target.value})} />
                                </div>

                                {/* Manage Section Table Row */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[11px] font-bold text-blue-600 uppercase italic underline underline-offset-4">Manage Sections/Units/Blocks Row</h4>
                                    </div>
                                    <div className="border border-slate-200 rounded overflow-hidden mb-6">
                                        <table className="w-full text-sm border-collapse">
                                            <thead className="bg-[#f1f5f9]">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] w-16">Sl.no</th>
                                                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px]">Section / Parts (Units) Name <span className="text-red-500 text-[11px]">*</span></th>
                                                    <th className="px-4 py-3 text-center font-bold text-slate-500 uppercase text-[10px] w-40 whitespace-nowrap">No. of Questions <span className="text-red-500 text-[11px]">*</span></th>
                                                    <th className="px-4 py-3 text-center font-bold text-slate-500 uppercase text-[10px] w-64 whitespace-nowrap text-right pr-8">Section / Parts (Units) Max Marks <span className="text-red-500 text-[11px]">*</span></th>
                                                    <th className="px-4 py-3 text-center font-bold text-slate-500 uppercase text-[10px] w-24">Delete</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {qpData.units.map((u: any, i: number) => (
                                                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                                                        <td className="px-4 py-2 font-bold text-slate-300 text-center">{i+1}</td>
                                                        <td className="px-4 py-2">
                                                            <input className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs uppercase font-bold" value={u.qp_unit_code} onChange={(e) => handleUnitChange(i, 'qp_unit_code', e.target.value)} />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <input className="w-24 px-2 py-1.5 border border-slate-200 rounded text-xs text-center" value={u.qp_total_unitquestion} onChange={(e) => handleUnitChange(i, 'qp_total_unitquestion', e.target.value)} />
                                                        </td>
                                                        <td className="px-4 py-2 text-right pr-8">
                                                            <input className="w-32 px-2 py-1.5 border border-slate-200 rounded text-xs text-center font-black text-[#4a8494]" value={u.qp_utotal_marks} onChange={(e) => handleUnitChange(i, 'qp_utotal_marks', e.target.value)} />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" onClick={() => removeUnit(i)}><FaTimes size={18} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium shadow transition-all flex items-center gap-2" onClick={handleSave}>
                                            <FaSave /> Update
                                        </button>
                                    </div>
                                </div>

                                {/* Add Unit Sub-Form */}
                                <div className="pt-6 border-t border-slate-100">
                                    <h4 className="text-[11px] font-bold text-blue-600 mb-4 italic">Add Unit</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block whitespace-nowrap">Section / Parts (Units) Name <span className="text-red-500 text-[11px]">*</span></label>
                                            <input className="cia-input !py-1.5" placeholder="Enter name" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block whitespace-nowrap">No. of Questions <span className="text-red-500 text-[11px]">*</span></label>
                                            <input className="cia-input !py-1.5" placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block whitespace-nowrap">Section / Parts (Units) Max Marks <span className="text-red-500 text-[11px]">*</span></label>
                                            <input className="cia-input !py-1.5" placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <button className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium shadow-sm" onClick={addUnit}>Save</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manage Questions Accordion */}
                    <div className="border border-slate-200 rounded overflow-hidden mb-6 bg-white shadow-sm">
                        <div 
                            className="bg-slate-50 px-6 py-3 flex justify-between items-center cursor-pointer border-b border-slate-100"
                            onClick={() => setIsQuestionsOpen(!isQuestionsOpen)}
                        >
                            <div className="flex items-center gap-3 text-blue-600 font-bold text-sm uppercase tracking-tight">
                                {isQuestionsOpen ? <FaChevronDown /> : <FaChevronRight />}
                                Manage Questions
                            </div>
                        </div>

                        {isQuestionsOpen && (
                            <div className="animate-slide-up-fade p-6 space-y-4">
                                <div 
                                    className="text-center text-[#0056b3] text-[11px] font-bold uppercase tracking-tight py-2 bg-blue-50/30 rounded border border-blue-100/50"
                                    dangerouslySetInnerHTML={{ __html: '<marquee direction="right" scrollamount="5">Questions can be mapped with OR feature.</marquee>' }}
                                />

                                <div className="flex justify-end gap-3 mb-6">
                                    <button className="px-5 py-2 bg-[#007bff] hover:bg-[#0069d9] text-white rounded text-[11px] font-bold flex items-center gap-2 shadow-sm transition-all" onClick={(e) => { e.stopPropagation(); setIsOrMappingModalOpen(true); }}>
                                        <FaPlus size={12} /> Map OR questions
                                    </button>
                                    <button className="px-5 py-2 bg-[#007bff] hover:bg-[#0069d9] text-white rounded text-[11px] font-bold flex items-center gap-2 shadow-sm transition-all" onClick={(e) => { e.stopPropagation(); setIsAddQuestionModalOpen(true); }}>
                                        <FaPlus size={12} /> Add Question
                                    </button>
                                </div>

                                <div className="flex justify-between items-center mb-5 text-[11px] text-slate-500">
                                    <div className="flex items-center gap-2">
                                        Show 
                                        <select className="border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none text-slate-700">
                                            <option>20</option>
                                        </select>
                                        entries
                                    </div>
                                    <div className="flex items-center gap-2">
                                        Search: 
                                        <input className="border border-slate-300 rounded px-2 py-1 focus:outline-none w-52" />
                                    </div>
                                </div>

                                <div className="cia-table-container !rounded-none !border-none !overflow-visible">
                                    <table className="w-full text-left border-collapse border border-slate-200">
                                        <thead className="bg-[#f4f7f9]">
                                            <tr>
                                                <th className="p-2 border border-slate-200 text-[11px] font-bold text-slate-700 w-20 text-center">Q.No.</th>
                                                <th className="p-2 border border-slate-200 text-[11px] font-bold text-slate-700 px-4">Question</th>
                                                <th className="p-2 border border-slate-200 text-[11px] font-bold text-slate-700">Course Outcomes(COs) Code</th>
                                                <th className="p-2 border border-slate-200 text-[11px] font-bold text-slate-700">Bloom's Level / Weightage % Distribution</th>
                                                <th className="p-2 border border-slate-200 text-[11px] font-bold text-slate-700">Performance Indicator(PI) Code</th>
                                                <th className="p-2 border border-slate-200 text-[11px] font-bold text-slate-700 w-28 text-center">Marks</th>
                                                <th className="p-2 border border-slate-200 text-[11px] font-bold text-slate-700 w-16 text-center">Edit</th>
                                                <th className="p-2 border border-slate-200 text-[11px] font-bold text-slate-700 w-16 text-center">Delete</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {qpData.units.map((unit: any, uIdx: number) => (
                                                <React.Fragment key={uIdx}>
                                                    <tr className="bg-[#fcfcfc]">
                                                        <td colSpan={8} className="p-2 border border-slate-200 text-[11px] font-bold text-slate-800 uppercase tracking-widest bg-slate-50/50 px-4">{unit.qp_unit_code || `UNIT-${uIdx + 1}`}</td>
                                                    </tr>
                                                    <tr className="bg-white">
                                                        <td colSpan={5} className="p-0 border border-slate-200"></td>
                                                        <td colSpan={1} className="p-2 border border-slate-200 text-[10px] font-bold text-slate-500 text-right whitespace-nowrap">
                                                            Section Marks : <span className="text-[#0056b3]">20.00 / 20.00</span>
                                                        </td>
                                                        <td colSpan={2} className="p-2 border border-slate-200 text-[10px] font-bold text-slate-500 text-right whitespace-nowrap">
                                                            Grand Total Marks : <span className="text-[#0056b3]">20.00 / 20.00</span>
                                                        </td>
                                                    </tr>
                                                    {unit.main_questions.map((q: any, qIdx: number) => (
                                                        <tr key={`${uIdx}-${qIdx}`} className="bg-white hover:bg-slate-50 transition-colors">
                                                            <td className="p-2 border border-slate-200 text-[11px] text-slate-600 text-center font-medium">{qIdx + 1}a</td>
                                                            <td className="p-2 border border-slate-200 text-[11px] text-slate-600 px-4" dangerouslySetInnerHTML={{ __html: q.qp_content }} />
                                                            <td className="p-2 border border-slate-200 text-[11px] text-slate-600">{dropdownData.course_outcomes.find((c: any) => String(c.id) === String(q.mappings?.[0]?.actual_mapped_id))?.name || 'CO2'}</td>
                                                            <td className="p-2 border border-slate-200 text-[11px] text-[#007bff] font-bold">{dropdownData.bloom_levels.find((b: any) => String(b.id) === String(q.mappings?.[1]?.actual_mapped_id))?.name || 'L1'}</td>
                                                            <td className="p-2 border border-slate-200 text-[11px] text-slate-600">{q.pi_code || ''}</td>
                                                            <td className="p-2 border border-slate-200 text-[11px] text-slate-900 font-bold">
                                                                <div className="flex justify-center items-center gap-3">
                                                                    <span>{parseFloat(q.qp_subq_marks).toFixed(2)}</span>
                                                                    <GoPencil size={12} className="text-yellow-600 cursor-pointer hover:scale-110 transition-transform" />
                                                                </div>
                                                            </td>
                                                            <td className="p-2 border border-slate-200 text-center">
                                                                <GoPencil className="inline text-yellow-600 cursor-pointer hover:scale-110 transition-transform" size={18} />
                                                            </td>
                                                            <td className="p-2 border border-slate-200 text-center">
                                                                <FaTimes className="inline text-red-600 cursor-pointer hover:scale-110 transition-transform" size={18} onClick={() => removeQuestion(uIdx, qIdx)} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-between items-center mt-6 text-[11px] text-slate-500 font-medium pb-2">
                                    <span>Showing 1 to {qpData.units.reduce((acc: number, u: any) => acc + u.main_questions.length, 0)} of {qpData.units.reduce((acc: number, u: any) => acc + u.main_questions.length, 0)} entries</span>
                                    <div className="flex items-center -space-x-px">
                                        <button className="px-4 py-2 bg-white text-slate-400 border border-slate-200 rounded-l hover:bg-slate-50 transition-all font-bold text-[10px] tracking-tight">← Previous</button>
                                        <button className="px-4 py-2 bg-[#f8fafc] text-slate-500 border border-slate-200 font-bold text-[10px]">1</button>
                                        <button className="px-4 py-2 bg-white text-slate-400 border border-slate-200 rounded-r hover:bg-slate-50 transition-all font-bold text-[10px] tracking-tight">Next →</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Question Paper Analysis Accordion */}
                    <div className="border border-slate-200 rounded overflow-hidden mb-12 bg-white shadow-sm">
                        <div 
                            className="bg-slate-50 px-6 py-3 flex justify-between items-center cursor-pointer border-b border-slate-100"
                            onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                        >
                            <div className="flex items-center gap-3 text-blue-600 font-bold text-sm uppercase tracking-tight">
                                {isAnalysisOpen ? <FaChevronDown /> : <FaChevronRight />}
                                Question Paper Analysis
                            </div>
                        </div>
                        
                        {isAnalysisOpen && (
                            <div className="p-10 space-y-12 animate-slide-up-fade">
                                {/* Bloom's Distribution Block */}
                                <div className="border border-slate-200 rounded overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bloom's Level Marks Distribution Based on Actual Weightage %</span>
                                        <FaChevronDown className="text-slate-400" size={10} />
                                    </div>
                                    <div className="p-8 flex items-center gap-12">
                                        <div className="w-1/2 h-[300px] border border-slate-100 rounded bg-slate-50/20 p-4 flex items-center justify-center relative">
                                            {analysisData.bloomChart.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart key={`bloom-${isAnalysisOpen}`}>
                                                        <Pie 
                                                            data={analysisData.bloomChart} 
                                                            cx="50%" 
                                                            cy="50%" 
                                                            innerRadius={60} 
                                                            outerRadius={100} 
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            animationBegin={0}
                                                            animationDuration={1000}
                                                        >
                                                            {analysisData.bloomChart.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend verticalAlign="bottom" height={36}/>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">
                                                    No Bloom's Level Data<br/>
                                                    <span className="text-[8px] font-medium lowercase italic text-slate-400">Map questions to view distribution</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-1/2">
                                            <table className="w-full text-xs text-center border-collapse">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="p-3 border text-slate-500 uppercase font-black">Bloom's Level</th>
                                                        <th className="p-3 border text-slate-500 uppercase font-black">Marks Distribution(Σ)</th>
                                                        <th className="p-3 border text-slate-500 uppercase font-black">% Distribution</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analysisData.bloomChart.map((b, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-3 border font-bold text-blue-600 uppercase">{b.name}</td>
                                                            <td className="p-3 border font-bold text-slate-500">{b.value.toFixed(2)}</td>
                                                            <td className="p-3 border font-black text-slate-700">{( (b.value / (analysisData.totalMarksDefined || 1)) * 100 ).toFixed(2)}%</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-slate-50 font-black">
                                                        <td className="p-3 border text-slate-400 uppercase">Total</td>
                                                        <td className="p-3 border text-slate-800">{analysisData.totalMarksDefined.toFixed(2)}</td>
                                                        <td className="p-3 border text-slate-800">100.00%</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Bloom's Analysis Explanatory Note */}
                                <div className="bg-[#f8fafc] border border-slate-200 rounded p-6 shadow-sm">
                                    <h5 className="text-[12px] font-bold text-slate-700 mb-2">Note:</h5>
                                    <div className="space-y-3 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                                        <p className="italic">The above pie chart depicts the individual Bloom's Level actual marks percentage distribution as in the question paper.</p>
                                        <div className="mt-4 font-bold text-slate-700 space-y-1.5">
                                            <p>X = Individual Bloom's Level marks</p>
                                            <p>Y = Sum of all Bloom's Level marks</p>
                                            <p>% Distribution = (X / Y) * 100</p>
                                        </div>
                                    </div>
                                </div>

                                {/* CO Distribution Block */}
                                <div className="border border-slate-200 rounded overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Course Outcome Marks Distribution</span>
                                        <FaChevronDown className="text-slate-400" size={10} />
                                    </div>
                                    <div className="p-8 flex items-center gap-12">
                                        <div className="w-1/2 h-[300px] border border-slate-100 rounded bg-slate-50/20 p-4 flex items-center justify-center relative">
                                            {analysisData.coChart.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart key={`co-${isAnalysisOpen}`}>
                                                        <Pie 
                                                            data={analysisData.coChart} 
                                                            cx="50%" 
                                                            cy="50%" 
                                                            innerRadius={60} 
                                                            outerRadius={100} 
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            animationBegin={0}
                                                            animationDuration={1000}
                                                        >
                                                            {analysisData.coChart.map((e: any, i: number) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend verticalAlign="bottom" height={36}/>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">
                                                    No CO Data Available<br/>
                                                    <span className="text-[8px] font-medium lowercase italic text-slate-400">Map questions to view distribution</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-1/2">
                                            <table className="w-full text-xs text-center border-collapse">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="p-3 border text-slate-500 uppercase font-black">Course Outcome</th>
                                                        <th className="p-3 border text-slate-500 uppercase font-black">Marks Distribution(Σ)</th>
                                                        <th className="p-3 border text-slate-500 uppercase font-black">% Distribution</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analysisData.coChart.map((b, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-3 border font-bold text-emerald-600 uppercase">{b.name}</td>
                                                            <td className="p-3 border font-bold text-slate-500">{b.value.toFixed(2)}</td>
                                                            <td className="p-3 border font-black text-slate-700">{( (b.value / (analysisData.totalMarksDefined || 1)) * 100 ).toFixed(2)}%</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-slate-50 font-black">
                                                        <td className="p-3 border text-slate-400 uppercase">Total</td>
                                                        <td className="p-3 border text-slate-800">{analysisData.totalMarksDefined.toFixed(2)}</td>
                                                        <td className="p-3 border text-slate-800">100.00%</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis Explanatory Note */}
                                <div className="bg-[#f8fafc] border border-slate-200 rounded p-6 shadow-sm">
                                    <h5 className="text-[12px] font-bold text-slate-700 mb-2">Note:</h5>
                                    <div className="space-y-3 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                                        <p className="italic">The above pie chart depicts the individual Course Outcome(COs) wise actual marks percentage distribution as in the question paper.</p>
                                        <div className="mt-4 font-bold text-slate-700 space-y-1.5">
                                            <p>X = Individual Course Outcome marks</p>
                                            <p>Y = Sum of all Course Outcomes marks</p>
                                            <p>% Distribution = (X / Y) * 100</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Rubrics List - High Fidelity Standardized Layout */}
                    <div className="cia-card !border !border-slate-200 shadow-xl !bg-white">
                        <div className="cia-section-bar">
                            <div className="flex items-center gap-3">
                                <span className="cia-section-title">Rubrics List</span>
                            </div>
                            <FaQuestionCircle className="text-[#4a8494] cursor-help" size={16} />
                        </div>

                        {/* Breadcrumb Information Bar */}
                        <div className="cia-info-bar !gap-y-4">
                            <div className="cia-info-item">
                                <span className="cia-info-label">Curriculum :</span>
                                <span className="cia-info-value">{summary?.academic_batch_code}</span>
                            </div>
                            <div className="cia-info-item">
                                <span className="cia-info-label">Term :</span>
                                <span className="cia-info-value">{summary?.term_name}</span>
                            </div>
                            <div className="cia-info-item">
                                <span className="cia-info-label">Course :</span>
                                <span className="cia-info-value">{summary?.crs_code}</span>
                            </div>
                            {rubricCriteria.length > 0 && (
                                <div className="flex-grow flex justify-end">
                                <button className="bg-[#5cb85c] text-white px-4 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 hover:bg-[#4cae4c] transition-all shadow-sm shadow-emerald-200" onClick={handleExportPdf}>
                                    <FaFilePdf /> Export .pdf
                                </button>
                                </div>
                            )}
                        </div>
                        <div className="cia-info-bar !pt-0 !pb-4 border-none">
                            <div className="cia-info-item">
                                <span className="cia-info-label">Section :</span>
                                <span className="cia-info-value font-black">{filters.section_name || 'A'}</span>
                            </div>
                            <div className="cia-info-item">
                                <span className="cia-info-label">Assessment Occasion :</span>
                                <span className="cia-info-value font-black">{summary?.ao_name}</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto px-6 pb-6">
                            <table className="w-full border-collapse border border-slate-200 text-[11px]">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="p-3 border text-center font-bold text-slate-500 w-16">SI No.</th>
                                        <th className="p-3 border text-left font-bold text-slate-500 w-1/4">Criteria</th>
                                        <th className="p-3 border text-center font-bold text-slate-500 w-24">CO Code</th>
                                        <th colSpan={rubricColumnCount} className="p-3 border text-center font-black text-slate-500 uppercase tracking-widest bg-slate-100/30">Scale of Assessment</th>
                                        <th className="p-3 border text-center font-bold text-slate-500 w-20">Edit</th>
                                        <th className="p-3 border text-center font-bold text-slate-500 w-20">Delete</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rubricCriteria.length > 0 ? rubricCriteria.map((rc, i) => (
                                        <React.Fragment key={i}>
                                            <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                                                <td rowSpan={2} className="p-3 border text-center font-bold text-slate-300">{i+1}</td>
                                                <td rowSpan={2} className="p-4 border align-top">
                                                    <div className="text-slate-700 font-bold leading-relaxed">{rc.criteria}</div>
                                                </td>
                                                <td rowSpan={2} className="p-3 border text-center font-bold text-slate-500">{rc.coCode}</td>
                                                {rc.scales.map((s: any, j: number) => (
                                                    <td key={j} className="p-3 border text-center bg-slate-50/30">
                                                        <div className="font-bold text-blue-800 text-[10px] mb-1">{s.range}</div>
                                                        <div className="font-black text-slate-400">{s.label}</div>
                                                    </td>
                                                ))}
                                                <td rowSpan={2} className="p-3 border text-center">
                                                    <GoPencil className="inline text-yellow-600 cursor-pointer hover:scale-110 transition-transform" size={18} onClick={() => {setRubricForm(rc); setEditingRubricIndex(i); setIsMatrixVisible(true);}} />
                                                </td>
                                                <td rowSpan={2} className="p-3 border text-center">
                                                    <FaTimes className="inline text-red-600 cursor-pointer hover:scale-110 transition-transform" size={18} onClick={() => setRubricCriteria(rubricCriteria.filter((_, idx) => idx !== i))} />
                                                </td>
                                            </tr>
                                            <tr>
                                                {rc.scales.map((s: any, j: number) => (
                                                    <td key={j} className="p-3 border text-slate-400 font-medium italic text-[10px] bg-white">
                                                        {s.description || '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        </React.Fragment>
                                    )) : (
                                        <tr><td colSpan={5+rubricColumnCount} className="p-4 text-left text-slate-400 font-medium">No data</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {rubricCriteria.length > 0 && (
                            <div className="px-8 py-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                                <button className="bg-[#0275d8] text-white px-6 py-2 rounded text-[11px] font-bold shadow-sm hover:translate-y-[-1px] transition-all" onClick={generateRubricsTable}>
                                    Re-Generate Rubrics
                                </button>
                                <button className="bg-[#5cb85c] text-white px-6 py-2 rounded text-[11px] font-bold shadow-sm hover:translate-y-[-1px] transition-all" onClick={handleFinalizeRubrics}>
                                    Finalize Rubrics
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Add/Edit Criteria - Standardized High-Fidelity Layout */}
                    <div className="cia-card !border !border-slate-200 shadow-xl !bg-white mt-12 !mb-32">
                        <div className="cia-section-bar">
                            <div className="flex items-center gap-3">
                                <span className="cia-section-title">Add/Edit Criteria</span>
                            </div>
                            <FaQuestionCircle className="text-[#4a8494] cursor-help" size={16} />
                        </div>

                        <div className="p-10 space-y-10 bg-white">
                            {rubricCriteria.length > 0 && (
                                <div className="flex justify-end items-center gap-6">
                                    <label className="text-[11px] font-bold text-slate-400">Import Previous Criteria Details :</label>
                                    <select 
                                        className="w-80 border border-slate-200 rounded px-3 py-1.5 text-[11px] font-bold text-slate-600 outline-none focus:border-blue-400 bg-white"
                                        onChange={(e) => {
                                            const selected = rubricCriteria.find(rc => rc.criteria === e.target.value);
                                            if (selected) {
                                                setRubricForm({ ...selected });
                                                setIsMatrixVisible(true);
                                            }
                                        }}
                                    >
                                        <option value="">Select Criteria</option>
                                        {rubricCriteria.map((rc, i) => <option key={i} value={rc.criteria}>{rc.criteria}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end items-center gap-4">
                                <label className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Enter No. of Columns (Scale of Assessment) for Rubrics <span className="text-red-500 font-extrabold">*</span> :</label>
                                <input 
                                    type="number" 
                                    className="w-20 border border-slate-200 rounded px-3 py-2 text-center font-bold text-[11px] focus:ring-1 focus:ring-blue-500/20 outline-none" 
                                    value={rubricColumnCount} 
                                    onChange={(e) => setRubricColumnCount(Number(e.target.value))} 
                                />
                                <button className="bg-[#0275d8] text-white px-6 py-2 rounded text-[11px] font-bold shadow-sm shadow-blue-100 uppercase tracking-tighter" onClick={generateRubricsTable}>
                                    Generate Rubrics
                                </button>
                            </div>

                            <div className="flex gap-16 py-4 px-4 bg-slate-50/20 rounded-xl">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="radio" name="rubricMode" className="w-5 h-5 accent-[#4a8494]" checked={rubricMode === 'custom'} onChange={() => setRubricMode('custom')} />
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight group-hover:text-slate-800 transition-colors">Custom Criteria</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="radio" name="rubricMode" className="w-5 h-5 accent-[#b4b4b4]" checked={rubricMode === 'co'} 
                                        onChange={() => {
                                            setRubricMode('co');
                                            // Synchronize criteria with selected CO descriptions immediately
                                            if (rubricForm.coCode) {
                                                const coNames = rubricForm.coCode.split(',').map((c: string) => c.trim());
                                                const coStatements = coNames.map((name: string) => {
                                                    const coObj = dropdownData.course_outcomes.find((co: any) => co.name === name);
                                                    return coObj?.description || coObj?.statement || name;
                                                }).join(' ');
                                                setRubricForm({ ...rubricForm, criteria: coStatements });
                                            }
                                        }} 
                                    />
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight group-hover:text-slate-800 transition-colors">CO as Criteria</span>
                                </label>
                            </div>

                            {/* Performance Matrix Surface */}
                            {isMatrixVisible && (
                                <div className="border border-slate-200 rounded shadow-sm overflow-hidden animate-fade-in">
                                    <table className="w-full">
                                        <thead className="bg-[#f8fafc]">
                                            <tr className="border-b border-slate-200">
                                                <th rowSpan={2} className="w-1/4 p-6 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Criteria <span className="required">*</span> :</th>
                                                <th colSpan={rubricColumnCount} className="p-2 text-center text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200">Scale of Assessment</th>
                                            </tr>
                                            <tr className="bg-slate-50">
                                                {Array.from({ length: rubricColumnCount }).map((_, idx) => (
                                                    <th key={idx} className="p-2 border-r border-slate-100">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className="text-[9px] font-bold text-slate-400">Scale <span className="required">*</span> :</span>
                                                            <input type="text" className="w-full border border-slate-200 rounded px-2 py-1.5 text-[10px] font-bold text-center text-slate-600 bg-white" placeholder="Ex:Good" value={rubricForm.scales?.[idx]?.label || ''} onChange={(e) => {const sc = [...rubricForm.scales]; sc[idx].label = e.target.value; setRubricForm({...rubricForm, scales: sc});}} />
                                                            <span className="text-[9px] font-bold text-slate-400">Range <span className="required">*</span> :</span>
                                                            <input type="text" className="w-full border border-slate-200 rounded px-2 py-1.5 text-[10px] font-bold text-center text-slate-600 bg-white" placeholder="0-2" value={rubricForm.scales?.[idx]?.range || ''} onChange={(e) => {const sc = [...rubricForm.scales]; sc[idx].range = e.target.value; setRubricForm({...rubricForm, scales: sc});}} />
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            <tr className="border-b border-slate-100">
                                                <td className="p-4 border-r border-slate-100 align-top">
                                                    <textarea 
                                                        className={`w-full min-h-[120px] border border-slate-200 rounded p-4 text-[11px] font-medium text-slate-700 outline-none focus:border-[#4a8494] transition-all ${rubricMode === 'co' ? 'bg-slate-100 opacity-60 grayscale cursor-not-allowed' : 'bg-white shadow-inner'}`}
                                                        disabled={rubricMode === 'co'}
                                                        placeholder={rubricMode === 'co' ? "Criteria will be automatically set to selected CO(s)..." : "Enter evaluation criteria details..."}
                                                        value={rubricForm.criteria}
                                                        onChange={(e) => setRubricForm({...rubricForm, criteria: e.target.value})}
                                                    />
                                                </td>
                                                {Array.from({ length: rubricColumnCount }).map((_, idx) => (
                                                    <td key={idx} className="p-4 align-top border-r border-slate-50">
                                                        <textarea className="w-full min-h-[120px] border border-slate-200 rounded p-4 text-[11px] font-medium text-slate-500 outline-none focus:border-blue-400 bg-slate-50/20 shadow-inner italic" placeholder="Enter performance description..." value={rubricForm.scales?.[idx]?.description || ''} onChange={(e) => {const sc = [...rubricForm.scales]; sc[idx].description = e.target.value; setRubricForm({...rubricForm, scales: sc});}} />
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr className="bg-slate-50/20">
                                                <td className="p-4 border-r border-slate-100 flex items-center justify-end"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CO <span className="required">*</span> :</span></td>
                                                <td colSpan={rubricColumnCount} className="p-4 bg-white">
                                                    <div className="w-96">
                                                        <Select
                                                            isMulti
                                                            options={dropdownData.course_outcomes?.map((co: any) => ({ value: co.name, label: co.name })) || []}
                                                            className="text-[11px] font-bold"
                                                            placeholder="Select COs..."
                                                            value={rubricForm.coCode ? rubricForm.coCode.split(',').map((c: string) => ({ value: c.trim(), label: c.trim() })) : []}
                                                            onChange={(selected: any) => {
                                                                const coList = selected ? selected.map((s: any) => s.value).join(',') : '';
                                                                let criteriaText = rubricForm.criteria;
                                                                
                                                                if (rubricMode === 'co') {
                                                                    const selectedCos = selected || [];
                                                                    criteriaText = selectedCos.map((sc: any) => {
                                                                        const coObj = dropdownData.course_outcomes.find((co: any) => co.name === sc.value);
                                                                        return coObj?.description || coObj?.statement || sc.value;
                                                                    }).join(' ');
                                                                }

                                                                setRubricForm({ 
                                                                    ...rubricForm, 
                                                                    coCode: coList,
                                                                    criteria: criteriaText
                                                                });
                                                            }}
                                                            styles={{
                                                                control: (base) => ({
                                                                    ...base,
                                                                    borderColor: '#e2e8f0',
                                                                    minHeight: '38px',
                                                                    '&:hover': { borderColor: '#4a8494' }
                                                                }),
                                                                multiValue: (base) => ({
                                                                    ...base,
                                                                    backgroundColor: '#f0f9ff',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #e0f2fe'
                                                                }),
                                                                multiValueLabel: (base) => ({
                                                                    ...base,
                                                                    color: '#0369a1',
                                                                    fontWeight: '700',
                                                                    fontSize: '10px'
                                                                }),
                                                                multiValueRemove: (base) => ({
                                                                    ...base,
                                                                    color: '#0369a1',
                                                                    '&:hover': { backgroundColor: '#0369a1', color: 'white' }
                                                                })
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <div className="flex justify-end gap-3 p-4 bg-slate-50/50">
                                        <button className="bg-[#0275d8] text-white px-6 py-2 rounded text-[11px] font-bold shadow-sm flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all" onClick={handleAddCriteria}>
                                            <FaFileUpload size={12}/> Save
                                        </button>
                                        <button className="bg-[#d9534f] text-white px-6 py-2 rounded text-[11px] font-bold shadow-sm flex items-center gap-2 hover:bg-[#c9302c] active:scale-95 transition-all" onClick={() => setIsMatrixVisible(false)}>
                                            <FaTimes size={12}/> Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <button className="bg-[#d9534f] text-white px-8 py-2 rounded text-[11px] font-bold flex items-center gap-2 hover:bg-[#c9302c] transition-all shadow-md active:scale-95" onClick={() => navigate(-1)}>
                                    <FaTimes /> Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {isOrMappingModalOpen && (
                <CiaOrMappingModal 
                    onClose={() => setIsOrMappingModalOpen(false)} 
                    onSave={(mappings: any) => {
                        setQpData((prev: any) => ({ ...prev, or_mappings: mappings }));
                        setIsOrMappingModalOpen(false);
                    }}
                    questions={qpData.units.flatMap((u:any) => u.main_questions || [])}
                    initialMappings={qpData.or_mappings || []}
                />
            )}

            {isRubricImportModalOpen && (
                <CiaRubricImportModal 
                    targetAo={summary} 
                    onClose={() => setIsRubricImportModalOpen(false)} 
                    onImportSuccess={fetchInitialData} 
                />
            )}

            {isQpImportModalOpen && (
                <CiaQpImportModal 
                    targetAo={summary} 
                    onClose={() => setIsQpImportModalOpen(false)} 
                    onImportSuccess={fetchInitialData} 
                />
            )}

            <CiaAddQuestionModal 
                isOpen={isAddQuestionModalOpen} 
                onClose={() => setIsAddQuestionModalOpen(false)}
                onSave={(data) => {
                    console.log("Add Question Data:", data);
                    setIsAddQuestionModalOpen(false);
                }}
                units={qpData.units}
                dropdownData={dropdownData}
                maxMarks={qpData.qpd_max_marks}
                grandTotalMarks={analysisData.totalMarksDefined}
            />
            {isConfirmModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[0.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border border-slate-200">
                        <div className="bg-white px-8 py-5 flex justify-between items-center border-b border-slate-100">
                            <h3 className="text-xl font-bold text-[#4a8494] uppercase tracking-tight">Warning</h3>
                            <FaQuestionCircle size={18} className="text-blue-400/60" />
                        </div>
                        
                        <div className="p-10 space-y-6 bg-white">
                            <p className="text-sm font-bold text-slate-700">Are you sure you want to Redefine the Rubrics definition ?</p>
                            <p className="text-sm text-slate-500 leading-relaxed">All the Criteria and Scale of Assessment defined earlier will be deleted and you need to define all a fresh.</p>
                            <p className="text-sm font-bold text-slate-400 italic">Press Ok to continue.</p>
                        </div>
                        
                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button 
                                onClick={confirmedGenerate} 
                                className="px-10 py-2 bg-[#0275d8] hover:bg-blue-600 text-white text-[12px] font-bold rounded shadow-sm active:scale-95 transition-all flex items-center gap-2"
                            >
                                <FaCheckCircle size={14} /> Ok
                            </button>
                            <button 
                                onClick={() => setIsConfirmModalOpen(false)} 
                                className="px-6 py-2 bg-[#d9534f] hover:bg-red-600 text-white text-[12px] font-bold rounded shadow-sm active:scale-95 transition-all flex items-center gap-2"
                            >
                                <FaTimes size={14} /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isFinalizeConfirmOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[0.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border border-slate-200">
                        <div className="bg-white px-8 py-5 flex justify-between items-center border-b border-slate-100">
                            <h3 className="text-xl font-bold text-[#4a8494] uppercase tracking-tight">Warning</h3>
                            <FaQuestionCircle size={18} className="text-blue-400/60" />
                        </div>
                        
                        <div className="p-10 space-y-6 bg-white border-b border-slate-100">
                            <p className="text-[13px] text-slate-700 font-medium">Are you sure you want to finalize the defined rubrics?</p>
                            <p className="text-[13px] text-slate-500 font-medium">Finalized rubrics will be available under CIA assessment import.</p>
                        </div>
                        
                        <div className="px-8 py-5 bg-slate-50 flex justify-end gap-3">
                            <button 
                                onClick={confirmedFinalize} 
                                className="px-10 py-2 bg-[#0275d8] hover:bg-blue-600 text-white text-[12px] font-bold rounded shadow-sm active:scale-95 transition-all flex items-center gap-2"
                            >
                                <FaCheckCircle size={14} /> Ok
                            </button>
                            <button 
                                onClick={() => setIsFinalizeConfirmOpen(false)} 
                                className="px-6 py-2 bg-[#d9534f] hover:bg-red-600 text-white text-[12px] font-bold rounded shadow-sm active:scale-95 transition-all flex items-center gap-2"
                            >
                                <FaTimes size={14} /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CiaQpEditor;
