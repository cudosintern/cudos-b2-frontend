import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { Course, ImportedStudentMarks } from './seeImportTypes';
import { seeImportService } from './seeImportService';
import styles from '../mtedataimport/mteImportReview/mteImportReview.module.css';

// Modular Components
import SEEUploadHeader from './SEEUploadHeader';
import SEEInstructions from './SEEInstructions';
import SEEFileUploadZone from './SEEFileUploadZone';
import SEEPreviewTable from './SEEPreviewTable';
import SEEActionFooter from './SEEActionFooter';
import ConfirmDialog from '../../../../components/Dialog/ConfirmDialog';

interface SeeImportModalProps {
  course: Course;
  school?: string;
  program?: string;
  curriculum?: string;
  term?: string;
  termId: number;
  totalMarks?: number;
  onClose: () => void;
}

const SeeImportModal: React.FC<SeeImportModalProps> = ({
  course,
  school,
  program,
  curriculum,
  term,
  termId,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportedStudentMarks[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = async () => {
    if (previewData) {
      try {
        await seeImportService.discardImport(course.course_id, termId);
      } catch (err) {
        console.error("Failed to discard data on close:", err);
      }
    }
    onClose();
  };

  const handleDiscard = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Confirm Discard",
      message: "Are you sure you want to discard the uploaded data?",
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await seeImportService.discardImport(course.course_id, termId);
          if (res?.status === false) {
             throw new Error(res.message || "Failed to discard data.");
          }
          toast.success("Imported data discarded successfully!");
          setPreviewData(null);
          setSelectedFile(null);
          setError(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          onClose(); // Also close after explicit discard
        } catch (err: any) {
          toast.error(err.response?.data?.message || err.message || "Failed to discard data.");
        } finally {
          setLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      // Assuming importMarks already persisted data during the preview/upload step
      toast.success("Marks accepted and imported successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to accept marks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNow = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setError(null);
      // Step 1: Import (persists to tmp_see, returns count)
      const importResponse = await seeImportService.importMarks(course.course_id, termId, selectedFile);
      const importedCount = importResponse?.data?.imported ?? importResponse?.imported ?? 0;

      if (importedCount === 0) {
        setError('No rows were imported. Please ensure the file has valid data rows and correct column format.');
        return;
      }

      // Step 2: Fetch preview from tmp_see
      const marksArray = await seeImportService.viewImported(course.course_id, termId);
      setPreviewData(marksArray.length > 0 ? marksArray : []);
      if (marksArray.length === 0) {
        setError('Import succeeded but no preview data found. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload and validate marks.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (file: File) => {
    if (!file.name.match(/\.(xls|xlsx)$/)) {
      toast.error("Invalid file format. Please upload only .xls or .xlsx files.");
      return;
    }
    setSelectedFile(file);
    setPreviewData(null);
    setError(null);
    autoUpload(file);
  };

  const autoUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      // Step 1: Import (persists to tmp_see, returns count)
      const importResponse = await seeImportService.importMarks(course.course_id, termId, file);
      const importedCount = importResponse?.data?.imported ?? importResponse?.imported ?? 0;

      if (importedCount === 0) {
        setError('No rows were imported. Please ensure the file has valid data rows and correct column format.');
        return;
      }

      // Step 2: Fetch preview from tmp_see
      const marksArray = await seeImportService.viewImported(course.course_id, termId);
      setPreviewData(marksArray.length > 0 ? marksArray : []);
      if (marksArray.length === 0) {
        setError('Import succeeded but no preview data found. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to validate file.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <SEEUploadHeader 
        title="Semester End Examination Tier-II Assessment Data Import - Student(s) Marks"
        data={{
          school,
          program,
          curriculum,
          term,
          course: `${course.course_title} (${course.course_code})`,
          fileName: selectedFile?.name || 'No file uploaded'
        }}
      />

      <SEEInstructions />

      <div className="p-4 flex flex-col gap-4">
        {loading && !previewData ? (
          <div className={styles.stateBox}>Processing file...</div>
        ) : previewData ? (
          <div className={styles.tableWrapper}>
            <SEEPreviewTable data={previewData} />
          </div>
        ) : null}

        {error && <div className={`${styles.stateBox} ${styles.errorBox}`}>{error}</div>}
      </div>

      <SEEFileUploadZone 
        ref={fileInputRef}
        selectedFile={selectedFile}
        onFileSelect={handleFileChange}
        onUpload={handleUploadNow}
        isUploading={loading}
      />

      <SEEActionFooter 
        onUpload={() => fileInputRef.current?.click()}
        onAccept={handleAccept}
        onCancel={handleClose}
        onDiscard={handleDiscard}
        canAccept={!!previewData && !loading}
        isProcessing={loading}
      />

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

export default SeeImportModal;