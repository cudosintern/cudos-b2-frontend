import {
  Curriculum,
  PoDirectIndirectPayload,
  PoDirectIndirectResponse,
  PoDirectIndirectSourceOption,
  PoActivityAttainmentResponse,
  PoActivitiesResponse,
  PoActivityOption,
  PoDrilldownResponse,
  PoIndirectAttainmentResponse,
  PoIndirectSurveyOptionsResponse,
  PoIndirectSurveyOption,
  PoAttainmentInitialDataResponse,
  PoPerformanceLevelsResponse,
  PoAttainmentResponse,
  TermsByCurriculumResponse,
  Term,
} from "./poAttainmentTypes";

const curriculums: Curriculum[] = [
  { id: "cse-2017-2021", label: "B. E in CSE 2017-2021" },
  { id: "cse-2020-2024", label: "B. E in CSE 2020-2024" },
  { id: "cse-2021-2025", label: "B. E in CSE 2021-2025" },
  { id: "cse-2024-2028", label: "B. E in CSE 2024-2028" },
  { id: "testing-2024-2028", label: "Testing in Testing 2024-2028" },
  { id: "bt-2020-2024", label: "B. E in BT 2020-2024" },
  { id: "mech-2016-2020", label: "B. E in MECH 2016-2020" },
  { id: "ec-2015-2019", label: "B.E in EC 2015-2019" },
];

const termsByCurriculum: Record<string, Term[]> = {
  "cse-2017-2021": [
    { id: "1", label: "1 - Semester" },
    { id: "2", label: "2 - Semester" },
    { id: "3", label: "3 - Semester" },
    { id: "4", label: "4 - Semester" },
    { id: "5", label: "5 - Semester" },
    { id: "6", label: "6 - Semester" },
  ],
  "cse-2020-2024": [
    { id: "3", label: "3 - Semester" },
    { id: "4", label: "4 - Semester" },
    { id: "5", label: "5 - Semester" },
    { id: "6", label: "6 - Semester" },
    { id: "7", label: "7 - Semester" },
    { id: "8", label: "8 - Semester" },
  ],
  "cse-2021-2025": [
    { id: "1", label: "1 - Semester" },
    { id: "2", label: "2 - Semester" },
    { id: "3", label: "3 - Semester" },
    { id: "4", label: "4 - Semester" },
  ],
  "cse-2024-2028": [
    { id: "1", label: "1 - Semester" },
    { id: "2", label: "2 - Semester" },
  ],
  "testing-2024-2028": [
    { id: "1", label: "1 - Semester" },
    { id: "2", label: "2 - Semester" },
    { id: "3", label: "3 - Semester" },
    { id: "4", label: "4 - Semester" },
    { id: "5", label: "5 - Semester" },
    { id: "6", label: "6 - Semester" },
  ],
  "bt-2020-2024": [
    { id: "5", label: "5 - Semester" },
    { id: "6", label: "6 - Semester" },
    { id: "7", label: "7 - Semester" },
    { id: "8", label: "8 - Semester" },
  ],
  "mech-2016-2020": [
    { id: "3", label: "3 - Semester" },
    { id: "4", label: "4 - Semester" },
    { id: "5", label: "5 - Semester" },
    { id: "6", label: "6 - Semester" },
  ],
  "ec-2015-2019": [
    { id: "5", label: "5 - Semester" },
    { id: "6", label: "6 - Semester" },
  ],
};

