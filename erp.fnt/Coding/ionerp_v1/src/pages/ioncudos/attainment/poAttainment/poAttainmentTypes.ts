export type TabKey =
  | "direct"
  | "extracurricular"
  | "indirect"
  | "directIndirect";

export interface Curriculum {
  id: string;
  label: string;
}

export interface Term {
  id: string;
  label: string;
}

export interface PoAttainmentFilters {
  curriculumId: string;
  termIds: string[];
  coreCoursesOnly: boolean;
}

export interface ChartSeries {
  name: string;
  color: string;
  data: number[];
}

export interface PoAttainmentMethod {
  key: string;
  label: string;
  dataKey: string;
  levelKey: string;
}

export interface PoAttainmentLevelCell {
  value: number;
  label: string;
  levelKey: string;
}

export interface PoAttainmentMetricCell {
  value: number;
  drilldownKey: string;
}

export interface PoAttainmentDynamicMethodCell {
  percentage: {
    value: number | null;
    drilldownKey: string;
  };
  level: {
    value: number | null;
    label: string;
    levelKey: string;
  };
}

export interface PoAttainmentRow {
  slNo: number;
  poId?: string;
  poReference: string;
  poStatement?: string;
  methodCells?: Record<string, PoAttainmentDynamicMethodCell>;
  thresholdMethod: PoAttainmentMetricCell;
  thresholdLevel: PoAttainmentLevelCell;
  weightedAverageMethod: PoAttainmentMetricCell;
  weightedAverageLevel: PoAttainmentLevelCell;
  relativeWeightedAverageMethod: PoAttainmentMetricCell;
  relativeWeightedAverageLevel: PoAttainmentLevelCell;
}

export interface FormulaBlock {
  title: string;
  formula: string;
  lines: string[];
}

export interface PoAttainmentNotes {
  note: string;
  formulas: FormulaBlock[];
}

export interface PoAttainmentContent {
  methods?: PoAttainmentMethod[];
  filters: {
    curriculumId: string;
    curriculumLabel: string;
    termIds: string[];
    termLabels: string[];
    coreCoursesOnly: boolean;
  };
  chart: {
    categories: string[];
    series: ChartSeries[];
  };
  rows: PoAttainmentRow[];
  notes: PoAttainmentNotes;
}

export interface PoAttainmentResponse {
  status: boolean;
  message: string;
  data: PoAttainmentContent;
}

export interface PoAttainmentInitialDataResponse {
  status: boolean;
  message: string;
  data: {
    filters: {
      curriculums: Curriculum[];
      exportOptions: Array<{ id: "pdf" | "docx"; label: string }>;
    };
  };
}

export interface PoExportMetadata {
  curriculumLabel?: string;
  termLabels?: string[];
  coreCoursesLabel?: string;
  activityLabel?: string;
  surveyLabel?: string;
  directIndirectSelections?: Array<{
    sourceId: string;
    sourceLabel: string;
    sourceType: "survey" | "activity";
    weightage: number;
  }>;
  directOnlyNote?: string;
}

export interface PoAttainmentBootstrapResponse {
  status: boolean;
  message: string;
  data: {
    poDirectIndirectFlag: boolean | number | string;
    initialAvgPoAttainmentFlag: boolean | number | string;
    supportedDirectAttainmentMethods: string[];
  };
}

export interface PoWeightagesResponse {
  status: boolean;
  message: string;
  data: unknown[];
}

export interface TermsByCurriculumResponse {
  status: boolean;
  message: string;
  data: {
    curriculumId: string;
    terms: Term[];
  };
}

export interface PoMeta {
  poId: string;
  poStatement: string;
}

export interface PoDrilldownCourseRow {
  courseCode: string;
  courseTitle: string;
  attainmentPercentage: number | null;
  attainmentLevel: number | null;
}

export interface PoDrilldownResponse {
  status: boolean;
  message: string;
  data: {
    po: PoMeta;
    chart: {
      categories: string[];
      series: [
        {
          name: string;
          data: number[];
        },
      ];
      tooltips: string[];
    };
    rows: PoDrilldownCourseRow[];
    notes: string[];
  };
}

