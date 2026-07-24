// src/pages/ioncudos/attainment/consolidatedPOAttainment/ConsolidatedPOSelectors.tsx

import React from 'react';
import MultiSelect from '../../../../components/FormBuilder/fields/MultiSelect';
import { Curriculum, Term, FirstYearCurriculum } from './ConsolidatedPOApi';

interface ConsolidatedPOSelectorsProps {
    curricula: Curriculum[];
    availableTerms: Term[];
    firstYearCurricula: FirstYearCurriculum[];
    selectedCurriculum: number | null;
    selectedTerms: number[];
    selectedFirstYearCurriculum: number | null;
    onCurriculumChange: (id: number | null) => void;
    onTermsChange: (ids: number[]) => void;
    onFirstYearCurriculumChange: (id: number | null) => void;
}

const ConsolidatedPOSelectors: React.FC<ConsolidatedPOSelectorsProps> = ({
    curricula,
    availableTerms,
    firstYearCurricula,
    selectedCurriculum,
    selectedTerms,
    selectedFirstYearCurriculum,
    onCurriculumChange,
    onTermsChange,
    onFirstYearCurriculumChange
}) => {
    const isFirstYearSelected = firstYearCurricula && firstYearCurricula.length > 0;

    const curriculumOptions = [
        { value: null, label: 'Select Curriculum' },
        ...curricula.map((c) => ({
            value: c.crclm_id,
            label: c.name,
        }))
    ];

    const firstYearCurriculumOptions = [
        { value: null, label: 'Select First Year Curriculum' },
        ...firstYearCurricula.map((c) => ({
            value: c.fy_crclm_id,
            label: c.name,
        }))
    ];

    const termOptions = availableTerms.map((t) => ({
        value: t.term_id,
        label: t.name,
    }));

    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
                {/* Curriculum Selector */}
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Curriculum:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-1">
                        <MultiSelect
                            name="consolidated-po-curriculum"
                            label=""
                            options={curriculumOptions}
                            value={selectedCurriculum}
                            onChange={(value: any) => onCurriculumChange(value !== null && value !== undefined ? Number(value) : null)}
                            placeholder="Select Curriculum"
                        />
                    </div>
                </div>

                {/* Conditional First Year Curriculum Selector */}
                {isFirstYearSelected && (
                    <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            First Year Curriculum:<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="flex-1">
                            <MultiSelect
                                name="consolidated-po-fy-curriculum"
                                label=""
                                options={firstYearCurriculumOptions}
                                value={selectedFirstYearCurriculum}
                                onChange={(value: any) => onFirstYearCurriculumChange(value !== null && value !== undefined ? Number(value) : null)}
                                placeholder="Select First Year Curriculum"
                                isDisabled={!selectedCurriculum}
                            />
                        </div>
                    </div>
                )}

                {/* Term Selector */}
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Term:<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex-1">
                        <MultiSelect
                            name="consolidated-po-term"
                            label=""
                            options={termOptions}
                            isMulti={true}
                            isSelectAll={availableTerms.length > 0}
                            customLabelBehavior={true}
                            value={selectedTerms}
                            onChange={(values: any) => onTermsChange((values ?? []).map((v: any) => Number(v)))}
                            placeholder="Select Terms"
                            isDisabled={!selectedCurriculum || (isFirstYearSelected && !selectedFirstYearCurriculum)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsolidatedPOSelectors;
