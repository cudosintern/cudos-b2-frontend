import axiosInstance from "../../../../utils/api";
import {
  CourseCoAttainmentBloomsPreviewData,
  CourseCoAttainmentCombinedPreviewData,
  CourseCoAttainmentDirectIndirectPreviewData,
  CourseCoAttainmentDrilldownData,
  CourseCoAttainmentOverviewData,
} from "./courseCoAttainmentTypes";

const BASE_URL = "/course-co-attainment";

interface ApiEnvelope<T> {
  data?: {
    data?: T;
    terms?: T;
  };
}

const dataOf = <T>(response: unknown, fallback: T) => {
  const envelope = response as
    | (ApiEnvelope<T> & {
        data?: T;
      })
    | null;

  return envelope?.data?.data ?? envelope?.data ?? fallback;
};

const nestedFieldOf = <T>(response: unknown, field: string, fallback: T) => {
  const envelope = response as Record<string, unknown> | null;
  const rootData =
    envelope && typeof envelope === "object" && envelope.data && typeof envelope.data === "object"
      ? (envelope.data as Record<string, unknown>)
      : null;
  const nestedData =
    rootData?.data && typeof rootData.data === "object"
      ? (rootData.data as Record<string, unknown>)
      : null;

  return ((nestedData?.[field] as T | undefined) ?? (rootData?.[field] as T | undefined) ?? fallback);
};

export interface CourseCoAttainmentInitialResponse {
  curricula?: unknown[];
  curriculums?: unknown[];
  terms?: unknown[];
  organisation_flags?: {
    mte_flag?: boolean | number | string;
    ems_integration?: boolean | number | string;
    [key: string]: unknown;
  };
  selected?: {
    curriculum_id?: string | number;
    term_id?: string | number;
    course_id?: string | number;
  };
  selected_state?: {
    curriculum_id?: string | number;
    term_id?: string | number;
    course_id?: string | number;
  };
  [key: string]: unknown;
}

export interface CourseCoAttainmentTermApiItem {
  id?: string | number;
  term_id?: string | number;
  semester_id?: string | number;
  name?: string;
  term_name?: string;
  semester?: string;
  semester_name?: string;
  semester_desc?: string;
  label?: string;
  [key: string]: unknown;
}

export interface CourseCoAttainmentCourseApiItem {
  id?: string | number;
  course_id?: string | number;
  crs_id?: string | number;
  course_code?: string;
  course_title?: string;
  course_name?: string;
  label?: string;
  cia_flag?: boolean | number | string;
  mte_flag?: boolean | number | string;
  tee_flag?: boolean | number | string;
  total_cia_weightage?: number | string;
  total_mte_weightage?: number | string;
  total_tee_weightage?: number | string;
  [key: string]: unknown;
}

export interface CourseCoAttainmentSectionApiItem {
  id?: string | number;
  section_id?: string | number;
  section?: string;
  section_name?: string;
  section_code?: string;
  division?: string;
  label?: string;
  [key: string]: unknown;
}

export interface CourseCoAttainmentOccasionApiItem {
  id?: string | number;
  occasion_id?: string | number;
  ao_id?: string | number;
  qpd_id?: string | number;
  name?: string;
  occasion_name?: string;
  occasion_code?: string;
  assessment_type?: string;
  label?: string;
  [key: string]: unknown;
}

