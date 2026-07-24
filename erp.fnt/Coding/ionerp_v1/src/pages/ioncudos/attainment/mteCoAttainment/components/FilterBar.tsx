import React from 'react';
import { Curriculum, Term, Course, Occasion } from '../types/mteAttainment.types';

interface FilterBarProps {
    curricula: Curriculum[];
    terms: Term[];
    courses: Course[];
    occasions: Occasion[];
    selectedCurriculum: Curriculum | null;
    selectedTerm: Term | null;
    selectedCourse: Course | null;
    selectedOccasionIds: number[];
    onCurriculumChange: (curriculum: Curriculum | null) => void;
    onTermChange: (term: Term | null) => void;
    onCourseChange: (course: Course | null) => void;
    onOccasionToggle: (occasionId: number, checked: boolean) => void;
    disabled?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
    curricula,
    terms,
    courses,
    occasions,
    selectedCurriculum,
    selectedTerm,
    selectedCourse,
    selectedOccasionIds,
    onCurriculumChange,
    onTermChange,
    onCourseChange,
    onOccasionToggle,
    disabled = false,
}) => {
    return (
        <div className="rounded-xl bg-white">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Curriculum</label>
                    <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        value={selectedCurriculum?.curriculum_id || ''}
                        onChange={(e) => {
                            const id = Number(e.target.value);
                            const curr = curricula.find((c) => c.curriculum_id === id) || null;
                            onCurriculumChange(curr);
                        }}
                        disabled={disabled}
                    >
                        <option value="">Select Curriculum</option>
                        {curricula.map((curr) => (
                            <option key={curr.curriculum_id} value={curr.curriculum_id}>
                                {curr.curriculum_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Term</label>
                    <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        value={selectedTerm?.term_id || ''}
                        onChange={(e) => {
                            const id = Number(e.target.value);
                            const term = terms.find((t) => t.term_id === id) || null;
                            onTermChange(term);
                        }}
                        disabled={disabled || !selectedCurriculum}
                    >
                        <option value="">Select Term</option>
                        {terms.map((term) => (
                            <option key={term.term_id} value={term.term_id}>
                                {term.term_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Course</label>
                    <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        value={selectedCourse?.course_id || ''}
                        onChange={(e) => {
                            const id = Number(e.target.value);
                            const course = courses.find((c) => c.course_id === id) || null;
                            onCourseChange(course);
                        }}
                        disabled={disabled || !selectedTerm}
                    >
                        <option value="">Select Course</option>
                        {courses.map((course) => (
                            <option key={course.course_id} value={course.course_id}>
                                {course.course_code} - {course.course_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedCourse && occasions.length > 0 && (
                <div className="mt-5 border-t border-slate-200 pt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">MTE Occasion</label>
                    <div className="flex flex-wrap gap-4">
                        {occasions.map((occasion) => (
                            <label
                                key={occasion.ao_id}
                                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-sky-600"
                                    checked={selectedOccasionIds.includes(occasion.ao_id)}
                                    onChange={(e) => onOccasionToggle(occasion.ao_id, e.target.checked)}
                                    disabled={disabled}
                                />
                                <span className="ml-2 text-sm text-slate-700">{occasion.ao_description}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterBar;
