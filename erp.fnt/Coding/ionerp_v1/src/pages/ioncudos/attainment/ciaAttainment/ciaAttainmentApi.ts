import axiosInstance from '../../../../utils/api';
import { CalculateAttainmentPayload, AttainmentData, DropdownOption } from './ciaAttainmentTypes';

const BASE_URL = '/co-section-attainment';

const dataOf = <T>(res: any, fallback: T | T[] = []) => res?.data?.data ?? fallback;

export const ciaAttainmentApi = {
  getCurriculums: async (): Promise<DropdownOption[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/curricula`);
    return dataOf(res);
  },

  getTerms: async (curriculumId: string | number): Promise<DropdownOption[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/terms`, { params: { curriculum_id: curriculumId } });
    return dataOf(res);
  },

  getCourses: async (termId: string | number): Promise<DropdownOption[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/courses`, { params: { term_id: termId } });
    return dataOf(res);
  },

  getSections: async (curriculumId: string | number, termId: string | number, courseId: string | number): Promise<DropdownOption[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/sections`, { 
      params: { curriculum_id: curriculumId, term_id: termId, course_id: courseId } 
    });
    return dataOf(res);
  },

  getOccasions: async (curriculumId: string | number, termId: string | number, crsId: string | number, sectionId: string | number): Promise<DropdownOption[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/occasions`, { 
      params: { 
        curriculum_id: curriculumId, 
        term_id: termId, 
        crs_id: crsId, 
        section_id: sectionId 
      } 
    });
    return dataOf(res);
  },

  calculateAttainment: async (payload: CalculateAttainmentPayload): Promise<AttainmentData> => {
    const res = await axiosInstance.post(`${BASE_URL}/calculate`, payload);
    return dataOf(res, {} as AttainmentData);
  },
};