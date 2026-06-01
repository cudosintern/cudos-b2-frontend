import React from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import styles from '../mtedataimport/mteImportReview/mteImportReview.module.css';

interface SEEUploadHeaderProps {
    title: string;
    data: {
        school?: string;
        program?: string;
        academic_batch_code?: string;
        curriculum?: string;
        term_name?: string;
        term?: string;
        course?: string;
        fileName?: string;
        courseName?: string;
        courseCode?: string;
    } | null;
    showTitle?: boolean;
}

const SEEUploadHeader: React.FC<SEEUploadHeaderProps> = ({ title, data, showTitle = true }) => {
    return (
        <div className={styles.headerWrapper}>
            {/* Header Title Bar - Light Mode */}
            {showTitle && (
                <div className={styles.titleBar} style={{ background: '#ffffff', color: '#4a8494', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <span style={{ fontWeight: 700 }}>{title}</span>
                </div>
            )}

            {/* Metadata Strip */}
            <div className={styles.metaStrip}>
                {/* Row 1 */}
                <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>School:</span>
                        <span className={styles.metaValue}>{data?.school || '—'}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Program:</span>
                        <span className={styles.metaValue}>{data?.program || '—'}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Curriculum:</span>
                        <span className={styles.metaValue}>{data?.academic_batch_code || data?.curriculum || '—'}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Term:</span>
                        <span className={styles.metaValue}>{data?.term_name || data?.term || '—'}</span>
                    </div>
                </div>

                {/* Row 2 */}
                <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Course:</span>
                        <span className={styles.metaValue}>{data?.course || '—'}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>File Name:</span>
                        <span className={styles.metaValue}>{data?.fileName || 'No file uploaded'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SEEUploadHeader;
