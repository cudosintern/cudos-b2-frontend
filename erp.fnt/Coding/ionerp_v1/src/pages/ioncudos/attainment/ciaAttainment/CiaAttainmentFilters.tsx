import React from 'react';
import Select from 'react-select';
import { DropdownOption, CiaAttainmentFilters as FiltersType } from './ciaAttainmentTypes';

interface CiaAttainmentFiltersProps {
  curriculums: DropdownOption[];
  terms: DropdownOption[];
  courses: DropdownOption[];
  sections: DropdownOption[];
  occasions: DropdownOption[];
  filters: FiltersType;
  onFilterChange: (key: keyof FiltersType, value: any) => void;
  loading: boolean;
}

const CiaAttainmentFilters: React.FC<CiaAttainmentFiltersProps> = ({
  curriculums,
  terms,
  courses,
  sections,
  occasions,
  filters,
  onFilterChange,
  loading,
}) => {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Curriculum</label>
          <Select
            options={curriculums.map(c => ({ value: c.id, label: c.name }))}
            value={curriculums.find(c => c.id === filters.curriculumId) ? { value: filters.curriculumId, label: curriculums.find(c => c.id === filters.curriculumId)?.name } : null}
            onChange={opt => onFilterChange('curriculumId', opt ? opt.value : null)}
            isLoading={loading}
            isClearable
            placeholder="Select Curriculum"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
          <Select
            options={terms.map(t => ({ value: t.id, label: t.name }))}
            value={terms.find(t => t.id === filters.termId) ? { value: filters.termId, label: terms.find(t => t.id === filters.termId)?.name } : null}
            onChange={opt => onFilterChange('termId', opt ? opt.value : null)}
            isLoading={loading}
            isDisabled={!filters.curriculumId}
            placeholder="Select Term"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <Select
            options={courses.map(c => ({ value: c.id, label: `${c.course_code ? c.course_code + ' - ' : ''}${c.name}` }))}
            value={courses.find(c => c.id === filters.courseId) ? { value: filters.courseId, label: courses.find(c => c.id === filters.courseId)?.name } : null}
            onChange={opt => onFilterChange('courseId', opt ? opt.value : null)}
            isLoading={loading}
            isDisabled={!filters.termId}
            placeholder="Select Course"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
          <Select
            options={sections.map(s => ({ value: s.id, label: s.name }))}
            value={sections.find(s => s.id === filters.sectionId) ? { value: filters.sectionId, label: sections.find(s => s.id === filters.sectionId)?.name } : null}
            onChange={opt => onFilterChange('sectionId', opt ? opt.value : null)}
            isLoading={loading}
            isDisabled={!filters.courseId}
            placeholder="Select Section"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CIA Occasions</label>
          <Select
            isMulti
            options={occasions.map(o => ({ value: o.id, label: o.name }))}
            value={occasions.filter(o => filters.occasionIds.includes(o.id)).map(o => ({ value: o.id, label: o.name }))}
            onChange={opts => onFilterChange('occasionIds', opts ? opts.map(o => o.value) : [])}
            isLoading={loading}
            isDisabled={!filters.sectionId}
            placeholder="Select Occasions"
          />
        </div>
      </div>
    </div>
  );
};
export default CiaAttainmentFilters;