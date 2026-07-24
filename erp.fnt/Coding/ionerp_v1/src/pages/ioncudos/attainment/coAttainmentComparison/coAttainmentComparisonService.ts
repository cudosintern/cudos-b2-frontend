import axiosInstance from "../../../../utils/api";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const API_URL = `${BASE_URL}/co-attainment-comparison`;

export interface DepartmentOption {
  dept_id: number;
  dept_name: string;
}

export interface ProgramOption {
  pgm_id: number;
  pgm_title: string;
  dept_id: number;
}

export interface CurriculumOption {
  crclm_id: number;
  crclm_name: string;
  pgm_id: number;
}

export interface TermOption {
  term_id: number;
  term_name: string;
}

export interface PageContextResponse {
  departments: DepartmentOption[];
  programs: ProgramOption[];
  curriculums: CurriculumOption[];
  terms: TermOption[];
}

export interface FinalizedCourseOption {
  course_id: number;
  course_code: string;
  course_title: string;
  term_id: number;
  label: string;
}

export interface ConfigInfo {
  organisation_type: string;
  co_attainment_type: string[];
  mte_enabled: boolean;
  labels: {
    cia: string;
    tee: string;
  };
}

export interface CourseInfo {
  course_id: number;
  course_code: string;
  course_title: string;
  curriculum_name: string;
  term_name: string;
}

export interface DistinctCo {
  co_code: string;
}

export interface CourseWiseRow {
  course_id: number;
  co_id: number;
  co_code: string;
  co_statement: string;
  average_attainment?: number;
  threshold_attainment?: number;
  display_attainment?: number;
}

export interface OverallRow {
  co_id: number;
  co_code: string;
  co_statement: string;
  average_attainment?: number;
  threshold_attainment?: number;
  display_attainment?: number;
}

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ChartData {
  labels: string[];
  series: ChartSeries[];
}

export interface ReportResponse {
  config: ConfigInfo;
  courses: CourseInfo[];
  distinct_cos: DistinctCo[];
  course_wise_rows: CourseWiseRow[];
  overall_rows: OverallRow[];
  charts: {
    course_wise: ChartData;
    overall: ChartData;
  };
}

export interface DrilldownSection {
  assessment_type: string;
  section_name: string;
  attainment: number;
  attainment_level: number;
}

export interface DrilldownResponse {
  header: {
    curriculum: string;
    term: string;
    course: string;
    co_code: string;
    co_statement: string;
  };
  sections: DrilldownSection[];
}

export const fetchPageContext = async (): Promise<PageContextResponse> => {
  const response = await axiosInstance.get<PageContextResponse>(`/co-attainment-comparison/page-context`);
  return response.data;
};

export const fetchFinalizedCourses = async (curriculumIds: number[], termIds: number[]): Promise<FinalizedCourseOption[]> => {
  const response = await axiosInstance.get<FinalizedCourseOption[]>(`/co-attainment-comparison/finalized-courses`, {
    params: { 
      curriculum_ids: curriculumIds.join(","),
      term_ids: termIds.join(",") 
    }
  });
  return response.data;
};

export const fetchComparisonReport = async (payload: {
  curriculum_ids: number[];
  term_ids: number[];
  course_ids: number[];
  department_id?: number;
  program_id?: number;
}): Promise<ReportResponse> => {
  const response = await axiosInstance.post<ReportResponse>(`/co-attainment-comparison/report`, payload);
  return response.data;
};

export const fetchDrilldown = async (payload: {
  course_id: number;
  clo_code: string;
  curriculum_id: number;
  term_id: number;
}): Promise<DrilldownResponse> => {
  const response = await axiosInstance.post<DrilldownResponse>(`/co-attainment-comparison/drilldown`, payload);
  return response.data;
};

export const exportComparisonReport = async (payload: {
  export_type: number;
  curriculum_ids: number[];
  term_ids: number[];
  course_ids: number[];
  department_id?: number;
  program_id?: number;
  chart1_image?: string;
  chart2_image?: string;
}): Promise<Blob> => {
  const response = await axiosInstance.post(`/co-attainment-comparison/export`, payload, {
    responseType: "blob"
  });
  return response.data as Blob;
};