const baseRows = [
  {
    slNo: 1,
    poReference: "PO1",
    thresholdMethod: { value: 78.32, drilldownKey: "po1-threshold" },
    thresholdLevel: { value: 2.67, label: "Exceeds Criterion", levelKey: "exceeds-criterion" },
    weightedAverageMethod: { value: 78.32, drilldownKey: "po1-weighted" },
    weightedAverageLevel: { value: 2.67, label: "Exceeds Criterion", levelKey: "exceeds-criterion" },
    relativeWeightedAverageMethod: { value: 78.32, drilldownKey: "po1-relative" },
    relativeWeightedAverageLevel: { value: 2.67, label: "Exceeds Criterion", levelKey: "exceeds-criterion" },
  },
  {
    slNo: 2,
    poReference: "PO2",
    thresholdMethod: { value: 54.99, drilldownKey: "po2-threshold" },
    thresholdLevel: { value: 2.0, label: "Meets Criterion", levelKey: "meets-criterion" },
    weightedAverageMethod: { value: 54.99, drilldownKey: "po2-weighted" },
    weightedAverageLevel: { value: 2.0, label: "Meets Criterion", levelKey: "meets-criterion" },
    relativeWeightedAverageMethod: { value: 54.99, drilldownKey: "po2-relative" },
    relativeWeightedAverageLevel: { value: 2.0, label: "Meets Criterion", levelKey: "meets-criterion" },
  },
  {
    slNo: 3,
    poReference: "PO3",
    thresholdMethod: { value: 83.32, drilldownKey: "po3-threshold" },
    thresholdLevel: { value: 2.94, label: "Exceeds Criterion", levelKey: "exceeds-criterion" },
    weightedAverageMethod: { value: 49.99, drilldownKey: "po3-weighted" },
    weightedAverageLevel: { value: 1.76, label: "View Level", levelKey: "view-level" },
    relativeWeightedAverageMethod: { value: 49.99, drilldownKey: "po3-relative" },
    relativeWeightedAverageLevel: { value: 1.76, label: "View Level", levelKey: "view-level" },
  },
  {
    slNo: 4,
    poReference: "PO4",
    thresholdMethod: { value: 82.49, drilldownKey: "po4-threshold" },
    thresholdLevel: { value: 2.92, label: "Exceeds Criterion", levelKey: "exceeds-criterion" },
    weightedAverageMethod: { value: 49.49, drilldownKey: "po4-weighted" },
    weightedAverageLevel: { value: 1.75, label: "View Level", levelKey: "view-level" },
    relativeWeightedAverageMethod: { value: 49.49, drilldownKey: "po4-relative" },
    relativeWeightedAverageLevel: { value: 1.75, label: "View Level", levelKey: "view-level" },
  },
  {
    slNo: 5,
    poReference: "PO5",
    thresholdMethod: { value: 53.32, drilldownKey: "po5-threshold" },
    thresholdLevel: { value: 2.0, label: "Meets Criterion", levelKey: "meets-criterion" },
    weightedAverageMethod: { value: 31.99, drilldownKey: "po5-weighted" },
    weightedAverageLevel: { value: 1.2, label: "Progressing", levelKey: "progressing" },
    relativeWeightedAverageMethod: { value: 31.99, drilldownKey: "po5-relative" },
    relativeWeightedAverageLevel: { value: 1.2, label: "Progressing", levelKey: "progressing" },
  },
];

const poStatements: Record<string, string> = {
  PO1: "PO Statement: 1",
  PO2: "PO Statement: 2",
  PO3: "PO Statement: 3",
  PO4: "PO Statement: 4",
  PO5: "PO Statement: 5",
};

const activityOptions: PoActivityOption[] = [
  { id: "activity-1", label: "Activity 1" },
  { id: "activity-2", label: "Activity 2" },
];

const indirectSurveyOptions: PoIndirectSurveyOption[] = [
  { id: "po-survey-01", label: "PO Survey 01" },
  { id: "po-survey-02", label: "PO Survey 02" },
  { id: "activity-1", label: "Activity 1" },
  { id: "activity-2", label: "Activity 2" },
];

const directIndirectSourceOptions: PoDirectIndirectSourceOption[] = [
  { id: "po-survey-01", label: "PO Survey 01", sourceType: "survey" },
  { id: "po-survey-02", label: "PO Survey 02", sourceType: "survey" },
  { id: "activity-1", label: "Activity 1", sourceType: "activity" },
  { id: "activity-2", label: "Activity 2", sourceType: "activity" },
];

const activityPoOrder = ["PO3", "PO2", "PO1", "PO5", "PO4"];
const activityValuesById: Record<string, number> = {
  "activity-1": 74,
  "activity-2": 54,
};

