import React from "react";
import styles from "./mteImportReview.module.css";
import { MteQuestion, MteStudentRow, CellError } from "./mteImportReview.types";

interface MarksTableProps {
  questions: MteQuestion[];
  students: MteStudentRow[];
  errors: CellError[];
}

/** Sum all marks for a student */
const computeTotal = (marks: Record<string, number | null>): number =>
  Object.values(marks).reduce<number>((acc, v) => acc + (v ?? 0), 0);

/** Total maximum marks across all questions */
const computeMaxTotal = (questions: MteQuestion[]): number =>
  questions.reduce((acc, q) => acc + q.max, 0);

/** Is there a cell-level validation error? */
const isCellInvalid = (errors: CellError[], usn: string, key: string): boolean =>
  errors.some((e) => e.usn === usn && e.questionKey === key);

/** Does this student row have any error? */
const isRowInvalid = (errors: CellError[], student: MteStudentRow): boolean =>
  errors.some((e) => e.usn === student.usn) || !!student.remarks;

/**
 * MarksTable - Restored to original CSS Module styling
 */
const MarksTable: React.FC<MarksTableProps> = ({ questions, students, errors }) => {
  const maxTotal = computeMaxTotal(questions);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.marksTable}>
        <thead>
          {/* ── Row 1: Column headers ───────────────────────────────── */}
          <tr>
            <th rowSpan={2} style={{ width: 55, textAlign: "center" }}>
              SL NO
            </th>
            <th rowSpan={2} style={{ minWidth: 85, textAlign: "center" }}>
              PNR/USN
            </th>
            <th
              rowSpan={2}
              className={styles.thLeft}
              style={{ minWidth: 180 }}
            >
              STUDENT NAME
            </th>

            {/* Dynamic question columns */}
            {questions.map((q) => (
              <th key={q.key} style={{ minWidth: 80, textAlign: "center" }}>
                {q.questionNo}({q.max.toFixed(2)})
              </th>
            ))}

            {/* Total header */}
            <th style={{ minWidth: 100, textAlign: "center" }}>
              TOTAL MARKS({maxTotal.toFixed(2)})
            </th>

            {/* Remarks header */}
            <th style={{ minWidth: 150, textAlign: "left" }}>
              REMARKS
            </th>
          </tr>

          {/* ── Row 2: CO mapping row ───────────────────────────────── */}
          <tr className={styles.coRow}>
            {/* SL NO / PNR/USN / STUDENT NAME already covered by rowSpan */}
            {questions.map((q) => (
              <th key={`co-${q.key}`}>{q.cos.join(",")}</th>
            ))}
            {/* Empty cell under TOTAL MARKS and REMARKS */}
            <th />
            <th />
          </tr>
        </thead>

        <tbody>
          {students.map((student, idx) => {
            const total = computeTotal(student.marks);
            const rowError = isRowInvalid(errors, student);

            return (
              <tr
                key={student.usn}
                className={rowError ? styles.invalidRow : undefined}
              >
                {/* SL NO */}
                <td className={`${styles.tdCenter} ${styles.slNo}`}>
                  {idx + 1}
                </td>

                {/* PNR / USN */}
                <td className={`${styles.tdCenter} ${styles.usnCell}`}>
                  {student.usn}
                </td>

                {/* Student Name */}
                <td className={styles.tdLeft}>{student.name}</td>

                {/* Dynamic mark cells */}
                {questions.map((q) => {
                  const mark = student.marks[q.key];
                  const cellError = isCellInvalid(errors, student.usn, q.key);
                  const errMsg = cellError
                    ? errors.find(
                        (e) => e.usn === student.usn && e.questionKey === q.key
                      )?.message
                    : undefined;

                  return (
                    <td
                      key={`${student.usn}-${q.key}`}
                      className={`${styles.tdCenter} ${
                        cellError ? styles.invalidCell : ""
                      }`}
                      title={errMsg}
                    >
                      {mark !== null && mark !== undefined
                        ? mark.toFixed(2)
                        : "—"}
                    </td>
                  );
                })}

                {/* Row Total */}
                <td className={`${styles.tdCenter} ${styles.totalCell}`}>
                  {total.toFixed(2)}
                </td>

                {/* Remarks */}
                <td className={styles.tdLeft} style={{ fontSize: 11, color: '#dc2626', fontWeight: 500 }}>
                  {student.remarks || ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MarksTable;
