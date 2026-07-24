import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/api';
import {
    getCurricula,
    getTerms,
    getCourses,
    getOccasions,
    getCourseLevels,
    calculateCOAttainment,
    finalizeMTE,
    getFinalizedData,
    Curriculum,
    Term,
    Course,
    MteOccasion,
    CalculateResponse,
    FinalizedRow,
} from './MteCoApi';
import MteSelectors from './MteSelectors';
import MteAttainmentLevelTable from './MteAttainmentLevelTable';
import MteCalculatedTable from './MteCalculatedTable';
import MteFinalizedTable from './MteFinalizedTable';
import MteChart from './MteChart';
import MteMappedQuestionsModal from './MteMappedQuestionsModal';
import MteDrilldownModal from './MteDrilldownModal';
import MteExportButton from './MteExportButton';
import DataTable from '../../../../components/Table/DataTable';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import { Database, HelpCircle, Check } from 'lucide-react';
import MteLogHistoryModal from './MteLogHistoryModal';
import MteWebHelpModal from './MteWebHelpModal';
import MultiSelect from '../../../../components/FormBuilder/fields/MultiSelect';

// Note section displaying calculation formulas
const FormulaNoteSection: React.FC = () => {
    return (
        <div className="mt-8 p-4 border border-gray-200 bg-[#f8f8f6] rounded-lg text-sm text-left">
            <div className="font-semibold text-gray-700 mb-2">
                <span className="font-bold text-gray-800">Note: </span>
                The above bar graph depicts the overall class performance with respect to the Threshold % for Individual Course Outcomes (COs). The Threshold based Attainment % and Average based Attainment % is calculated using the below formula.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 pt-3 border-t border-gray-200">
                <div>
                    <div className="font-bold text-gray-800 mb-1">
                        For Threshold based Attainment % = ( x / y ) * 100
                    </div>
                    <div className="text-gray-600 text-xs mt-1 space-y-0.5">
                        <div>x = Count of Students &gt;= to Threshold %</div>
                        <div>y = Total number of Students Attempted .</div>
                    </div>
                </div>
                <div>
                    <div className="font-bold text-gray-800 mb-1">
                        For Average based Attainment % = ( x / y ) * 100
                    </div>
                    <div className="text-gray-600 text-xs mt-1 space-y-0.5">
                        <div>x = Average Secured marks of Attempted Students</div>
                        <div>y = Maximum Marks .</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Fetch real basic CO list from assessments module
const getBasicCOList = async (
    courseId: number,
    academicBatchId?: number | null,
    semesterId?: number | null
): Promise<{ clo_id: number; clo_code: string; clo_statement: string }[]> => {
    const params: any = { course_id: courseId };
    if (academicBatchId) params.academic_batch_id = academicBatchId;
    if (semesterId) params.semester_id = semesterId;
    const res = await axiosInstance.get('/assessments/manage_cia_occasion/co', {
        params
    });
    const data = (res.data as any)?.data || res.data || [];
    return data.map((item: any) => ({
        clo_id: item.clo_id,
        clo_code: item.clo_code,
        clo_statement: item.clo_statement ?? '',
    }));
};

// Simple placeholder CO table (no attainment data)
const BasicCOListTable: React.FC<{ rows: any[] }> = ({ rows }) => {
    if (!rows.length) return <div className="text-gray-500 text-left">No COs found for this course.</div>;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CO Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CO Statement</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {rows.map((row) => (
                        <tr key={row.clo_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-800 text-left">{row.clo_code}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-left">{row.clo_statement}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-500 italic text-left">Select MTE occasions to view attainment values and graph.</div>
        </div>
    );
};


// Validation Failures View inside the main card body
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
    return (
        <div className="p-6 text-center bg-white rounded-lg min-h-[300px] flex flex-col justify-center items-center">
            <p className="text-red-600 font-semibold text-base mb-6 max-w-2xl">
                You cannot Finalize the Course - MTE-Course Outcomes(COs) Attainment . Kindly complete the below activities :
            </p>
            <div className="space-y-6 w-full max-w-2xl text-center">
                {/* A. Missing Student Marks */}
                {failures.missing_marks.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-red-500 font-medium text-sm">
                            &gt;&gt; Assessment data (student marks) are not uploaded/imported for the {failures.missing_marks.length === 1 ? 'Occasion' : 'Occasions'} : <span className="font-bold">{failures.missing_marks.join(' , ')}</span>
                        </p>
                        <div className="flex flex-col items-center space-y-1 text-sm">
                            <button
                                onClick={() => onNavigate('/attainment/mte_data_import')}
                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                            >
                                Click here to upload course MTE data
                            </button>
                            <span className="text-gray-400 text-xs font-medium">OR</span>
                            <button
                                onClick={() => onNavigate('/assessment/manage_mte_qp')}
                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                            >
                                Click here to Create QP course MTE data
                            </button>
                        </div>
                    </div>
                )}

                {/* B. Missing Question Paper */}
                {failures.missing_qp.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-red-500 font-medium text-sm">
                            &gt;&gt; Question paper is not created for the {failures.missing_qp.length === 1 ? 'Occasion' : 'Occasions'} : <span className="font-bold">{failures.missing_qp.join(' , ')}</span>
                        </p>
                        <div className="flex flex-col items-center text-sm">
                            <button
                                onClick={() => onNavigate('/assessment/manage_mte_qp')}
                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                            >
                                Click here to Create QP course MTE data
                            </button>
                        </div>
                    </div>
                )}

                {/* C. QP exists but not rolled out */}
                {failures.not_rolled_out.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-red-500 font-medium text-sm">
                            &gt;&gt; Question paper is not rolled out for the {failures.not_rolled_out.length === 1 ? 'Occasion' : 'Occasions'} : <span className="font-bold">{failures.not_rolled_out.join(' , ')}</span>
                        </p>
                        <div className="flex flex-col items-center text-sm">
                            <button
                                onClick={() => onNavigate('/assessment/manage_mte_qp')}
                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                            >
                                Click here to Create QP course MTE data
                            </button>
                        </div>
                    </div>
                )}

                {/* D. Missing CO Mapping */}
                {failures.missing_mapping.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-red-500 font-medium text-sm">
                            &gt;&gt; CO mapped questions are missing for the {failures.missing_mapping.length === 1 ? 'Occasion' : 'Occasions'} : <span className="font-bold">{failures.missing_mapping.join(' , ')}</span>
                        </p>
                        <div className="flex flex-col items-center text-sm">
                            <button
                                onClick={() => onNavigate('/assessment/manage_mte_qp')}
                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                            >
                                Click here to Create QP course MTE data
                            </button>
                        </div>
                    </div>
                )}

                {/* E. Missing attainment rows (precomputed mode) */}
                {failures.missing_attainment.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-red-500 font-medium text-sm">
                            &gt;&gt; CO attainment data is not generated for the {failures.missing_attainment.length === 1 ? 'Occasion' : 'Occasions'} : <span className="font-bold">{failures.missing_attainment.join(' , ')}</span>
                        </p>
                        <div className="flex flex-col items-center text-sm">
                            <button
                                onClick={() => onNavigate('/attainment/cce_data_import')}
                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                            >
                                Generate CO attainment first
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MteCoAttainmentPage: React.FC = () => {
    const navigate = useNavigate();
    // Selector state
    const [curricula, setCurricula] = useState<Curriculum[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [occasions, setOccasions] = useState<MteOccasion[]>([]);
    const [selectedCurriculum, setSelectedCurriculum] = useState<number | null>(null);
    const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [selectedOccasions, setSelectedOccasions] = useState<number[]>([]);

    // Data state
    const [courseLevels, setCourseLevels] = useState<any[]>([]);
    const [calculatedData, setCalculatedData] = useState<CalculateResponse | null>(null);
    const [finalizedData, setFinalizedData] = useState<FinalizedRow[]>([]);
    const [basicCOList, setBasicCOList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [readinessErrors, setReadinessErrors] = useState<Array<{ occasion_id: number; error_message: string; action_message: string }>>([]);

    // Modal states
    const [mappedModal, setMappedModal] = useState<{ open: boolean; cloId: number | null; cloCode: string }>({
        open: false,
        cloId: null,
        cloCode: '',
    });
    const [drilldownModal, setDrilldownModal] = useState<{
        open: boolean;
        cloId: number | null;
        cloCode: string;
        cloStatement: string;
    }>({ open: false, cloId: null, cloCode: '', cloStatement: '' });
    const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
    const [validationFailures, setValidationFailures] = useState<ValidationFailures | null>(null);
    const [isLogHistoryOpen, setIsLogHistoryOpen] = useState(false);
    const [isWebHelpOpen, setIsWebHelpOpen] = useState(false);

    const selectedCourseWeightage = courses.find(c => c.crs_id === selectedCourse)?.total_mte_weightage || 0;

    // Load curricula on mount
    useEffect(() => {
        setError('');
        getCurricula()
            .then(setCurricula)
            .catch((err) => setError(err.message));
    }, []);

    // Load terms when curriculum changes
    useEffect(() => {
        setError('');
        if (!selectedCurriculum) {
            setTerms([]);
            setSelectedTerm(null);
            return;
        }
        getTerms(selectedCurriculum)
            .then(setTerms)
            .catch((err) => setError(err.message));
        setSelectedTerm(null);
        setSelectedCourse(null);
        setSelectedOccasions([]);
        setCalculatedData(null);
        setFinalizedData([]);
        setCourseLevels([]);
        setBasicCOList([]);
        setReadinessErrors([]);
    }, [selectedCurriculum]);

    // Load courses when term changes
    useEffect(() => {
        setError('');
        if (!selectedTerm) {
            setCourses([]);
            setSelectedCourse(null);
            return;
        }
        getCourses(selectedTerm)
            .then(setCourses)
            .catch((err) => setError(err.message));
        setSelectedCourse(null);
        setSelectedOccasions([]);
        setCalculatedData(null);
        setFinalizedData([]);
        setCourseLevels([]);
        setBasicCOList([]);
        setReadinessErrors([]);
    }, [selectedTerm]);

    // Load basic CO list and attainment levels when course changes
    useEffect(() => {
        setError('');
        if (!selectedCourse) {
            setBasicCOList([]);
            setCourseLevels([]);
            return;
        }
        getBasicCOList(selectedCourse, selectedCurriculum, selectedTerm)
            .then(setBasicCOList)
            .catch((err) => setError(err.message));
        getCourseLevels(selectedCourse)
            .then(setCourseLevels)
            .catch((err) => setError(err.message));
        setSelectedOccasions([]);
        setCalculatedData(null);
        setFinalizedData([]);
        setReadinessErrors([]);
    }, [selectedCourse, selectedCurriculum, selectedTerm]);

    // Load occasions and finalized data when Course changes (implicitly course-wise MTE)
    useEffect(() => {
        setError('');
        if (!selectedCourse || !selectedCurriculum || !selectedTerm) {
            setOccasions([]);
            setSelectedOccasions([]);
            setCalculatedData(null);
            setFinalizedData([]);
            setReadinessErrors([]);
            return;
        }
        setLoading(true);
        Promise.all([
            getOccasions(selectedCurriculum, selectedTerm, selectedCourse, 0),
            getFinalizedData(selectedCurriculum, selectedTerm, selectedCourse, 0),
        ])
            .then(([occ, finalized]) => {
                setOccasions(occ);
                setFinalizedData(finalized);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
        setSelectedOccasions([]);
        setCalculatedData(null);
        setReadinessErrors([]);
    }, [selectedCourse, selectedCurriculum, selectedTerm]);

    // Calculate when occasions selection changes
    const handleOccasionsChange = useCallback(
        async (occasionIds: number[]) => {
            setError('');
            setSelectedOccasions(occasionIds);
            if (occasionIds.length === 0) {
                setCalculatedData(null);
                setReadinessErrors([]);
                return;
            }
            if (!selectedCurriculum || !selectedTerm || !selectedCourse) return;
            setLoading(true);
            try {
                const result = await calculateCOAttainment({
                    curriculum_id: selectedCurriculum,
                    term_id: selectedTerm,
                    course_id: selectedCourse,
                    section_id: 0,
                    selected_occasion_ids: occasionIds,
                });
                setCalculatedData(result);
                const errors = result.readiness_status.filter(status => !status.is_ready).map(status => ({
                    occasion_id: status.occasion_id,
                    error_message: status.error_message || 'Validation failed',
                    action_message: status.action_message || 'Upload course MTE data',
                }));
                setReadinessErrors(errors);
            } catch (err: any) {
                setError(err.message);
                setCalculatedData(null);
                setReadinessErrors([]);
            } finally {
                setLoading(false);
            }
        },
        [selectedCurriculum, selectedTerm, selectedCourse]
    );

    const handleFinalize = async () => {
        if (!selectedCurriculum || !selectedTerm || !selectedCourse || selectedOccasions.length === 0) return;
        setError('');
        setLoading(true);
        try {
            const result = await calculateCOAttainment({
                curriculum_id: selectedCurriculum,
                term_id: selectedTerm,
                course_id: selectedCourse,
                section_id: 0,
                selected_occasion_ids: selectedOccasions,
            });
            setCalculatedData(result);
            
            const errors = result.readiness_status.filter(status => !status.is_ready).map(status => ({
                occasion_id: status.occasion_id,
                error_message: status.error_message || 'Validation failed',
                action_message: status.action_message || 'Upload course MTE data',
            }));
            setReadinessErrors(errors);

            const hasErrors = errors.length > 0;
            if (!result.can_finalize || hasErrors) {
                setValidationFailures(result.validation_failures || null);
                setIsWarningDialogOpen(true);
            } else {
                setIsFinalizeDialogOpen(true);
            }
        } catch (err: any) {
            setError(err.message || 'Validation failed');
        } finally {
            setLoading(false);
        }
    };

    const confirmFinalize = async () => {
        if (!selectedCurriculum || !selectedTerm || !selectedCourse || selectedOccasions.length === 0) return;
        setIsFinalizeDialogOpen(false);
        setError('');
        setLoading(true);
        try {
            await finalizeMTE({
                curriculum_id: selectedCurriculum,
                term_id: selectedTerm,
                course_id: selectedCourse,
                section_id: 0,
                selected_occasion_ids: selectedOccasions,
            });
            setIsSuccessDialogOpen(true);
            const finalized = await getFinalizedData(selectedCurriculum, selectedTerm, selectedCourse, 0);
            setFinalizedData(finalized);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const allOccasionsSelected = occasions.length > 0 && selectedOccasions.length === occasions.length;
    const hasValidationErrors = readinessErrors.length > 0;
    const showFinalizeButton = allOccasionsSelected && !hasValidationErrors;
    const occasionsSelected = selectedOccasions.length > 0;
    const showGraph = occasionsSelected && calculatedData && calculatedData.co_rows.length > 0 && !hasValidationErrors;

    // Decide which table to show on the right when NOT finalized
    const renderRightTable = () => {
        if (finalizedData.length > 0) {
            // When finalized, right side is handled separately (static target levels)
            return null;
        }
        if (occasionsSelected && hasValidationErrors) {
            if (calculatedData?.validation_failures) {
                return (
                    <ValidationFailuresView
                        failures={calculatedData.validation_failures}
                        onNavigate={navigate}
                    />
                );
            }
            return (
                <div className="p-8 text-center border border-dashed border-red-200 rounded-lg bg-red-50 text-red-700">
                    <p className="font-semibold text-lg mb-2">No Attainment Data Available</p>
                    <p className="text-xs text-red-600">
                        Please import MTE marks and map questions to COs. Action: Upload course MTE data.
                    </p>
                </div>
            );
        }
        if (occasionsSelected && calculatedData && calculatedData.co_rows.length > 0 && !hasValidationErrors) {
            return (
                <div className="calculated-table-section">
                    <MteCalculatedTable
                        rows={calculatedData.co_rows}
                        actualCourseAttainment={calculatedData.actual_course_attainment}
                        courseAttainmentAfterWeightage={calculatedData.course_attainment_after_weightage}
                        levels={courseLevels}
                        onMappedQuestionsClick={(cloId, cloCode) =>
                            setMappedModal({ open: true, cloId, cloCode })
                        }
                        onDrilldownClick={(cloId, cloCode, cloStatement) =>
                            setDrilldownModal({ open: true, cloId, cloCode, cloStatement })
                        }
                        showDrilldown={occasionsSelected}
                    />
                </div>
            );
        }
        if (selectedCourse) {
            return <BasicCOListTable rows={basicCOList} />;
        }
        return <div className="text-gray-500 text-left">Please select a course to view CO data.</div>;
    };


    return (
        <div className="w-full font-['Inter'] p-8 max-w-full mx-auto mt-4 min-h-screen text-left">
            {/* Header Banner */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#4a8494]">
                    MTE - Course Outcomes (COs) Attainment
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

            {/* CARD 1: Filters & Actions */}
            <div className="mb-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-left">
                {/* Row 1: Dropdown menus */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
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

                    {/* MTE Occasions Select */}
                    <div className="w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            MTE Occasions <span className="text-red-500">*</span>
                        </label>
                        <MultiSelect
                            name="mte-occasions"
                            label=""
                            options={occasions.map((o) => ({ value: o.ao_id, label: o.ao_description }))}
                            isMulti
                            isSelectAll
                            allSelectedLabel="All Selected"
                            customLabelBehavior
                            value={selectedOccasions}
                            onChange={(value: (string | number)[] | null) =>
                                handleOccasionsChange((value ?? []).map((id) => Number(id)))
                            }
                            placeholder={occasions.length ? 'Select Occasions' : 'No occasions available'}
                            disabled={!selectedCourse}
                        />
                    </div>
                </div>

                {/* Row 2: Note left, Buttons right */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
                    {/* Animated Note on the left */}
                    <div className="flex-grow text-left min-h-[38px] flex items-center">
                        {occasions.length > 0 && (
                            <div>
                                <style>{`
                                    @keyframes softPulse {
                                        0% { opacity: 1; transform: scale(1); }
                                        50% { opacity: 0; transform: scale(0.97); }
                                        100% { opacity: 1; transform: scale(1); }
                                    }
                                    .pulse-note {
                                        animation: softPulse 3s ease-in-out infinite;
                                        text-align: left;
                                    }
                                `}</style>
                                <div className="pulse-note">
                                    <div className="bg-[#4a8494] text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-sm inline-block">
                                        Note : Select all Occasions to Finalize COs Attainment (MTE)
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Export/Finalize buttons on the right */}
                    <div className="flex gap-4 items-center shrink-0">
                        {showFinalizeButton && (
                            <button
                                onClick={handleFinalize}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-md font-semibold transition bg-[#4a8494] text-white hover:bg-[#3a6a77] focus:outline-none focus:ring-2 focus:ring-[#4a8494] focus:ring-offset-2"
                            >
                                <Check size={18} strokeWidth={3} />
                                <span>Finalize Attainment</span>
                            </button>
                        )}
                        {!hasValidationErrors && (
                            <MteExportButton
                                curriculumId={selectedCurriculum}
                                termId={selectedTerm}
                                courseId={selectedCourse}
                                courseCode={courses.find(c => c.crs_id === selectedCourse)?.crs_code || ''}
                                sectionId={0}
                                occasionIds={selectedOccasions}
                                disabled={!calculatedData || calculatedData.co_rows.length === 0}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* CARD 2: Remaining Content */}
            {selectedCourse && (occasionsSelected || finalizedData.length > 0 || loading || error) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 text-left">
                    {loading && <div className="text-gray-500 text-left">Loading...</div>}

                    {!loading && (
                        error ? (
                            <div className="w-full p-8 text-center border border-dashed border-red-200 rounded-lg bg-red-50 text-red-700">
                                <p className="font-semibold text-lg">{error}</p>
                            </div>
                        ) : occasions.length === 0 ? (
                            <div className="w-full p-6 bg-blue-50 border border-blue-200 rounded-md text-left">
                                <p className="text-blue-800 font-semibold text-sm">
                                    No MTE assessment occasions are configured for this course.
                                </p>
                                <p className="text-gray-600 text-xs mt-1 font-medium">
                                    Create an MTE occasion before calculating or finalizing CO attainment.
                                </p>
                            </div>
                        ) : occasionsSelected && hasValidationErrors ? (
                            <div className="w-full">
                                {calculatedData?.validation_failures && (
                                    <ValidationFailuresView
                                        failures={calculatedData.validation_failures}
                                        onNavigate={navigate}
                                    />
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Graph (only when occasions selected) */}
                                {showGraph && (
                                    <div className="graph-section mt-8">
                                        <h3 className="text-xl font-bold text-[#4a8494] mb-6 text-left">
                                            Course Outcome (COs) Attainment
                                        </h3>
                                        <MteChart
                                            xAxis={calculatedData!.graph_data.x}
                                            yAxis={calculatedData!.graph_data.y}
                                            tooltips={calculatedData!.graph_data.tooltips}
                                            courseId={selectedCourse}
                                        />
                                    </div>
                                )}

                                {/* Side‑by‑side tables layout */}
                                <div className="mt-8">
                                    {occasionsSelected && calculatedData && !hasValidationErrors ? (
                                        /* New layout when all MTE occasions are selected */
                                        <div className="space-y-8">
                                            {/* Section 1: Target Levels (Left) + Calculated Table (Right) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                                {/* LEFT Side: Direct Attainment / Target Levels */}
                                                <div className="attainment-level-section flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
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
                                                        <MteAttainmentLevelTable levels={courseLevels} />
                                                    </div>
                                                </div>

                                                {/* RIGHT Side: Course Outcomes(COs) Attainment */}
                                                <div className="co-table-section flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
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
                                                        {(() => {
                                                            return (
                                                                <MteCalculatedTable
                                                                    rows={calculatedData.co_rows}
                                                                    actualCourseAttainment={calculatedData.actual_course_attainment}
                                                                    courseAttainmentAfterWeightage={calculatedData.course_attainment_after_weightage}
                                                                    levels={courseLevels}
                                                                    onMappedQuestionsClick={(cloId, cloCode) =>
                                                                        setMappedModal({ open: true, cloId, cloCode })
                                                                    }
                                                                    onDrilldownClick={(cloId, cloCode, cloStatement) =>
                                                                        setDrilldownModal({ open: true, cloId, cloCode, cloStatement })
                                                                    }
                                                                    showDrilldown={occasionsSelected}
                                                                />
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Note Section */}
                                            <FormulaNoteSection />

                                            {/* Section 2: Finalized MTE Course Outcomes (COs) (Left) + Target Levels (Right) */}
                                            {finalizedData.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                                    {/* LEFT Side: Finalized MTE Course Outcomes (COs) */}
                                                    <div className="co-table-section flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
                                                        <div className="flex justify-between items-center mb-6">
                                                            <h3 className="text-xl font-bold text-[#4a8494] text-left">
                                                                Course Outcomes(COs) Attainment
                                                            </h3>
                                                            <span className="text-xs font-bold uppercase text-[#09C506]">
                                                                Status: CO Attainment is Finalized
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-between">
                                                            <div className="flex-grow flex flex-col justify-between h-full">
                                                                <div>
                                                                    <MteFinalizedTable rows={finalizedData} levels={courseLevels} />
                                                                </div>
                                                                <div className="mt-4 flex flex-wrap gap-6 text-sm text-left border-t pt-3">
                                                                    <div>
                                                                        <span className="font-bold text-gray-800">Actual Course Attainment: </span>
                                                                        <span className="text-gray-700">{(finalizedData.reduce((acc, row) => acc + row.threshold_based_attainment, 0) / finalizedData.length).toFixed(2)}%</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-bold text-gray-800">Course Attainment After Weightage : </span>
                                                                        <span className="text-gray-700">{(finalizedData.reduce((acc, row) => acc + row.weighted_threshold_attainment, 0) / finalizedData.length).toFixed(2)}%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RIGHT Side: Direct Attainment / Target Levels */}
                                                    <div className="attainment-level-section flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
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
                                                            <MteAttainmentLevelTable levels={courseLevels} showSlNo={false} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Original layout when only Curriculum, Term, and Course are selected */
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                            {/* LEFT side: MTE CO Attainment */}
                                            <div className="co-table-section flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-xl font-bold text-[#4a8494] text-left">
                                                        Course Outcomes(COs) Attainment
                                                    </h3>
                                                    {finalizedData.length > 0 ? (
                                                        <span className="text-xs font-bold uppercase text-[#09C506]">
                                                            Status: CO Attainment is Finalized
                                                        </span>
                                                    ) : (
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
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between">
                                                    {finalizedData.length > 0 ? (
                                                        <div className="flex-grow flex flex-col justify-between h-full">
                                                            <div>
                                                                <MteFinalizedTable rows={finalizedData} levels={courseLevels} />
                                                            </div>
                                                            <div className="mt-4 flex flex-wrap gap-6 text-sm text-left border-t pt-3">
                                                                <div>
                                                                    <span className="font-bold text-gray-800">Actual Course Attainment: </span>
                                                                    <span className="text-gray-700">{(finalizedData.reduce((acc, row) => acc + row.threshold_based_attainment, 0) / finalizedData.length).toFixed(2)}%</span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-gray-800">Course Attainment After Weightage : </span>
                                                                    <span className="text-gray-700">{(finalizedData.reduce((acc, row) => acc + row.weighted_threshold_attainment, 0) / finalizedData.length).toFixed(2)}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-grow flex flex-col justify-between h-full">
                                                            <div>
                                                                {renderRightTable()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* RIGHT side: Direct Attainment / Target Levels */}
                                            <div className="attainment-level-section flex flex-col border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex-1">
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
                                                    <MteAttainmentLevelTable levels={courseLevels} showSlNo={false} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )
                    )}
                </div>
            )}

            {/* Modals */}
            <ModalContainer
                isOpen={isFinalizeDialogOpen}
                onClose={() => setIsFinalizeDialogOpen(false)}
                title="Finalize Attainment Confirmation"
                size="md"
            >
                <div className="flex flex-col text-left">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-4 mb-2">
                        Are you sure you want to finalize the overall MTE Course-Level Attainment for the selected course?
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setIsFinalizeDialogOpen(false)}
                            className="flex items-center gap-2 px-5 py-2 bg-[#d9534f] hover:bg-[#c9302c] text-white rounded-md text-sm font-semibold transition shadow-sm active:scale-95"
                        >
                            <span className="font-bold text-sm">✖</span> Cancel
                        </button>
                        <button
                            onClick={confirmFinalize}
                            className="flex items-center gap-2 px-5 py-2 bg-[#428bca] hover:bg-[#3071a9] text-white rounded-md text-sm font-semibold transition shadow-sm active:scale-95"
                        >
                            <span className="font-bold text-sm">✔</span> Ok
                        </button>
                    </div>
                </div>
            </ModalContainer>

            <ModalContainer
                isOpen={isSuccessDialogOpen}
                onClose={() => setIsSuccessDialogOpen(false)}
                title="Finalize Attainment Confirmation"
                size="md"
            >
                <div className="flex flex-col text-left">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-4 mb-2">
                        The MTE Course-Level Attainment has been finalized and updated successfully.
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setIsSuccessDialogOpen(false)}
                            className="flex items-center gap-2 px-5 py-2 bg-[#d9534f] hover:bg-[#c9302c] text-white rounded-md text-sm font-semibold transition shadow-sm active:scale-95"
                        >
                            <span className="font-bold text-sm">✖</span> Close
                        </button>
                    </div>
                </div>
            </ModalContainer>

            <ModalContainer
                isOpen={isWarningDialogOpen}
                onClose={() => setIsWarningDialogOpen(false)}
                title="MTE Finalize Warning !!!"
                size="md"
            >
                <div className="flex flex-col text-left">
                    <div className="text-sm font-semibold text-red-600 pb-4 mb-2">
                        You cannot Finalize the Course - MTE-Course Outcomes(COs) Attainment. Kindly complete the below activities :
                    </div>
                    
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                        {validationFailures && (
                            <>
                                {validationFailures.missing_marks.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-red-500 font-medium text-xs">
                                            &gt;&gt; Assessment data (student marks) are not uploaded/imported for the {validationFailures.missing_marks.length === 1 ? 'Occasion' : 'Occasions'} : <span className="font-bold">{validationFailures.missing_marks.join(' , ')}</span>
                                        </p>
                                        <div className="flex flex-col items-start gap-1 text-xs pl-4">
                                            <button
                                                onClick={() => {
                                                    setIsWarningDialogOpen(false);
                                                    navigate('/attainment/mte_data_import');
                                                }}
                                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                                            >
                                                Click here to upload course MTE data
                                            </button>
                                            <span className="text-gray-400 text-[10px] font-medium pl-2">OR</span>
                                            <button
                                                onClick={() => {
                                                    setIsWarningDialogOpen(false);
                                                    navigate('/assessment/manage_mte_qp');
                                                }}
                                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
                                            >
                                                Click here to Create QP course MTE data
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {validationFailures.missing_qp.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-red-500 font-medium text-xs">
                                            &gt;&gt; Question paper is not created for the {validationFailures.missing_qp.length === 1 ? 'Occasion' : 'Occasions'} : <span className="font-bold">{validationFailures.missing_qp.join(' , ')}</span>
                                        </p>
                                        <div className="pl-4">
                                            <button
                                                onClick={() => {
                                                    setIsWarningDialogOpen(false);
                                                    navigate('/assessment/manage_mte_qp');
                                                }}
                                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold text-xs text-left"
                                            >
                                                Click here to Create QP course MTE data
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {validationFailures.not_rolled_out.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-red-500 font-medium text-xs">
                                            &gt;&gt; Question paper is not rolled out for the {validationFailures.not_rolled_out.length === 1 ? 'Occasion' : 'Occasions'} : <span className="font-bold">{validationFailures.not_rolled_out.join(' , ')}</span>
                                        </p>
                                        <div className="pl-4">
                                            <button
                                                onClick={() => {
                                                    setIsWarningDialogOpen(false);
                                                    navigate('/assessment/manage_mte_qp');
                                                }}
                                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold text-xs text-left"
                                            >
                                                Click here to Create QP course MTE data
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {validationFailures.missing_mapping.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-red-500 font-medium text-xs">
                                            &gt;&gt; CO mapped questions are missing for the {validationFailures.missing_mapping.length === 1 ? 'Occasion' : 'Occasions'} : <span className="font-bold">{validationFailures.missing_mapping.join(' , ')}</span>
                                        </p>
                                        <div className="pl-4">
                                            <button
                                                onClick={() => {
                                                    setIsWarningDialogOpen(false);
                                                    navigate('/assessment/manage_mte_qp');
                                                }}
                                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold text-xs text-left"
                                            >
                                                Click here to Create QP course MTE data
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {validationFailures.missing_attainment.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-red-500 font-medium text-xs">
                                            &gt;&gt; CO attainment data is not generated for the {validationFailures.missing_attainment.length === 1 ? 'Occasion' : 'Occasions'} : <span className="font-bold">{validationFailures.missing_attainment.join(' , ')}</span>
                                        </p>
                                        <div className="pl-4">
                                            <button
                                                onClick={() => {
                                                    setIsWarningDialogOpen(false);
                                                    navigate('/attainment/cce_data_import');
                                                }}
                                                className="text-blue-600 hover:underline hover:text-blue-800 font-semibold text-xs text-left"
                                            >
                                                Generate CO attainment first
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={() => setIsWarningDialogOpen(false)}
                            className="flex items-center gap-2 px-5 py-2 bg-[#428bca] hover:bg-[#3071a9] text-white rounded-md text-sm font-semibold transition shadow-sm active:scale-95"
                        >
                            <span className="font-bold text-sm">✔</span> Ok
                        </button>
                    </div>
                </div>
            </ModalContainer>

            <MteMappedQuestionsModal
                open={mappedModal.open}
                onClose={() => setMappedModal({ open: false, cloId: null, cloCode: '' })}
                cloId={mappedModal.cloId}
                cloCode={mappedModal.cloCode}
                courseId={selectedCourse}
                sectionId={0}
                occasionIds={selectedOccasions}
            />

            <MteDrilldownModal
                open={drilldownModal.open}
                onClose={() =>
                    setDrilldownModal({ open: false, cloId: null, cloCode: '', cloStatement: '' })
                }
                cloId={drilldownModal.cloId}
                cloCode={drilldownModal.cloCode}
                cloStatement={drilldownModal.cloStatement}
                courseId={selectedCourse}
                sectionId={0}
                occasionIds={selectedOccasions}
                totalMteWeightage={selectedCourseWeightage}
                curriculumName={curricula.find((c) => c.crclm_id === selectedCurriculum)?.name || ''}
                termName={terms.find((t) => t.term_id === selectedTerm)?.name || ''}
                courseName={
                    (() => {
                        const crs = courses.find((c) => c.crs_id === selectedCourse);
                        return crs ? `${crs.crs_code} - ${crs.crs_name}` : '';
                    })()
                }
            />

            <MteLogHistoryModal
                open={isLogHistoryOpen}
                onClose={() => setIsLogHistoryOpen(false)}
            />

            <MteWebHelpModal
                open={isWebHelpOpen}
                onClose={() => setIsWebHelpOpen(false)}
            />
        </div>
    );
};
export default MteCoAttainmentPage;
