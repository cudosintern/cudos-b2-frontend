import React, { useState, useEffect, useCallback, useRef } from 'react';
import { seeImportService } from './seeImportService';
import { DropdownOption } from './seeImportTypes';

interface SeeFiltersProps {
  onTermChange: (termId: number | null) => void;
  onContextChange: (context: {
    schoolName: string;
    programName: string;
    curriculumName: string;
    termName: string;
  }) => void;
}

const STORAGE_KEY = 'see_import_filters';

const SeeFilters: React.FC<SeeFiltersProps> = ({ onTermChange, onContextChange }) => {
  const [schools, setSchools] = useState<DropdownOption[]>([]);
  const [programs, setPrograms] = useState<DropdownOption[]>([]);
  const [curriculums, setCurriculums] = useState<DropdownOption[]>([]);
  const [terms, setTerms] = useState<DropdownOption[]>([]);

  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      school_id: '',
      program_id: '',
      curriculum_id: '',
      term_id: ''
    };
  });

  const isInitialHydration = useRef(true);

  // Persist to session storage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const fetchInitialDropdowns = useCallback(async () => {
    try {
      // 1. Always fetch schools
      const schoolData = await seeImportService.getSchools();
      setSchools(schoolData);

      if (filters.school_id) {
        // 2. Fetch programs if school is selected
        const pgmData = await seeImportService.getPrograms(filters.school_id);
        setPrograms(pgmData);

        if (filters.program_id) {
          // 3. Fetch curriculums if program is selected
          const currData = await seeImportService.getCurriculums(filters.program_id);
          setCurriculums(currData);

          if (filters.curriculum_id) {
            // 4. Fetch terms if curriculum is selected
            const termData = await seeImportService.getTerms(filters.curriculum_id);
            setTerms(termData);
          }
        }
      }
    } catch (error) {
      console.error('Error hydrating filters:', error);
    } finally {
      isInitialHydration.current = false;
    }
  }, [filters.school_id, filters.program_id, filters.curriculum_id]);

  useEffect(() => {
    fetchInitialDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  const handleFilterChange = async (name: string, value: string) => {
    const newFilters = { ...filters, [name]: value };

    if (name === 'school_id') {
      newFilters.program_id = '';
      newFilters.curriculum_id = '';
      newFilters.term_id = '';
      setPrograms([]);
      setCurriculums([]);
      setTerms([]);
      if (value) {
        const data = await seeImportService.getPrograms(value);
        setPrograms(data);
      }
    } else if (name === 'program_id') {
      newFilters.curriculum_id = '';
      newFilters.term_id = '';
      setCurriculums([]);
      setTerms([]);
      if (value) {
        const data = await seeImportService.getCurriculums(value);
        setCurriculums(data);
      }
    } else if (name === 'curriculum_id') {
      newFilters.term_id = '';
      setTerms([]);
      if (value) {
        const data = await seeImportService.getTerms(value);
        setTerms(data);
      }
    }

    setFilters(newFilters);
  };

  // Notify parent of changes and labels
  useEffect(() => {
    if (filters.term_id) {
      onTermChange(Number(filters.term_id));
      
      const schoolName = schools.find(s => String(s.value) === String(filters.school_id))?.label || '';
      const programName = programs.find(p => String(p.value) === String(filters.program_id))?.label || '';
      const curriculumName = curriculums.find(c => String(c.value) === String(filters.curriculum_id))?.label || '';
      const termName = terms.find(t => String(t.value) === String(filters.term_id))?.label || '';
      
      onContextChange({ schoolName, programName, curriculumName, termName });
    } else {
      onTermChange(null);
    }
  }, [filters, schools, programs, curriculums, terms, onTermChange, onContextChange]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          {/* School */}
          <div className="w-full lg:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.school_id}
              onChange={(e) => handleFilterChange('school_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select School</option>
              {schools.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Program */}
          <div className="w-full lg:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.program_id}
              onChange={(e) => handleFilterChange('program_id', e.target.value)}
              disabled={!filters.school_id}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
            >
              <option value="">Select Program</option>
              {programs.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Curriculum */}
          <div className="w-full lg:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curriculum <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.curriculum_id}
              onChange={(e) => handleFilterChange('curriculum_id', e.target.value)}
              disabled={!filters.program_id}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
            >
              <option value="">Select Curriculum</option>
              {curriculums.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div className="w-full lg:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.term_id}
              onChange={(e) => handleFilterChange('term_id', e.target.value)}
              disabled={!filters.curriculum_id}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
            >
              <option value="">Select Term</option>
              {terms.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
    </div>
  );
};

export default SeeFilters;
