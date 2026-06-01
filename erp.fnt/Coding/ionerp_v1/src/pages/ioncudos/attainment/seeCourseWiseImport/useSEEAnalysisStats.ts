import { useMemo } from "react";
import { SEEQuestion, ImportedStudentMarks, SEEQuestionStats } from "./seeImportTypes";

/**
 * Custom hook to calculate statistical metrics per question for SEE.
 * Ported from MTE analysis logic for consistency.
 */
export const useSEEAnalysisStats = (
  questions: SEEQuestion[],
  students: any[]
): SEEQuestionStats[] => {
  return useMemo(() => {
    const totalStudents = students.length;

    return questions.map((q) => {
      // Extract marks for this question key
      const rawScores = students.map((s) => s[q.key]);
      
      // Filter valid numbers
      const validScores = rawScores
        .map(s => Number(s))
        .filter((m) => !isNaN(m) && m !== null && m !== undefined);

      const attempts = validScores.length;

      // Handle edge case: No attempts for this question
      if (attempts === 0 || totalStudents === 0) {
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

      // Compute Basic Metrics
      const sum = validScores.reduce((acc, score) => acc + score, 0);
      const average = sum / attempts;

      const minScore = Math.min(...validScores);
      const maxScore = Math.max(...validScores);

      // Compute Population Standard Deviation
      // sqrt(sum((x - mean)^2) / n)
      const squareDiffs = validScores.map((score) => Math.pow(score - average, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / attempts;
      const stdDev = Math.sqrt(avgSquareDiff);

      // Compute Percentages
      const percentAttempt = (attempts / totalStudents) * 100;
      const percentAttainment = q.max > 0 ? (average / q.max) * 100 : 0;

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
