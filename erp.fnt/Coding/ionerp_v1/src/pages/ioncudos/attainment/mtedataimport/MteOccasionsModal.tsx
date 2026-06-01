import React, { useState } from "react";
import styles from "./mteDataImport.module.css";
import { MteOccasion } from "./mteDataImport.types";
import QPDetailsModal from "./QPDetailsModal";

interface MteOccasionsModalProps {
  open: boolean;
  onClose: () => void;
  data: MteOccasion[];
  loading: boolean;
  course: { title: string; code: string };
}

const MteOccasionsModal: React.FC<MteOccasionsModalProps> = ({
  open,
  onClose,
  data,
  loading,
  course,
}) => {
  const [selectedQP, setSelectedQP] = useState<string | null>(null);

  if (!open && !selectedQP) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Section Header ── */}
        <div className={styles.occasionsHeader}>
          <span>Occasions List</span>
        </div>

        {/* ── Course Context Line ── */}
        <div className={styles.courseContextLine}>
          <strong>Mid - Term Examination (MTE) Course :</strong>&nbsp;
          {course.title} ({course.code})
        </div>

        {/* ── Body ── */}
        <div className={styles.occasionsBody}>
          {loading ? (
            <p className={styles.stateText}>Loading...</p>
          ) : data.length === 0 ? (
            <p className={styles.stateText}>No occasions found</p>
          ) : (
            <table className={styles.occasionsTable}>
              <thead>
                <tr>
                  <th className={styles.th}>Sl. No.</th>
                  <th className={styles.th}>AO Description</th>
                  <th className={styles.th}>Assessment Type</th>
                  <th className={styles.th} style={{ textAlign: "right" }}>
                    MTE Max Marks
                  </th>
                  <th className={styles.th}>View QP</th>
                </tr>
              </thead>
              <tbody>
                {data.map((occasion, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0 ? styles.rowEven : styles.rowOdd
                    }
                  >
                    <td className={styles.td}>{index + 1}</td>
                    <td className={styles.td}>{occasion.description}</td>
                    <td className={styles.td}>{occasion.type}</td>
                    <td className={styles.td} style={{ textAlign: "right" }}>
                      {occasion.maxMarks.toFixed(2)}
                    </td>
                    <td className={styles.td}>
                      {occasion.type === "QP" ? (
                        <span>
                          <span className={styles.qpDefinedText}>
                            QP is defined
                          </span>{" "}
                          <button
                            type="button"
                            onClick={() => setSelectedQP(occasion.occasion_id != null ? String(occasion.occasion_id) : null)}
                            className={styles.link}
                          >
                            View QP
                          </button>
                        </span>
                      ) : (
                        <span className={styles.rubricsMuted}>
                          Rubrics is not finalized .
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={styles.occasionsFooter}>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
      <QPDetailsModal 
        open={!!selectedQP} 
        onClose={() => setSelectedQP(null)} 
        occasionId={selectedQP} 
      />
    </div>
  );
};

export default MteOccasionsModal;