export interface PoPerformanceLevelRow {
  slNo: number;
  levelName: string;
  levelValue: number;
  startRange: number;
  comparator: ">=";
  endRange: number;
  description: string;
}

export interface PoPerformanceLevelsResponse {
  status: boolean;
  message: string;
  data: {
    po: PoMeta;
    levels: PoPerformanceLevelRow[];
  };
}

export interface PoActivityOption {
  id: string;
  label: string;
}

export interface PoActivityAttainmentRow {
  criteria?: string;
  poCode: string;
  poStatement: string;
  attainmentPercentage: number;
  attainmentLevel?: number | null;
}

export interface PoActivityAttainmentResponse {
  status: boolean;
  message: string;
  data: {
    selectedActivities: string[];
    criteriaLabel: string;
    chart: {
      categories: string[];
      series: [
        {
          name: string;
          data: number[];
        },
      ];
      tooltips: string[];
    };
    rows: PoActivityAttainmentRow[];
    table: {
      showEntriesOptions: number[];
    };
  };
}

export interface PoActivitiesResponse {
  status: boolean;
  message: string;
  data: {
    activities: PoActivityOption[];
  };
}

export type PoSurveyStatus = "closed" | "in_progress" | "empty";

export interface PoIndirectSurveyOption {
  id: string;
  label: string;
}

export interface PoIndirectAttainmentRow {
  poReference: string;
  poStatement: string;
  attainmentPercentage: number;
  attainmentLevel: number | null;
}

export interface PoIndirectAttainmentResponse {
  status: boolean;
  message: string;
  data: {
    selectedSurveyId: string;
    selectedSurveyLabel: string;
    surveyStatus: PoSurveyStatus;
    chart: {
      title: string;
      categories: string[];
      series: [
        {
          name: string;
          data: number[];
        },
      ];
      tooltips: string[];
    };
    rows: PoIndirectAttainmentRow[];
    warningMessage: string | null;
  };
}

export interface PoIndirectSurveyOptionsResponse {
  status: boolean;
  message: string;
  data: {
    surveys: PoIndirectSurveyOption[];
  };
}

export interface PoDirectIndirectSourceOption {
  id: string;
  label: string;
  sourceType: "survey" | "activity";
}

export interface PoDirectIndirectSurveyRow {
  id: string;
  sourceId: string;
  weightage: number | "";
}

export interface PoDirectIndirectFormState {
  directWeight: number;
  indirectWeight: number;
  activityWeight: number;
  surveyRows: PoDirectIndirectSurveyRow[];
}

export interface PoDirectIndirectPayload {
  curriculumId: string;
  termIds: number[];
  coreCoursesOnly: boolean;
  directWeight: number;
  indirectWeight: number;
  activityWeight: number;
  avgPoAttntFlag?: number;
  surveyRows: Array<{
    sourceId: string;
    sourceType: "survey" | "activity";
    weightage: number;
  }>;
}

export interface PoDirectIndirectResultRow {
  poReference: string;
  actualDirectAttainmentPercentage: number;
  actualDirectAttainmentLevel: number;
  actualIndirectAttainmentPercentage: number;
  actualIndirectAttainmentLevel: number;
  actualActivityAttainmentPercentage?: number | null;
  actualActivityAttainmentLevel?: number | null;
  directAttainmentWeightagePercentage: number;
  indirectAttainmentWeightagePercentage: number;
  activityAttainmentWeightagePercentage?: number | null;
  afterWeightageDirectAttainmentPercentage: number;
  afterWeightageDirectAttainmentLevel: number;
  afterWeightageIndirectAttainmentPercentage: number;
  afterWeightageIndirectAttainmentLevel: number;
  afterWeightageActivityAttainmentPercentage?: number | null;
  afterWeightageActivityAttainmentLevel?: number | null;
  overallAttainmentPercentage: number;
  attainmentLevel: number;
}

export interface PoDirectIndirectResponse {
  status: boolean;
  message: string;
  data: {
    chart: {
      title: string;
      categories: string[];
      series: [
        {
          name: string;
          data: number[];
        },
      ];
      tooltips: string[];
    };
    rows: PoDirectIndirectResultRow[];
    note?: string;
    exportStatus?: number;
  };
}
