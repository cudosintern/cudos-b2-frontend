import {
  DataAnalysisOccasionsRequest,
  DataAnalysisOccasionsResponse,
  DataAnalysisQuestionResult,
  DataAnalysisReportRequest,
  DataAnalysisReportResponse,
  DataAnalysisSectionsRequest,
  DataAnalysisType,
  SelectOption,
} from "./dataAnalysisTypes";

interface MockScenarioBase {
  schoolId: string;
  programId: string;
  curriculumId: string;
  termId: string;
  courseId: string;
  type: DataAnalysisType;
  sectionId: string;
}

interface MockScenarioSuccess extends MockScenarioBase {
  response: DataAnalysisReportResponse;
  occasionRequired: boolean;
  occasionId?: string;
}

const schoolOptions: SelectOption[] = [
  { id: "school-bt", label: "Department of BioTechnology" },
  { id: "school-auto", label: "Automation" },
];

const programOptionsBySchoolId: Record<string, SelectOption[]> = {
  "school-bt": [{ id: "program-bt-be", label: "B. E in BT" }],
  "school-auto": [{ id: "program-auto-be", label: "BE in Auto" }],
};

const curriculumOptionsByProgramId: Record<string, SelectOption[]> = {
  "program-bt-be": [{ id: "curriculum-bt-2015-2019", label: "B. E in BT 2015-2019" }],
  "program-auto-be": [{ id: "curriculum-auto-2025-2029", label: "BE in Auto 2025-2029" }],
};

const termOptionsByCurriculumId: Record<string, SelectOption[]> = {
  "curriculum-bt-2015-2019": [{ id: "term-1", label: "1 - Semester" }],
  "curriculum-auto-2025-2029": [{ id: "term-1", label: "1 - Semester" }],
};

const courseOptionsByCurriculumAndTerm: Record<string, SelectOption[]> = {
  "curriculum-bt-2015-2019::term-1": [{ id: "course-bt-cc1", label: "cc1 - cc1" }],
  "curriculum-auto-2025-2029::term-1": [
    { id: "course-auto-1", label: "Course1 - Course_1" },
    { id: "course-auto-3", label: "Course3 - Course3" },
    { id: "course-auto-see", label: "SEE Demo - SEE_1" },
  ],
};

const typeOptionsByCourseId: Record<string, SelectOption[]> = {
  "course-bt-cc1": [
    { id: "CCE", label: "CCE" },
    { id: "MTE", label: "MTE" },
    { id: "SEE", label: "SEE" },
  ],
  "course-auto-1": [
    { id: "CCE", label: "CCE" },
    { id: "MTE", label: "MTE" },
    { id: "SEE", label: "SEE" },
  ],
  "course-auto-3": [
    { id: "CCE", label: "CCE" },
    { id: "MTE", label: "MTE" },
  ],
  "course-auto-see": [{ id: "SEE", label: "SEE" }],
};

const buildQuestion = (
  question: string,
  bloomsLevel: string,
  co: string,
  marks: number,
  average: number,
  standardDeviation: number,
  minInRange: number,
  maxInRange: number,
  numberOfAttempts: number,
  percentageOfAttempt: number,
  percentageOfAttainment: number
): DataAnalysisQuestionResult => ({
  bloomsLevel,
  question,
  co,
  marks,
  average,
  standardDeviation,
  minInRange,
  maxInRange,
  numberOfAttempts,
  percentageOfAttempt,
  percentageOfAttainment,
});

