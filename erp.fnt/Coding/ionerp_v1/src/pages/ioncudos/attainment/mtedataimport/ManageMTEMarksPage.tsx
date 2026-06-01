import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./manageMTEMarks.module.css";
import axiosInstance from "../../../../utils/api";
import { MteOccasion } from "./mteDataImport.types";

// ─────────────────────────────────────────────────────────────────────────────
// Helper – normalise raw API occasion into MteOccasion shape
// ─────────────────────────────────────────────────────────────────────────────
const normaliseOccasion = (raw: any): MteOccasion => ({
  occasion_id: raw.ao_id ? String(raw.ao_id) : raw.occasion_id
    ? String(raw.occasion_id)
    : undefined,
  ao_id: raw.ao_id,
  qp_id: raw.qp_id,
  description: raw.description ?? raw.ao_description ?? raw.occasion_name ?? "—",
  type: (raw.type ?? raw.assessment_type ?? "QP") as "QP" | "Rubrics",
  maxMarks: Number(raw.maxMarks ?? raw.max_marks ?? raw.maximum_marks ?? 0),
  qp_link: raw.qp_link,
  crs_id: raw.crs_id,
  course_id: raw.course_id ?? raw.crs_id,
});

/**
 * ManageMTEMarksPage
 * Full-page list of MTE occasions for a given course.
 * Fetches real data from GET /mte-data-import/qp-view (no params)
 * then filters client-side by course_id / crs_id.
 */
