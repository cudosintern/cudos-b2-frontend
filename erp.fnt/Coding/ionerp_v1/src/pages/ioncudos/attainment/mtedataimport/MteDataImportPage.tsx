import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import DataTable from "../../../../components/Table/DataTable";
import MteOccasionsModal from "./MteOccasionsModal";
import { Course } from "./mteDataImport.types";
import { useMteDataImport } from "./useMteDataImport";

// ---- Warning Modal ----
interface WarningModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

const WarningModal: React.FC<WarningModalProps> = ({ title, message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-down">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button className="text-gray-400 hover:text-gray-500 transition-colors" onClick={onClose}>
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 bg-white text-sm text-gray-800 text-center">
          {message}
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-center border-t border-gray-100">
          <button
            className="bg-[#437880] text-white font-medium px-8 py-2 rounded hover:bg-[#386269] transition-colors shadow-sm"
            onClick={onClose}
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};

const MteDataImportPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    filters,
    setters,
    ui,
    filterOptions,
    courses,
    courseOccasions,
    fetchOccasionsForCourse,
  } = useMteDataImport();

  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    title: "",
    message: ""
  });

  const handleManageMarks = (course: Course) => {
    if (!course.hasOccasions) {
      setWarningModal({
        isOpen: true,
        title: "No Occasions",
        message: `No occasions defined for "${course.course_title}". Please define occasions first.`
      });
      return;
    }

    // Capture labels for the header display in the next page
    const schoolName = filterOptions.schools.find(s => String(s.dept_id) === filters.school)?.dept_name;
    const programName = filterOptions.programs.find(p => String(p.pgm_id) === filters.program)?.pgm_title;
    const curriculumName = filterOptions.curriculums.find(c => String(c.academic_batch_id) === filters.curriculum)?.academic_batch_code;
    const termName = filterOptions.terms.find(t => String(t.semester_id) === filters.term)?.term_name
      ?? filterOptions.terms.find(t => String(t.semester_id) === filters.term)?.semester_code;

    navigate(`/attainment/mte_data_import/manage/${course.course_id}`, {
      state: {
        courseId: course.course_id,
        crsId: course.crs_id ?? course.course_id,
        courseName: course.course_title,
        courseCode: course.course_code,
        termId: filters.term,
        programId: filters.program,
        curriculumId: filters.curriculum,
        schoolId: filters.school,
        // Passing Names/Labels for UI display
        schoolName,
        programName,
        curriculumName,
        termName,
      },
    });
  };

  const handleViewDetails = (course: Course) => {
    ui.setSelectedCourse(course);
    ui.setIsOccasionsModalOpen(true);
    fetchOccasionsForCourse(course.crs_id ?? course.course_id);
  };

  const columnDefs = useMemo(() => [
    {
      headerName: "SI No.",
      valueGetter: "node.rowIndex + 1",
      width: 70,
      minWidth: 70,
      maxWidth: 70,
      sortable: false,
      filter: false,
      cellStyle: { textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" },
    },
    { headerName: "Code", field: "course_code", minWidth: 100, flex: 0.5, filter: false },
    { headerName: "Course Title", field: "course_title", minWidth: 200, flex: 1.5, filter: false },
    { headerName: "Core / Elective", field: "category", minWidth: 100, flex: 0.5, filter: false },
    {
      headerName: "Credits",
      field: "credits",
      width: 80,
      filter: false,
      cellStyle: { textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" },
    },
    {
      headerName: "Total Marks",
      field: "total_marks",
      width: 100,
      filter: false,
      cellStyle: { textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" },
    },
    { headerName: "Course Owner", field: "owner", minWidth: 150, flex: 1, filter: false },
    { headerName: "Mode", field: "delivery_mode", minWidth: 120, flex: 0.5, filter: false },
    {
      headerName: "MTE Occasions",
      cellRenderer: (params: any) => (
        <button
          className="text-blue-600 hover:underline text-[13px] font-semibold"
          onClick={() => handleViewDetails(params.data)}
        >
          MTE Occasions
        </button>
      ),
      minWidth: 140,
      filter: false,
      cellStyle: { textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" },
    },

    {
      headerName: "Manage MTE Marks",
      cellRenderer: (params: any) => (
        <button
          className="text-blue-600 hover:underline text-[13px] font-semibold"
          onClick={() => handleManageMarks(params.data)}
        >
          Add/Modify
        </button>
      ),
      minWidth: 160,
      filter: false,
      cellStyle: { textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" },
    },

    {
      headerName: "Status",
      field: "status",
      filter: false,
      cellRenderer: (params: any) => {
        const status = params.value;
        const isPending = status === "Pending";
        const isCompleted = status === "Completed";
        const bg = isPending ? "#f0ad4e" : (isCompleted || status === "In-Progress") ? "#5cb85c" : "#5bc0de";
        return (
          <span
            style={{
              backgroundColor: bg,
              color: "#ffffff",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: "700",
              display: "inline-block",
              minWidth: "70px",
              textAlign: "center"
            }}
          >
            {status}
          </span>
        );
      },
      minWidth: 100,
      cellStyle: { textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" },
    },
  ], [handleManageMarks, handleViewDetails, ui.entries, ui.searchTerm, ui.isLoading]);

  return (
    <>
      <div className="w-full font-['Inter']">

        <div className="flex justify-between items-center pb-5">
          <h3 className="text-xl leading-8 font-bold text-gray-900">Mid-Term Examination (MTE) Data Import</h3>
        </div>

        {/* ── Filters ── */}
        <div className="mb-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">

            {/* School / Department */}
            <div className="w-full lg:w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School <span className="text-red-500">*</span>
              </label>
              <select
                value={filters.school}
                onChange={(e) => setters.handleSchoolChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select School</option>
                {filterOptions.schools.map((s) => (
                  <option key={s.dept_id} value={String(s.dept_id)}>
                    {s.dept_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Program */}
            <div className="w-full lg:w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program <span className="text-red-500">*</span>
              </label>
              <select
                value={filters.program}
                onChange={(e) => setters.handleProgramChange(e.target.value)}
                disabled={!filters.school}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
              >
                <option value="">Select Program</option>
                {filterOptions.programs.map((p) => (
                  <option key={p.pgm_id} value={String(p.pgm_id)}>
                    {p.pgm_title}
                  </option>
                ))}
              </select>
            </div>

            {/* Curriculum */}
            <div className="w-full lg:w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curriculum <span className="text-red-500">*</span>
              </label>
              <select
                value={filters.curriculum}
                onChange={(e) => setters.handleCurriculumChange(e.target.value)}
                disabled={!filters.program}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
              >
                <option value="">Select Curriculum</option>
                {filterOptions.curriculums.map((c) => (
                  <option key={c.academic_batch_id} value={String(c.academic_batch_id)}>
                    {c.academic_batch_code}
                  </option>
                ))}
              </select>
            </div>

            {/* Term */}
            <div className="w-full lg:w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term <span className="text-red-500">*</span>
              </label>
              <select
                value={filters.term}
                onChange={(e) => setters.handleTermChange(e.target.value)}
                disabled={!filters.curriculum}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
              >
                <option value="">Select Term</option>
                {filterOptions.terms.map((t) => (
                  <option key={t.semester_id} value={String(t.semester_id)}>
                    {t.term_name ?? t.semester_code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── DataTable ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <DataTable
            columnDefs={columnDefs}
            rowData={courses}
            showAddButton={false}
            showExportButton={false}
            headerFilter={false}
            pageSize={ui.entries}
            quickFilterText={ui.searchTerm}
            loading={ui.isLoading}
          />
        </div>

        {/* ── Occasions Modal ── */}
        {ui.selectedCourse && (
          <MteOccasionsModal
            open={ui.isOccasionsModalOpen}
            onClose={() => {
              ui.setIsOccasionsModalOpen(false);
              ui.setSelectedCourse(null);
            }}
            data={courseOccasions}
            loading={ui.occasionsLoading}
            course={{
              title: ui.selectedCourse.course_title,
              code: ui.selectedCourse.course_code,
            }}
          />
        )}

        {warningModal.isOpen && (
          <WarningModal
            title={warningModal.title}
            message={warningModal.message}
            onClose={() => setWarningModal(prev => ({ ...prev, isOpen: false }))}
          />
        )}
      </div>
    </>
  );
};

export default MteDataImportPage;
