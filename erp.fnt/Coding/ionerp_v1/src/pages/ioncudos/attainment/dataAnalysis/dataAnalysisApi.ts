import {
  DataAnalysisOccasionsRequest,
  DataAnalysisOccasionsResponse,
  DataAnalysisReportRequest,
  DataAnalysisReportResponse,
  DataAnalysisSectionsRequest,
  SelectOption,
} from "./dataAnalysisTypes";
import { mockDataAnalysisAdapter } from "./dataAnalysisMockData";

const MOCK_DELAY_MS = 120;

const delay = async () =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });

export const getSchools = async (): Promise<SelectOption[]> => {
  await delay();
  return mockDataAnalysisAdapter.getSchools();
};

export const getPrograms = async (schoolId: string): Promise<SelectOption[]> => {
  await delay();
  return mockDataAnalysisAdapter.getPrograms(schoolId);
};

export const getCurricula = async (programId: string): Promise<SelectOption[]> => {
  await delay();
  return mockDataAnalysisAdapter.getCurricula(programId);
};

export const getTerms = async (curriculumId: string): Promise<SelectOption[]> => {
  await delay();
  return mockDataAnalysisAdapter.getTerms(curriculumId);
};

export const getCourses = async (termId: string, curriculumId: string): Promise<SelectOption[]> => {
  await delay();
  return mockDataAnalysisAdapter.getCourses(termId, curriculumId);
};

export const getTypes = async (courseId: string): Promise<SelectOption[]> => {
  await delay();
  return mockDataAnalysisAdapter.getTypes(courseId);
};

export const getSections = async (
  params: DataAnalysisSectionsRequest
): Promise<SelectOption[]> => {
  await delay();
  return mockDataAnalysisAdapter.getSections(params);
};

export const getOccasions = async (
  params: DataAnalysisOccasionsRequest
): Promise<DataAnalysisOccasionsResponse> => {
  await delay();
  return mockDataAnalysisAdapter.getOccasions(params);
};

export const getDataAnalysisReport = async (
  params: DataAnalysisReportRequest
): Promise<DataAnalysisReportResponse> => {
  await delay();
  return mockDataAnalysisAdapter.getReport(params);
};
