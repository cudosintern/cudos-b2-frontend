import {
  CourseCoAttainmentFilterCatalogResponse,
  CourseCoAttainmentOption,
  CourseCoAttainmentTabDataResponse,
  CourseCoAttainmentTabId,
  DirectTargetLevelsResponse,
  NoteSectionResponse,
} from "./courseCoAttainmentTypes";

const sharedNoteSection: NoteSectionResponse = {
  note:
    "The above bar graph depicts the overall class performance with respect to the Threshold % for individual Course Outcome (COs). The Threshold based Attainment % & Average based Attainment % is calculated using the below formula.",
  formulas: [
    {
      title: "For Threshold based Attainment % = ( x / y ) * 100",
      lines: [
        "x = Count of Students >= to Threshold %",
        "y = Total number of Students Attempted .",
      ],
    },
    {
      title: "For Average based Attainment % = ( x / y ) *100",
      lines: [
        "x = Average Secured marks of Attempted Students",
        "y = Maximum Marks .",
      ],
    },
  ],
};

const lowMediumHighTargetLevels: DirectTargetLevelsResponse = {
  title: "Direct Attainment / Target Levels",
  rows: [
    {
      attainmentLevelName: "Low",
      attainmentLevelValue: 1,
      target: "50% students scoring >= 50% marks out of relevant maximum marks.",
    },
    {
      attainmentLevelName: "Medium",
      attainmentLevelValue: 2,
      target: "60% students scoring >= 50% marks out of relevant maximum marks.",
    },
    {
      attainmentLevelName: "High",
      attainmentLevelValue: 3,
      target: "70% students scoring >= 50% marks out of relevant maximum marks.",
    },
  ],
  publishButtonLabel: "Finalize Course CIA for Publish",
};

const lmTargetLevels: DirectTargetLevelsResponse = {
  title: "Direct Attainment / Target Levels",
  rows: [
    {
      attainmentLevelName: "LM",
      attainmentLevelValue: 0,
      target: "0% students scoring >= 50% marks out of relevant maximum marks.",
    },
    {
      attainmentLevelName: "L",
      attainmentLevelValue: 10,
      target: "20% students scoring >= 20% marks out of relevant maximum marks.",
    },
  ],
  publishButtonLabel: "Finalize Course CIA for Publish",
};

const commonDirectIndirect = {
  surveyOptions: [
    { id: "no-surveys", label: "No Surveys" },
    { id: "course-exit-survey", label: "Course Exit Survey" },
    { id: "student-feedback-survey", label: "Student Feedback Survey" },
  ],
  defaultSurveyId: "no-surveys",
  directWeight: "80",
  indirectWeight: "20",
  note: "Survey needs to be closed to view indirect attainment.",
  submitButtonLabel: "Preview / Calculate",
  validationMessage: "",
  previewMessages: [],
  selectedSurveyLabel: "",
  rows: [],
  chartTitle: "Direct and Indirect Attainment",
  chartPoints: [],
  previewReady: false,
  canFinalize: false,
  finalizeButtonLabel: "Finalize Direct & Indirect",
  finalizeMessage: "",
};

const emptySectionSummary = {
  actualCourseAttainment: "0.00%",
  courseAttainmentAfterWeightage: "0.00%",
};

const commonFinalizeNotes = [
  {
    title: "For Attainment based on Threshold method % = X / Y",
    lines: [
      "X = Sum of all the Course Outcomes(COs) Threshold based Attainment % mapped to the respective Program Outcome(PO)",
      "Y = Count of Course Outcomes(COs) mapped to respective PO",
    ],
  },
  {
    title: "For Attainment based on Weighted Average Method % = X / Y",
    lines: [
      "X = Sum of all the Course Outcomes(COs) Attainment % * Map Level Weighted Attainment % mapped to the respective Program Outcome(PO)",
      "Y = Count of Course Outcomes(COs) mapped to respective PO",
    ],
  },
  {
    title: "For Attainment based on Relative Weighted Average Method % = X / Y",
    lines: [
      "X = Sum of all the Course Outcomes(COs) Attainment % * Map Level Weighted * Mapped Value",
      "Y = Sum of all Mapped Value of the respective Program Outcome(PO)",
    ],
  },
];