export interface CourseCoAttainmentSurveyApiItem {
  id?: string | number;
  survey_id?: string | number;
  name?: string;
  survey_name?: string;
  survey_title?: string;
  label?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CourseCoAttainmentStudentApiItem {
  student_usn?: string;
  usn?: string;
  roll_number?: string;
  roll_no?: string;
  student_name?: string;
  name?: string;
  label?: string;
  [key: string]: unknown;
}

export type CourseCoAttainmentOverviewResponse = Partial<CourseCoAttainmentOverviewData>;
export type CourseCoAttainmentCombinedPreviewResponse = Partial<CourseCoAttainmentCombinedPreviewData>;
export type CourseCoAttainmentBloomsPreviewResponse = Partial<CourseCoAttainmentBloomsPreviewData>;
export type CourseCoAttainmentDirectIndirectPreviewResponse = Partial<CourseCoAttainmentDirectIndirectPreviewData>;
export type CourseCoAttainmentDrilldownResponse = Partial<CourseCoAttainmentDrilldownData>;

const emptyOverview: CourseCoAttainmentOverviewResponse = {
  availableAssessmentTypes: [],
  flags: {
    ciaFinalized: false,
    mteFinalized: false,
    teeAvailable: false,
    canFinalizeCourse: false,
  },
  prerequisites: {
    lines: [],
  },
};

export const courseCoAttainmentApi = {
  async getInitial() {
    const response = await axiosInstance.get(`${BASE_URL}/initial`);
    return dataOf<CourseCoAttainmentInitialResponse>(response, {});
  },

  async getTerms(curriculumId: string | number) {
    const response = await axiosInstance.get(`${BASE_URL}/terms`, {
      params: { curriculum_id: curriculumId },
    });
    return nestedFieldOf<CourseCoAttainmentTermApiItem[]>(response, "terms", []);
  },

  async getCourses(curriculumId: string | number, termId: string | number) {
    const response = await axiosInstance.get(`${BASE_URL}/courses`, {
      params: { curriculum_id: curriculumId, term_id: termId },
    });
    return nestedFieldOf<CourseCoAttainmentCourseApiItem[]>(response, "courses", []);
  },

  async getOverview(curriculumId: string | number, termId: string | number, courseId: string | number) {
    const response = await axiosInstance.get(`${BASE_URL}/overview`, {
      params: { curriculum_id: curriculumId, term_id: termId, course_id: courseId },
    });
    return dataOf<CourseCoAttainmentOverviewResponse>(response, emptyOverview);
  },

  async getSections(curriculumId: string | number, termId: string | number, courseId: string | number) {
    const response = await axiosInstance.get(`${BASE_URL}/sections`, {
      params: { curriculum_id: curriculumId, term_id: termId, course_id: courseId },
    });
    return nestedFieldOf<CourseCoAttainmentSectionApiItem[]>(response, "sections", []);
  },

  async getOccasions(
    curriculumId: string | number,
    termId: string | number,
    courseId: string | number,
    sectionId: string | number,
    assessmentType: string
  ) {
    const response = await axiosInstance.get(`${BASE_URL}/occasions`, {
      params: {
        curriculum_id: curriculumId,
        term_id: termId,
        course_id: courseId,
        section_id: sectionId,
        assessment_type: assessmentType,
      },
    });
    return nestedFieldOf<CourseCoAttainmentOccasionApiItem[]>(response, "occasions", []);
  },

  async getSurveys(courseId: string | number) {
    const response = await axiosInstance.get(`${BASE_URL}/surveys`, {
      params: { course_id: courseId },
    });
    return nestedFieldOf<CourseCoAttainmentSurveyApiItem[]>(response, "surveys", []);
  },

  async getStudents(
    curriculumId: string | number,
    termId: string | number,
    courseId: string | number,
    payload: {
      occasionId?: string | number;
      sectionId?: string | number;
      assessmentType?: string;
    }
  ) {
    const params: Record<string, string | number> = {
      curriculum_id: curriculumId,
      term_id: termId,
      course_id: courseId,
    };
    if (payload.occasionId !== undefined && payload.occasionId !== null && payload.occasionId !== "") {
      params.occasion_id = payload.occasionId;
    }
    if (payload.sectionId !== undefined && payload.sectionId !== null && payload.sectionId !== "") {
      params.section_id = payload.sectionId;
    }
    if (payload.assessmentType) {
      params.assessment_type = payload.assessmentType;
    }

    const response = await axiosInstance.get(`${BASE_URL}/students`, { params });
    return nestedFieldOf<CourseCoAttainmentStudentApiItem[]>(response, "students", []);
  },

  async previewCombinedAttainment(
    curriculumId: string | number,
    termId: string | number,
    courseId: string | number,
    assessmentTypes: string[]
  ) {
    const response = await axiosInstance.post(`${BASE_URL}/combined-attainment/preview`, {
      curriculum_id: curriculumId,
      term_id: termId,
      course_id: courseId,
      assessment_types: assessmentTypes,
    });
    return dataOf<CourseCoAttainmentCombinedPreviewResponse>(response, {});
  },

  async getCloDrilldown(
    curriculumId: string | number,
    termId: string | number,
    courseId: string | number,
    cloId: string | number
  ) {
    const response = await axiosInstance.get(`${BASE_URL}/clo-drilldown`, {
      params: {
        curriculum_id: curriculumId,
        term_id: termId,
        course_id: courseId,
        clo_id: cloId,
      },
    });
    const data = dataOf<Record<string, unknown>>(response, {});
    const course = (data.course as Record<string, unknown> | undefined) ?? {};
    const clo = (data.clo as Record<string, unknown> | undefined) ?? {};
    const weights = (data.weights as Record<string, unknown> | undefined) ?? {};
    const overall = (data.overall as Record<string, unknown> | undefined) ?? {};
    const assessmentRows = Array.isArray(data.assessment_rows)
      ? (data.assessment_rows as Array<Record<string, unknown>>)
      : Array.isArray(data.assessmentRows)
        ? (data.assessmentRows as Array<Record<string, unknown>>)
        : [];

    return {
      course: {
        courseCode: (course.course_code as string | undefined) ?? (course.courseCode as string | undefined),
        courseTitle: (course.course_title as string | undefined) ?? (course.courseTitle as string | undefined),
        totalCiaWeightage:
          (course.total_cia_weightage as string | number | undefined) ??
          (course.totalCiaWeightage as string | number | undefined),
        totalMteWeightage:
          (course.total_mte_weightage as string | number | undefined) ??
          (course.totalMteWeightage as string | number | undefined),
        totalTeeWeightage:
          (course.total_tee_weightage as string | number | undefined) ??
          (course.totalTeeWeightage as string | number | undefined),
      },
      clo: {
        coId: (clo.co_id as string | number | undefined) ?? (clo.coId as string | number | undefined),
        coCode: (clo.co_code as string | undefined) ?? (clo.coCode as string | undefined),
        coStatement: (clo.co_statement as string | undefined) ?? (clo.coStatement as string | undefined),
      },
      weights: {
        cia: (weights.cia as string | null | undefined) ?? null,
        mte: (weights.mte as string | null | undefined) ?? null,
        tee: (weights.tee as string | null | undefined) ?? null,
      },
      assessmentRows: assessmentRows.map((row) => ({
        assessmentType:
          (row.assessment_type as string | undefined) ?? (row.assessmentType as string | undefined) ?? "",
        assessmentLabel:
          (row.assessment_label as string | undefined) ?? (row.assessmentLabel as string | undefined) ?? "",
        weightagePercent:
          (row.weightage_percent as string | null | undefined) ??
          (row.weightagePercent as string | null | undefined) ??
          null,
        available: Boolean(row.available),
        actualAttainmentPercent:
          (row.actual_attainment_percent as string | null | undefined) ??
          (row.actualAttainmentPercent as string | null | undefined) ??
          null,
        actualAttainmentLevel:
          (row.actual_attainment_level as string | null | undefined) ??
          (row.actualAttainmentLevel as string | null | undefined) ??
          null,
        afterWeightageAttainmentPercent:
          (row.after_weightage_attainment_percent as string | null | undefined) ??
          (row.afterWeightageAttainmentPercent as string | null | undefined) ??
          null,
        afterWeightageAttainmentLevel:
          (row.after_weightage_attainment_level as string | null | undefined) ??
          (row.afterWeightageAttainmentLevel as string | null | undefined) ??
          null,
      })),
      overall: {
        overallAttainmentPercent:
          (overall.overall_attainment_percent as string | null | undefined) ??
          (overall.overallAttainmentPercent as string | null | undefined) ??
          null,
        overallAttainmentPercentDisplay:
          (overall.overall_attainment_percent_display as string | null | undefined) ??
          (overall.overallAttainmentPercentDisplay as string | null | undefined) ??
          null,
        overallAttainmentLevel:
          (overall.overall_attainment_level as string | null | undefined) ??
          (overall.overallAttainmentLevel as string | null | undefined) ??
          null,
      },
    } satisfies CourseCoAttainmentDrilldownResponse;
  },

  async previewBlooms(payload: {
    curriculumId: string | number;
    termId: string | number;
    courseId: string | number;
    sectionId?: string | number;
    assessmentType: string;
    occasionId?: string | number;
    qpdId?: string | number;
    studentUsn?: string;
  }) {
    const response = await axiosInstance.post(`${BASE_URL}/blooms/preview`, {
      curriculum_id: payload.curriculumId,
      term_id: payload.termId,
      course_id: payload.courseId,
      section_id: payload.sectionId || null,
      assessment_type: payload.assessmentType,
      occasion_id: payload.occasionId || null,
      qpd_id: payload.qpdId || null,
      student_usn: payload.studentUsn || null,
    });
    return dataOf<CourseCoAttainmentBloomsPreviewResponse>(response, {});
  },

  async previewDirectIndirect(payload: {
    courseId: string | number;
    qpdId?: string | number;
    assessmentType: string;
    directWeight: string | number;
    indirectWeight: string | number;
    surveyId: string | number;
  }) {
    const response = await axiosInstance.post(`${BASE_URL}/direct-indirect/preview`, {
      course_id: payload.courseId,
      qpd_id: payload.qpdId ?? null,
      assessment_type: payload.assessmentType,
      direct_weight: payload.directWeight,
      indirect_weight: payload.indirectWeight,
      survey_id: payload.surveyId,
    });
    return dataOf<CourseCoAttainmentDirectIndirectPreviewResponse>(response, {});
  },

  async finalizeDirectIndirect(payload: {
    courseId: string | number;
    qpdId?: string | number;
    assessmentType: string;
    directWeight: string | number;
    indirectWeight: string | number;
    surveyId: string | number;
  }) {
    const response = await axiosInstance.post(`${BASE_URL}/direct-indirect/finalize`, {
      course_id: payload.courseId,
      qpd_id: payload.qpdId ?? null,
      assessment_type: payload.assessmentType,
      direct_weight: payload.directWeight,
      indirect_weight: payload.indirectWeight,
      survey_id: payload.surveyId,
    });
    return response?.data ?? {};
  },
};
