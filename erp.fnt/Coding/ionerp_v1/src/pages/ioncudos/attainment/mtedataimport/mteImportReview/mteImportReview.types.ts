// ─────────────────────────────────────────────────────────────────────────────
// Types for "Mid-Term Examination Assessment Data Import Details" Page
// ─────────────────────────────────────────────────────────────────────────────

/** Metadata shown in the header strip */
export interface MteImportMeta {
  school: string;
  program: string;
  curriculum: string;
  term: string;
  course: string;
  fileName: string;
  occasionId: string;
}

/** A single question column descriptor */
export interface MteQuestion {
  key: string;        // "Q1", "Q2" etc. – used to look up marks
  questionNo: number; // Display number: 1, 2, 3 ...
  max: number;        // Max marks for this question
  cos: string[];      // e.g. ["CO1", "CO2"]
  bloomLevel: string; // e.g. "L1", "L2", or "NA"
}

/** Per-student mark row */
export interface MteStudentRow {
  usn: string;
  name: string;
  marks: Record<string, number | null>; // questionKey → mark
  remarks?: string | null;
}

/** Full dataset */
export interface MteImportData {
  meta: MteImportMeta;
  questions: MteQuestion[];
  students: MteStudentRow[];
}

/** Validation error per cell */
export interface CellError {
  usn: string;
  questionKey: string;
  message: string;
}
