import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import { ApiEndpoint } from '../../../../utils/ApiEndpoint/emsapiEndpoint';
import { FaTimes, FaCloudUploadAlt } from 'react-icons/fa';
import './cia.css';
import { toast } from 'react-toastify';

interface TargetCourse {
  crs_id: number;
  course_title: string;
  code?: string;
  section?: string;
  section_id?: string | number;
  term_id?: string | number;
  curriculum_id?: string | number;
  curriculum_name?: string;
  term_name?: string;
}

interface CiaImportModalProps {
  targetCourse: TargetCourse;
  onClose: () => void;
  onImportSuccess: () => void;
}

const CiaImportModal: React.FC<CiaImportModalProps> = ({ targetCourse, onClose, onImportSuccess }) => {
  // Source filter dropdowns
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const [sourceFilters, setSourceFilters] = useState({
    dept_id: '',
    pgm_id: '',
    curriculum_id: '',
    term_id: '',
    crs_id: '',
    section_id: ''
  });

  // Occasions list & selections
  const [occasions, setOccasions] = useState<any[]>([]);
  const [selectedAoIds, setSelectedAoIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Load departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Load occasions only when source course AND a specific section are both selected
  useEffect(() => {
    if (sourceFilters.crs_id && sourceFilters.section_id) {
      fetchOccasions();
    } else {
      setOccasions([]);
      setSelectedAoIds([]);
      setSelectAll(false);
    }
  }, [sourceFilters.crs_id, sourceFilters.section_id]);

  const fetchDepartments = async () => {
    try {
      const res = await axiosInstance.get(ApiEndpoint.assessment.schools);
      setDepartments((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const fetchPrograms = async (dept_id: string) => {
    if (!dept_id) return setPrograms([]);
    try {
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.programs}?dept_id=${dept_id}`);
      setPrograms((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const fetchCurriculums = async (pgm_id: string) => {
    if (!pgm_id) return setCurriculums([]);
    try {
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.curriculum}?pgm_id=${pgm_id}`);
      setCurriculums((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const fetchTerms = async (curriculum_id: string) => {
    if (!curriculum_id) return setTerms([]);
    try {
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.terms}?academic_batch_id=${curriculum_id}`);
      setTerms((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const fetchCourses = async (term_id: string) => {
    if (!term_id) return setCourses([]);
    try {
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.course_dropdown}?semester_id=${term_id}`);
      setCourses((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const fetchSections = async (crs_id: string, term_id: string) => {
    if (!crs_id || !term_id) return setSections([]);
    try {
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.sections}?semester_id=${term_id}&course_id=${crs_id}`);
      setSections((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const fetchOccasions = async () => {
    try {
      const params = new URLSearchParams();
      params.append('semester_id', sourceFilters.term_id);
      params.append('course_id', sourceFilters.crs_id);
      // section_id is required by the backend
      params.append('section_id', sourceFilters.section_id);
      const res = await axiosInstance.get(
        `/assessments/manage_cia_occasion/list-occasions-for-import?${params.toString()}`
      );
      const data = (res.data as any).data || [];
      setOccasions(data);
      setSelectedAoIds([]);
      setSelectAll(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load occasions');
    }
  };

  const handleSourceFilterChange = (key: string, value: string) => {
    const newFilters = { ...sourceFilters, [key]: value };
    if (key === 'dept_id') {
      newFilters.pgm_id = ''; newFilters.curriculum_id = ''; newFilters.term_id = '';
      newFilters.crs_id = ''; newFilters.section_id = '';
      setPrograms([]); setCurriculums([]); setTerms([]); setCourses([]); setSections([]);
      setOccasions([]);
      if (value) fetchPrograms(value);
    }
    if (key === 'pgm_id') {
      newFilters.curriculum_id = ''; newFilters.term_id = ''; newFilters.crs_id = ''; newFilters.section_id = '';
      setCurriculums([]); setTerms([]); setCourses([]); setSections([]); setOccasions([]);
      if (value) fetchCurriculums(value);
    }
    if (key === 'curriculum_id') {
      newFilters.term_id = ''; newFilters.crs_id = ''; newFilters.section_id = '';
      setTerms([]); setCourses([]); setSections([]); setOccasions([]);
      if (value) fetchTerms(value);
    }
    if (key === 'term_id') {
      newFilters.crs_id = ''; newFilters.section_id = '';
      setCourses([]); setSections([]); setOccasions([]);
      if (value) fetchCourses(value);
    }
    if (key === 'crs_id') {
      newFilters.section_id = '';
      setSections([]);
      if (value) fetchSections(value, sourceFilters.term_id);
    }
    setSourceFilters(newFilters);
  };

  const handleSelectAo = (ao_id: number, checked: boolean) => {
    if (checked) {
      setSelectedAoIds(prev => [...prev, ao_id]);
    } else {
      setSelectedAoIds(prev => prev.filter(id => id !== ao_id));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedAoIds(checked ? occasions.map(o => o.ao_id) : []);
  };

  const handleImport = async () => {
    if (selectedAoIds.length === 0) {
      toast.warning('Please select at least one occasion to import');
      return;
    }
    if (!sourceFilters.crs_id) {
      toast.warning('Please select a source course');
      return;
    }
    setIsImporting(true);
    try {
      const payload = {
        course_id: targetCourse.crs_id,
        section_id: targetCourse.section_id ? Number(targetCourse.section_id) : 0,
        source_course_id: Number(sourceFilters.crs_id),
        occasion_ids: selectedAoIds
      };
      await axiosInstance.post('/assessments/manage_cia_occasion/import', payload);
      toast.success('Occasions imported successfully!');
      onImportSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to import occasions');
    } finally {
      setIsImporting(false);
    }
  };

  // Group occasions by section_name
  const groupedOccasions: Record<string, any[]> = {};
  for (const o of occasions) {
    const key = o.section_name || 'Default';
    if (!groupedOccasions[key]) groupedOccasions[key] = [];
    groupedOccasions[key].push(o);
  }

  const selectLabel = (
    <span className="font-bold text-[11px] tracking-widest text-gray-500 uppercase">Select All</span>
  );

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-lg shadow-2xl w-full flex flex-col"
        style={{ maxWidth: 900, maxHeight: '90vh' }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#2e4a5a] rounded-t-lg shrink-0">
          <h3 className="text-[13px] font-bold text-white tracking-wide">
            Import Internal Assessment(IA) Occasions
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <FaTimes size={16} />
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Import TO Course Details */}
          <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
            <p className="text-[12px] font-bold text-gray-700 mb-4 underline underline-offset-2">
              Import to Course Details
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-[12px]">
              <div>
                <span className="text-gray-600 font-semibold">Curriculum: </span>
                <span className="text-[#437880] font-bold">{targetCourse.curriculum_name || '—'}</span>
              </div>
              <div>
                <span className="text-gray-600 font-semibold">Term Name: </span>
                <span className="text-[#437880] font-bold">{targetCourse.term_name || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600 font-semibold">Course Name: </span>
                <span className="text-[#437880] font-bold">{targetCourse.course_title}</span>
              </div>
              <div>
                <span className="text-gray-600 font-semibold">Section/Division: </span>
                <span className="text-[#437880] font-bold">{targetCourse.section || 'All'}</span>
              </div>
            </div>
          </div>

          {/* Import FROM Course Details */}
          <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
            <p className="text-[12px] font-bold text-gray-700 mb-4 underline underline-offset-2">
              Import From Course Details
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Department */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600">
                  Department<span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm focus:border-[#437880] focus:ring-1 focus:ring-[#437880]"
                  value={sourceFilters.dept_id}
                  onChange={e => handleSourceFilterChange('dept_id', e.target.value)}
                >
                  <option value="">Select</option>
                  {departments.map(d => (
                    <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
                  ))}
                </select>
              </div>
              {/* Program */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600">
                  Program<span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm focus:border-[#437880] focus:ring-1 focus:ring-[#437880]"
                  value={sourceFilters.pgm_id}
                  onChange={e => handleSourceFilterChange('pgm_id', e.target.value)}
                >
                  <option value="">Select</option>
                  {programs.map(p => (
                    <option key={p.pgm_id} value={p.pgm_id}>{p.pgm_title}</option>
                  ))}
                </select>
              </div>
              {/* Curriculum */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600">
                  Curriculum<span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm focus:border-[#437880] focus:ring-1 focus:ring-[#437880]"
                  value={sourceFilters.curriculum_id}
                  onChange={e => handleSourceFilterChange('curriculum_id', e.target.value)}
                >
                  <option value="">Select</option>
                  {curriculums.map(c => (
                    <option key={c.academic_batch_id} value={c.academic_batch_id}>{c.academic_batch_code}</option>
                  ))}
                </select>
              </div>
              {/* Term */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600">
                  Term<span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm focus:border-[#437880] focus:ring-1 focus:ring-[#437880]"
                  value={sourceFilters.term_id}
                  onChange={e => handleSourceFilterChange('term_id', e.target.value)}
                >
                  <option value="">Select</option>
                  {terms.map(t => (
                    <option key={t.semester_id} value={t.semester_id}>{t.term_name}</option>
                  ))}
                </select>
              </div>
              {/* Course */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600">
                  Course<span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm focus:border-[#437880] focus:ring-1 focus:ring-[#437880]"
                  value={sourceFilters.crs_id}
                  onChange={e => handleSourceFilterChange('crs_id', e.target.value)}
                >
                  <option value="">Select</option>
                  {courses.map(c => {
                    const id = c.crs_id || c.id;
                    const code = c.crs_code || c.code;
                    const title = c.crs_title || c.course_title || c.name;
                    return (
                      <option key={id} value={id}>
                        {code ? `${code} - ${title}` : title}
                      </option>
                    );
                  })}
                </select>
              </div>
              {/* Section */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600">Section<span className="text-red-500">*</span></label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm focus:border-[#437880] focus:ring-1 focus:ring-[#437880]"
                  value={sourceFilters.section_id}
                  onChange={e => handleSourceFilterChange('section_id', e.target.value)}
                >
                  <option value="">All</option>
                  {sections.map(s => (
                    <option key={s.section_id} value={s.section_id}>{s.section_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* IA Occasion List */}
          {occasions.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-[#f8fafc] border-b border-gray-200">
                <span className="text-[12px] font-bold text-gray-700 underline underline-offset-2">
                  IA Occasion List
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead className="bg-[#f2f4f6]">
                    <tr>
                      <th className="px-4 py-3 border-b border-gray-200 text-left w-32">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={e => handleSelectAll(e.target.checked)}
                            className="rounded border-gray-400 text-[#437880] focus:ring-[#437880] cursor-pointer"
                          />
                          <span
                            className="text-[11px] font-bold text-gray-500 cursor-pointer hover:text-[#437880] transition-colors"
                            onClick={() => handleSelectAll(!selectAll)}
                          >
                            Select All
                          </span>
                        </div>
                      </th>
                      <th className="px-4 py-3 border-b border-gray-200 text-left font-bold text-[11px] text-gray-500 uppercase tracking-wider">AO Name</th>
                      <th className="px-4 py-3 border-b border-gray-200 text-left font-bold text-[11px] text-gray-500 uppercase tracking-wider">AO Method</th>
                      <th className="px-4 py-3 border-b border-gray-200 text-left font-bold text-[11px] text-gray-500 uppercase tracking-wider">Assessment Type</th>
                      <th className="px-4 py-3 border-b border-gray-200 text-left font-bold text-[11px] text-gray-500 uppercase tracking-wider">Max Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedOccasions).map(([sectionName, items]) => (
                      <React.Fragment key={sectionName}>
                        {/* Section header row */}
                        <tr className="bg-gray-100">
                          <td
                            colSpan={5}
                            className="px-5 py-2 text-[11px] font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200"
                          >
                            Section {sectionName}
                          </td>
                        </tr>
                        {items.map((ao: any) => {
                          const isSelected = selectedAoIds.includes(ao.ao_id);
                          return (
                            <tr
                              key={ao.ao_id}
                              className={`border-b border-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-sky-50' : 'hover:bg-gray-50'}`}
                              onClick={() => handleSelectAo(ao.ao_id, !isSelected)}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={e => {
                                    e.stopPropagation();
                                    handleSelectAo(ao.ao_id, e.target.checked);
                                  }}
                                  className="rounded border-gray-400 text-[#437880] focus:ring-[#437880] cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-800">
                                {ao.ao_name}
                                {ao.main_occasion_name && (
                                  <span className="ml-2 text-[10px] px-2 py-0.5 bg-[#eaf4f6] text-[#437880] rounded font-bold border border-[#c8e6ea]">
                                    {ao.main_occasion_name}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-600">{ao.ao_method}</td>
                              <td className="px-4 py-3 text-gray-600">{ao.assessment_type}</td>
                              <td className="px-4 py-3 text-gray-700 font-bold">{ao.max_marks}</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-2 bg-[#f8fafc] border-t border-gray-100 text-[11px] text-gray-500">
                Showing 1 to {occasions.length} of {occasions.length} entries
                {selectedAoIds.length > 0 && (
                  <span className="ml-4 font-bold text-[#437880]">
                    · {selectedAoIds.length} selected
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Prompt user to select a section when course is chosen but section is not */}
          {sourceFilters.crs_id && !sourceFilters.section_id && (
            <div className="text-center py-8 text-[12px] text-amber-600 border border-dashed border-amber-200 rounded-lg bg-amber-50">
              Please select a <strong>Section</strong> to load the occasion list.
            </div>
          )}

          {/* Empty state when section is selected but no occasions found */}
          {sourceFilters.crs_id && sourceFilters.section_id && occasions.length === 0 && (
            <div className="text-center py-8 text-[12px] text-gray-400 border border-dashed border-gray-200 rounded-lg">
              No assessment occasions found for the selected course &amp; section.
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-[#f8fafc] rounded-b-lg shrink-0">
          <button
            onClick={handleImport}
            disabled={isImporting || selectedAoIds.length === 0}
            className="px-6 py-2 bg-[#437880] text-white rounded font-bold text-[12px] hover:bg-[#386269] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCloudUploadAlt />
            {isImporting ? 'Importing...' : 'Import'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#d9534f] text-white rounded font-bold text-[12px] hover:bg-[#c9302c] transition-all shadow-sm"
          >
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CiaImportModal;
