import { useEffect, useState } from "react";
import axiosInstance from "../../../../utils/api";
import { QPDetailsData, QPQuestion } from "./qpDetails.types";

// ─────────────────────────────────────────────────────────────────────────────
// Backend /qp-view response shape (actual):
//
// [
//   {
//     "qp_id": 1,
//     "units": [
//       {
//         "unit_id": 1,
//         "unit_name": "Section A",
//         "questions": [
//           {
//             "question_id": 101,
//             "question_no": "1a",
//             "question_text": "...",
//             "max_marks": 25.0,
//             "co_mappings": ["CO1", "CO2"],   ← array of strings
//             "bloom_levels": ["L1"],           ← array of strings
//             "pi_codes": ["PI1"]               ← array of strings
//           }
//         ]
//       }
//     ]
//   }
// ]
//
// NOTE: `duration`, `course_title`, `course_code` are NOT in the current backend
// response. We use "—" / 0 as fallbacks until backend adds them.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flatten the nested units → questions structure returned by /qp-view and
 * map it to the QPDetailsData shape expected by QPDetailsModal.
 */
const mapToQPDetailsData = (qpItem: any): QPDetailsData | null => {
  if (!qpItem) return null;

  const units: any[] = Array.isArray(qpItem.units) ? qpItem.units : [];

  // Flatten all questions from all units, preserving question order
  const questions: QPQuestion[] = [];
  let questionCounter = 0;

  units.forEach((unit: any) => {
    const unitQuestions: any[] = Array.isArray(unit.questions) ? unit.questions : [];
    unitQuestions.forEach((q: any) => {
      questionCounter += 1;

      // co_mappings → comma-joined string (e.g. "CO1, CO2")
      const cos = Array.isArray(q.co_mappings)
        ? q.co_mappings.join(", ")
        : String(q.co_mappings ?? "");

      // bloom_levels → first entry, or "NA"
      const level = Array.isArray(q.bloom_levels) && q.bloom_levels.length > 0
        ? q.bloom_levels[0]
        : (q.bloom_level ?? "NA");

      // pi_codes → first entry, or "—"
      const piCode = Array.isArray(q.pi_codes) && q.pi_codes.length > 0
        ? q.pi_codes[0]
        : "—";

      questions.push({
        questionNo: q.question_no != null ? Number(q.question_no) || questionCounter : questionCounter,
        // Use question_text if available; fall back to question_no label (e.g. "1a")
        text: q.question_text ?? q.text ?? q.question_no ?? "",
        cos,
        level,
        piCode,
        marks: Number(q.max_marks ?? 0),
      });
    });
  });

  // Compute total QP max marks by summing all question marks
  const totalMaxMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return {
    // duration is not yet in backend response — default to 0
    duration: Number(qpItem.duration ?? 0),
    maxMarks: Number(qpItem.max_marks ?? totalMaxMarks),
    course: {
      // course_title & course_code not yet in backend response — use fallbacks
      title: qpItem.course_title ?? qpItem.course_name ?? "",
      code: qpItem.course_code ?? qpItem.crs_code ?? "",
    },
    questions,
  };
};

// ─────────────────────────────────────────────────────────────────────────────

export const useQpDetails = (occasionId: string | null) => {
  const [data, setData] = useState<QPDetailsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!occasionId) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchQpView = async () => {
      try {
        // Call the focused endpoint that returns QP details for a single occasion
        const res = await axiosInstance.get(`/mte-data-import/occasion-qp-details?ao_id=${occasionId}`);
        if (cancelled) return;

        const allItems: any[] = (res.data as any)?.data ?? [];

        if (allItems.length === 0) {
          setData(null);
          return;
        }

        // The API returns exactly one QP for the requested occasion
        setData(mapToQPDetailsData(allItems[0]));
      } catch (err: any) {
        console.error("useQpDetails: fetch error", err);
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchQpView();
    return () => { cancelled = true; };
  }, [occasionId]);

  return { data, loading };
};
