import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import '../../assessment/cia/cia.css';
import './CiaDataImport.css';
import { FaArrowLeft } from 'react-icons/fa';
import DataTable from '../../../../components/Table/DataTable';
import CiaOccasionModal from './CiaOccasionModal';
import CiaMarksEntry from './CiaMarksEntry';
import CiaReportView from './CiaReportView';
import CiaFinalisePage from './CiaFinalisePage';

/* ----  Status derivation (UI-only) ---- */
const deriveStatus = (row: any): 'Completed' | 'In Progress' | 'Pending' => {
  const total = row.total_students ?? 0;
  const entered = row.marks_entered ?? 0;
  if (total === 0 || entered === 0) return 'Pending';
  if (entered >= total) return 'Completed';
  return 'In Progress';
};

const StatusBadge: React.FC<{ status: ReturnType<typeof deriveStatus> }> = ({ status }) => {
  const cls =
    status === 'Completed' ? 'cce-badge cce-badge-completed' :
    status === 'In Progress' ? 'cce-badge cce-badge-inprogress' :
    'cce-badge cce-badge-pending';
  return <span className={cls}><span className="cce-badge-dot" />{status}</span>;
};

/* ====================================================
   MAIN COMPONENT
   ==================================================== */
const CceDataImportList: React.FC = () => {
  /* --- filter state --- */
  const [schools, setSchools] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem('cce_data_import_filters');
    return saved ? JSON.parse(saved) : {
      dept_id: '',
      pgm_id: '',
      curriculum_id: '',
      term_id: ''
    };
  });

  useEffect(() => {
    sessionStorage.setItem('cce_data_import_filters', JSON.stringify(filters));
  }, [filters]);

  // Handle cross-module filter initialization
  useEffect(() => {
    if (filters.dept_id) {
       fetchPrograms(filters.dept_id);
       if (filters.pgm_id) {
          fetchCurriculums(filters.pgm_id);
          if (filters.curriculum_id) {
             fetchTerms(filters.curriculum_id);
             if (filters.term_id) {
                fetchCourses(filters.term_id);
             }
          }
       }
    }
  }, []); // Run once on mount to handle session-based filters

  const [tableData, setTableData] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  /* --- sub-page / modal state --- */
  const [occasionRow, setOccasionRow] = useState<any | null>(null);
  const [marksRow, setMarksRow] = useState<any | null>(null);
  const [reportRow, setReportRow] = useState<any | null>(null);
  const [finaliseRow, setFinaliseRow] = useState<any | null>(null);

  /* ---- Filter fetching ---- */
  useEffect(() => { fetchSchools(); }, []);

  const fetchSchools = async () => {
    try {
      const res = await axiosInstance.get('/attainment/cce_data_import/schools');
      setSchools((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const fetchPrograms = async (dept_id: string) => {
    if (!dept_id) return setPrograms([]);
    try {
      const res = await axiosInstance.get(`/attainment/cce_data_import/programs?dept_id=${dept_id}`);
      setPrograms((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const fetchCurriculums = async (pgm_id: string) => {
    if (!pgm_id) return setCurriculums([]);
    try {
      const res = await axiosInstance.get(`/attainment/cce_data_import/curriculum?pgm_id=${pgm_id}`);
      setCurriculums((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const fetchTerms = async (curriculum_id: string) => {
    if (!curriculum_id) return setTerms([]);
    try {
      const res = await axiosInstance.get(`/attainment/cce_data_import/terms?academic_batch_id=${curriculum_id}`);
      setTerms((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const fetchCourses = async (term_id: string) => {
    if (!term_id) { setCourses([]); return; }
    try {
      const res = await axiosInstance.get(`/attainment/cce_data_import/courses?semester_id=${term_id}`);
      setCourses((res.data as any).data || []);
    } catch (err) { console.error(err); }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
    if (key === 'dept_id')       { fetchPrograms(value); setCurriculums([]); setTerms([]); setCourses([]); }
    if (key === 'pgm_id') {
      fetchCurriculums(value);
      setTerms([]);
      setCourses([]);
      (window as any)._currentProgramId = value;
    }
    if (key === 'curriculum_id') {
      fetchTerms(value);
      setCourses([]);
      (window as any)._currentCurriculumId = value;
    }
    if (key === 'term_id') {
      fetchCourses(value);
      (window as any)._currentTermId = value;
    }
    
    // Also set section if available in row context elsewhere
    if (key === 'section_id') {
       (window as any)._currentSectionId = value;
    }
  };

  /* ---- Table data = all courses for selected term ---- */
  useEffect(() => { setTableData(courses); }, [courses]);

  /* ---- Search filter ---- */
  const displayData = tableData.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.code || '').toLowerCase().includes(s) ||
      (r.course_title || '').toLowerCase().includes(s) ||
      (r.instructor || '').toLowerCase().includes(s)
    );
  });

  /* ---- Sub-page rendering ---- */
  if (marksRow) {
    return (
      <CiaMarksEntry
        data={{ ...marksRow, term_id: filters.term_id, program_id: filters.pgm_id, curriculum_id: filters.curriculum_id }}
        onBack={() => setMarksRow(null)}
      />
    );
  }
  if (reportRow) {
    return (
      <CiaReportView
        data={{ ...reportRow, term_id: filters.term_id }}
        onBack={() => setReportRow(null)}
      />
    );
  }
  if (finaliseRow) {
    return (
      <CiaFinalisePage
        data={{ ...finaliseRow, term_id: filters.term_id }}
        onBack={() => setFinaliseRow(null)}
      />
    );
  }

  // --- Main list render ---
  return (
    <div className="">
      <h3 className="text-lg font-semibold pb-5 text-[#437880]">
        CCE Data Entry / Import List
      </h3>

      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        </div>
      </div>

      <div className="mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-base font-bold text-[#437880] tracking-tight pl-1">Cce course list</h3>
      </div>
      
      <DataTable
        columnDefs={[
          { headerName: "Sl No", valueGetter: "node.rowIndex + 1", width: 70, minWidth: 70, cellStyle: { textAlign: "center" } },
          { headerName: "Section", field: "section", width: 90, minWidth: 90 },
          { headerName: "Code", field: "code", width: 100, minWidth: 100 },
          { headerName: "Course Title", field: "course_title", flex: 2, minWidth: 250 },
          { headerName: "Core / Elective", field: "course_type", width: 130, minWidth: 130 },
          { headerName: "Credits", field: "credits", width: 90, minWidth: 90 },
          { headerName: "Total Marks", field: "total_marks", width: 110, minWidth: 110 },
          { headerName: "Instructor", field: "instructor", flex: 1.5, minWidth: 180 },
          { headerName: "Mode", field: "mode", width: 90, minWidth: 90 },
          { 
            headerName: "View CCE Details", 
            field: "view_details",
            width: 180,
            minWidth: 180,
            cellRenderer: (params: any) => (
              <button className="text-[11px] font-bold text-[#437880] hover:underline uppercase tracking-tight" onClick={() => {
                const curObj = curriculums.find(c => String(c.academic_batch_id) === String(filters.curriculum_id));
                const trmObj = terms.find(t => String(t.semester_id) === String(filters.term_id));
                setOccasionRow({ 
                  ...params.data, 
                  term_id: filters.term_id,
                  curriculum_code: curObj?.academic_batch_code || 'N/A',
                  term_name: trmObj?.semester_code || 'N/A'
                });
              }}>CCE Occasions</button>
            )
          },
          {
            headerName: "Manage CCE Marks",
            field: "manage_marks",
            width: 200,
            minWidth: 200,
            cellRenderer: (params: any) => (
              <button className="text-[11px] font-bold text-emerald-600 hover:underline uppercase tracking-tight" onClick={() => setMarksRow(params.data)}>Add / Modify Marks</button>
            )
          },
          {
            headerName: "Status",
            field: "status",
            width: 140,
            minWidth: 140,
            cellRenderer: (params: any) => <StatusBadge status={deriveStatus(params.data)} />
          },
          {
            headerName: "Report",
            field: "report",
            width: 150,
            minWidth: 150,
            cellRenderer: (params: any) => (
              <button className="text-[11px] font-bold text-violet-600 hover:underline uppercase tracking-tight" onClick={() => setReportRow(params.data)}>View Report</button>
            )
          },
          {
            headerName: "Finalise",
            field: "finalise",
            width: 170,
            minWidth: 170,
            cellRenderer: (params: any) => (
              <button className="text-[11px] font-bold text-sky-600 hover:underline uppercase tracking-tight" onClick={() => setFinaliseRow(params.data)}>View & Finalise</button>
            )
          }
        ]}
        rowData={displayData}
        showAddButton={false}
        showExportButton={false}
        headerFilter={true}
        pagination={true}
        pageSize={10}
        autoHeight={true}
      />

      {occasionRow && (
        <CiaOccasionModal
          data={occasionRow}
          onClose={() => setOccasionRow(null)}
        />
      )}
    </div>
  );
};

export default CceDataImportList;
