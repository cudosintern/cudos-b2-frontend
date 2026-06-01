import React from "react";
import styles from "./mteImportReview.module.css";

interface ActionButtonsProps {
  onReturnToManageMTE: () => void;
  onReimport: () => void;
  onDataAnalysis: () => void;
  onDiscardData: () => void;
  hasErrors: boolean;
}

/**
 * ActionButtons – footer bar matching the IonCUDOS reference:
 * [✔ Return to Manage MTE]  [↺ Re-import]  [📊 Data Analysis]  [✕ Discard Data]
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  onReturnToManageMTE,
  onReimport,
  onDataAnalysis,
  onDiscardData,
  hasErrors,
}) => (
  <div className={styles.actionBar}>
    {/* Return to Manage MTE */}
    <button type="button" className={`${styles.btn} ${styles.btnReturn}`} onClick={onReturnToManageMTE}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
      </svg>
      Return to Manage MTE
    </button>

    {/* Re-import */}
    <button type="button" className={`${styles.btn} ${styles.btnReimport}`} onClick={onReimport}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
      </svg>
      Re-import
    </button>

    {/* Data Analysis */}
    <button
      type="button"
      className={`${styles.btn} ${styles.btnAnalysis}`}
      onClick={onDataAnalysis}
      disabled={hasErrors}
      title={hasErrors ? "Resolve validation errors before running analysis" : "View data analysis"}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
      </svg>
      Data Analysis
    </button>

    {/* Discard Data */}
    <button type="button" className={`${styles.btn} ${styles.btnDiscard}`} onClick={onDiscardData}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      </svg>
      Discard Data
    </button>
  </div>
);

export default ActionButtons;
