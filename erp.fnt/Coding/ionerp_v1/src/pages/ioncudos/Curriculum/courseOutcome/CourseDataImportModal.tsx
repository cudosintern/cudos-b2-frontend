import React, { useState, useEffect } from "react";
import { FaTimes, FaDownload, FaCheck, FaSpinner } from "react-icons/fa";
import axiosInstance from "../../../../utils/api";
import { importCourseData } from "./courseOutcomeSchema";
import { toast } from "react-toastify";


interface Props {
  targetContext: {
    curriculum: string;
    term: string;
    courseName: string;
    courseMode: string;
    target_course_id: number;
    target_batch_id: number;
    target_semester_id: number;
  };
  onClose: () => void;
  onSuccess?: () => void;
  existingCOCount?: number;
}

interface ImportItems {
  cos: boolean;
  coPo: boolean;
  topics: boolean;
  tlo: boolean;
  tloCo: boolean;
}

const CourseDataImportModal: React.FC<Props> = ({ targetContext, onClose, onSuccess, existingCOCount = 0 }) => {
  const [importLoading, setImportLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    school_id: '',
    program_id: '',
    curriculum_id: '',
    semester_id: '',
    course_id: ''
  });

  const [dropdowns, setDropdowns] = useState<{
    schools: any[];
    programs: any[];
    curriculums: any[];
    semesters: any[];
    courses: any[];
  }>({
    schools: [],
    programs: [],
    curriculums: [],
    semesters: [],
    courses: []
  });

  const [loading, setLoading] = useState({
    school: false,
    program: false,
    curriculum: false,
    semester: false,
    course: false
  });


  const [selectedItems, setSelectedItems] = useState<ImportItems>({
    cos: false,
    coPo: false,
    topics: false,
    tlo: false,
    tloCo: false
  });

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [pendingSelection, setPendingSelection] = useState<keyof ImportItems | null>(null);

  const warningMessages: Partial<Record<keyof ImportItems, string>> = {
    cos: "COs are already defined for this Course, hence all COs will be deleted (erased) and new set of COs will be imported to the selected Course.",
    coPo: "CO to PO Mapping Data already exist for this Course, hence all Mapping Data will be removed (erased) and new set of CO to PO Mapping Data will be imported."
  };

  // Reset checkboxes when course changes
  useEffect(() => {
    if (filters.course_id) {
      setSelectedItems({
        cos: false,
        coPo: false,
        topics: false,
        tlo: false,
        tloCo: false
      });
    }
  }, [filters.course_id]);

  const mapDropdown = (data: any[]) => {
    if (!Array.isArray(data)) return [];
    const seen = new Set();
    return data.map((item: any) => {
      const id = item.dept_id ?? item.pgm_id ?? item.academic_batch_id ?? item.semester_id ?? item.crs_id ?? item.id ?? item.value;
      let label = item.dept_name ?? item.pgm_title ?? item.academic_batch_code ?? item.term_name ?? item.name ?? item.label;
      
      // Specialized label for courses
      if (item.crs_id) {
        label = `${item.code} - ${item.course_title}`;
      }
      
      return { id, label };
    }).filter(item => {
      const idStr = String(item.id);
      if (!item.id || seen.has(idStr)) return false;
      seen.add(idStr);
      return true;
    });
  };

  // 1. Load Schools
  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(prev => ({ ...prev, school: true }));
      try {
        const res = await axiosInstance.get<any>("/assessments/manage_cia_occasion/schools");
        if (res.data?.status && res.data?.data) {
          setDropdowns(prev => ({ ...prev, schools: mapDropdown(res.data.data) }));
        }
      } catch (err) {
        console.error("Failed to fetch schools", err);
      } finally {
        setLoading(prev => ({ ...prev, school: false }));
      }
    };
    fetchSchools();
  }, []);

  // 2. Load Programs
  useEffect(() => {
    if (!filters.school_id) return;
    const fetchPrograms = async () => {
      setLoading(prev => ({ ...prev, program: true }));
      try {
        const res = await axiosInstance.get<any>(`/assessments/manage_cia_occasion/programs?dept_id=${filters.school_id}`);
        const rawData = res.data?.data || [];
        setDropdowns(prev => ({ ...prev, programs: mapDropdown(rawData) }));
      } catch (err) {
        console.error("Failed to fetch programs", err);
      } finally {
        setLoading(prev => ({ ...prev, program: false }));
      }
    };
    fetchPrograms();
  }, [filters.school_id]);

  // 3. Load Curriculums
  useEffect(() => {
    if (!filters.program_id) return;
    const fetchCurriculums = async () => {
      setLoading(prev => ({ ...prev, curriculum: true }));
      try {
        // Updated to use the requested endpoint
        const res = await axiosInstance.get<any>(`/assessments/manage_cia_occasion/curriculum?pgm_id=${filters.program_id}`);
        const rawData = res.data?.curriculums || res.data?.data || res.data || [];
        setDropdowns(prev => ({ ...prev, curriculums: mapDropdown(rawData) }));
      } catch (err) {
        console.error("Failed to fetch curriculums", err);
      } finally {
        setLoading(prev => ({ ...prev, curriculum: false }));
      }
    };
    fetchCurriculums();
  }, [filters.program_id]);

  // 4. Load Semesters
  useEffect(() => {
    if (!filters.curriculum_id) return;
    const fetchSemesters = async () => {
      setLoading(prev => ({ ...prev, semester: true }));
      try {
        const res = await axiosInstance.get<any>(`assessments/manage_cia_occasion/terms?academic_batch_id=${filters.curriculum_id}`);
        const data = res.data?.terms || res.data?.data || res.data || [];
        setDropdowns(prev => ({ ...prev, semesters: mapDropdown(data) }));
      } catch (err) {
        console.error("Failed to fetch semesters", err);
      } finally {
        setLoading(prev => ({ ...prev, semester: false }));
      }
    };
    fetchSemesters();
  }, [filters.curriculum_id]);

  // 5. Load Courses (only those with CO data)
  useEffect(() => {
    if (!filters.semester_id) return;
    const fetchCourses = async () => {
      setLoading(prev => ({ ...prev, course: true }));
      try {
        // Fetch all courses for this semester
        const [coursesRes, coRes] = await Promise.all([
          axiosInstance.get<any>(`/assessments/manage_cia_occasion/courses?semester_id=${filters.semester_id}`),
          axiosInstance.get<any>(`/course-outcome/courses-with-co?semester_id=${filters.semester_id}`)
        ]);

        const rawData = coursesRes.data?.data || [];
        const courseIdsWithCo: number[] = coRes.data?.data || [];

        // Filter: only courses that have CO data AND are not the current target course
        const filtered = rawData.filter((item: any) => {
          const crsId = item.crs_id ?? item.id;
          return courseIdsWithCo.includes(crsId) && crsId !== targetContext.target_course_id;
        });

        setDropdowns(prev => ({ ...prev, courses: mapDropdown(filtered) }));
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(prev => ({ ...prev, course: false }));
      }
    };
    fetchCourses();
  }, [filters.semester_id, targetContext.courseMode]);


  // Cascading Reset Handlers
  const handleSchoolChange = (val: string) => {
    setFilters({
      school_id: val,
      program_id: '',
      curriculum_id: '',
      semester_id: '',
      course_id: ''
    });
    setDropdowns(prev => ({
      ...prev,
      programs: [],
      curriculums: [],
      semesters: [],
      courses: []
    }));
  };

  const handleProgramChange = (val: string) => {
    setFilters(prev => ({
      ...prev,
      program_id: val,
      curriculum_id: '',
      semester_id: '',
      course_id: ''
    }));
    setDropdowns(prev => ({
      ...prev,
      curriculums: [],
      semesters: [],
      courses: []
    }));
  };

  const handleCurriculumChange = (val: string) => {
    setFilters(prev => ({
      ...prev,
      curriculum_id: val,
      semester_id: '',
      course_id: ''
    }));
    setDropdowns(prev => ({
      ...prev,
      semesters: [],
      courses: []
    }));
  };

  const handleTermChange = (val: string) => {
    setFilters(prev => ({
      ...prev,
      semester_id: val,
      course_id: ''
    }));
    setDropdowns(prev => ({
      ...prev,
      courses: []
    }));
  };

  const handleCourseChange = (val: string) => {
    setFilters(prev => ({
      ...prev,
      course_id: val
    }));
  };


  const handleCheckboxChange = (key: keyof ImportItems) => {
    // If already selected → allow uncheck directly
    if (selectedItems[key]) {
      setSelectedItems((prev: ImportItems) => ({
        ...prev,
        [key]: false
      }));
      return;
    }

    // Only show warning if the target course actually has existing data
    if (warningMessages[key] && existingCOCount > 0) {
      setWarningMessage(warningMessages[key]!);
      setPendingSelection(key);
      setShowWarningModal(true);
    } else {
      // No existing data or no warning needed → select directly
      setSelectedItems((prev: ImportItems) => ({
        ...prev,
        [key]: true
      }));
    }
  };

  const handleConfirmWarning = () => {
    if (pendingSelection) {
      setSelectedItems((prev: ImportItems) => ({
        ...prev,
        [pendingSelection]: true
      }));
    }
    setShowWarningModal(false);
    setPendingSelection(null);
  };

  const handleCancelWarning = () => {
    setShowWarningModal(false);
    setPendingSelection(null);
  };

  const handleImport = async () => {
    if (!filters.course_id) return;
    if (!Object.values(selectedItems).some(val => val)) return;

    setImportLoading(true);
    try {
      const payload = {
        school_id: filters.school_id ? Number(filters.school_id) : null,
        program_id: filters.program_id ? Number(filters.program_id) : null,
        academic_batch_id: targetContext.target_batch_id,
        semester_id: targetContext.target_semester_id,
        target_course_id: targetContext.target_course_id,
        source_course_id: Number(filters.course_id),
        import_cos: selectedItems.cos,
        import_co_po_mapping: selectedItems.coPo,
        import_topics: selectedItems.topics,
        import_tlos: selectedItems.tlo,
        import_tlo_co_mapping: selectedItems.tloCo
      };

      const res = await importCourseData(payload);
      if (res.status) {
        toast.success("Course data imported successfully");
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        toast.error(res.message || "Failed to import course data");
      }
    } catch (err) {
      toast.error("An unexpected error occurred during import");
    } finally {
      setImportLoading(false);
    }
  };




  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-[#4a8494]/10 p-2 rounded-lg text-[#4a8494]">
              <FaDownload size={18} />
            </div>
            <h3 className="text-xl font-bold text-[#4a8494]">
              Course wise Import of COs, Topics & TLO
            </h3>
          </div>
          <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded-full transition-all">
            <FaTimes className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[85vh] ">
          {/* Target Context Summary (Premium Look) */}
          <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 mb-8 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-[#4a8494] tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a8494]"></span> Curriculum
              </p>
              <p className="text-sm font-bold text-gray-800 truncate" title={targetContext.curriculum}>{targetContext.curriculum}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-[#4a8494] tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a8494]"></span> Term
              </p>
              <p className="text-sm font-bold text-gray-800">{targetContext.term}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-[#4a8494] tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a8494]"></span> Course Name
              </p>
              <p className="text-sm font-bold text-gray-800 truncate" title={targetContext.courseName}>{targetContext.courseName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-[#4a8494] tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a8494]"></span> Course Mode
              </p>
              <p className="text-sm font-bold text-gray-800">
                <span className="px-2 py-0.5 bg-[#4a8494]/10 text-[#4a8494] rounded text-xs">
                  {targetContext.courseMode}
                </span>
              </p>
            </div>
          </div>

          {/* Source Selection Filters (Properly Aligned) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 mb-8">
            <div className="flex items-center gap-3">
              <label className="w-28 text-sm font-bold text-gray-600 flex-shrink-0 text-right">
                School:
              </label>
              <div className="relative flex-1">
                <select
                  value={filters.school_id}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a8494]/20 focus:border-[#4a8494] outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Select School</option>
                  {dropdowns.schools.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  {!loading.school && dropdowns.schools.length === 0 && <option disabled>No Schools Available</option>}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  {loading.school ? <FaSpinner className="animate-spin text-[#4a8494]" /> : 
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-28 text-sm font-bold text-gray-600 flex-shrink-0 text-right">
                Program:
              </label>
              <div className="relative flex-1">
                <select
                  value={filters.program_id}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  disabled={!filters.school_id || loading.program}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a8494]/20 focus:border-[#4a8494] outline-none border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 transition-all appearance-none bg-white"
                >
                  <option value="">Select Program</option>
                  {dropdowns.programs.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  {filters.school_id && !loading.program && dropdowns.programs.length === 0 && <option disabled>No Programs Available</option>}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  {loading.program ? <FaSpinner className="animate-spin text-[#4a8494]" /> : 
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-28 text-sm font-bold text-gray-600 flex-shrink-0 text-right">
                Curriculum:
              </label>
              <div className="relative flex-1">
                <select
                  value={filters.curriculum_id}
                  onChange={(e) => handleCurriculumChange(e.target.value)}
                  disabled={!filters.program_id || loading.curriculum}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a8494]/20 focus:border-[#4a8494] outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all appearance-none bg-white"
                >
                  <option value="">Select Curriculum</option>
                  {dropdowns.curriculums.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  {filters.program_id && !loading.curriculum && dropdowns.curriculums.length === 0 && <option disabled>No Curriculums Available</option>}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  {loading.curriculum ? <FaSpinner className="animate-spin text-[#4a8494]" /> : 
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-28 text-sm font-bold text-gray-600 flex-shrink-0 text-right">
                Term:
              </label>
              <div className="relative flex-1">
                <select
                  value={filters.semester_id}
                  onChange={(e) => handleTermChange(e.target.value)}
                  disabled={!filters.curriculum_id || loading.semester}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a8494]/20 focus:border-[#4a8494] outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all appearance-none bg-white"
                >
                  <option value="">Select Term</option>
                  {dropdowns.semesters.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  {filters.curriculum_id && !loading.semester && dropdowns.semesters.length === 0 && <option disabled>No Terms Available</option>}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  {loading.semester ? <FaSpinner className="animate-spin text-[#4a8494]" /> : 
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-28 text-sm font-bold text-gray-600 flex-shrink-0 text-right">
                Course:
              </label>
              <div className="relative flex-1">
                <select
                  value={filters.course_id}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  disabled={!filters.semester_id || loading.course}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a8494]/20 focus:border-[#4a8494] outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all appearance-none bg-white"
                >
                  <option value="">Select Course</option>
                  {dropdowns.courses.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  {filters.semester_id && !loading.course && dropdowns.courses.length === 0 && <option disabled>No Courses Available</option>}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  {loading.course ? <FaSpinner className="animate-spin text-[#4a8494]" /> : 
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Checkboxes Section */}
          <div className="border-t border-gray-100 pt-6">
            {filters.course_id && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <FaCheck className="text-green-500" size={14} /> Select contents to import:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-inner">
                  <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedItems.cos}
                      onChange={() => handleCheckboxChange("cos")}
                      className="w-4 h-4 rounded border-gray-300 text-[#4a8494] focus:ring-[#4a8494]"
                    />
                    Course Outcomes (COs)
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedItems.coPo}
                      onChange={() => handleCheckboxChange("coPo")}
                      className="w-4 h-4 rounded border-gray-300 text-[#4a8494] focus:ring-[#4a8494]"
                    />
                    CO to PO Mapping
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedItems.topics}
                      onChange={() => handleCheckboxChange("topics")}
                      className="w-4 h-4 rounded border-gray-300 text-[#4a8494] focus:ring-[#4a8494]"
                    />
                    Topics
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedItems.tlo}
                      onChange={() => handleCheckboxChange("tlo")}
                      className="w-4 h-4 rounded border-gray-300 text-[#4a8494] focus:ring-[#4a8494]"
                    />
                    Topic Learning Outcomes
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedItems.tloCo}
                      onChange={() => handleCheckboxChange("tloCo")}
                      className="w-4 h-4 rounded border-gray-300 text-[#4a8494] focus:ring-[#4a8494]"
                    />
                    TLO to CO Mapping
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-all uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!filters.course_id || !Object.values(selectedItems).some(val => val) || importLoading}
              className="bg-[#4a8494] hover:bg-[#3a6a78] disabled:bg-gray-300 text-white px-10 py-2.5 rounded text-sm font-bold shadow-lg transition-all active:scale-95 uppercase tracking-wider flex items-center gap-2"
            >

              {importLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />} 
              {importLoading ? "Importing..." : "Import"}
            </button>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-red-50">
            <div className="bg-red-50 px-6 py-4 flex items-center gap-3 border-b border-red-100">
              <div className="bg-red-100 p-2 rounded-lg text-red-600">
                <FaDownload size={18} className="rotate-180" />
              </div>
              <h3 className="text-lg font-bold text-red-800">Warning</h3>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-700 leading-relaxed mb-8">
                {warningMessage}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelWarning}
                  className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-all uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmWarning}
                  className="bg-[#4a8494] hover:bg-[#3a6a78] text-white px-8 py-2 rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95 uppercase tracking-wider"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default CourseDataImportModal;
