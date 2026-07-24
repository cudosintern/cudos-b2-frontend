export type DataAnalysisType = "CCE" | "MTE" | "SEE";

export interface SelectOption {
  id: string;
  label: string;
}

export interface DataAnalysisFiltersState {
  schoolId: string;
  programId: string;
  curriculumId: string;
  termId: string;
  courseId: string;
  type: DataAnalysisType | "";
  sectionId: string;
  occasionId: string;
}

export interface DataAnalysisRequestContext {
  schoolId: string;
  programId: string;
  curriculumId: string;
  termId: string;
  courseId: string;
  type: DataAnalysisType;
}

export interface DataAnalysisSectionsRequest extends DataAnalysisRequestContext {}

export interface DataAnalysisOccasionsRequest extends DataAnalysisRequestContext {
  sectionId: string;
}

export interface DataAnalysisReportRequest extends DataAnalysisRequestContext {
  sectionId: string;
  occasionId?: string;
}

export interface DataAnalysisOccasionsResponse {
  required: boolean;
  options: SelectOption[];
}

export interface DataAnalysisQuestionResult {
  bloomsLevel: string;
  question: string;
  co: string;
  marks: number;
  average: number;
  standardDeviation: number;
  minInRange: number;
  maxInRange: number;
  numberOfAttempts: number;
  percentageOfAttempt: number;
  percentageOfAttainment: number;
}

export interface DataAnalysisReportData {
  questions: DataAnalysisQuestionResult[];
}

export interface DataAnalysisValidationResponse {
  status: "validation";
  message: string;
}

export interface DataAnalysisSuccessResponse {
  status: "success";
  data: DataAnalysisReportData;
}

export type DataAnalysisReportResponse =
  | DataAnalysisSuccessResponse
  | DataAnalysisValidationResponse;

export type DataAnalysisReportState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: DataAnalysisReportData }
  | { kind: "validation"; message: string }
  | { kind: "error"; message: string };

export interface DataAnalysisAsyncState {
  isLoading: boolean;
  error: string | null;
}
