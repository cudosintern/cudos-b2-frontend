import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import SeeFilters from './SeeFilters';
import SeeCourseTable from './SeeCourseTable';
import SeeWarningModal from './SeeWarningModal';
import SeeImportModal from './SeeImportModal';
import SeeViewPage from './SeeReviewPage';
import { Course } from './seeImportTypes';
import { seeImportService } from './seeImportService';

type ViewType = 'list' | 'import' | 'review';

const SeeCourseWiseImport: React.FC = () => {
  // ─── View state (list ↔ import page) ────────────────────────────────────────
  const [view, setView] = useState<ViewType>('list');

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Selected course context (set before switching views or opening modals) ──
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Ref to synchronously track the course being uploaded (avoids async state race)
  const uploadCourseRef = useRef<Course | null>(null);

  // ─── Modal visibility (only WarningModal and ViewModal remain as modals) ─────
  const [warningModalOpen, setWarningModalOpen] = useState(false);

  // ─── Async action loading guard ──────────────────────────────────────────────
  const [actionLoading, setActionLoading] = useState(false);

  const [activeTermId, setActiveTermId] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filterContext, setFilterContext] = useState({
    schoolName: '',
    programName: '',
    curriculumName: '',
    termName: ''
  });

  useEffect(() => {
    if (activeTermId) {
      setActionLoading(true);
      seeImportService.getCourses(activeTermId).then((data) => {
        setCourses(data);
      }).catch(() => {
        setCourses([]);
      }).finally(() => {
        setActionLoading(false);
      });
    } else {
      setCourses([]);
    }
  }, [activeTermId]);

  // ─── Filtered / paginated data ───────────────────────────────────────────────
  const filteredCourses = courses.filter(
    (c) =>
      c.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.course_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedCourses = filteredCourses.slice(0, entries);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Upload QP – synchronously store course in a ref then trigger file input. */
  const handleUploadQP = (course: Course) => {
    uploadCourseRef.current = course;
    setSelectedCourse(course);
    const fileInput = document.getElementById('qp-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // reset so same file can be re-selected
      fileInput.click();
    }
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Use the ref (synchronous) instead of selectedCourse state (async)
    const course = uploadCourseRef.current;
    if (!file || !course) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      event.target.value = '';
      return;
    }

    try {
      setActionLoading(true);
      await seeImportService.uploadQP(course.course_id, file);
      toast.success(`QP for "${course.course_title}" uploaded successfully!`);
    } catch (error) {
      toast.error('Failed to upload QP. Please try again.');
    } finally {
      setActionLoading(false);
      event.target.value = ''; // Reset input
    }
  };

  /** View QP – fetch metadata then stream-open the PDF. */
  const handleViewQP = async (course: Course) => {
    setSelectedCourse(course);
    try {
      setActionLoading(true);
      const qpData = await seeImportService.getQP(course.course_id);
      if (qpData) {
        await seeImportService.viewQPFile(qpData.doc_id);
      } else {
        toast.warn('No QP has been uploaded for this course yet.');
      }
    } catch (error) {
      toast.error('Failed to retrieve QP. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (course: Course) => {
    if (!activeTermId) {
      alert('Please select a Term before downloading the template.');
      return;
    }
    try {
      setActionLoading(true);
      console.log('[SEE] Downloading template for course:', course.course_code);
      await seeImportService.downloadTemplate(course.course_id, activeTermId);
      toast.success(`SEE template for "${course.course_title}" downloaded successfully!`);
    } catch {
      alert('Failed to download template. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Import Marks – Critical Flow
   * 1. Guard: user must be course owner
   * 2. Validate: threshold must be defined → else open WarningModal
   * 3. Open ImportModal
   */
  const handleImport = async (course: Course) => {
    try {
      setActionLoading(true);

      // 2. Threshold validation
      // TODO: Replace placeholder with real API call when backend is ready:
      // const thresholdDefined = await seeImportService.checkThreshold(course.course_id);
      const thresholdDefined = true; // Placeholder – always pass for now

      if (!thresholdDefined) {
        setSelectedCourse(course);
        setWarningModalOpen(true);
        return;
      }

      // 3. All checks passed → navigate to Import page
      setSelectedCourse(course);
      setView('import');
    } catch {
      alert('Unable to validate threshold. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * View Imported Data - Transition to Review Page
   */
  const handleViewImport = (course: Course) => {
    setSelectedCourse(course);
    setView('review');
    console.log('[SEE] Navigating to review page for course:', course.course_code);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Import Page (inline, replaces the list) ─────────────────────────────────
  if (view === 'import' && selectedCourse) {
    return (
      <div className="p-8 max-w-full mx-auto mt-4">
        <SeeImportModal
          course={selectedCourse}
          school={filterContext.schoolName}
          program={filterContext.programName}
          curriculum={filterContext.curriculumName}
          term={filterContext.termName}
          termId={activeTermId!}
          totalMarks={selectedCourse.total_marks}
          onClose={() => {
            setView('list');
            setSelectedCourse(null);
          }}
        />
      </div>
    );
  }

  // ── Review Page (inline, replaces the list) ─────────────────────────────────
  if (view === 'review' && selectedCourse) {
    return (
      <div className="p-8 max-w-full mx-auto mt-4">
        <SeeViewPage
          course={selectedCourse}
          school={filterContext.schoolName}
          program={filterContext.programName}
          curriculum={filterContext.curriculumName}
          term={filterContext.termName}
          termId={activeTermId!}
          onClose={() => {
            setView('list');
            setSelectedCourse(null);
          }}
          onReimport={() => {
            setView('import');
          }}
        />
      </div>
    );
  }
  return (
    <div className="w-full font-['Inter'] p-8 max-w-full mx-auto mt-4 min-h-screen">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Semester End Examination (SEE) Data Import</h3>

      <div className="mb-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <SeeFilters 
          onTermChange={(termId) => setActiveTermId(termId)} 
          onContextChange={setFilterContext} 
        />
      </div>

        <input
          type="file"
          id="qp-upload-input"
          className="hidden"
          accept=".pdf"
          onChange={onFileChange}
        />

        {/* Loading overlay hint (optional but good to keep) */}
        {actionLoading && (
          <div className="px-4 py-2 text-xs text-blue-600 font-medium animate-pulse bg-blue-50/50 border-b border-blue-100">
            Processing… please wait.
          </div>
        )}

      {/* Table Content Wrapper */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-end pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Search:</span>
            <input
              type="text"
              value={searchTerm}
              placeholder="Search by code or title..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-slate-300 rounded px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 w-64 bg-white shadow-sm transition-all focus:border-blue-300"
            />
          </div>
        </div>

        <SeeCourseTable
          courses={paginatedCourses}
          totalCourses={filteredCourses.length}
          pageSize={entries}
          onPageSizeChange={setEntries}
          onUploadQP={handleUploadQP}
          onViewQP={handleViewQP}
          onDownload={handleDownload}
          onImport={handleImport}
          onViewImport={handleViewImport}
        />
      </div>

      <SeeWarningModal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
      />

      {/* SeeImportModal and SeeViewPage are now rendered as inline pages above, not as modals */}
    </div>
  );
};

export default SeeCourseWiseImport;