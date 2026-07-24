import type { Dispatch, SetStateAction } from "react";

export type CourseCoAttainmentTabId =
  | "cce"
  | "mte"
  | "finalize"
  | "blooms"
  | "directIndirect";

export type CourseCoAttainmentExportFormat = "pdf" | "doc";

export interface CourseCoAttainmentOption {
  id: string;
  label: string;
}

export interface CourseCoAttainmentTermOption extends CourseCoAttainmentOption {
  curriculumId: string;
}

export interface CourseCoAttainmentCourseOption extends CourseCoAttainmentOption {
  curriculumId: string;
  termId: string;
}

export interface CourseCoAttainmentSectionOption extends CourseCoAttainmentOption {
  sectionCode?: string;
}

export interface CourseCoAttainmentModuleFlags {
  mteFlag: boolean;
  emsIntegration: boolean;
}

export interface CourseCoAttainmentRawRecord {
  [key: string]: unknown;
}

export interface CourseCoAttainmentFiltersState {
  curriculumId: string;
  termId: string;
  courseId: string;
}

export interface CourseCoAttainmentFilterCatalogResponse {
  curriculums: CourseCoAttainmentOption[];
  terms: CourseCoAttainmentTermOption[];
  courses: CourseCoAttainmentCourseOption[];
}

export interface CourseCoAttainmentFilterOptionsResponse {
  curriculums: CourseCoAttainmentOption[];
  terms: CourseCoAttainmentOption[];
  courses: CourseCoAttainmentOption[];
}

export interface CoAttainmentRow {
  coId?: string;
  coCode: string;
  thresholdBasedAttainmentPercent: string;
  attainmentLevel: string;
  averageBasedAttainmentPercent: string;
}

export interface CourseCoAttainmentSummary {
  actualCourseAttainment: string;
  courseAttainmentAfterWeightage: string;
}

export interface CourseCoAttainmentSectionBlock {
  id: string;
  sectionLabel: string;
  batchLabel?: string;
  statusText: string;
  statusTone: "warning" | "success" | "info";
  rows: CoAttainmentRow[];
  summary: CourseCoAttainmentSummary;
}

export interface CourseCoAttainmentTableResponse {
  title: string;
  sections: CourseCoAttainmentSectionBlock[];
  finalizeLinkText?: string;
}

export interface CourseCoAttainmentOverviewTableResponse {
  title?: string;
  sections?: CourseCoAttainmentSectionBlock[];
  rows?: CoAttainmentRow[];
  finalizeLinkText?: string;
}

export interface TargetLevelRow {
  attainmentLevelName: string;
  attainmentLevelValue: number;
  target: string;
}

export interface DirectTargetLevelsResponse {
  title: string;
  rows: TargetLevelRow[];
  publishButtonLabel: string;
}

export interface FormulaCard {
  title: string;
  lines: string[];
}

export interface NoteSectionResponse {
  note: string;
  formulas: FormulaCard[];
}

export interface FinalizeOccasionOption {
  id: string;
  label: string;
}

export interface FinalizeStatusMessage {
  lines: string[];
  linkText: string;
}

export interface FinalizeCourseOverviewRow {
  coCode: string;
  coStatement: string;
  thresholdBasedAttainmentPercent: string;
  attainmentLevel: string;
  averageBasedThresholdPercent: string;
}

export interface CoPoMatrixRow {
  coCode: string;
  values: string[];
}

export interface ProgramOutcomeAttainmentRow {
  serialNo: number;
  programOutcome: string;
  thresholdMethodPercent: string;
  thresholdMethodLevel: string;
  weightedAveragePercent: string;
  weightedAverageLevel: string;
  relativeWeightedAveragePercent: string;
  relativeWeightedAverageLevel: string;
}

export interface MapLevelWeightageRow {
  serialNo: number;
  mapLevel: string;
  value: string;
  mapLevelWeightage: string;
}

export interface CompactChartPoint {
  label: string;
  thresholdPercent: number;
  attainmentPercent: number;
}

export interface PendingFinalizePreview {
  title: string;
  legendLabel: string;
  chartPoints: CompactChartPoint[];
  targetLevels: {
    title: string;
    columns: Array<{
      assessmentType: string;
      label: string;
    }>;
    rows: Array<{
      serialNo: number;
      attainmentLevelName: string;
      attainmentLevelValue: number;
      targets: Array<{
        assessmentType: string;
        label: string;
        value: string;
      }>;
    }>;
  };
  overallCourseOutcomesTitle: string;
  overallCourseOutcomesRows: Array<CoAttainmentRow & { coStatement?: string; drillDownAvailable?: boolean }>;
}

