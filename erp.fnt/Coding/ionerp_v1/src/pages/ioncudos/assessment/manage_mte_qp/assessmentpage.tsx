import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ManageMteModal from "./ManageMteModal";
import { manageMteService } from "./manageMteService";
import type { AssessmentItem, SchoolOption } from "./responseInterface";
import DataTable from "../../../../components/Table/DataTable";

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<AssessmentItem | null>(null);

  // Filters State
  //const [schools, setSchools] = useState<any[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);

  const [programs, setPrograms] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [selectedSchool, setSelectedSchool] = useState<string>(() => {
    try { const saved = sessionStorage.getItem("manageMteQpSession"); return saved ? JSON.parse(saved).selectedSchool || "" : ""; } catch { return ""; }
  });
  const [selectedProgram, setSelectedProgram] = useState<string>(() => {
    try { const saved = sessionStorage.getItem("manageMteQpSession"); return saved ? JSON.parse(saved).selectedProgram || "" : ""; } catch { return ""; }
  });
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>(() => {
    try { const saved = sessionStorage.getItem("manageMteQpSession"); return saved ? JSON.parse(saved).selectedCurriculum || "" : ""; } catch { return ""; }
  });
  const [selectedTerm, setSelectedTerm] = useState<string>(() => {
    try { const saved = sessionStorage.getItem("manageMteQpSession"); return saved ? JSON.parse(saved).selectedTerm || "" : ""; } catch { return ""; }
  });

  const [data, setData] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    try { const saved = sessionStorage.getItem("manageMteQpSession"); return saved ? JSON.parse(saved).searchTerm || "" : ""; } catch { return ""; }
  });

  useEffect(() => {
    sessionStorage.setItem("manageMteQpSession", JSON.stringify({ selectedSchool, selectedProgram, selectedCurriculum, selectedTerm, searchTerm }));
  }, [selectedSchool, selectedProgram, selectedCurriculum, selectedTerm, searchTerm]);

  // Fetch Schools on Mount
  // useEffect(() => {
  //   const fetchSchools = async () => {
  //     try {
  //       const res = await manageMteService.getSchools();
  //       if (res.status === 1) setSchools(res.data);
  //     } catch (err) {
  //       console.error("Failed to fetch schools:", err);
  //     }
  //   };
  //   fetchSchools();
  // }, []);
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await manageMteService.getSchools();
        if (res.status === 1) setSchools(res.data || []);
      } catch (err) {
        console.error("Failed to fetch schools:", err);
      }
    };
    fetchSchools();
  }, []);

  // Fetch Programs when School changes
  useEffect(() => {
    if (selectedSchool) {
      const fetchPrograms = async () => {
        try {
          const res = await manageMteService.getPrograms(parseInt(selectedSchool));
          if (res.status === 1) setPrograms(res.data);
        } catch (err) {
          console.error("Failed to fetch programs:", err);
        }
      };
      fetchPrograms();
    } else {
      setPrograms([]);
    }
    setSelectedProgram("");
    setSelectedCurriculum("");
    setSelectedTerm("");
  }, [selectedSchool]);

  // Fetch Curriculums when Program changes
  useEffect(() => {
    if (selectedProgram) {
      const fetchCurriculums = async () => {
        try {
          const res = await manageMteService.getCurriculums(parseInt(selectedProgram));
          if (res.status === 1) setCurriculums(res.data);
        } catch (err) {
          console.error("Failed to fetch curriculums:", err);
        }
      };
      fetchCurriculums();
    } else {
      setCurriculums([]);
    }
    setSelectedCurriculum("");
    setSelectedTerm("");
  }, [selectedProgram]);

  // Fetch Terms when Curriculum changes
  useEffect(() => {
    if (selectedCurriculum) {
      const fetchTerms = async () => {
        try {
          const res = await manageMteService.getTerms(parseInt(selectedCurriculum));
          if (res.status === 1) setTerms(res.data);
        } catch (err) {
          console.error("Failed to fetch terms:", err);
        }
      };
      fetchTerms();
    } else {
      setTerms([]);
    }
    setSelectedTerm("");
  }, [selectedCurriculum]);

  // Fetch Course List
  useEffect(() => {
    const fetchCourses = async () => {
      // Only fetch when all required filters are selected
      if (!selectedSchool || !selectedProgram || !selectedCurriculum || !selectedTerm) {
        setData([]);
        return;
      }

      setLoading(true);
      try {
        const res = await manageMteService.getCourses({
          deptId: selectedSchool ? parseInt(selectedSchool) : undefined,
          pgmId: selectedProgram ? parseInt(selectedProgram) : undefined,
          batchId: selectedCurriculum ? parseInt(selectedCurriculum) : undefined,
          termId: selectedTerm ? parseInt(selectedTerm) : undefined,
        });
        if (res.status === 1) {
          setData(res.data as AssessmentItem[]);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching courses", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [selectedSchool, selectedProgram, selectedCurriculum, selectedTerm]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter((item: AssessmentItem) =>
      item.qpd_title?.toLowerCase().includes(lowerSearch) ||
      item.crs_id?.toString().includes(lowerSearch)
    );
  }, [data, searchTerm]);

  const handleManageMte = useCallback((course: AssessmentItem) => {
    setSelectedCourse(course);
    setIsManageModalOpen(true);
  }, []);

  const columnDefs = useMemo(() => [
    {
      headerName: "Sl No.",
      valueGetter: "node.rowIndex + 1",
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      suppressMovable: true,
      sortable: false,
      filter: false,
      cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "center" },
    },
    {
      headerName: "Course Code",
      field: "crs_code",
      sortable: true,
      filter: true,
      minWidth: 150,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Course Title",
      field: "qpd_title",
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 200,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Core/Elective",
      field: "course_type",
      sortable: true,
      filter: true,
      minWidth: 150,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Credits",
      field: "credits",
      sortable: true,
      filter: true,
      minWidth: 100,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Total Marks",
      field: "qpd_max_marks",
      sortable: true,
      filter: true,
      minWidth: 120,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Course Owner",
      field: "course_owner",
      sortable: true,
      filter: true,
      minWidth: 150,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Mode",
      field: "qpd_timing",
      sortable: true,
      filter: true,
      minWidth: 120,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Manage MTE QP",
      cellRenderer: (params: any) => {
        if (!params || !params.data) return null;
        return (
          <span
            className="text-blue-600 cursor-pointer hover:underline font-medium"
            onClick={() => handleManageMte(params.data)}
          >
            Manage MTE QP
          </span>
        );
      },
      minWidth: 150,
      filter: false,
      sortable: false,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Import MTE QP",
      cellRenderer: (params: any) => {
        if (!params || !params.data) return null;
        return (
          <span
            className="text-blue-600 cursor-pointer hover:underline font-medium"
            onClick={() => {
              const enhancedFilters = {
                academic_batch_id: selectedCurriculum ? parseInt(selectedCurriculum) : undefined,
                semester_id: selectedTerm ? parseInt(selectedTerm) : undefined,
                curriculum_name: curriculums.find(c => String(c.academic_batch_id) === selectedCurriculum)?.academic_batch_code || 'N/A',
                term_name: terms.find(t => String(t.semester_id) === selectedTerm)?.term_name || 'N/A'
              };
              navigate("/assessment/manage_mte_qp/import", { state: { row: params.data, filters: enhancedFilters } });
            }}
          >
            Import MTE QP
          </span>
        );
      },
      minWidth: 150,
      filter: false,
      sortable: false,
    }
  ], [handleManageMte, selectedCurriculum, selectedTerm, curriculums, terms, navigate]);



  return (
    <>
      <div className="p-6 bg-[#f4f7f9] min-h-screen font-sans">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* HEADER with search bar top-right, matching ERP PO Type layout */}
          <div className="flex justify-between items-center pb-5 border-b mb-6">
            <div>
              <h3 className="text-lg leading-6 font-medium">Mid-Term Examination (MTE) Question Paper (QP) List - Termwise</h3>
              <p className="text-sm text-gray-500 mt-1">Manage and track course-wise MTE question papers and rubrics</p>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">
                  School <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select School</option>
                  {schools.map((school) => (
                    <option key={school.dept_id} value={String(school.dept_id)}>
                      {school.dept_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">
                  Program <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={!selectedSchool}
                >
                  <option value="">Select Program</option>
                  {programs.map(p => <option key={p.pgm_id} value={p.pgm_id}>{p.pgm_title}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">
                  Curriculum <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={!selectedProgram}
                >
                  <option value="">Select Curriculum</option>
                  {curriculums.map(c => <option key={c.academic_batch_id} value={c.academic_batch_id}>{c.academic_batch_code}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">
                  Term <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={!selectedCurriculum}
                >
                  <option value="">Select Term</option>
                  {terms.map(t => <option key={t.semester_id} value={t.semester_id}>{t.term_name}</option>)}
                </select>
              </div>
              {/* Search bar aligned with dropdowns */}
            </div>
          </div>

          <style>{`
            .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
            .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
            .ag-body-viewport::-webkit-scrollbar { display: none !important; }
            .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
          `}</style>
          
          {/* Pagination disabled completely for exact consistency */}
          <div className="mt-6">
            <DataTable 
              rowData={filteredData} 
              columnDefs={columnDefs} 
              headerFilter={false}
              pagination={false}
            />
          </div>
        </div>
      </div>
      <ManageMteModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        courseData={selectedCourse}
        filters={{
          academic_batch_id: selectedCurriculum ? parseInt(selectedCurriculum) : undefined,
          academic_batch_code: selectedCurriculum ? (curriculums.find(c => String(c.academic_batch_id) === selectedCurriculum)?.academic_batch_code) : undefined,
          semester_id: selectedTerm ? parseInt(selectedTerm) : undefined,
          term_name: selectedTerm ? (terms.find(t => String(t.semester_id) === selectedTerm)?.term_name) : undefined,
        }}
      />
    </>
  );
};

export default AssessmentPage;
