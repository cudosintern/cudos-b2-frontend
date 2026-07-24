import React from 'react';
import MultiSelect from '../../../../components/FormBuilder/fields/MultiSelect';

interface SelectorProps {
    curricula: any[];
    terms: any[];
    courses: any[];
    occasions: any[];
    selectedCurriculum: number | null;
    selectedTerm: number | null;
    selectedCourse: number | null;
    selectedOccasions: number[];
    onCurriculumChange: (id: number | null) => void;
    onTermChange: (id: number | null) => void;
    onCourseChange: (id: number | null) => void;
    onOccasionsChange: (ids: number[]) => void;
}

const MteSelectors: React.FC<SelectorProps> = ({
    curricula,
    terms,
    courses,
    occasions,
    selectedCurriculum,
    selectedTerm,
    selectedCourse,
    selectedOccasions,
    onCurriculumChange,
    onTermChange,
    onCourseChange,
    onOccasionsChange,
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
        ...terms.map((term) => ({
            value: term.term_id,
            label: term.name,
        }))
    ];

    const courseOptions = [
        { value: null, label: 'Select Course' },
        ...courses.map((course) => ({
            value: course.crs_id,
            label: `${course.crs_code} - ${course.crs_name}`,
        }))
    ];

    const occasionOptions = occasions.map((occasion) => ({
        value: occasion.ao_id,
        label: occasion.ao_description,
    }));

    return (
        <div className="space-y-4 mb-6">
            {/* Horizontal row of label‑dropdown pairs */}
            <div className="flex flex-wrap gap-4 items-center">
                {/* Curriculum */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Curriculum:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-1">
                        <MultiSelect
                            name="mte-curriculum"
                            label=""
                            options={curriculumOptions}
                            value={selectedCurriculum}
                            onChange={(value: any) => onCurriculumChange(value !== null && value !== undefined ? Number(value) : null)}
                            placeholder="Select Curriculum"
                        />
                    </div>
                </div>

                {/* Term */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Term:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-1">
                        <MultiSelect
                            name="mte-term"
                            label=""
                            options={termOptions}
                            value={selectedTerm}
                            onChange={(value: any) => onTermChange(value !== null && value !== undefined ? Number(value) : null)}
                            placeholder="Select Term"
                        />
                    </div>
                </div>

                {/* Course */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Course:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-1">
                        <MultiSelect
                            name="mte-course"
                            label=""
                            options={courseOptions}
                            value={selectedCourse}
                            onChange={(value: any) => onCourseChange(value !== null && value !== undefined ? Number(value) : null)}
                            placeholder="Select Course"
                        />
                    </div>
                </div>

                {/* MTE Occasions – uses updated MultiSelect with blue theme */}
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        MTE Occasions:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-1">
                        <MultiSelect
                            name="mte-occasions"
                            label=""
                            options={occasionOptions}
                            isMulti
                            isSelectAll
                            allSelectedLabel="All Selected"
                            customLabelBehavior
                            value={selectedOccasions}
                            onChange={(value: (string | number)[] | null) =>
                                onOccasionsChange((value ?? []).map((id) => Number(id)))
                            }
                            placeholder={occasionOptions.length ? 'Select Occasions' : 'No occasions available'}
                        />
                    </div>
                </div>
            </div>

            {/* Pulsing note – fully fades in/out */}
            {occasions.length > 0 && (
                <>
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
                </>
            )}
        </div>
    );
};
export default MteSelectors;
