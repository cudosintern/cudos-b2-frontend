import React from "react";
import styles from "./mteImportReview.module.css";
import { MteImportMeta } from "./mteImportReview.types";

interface HeaderSectionProps {
  meta: MteImportMeta;
}

/**
 * HeaderSection – two-row metadata strip matching the IonCUDOS reference:
 * Row 1: School | Program | Curriculum | Term
 * Row 2: Course | File Name (with download icon)
 */
const HeaderSection: React.FC<HeaderSectionProps> = ({ meta }) => {
  const handleDownload = () => {
    // TODO: replace with real download logic/URL
    console.log(`Download triggered for: ${meta.fileName}`);
  };

  return (
    <div className={styles.metaStrip}>
      {/* ── Row 1 ── */}
      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>School:</span>
          <span className={styles.metaValue}>{meta.school}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Program:</span>
          <span className={styles.metaValue}>{meta.program}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Curriculum:</span>
          <span className={styles.metaValue}>{meta.curriculum}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Term:</span>
          <span className={styles.metaValue}>{meta.term}</span>
        </div>
      </div>

      {/* ── Row 2 ── */}
      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Course:</span>
          <span className={styles.metaValue}>{meta.course}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>File Name:</span>
          <span className={styles.metaValue}>
            {meta.fileName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeaderSection;
