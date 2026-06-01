import React from "react";
import ReactDOM from "react-dom";
import styles from "../mtedataimport/mteImportReview/analysisModal.module.css";
import { SEEQuestion, ImportedStudentMarks } from "./seeImportTypes";
import { useSEEAnalysisStats } from "./useSEEAnalysisStats";

interface SEEAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: SEEQuestion[];
  students: ImportedStudentMarks[];
}

/**
 * SEEAnalysisModal Component
 * Responsibility: Render the UI for question-level statistical analysis for SEE.
 * Uses useSEEAnalysisStats hook for all calculation logic.
 */
const SEEAnalysisModal: React.FC<SEEAnalysisModalProps> = ({
  isOpen,
  onClose,
  questions,
  students,
}) => {
  const stats = useSEEAnalysisStats(questions, students);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <span className={styles.title}>Imported Student Data Analysis (SEE)</span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className={styles.content}>
          <h3 className={styles.sectionTitle}>Question Level Analysis</h3>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <tbody>
                {/* Bloom's Level Row */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>Bloom's Level</td>
                  {questions.map((q) => (
                    <td key={q.key} className={styles.valueCell}>{q.bloomLevel || 'N/A'}</td>
                  ))}
                </tr>

                {/* Question Row */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>Question</td>
                  {questions.map((q) => (
                    <td key={q.key} className={styles.valueCell}>{q.label}</td>
                  ))}
                </tr>

                {/* CO Mapping Row */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>CO</td>
                  {questions.map((q) => (
                    <td key={q.key} className={styles.valueCell}>{q.cos?.join(',') || '—'}</td>
                  ))}
                </tr>

                {/* Marks (Max) Row */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>Marks</td>
                  {questions.map((q) => (
                    <td key={q.key} className={styles.valueCell}>{q.max}</td>
                  ))}
                </tr>

                {/* Statistic: Average */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>Average</td>
                  {stats.map((s, idx) => (
                    <td key={idx} className={styles.metricCell}>{s.average}</td>
                  ))}
                </tr>

                {/* Statistic: Std Dev */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>Standard Deviation</td>
                  {stats.map((s, idx) => (
                    <td key={idx} className={styles.metricCell}>{s.stdDev}</td>
                  ))}
                </tr>

                {/* Statistic: Min */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>Min in Range</td>
                  {stats.map((s, idx) => (
                    <td key={idx} className={styles.metricCell}>{s.min}</td>
                  ))}
                </tr>

                {/* Statistic: Max */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>Max in Range</td>
                  {stats.map((s, idx) => (
                    <td key={idx} className={styles.metricCell}>{s.max}</td>
                  ))}
                </tr>

                {/* Statistic: Attempts */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>Number of attempts</td>
                  {stats.map((s, idx) => (
                    <td key={idx} className={styles.metricCell}>{s.attempts}</td>
                  ))}
                </tr>

                {/* Statistic: % Attempt */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>Percentage of Attempt</td>
                  {stats.map((s, idx) => (
                    <td key={idx} className={styles.metricCell}>{s.percentAttempt}</td>
                  ))}
                </tr>

                {/* Statistic: % Attainment */}
                <tr className={styles.row}>
                  <td className={styles.labelCell}>Percentage of Attainment</td>
                  {stats.map((s, idx) => (
                    <td key={idx} className={styles.metricCell}>{s.percentAttainment}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.notes}>
            <p><strong>Note:</strong></p>
            <p><strong>Standard Deviation</strong> - Take the mean of the data, then add the squared differences of the each data and mean. Further divide the result by count of data set, fetch the square root of the resulting value.</p>
            <p><strong>Percentage of Attainment</strong> - (Average * 100 / Marks).</p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className={styles.closeIcon}>&times;</span> Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SEEAnalysisModal;
