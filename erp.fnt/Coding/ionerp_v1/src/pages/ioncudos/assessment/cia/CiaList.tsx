import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../../../utils/api';
import { ApiEndpoint } from '../../../../utils/ApiEndpoint/emsapiEndpoint';
import './cia.css';
import { GoPencil } from 'react-icons/go';
import { FaCheckCircle } from 'react-icons/fa';
import DataTable from '../../../../components/Table/DataTable';
import CiaMainOccasion from './CiaMainOccasion';
import CiaImportModal from './CiaImportModal';

const CiaList = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('cia_filters');
    return saved ? JSON.parse(saved) : {
      dept_id: '',
      pgm_id: '',
      curriculum_id: '',
      term_id: '',
      crs_id: '',
      section_id: ''
    };
  });

  const [tableData, setTableData] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [importCourse, setImportCourse] = useState<any | null>(null);

  useEffect(() => {
    fetchSchools();
    if (filters.dept_id) fetchPrograms(filters.dept_id);
    if (filters.pgm_id) fetchCurriculums(filters.pgm_id);
    if (filters.curriculum_id) fetchTerms(filters.curriculum_id);
    if (filters.term_id) fetchCourses(filters.term_id);
    if (filters.crs_id && filters.term_id) fetchSections(filters.crs_id, filters.term_id);
    if (filters.term_id) fetchTableData();
  }, []);

  useEffect(() => {
    localStorage.setItem('cia_filters', JSON.stringify(filters));
  }, [filters]);

  const fetchSchools = async () => {
    try {
      const res = await axiosInstance.get(ApiEndpoint.assessment.schools);
      setSchools((res.data as any).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrograms = async (dept_id: string) => {
    if (!dept_id) return setPrograms([]);
    try {
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.programs}?dept_id=${dept_id}`);
      setPrograms((res.data as any).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurriculums = async (pgm_id: string) => {
    if (!pgm_id) return setCurriculums([]);
    try {
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.curriculum}?pgm_id=${pgm_id}`);
      setCurriculums((res.data as any).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTerms = async (curriculum_id: string) => {
    if (!curriculum_id) return setTerms([]);
    try {
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.terms}?academic_batch_id=${curriculum_id}`);
      setTerms((res.data as any).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourses = async (term_id: string) => {
    if (!term_id) return setCourses([]);
    try {
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.course_dropdown}?semester_id=${term_id}`);
      setCourses((res.data as any).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSections = async (crs_id: string, term_id: string) => {
    if (!crs_id || !term_id) return setSections([]);
    try {
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.sections}?semester_id=${term_id}&course_id=${crs_id}`);
      setSections((res.data as any).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    // Reset dependent filters
    if (key === 'dept_id') {
      newFilters.pgm_id = ''; newFilters.curriculum_id = ''; newFilters.term_id = ''; newFilters.crs_id = ''; newFilters.section_id = '';
      fetchPrograms(value);
    }
    if (key === 'pgm_id') {
      newFilters.curriculum_id = ''; newFilters.term_id = ''; newFilters.crs_id = ''; newFilters.section_id = '';
      fetchCurriculums(value);
    }
    if (key === 'curriculum_id') {
      newFilters.term_id = ''; newFilters.crs_id = ''; newFilters.section_id = '';
      fetchTerms(value);
    }
    if (key === 'term_id') {
      newFilters.crs_id = ''; newFilters.section_id = '';
      fetchCourses(value);
    }
    if (key === 'crs_id') {
      newFilters.section_id = '';
      fetchSections(value, filters.term_id);
    }
    setFilters(newFilters);
  };

  const fetchTableData = async () => {
    if (!filters.term_id) return;
    try {
      // Changed course_id to crs_id as per backend requirement for strict filtering
      const res = await axiosInstance.get(`${ApiEndpoint.assessment.courses}?semester_id=${filters.term_id}${filters.crs_id ? `&crs_id=${filters.crs_id}` : ''}${filters.section_id ? `&section_id=${filters.section_id}` : ''}`);
      const data = (res.data as any).data || [];
      setTableData(data.map((item: any, idx: number) => ({
        ...item,
        idX: `${item.code}_${item.section}_${idx}`
      })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (filters.term_id) {
      fetchTableData();
    }
  }, [filters.term_id, filters.crs_id, filters.section_id]);

  const columnDefs = useMemo(() => [
    { headerName: "Sl.No", valueGetter: "node.rowIndex + 1", width: 70, minWidth: 70, cellStyle: { textAlign: "center" }, pinned: 'left' },
    { headerName: "Section", field: "section", width: 100, minWidth: 100 },
    { headerName: "Code", field: "code", width: 120, minWidth: 120 },
    { headerName: "Course Title", field: "course_title", width: 250, minWidth: 200, flex: 2 },
    { headerName: "Mode", field: "mode", width: 120, minWidth: 120 },
    { headerName: "Course Type", field: "course_type", width: 150, minWidth: 130 },
    { headerName: "Instructor", field: "instructor", width: 180, minWidth: 150 },
    { 
      headerName: "Manage CCE", 
      field: "manage_cce", 
      width: 180,
      minWidth: 180,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <button 
            className="text-blue-500 hover:text-blue-700 font-semibold transition-colors underline-offset-4 hover:underline"
            onClick={() => setSelectedCourse({ ...params.data, term_id: filters.term_id, section_id: params.data.section_id || filters.section_id || '' })}
          >
            Add / Edit
          </button>
        </div>
      )
    },
    { 
      headerName: "Import Occasion", 
      field: "import_occasion", 
      width: 200,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <button 
            className="text-blue-500 hover:text-blue-700 font-semibold transition-colors underline-offset-4 hover:underline"
            onClick={() => {
              const curriculumObj = curriculums.find((c: any) => c.academic_batch_id?.toString() === filters.curriculum_id?.toString());
              const termObj = terms.find((t: any) => t.semester_id?.toString() === filters.term_id?.toString());
              setImportCourse({
                crs_id: params.data.crs_id,
                course_title: params.data.course_title,
                code: params.data.code,
                section: params.data.section,
                section_id: params.data.section_id || filters.section_id || '',
                term_id: filters.term_id || '',
                curriculum_id: filters.curriculum_id || '',
                curriculum_name: curriculumObj?.academic_batch_code || '',
                term_name: termObj?.term_name || '',
              });
              setImportModalOpen(true);
            }}
          >
            Import Occasions
          </button>
        </div>
      )
    },
    { 
      headerName: "Status", 
      field: "status", 
      width: 160,
      minWidth: 160,
      cellRenderer: (params: any) => {
        const row = params.data;
        return (
          <div className="flex items-center justify-center h-full">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm ${row.satus === 1 ? 'bg-[#5cb85c]' : 'bg-[#f0ad4e]'}`}>
              {row.satus === 1 ? 'Initiated' : 'Pending'}
            </span>
          </div>
        );
      }
    }
  ], [filters.term_id, filters.curriculum_id, curriculums, terms]);

  if (selectedCourse) {
    return <CiaMainOccasion data={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="">
      <h3 className='text-lg font-semibold pb-5 text-[#437880]'>Manage CIA Occasions</h3>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">School <span className="text-red-500">*</span></label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={filters.dept_id} onChange={e => handleFilterChange('dept_id', e.target.value)}>
              <option value="">Select School</option>
              {schools.map(s => <option key={s.dept_id} value={s.dept_id}>{s.dept_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Program <span className="text-red-500">*</span></label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={filters.pgm_id} onChange={e => handleFilterChange('pgm_id', e.target.value)}>
              <option value="">Select Program</option>
              {programs.map(p => <option key={p.pgm_id} value={p.pgm_id}>{p.pgm_title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Curriculum <span className="text-red-500">*</span></label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={filters.curriculum_id} onChange={e => handleFilterChange('curriculum_id', e.target.value)}>
              <option value="">Select Curriculum</option>
              {curriculums.map(c => <option key={c.academic_batch_id} value={c.academic_batch_id}>{c.academic_batch_code}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Term <span className="text-red-500">*</span></label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={filters.term_id} onChange={e => handleFilterChange('term_id', e.target.value)}>
              <option value="">Select Term</option>
              {terms.map(t => <option key={t.semester_id} value={t.semester_id}>{t.term_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Course <span className="text-red-500">*</span></label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={filters.crs_id} onChange={e => handleFilterChange('crs_id', e.target.value)}>
              <option value="">Select Course</option>
              {courses.map(c => {
                const id = c.crs_id || c.id || c.course_id;
                const code = c.code || c.crs_code || c.course_code;
                const title = c.course_title || c.crs_title || c.course_name || c.name;
                return (
                  <option key={id} value={id}>
                    {code ? `${code} - ` : ''}{title}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Section</label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={filters.section_id} onChange={e => handleFilterChange('section_id', e.target.value)}>
              <option value="">All</option>
              {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.section_name}</option>)}
            </select>
          </div>
        </div>
      </div>
        
      <div className="mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-base font-bold text-[#437880] tracking-tight pl-1">Cia course list</h3>
      </div>

      <DataTable
        columnDefs={columnDefs}
        rowData={tableData}
        showAddButton={false}
        showExportButton={false}
        headerFilter={false}
        pagination={true}
        pageSize={10}
        autoHeight={true}
      />

      {isImportModalOpen && importCourse && (
        <CiaImportModal
          targetCourse={importCourse}
          onClose={() => { setImportModalOpen(false); setImportCourse(null); }}
          onImportSuccess={() => fetchTableData()}
        />
      )}
    </div>
  );
};

export default CiaList;
