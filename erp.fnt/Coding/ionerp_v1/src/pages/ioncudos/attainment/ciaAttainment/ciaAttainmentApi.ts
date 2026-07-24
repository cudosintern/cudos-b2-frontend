import axiosInstance from '../../../../utils/api';
import { CalculateAttainmentPayload, AttainmentData, CoAssessmentDetails, CoDrilldownDetails, DropdownOption, ExportAttainmentResponse } from './ciaAttainmentTypes';

const BASE_URL = '/co-section-attainment';

const dataOf = <T>(res: any, fallback: T | T[] = []) => res?.data?.data ?? fallback;
const fieldOf = <T>(res: any, field: string, fallback: T = [] as T) =>
  res?.data?.data?.[field] ?? res?.data?.[field] ?? fallback;

export const ciaAttainmentApi = {
  getCurriculums: async (): Promise<DropdownOption[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/initial`);
    return fieldOf<DropdownOption[]>(res, 'curriculums', []);
  },

  getTerms: async (curriculumId: string | number): Promise<DropdownOption[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/terms`, { params: { curriculum_id: curriculumId } });
    return dataOf(res, []);
  },

  getCourses: async (termId: string | number): Promise<DropdownOption[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/courses`, { params: { term_id: termId } });
    return dataOf(res, []);
  },

  getSections: async (cId: any, tId: any, coId: any): Promise<DropdownOption[]> => {
    const params = { curriculum_id: cId, term_id: tId, course_id: coId };
    const res = await axiosInstance.get(`${BASE_URL}/sections`, { params });
    return dataOf(res, []);
  },

  getOccasions: async (cId: any, tId: any, coId: any, sId: any): Promise<DropdownOption[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/occasions`, {
      params: { curriculum_id: cId, term_id: tId, crs_id: coId, section_id: sId },
    });
    return dataOf(res, []);
  },

  calculateAttainment: async (payload: CalculateAttainmentPayload): Promise<AttainmentData> => {
    const res = await axiosInstance.post(`${BASE_URL}/calculate`, payload);
    return dataOf(res, {} as AttainmentData);
  },

  getCoAssessmentDetails: async (coId: string | number): Promise<CoAssessmentDetails> => {
    const res = await axiosInstance.post(`${BASE_URL}/questions`, { co_id: coId });
    return dataOf(res, {} as CoAssessmentDetails);
  },

  getCoDrilldownDetails: async (coId: string | number): Promise<CoDrilldownDetails> => {
    const res = await axiosInstance.post(`${BASE_URL}/drilldown`, { co_id: coId });
    return dataOf(res, {} as CoDrilldownDetails);
  },

  finalizeAttainment: async (payload: CalculateAttainmentPayload): Promise<{ message: string }> => {
    const res = await axiosInstance.post(`${BASE_URL}/finalize`, payload);
    return dataOf(res, { message: "CO Attainment finalized successfully." });
  },

  exportAttainment: async (payload: CalculateAttainmentPayload & { export_type: 'pdf' | 'doc' }): Promise<ExportAttainmentResponse> => {
    const res = await axiosInstance.post(`${BASE_URL}/export`, payload);
    return dataOf(res, {} as ExportAttainmentResponse);
  },
};
