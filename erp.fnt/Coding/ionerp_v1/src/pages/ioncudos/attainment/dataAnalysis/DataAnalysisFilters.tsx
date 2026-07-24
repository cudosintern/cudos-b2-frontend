import React from "react";
import {
  DataAnalysisFiltersState,
  DataAnalysisType,
  SelectOption,
} from "./dataAnalysisTypes";

interface DataAnalysisFiltersProps {
  filters: DataAnalysisFiltersState;
  schools: SelectOption[];
  programs: SelectOption[];
  curricula: SelectOption[];
  terms: SelectOption[];
  courses: SelectOption[];
  types: SelectOption[];
  sections: SelectOption[];
  occasions: SelectOption[];
  loading: boolean;
  showSection: boolean;
  showOccasion: boolean;
  onFilterChange: <K extends keyof DataAnalysisFiltersState>(
    key: K,
    value: DataAnalysisFiltersState[K]
  ) => void | Promise<void>;
}

const labelClass = "cia-attainment-label";
const fieldClass = "cia-attainment-field w-full";
const fieldWrapClass = "space-y-1.5";

const renderOptions = (options: SelectOption[]) =>
  options.map((option) => (
    <option key={option.id} value={option.id}>
      {option.label}
    </option>
  ));

const requiredMarker = <span className="text-red-500">*</span>;

const DataAnalysisFilters: React.FC<DataAnalysisFiltersProps> = ({
  filters,
  schools,
  programs,
  curricula,
  terms,
  courses,
  types,
  sections,
  occasions,
  loading,
  showSection,
  showOccasion,
  onFilterChange,
}) => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
    <div className={fieldWrapClass}>
      <label className={labelClass}>
        School {requiredMarker}
      </label>
      <select
        className={fieldClass}
        value={filters.schoolId}
        onChange={(event) => onFilterChange("schoolId", event.target.value)}
        disabled={loading}
      >
        <option value="">Select School</option>
        {renderOptions(schools)}
      </select>
    </div>

    <div className={fieldWrapClass}>
      <label className={labelClass}>
        Program {requiredMarker}
      </label>
      <select
        className={fieldClass}
        value={filters.programId}
        onChange={(event) => onFilterChange("programId", event.target.value)}
        disabled={loading || !filters.schoolId}
      >
        <option value="">Select Program</option>
        {renderOptions(programs)}
      </select>
    </div>

    <div className={fieldWrapClass}>
      <label className={labelClass}>
        Curriculum {requiredMarker}
      </label>
      <select
        className={fieldClass}
        value={filters.curriculumId}
        onChange={(event) => onFilterChange("curriculumId", event.target.value)}
        disabled={loading || !filters.programId}
      >
        <option value="">Select Curriculum</option>
        {renderOptions(curricula)}
      </select>
    </div>

    <div className={fieldWrapClass}>
      <label className={labelClass}>
        Term {requiredMarker}
      </label>
      <select
        className={fieldClass}
        value={filters.termId}
        onChange={(event) => onFilterChange("termId", event.target.value)}
        disabled={loading || !filters.curriculumId}
      >
        <option value="">Select Term</option>
        {renderOptions(terms)}
      </select>
    </div>

    <div className={fieldWrapClass}>
      <label className={labelClass}>
        Course {requiredMarker}
      </label>
      <select
        className={fieldClass}
        value={filters.courseId}
        onChange={(event) => onFilterChange("courseId", event.target.value)}
        disabled={loading || !filters.termId}
      >
        <option value="">Select Course</option>
        {renderOptions(courses)}
      </select>
    </div>

    <div className={fieldWrapClass}>
      <label className={labelClass}>
        Type {requiredMarker}
      </label>
      <select
        className={fieldClass}
        value={filters.type}
        onChange={(event) =>
          onFilterChange("type", (event.target.value as DataAnalysisType | "") || "")
        }
        disabled={loading || !filters.courseId}
      >
        <option value="">Select Type</option>
        {renderOptions(types)}
      </select>
    </div>

    {showSection ? (
      <div className={fieldWrapClass}>
        <label className={labelClass}>
          Section {requiredMarker}
        </label>
        <select
          className={fieldClass}
          value={filters.sectionId}
          onChange={(event) => onFilterChange("sectionId", event.target.value)}
          disabled={loading || !filters.type}
        >
          <option value="">Select Section</option>
          {renderOptions(sections)}
        </select>
      </div>
    ) : null}

    {showOccasion ? (
      <div className={fieldWrapClass}>
        <label className={labelClass}>
          Occasion {requiredMarker}
        </label>
        <select
          className={fieldClass}
          value={filters.occasionId}
          onChange={(event) => onFilterChange("occasionId", event.target.value)}
          disabled={loading || !filters.sectionId}
        >
          <option value="">Select Occasion</option>
          {renderOptions(occasions)}
        </select>
      </div>
    ) : null}
  </div>
);

export default DataAnalysisFilters;
