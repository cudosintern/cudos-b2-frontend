import React from "react";
import {
  CourseCoAttainmentFilterOptionsResponse,
  CourseCoAttainmentFiltersState,
} from "./courseCoAttainmentTypes";

interface CourseCoAttainmentFiltersProps {
  filters: CourseCoAttainmentFiltersState;
  filterOptions: CourseCoAttainmentFilterOptionsResponse;
  isTermDisabled: boolean;
  isCourseDisabled: boolean;
  onChange: (key: keyof CourseCoAttainmentFiltersState, value: string) => void;
}

const selectClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500";

const CourseCoAttainmentFilters: React.FC<CourseCoAttainmentFiltersProps> = ({
  filters,
  filterOptions,
  isTermDisabled,
  isCourseDisabled,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Curriculum <span className="text-red-500">*</span>
        </label>
        <select
          value={filters.curriculumId}
          onChange={(event) => onChange("curriculumId", event.target.value)}
          className={selectClassName}
        >
          <option value="">Select Curriculum</option>
          {filterOptions.curriculums.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Term <span className="text-red-500">*</span>
        </label>
        <select
          value={filters.termId}
          onChange={(event) => onChange("termId", event.target.value)}
          disabled={isTermDisabled}
          className={selectClassName}
        >
          <option value="">Select Term</option>
          {filterOptions.terms.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Course <span className="text-red-500">*</span>
        </label>
        <select
          value={filters.courseId}
          onChange={(event) => onChange("courseId", event.target.value)}
          disabled={isCourseDisabled}
          className={selectClassName}
        >
          <option value="">Select Course</option>
          {filterOptions.courses.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CourseCoAttainmentFilters;
