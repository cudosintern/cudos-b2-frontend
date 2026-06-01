import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../../../utils/api";
import { MteImportData, MteQuestion, MteStudentRow } from "./mteImportReview.types";

// ─────────────────────────────────────────────────────────────────────────────
// GET /mte-data-import/view-marks?ao_id=X response shape (per student row):
//
//   {
//     "student_usn":  "1RV20CS001",
//     "student_name": "John Doe",
//     "total_marks":  42.5,
//     "ao_id":        5,
//     "questions": [
//       { "qp_mq_id": 101, "question_no": "1a", "seq_no": 1,
//         "max_marks": 25.0, "secured_marks": 18.5 },
//       ...
//     ]
//   }
// ─────────────────────────────────────────────────────────────────────────────

const mapViewMarksData = (
  raw: any[],
  meta: MteImportData["meta"]
): MteImportData | null => {
  if (!raw || raw.length === 0) return null;

  // ── Build questions list from the first student (all have same structure) ──
  const firstStudent = raw[0];
  const serverQuestions: any[] = firstStudent?.questions ?? [];

  const questions: MteQuestion[] = serverQuestions
    .sort((a: any, b: any) => (a.seq_no ?? 0) - (b.seq_no ?? 0))
    .map((q: any) => ({
      key:        q.question_no ? String(q.question_no) : `Q${q.seq_no ?? q.qp_mq_id}`,
      questionNo: q.seq_no ?? q.qp_mq_id,
      max:        Number(q.max_marks ?? 0),
      cos:        [],
      bloomLevel: "NA",
    }));

  // ── Build student rows ─────────────────────────────────────────────────────
  const students: MteStudentRow[] = raw.map((row: any) => {
    const usn  = String(row.student_usn ?? "—");
    const name = String(row.student_name ?? usn);

    const marks: Record<string, number | null> = {};
    const rowQuestions: any[] = row.questions ?? [];
    rowQuestions.forEach((q: any) => {
      const key = q.question_no ? String(q.question_no) : `Q${q.seq_no ?? q.qp_mq_id}`;
      marks[key] = q.secured_marks !== null && q.secured_marks !== undefined
        ? Number(q.secured_marks)
        : null;
    });

    return { usn, name, marks, remarks: null };
  });

  return { meta, questions, students };
};

// ─────────────────────────────────────────────────────────────────────────────

interface UseMteImportReviewReturn {
  data:        MteImportData | null;
  loading:     boolean;
  error:       string | null;
  discardData: () => void;
  refetch:     () => void;
}

export const useMteImportReview = (
  occasionId?:  string,
  routerMeta?: Partial<MteImportData["meta"]>
): UseMteImportReviewReturn => {
  const [data,    setData]    = useState<MteImportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!occasionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the dedicated /view-marks?ao_id=X endpoint (occasion-scoped)
      const res      = await axiosInstance.get(
        `/mte-data-import/view-marks?ao_id=${occasionId}`
      );
      const allRows: any[] = (res.data as any)?.data ?? [];

      const meta: MteImportData["meta"] = {
        school:     routerMeta?.school     ?? "",
        program:    routerMeta?.program    ?? "",
        curriculum: routerMeta?.curriculum ?? "",
        term:       routerMeta?.term       ?? "",
        course:     routerMeta?.course     ?? "",
        fileName:   routerMeta?.fileName   ?? "",
        occasionId: occasionId,
      };

      setData(mapViewMarksData(allRows, meta));
    } catch (err: any) {
      console.error("useMteImportReview: fetch error", err);
      setError("Failed to load import review data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [occasionId, routerMeta?.course]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const discardData = () => setData(null);

  return { data, loading, error, discardData, refetch: fetchData };
};
