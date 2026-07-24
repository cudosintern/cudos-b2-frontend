import React, { useEffect, useState } from 'react';
import { useMTEAtainment } from './hooks/useMTEAttainment';
import FilterBar from './components/FilterBar';
import ReadinessAlerts from './components/ReadinessAlerts';
import AttainmentLevelsTable from './components/AttainmentLevelsTable';
import CalculatedCOTable from './components/CalculatedCOTable';
import AttainmentGraph from './components/AttainmentGraph';
import FinalizedTable from './components/FinalizedTable';
import ViewDetailsModal from './components/modals/ViewDetailsModal';
import { mteAttainmentApi } from './services/mteAttainmentApi';

const MTEAttainment: React.FC = () => {
    const {
        curricula,
        terms,
        courses,
        occasions,
        selectedCurriculum,
        selectedTerm,
        selectedCourse,
        selectedOccasionIds,
        calculatedData,
        finalizedData,
        isLoading,
        error,
        loadCurricula,
        loadTerms,
        loadCourses,
        loadOccasions,
        loadFinalized,
        loadAttainmentLevels,
        calculateAttainment,
        finalizeAttainment,
        setSelectedCurriculum,
        setSelectedTerm,
        setSelectedCourse,
        setSelectedOccasionIds,
        clearCalculated,
    } = useMTEAtainment();

    const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
    const [selectedCloId, setSelectedCloId] = useState<number | null>(null);
    const [detailsTab, setDetailsTab] = useState<'mapped' | 'drilldown'>('mapped');

    useEffect(() => {
        loadCurricula();
    }, [loadCurricula]);

    const handleCurriculumChange = async (curriculum: typeof selectedCurriculum) => {
        setSelectedCurriculum(curriculum);
        setSelectedTerm(null);
        setSelectedCourse(null);
        setSelectedOccasionIds([]);
        clearCalculated();
        if (curriculum) {
            await loadTerms(curriculum.curriculum_id);
        }
    };

    const handleTermChange = async (term: typeof selectedTerm) => {
        setSelectedTerm(term);
        setSelectedCourse(null);
        setSelectedOccasionIds([]);
        clearCalculated();
        if (term) {
            await loadCourses(term.term_id);
        }
    };

    const handleCourseChange = async (course: typeof selectedCourse) => {
        setSelectedCourse(course);
        setSelectedOccasionIds([]);
        clearCalculated();
        if (course && selectedCurriculum && selectedTerm) {
            await Promise.all([
                loadOccasions(course.course_id),
                loadFinalized(selectedCurriculum.curriculum_id, selectedTerm.term_id, course.course_id),
                loadAttainmentLevels(course.course_id),
            ]);
        }
    };

    const handleOccasionToggle = (occasionId: number, checked: boolean) => {
        const newIds = checked
            ? [...selectedOccasionIds, occasionId]
            : selectedOccasionIds.filter((id: number) => id !== occasionId);
        setSelectedOccasionIds(newIds);
        if (newIds.length === 0) {
            clearCalculated();
        }
    };

    useEffect(() => {
        if (selectedCurriculum && selectedTerm && selectedCourse && selectedOccasionIds.length > 0) {
            calculateAttainment({
                curriculum_id: selectedCurriculum.curriculum_id,
                term_id: selectedTerm.term_id,
                course_id: selectedCourse.course_id,
                selected_occasion_ids: selectedOccasionIds,
            });
        }
    }, [selectedOccasionIds, selectedCurriculum, selectedTerm, selectedCourse, calculateAttainment]);

    const allOccasionsSelected =
        occasions.length > 0 && selectedOccasionIds.length === occasions.length;

    const handleFinalize = async () => {
        if (!selectedCurriculum || !selectedTerm || !selectedCourse) return;
        await finalizeAttainment({
            curriculum_id: selectedCurriculum.curriculum_id,
            term_id: selectedTerm.term_id,
            course_id: selectedCourse.course_id,
            selected_occasion_ids: selectedOccasionIds,
        });
    };

    const handleExport = async () => {
        if (!selectedCurriculum || !selectedTerm || !selectedCourse) return;
        try {
            const blob = await mteAttainmentApi.exportReport({
                curriculum_id: selectedCurriculum.curriculum_id,
                term_id: selectedTerm.term_id,
                course_id: selectedCourse.course_id,
                selected_occasion_ids: selectedOccasionIds,
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mte_report_${selectedCourse.course_code}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed', err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-[1500px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
                <div className="rounded-2xl bg-slate-800 px-6 py-4">
                    <h1 className="text-2xl font-bold text-white">MTE - Course Outcomes (COs) Attainment</h1>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                            <FilterBar
                                curricula={curricula}
                                terms={terms}
                                courses={courses}
                                occasions={occasions}
                                selectedCurriculum={selectedCurriculum}
                                selectedTerm={selectedTerm}
                                selectedCourse={selectedCourse}
                                selectedOccasionIds={selectedOccasionIds}
                                onCurriculumChange={handleCurriculumChange}
                                onTermChange={handleTermChange}
                                onCourseChange={handleCourseChange}
                                onOccasionToggle={handleOccasionToggle}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex shrink-0 items-center gap-3 xl:pt-1">
                            <button
                                onClick={handleFinalize}
                                disabled={!allOccasionsSelected || !calculatedData?.can_finalize || isLoading}
                                className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Finalize Attainment
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={!selectedCourse || selectedOccasionIds.length === 0 || isLoading}
                                className="rounded-md bg-lime-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-lime-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {selectedCourse && occasions.length > 0 && !allOccasionsSelected && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                        Note: Select all occasions to finalize COs attainment for MTE.
                    </div>
                )}

                {error && (
                    <div className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                        {error}
                    </div>
                )}

                {calculatedData && (
                    <div className="mt-6 space-y-6">
                        <ReadinessAlerts occasionStatus={calculatedData.readiness_status.occasion_status} />
                        {calculatedData.readiness_status.all_ready && (
                            <>
                                <AttainmentGraph graphData={calculatedData.graph_data} />
                                <div className="grid gap-6 xl:grid-cols-[1.05fr_1.1fr]">
                                    <AttainmentLevelsTable levels={calculatedData.course_levels} />
                                    <CalculatedCOTable
                                        coRows={calculatedData.co_rows}
                                        onViewDetails={(cloId, initialTab = 'mapped') => {
                                            setSelectedCloId(cloId);
                                            setDetailsTab(initialTab);
                                            setViewDetailsModalOpen(true);
                                        }}
                                    />
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
                                    <p className="font-semibold text-slate-900">Note</p>
                                    <p className="mt-2">
                                        Threshold based attainment % = (x / y) * 100, where x is the number of students
                                        meeting the threshold and y is the total number of attempted students.
                                    </p>
                                    <p className="mt-1">
                                        Average based attainment % = (x / y) * 100, where x is the average secured marks
                                        of attempted students and y is the maximum marks.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="mt-6">
                    <FinalizedTable finalizedRows={finalizedData} />
                </div>
            </div>

            {selectedCloId && (
                <ViewDetailsModal
                    isOpen={viewDetailsModalOpen}
                    onClose={() => setViewDetailsModalOpen(false)}
                    cloId={selectedCloId}
                    courseId={selectedCourse?.course_id || 0}
                    occasionIds={selectedOccasionIds}
                    initialTab={detailsTab}
                />
            )}
        </div>
    );
};

export default MTEAttainment;
