import { useMemo } from "react";
import { MteQuestion, MteStudentRow } from "./mteImportReview.types";

export interface QuestionStats {
  average: string;
  stdDev: string;
  min: string;
  max: string;
  attempts: number;
  percentAttempt: string;
  percentAttainment: string;
}

/**
 * Custom hook to calculate statistical metrics per question.
 * Built with separation of concerns and performance (useMemo).
 */
export const useAnalysisStats = (
  questions: MteQuestion[],
  students: MteStudentRow[]
) => {
  return useMemo(() => {
    const totalStudents = students.length;

    return questions.map((q) => {
      // Step 1: Extract and filter valid scores for this specific question
      const rawScores = students.map((s) => s.marks[q.key]);
      const validScores = rawScores.filter(
        (m): m is number => m !== null && m !== undefined
      );

      const attempts = validScores.length;

      // Handle edge case: No attempts for this question
      if (attempts === 0) {
        return {
          average: "0.0",
          stdDev: "0.0",
          min: "—",
          max: "—",
          attempts: 0,
          percentAttempt: "0.0",
          percentAttainment: "0.0",
        };
      }

      // Step 2: Compute Basic Metrics
      const sum = validScores.reduce((acc, score) => acc + score, 0);
      const average = sum / attempts;

      const minScore = Math.min(...validScores);
      const maxScore = Math.max(...validScores);

      // Step 3: Compute Population Standard Deviation
      // sqrt(sum((x - mean)^2) / n)
      const squareDiffs = validScores.map((score) => Math.pow(score - average, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / attempts;
      const stdDev = Math.sqrt(avgSquareDiff);

      // Step 4: Compute Percentages
      const percentAttempt = (attempts / totalStudents) * 100;
      const percentAttainment = (average / q.max) * 100;

      return {
        average: average.toFixed(1),
        stdDev: stdDev.toFixed(2),
        min: minScore.toString(),
        max: maxScore.toString(),
        attempts,
        percentAttempt: percentAttempt.toFixed(1),
        percentAttainment: percentAttainment.toFixed(1),
      };
    });
  }, [questions, students]);
};
