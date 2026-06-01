import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "../mteImportReview/mteImportReview.module.css";

import axiosInstance from "../../../../../utils/api";
import MTEUploadHeader from "./MTEUploadHeader";
import MTEInstructions from "./MTEInstructions";
import UploadActionButtons from "./UploadActionButtons";
import ConfirmDialog from "../../../../../components/Dialog/ConfirmDialog";
import MarksTable from "../mteImportReview/MarksTable";
import { MteImportData } from "../mteImportReview/mteImportReview.types";

// ─────────────────────────────────────────────────────────────────────────────
// MTE Upload Page — 3-step server-side flow (mirrors CCE data import pattern):
//
//   1. User selects an .xlsx/.xls file
//      → POST /mte-data-import/upload-mte-excel
//        Server parses the file, validates marks, returns preview data (no DB write)
//
//   2. User reviews the preview marks table, then clicks "Accept .xls"
//      → POST /mte-data-import/accept-mte-marks
//        Persists all marks to cudos_student_assessment + totalmarks tables
//
//   3. User clicks "Cancel"
//      → POST /mte-data-import/discard-mte-marks  (best-effort, no-op on server)
//        Frontend resets state and navigates back
// ─────────────────────────────────────────────────────────────────────────────

const MTEUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { occasionId } = useParams();
  const location = useLocation();

  const routerState = useMemo(
    () =>
      (location.state || {}) as {
        courseId?: string;
        crsId?: string | number;
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
        qpId?: number;
        aoId?: number;
        maxMarks?: number;
      },
    [location.state]
  );

  const schoolDisplay = routerState.schoolName || routerState.schoolId || "";
  const programDisplay = routerState.programName || routerState.programId || "";
  const curriculumDisplay = routerState.curriculumName || routerState.curriculumId || "";
  const termDisplay = routerState.termName || routerState.termId || "";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [data, setData] = useState<MteImportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Raw server payload kept between upload and accept steps
  const [parsedPayload, setParsedPayload] = useState<any>(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const isValid = useMemo(() => !!data, [data]);

  // ao_id: prefer routerState.aoId, fall back to URL param
  const aoId = routerState.aoId ?? (occasionId ? Number(occasionId) : null);

  // ── Navigation helper ────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (routerState.courseId) {
      navigate(`/attainment/mte_data_import/manage/${routerState.courseId}`, {
        state: routerState,
      });
    } else {
      navigate("/attainment/mte_data_import");
    }
  }, [navigate, routerState]);

  // ── Map server preview response → MteImportData for MarksTable ──────────
  const mapServerPreview = useCallback(
    (serverData: any, fileName: string): MteImportData => {
      const serverQuestions: any[] = serverData.questions ?? [];
      const serverStudents: any[] = serverData.students ?? [];

      const questions = serverQuestions.map((q: any) => ({
        key: q.key,
        questionNo: q.question_no,
        max: q.max_marks ?? 0,
        cos: q.cos ?? [],
        bloomLevel: q.bloom_level ?? "NA",
      }));

      const students = serverStudents.map((s: any) => ({
        usn: s.usn,
        name: s.name ?? s.usn,
        marks: s.marks ?? {},
        remarks: s.remarks ?? null,
      }));

      return {
        meta: {
          school: schoolDisplay,
          program: programDisplay,
          curriculum: curriculumDisplay,
          term: termDisplay,
          course: routerState.courseName
            ? `${routerState.courseName} (${routerState.courseCode ?? ""})`
            : "",
          fileName,
          occasionId: occasionId ?? "",
        },
        questions,
        students,
      };
    },
    [occasionId, routerState]
  );

  // ── Step 1: Upload file → POST /upload-mte-excel ─────────────────────────
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.match(/\.(xls|xlsx)$/i)) {
        toast.error("Invalid file format. Please upload only .xls or .xlsx files.");
        return;
      }

      if (!aoId) {
        toast.error("Occasion ID is missing. Please go back and try again.");
        return;
      }

      setSelectedFile(file);
      setError(null);
      setData(null);
      setParsedPayload(null);
      setLoading(true);

      try {
        const formData = new FormData();
        formData.append("ao_id", String(aoId));
        formData.append("file", file);

        const res = await axiosInstance.post(
          "/mte-data-import/upload-mte-excel",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        const resBody = res.data as any;
        const serverData = resBody?.data?.[0];

        if (!resBody?.status || !serverData) {
          throw new Error(resBody?.message ?? "Server returned no preview data.");
        }

        setParsedPayload(serverData);
        setData(mapServerPreview(serverData, file.name));

        const remarkCount = serverData.remarks?.length ?? 0;
        if (remarkCount > 0) {
          toast.warning(`File parsed with ${remarkCount} remark(s). Please review below.`);
        } else {
          toast.success("File parsed successfully. Review the data below.");
        }
      } catch (err: any) {
        console.error("MTEUploadPage: upload error", err);
        const msg =
          err?.response?.data?.message ?? err?.message ?? "Failed to parse file.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [aoId, mapServerPreview]
  );

  // ── Step 2: Accept → POST /accept-mte-marks ──────────────────────────────
  const handleAccept = useCallback(async () => {
    if (!data || !isValid || !parsedPayload || !aoId) return;

    setIsSaving(true);
    try {
      const acceptPayload = {
        ao_id: aoId,
        students: (parsedPayload.students as any[]).map((s) => ({
          usn: s.usn,
          name: s.name ?? s.usn,
          marks: s.marks ?? {},
        })),
      };

      const res = await axiosInstance.post(
        "/mte-data-import/accept-mte-marks",
        acceptPayload
      );
      const resBody = res.data as any;

      if (!resBody?.status) {
        throw new Error(resBody?.message ?? "Failed to save marks.");
      }

      toast.success(resBody.message ?? "Marks saved successfully!");
      goBack();
    } catch (err: any) {
      console.error("MTEUploadPage: accept error", err);
      toast.error(
        err?.response?.data?.message ?? err?.message ?? "Failed to save marks."
      );
    } finally {
      setIsSaving(false);
    }
  }, [data, isValid, parsedPayload, aoId, goBack]);

  // ── Step 3: Cancel → POST /discard-mte-marks (best-effort) → goBack ─────
  const performDiscard = useCallback(async () => {
    if (aoId && data) {
      axiosInstance
        .post("/mte-data-import/discard-mte-marks", { ao_id: aoId })
        .catch((e) => console.warn("discard-mte-marks:", e));
    }
    setData(null);
    setParsedPayload(null);
    setSelectedFile(null);
    goBack();
  }, [aoId, data, goBack]);

  const handleCancel = useCallback(() => {
    if (data) {
      setConfirmDialog({
        isOpen: true,
        title: "Confirm Discard",
        message: "Discard uploaded data and return back?",
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          performDiscard();
        },
      });
    } else {
      goBack();
    }
  }, [data, performDiscard, goBack]);

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!occasionId) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.titleBar}>
          <span>Mid - Term Examination Data Import - Student(s) Marks</span>
        </div>
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          Invalid occasion context.
        </div>
      </div>
    );
  }

  const isProcessing = loading || isSaving;

  return (
    <div className={styles.pageWrapper}>
      <MTEUploadHeader
        title="Mid - Term Examination Data Import - Student(s) Marks"
        data={{
          school: schoolDisplay,
          program: programDisplay,
          curriculum: curriculumDisplay,
          term: termDisplay,
          course: routerState.courseName
            ? `${routerState.courseName} (${routerState.courseCode ?? ""})`
            : "",
          fileName:
            selectedFile?.name ?? data?.meta?.fileName ?? "No file uploaded",
        }}
      />

      <MTEInstructions />

      {isProcessing && !data ? (
        <div className={styles.stateBox}>
          {isSaving ? "Saving marks to server..." : "Processing file..."}
        </div>
      ) : data ? (
        <MarksTable questions={data.questions} students={data.students} errors={[]} />
      ) : (
        <input
          type="file"
          id="mte-file-upload"
          style={{ display: "none" }}
          accept=".xls,.xlsx"
          onChange={handleFileChange}
        />
      )}

      {error && (
        <div className={`${styles.stateBox} ${styles.errorBox}`}>{error}</div>
      )}

      <UploadActionButtons
        onUpload={() => document.getElementById("mte-file-upload")?.click()}
        onAccept={handleAccept}
        onCancel={handleCancel}
        canAccept={!!data && !isProcessing && isValid}
        isUploading={isProcessing}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
};

export default MTEUploadPage;