export interface FinalizeCourseTabResponse {
  typeOptions: FinalizeOccasionOption[];
  defaultTypeId: string;
  note: string;
  statusMessage?: FinalizeStatusMessage;
  finalizedTableTitle: string;
  finalizedRows: FinalizeCourseOverviewRow[];
  coPoMatrixTitle: string;
  coPoMatrixColumns: string[];
  coPoMatrixRows: CoPoMatrixRow[];
  programOutcomesTitle: string;
  programOutcomeRows: ProgramOutcomeAttainmentRow[];
  mapLevelWeightageTitle: string;
  mapLevelWeightageRows: MapLevelWeightageRow[];
  calculationNotes: FormulaCard[];
  pendingPreview?: PendingFinalizePreview;
}

export interface BloomLevelRow {
  serialNo: number;
  bloomLevel: string;
  threshold: string;
  attainment: string;
}

export interface BloomLevelTabResponse {
  typeOptions: CourseCoAttainmentOption[];
  sectionOptions: CourseCoAttainmentOption[];
  occasionOptions: CourseCoAttainmentOption[];
  studentOptions: CourseCoAttainmentOption[];
  defaultTypeId: string;
  defaultSectionId: string;
  defaultOccasionId: string;
  defaultStudentId: string;
  chartTitle: string;
  chartPoints: CompactChartPoint[];
  rows: BloomLevelRow[];
  messages: string[];
}

export interface DirectIndirectAttainmentRow {
  serialNo: number;
  coCode: string;
  actualDirectAttainmentPercent: string;
  actualDirectAttainmentLevel: string;
  actualIndirectAttainmentPercent: string;
  actualIndirectAttainmentLevel: string;
  directPercentage: string;
  indirectPercentage: string;
  afterWeightageDirectAttainmentPercent: string;
  afterWeightageDirectAttainmentLevel: string;
  afterWeightageIndirectAttainmentPercent: string;
  afterWeightageIndirectAttainmentLevel: string;
  overallAttainment: string;
  attainmentLevel: string;
  coStatement?: string;
}

export interface DirectIndirectChartPoint {
  label: string;
  value: number;
  coCode?: string;
  coStatement?: string;
}

export interface DirectIndirectTabResponse {
  surveyOptions: CourseCoAttainmentOption[];
  defaultSurveyId: string;
  directWeight: string;
  indirectWeight: string;
  note: string;
  submitButtonLabel: string;
  validationMessage: string;
  previewMessages: string[];
  selectedSurveyLabel: string;
  rows: DirectIndirectAttainmentRow[];
  chartTitle: string;
  chartPoints: DirectIndirectChartPoint[];
  previewReady: boolean;
  canFinalize: boolean;
  finalizeButtonLabel: string;
  finalizeMessage: string;
}

export interface CourseCoAttainmentTabDataResponse {
  cce: CourseCoAttainmentTableResponse;
  mte: CourseCoAttainmentTableResponse;
  targetLevels: DirectTargetLevelsResponse;
  noteSection: NoteSectionResponse;
  finalize: FinalizeCourseTabResponse;
  blooms: BloomLevelTabResponse;
  directIndirect: DirectIndirectTabResponse;
}

export interface CourseCoAttainmentInitialState {
  curriculumId: string;
  termId: string;
  courseId: string;
}

export interface CourseCoAttainmentOverviewFlags {
  ciaFinalized: boolean;
  mteFinalized: boolean;
  teeAvailable: boolean;
  canFinalizeCourse: boolean;
}

export interface CourseCoAttainmentOverviewMessages {
  lines: string[];
  messages?: string[];
}

export interface CourseCoAttainmentOverviewData {
  availableAssessmentTypes: string[];
  flags: CourseCoAttainmentOverviewFlags;
  prerequisites: CourseCoAttainmentOverviewMessages;
  course?: {
    total_mte_weightage?: number | string;
    [key: string]: unknown;
  };
  cce?: CourseCoAttainmentOverviewTableResponse;
  mte?: CourseCoAttainmentOverviewTableResponse;
  targetLevels?: Partial<DirectTargetLevelsResponse>;
  finalizedOverallCourseAttainment?: Partial<FinalizeCourseTabResponse>;
}

export interface CourseCoAttainmentCombinedPreviewData {
  prerequisites?: CourseCoAttainmentOverviewMessages;
  flags?: Partial<CourseCoAttainmentOverviewFlags> & { ready?: boolean };
  ready?: boolean;
  selectedAssessmentTypes?: string[];
  coRows?: Array<CoAttainmentRow & { coStatement?: string; drillDownAvailable?: boolean }>;
  targetLevels?: PendingFinalizePreview["targetLevels"];
  graph?: {
    labels?: string[];
    series?: Array<{
      name?: string;
      values?: Array<number | string>;
    }>;
  };
}

