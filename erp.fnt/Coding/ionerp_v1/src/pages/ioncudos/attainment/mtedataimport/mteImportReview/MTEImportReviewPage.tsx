import React, { useMemo, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import styles from "./mteImportReview.module.css";
import HeaderSection from "./HeaderSection";
import MarksTable from "./MarksTable";
import ActionButtons from "./ActionButtons";
import { useMteImportReview } from "./useMteImportReview";
import { CellError, MteQuestion, MteStudentRow } from "./mteImportReview.types";
import AnalysisModal from "./AnalysisModal";
import { useState } from "react";
import ConfirmDialog from "../../../../../components/Dialog/ConfirmDialog";

/**
 * Validates all student marks against each question's max marks.
 */
const validateMarks = (
  students: MteStudentRow[],
  questions: MteQuestion[]
): CellError[] => {
  const errors: CellError[] = [];
  students.forEach((student) => {
    questions.forEach((q) => {
      const mark = student.marks[q.key];
      if (mark === null || mark === undefined) {
        errors.push({
          usn: student.usn,
          questionKey: q.key,
          message: `${student.name}: Q${q.questionNo} mark is missing.`,
        });
      } else if (mark < 0 || mark > q.max) {
        errors.push({
          usn: student.usn,
          questionKey: q.key,
          message: `${student.name}: Q${q.questionNo} mark (${mark}) must be between 0 and ${q.max}.`,
        });
      }
    });
  });
  return errors;
};

const MTEImportReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { occasionId } = useParams();
  const location = useLocation();
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { }
  });

  const routerState = location.state as {
    courseId?: string;
    courseName?: string;
    courseCode?: string;
    termId?: string;
    programId?: string;
    curriculumId?: string;
    schoolId?: string;
    // Names for UI
    termName?: string;
    programName?: string;
    curriculumName?: string;
    schoolName?: string;
    occasionName?: string;
  } || {};

  const schoolDisplay = routerState.schoolName || routerState.schoolId || "";
  const programDisplay = routerState.programName || routerState.programId || "";
  const curriculumDisplay = routerState.curriculumName || routerState.curriculumId || "";
  const termDisplay = routerState.termName || routerState.termId || "";

  // Build meta for the review hook from router state
  const routerMeta = useMemo(() => ({
    school: schoolDisplay,
    program: programDisplay,
    curriculum: curriculumDisplay,
    term: termDisplay,
    course: routerState.courseName
      ? `${routerState.courseName} (${routerState.courseCode ?? ""})`
      : "",
    fileName: routerState.occasionName ?? "",
    occasionId: occasionId ?? "",
  }), [routerState, occasionId, schoolDisplay, programDisplay, curriculumDisplay, termDisplay]);

  const { data, loading, error, discardData } = useMteImportReview(occasionId, routerMeta);

  const errors: CellError[] = useMemo(() => {
    if (!data) return [];
    return validateMarks(data.students, data.questions);
  }, [data]);

  const handleReturnToManageMTE = useCallback(() => {
    if (routerState.courseId) {
      navigate(`/attainment/mte_data_import/manage/${routerState.courseId}`, {
        state: routerState
      });
    } else {
      navigate("/attainment/mte_data_import");
    }
  }, [navigate, routerState]);

  const handleReimport = useCallback(() => {
    navigate(`/attainment/mte_data_import/upload/${occasionId}`, {
      state: routerState
    });
  }, [navigate, occasionId, routerState]);

  const handleDataAnalysis = useCallback(() => {
    setIsAnalysisModalOpen(true);
  }, []);

  const handleDiscardData = useCallback(() => {
    setConfirmDialog({
      isOpen: true,
      title: "Confirm Discard",
      message: "Are you sure you want to discard all imported data? This action cannot be undone.",
      onConfirm: () => {
        discardData();
        navigate("/attainment/mte_data_import");
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [discardData, navigate]);

  // Safety Check - rendered after hooks to follow React rules
  if (!occasionId) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.titleBar} style={{ background: '#ffffff', color: '#4a8494', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <span style={{ fontWeight: 700 }}>Mid - Term Examination Assessment Data Import Details</span>
        </div>
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          Error: Invalid navigation. Assessment occasion identity is missing.
        </div>
        <div className={styles.footer} style={{ justifyContent: 'center', marginTop: 20 }}>
          <button className={styles.actionBtn} onClick={() => navigate("/attainment/mte_data_import")}>
            Return to Course List
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.titleBar} style={{ background: '#ffffff', color: '#4a8494', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <span style={{ fontWeight: 700 }}>Mid - Term Examination Assessment Data Import Details</span>
        </div>
        <div className={styles.stateBox}>Loading import data…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.titleBar} style={{ background: '#ffffff', color: '#4a8494', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <span style={{ fontWeight: 700 }}>Mid - Term Examination Assessment Data Import Details</span>
        </div>
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          {error ?? "No data available. Please re-import the file."}
        </div>
        <ActionButtons
          onReturnToManageMTE={handleReturnToManageMTE}
          onReimport={handleReimport}
          onDataAnalysis={handleDataAnalysis}
          onDiscardData={handleDiscardData}
          hasErrors={true}
        />
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.titleBar} style={{ background: '#ffffff', color: '#4a8494', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <span style={{ fontWeight: 700 }}>Mid - Term Examination Assessment Data Import Details</span>
        {errors.length > 0 && (
          <span style={{ fontSize: 11, color: "#d97706", fontWeight: 500 }}>
            ⚠ {errors.length} validation error{errors.length > 1 ? "s" : ""} found
          </span>
        )}
      </div>

      <HeaderSection meta={data.meta} />
      <MarksTable questions={data.questions} students={data.students} errors={errors} />

      <ActionButtons
        onReturnToManageMTE={handleReturnToManageMTE}
        onReimport={handleReimport}
        onDataAnalysis={handleDataAnalysis}
        onDiscardData={handleDiscardData}
        hasErrors={errors.length > 0}
      />

      {data && (
        <AnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          questions={data.questions}
          students={data.students}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
};

export default MTEImportReviewPage;