const successScenarios: MockScenarioSuccess[] = [
  {
    schoolId: "school-bt",
    programId: "program-bt-be",
    curriculumId: "curriculum-bt-2015-2019",
    termId: "term-1",
    courseId: "course-bt-cc1",
    type: "CCE",
    sectionId: "section-a",
    occasionId: "occasion-theory-test-1",
    occasionRequired: true,
    response: {
      status: "success",
      data: {
        questions: [
          buildQuestion("1", "NA", "CO1", 40, 33.5, 3.5, 30, 37, 2, 100, 83.75),
        ],
      },
    },
  },
  {
    schoolId: "school-auto",
    programId: "program-auto-be",
    curriculumId: "curriculum-auto-2025-2029",
    termId: "term-1",
    courseId: "course-auto-1",
    type: "CCE",
    sectionId: "section-a",
    occasionId: "occasion-minor-1",
    occasionRequired: true,
    response: {
      status: "success",
      data: {
        questions: [
          buildQuestion("1", "L1", "CO1", 100, 68.75, 34.24, 11, 99, 4, 100, 68.75),
          buildQuestion("2", "L1", "CO2,CO3", 100, 79.5, 8.9, 66, 88, 4, 100, 79.5),
        ],
      },
    },
  },
  {
    schoolId: "school-auto",
    programId: "program-auto-be",
    curriculumId: "curriculum-auto-2025-2029",
    termId: "term-1",
    courseId: "course-auto-3",
    type: "CCE",
    sectionId: "section-a",
    occasionId: "occasion-qp",
    occasionRequired: true,
    response: {
      status: "success",
      data: {
        questions: [
          buildQuestion("1", "L1", "CO1", 20, 15, 5.1, 8, 20, 3, 75, 75),
          buildQuestion("2", "L2", "CO2", 20, 11.5, 6.5, 5, 18, 2, 50, 57.5),
          buildQuestion("3", "L1", "CO3", 20, 10, 8.16, 0, 20, 3, 75, 50),
          buildQuestion("4", "L2", "CO4", 20, 12, 0, 12, 12, 1, 25, 60),
          buildQuestion("5", "L1,L4", "CO1", 20, 20, 0, 20, 20, 1, 25, 100),
          buildQuestion("6", "L1", "CO2,CO3", 20, 0, 0, 0, 0, 0, 0, 0),
          buildQuestion("7", "L1", "CO1,CO2", 20, 16.5, 1.12, 15, 18, 4, 100, 82.5),
          buildQuestion("8", "L1,L2", "CO3,CO4", 20, 17.5, 1.12, 16, 19, 4, 100, 87.5),
        ],
      },
    },
  },
  {
    schoolId: "school-auto",
    programId: "program-auto-be",
    curriculumId: "curriculum-auto-2025-2029",
    termId: "term-1",
    courseId: "course-auto-1",
    type: "MTE",
    sectionId: "section-a",
    occasionId: "occasion-midterm-1",
    occasionRequired: true,
    response: {
      status: "success",
      data: {
        questions: [
          buildQuestion("1", "L2", "CO1", 50, 38.5, 6.25, 29, 45, 4, 100, 77),
          buildQuestion("2", "L3", "CO2", 50, 41.75, 4.02, 36, 46, 4, 100, 83.5),
        ],
      },
    },
  },
];

const validationResponses = {
  cceOccasionsNotDefined: "Comprehensive Continuous Evaluation (CIA) Occasions are not defined",
  seeQuestionPaperNotRolledOut: "SEE Question Paper has not been rolled out",
} as const;

const sectionOptionsByScenario = new Map<string, SelectOption[]>([
  [
    "school-bt::program-bt-be::curriculum-bt-2015-2019::term-1::course-bt-cc1::CCE",
    [{ id: "section-a", label: "A" }],
  ],
  [
    "school-auto::program-auto-be::curriculum-auto-2025-2029::term-1::course-auto-1::CCE",
    [
      { id: "section-a", label: "A" },
      { id: "section-b", label: "B" },
      { id: "section-c", label: "C" },
    ],
  ],
  [
    "school-auto::program-auto-be::curriculum-auto-2025-2029::term-1::course-auto-1::MTE",
    [{ id: "section-a", label: "A" }],
  ],
  [
    "school-auto::program-auto-be::curriculum-auto-2025-2029::term-1::course-auto-3::CCE",
    [{ id: "section-a", label: "A" }],
  ],
  [
    "school-auto::program-auto-be::curriculum-auto-2025-2029::term-1::course-auto-see::SEE",
    [{ id: "section-a", label: "A" }],
  ],
]);

const occasionConfigs = new Map<
  string,
  DataAnalysisOccasionsResponse