export const courseCoAttainmentFilterCatalog: CourseCoAttainmentFilterCatalogResponse = {
  curriculums: [
    { id: "fy-2018-2019", label: "B. E in FY 2018-2019" },
    { id: "bt-2015-2019", label: "B. E in BT 2015-2019" },
    { id: "me-2020-2024", label: "B. E in ME 2020-2024" },
  ],
  terms: [
    { id: "first-semester", label: "FIRST SEMESTER", curriculumId: "fy-2018-2019" },
    { id: "fy-1-semester", label: "1 - Semester", curriculumId: "fy-2018-2019" },
    { id: "bt-1-semester", label: "1 - Semester", curriculumId: "bt-2015-2019" },
    { id: "bt-4-semester", label: "4 - Semester", curriculumId: "bt-2015-2019" },
    { id: "me-1-semester", label: "1 - Semester", curriculumId: "me-2020-2024" },
    { id: "me-4-semester", label: "4 - Semester", curriculumId: "me-2020-2024" },
  ],
  courses: [
    {
      id: "engineering-mechanics",
      label: "15ECVF101 - Engineering Mechanics",
      curriculumId: "fy-2018-2019",
      termId: "first-semester",
    },
    {
      id: "cc1-course",
      label: "cc1 - cc1",
      curriculumId: "fy-2018-2019",
      termId: "first-semester",
    },
    {
      id: "course101",
      label: "Course101 - Course101",
      curriculumId: "me-2020-2024",
      termId: "me-1-semester",
    },
    {
      id: "cc1-course",
      label: "cc1 - cc1",
      curriculumId: "bt-2015-2019",
      termId: "bt-1-semester",
    },
    {
      id: "engineering-mechanics",
      label: "15ECVF101 - Engineering Mechanics",
      curriculumId: "bt-2015-2019",
      termId: "bt-1-semester",
    },
    {
      id: "course101",
      label: "Course101 - Course101",
      curriculumId: "me-2020-2024",
      termId: "me-4-semester",
    },
  ],
};

