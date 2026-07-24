import React, { useEffect, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { DropdownOption, CiaAttainmentFilters as FiltersType } from './ciaAttainmentTypes';

interface CiaAttainmentFiltersProps {
  curriculums: DropdownOption[];
  terms: DropdownOption[];
  courses: DropdownOption[];
  sections: DropdownOption[];
  occasions: DropdownOption[];
  filters: FiltersType;
  onFilterChange: (key: keyof FiltersType, value: any) => void;
  noteActive: boolean;
  loading: boolean;
}

const CiaAttainmentFilters: React.FC<CiaAttainmentFiltersProps> = ({
  curriculums, terms, courses, sections, occasions, filters, onFilterChange, noteActive, loading,
}) => {
  const [occasionOpen, setOccasionOpen] = useState(false);
  const occasionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (occasionRef.current && !occasionRef.current.contains(event.target as Node)) {
        setOccasionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const required = <span className="text-red-500">*</span>;
  const fieldClass = "cia-attainment-field w-full";
  const fieldWrapClass = "space-y-1.5";
  const labelClass = "cia-attainment-label";
  const selectedOccasions = filters.occasionIds.map(String);
  const allOccasionsSelected = occasions.length > 0 && selectedOccasions.length === occasions.length;
  const courseLabel = (course: DropdownOption) => (
    course.course_code && !course.name.startsWith(course.course_code)
      ? `${course.course_code} - ${course.name}`
      : course.name
  );

  const toggleOccasion = (id: string | number) => {
    const idValue = String(id);
    const next = selectedOccasions.includes(idValue)
      ? filters.occasionIds.filter((occasionId) => String(occasionId) !== idValue)
      : [...filters.occasionIds, id];
    onFilterChange('occasionIds', next);
  };

  const toggleAllOccasions = () => {
    onFilterChange('occasionIds', allOccasionsSelected ? [] : occasions.map((occasion) => occasion.id));
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={fieldWrapClass}>
          <label className={labelClass}>Curriculum {required}</label>
          <select
            className={fieldClass}
            value={filters.curriculumId || ''}
            onChange={(e) => onFilterChange('curriculumId', e.target.value ? Number(e.target.value) : null)}
            disabled={loading}
          >
            <option value="">Select Curriculum</option>
            {curriculums.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass}>Term {required}</label>
          <select
            className={fieldClass}
            value={filters.termId || ''}
            onChange={(e) => onFilterChange('termId', e.target.value ? Number(e.target.value) : null)}
            disabled={loading || !filters.curriculumId}
          >
            <option value="">Select Term</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass}>Course {required}</label>
          <select
            className={fieldClass}
            value={filters.courseId || ''}
            onChange={(e) => onFilterChange('courseId', e.target.value ? Number(e.target.value) : null)}
            disabled={loading || !filters.termId}
          >
            <option value="">Select Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{courseLabel(c)}</option>)}
          </select>
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass}>Section {required}</label>
          <select
            className={fieldClass}
            value={filters.sectionId || ''}
            onChange={(e) => onFilterChange('sectionId', e.target.value ? Number(e.target.value) : null)}
            disabled={loading || !filters.courseId}
          >
            <option value="">Select Section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className={fieldWrapClass} ref={occasionRef}>
          <label className={labelClass}>IA Occasion {required}</label>
          <div className="relative w-full">
            <button
              type="button"
              className={`${fieldClass} flex items-center justify-between text-left`}
              onClick={() => setOccasionOpen((open) => !open)}
              disabled={loading || !filters.sectionId}
            >
              <span className="truncate">
                {allOccasionsSelected ? 'All selected' : selectedOccasions.length ? `${selectedOccasions.length} Occasion(s) Selected` : 'Select Occasions'}
              </span>
              <FaChevronDown size={10} className="text-gray-700" />
            </button>

            {occasionOpen && (
              <div className="cia-attainment-occasion-dropdown absolute left-0 top-[40px] z-50 w-full text-sm">
                <label className="flex items-center gap-2 px-3 py-2 cursor-pointer text-[#437880] border-b border-gray-100 font-medium">
                  <input
                    type="checkbox"
                    checked={allOccasionsSelected}
                    onChange={toggleAllOccasions}
                    className="w-4 h-4"
                  />
                  Select All
                </label>
                {occasions.map((occasion) => (
                  <label key={occasion.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedOccasions.includes(String(occasion.id))}
                      onChange={() => toggleOccasion(occasion.id)}
                      className="w-4 h-4"
                    />
                    {occasion.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`cia-attainment-inline-note ${noteActive ? 'opacity-100' : 'opacity-100'}`}>
        Note : Select all Occasions to Finalize COs Attainment(IA)
      </div>
    </>
  );
};

export default CiaAttainmentFilters;