>([
  [
    "school-bt::program-bt-be::curriculum-bt-2015-2019::term-1::course-bt-cc1::CCE::section-a",
    {
      required: true,
      options: [{ id: "occasion-theory-test-1", label: "Theory Test 1" }],
    },
  ],
  [
    "school-auto::program-auto-be::curriculum-auto-2025-2029::term-1::course-auto-1::CCE::section-a",
    {
      required: true,
      options: [
        { id: "occasion-minor-1", label: "Minor1" },
        { id: "occasion-rubrics", label: "Rubrics" },
      ],
    },
  ],
  [
    "school-auto::program-auto-be::curriculum-auto-2025-2029::term-1::course-auto-1::MTE::section-a",
    {
      required: true,
      options: [{ id: "occasion-midterm-1", label: "Midterm 1" }],
    },
  ],
  [
    "school-auto::program-auto-be::curriculum-auto-2025-2029::term-1::course-auto-3::CCE::section-a",
    {
      required: true,
      options: [{ id: "occasion-qp", label: "QP" }],
    },
  ],
  [
    "school-auto::program-auto-be::curriculum-auto-2025-2029::term-1::course-auto-see::SEE::section-a",
    {
      required: false,
      options: [],
    },
  ],
]);

const buildContextKey = (value: MockScenarioBase | DataAnalysisSectionsRequest) =>
  [
    value.schoolId,
    value.programId,
    value.curriculumId,
    value.termId,
    value.courseId,
    value.type,
  ].join("::");

const buildOccasionKey = (value: DataAnalysisOccasionsRequest) =>
  `${buildContextKey(value)}::${value.sectionId}`;

const buildReportKey = (value: DataAnalysisReportRequest) =>
  `${buildContextKey(value)}::${value.sectionId}::${value.occasionId ?? "no-occasion"}`;

const reportResponses = new Map<string, DataAnalysisReportResponse>(
  successScenarios.map((scenario) => [
    `${buildContextKey(scenario)}::${scenario.sectionId}::${scenario.occasionId ?? "no-occasion"}`,
    scenario.response,
  ])
);

reportResponses.set(
  "school-auto::program-auto-be::curriculum-auto-2025-2029::term-1::course-auto-1::CCE::section-a::occasion-rubrics",
  { status: "validation", message: validationResponses.cceOccasionsNotDefined }
);

reportResponses.set(
  "school-auto::program-auto-be::curriculum-auto-2025-2029::term-1::course-auto-see::SEE::section-a::no-occasion",
  { status: "validation", message: validationResponses.seeQuestionPaperNotRolledOut }
);

export const mockDataAnalysisAdapter = {
  getSchools(): SelectOption[] {
    return [...schoolOptions];
  },
  getPrograms(schoolId: string): SelectOption[] {
    return [...(programOptionsBySchoolId[schoolId] ?? [])];
  },
  getCurricula(programId: string): SelectOption[] {
    return [...(curriculumOptionsByProgramId[programId] ?? [])];
  },
  getTerms(curriculumId: string): SelectOption[] {
    return [...(termOptionsByCurriculumId[curriculumId] ?? [])];
  },
  getCourses(termId: string, curriculumId: string): SelectOption[] {
    return [...(courseOptionsByCurriculumAndTerm[`${curriculumId}::${termId}`] ?? [])];
  },
  getTypes(courseId: string): SelectOption[] {
    return [...(typeOptionsByCourseId[courseId] ?? [])];
  },
  getSections(params: DataAnalysisSectionsRequest): SelectOption[] {
    return [...(sectionOptionsByScenario.get(buildContextKey(params)) ?? [])];
  },
  getOccasions(params: DataAnalysisOccasionsRequest): DataAnalysisOccasionsResponse {
    return occasionConfigs.get(buildOccasionKey(params)) ?? { required: false, options: [] };
  },
  getReport(params: DataAnalysisReportRequest): DataAnalysisReportResponse {
    return (
      reportResponses.get(buildReportKey(params)) ?? {
        status: "validation",
        message:
          params.type === "SEE"
            ? validationResponses.seeQuestionPaperNotRolledOut
            : validationResponses.cceOccasionsNotDefined,
      }
    );
  },
};