const finalizedCourseData: CourseCoAttainmentTabDataResponse = {
  cce: {
    title: "CCE - COs Attainment List",
    sections: [
      {
        id: "section-a",
        sectionLabel: "A",
        statusText: "CCE Attainment is Finalized",
        statusTone: "success",
        rows: [
          { coCode: "CO1", thresholdBasedAttainmentPercent: "60.00%", attainmentLevel: "2", averageBasedAttainmentPercent: "59.33%" },
          { coCode: "CO2", thresholdBasedAttainmentPercent: "57.50%", attainmentLevel: "1", averageBasedAttainmentPercent: "58.56%" },
          { coCode: "CO3", thresholdBasedAttainmentPercent: "66.25%", attainmentLevel: "2", averageBasedAttainmentPercent: "58.88%" },
          { coCode: "CO4", thresholdBasedAttainmentPercent: "70.00%", attainmentLevel: "3", averageBasedAttainmentPercent: "62.33%" },
          { coCode: "CO5", thresholdBasedAttainmentPercent: "61.11%", attainmentLevel: "2", averageBasedAttainmentPercent: "60.00%" },
          { coCode: "CO6", thresholdBasedAttainmentPercent: "70.00%", attainmentLevel: "3", averageBasedAttainmentPercent: "62.33%" },
          { coCode: "CO7", thresholdBasedAttainmentPercent: "60.42%", attainmentLevel: "2", averageBasedAttainmentPercent: "57.88%" },
          { coCode: "CO8", thresholdBasedAttainmentPercent: "70.00%", attainmentLevel: "3", averageBasedAttainmentPercent: "62.33%" },
        ],
        summary: {
          actualCourseAttainment: "64.41%",
          courseAttainmentAfterWeightage: "32.21%",
        },
      },
    ],
  },
  mte: {
    title: "MTE - COs Attainment List",
    sections: [
      {
        id: "section-a",
        sectionLabel: "A",
        statusText: "MTE Attainment is not Finalized",
        statusTone: "warning",
        rows: [],
        summary: emptySectionSummary,
      },
    ],
    finalizeLinkText: "Click here to Finalize course MTE data",
  },
  targetLevels: lowMediumHighTargetLevels,
  noteSection: sharedNoteSection,
  finalize: {
    typeOptions: [{ id: "all-selected", label: "All selected" }],
    defaultTypeId: "all-selected",
    note: "Note : Select all Occasions to Finalize COs Attainment",
    finalizedTableTitle: "Overall Course Outcomes COs Attainments are Finalized",
    finalizedRows: [
      {
        coCode: "CO1",
        coStatement: "1. Explain the role of civil engineering profession in socio-economic development of the human society",
        thresholdBasedAttainmentPercent: "62.50 %",
        attainmentLevel: "2",
        averageBasedThresholdPercent: "58.80 %",
      },
      {
        coCode: "CO2",
        coStatement: "2. Explain the basic principles upon which the study of engineering Mechanics is based",
        thresholdBasedAttainmentPercent: "66.25 %",
        attainmentLevel: "2",
        averageBasedThresholdPercent: "57.95 %",
      },
      {
        coCode: "CO3",
        coStatement: "3. Demonstrate the ability to apply the basics of mathematics and engineering mechanics to solve simple problems of coplanar concurrent forces.",
        thresholdBasedAttainmentPercent: "66.25 %",
        attainmentLevel: "2",
        averageBasedThresholdPercent: "58.88 %",
      },
      {
        coCode: "CO4",
        coStatement: "4. Demonstrate the ability to apply the basics of mathematics and engineering mechanics to solve simple problems of coplanar non-concurrent forces.",
        thresholdBasedAttainmentPercent: "72.50 %",
        attainmentLevel: "3",
        averageBasedThresholdPercent: "58.71 %",
      },
      {
        coCode: "CO5",
        coStatement: "5. Explain the theory of friction and demonstrate the ability to analyse and solve the problems involving friction between two surfaces in contact.",
        thresholdBasedAttainmentPercent: "64.73 %",
        attainmentLevel: "2",
        averageBasedThresholdPercent: "55.83 %",
      },
      {
        coCode: "CO6",
        coStatement: "6. Explain the terminology and concepts of stress and strains induced due to external forces.",
        thresholdBasedAttainmentPercent: "70.00 %",
        attainmentLevel: "3",
        averageBasedThresholdPercent: "62.33 %",
      },
      {
        coCode: "CO7",
        coStatement: "7. Demonstrate the ability to evaluate stresses/strains due to external forces.",
        thresholdBasedAttainmentPercent: "60.42 %",
        attainmentLevel: "2",
        averageBasedThresholdPercent: "57.88 %",
      },
      {
        coCode: "CO8",
        coStatement: "8. Explain the Concepts involved with centroid and second moment of area",
        thresholdBasedAttainmentPercent: "70.00 %",
        attainmentLevel: "3",
        averageBasedThresholdPercent: "62.33 %",
      },
      {
        coCode: "CO9",
        coStatement: "9. Locate the position of centroid of a plane.",
        thresholdBasedAttainmentPercent: "71.67 %",
        attainmentLevel: "3",
        averageBasedThresholdPercent: "54.25 %",
      },
    ],
    coPoMatrixTitle: "Course - Course Outcomes (COs) to Program Outcomes (POs) Attainment Matrix",
    coPoMatrixColumns: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    coPoMatrixRows: [
      { coCode: "CO1", values: ["-", "-", "-", "-", "-", "3 (62.50%)", "2 (62.50%)", "-", "-", "-", "-", "-"] },
      { coCode: "CO2", values: ["3 (66.25%)", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"] },
      { coCode: "CO3", values: ["2 (66.25%)", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"] },
      { coCode: "CO4", values: ["2 (72.50%)", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"] },
      { coCode: "CO5", values: ["2 (64.73%)", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"] },
      { coCode: "CO6", values: ["2 (70.00%)", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"] },
      { coCode: "CO7", values: ["3 (60.42%)", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"] },
      { coCode: "CO8", values: ["3 (70.00%)", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"] },
      { coCode: "CO9", values: ["3 (71.67%)", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"] },
      { coCode: "CO10", values: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"] },
    ],
    programOutcomesTitle: "Program Outcomes POs Attainment by the Course",
    programOutcomeRows: [
      {
        serialNo: 1,
        programOutcome: "1",
        thresholdMethodPercent: "67.73 %",
        thresholdMethodLevel: "2",
        weightedAveragePercent: "54.05 %",
        weightedAverageLevel: "1",
        relativeWeightedAveragePercent: "56.66 %",
        relativeWeightedAverageLevel: "2.17",
      },
      {
        serialNo: 2,
        programOutcome: "6",
        thresholdMethodPercent: "62.50 %",
        thresholdMethodLevel: "2",
        weightedAveragePercent: "62.50 %",
        weightedAverageLevel: "2",
        relativeWeightedAveragePercent: "62.50 %",
        relativeWeightedAverageLevel: "2.00",
      },
      {
        serialNo: 3,
        programOutcome: "7",
        thresholdMethodPercent: "62.50 %",
        thresholdMethodLevel: "2",
        weightedAveragePercent: "37.50 %",
        weightedAverageLevel: "1",
        relativeWeightedAveragePercent: "37.50 %",
        relativeWeightedAverageLevel: "1.20",
      },
    ],
    mapLevelWeightageTitle: "Map Level Weightage",
    mapLevelWeightageRows: [
      { serialNo: 1, mapLevel: "High (3)", value: "3", mapLevelWeightage: "0.00%" },
      { serialNo: 2, mapLevel: "Medium (2)", value: "2", mapLevelWeightage: "0.00%" },
      { serialNo: 3, mapLevel: "0", value: "1", mapLevelWeightage: "0.00%" },
    ],
    calculationNotes: commonFinalizeNotes,
  },
  blooms: {
    typeOptions: [
      { id: "cce", label: "CCE" },
      { id: "mte", label: "MTE" },
      { id: "see", label: "SEE" },
    ],
    sectionOptions: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    occasionOptions: [
      { id: "theory-test-1", label: "Theory Test 1" },
      { id: "minor-exam-i", label: "Minor_Exam_I" },
      { id: "minor-exam-ii", label: "Minor_Exam_II" },
      { id: "assignment", label: "Assignment" },
      { id: "all-occasion", label: "All Occasion" },
    ],
    studentOptions: [
      { id: "bt001", label: "BT001" },
      { id: "bt002", label: "BT002" },
      { id: "bt003", label: "BT003" },
      { id: "pnr1", label: "pnr1" },
    ],
    defaultTypeId: "cce",
    defaultSectionId: "a",
    defaultOccasionId: "theory-test-1",
    defaultStudentId: "bt001",
    chartTitle: "Student CCE Bloom's Level Attainment",
    messages: [],
    chartPoints: [
      { label: "L1", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "L2", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "L3", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "L4", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "L5", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "L6", thresholdPercent: 50, attainmentPercent: 0 },
    ],
    rows: [
      { serialNo: 1, bloomLevel: "L1-Remembering", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 2, bloomLevel: "L2-Understanding", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 3, bloomLevel: "L3-Applying", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 4, bloomLevel: "L4-Analyzing", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 5, bloomLevel: "L5-Evaluating", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 6, bloomLevel: "L6-Creating", threshold: "50.00%", attainment: "0.00%" },
    ],
  },
  directIndirect: commonDirectIndirect,
};

const course101Data: CourseCoAttainmentTabDataResponse = {
  cce: {
    title: "CCE - COs Attainment List",
    sections: [
      {
        id: "section-a",
        sectionLabel: "A",
        statusText: "CCE Attainment is not Finalized",
        statusTone: "warning",
        rows: [],
        summary: emptySectionSummary,
      },
      {
        id: "section-b",
        sectionLabel: "B",
        statusText: "CCE Attainment is not Finalized",
        statusTone: "warning",
        rows: [],
        summary: emptySectionSummary,
      },
      {
        id: "section-a1",
        sectionLabel: "A",
        batchLabel: "A1",
        statusText: "CCE Attainment is not Finalized",
        statusTone: "warning",
        rows: [],
        summary: emptySectionSummary,
      },
      {
        id: "section-a2",
        sectionLabel: "A",
        batchLabel: "A2",
        statusText: "CCE Attainment is not Finalized",
        statusTone: "warning",
        rows: [],
        summary: emptySectionSummary,
      },
    ],
    finalizeLinkText: "Click here to Finalize course CCE data",
  },
  mte: {
    title: "MTE - COs Attainment List",
    sections: [
      {
        id: "section-a",
        sectionLabel: "A",
        statusText: "MTE Attainment is not Finalized",
        statusTone: "warning",
        rows: [],
        summary: emptySectionSummary,
      },
    ],
    finalizeLinkText: "Click here to Finalize course MTE data",
  },
  targetLevels: lmTargetLevels,
  noteSection: sharedNoteSection,
  finalize: {
    typeOptions: [{ id: "all-selected", label: "All selected" }],
    defaultTypeId: "all-selected",
    note: "Note : Select all Occasions to Finalize COs Attainment",
    statusMessage: {
      lines: [
        "CCE is not Finalized for this course.",
        'Kindly refer the first tab "CCE - COs Attainment (Section/Division wise)" to know the Course CCE Finalize status.',
        "Click here to Finalize course .",
        "SEE marks not uploaded for this course.",
        "Click here to Upload Marks .",
      ],
      linkText: "Click here to Finalize course .",
    },
    finalizedTableTitle: "Overall Course Outcomes COs Attainments are Finalized",
    finalizedRows: [],
    coPoMatrixTitle: "Course - Course Outcomes (COs) to Program Outcomes (POs) Attainment Matrix",
    coPoMatrixColumns: [],
    coPoMatrixRows: [],
    programOutcomesTitle: "Program Outcomes POs Attainment by the Course",
    programOutcomeRows: [],
    mapLevelWeightageTitle: "Map Level Weightage",
    mapLevelWeightageRows: [],
    calculationNotes: [],
  },
  blooms: {
    typeOptions: [
      { id: "cce", label: "CCE" },
      { id: "mte", label: "MTE" },
      { id: "see", label: "SEE" },
    ],
    sectionOptions: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    occasionOptions: [
      { id: "cce-test-1", label: "CCE Test 1" },
      { id: "minor-exam-i", label: "Minor_Exam_I" },
      { id: "minor-exam-ii", label: "Minor_Exam_II" },
      { id: "assignment", label: "Assignment" },
      { id: "all-occasion", label: "All Occasion" },
    ],
    studentOptions: [
      { id: "bt001", label: "BT001" },
      { id: "bt002", label: "BT002" },
      { id: "bt003", label: "BT003" },
      { id: "pnr1", label: "pnr1" },
    ],
    defaultTypeId: "cce",
    defaultSectionId: "a",
    defaultOccasionId: "cce-test-1",
    defaultStudentId: "pnr1",
    chartTitle: "Student CCE Bloom's Level Attainment",
    messages: [],
    chartPoints: [
      { label: "A1", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "A2", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "A3", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "A4", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "A5", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "P1", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "P2", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "P3", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "P4", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "P5", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "P6", thresholdPercent: 50, attainmentPercent: 0 },
      { label: "P7", thresholdPercent: 50, attainmentPercent: 0 },
    ],
    rows: [
      { serialNo: 1, bloomLevel: "A1-Receiving Willing to listen", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 2, bloomLevel: "A2-Responding Willing to participate", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 3, bloomLevel: "A3-Valuing Willing to be involved", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 4, bloomLevel: "A4-Organization Willing to be an advocate", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 5, bloomLevel: "A5-Characterization Willing to change one's behavior, lifestyle, or way of life", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 6, bloomLevel: "P1-Perception Senses cues that guided motor activity", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 7, bloomLevel: "P2-Set Is mentally, emotionally and physically ready to act", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 8, bloomLevel: "P3-Guided response Imitates and practices skills, often in discrete steps", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 9, bloomLevel: "P4-Mechanism Performs acts with increasing efficiency, confidence and proficiency", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 10, bloomLevel: "P5-Complex overt response Skillful performance in a complex movement pattern", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 11, bloomLevel: "P6-Adaptation Modifies movement patterns to fit special requirements", threshold: "50.00%", attainment: "0.00%" },
      { serialNo: 12, bloomLevel: "P7-Origination Creates new movement patterns to fit a particular situation", threshold: "50.00%", attainment: "0.00%" },
    ],
  },
  directIndirect: commonDirectIndirect,
};

const courseTabDataByCourseId: Record<string, CourseCoAttainmentTabDataResponse> = {
  "engineering-mechanics": finalizedCourseData,
  "cc1-course": finalizedCourseData,
  course101: course101Data,
};

export const getTermsForCurriculum = (curriculumId: string): CourseCoAttainmentOption[] =>
  courseCoAttainmentFilterCatalog.terms
    .filter((term) => term.curriculumId === curriculumId)
    .map(({ id, label }) => ({ id, label }));

export const getCoursesForTerm = (
  curriculumId: string,
  termId: string
): CourseCoAttainmentOption[] =>
  courseCoAttainmentFilterCatalog.courses
    .filter((course) => course.curriculumId === curriculumId && course.termId === termId)
    .map(({ id, label }) => ({ id, label }));

export const getCourseCoAttainmentTabData = (
  courseId: string,
  _tabId?: CourseCoAttainmentTabId
): CourseCoAttainmentTabDataResponse | null => courseTabDataByCourseId[courseId] ?? null;
