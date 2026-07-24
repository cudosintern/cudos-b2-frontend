// src/pages/ioncudos/attainment/firstYearCourseCoAttainment/FirstYearSelectors.tsx

import React from 'react';
import MultiSelect from '../../../../components/FormBuilder/fields/MultiSelect';
import { Curriculum, Term, Course } from './FirstYearCoApi';

interface FirstYearSelectorsProps {
    curricula: Curriculum[];
    terms: Term[];
    courses: Course[];
    selectedCurriculum: number | null;
    selectedTerm: number | null;
    selectedCourse: number | null;
    onCurriculumChange: (id: number | null) => void;
    onTermChange: (id: number | null) => void;
    onCourseChange: (id: number | null) => void;
}

const FirstYearSelectors: React.FC<FirstYearSelectorsProps> = ({
    curricula,
    terms,
    courses,
    selectedCurriculum,
    selectedTerm,
    selectedCourse,
    onCurriculumChange,
    onTermChange,
    onCourseChange
}) => {
    const curriculumOptions = [
        { value: null, label: 'Select Curriculum' },
        ...curricula.map((c) => ({
            value: c.crclm_id,
            label: c.name,
        }))
    ];

    const termOptions = [
        { value: null, label: 'Select Term' },
        ...terms.map((t) => ({
            value: t.term_id,
            label: t.name,
        }))
    ];

    const courseOptions = [
        { value: null, label: 'Select Course' },
        ...courses.map((c) => ({
            value: c.crs_id,
            label: `${c.crs_code} - ${c.crs_name}`,
        }))
    ];

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Curriculum Selector */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[90px]">
                        Curriculum:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-grow">
                        <MultiSelect
                            name="fy-curriculum"
                            label=""
                            options={curriculumOptions}
                            value={selectedCurriculum}
                            onChange={(value: any) => onCurriculumChange(value !== null && value !== undefined ? Number(value) : null)}
                            placeholder="Select Curriculum"
                        />
                    </div>
                </div>

                {/* Term Selector */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[60px]">
                        Term:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-grow">
                        <MultiSelect
                            name="fy-term"
                            label=""
                            options={termOptions}
                            value={selectedTerm}
                            onChange={(value: any) => onTermChange(value !== null && value !== undefined ? Number(value) : null)}
                            placeholder="Select Term"
                        />
                    </div>
                </div>

                {/* Course Selector */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[70px]">
                        Course:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-grow">
                        <MultiSelect
                            name="fy-course"
                            label=""
                            options={courseOptions}
                            value={selectedCourse}
                            onChange={(value: any) => onCourseChange(value !== null && value !== undefined ? Number(value) : null)}
                            placeholder="Select Course"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FirstYearSelectors;