export interface CourseCoAttainmentDrilldownAssessmentRow {
  assessmentType: string;
  assessmentLabel: string;
  weightagePercent?: string | null;
  available: boolean;
  actualAttainmentPercent?: string | null;
  actualAttainmentLevel?: string | null;
  afterWeightageAttainmentPercent?: string | null;
  afterWeightageAttainmentLevel?: string | null;
}

export interface CourseCoAttainmentDrilldownData {
  course?: {
    courseCode?: string;
    courseTitle?: string;
    totalCiaWeightage?: string | number;
    totalMteWeightage?: string | number;
    totalTeeWeightage?: string | number;
  };
  clo?: {
    coId?: string | number;
    coCode?: string;
    coStatement?: string;
  };
  weights?: {
    cia?: string | null;
    mte?: string | null;
    tee?: string | null;
  };
  assessmentRows?: CourseCoAttainmentDrilldownAssessmentRow[];
  overall?: {
    overallAttainmentPercent?: string | null;
    overallAttainmentPercentDisplay?: string | null;
    overallAttainmentLevel?: string | null;
  };
}

export interface CourseCoAttainmentBloomsPreviewData {
  prerequisites?: CourseCoAttainmentOverviewMessages;
  rows?: BloomLevelRow[];
  chart?: {
    labels?: string[];
    series?: Array<{
      name?: string;
      values?: Array<number | string>;
    }>;
    minThresholdValues?: Array<number | string>;
    min_threshold_values?: Array<number | string>;
  };
}

export interface CourseCoAttainmentDirectIndirectPreviewData {
  prerequisites?: CourseCoAttainmentOverviewMessages;
  flags?: {
    previewReady?: boolean;
    preview_ready?: boolean;
    canFinalize?: boolean;
    can_finalize?: boolean;
    [key: string]: unknown;
  };
  selectedSurvey?: {
    id?: string | number;
    survey_id?: string | number;
    label?: string;
    name?: string;
    survey_name?: string;
  };
  selected_survey?: {
    id?: string | number;
    survey_id?: string | number;
    label?: string;
    name?: string;
    survey_name?: string;
  };
  directWeight?: string | number;
  direct_weight?: string | number;
  indirectWeight?: string | number;
  indirect_weight?: string | number;
  rows?: DirectIndirectAttainmentRow[];
  chart?: {
    labels?: string[];
    values?: Array<number | string>;
    series?: Array<{
      name?: string;
      values?: Array<number | string>;
    }>;
  };
}

export interface CourseCoAttainmentHookResult {
  activeTab: CourseCoAttainmentTabId;
  filters: CourseCoAttainmentFiltersState;
  filterOptions: CourseCoAttainmentFilterOptionsResponse;
  isLoading: boolean;
  isExporting: boolean;
  tabData: CourseCoAttainmentTabDataResponse | null;
  hasCourseSelected: boolean;
  isTermDisabled: boolean;
  isCourseDisabled: boolean;
  selectedFinalizeTypeIds: string[];
  selectedBloomType: string;
  selectedBloomSection: string;
  selectedBloomOccasion: string;
  selectedBloomStudent: string;
  selectedSurveyId: string;
  moduleFlags: CourseCoAttainmentModuleFlags;
  overviewData: CourseCoAttainmentOverviewData | null;
  setActiveTab: Dispatch<SetStateAction<CourseCoAttainmentTabId>>;
  handleFilterChange: (key: keyof CourseCoAttainmentFiltersState, value: string) => void;
  loadCurrentTabData: (curriculumId: string, termId: string, courseId: string) => Promise<void>;
  setSelectedFinalizeTypeIds: Dispatch<SetStateAction<string[]>>;
  setSelectedBloomType: Dispatch<SetStateAction<string>>;
  setSelectedBloomSection: Dispatch<SetStateAction<string>>;
  setSelectedBloomOccasion: Dispatch<SetStateAction<string>>;
  setSelectedBloomStudent: Dispatch<SetStateAction<string>>;
  handleDirectIndirectSurveyChange: (value: string) => void;
  handleDirectIndirectWeightChange: (field: "directWeight" | "indirectWeight", value: string) => void;
  handleDirectIndirectSubmit: () => Promise<void>;
  handleDirectIndirectFinalize: () => Promise<void>;
  handleExport: (format: CourseCoAttainmentExportFormat) => Promise<void>;
}