const indirectSurveyRowsById: Record<string, PoIndirectAttainmentResponse["data"]["rows"]> = {
  "po-survey-01": [
    { poReference: "PO1", poStatement: "PO Statement: 1", attainmentPercentage: 88, attainmentLevel: 3 },
    { poReference: "PO2", poStatement: "PO Statement: 2", attainmentPercentage: 75, attainmentLevel: 3 },
    { poReference: "PO3", poStatement: "PO Statement: 3", attainmentPercentage: 82, attainmentLevel: 3 },
    { poReference: "PO4", poStatement: "PO Statement: 4", attainmentPercentage: 77, attainmentLevel: 3 },
    { poReference: "PO5", poStatement: "PO Statement: 5", attainmentPercentage: 73, attainmentLevel: 3 },
  ],
  "po-survey-02": [
    { poReference: "PO1", poStatement: "PO Statement: 1", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO2", poStatement: "PO Statement: 2", attainmentPercentage: 80, attainmentLevel: 3 },
    { poReference: "PO3", poStatement: "PO Statement: 3", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO4", poStatement: "PO Statement: 4", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO5", poStatement: "PO Statement: 5", attainmentPercentage: 90, attainmentLevel: 3 },
  ],
  "activity-1": [
    { poReference: "PO1", poStatement: "PO Statement: 1", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO2", poStatement: "PO Statement: 2", attainmentPercentage: 80, attainmentLevel: 3 },
    { poReference: "PO3", poStatement: "PO Statement: 3", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO4", poStatement: "PO Statement: 4", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO5", poStatement: "PO Statement: 5", attainmentPercentage: 90, attainmentLevel: 3 },
  ],
  "activity-2": [
    { poReference: "PO1", poStatement: "PO Statement: 1", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO2", poStatement: "PO Statement: 2", attainmentPercentage: 80, attainmentLevel: 3 },
    { poReference: "PO3", poStatement: "PO Statement: 3", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO4", poStatement: "PO Statement: 4", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO5", poStatement: "PO Statement: 5", attainmentPercentage: 90, attainmentLevel: 3 },
  ],
};

const indirectSurveyStatusById: Record<string, PoIndirectAttainmentResponse["data"]["surveyStatus"]> = {
  "po-survey-01": "closed",
  "po-survey-02": "closed",
  "activity-1": "in_progress",
  "activity-2": "in_progress",
};

const directIndirectIndirectMetricsById: Record<string, Array<{ poReference: string; attainmentPercentage: number; attainmentLevel: number }>> = {
  "po-survey-01": [
    { poReference: "PO1", attainmentPercentage: 88, attainmentLevel: 3 },
    { poReference: "PO2", attainmentPercentage: 75, attainmentLevel: 3 },
    { poReference: "PO3", attainmentPercentage: 82, attainmentLevel: 3 },
    { poReference: "PO4", attainmentPercentage: 77, attainmentLevel: 3 },
    { poReference: "PO5", attainmentPercentage: 73, attainmentLevel: 3 },
  ],
  "po-survey-02": [
    { poReference: "PO1", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO2", attainmentPercentage: 80, attainmentLevel: 3 },
    { poReference: "PO3", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO4", attainmentPercentage: 90, attainmentLevel: 3 },
    { poReference: "PO5", attainmentPercentage: 90, attainmentLevel: 3 },
  ],
  "activity-1": [
    { poReference: "PO1", attainmentPercentage: 74, attainmentLevel: 3 },
    { poReference: "PO2", attainmentPercentage: 74, attainmentLevel: 3 },
    { poReference: "PO3", attainmentPercentage: 74, attainmentLevel: 3 },
    { poReference: "PO4", attainmentPercentage: 74, attainmentLevel: 3 },
    { poReference: "PO5", attainmentPercentage: 74, attainmentLevel: 3 },
  ],
  "activity-2": [
    { poReference: "PO1", attainmentPercentage: 54, attainmentLevel: 3 },
    { poReference: "PO2", attainmentPercentage: 54, attainmentLevel: 3 },
    { poReference: "PO3", attainmentPercentage: 54, attainmentLevel: 3 },
    { poReference: "PO4", attainmentPercentage: 54, attainmentLevel: 3 },
    { poReference: "PO5", attainmentPercentage: 54, attainmentLevel: 3 },
  ],
};

const roundToTwo = (value: number) => Math.round(value * 100) / 100;
const truncateToTwo = (value: number) => Math.floor(value * 100) / 100;

const defaultPoSurvey01DirectIndirectRows: PoDirectIndirectResponse["data"]["rows"] = [
  {
    poReference: "PO1",
    actualDirectAttainmentPercentage: 78.32,
    actualDirectAttainmentLevel: 2.67,
    actualIndirectAttainmentPercentage: 88.0,
    actualIndirectAttainmentLevel: 3.0,
    directAttainmentWeightagePercentage: 50.0,
    indirectAttainmentWeightagePercentage: 50.0,
    afterWeightageDirectAttainmentPercentage: 39.16,
    afterWeightageDirectAttainmentLevel: 1.34,
    afterWeightageIndirectAttainmentPercentage: 44.0,
    afterWeightageIndirectAttainmentLevel: 1.5,
    overallAttainmentPercentage: 83.16,
    attainmentLevel: 2.84,
  },
  {
    poReference: "PO2",
    actualDirectAttainmentPercentage: 54.99,
    actualDirectAttainmentLevel: 2.0,
    actualIndirectAttainmentPercentage: 75.0,
    actualIndirectAttainmentLevel: 3.0,
    directAttainmentWeightagePercentage: 50.0,
    indirectAttainmentWeightagePercentage: 50.0,
    afterWeightageDirectAttainmentPercentage: 27.5,
    afterWeightageDirectAttainmentLevel: 1.0,
    afterWeightageIndirectAttainmentPercentage: 37.5,
    afterWeightageIndirectAttainmentLevel: 1.5,
    overallAttainmentPercentage: 65.0,
    attainmentLevel: 2.5,
  },
  {
    poReference: "PO3",
    actualDirectAttainmentPercentage: 83.32,
    actualDirectAttainmentLevel: 2.94,
    actualIndirectAttainmentPercentage: 82.0,
    actualIndirectAttainmentLevel: 3.0,
    directAttainmentWeightagePercentage: 50.0,
    indirectAttainmentWeightagePercentage: 50.0,
    afterWeightageDirectAttainmentPercentage: 41.66,
    afterWeightageDirectAttainmentLevel: 1.47,
    afterWeightageIndirectAttainmentPercentage: 41.0,
    afterWeightageIndirectAttainmentLevel: 1.5,
    overallAttainmentPercentage: 82.66,
    attainmentLevel: 2.97,
  },
  {
    poReference: "PO4",
    actualDirectAttainmentPercentage: 82.49,
    actualDirectAttainmentLevel: 2.92,
    actualIndirectAttainmentPercentage: 77.0,
    actualIndirectAttainmentLevel: 3.0,
    directAttainmentWeightagePercentage: 50.0,
    indirectAttainmentWeightagePercentage: 50.0,
    afterWeightageDirectAttainmentPercentage: 41.24,
    afterWeightageDirectAttainmentLevel: 1.46,
    afterWeightageIndirectAttainmentPercentage: 38.5,
    afterWeightageIndirectAttainmentLevel: 1.5,
    overallAttainmentPercentage: 79.74,
    attainmentLevel: 2.96,
  },
  {
    poReference: "PO5",
    actualDirectAttainmentPercentage: 53.32,
    actualDirectAttainmentLevel: 2.0,
    actualIndirectAttainmentPercentage: 73.0,
    actualIndirectAttainmentLevel: 3.0,
    directAttainmentWeightagePercentage: 50.0,
    indirectAttainmentWeightagePercentage: 50.0,
    afterWeightageDirectAttainmentPercentage: 26.66,
    afterWeightageDirectAttainmentLevel: 1.0,
    afterWeightageIndirectAttainmentPercentage: 36.5,
    afterWeightageIndirectAttainmentLevel: 1.5,
    overallAttainmentPercentage: 63.16,
    attainmentLevel: 2.5,
  },
];

const isDefaultPoSurvey01DirectIndirectCase = (payload: PoDirectIndirectPayload) =>
  payload.directWeight === 50 &&
  payload.indirectWeight === 50 &&
  payload.surveyRows.length === 1 &&
  payload.surveyRows[0].sourceId === "po-survey-01" &&
  payload.surveyRows[0].weightage === 100;

const drilldownRowsByPo: Record<string, PoDrilldownResponse["data"]["rows"]> = {
  PO1: [
    { courseCode: "HPT101", courseTitle: "Course 101", attainmentPercentage: 78.32, attainmentLevel: 2.67 },
    { courseCode: "HPT103", courseTitle: "Course 103", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE101", courseTitle: "TE101", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE102", courseTitle: "TE102", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE103", courseTitle: "TE103", attainmentPercentage: null, attainmentLevel: null },
  ],
  PO2: [
    { courseCode: "HPT201", courseTitle: "Course 201", attainmentPercentage: 54.99, attainmentLevel: 2.0 },
    { courseCode: "HPT202", courseTitle: "Course 202", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE201", courseTitle: "TE201", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE202", courseTitle: "TE202", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE203", courseTitle: "TE203", attainmentPercentage: null, attainmentLevel: null },
  ],
  PO3: [
    { courseCode: "HPT301", courseTitle: "Course 301", attainmentPercentage: 83.32, attainmentLevel: 2.94 },
    { courseCode: "HPT303", courseTitle: "Course 303", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE301", courseTitle: "TE301", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE302", courseTitle: "TE302", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE303", courseTitle: "TE303", attainmentPercentage: null, attainmentLevel: null },
  ],
  PO4: [
    { courseCode: "HPT401", courseTitle: "Course 401", attainmentPercentage: 82.49, attainmentLevel: 2.92 },
    { courseCode: "HPT403", courseTitle: "Course 403", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE401", courseTitle: "TE401", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE402", courseTitle: "TE402", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE403", courseTitle: "TE403", attainmentPercentage: null, attainmentLevel: null },
  ],
  PO5: [
    { courseCode: "HPT501", courseTitle: "Course 501", attainmentPercentage: 53.32, attainmentLevel: 2.0 },
    { courseCode: "HPT503", courseTitle: "Course 503", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE501", courseTitle: "TE501", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE502", courseTitle: "TE502", attainmentPercentage: null, attainmentLevel: null },
    { courseCode: "TE503", courseTitle: "TE503", attainmentPercentage: null, attainmentLevel: null },
  ],
};

const performanceLevelsByPo: Record<string, PoPerformanceLevelsResponse["data"]["levels"]> = {
  PO1: [
    { slNo: 1, levelName: "Exceeds Criterion", levelValue: 3, startRange: 2.5, comparator: ">=", endRange: 3.0, description: "Exceeds Criterion" },
    { slNo: 2, levelName: "Meets Criterion", levelValue: 2, startRange: 2.0, comparator: ">=", endRange: 2.5, description: "Meets Criterion" },
    { slNo: 3, levelName: "Average Criteria", levelValue: 2, startRange: 2.0, comparator: ">=", endRange: 3.0, description: "Good" },
    { slNo: 4, levelName: "Progressing", levelValue: 1, startRange: 1.0, comparator: ">=", endRange: 1.5, description: "Progressing" },
    { slNo: 5, levelName: "Below Criteria", levelValue: 0, startRange: 0.0, comparator: ">=", endRange: 1.0, description: "Below Criterion" },
  ],
  PO2: [
    { slNo: 1, levelName: "Exceeds Criterion", levelValue: 3, startRange: 2.5, comparator: ">=", endRange: 3.0, description: "Exceeds Criterion" },
    { slNo: 2, levelName: "Meets Criterion", levelValue: 2, startRange: 2.0, comparator: ">=", endRange: 2.5, description: "Meets Criterion" },
    { slNo: 3, levelName: "Progressing", levelValue: 1, startRange: 1.0, comparator: ">=", endRange: 1.5, description: "Progressing" },
    { slNo: 4, levelName: "Below Criterion", levelValue: 0, startRange: 0.0, comparator: ">=", endRange: 1.0, description: "Below Criterion" },
  ],
  PO3: [
    { slNo: 1, levelName: "Exceeds Criterion", levelValue: 3, startRange: 2.5, comparator: ">=", endRange: 3.0, description: "Exceeds Criterion" },
    { slNo: 2, levelName: "Meets Criterion", levelValue: 2, startRange: 2.0, comparator: ">=", endRange: 2.5, description: "Meets Criterion" },
    { slNo: 3, levelName: "Progressing", levelValue: 1, startRange: 1.0, comparator: ">=", endRange: 1.5, description: "Progressing" },
    { slNo: 4, levelName: "Below Criterion", levelValue: 0, startRange: 0.0, comparator: ">=", endRange: 1.0, description: "Below Criterion" },
  ],
  PO4: [
    { slNo: 1, levelName: "Exceeds Criterion", levelValue: 3, startRange: 2.5, comparator: ">=", endRange: 3.0, description: "Exceeds Criterion" },
    { slNo: 2, levelName: "Meets Criterion", levelValue: 2, startRange: 2.0, comparator: ">=", endRange: 2.5, description: "Meets Criterion" },
    { slNo: 3, levelName: "Progressing", levelValue: 1, startRange: 1.0, comparator: ">=", endRange: 1.5, description: "Progressing" },
    { slNo: 4, levelName: "Below Criterion", levelValue: 0, startRange: 0.0, comparator: ">=", endRange: 1.0, description: "Below Criterion" },
  ],
  PO5: [
    { slNo: 1, levelName: "Exceeds Criterion", levelValue: 3, startRange: 2.5, comparator: ">=", endRange: 3.0, description: "Exceeds Criterion" },
    { slNo: 2, levelName: "Meets Criterion", levelValue: 2, startRange: 2.0, comparator: ">=", endRange: 2.5, description: "Meets Criterion" },
    { slNo: 3, levelName: "Progressing", levelValue: 1, startRange: 1.0, comparator: ">=", endRange: 1.5, description: "Progressing" },
    { slNo: 4, levelName: "Below Criterion", levelValue: 0, startRange: 0.0, comparator: ">=", endRange: 1.0, description: "Below Criterion" },
  ],
};

export const poAttainmentMockData = {
  getInitialData(): PoAttainmentInitialDataResponse {
    return {
      status: true,
      message: "Completed",
      data: {
        filters: {
          curriculums,
          exportOptions: [
            { id: "pdf", label: ".pdf" },
            { id: "docx", label: ".doc" },
          ],
        },
      },
    };
  },

  getTermsByCurriculum(curriculumId: string): TermsByCurriculumResponse {
    return {
      status: true,
      message: "Completed",
      data: {
        curriculumId,
        terms: termsByCurriculum[curriculumId] ?? [],
      },
    };
  },

  getPoAttainmentData(curriculumId: string, termIds: string[], coreCoursesOnly: boolean): PoAttainmentResponse {
    const curriculum = curriculums.find((item) => item.id === curriculumId);
    const terms = (termsByCurriculum[curriculumId] ?? []).filter((term) => termIds.includes(term.id));

    return {
      status: true,
      message: "Completed",
      data: {
        filters: {
          curriculumId,
          curriculumLabel: curriculum?.label ?? "",
          termIds,
          termLabels: terms.map((term) => term.label),
          coreCoursesOnly,
        },
        chart: {
          categories: ["PO1", "PO2", "PO3", "PO4", "PO5"],
          series: [
            {
              name: "Threshold based Attainment %",
              color: "#55bfd6",
              data: baseRows.map((row) => row.thresholdMethod.value),
            },
            {
              name: "Weighted Average Method Attainment %",
              color: "#f38bff",
              data: baseRows.map((row) => row.weightedAverageMethod.value),
            },
            {
              name: "Relative Weighted Average Method Attainment %",
              color: "#b8a765",
              data: baseRows.map((row) => row.relativeWeightedAverageMethod.value),
            },
          ],
        },
        rows: baseRows,
        notes: {
          note:
            "The above bar graph depicts the overall class performance with respect to the Threshold % for individual Program Outcomes (POs). The Attainment % for respective columns is calculated using the below formula.",
          formulas: [
            {
              title: "For Attainment based on Threshold method % = X / Y",
              formula: "X / Y",
              lines: [
                "X = Sum of all the Course Outcomes(COs) Threshold based Attainment % mapped to the respective PO",
                "Y = Count of Course Outcomes(COs) mapped to respective PO",
              ],
            },
            {
              title: "For Attainment based on Weighted Average Method % = X / Y",
              formula: "X / Y",
              lines: [
                "X = Sum of all the Course Outcomes(COs) Threshold based Attainment % * Map Level Weighted Attainment % mapped to respective PO",
                "Y = Count of Course Outcomes(COs) mapped to respective PO",
              ],
            },
            {
              title: "For Attainment based on Relative Weighted Average Method % = X / Y",
              formula: "X / Y",
              lines: [
                "X = Sum of all the Course Outcomes(COs) Threshold based Attainment % * Map Level Weighted Attainment % * Mapped Value",
                "Y = Sum of all Mapped Value of the respective PO",
              ],
            },
          ],
        },
      },
    };
  },

  getPoDrilldownData(poId: string, methodKey: string): PoDrilldownResponse {
    const rows = drilldownRowsByPo[poId] ?? [];
    const chartRow = rows.find((row) => row.attainmentPercentage !== null);

    return {
      status: true,
      message: "Completed",
      data: {
        po: {
          poId,
          poStatement: poStatements[poId] ?? "PO Statement: -",
        },
        chart: {
          categories: chartRow ? [chartRow.courseCode] : [],
          series: [
            {
              name: "PO Attainment %",
              data: chartRow?.attainmentPercentage !== null && chartRow?.attainmentPercentage !== undefined
                ? [chartRow.attainmentPercentage]
                : [],
            },
          ],
          tooltips: chartRow ? [chartRow.courseTitle] : [],
        },
        rows,
        notes: [
          "If PO Attainment % and Attainment Level are blank, it indicates that CO attainment for the respective courses are not finalized for calculating PO attainment.",
          "The above bar graph depicts individual PO attainment contributed by courses under selected Terms (Semester).",
        ],
      },
    };
  },

  getPoPerformanceLevels(poId: string, levelKey: string): PoPerformanceLevelsResponse {
    return {
      status: true,
      message: "Completed",
      data: {
        po: {
          poId,
          poStatement: poStatements[poId] ?? "PO Statement: -",
        },
        levels: performanceLevelsByPo[poId] ?? performanceLevelsByPo.PO2,
      },
    };
  },

  getPoActivities(): PoActivitiesResponse {
    return {
      status: true,
      message: "Completed",
      data: {
        activities: activityOptions,
      },
    };
  },

  getPoActivityAttainmentData(selectedActivities: string[]): PoActivityAttainmentResponse {
    const safeActivities = selectedActivities.filter((activityId) => activityValuesById[activityId] !== undefined);
    const divisor = safeActivities.length || 1;

    const rows = activityPoOrder.map((poCode) => {
      const total = safeActivities.reduce((sum, activityId) => sum + activityValuesById[activityId], 0);
      const value = total / divisor;

      return {
        poCode,
        poStatement: poStatements[poCode],
        attainmentPercentage: value,
      };
    });

    return {
      status: true,
      message: "Completed",
      data: {
        selectedActivities: safeActivities,
        criteriaLabel: "Criteria",
        chart: {
          categories: rows.map((row) => row.poCode),
          series: [
            {
              name: "Attainment %",
              data: rows.map((row) => row.attainmentPercentage),
            },
          ],
          tooltips: rows.map((row) => `${row.poCode} - ${row.poStatement}`),
        },
        rows,
        table: {
          showEntriesOptions: [20, 50, 100, 500, 1000],
        },
      },
    };
  },

  getPoIndirectSurveyOptions(): PoIndirectSurveyOptionsResponse {
    return {
      status: true,
      message: "Completed",
      data: {
        surveys: indirectSurveyOptions,
      },
    };
  },

  getPoIndirectAttainmentData(selectedSurveyId: string): PoIndirectAttainmentResponse {
    const selectedSurvey = indirectSurveyOptions.find((survey) => survey.id === selectedSurveyId);
    const surveyStatus = indirectSurveyStatusById[selectedSurveyId] ?? "empty";
    const rows = indirectSurveyRowsById[selectedSurveyId] ?? [];

    return {
      status: true,
      message: "Completed",
      data: {
        selectedSurveyId,
        selectedSurveyLabel: selectedSurvey?.label ?? "",
        surveyStatus,
        chart: {
          title: "Program Outcome (POs) Indirect Attainment Analysis",
          categories: rows.map((row) => row.poReference),
          series: [
            {
              name: "Attainment %",
              data: rows.map((row) => row.attainmentPercentage),
            },
          ],
          tooltips: rows.map((row) => `${row.poReference} - ${row.poStatement}`),
        },
        rows: surveyStatus === "closed" ? rows : [],
        warningMessage:
          surveyStatus === "in_progress"
            ? "The selected survey is still In-Progress status. Change the survey status to Closed to view Program Outcome(POs) Indirect Attainment."
            : null,
      },
    };
  },

  getPoDirectIndirectSourceOptions(): PoDirectIndirectSourceOption[] {
    return directIndirectSourceOptions;
  },

  getPoDirectIndirectAttainmentData(payload: PoDirectIndirectPayload): PoDirectIndirectResponse {
    const directWeight = payload.directWeight;
    const indirectWeight = payload.indirectWeight;
    const rows = isDefaultPoSurvey01DirectIndirectCase(payload)
      ? defaultPoSurvey01DirectIndirectRows
      : baseRows.map((directRow) => {
        const combinedIndirect = payload.surveyRows.reduce(
          (accumulator, surveyRow) => {
            const sourceMetrics = directIndirectIndirectMetricsById[surveyRow.sourceId] ?? [];
            const sourcePoMetric = sourceMetrics.find((metric) => metric.poReference === directRow.poReference);

            if (!sourcePoMetric) {
              return accumulator;
            }

            return {
              attainmentPercentage:
                accumulator.attainmentPercentage + (sourcePoMetric.attainmentPercentage * surveyRow.weightage) / 100,
              attainmentLevel:
                accumulator.attainmentLevel + (sourcePoMetric.attainmentLevel * surveyRow.weightage) / 100,
            };
          },
          { attainmentPercentage: 0, attainmentLevel: 0 }
        );

        const afterWeightageDirectAttainmentPercentage = truncateToTwo(
          (directRow.thresholdMethod.value * directWeight) / 100
        );
        const afterWeightageDirectAttainmentLevel = truncateToTwo(
          (directRow.thresholdLevel.value * directWeight) / 100
        );
        const afterWeightageIndirectAttainmentPercentage = truncateToTwo(
          (combinedIndirect.attainmentPercentage * indirectWeight) / 100
        );
        const afterWeightageIndirectAttainmentLevel = truncateToTwo(
          (combinedIndirect.attainmentLevel * indirectWeight) / 100
        );
        const overallAttainmentPercentage = truncateToTwo(
          afterWeightageDirectAttainmentPercentage + afterWeightageIndirectAttainmentPercentage
        );
        const attainmentLevel = truncateToTwo(
          afterWeightageDirectAttainmentLevel + afterWeightageIndirectAttainmentLevel
        );

        return {
          poReference: directRow.poReference,
          actualDirectAttainmentPercentage: directRow.thresholdMethod.value,
          actualDirectAttainmentLevel: directRow.thresholdLevel.value,
          actualIndirectAttainmentPercentage: roundToTwo(combinedIndirect.attainmentPercentage),
          actualIndirectAttainmentLevel: roundToTwo(combinedIndirect.attainmentLevel),
          directAttainmentWeightagePercentage: roundToTwo(directWeight),
          indirectAttainmentWeightagePercentage: roundToTwo(indirectWeight),
          afterWeightageDirectAttainmentPercentage,
          afterWeightageDirectAttainmentLevel,
          afterWeightageIndirectAttainmentPercentage,
          afterWeightageIndirectAttainmentLevel,
          overallAttainmentPercentage,
          attainmentLevel,
        };
      });

    return {
      status: true,
      message: "Completed",
      data: {
        chart: {
          title: "Program Outcome (PO) Direct and Indirect Attainment Analysis",
          categories: rows.map((row) => row.poReference),
          series: [
            {
              name: "PO Attainment %",
              data: rows.map((row) => row.overallAttainmentPercentage),
            },
          ],
          tooltips: rows.map((row) => `${row.poReference} - ${poStatements[row.poReference]}`),
        },
        rows,
      },
    };
  },
};
