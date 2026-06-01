import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FaTimes, FaFileImport } from "react-icons/fa";
import { manageMteService } from "./manageMteService";
import { toast } from "react-toastify";
import type { SchoolOption, ProgramOption, CurriculumOption, TermOption, CourseOption } from "./responseInterface";

interface ImportRubricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetAoMethodId: number;
  targetCourse: {
    crs_id: number;
    academic_batch_id: number;
    term_id: number;
  };
  currentContext: {
    curriculum: string;
    term: string;
    course: string;
  };
}

const ImportRubricsModal: React.FC<ImportRubricsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetAoMethodId,
  targetCourse,
  currentContext
}) => {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [importClo, setImportClo] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSchools();
    }
  }, [isOpen]);

  const fetchSchools = async () => {
    const res = await manageMteService.getSchools();
    if (res.status === 1) setSchools(res.data);
  };

  useEffect(() => {
    if (selectedSchool) {
      manageMteService.getPrograms(Number(selectedSchool)).then(res => {
        if (res.status === 1) setPrograms(res.data);
      });
    } else {
      setPrograms([]);
    }
    setSelectedProgram("");
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedProgram) {
      manageMteService.getCurriculums(Number(selectedProgram)).then(res => {
        if (res.status === 1) setCurriculums(res.data);
      });
    } else {
      setCurriculums([]);
    }
    setSelectedCurriculum("");
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedCurriculum) {
      manageMteService.getTerms(Number(selectedCurriculum)).then(res => {
        if (res.status === 1) setTerms(res.data);
      });
    } else {
      setTerms([]);
    }
    setSelectedTerm("");
  }, [selectedCurriculum]);

  useEffect(() => {
    if (selectedTerm && selectedCurriculum) {
      manageMteService.getCourses({
        deptId: Number(selectedSchool),
        pgmId: Number(selectedProgram),
        batchId: Number(selectedCurriculum),
        termId: Number(selectedTerm)
      }).then(res => {
        if (res.status === 1) setCourses(res.data);
      });
    } else {
      setCourses([]);
    }
    setSelectedCourse("");
  }, [selectedTerm]);

  const handleImport = async () => {
    if (!selectedCourse || !selectedTerm || !selectedCurriculum) {
      toast.error("Please select all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        academic_batch_id: Number(selectedCurriculum),
        term_id: Number(selectedTerm),
        crs_id: Number(selectedCourse),
        target_ao_method_id: targetAoMethodId,
        target_crs_id: targetCourse.crs_id,
        target_academic_batch_id: targetCourse.academic_batch_id,
        target_term_id: targetCourse.term_id,
        import_clo: importClo
      };

      const res = await manageMteService.importRubrics(payload);
      if (res.status === 1) {
        const fetchedRubrics = res.data?.rubrics || [];
        if (fetchedRubrics.length > 0) {
          let failedCount = 0;
          for (const r of fetchedRubrics) {
            const savePayload = {
              ao_method_id: targetAoMethodId && targetAoMethodId !== 0 ? targetAoMethodId : 1,
              criteria_type: "custom",
              criteria_text: r.criteria,
              co_id: null,
              crs_id: targetCourse.crs_id,
              academic_batch_id: targetCourse.academic_batch_id,
              term_id: targetCourse.term_id,
              ranges: r.ranges.map((rng: any, idx: number) => {
                const descObj = (r.descriptions || []).find((d: any) => d.rubrics_range_id === rng.rubrics_range_id);
                return {
                  criteria_range_name: `Scale ${idx + 1}`,
                  criteria_range: String(rng.criteria_range),
                  description: descObj ? descObj.criteria_description : ""
                };
              })
            };
            const saveRes = await manageMteService.saveRubricsCriteria(savePayload);
            if (saveRes.status !== 1) failedCount++;
          }
          if (failedCount === 0) {
            toast.success("Rubrics imported successfully");
          } else {
            toast.warning(`Imported partially. ${failedCount} rubrics failed to save.`);
          }
        } else {
          toast.success(res.message || "Rubrics imported successfully (empty data)");
        }
        
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Failed to import rubrics");
      }
    } catch (e: any) {
      toast.error("An error occurred during import.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[120] overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black opacity-40 backdrop-blur-sm" />
          </Transition.Child>

          <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-2xl overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-lg relative">

              {/* Header */}
              <div className="bg-white px-5 py-3 flex justify-between items-center border-b border-gray-200">
                <Dialog.Title as="h3" className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                  <FaFileImport className="text-blue-600 w-4 h-4" />
                  Import Mid-Term Examination (MTE) Rubrics
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5">

                {/* Current Context Info */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3.5 mb-5 flex flex-wrap gap-y-2 gap-x-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Currrent Curriculum</span>
                    <span className="text-xs font-semibold text-blue-900">{currentContext.curriculum}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 border-l border-blue-100 pl-6">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Current Term</span>
                    <span className="text-xs font-semibold text-blue-900">{currentContext.term}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 border-l border-blue-100 pl-6">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Current Course</span>
                    <span className="text-xs font-semibold text-blue-900">{currentContext.course}</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <h4 className="text-sm font-semibold text-gray-800 border-l-4 border-blue-600 pl-2">Import Mid-Term Examination Rubrics From Course Details</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                      <select
                        value={selectedSchool}
                        onChange={(e) => setSelectedSchool(e.target.value)}
                        className="w-full px-3 py-1.5 h-8 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="">Select Department</option>
                        {schools.map(s => <option key={s.dept_id} value={s.dept_id}>{s.dept_name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Program <span className="text-red-500">*</span></label>
                      <select
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        disabled={!selectedSchool}
                        className="w-full px-3 py-1.5 h-8 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-50"
                      >
                        <option value="">Select Program</option>
                        {programs.map(p => <option key={p.pgm_id} value={p.pgm_id}>{p.pgm_title}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Curriculum <span className="text-red-500">*</span></label>
                      <select
                        value={selectedCurriculum}
                        onChange={(e) => setSelectedCurriculum(e.target.value)}
                        disabled={!selectedProgram}
                        className="w-full px-3 py-1.5 h-8 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-50"
                      >
                        <option value="">Select Curriculum</option>
                        {curriculums.map(c => <option key={c.academic_batch_id} value={c.academic_batch_id}>{c.academic_batch_code}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Term <span className="text-red-500">*</span></label>
                      <select
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                        disabled={!selectedCurriculum}
                        className="w-full px-3 py-1.5 h-8 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-50"
                      >
                        <option value="">Select Term</option>
                        {terms.map(t => <option key={t.semester_id} value={t.semester_id}>{t.term_name}</option>)}
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-medium text-gray-700">Course <span className="text-red-500">*</span></label>
                      <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        disabled={!selectedTerm}
                        className="w-full px-3 py-1.5 h-8 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-50"
                      >
                        <option value="">Select Course</option>
                        {courses.map(c => <option key={c.crs_id} value={c.crs_id}>{c.crs_title} ({c.crs_code})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="importClo"
                      checked={importClo}
                      onChange={(e) => setImportClo(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="importClo" className="text-xs font-medium text-gray-700 cursor-pointer">Import Rubrics along with Course outcomes</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 text-sm font-semibold text-white bg-red-600 rounded shadow hover:bg-red-700 transition-all flex items-center gap-1.5"
                  >
                    <FaTimes />
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={loading || !selectedCourse}
                    className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded shadow hover:bg-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaFileImport />
                    {loading ? "Importing..." : "Import"}
                  </button>
                </div>
              </div>

            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ImportRubricsModal;
