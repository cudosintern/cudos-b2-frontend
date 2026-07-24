// src/pages/ioncudos/attainment/firstYearCourseCoAttainment/FirstYearCceSelectors.tsx

import React from 'react';
import MultiSelect from '../../../../components/FormBuilder/fields/MultiSelect';
import { Section, CceOccasion } from './FirstYearCoApi';

interface FirstYearCceSelectorsProps {
    sections: Section[];
    occasions: CceOccasion[];
    schools: string[];
    selectedSection: number | null;
    selectedOccasions: number[];
    selectedSchools: string[];
    onSectionChange: (id: number | null) => void;
    onOccasionsChange: (ids: number[]) => void;
    onSchoolsChange: (names: string[]) => void;
    onViewStudentDetailsClick: () => void;
    isCourseSelected: boolean;
}

const FirstYearCceSelectors: React.FC<FirstYearCceSelectorsProps> = ({
    sections,
    occasions,
    schools,
    selectedSection,
    selectedOccasions,
    selectedSchools,
    onSectionChange,
    onOccasionsChange,
    onSchoolsChange,
    onViewStudentDetailsClick,
    isCourseSelected
}) => {
    const sectionOptions = [
        { value: null, label: 'Select Section' },
        ...sections.map((s) => ({
            value: s.section_id,
            label: s.name,
        }))
    ];

    // For multi-select, we do not prefix a "Select School" null option
    const schoolOptions = schools.map((name) => ({
        value: name,
        label: name,
    }));

    const occasionOptions = occasions.map((occ) => ({
        value: occ.ao_id,
        label: occ.ao_description,
    }));

    const handleViewDetails = (e: React.MouseEvent) => {
        e.preventDefault();
        onViewStudentDetailsClick();
    };

    return (
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                {/* Section dropdown */}
                <div className="flex items-center gap-2 flex-grow">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[70px]">
                        Section:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-grow">
                        <MultiSelect
                            name="fy-section"
                            label=""
                            options={sectionOptions}
                            value={selectedSection}
                            onChange={(value: any) => onSectionChange(value !== null && value !== undefined ? Number(value) : null)}
                            placeholder="Select Section"
                            disabled={!isCourseSelected}
                        />
                    </div>
                </div>

                {/* CCE Occasion dropdown (multi-select) */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[110px]">
                        CCE Occasion:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-grow">
                        <MultiSelect
                            name="fy-occasions"
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
                            disabled={!isCourseSelected}
                        />
                    </div>
                </div>

                {/* Student School dropdown (multi-select) */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[115px]">
                        Student School:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-grow">
                        <MultiSelect
                            name="fy-school"
                            label=""
                            options={schoolOptions}
                            isMulti
                            isSelectAll
                            allSelectedLabel="All Selected"
                            customLabelBehavior
                            value={selectedSchools}
                            onChange={(value: (string | number)[] | null) =>
                                onSchoolsChange((value ?? []).map((val) => String(val)))
                            }
                            placeholder={schoolOptions.length ? 'Select School' : 'No schools available'}
                            disabled={!isCourseSelected}
                        />
                    </div>
                </div>

                {/* View Student Details action button */}
                <div className="flex justify-end md:justify-start">
                    <button
                        onClick={handleViewDetails}
                        className={`text-sm font-bold underline transition-colors ${
                            isCourseSelected 
                                ? 'text-[#4a8494] hover:text-[#38626f]' 
                                : 'text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!isCourseSelected}
                    >
                        View Student Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FirstYearCceSelectors;
