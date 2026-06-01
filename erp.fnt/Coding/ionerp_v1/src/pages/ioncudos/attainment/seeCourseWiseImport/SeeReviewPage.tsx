import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Course, ImportedStudentMarks, SEEQuestion } from './seeImportTypes';
import { seeImportService } from './seeImportService';
import styles from '../mtedataimport/mteImportReview/mteImportReview.module.css';
import SEEUploadHeader from './SEEUploadHeader';
import SEEAnalysisModal from './SEEAnalysisModal';
import ConfirmDialog from '../../../../components/Dialog/ConfirmDialog';
import { FaCheck, FaSync, FaChartBar, FaTimes } from 'react-icons/fa';

interface SeeReviewPageProps {
  course: Course;
  school?: string;
  program?: string;
  curriculum?: string;
  term?: string;
  termId: number;
  onClose: () => void;
  onReimport: () => void;
}

const SeeReviewPage: React.FC<SeeReviewPageProps> = ({
  course,
  school,
  program,
  curriculum,
  term,
  termId,
  onClose,
  onReimport,
}) => {
  const [data, setData] = useState<ImportedStudentMarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    fetchData();
  }, [course.course_id, termId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await seeImportService.viewImported(course.course_id, termId);
      setData(result || []);
    } catch (err) {
      setError("Failed to load imported data.");
    } finally {
      setLoading(false);
    }
  };

  // ── Column Identification & Metadata Inference ────────────────────────────
  const processedData = useMemo(() => {
    if (data.length === 0) return { questions: [], usnKey: 'usn', nameKey: 'student_name', totalKey: 'total', remarksKey: 'remarks' };

    const allKeys = Object.keys(data[0]);
    
    // Helper to check if a column is numeric/empty across first few rows
    const columnInsights = allKeys.reduce((acc, key) => {
      const samples = data.slice(0, 10).map(r => r[key]);
      const hasValue = samples.some(v => v !== null && v !== undefined && String(v).trim() !== '');
      const isNumeric = hasValue && samples.every(v => v === null || v === undefined || String(v).trim() === '' || !isNaN(Number(v)));
      const isLongString = hasValue && samples.some(v => typeof v === 'string' && v.trim().length > 3);
      
      acc[key] = { hasValue, isNumeric, isLongString };
      return acc;
    }, {} as Record<string, { hasValue: boolean; isNumeric: boolean; isLongString: boolean }>);

    const findKeyBest = (targets: string[], priority: 'string' | 'numeric' | 'any') => {
      // 1. Try to find a match in targets that also fits the priority
      const normalizedTargets = targets.map(t => t.toLowerCase().replace(/[\s_]/g, ''));
      
      const match = allKeys.find(k => {
        const normK = k.toLowerCase().replace(/[\s_]/g, '');
        if (!normalizedTargets.includes(normK)) return false;
        if (priority === 'string') return columnInsights[k].isLongString;
        if (priority === 'numeric') return columnInsights[k].isNumeric;
        return true;
      });
      
      if (match) return match;

      // 2. Try just the target match if priority fails
      return allKeys.find(k => normalizedTargets.includes(k.toLowerCase().replace(/[\s_]/g, ''))) || null;
    };

    // Mapping logic
    const usnKey = findKeyBest(['usn', 'pnr', 'regno', 'studentusn', 'rollno', 'register', 'pnr_usn'], 'numeric') || 
                   allKeys.find(k => k.toLowerCase().includes('usn') || k.toLowerCase().includes('pnr')) || 
                   allKeys[0];

    // Name key: prioritize columns with long strings and "name" or "student" in the key
    let nameKey = findKeyBest(['studentname', 'name', 'fullname', 'stname', 'firstname', 'student_name', 'student'], 'string');
    
    if (!nameKey || nameKey === usnKey) {
      nameKey = allKeys.find(k => k !== usnKey && columnInsights[k].isLongString && !k.toLowerCase().includes('remark')) || 
                allKeys.find(k => k !== usnKey && !columnInsights[k].isNumeric && !k.toLowerCase().includes('remark')) || 
                'student_name';
    }

    const totalKey = findKeyBest(['total', 'totalmarks', 'grandtotal', 'marks_total', 'sum'], 'numeric') || 'total';
    const remarksKey = allKeys.find(k => k.toLowerCase().includes('remark') || k.toLowerCase().includes('msg') || k.toLowerCase().includes('comment')) || 'remarks';

    const reserved = [usnKey, nameKey, totalKey, remarksKey];
    const qKeys = allKeys.filter(k => 
      !reserved.includes(k) && 
      !['course_id', 'term_id', 'id'].includes(k.toLowerCase()) &&
      columnInsights[k].hasValue
    );

    // Inplace inference (Replace with real API data if available)
    const questions: SEEQuestion[] = qKeys.map(k => ({
      key: k,
      label: k, // e.g. "Q1" or "1"
      max: Number(k.match(/\d+/)?.[0]) || 25, // Mock max marks based on number or default
      bloomLevel: 'L2', // Mock
      cos: ['CO1', 'CO2'] // Mock
    }));

    return { questions, usnKey, nameKey, totalKey, remarksKey };
  }, [data]);

  const { questions, usnKey, nameKey, totalKey, remarksKey } = processedData;

  const handleDiscard = async () => {
    try {
      setLoading(true);
      const res = await seeImportService.discardImport(course.course_id, termId);
      if (res?.status === false) {
        throw new Error(res.message || "Failed to discard data.");
      }
      toast.success("Imported data discarded successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to discard data.");
    } finally {
      setLoading(false);
      setConfirmDiscard(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-500 animate-pulse">Loading imported marks...</div>;

  return (
    <div className={styles.pageWrapper}>
      {/* ── Title Bar (White style override per MTE reference) ── */}
      <div className={styles.titleBar} style={{ background: '#ffffff', color: '#4a8494', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <span style={{ fontWeight: 700 }}>Semester End Examination Data Import Details</span>
      </div>

      {/* ── Metadata Strip ── */}
      <div className={styles.metaStrip}>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>SCHOOL:</span>
            <span className={styles.metaValue}>{school || '—'}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>PROGRAM:</span>
            <span className={styles.metaValue}>{program || '—'}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>CURRICULUM:</span>
            <span className={styles.metaValue}>{curriculum || '—'}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>TERM:</span>
            <span className={styles.metaValue}>{term || '—'}</span>
          </div>
        </div>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>COURSE:</span>
            <span className={styles.metaValue}>{course.course_title} ({course.course_code})</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>FILE NAME:</span>
            <span className={styles.metaValue}>{curriculum}_${course.course_code}_SEE.xlsx</span>
          </div>
        </div>
      </div>

      {/* ── Marks Table ── */}
      <div className="p-4 flex-grow overflow-hidden flex flex-col pt-0">
        {data.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.marksTable}>
              <thead>
                <tr>
                  <th rowSpan={2} className={`${styles.slNo} border-r`}>SL NO</th>
                  <th rowSpan={2} className={`${styles.thLeft} border-r`}>PNR/USN</th>
                  <th rowSpan={2} className={`${styles.thLeft} border-r`}>STUDENT NAME</th>
                  {questions.map(q => (
                    <th key={q.key} className="border-r">
                      {q.key}({q.max}.00)
                    </th>
                  ))}
                  <th rowSpan={2} className={`${styles.totalCell} border-r`}>TOTAL MARKS(100.00)</th>
                  <th rowSpan={2}>REMARKS</th>
                </tr>
                <tr className={styles.coRow}>
                  {questions.map(q => (
                    <th key={`${q.key}-cos`} className="border-r">
                      {q.cos?.join(',')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className={styles.row}>
                    <td className={`${styles.tdCenter} ${styles.slNo}`}>{idx + 1}</td>
                    <td className={`${styles.tdLeft} ${styles.usnCell}`}>{row[usnKey]}</td>
                    <td className={styles.tdLeft}>{row[nameKey]}</td>
                    {questions.map(q => (
                      <td key={q.key} className={`${styles.tdCenter} font-bold text-blue-800`}>
                        {row[q.key] !== null && row[q.key] !== undefined ? Number(row[q.key]).toFixed(2) : '—'}
                      </td>
                    ))}
                    <td className={`${styles.tdCenter} ${styles.totalCell}`}>
                      {row[totalKey] !== null ? Number(row[totalKey]).toFixed(2) : '—'}
                    </td>
                    <td className={styles.tdLeft} style={{ fontSize: '11px', color: row[remarksKey] ? '#ef4444' : '#64748b' }}>
                      {row[remarksKey] || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.stateBox}>No data records found for this course.</div>
        )}
      </div>

      {/* ── Action Footer – Exactly matching MTE actionBar ── */}
      <div className={styles.actionBar}>
        <button className={`${styles.btn} ${styles.btnReturn}`} onClick={onClose}>
          <FaCheck size={12} /> Return to Manage SEE
        </button>
        <button className={`${styles.btn} ${styles.btnReimport}`} onClick={onReimport}>
          <FaSync size={12} /> Re-import
        </button>
        <button className={`${styles.btn} ${styles.btnAnalysis}`} onClick={() => setIsAnalysisOpen(true)}>
          <FaChartBar size={12} /> Data Analysis
        </button>
        <button className={`${styles.btn} ${styles.btnDiscard}`} onClick={() => setConfirmDiscard(true)}>
          <FaTimes size={12} /> Discard Data
        </button>
      </div>

      {/* ── Modals ── */}
      <SEEAnalysisModal 
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        questions={questions}
        students={data}
      />

      <ConfirmDialog
        isOpen={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={handleDiscard}
        title="Confirm Discard"
        message="Are you sure you want to discard all imported data for this course? This action cannot be undone."
      />
    </div>
  );
};

export default SeeReviewPage;