const ManageMTEMarksPage: React.FC = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const routerState = location.state || {};
  const schoolId = routerState.schoolId || "";
  const programId = routerState.programId || "";
  const curriculumId = routerState.curriculumId || "";
  const termId = routerState.termId || "";

  const schoolName = routerState.schoolName || schoolId;
  const programName = routerState.programName || programId;
  const curriculumName = routerState.curriculumName || curriculumId;
  const termName = routerState.termName || termId;

  const courseName = routerState.courseName || "";
  const courseCode = routerState.courseCode || "";
  const crsId = routerState.crsId || courseId;

  const [occasions, setOccasions] = useState<MteOccasion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch occasions for this course via the dedicated API ───────────────
  useEffect(() => {
    if (!courseId) return;

    const fetchOccasions = async () => {
      setLoading(true);
      setError(null);
      try {
        const courseIdParam = crsId || courseId;
        const res = await axiosInstance.get(`/mte-data-import/occasions?crs_id=${courseIdParam}`);
        const raw: any[] = (res.data as any)?.data ?? [];

        // API already filters by crs_id — no client-side filtering needed
        setOccasions(raw.map(normaliseOccasion));
      } catch (err: any) {
        console.error("ManageMTEMarksPage: fetchOccasions error", err);
        setError("Failed to load occasions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOccasions();
  }, [courseId, crsId]);

  if (!courseId) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.errorBox}>Missing course context. Please start from the Course List.</div>
      </div>
    );
  }

  const handleImport = (item: MteOccasion) => {
    if (item.type !== "QP") return;
    navigate(`/attainment/mte_data_import/upload/${item.occasion_id}`, {
      state: {
        courseId,
        crsId,
        courseName,
        courseCode,
        termId,
        programId,
        curriculumId,
        schoolId,
        // Passing Names forward
        schoolName,
        programName,
        curriculumName,
        termName,
        occasionName: item.description,
        qpId: item.qp_id,
        aoId: item.ao_id,
        maxMarks: item.maxMarks,
      },
    });
  };

  const handleDownload = async (item: MteOccasion) => {
    if (!item.ao_id) {
      toast.error("Occasion ID is missing — cannot download template.");
      return;
    }
    try {
      const response = await axiosInstance.get(
        `/mte-data-import/download-template?ao_id=${item.ao_id}`,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `mte_${item.description ?? "occasion"}_${item.ao_id}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Template for "${item.description}" downloaded.`);
    } catch (err: any) {
      console.error("handleDownload error", err);
      toast.error("Failed to download template. Please try again.");
    }
  };

  const handleView = (item: MteOccasion) => {
    if (item.type !== "QP") return;
    navigate(`/attainment/mte_data_import/review/${item.occasion_id}`, {
      state: {
        courseId,
        crsId,
        courseName,
        courseCode,
        termId,
        programId,
        curriculumId,
        schoolId,
        // Passing Names forward
        schoolName,
        programName,
        curriculumName,
        termName,
        occasionName: item.description,
        qpId: item.qp_id,
        aoId: item.ao_id,
        maxMarks: item.maxMarks,
      },
    });
  };

  const handleManageMteQp = () => {
    navigate("/assessment/manage_mte_qp", {
      state: routerState
    });
  };

  const handleClose = () => {
    navigate("/attainment/mte_data_import");
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ── Main Header Title ── */}
      <div className={styles.titleBar} style={{ background: '#ffffff', color: '#4a8494', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <span style={{ fontWeight: 700 }}>Manage Mid - Term Examination (MTE) Occasions Marks</span>
      </div>

      {/* ── Metadata Strip ── */}
      <div className={styles.metadataStrip}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>School</span>
          <span className={styles.metaValue}>{schoolName || "—"}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Program</span>
          <span className={styles.metaValue}>{programName || "—"}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Curriculum</span>
          <span className={styles.metaValue}>{curriculumName || "—"}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Term</span>
          <span className={styles.metaValue}>{termName || "—"}</span>
        </div>
      </div>

      <div className={styles.courseContextLine} style={{ background: '#ffffff', color: '#4a8494', borderBottom: '1px solid #e2e8f0' }}>
        <strong>Mid - Term Examination (MTE) Course :</strong>&nbsp;
        <span style={{ fontWeight: 600 }}>{courseName || "Course Title"} ({courseCode || "CODE"})</span>
      </div>

      {/* ── Occasions Table Section ── */}
      <div className={styles.occasionsSection}>
        <div className={styles.sectionHeader} style={{ background: '#ffffff', color: '#4a8494', border: '1px solid #e2e8f0', borderBottom: 'none' }}>
          <span>Mid - Term Examination Occasions List</span>
        </div>

        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loadingBox}>Loading occasions...</div>
          ) : error ? (
            <div className={styles.errorBox}>{error}</div>
          ) : occasions.length === 0 ? (
            <div className={styles.emptyBox}>No occasions found for this course.</div>
          ) : (
            <table className={styles.occasionsTable}>
              <thead>
                <tr>
                  <th className={styles.th}>Sl. No.</th>
                  <th className={styles.th}>Assessment Occasion Description</th>
                  <th className={styles.th}>Assessment Type</th>
                  <th className={styles.th} style={{ textAlign: "right" }}>
                    MTE Max Marks
                  </th>
                  <th className={styles.th}>Import MTE Marks</th>
                </tr>
              </thead>
              <tbody>
                {occasions.map((item, index) => (
                  <tr key={item.occasion_id ?? index} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td className={styles.td}>{index + 1}</td>
                    <td className={styles.td}>{item.description}</td>
                    <td className={styles.td}>{item.type}</td>
                    <td className={styles.td} style={{ textAlign: "right" }}>
                      {Number(item.maxMarks).toFixed(2)}
                    </td>
                    <td className={styles.td}>
                      {item.type === "QP" ? (
                        <div className={styles.actionGroup}>
                          <button onClick={() => handleDownload(item)} className={styles.actionLink}>Download</button>
                          <span className={styles.divider}>|</span>
                          <button onClick={() => handleImport(item)} className={styles.actionLink}>Import</button>
                          <span className={styles.divider}>|</span>
                          <button onClick={() => handleView(item)} className={styles.actionLink}>View</button>
                        </div>
                      ) : (
                        <button onClick={handleManageMteQp} className={styles.rubricsLink}>
                          Rubrics is not finalized
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <button className={styles.closeBtn} onClick={handleClose}>
          ✕ Close
        </button>
      </div>
    </div>
  );
};

export default ManageMTEMarksPage;
