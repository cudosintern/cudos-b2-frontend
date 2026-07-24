import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaBook, FaChevronDown, FaFilePdf, FaFileWord } from "react-icons/fa";
import { PoAttainmentFilters as FiltersState, Term } from "./poAttainmentTypes";

interface PoAttainmentFiltersProps {
  curriculums: Array<{ id: string; label: string }>;
  terms: Term[];
  filters: FiltersState;
  exportOptions: Array<{ id: "pdf" | "docx"; label: string }>;
  loading: boolean;
  onFilterChange: <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => void;
  onExport: (exportType: "pdf" | "docx") => void;
}

const selectClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#437880] disabled:bg-gray-100 disabled:text-gray-500";

const PoAttainmentFilters: React.FC<PoAttainmentFiltersProps> = ({
  curriculums,
  terms,
  filters,
  exportOptions,
  loading,
  onFilterChange,
  onExport,
}) => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const termsRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (termsRef.current && !termsRef.current.contains(event.target as Node)) {
        setIsTermsOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSelected = terms.length > 0 && filters.termIds.length === terms.length;

  const triggerLabel = useMemo(() => {
    if (!filters.termIds.length) {
      return "Select Terms";
    }

    if (allSelected) {
      return "All selected";
    }

    if (filters.termIds.length === 1) {
      return terms.find((term) => term.id === filters.termIds[0])?.label ?? "1 selected";
    }

    return `${filters.termIds.length} selected`;
  }, [allSelected, filters.termIds, terms]);

  const toggleTerm = (termId: string) => {
    const next = filters.termIds.includes(termId)
      ? filters.termIds.filter((currentId) => currentId !== termId)
      : [...filters.termIds, termId];

    onFilterChange("termIds", next);
  };

  const toggleAllTerms = () => {
    onFilterChange(
      "termIds",
      allSelected ? [] : terms.map((term) => term.id)
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)_auto] xl:items-end">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Curriculum <span className="text-red-500">*</span>
          </label>
          <select
            value={filters.curriculumId}
            onChange={(event) => onFilterChange("curriculumId", event.target.value)}
            className={selectClassName}
            disabled={loading}
          >
            <option value="">Select Curriculum</option>
            {curriculums.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 xl:pb-2">
          <input
            type="checkbox"
            checked={filters.coreCoursesOnly}
            onChange={(event) => onFilterChange("coreCoursesOnly", event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#437880] focus:ring-[#437880]"
          />
          Core Courses
        </label>

        <div ref={termsRef}>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Term <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              className={`${selectClassName} flex items-center justify-between text-left`}
              onClick={() => setIsTermsOpen((current) => !current)}
              disabled={loading || !filters.curriculumId}
            >
              <span className="truncate">{triggerLabel}</span>
              <FaChevronDown className="text-xs text-gray-600" />
            </button>

            {isTermsOpen && (
              <div className="cia-attainment-occasion-dropdown absolute left-0 top-[44px] z-50 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                <label className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm font-medium text-[#437880]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAllTerms}
                    className="h-4 w-4"
                  />
                  Select All
                </label>
                <div className="max-h-64 overflow-y-auto">
                  {terms.map((term) => (
                    <label
                      key={term.id}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={filters.termIds.includes(term.id)}
                        onChange={() => toggleTerm(term.id)}
                        className="h-4 w-4"
                      />
                      {term.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div ref={exportRef} className="relative xl:justify-self-end">
          <button
            type="button"
            onClick={() => setIsExportOpen((current) => !current)}
            className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#437880] bg-[#437880] px-5 py-2 text-[13px] font-semibold text-white transition hover:border-[#3a6a71] hover:bg-[#3a6a71]"
          >
            <FaBook /> Export <span className="text-[10px]">▼</span>
          </button>

          {isExportOpen && (
            <div className="absolute right-0 top-[44px] z-40 min-w-[110px] rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setIsExportOpen(false);
                    onExport(option.id);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {option.id === "pdf" ? <FaFilePdf className="text-red-500" /> : <FaFileWord className="text-blue-500" />}
                  {option.id === "pdf" ? ".pdf" : ".doc"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoAttainmentFilters;
