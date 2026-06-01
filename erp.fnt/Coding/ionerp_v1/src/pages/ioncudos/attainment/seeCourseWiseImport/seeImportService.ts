import axiosInstance from '../../../../utils/api';
import { Course, DropdownOption, ImportedStudentMarks } from './seeImportTypes';

export const seeImportService = {
  getSchools: async (): Promise<DropdownOption[]> => {
    try {
      const res = await axiosInstance.get('/assessments/see_import/schools');
      return (res.data as any)?.data?.map((s: any) => ({ value: s.dept_id, label: s.dept_name })) || [];
    } catch (error) {
      console.error('Error fetching schools:', error);
      return [];
    }
  },

  getPrograms: async (school_id: string | number): Promise<DropdownOption[]> => {
    try {
      const res = await axiosInstance.get(`/assessments/see_import/programs?dept_id=${school_id}`);
      return (res.data as any)?.data?.map((p: any) => ({ value: p.pgm_id, label: p.pgm_title })) || [];
    } catch (error) {
      console.error('Error fetching programs:', error);
      return [];
    }
  },

  getCurriculums: async (program_id: string | number): Promise<DropdownOption[]> => {
    try {
      const res = await axiosInstance.get(`/assessments/see_import/curriculums?program_id=${program_id}`);
      return (res.data as any)?.data?.map((c: any) => ({ value: c.academic_batch_id, label: c.academic_batch_code })) || [];
    } catch (error) {
      console.error('Error fetching curriculums:', error);
      return [];
    }
  },

  getTerms: async (curriculum_id: string | number): Promise<DropdownOption[]> => {
    try {
      const res = await axiosInstance.get(`/assessments/see_import/terms?curriculum_id=${curriculum_id}`);
      return (res.data as any)?.data?.map((t: any) => ({ value: t.semester_id, label: t.display_name })) || [];
    } catch (error) {
      console.error('Error fetching terms:', error);
      return [];
    }
  },

  getCourses: async (term_id: string | number): Promise<Course[]> => {
    try {
      const res = await axiosInstance.get(`/assessments/see_import/courses?term_id=${term_id}`);
      return (res.data as any)?.data || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  },

  downloadTemplate: async (course_id: number, term_id: number): Promise<void> => {
    try {
      const res = await axiosInstance.get(`/assessments/see_import/download-template?course_id=${course_id}&term_id=${term_id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data as any]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SEE_Template_Course_${course_id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
      throw error;
    }
  },

  importMarks: async (course_id: number, term_id: number, file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await axiosInstance.post(`/assessments/see_import/import-marks?course_id=${course_id}&term_id=${term_id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error) {
      console.error('Error importing marks:', error);
      throw error;
    }
  },

  viewImported: async (course_id: number, term_id: number): Promise<ImportedStudentMarks[]> => {
    try {
      const res = await axiosInstance.get(`/assessments/see_import/view-imported?course_id=${course_id}&term_id=${term_id}`);
      return (res.data as any)?.data || [];
    } catch (error) {
      console.error('Error viewing imported marks:', error);
      return [];
    }
  },

  uploadQP: async (course_id: number, file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await axiosInstance.post(`/assessments/see_import/upload-qp?course_id=${course_id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error) {
      console.error('Error uploading QP:', error);
      throw error;
    }
  },

  getQP: async (course_id: number): Promise<{ doc_id: number; file_name: string } | null> => {
    try {
      const res = await axiosInstance.get(`/assessments/see_import/get-qp?course_id=${course_id}`);
      return (res.data as any)?.data || null;
    } catch (error) {
      console.error('Error fetching QP:', error);
      return null;
    }
  },

  viewQPFile: async (doc_id: number): Promise<void> => {
    try {
      const res = await axiosInstance.get<Blob>(`/assessments/see_import/view-qp/${doc_id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing QP file:', error);
      throw error;
    }
  },

  checkThreshold: async (course_id: number): Promise<boolean> => {
    try {
      const res = await axiosInstance.get(`/assessments/see_import/check-threshold?course_id=${course_id}`);
      return (res.data as any)?.data?.isDefined || false;
    } catch (error) {
      console.error('Error checking threshold:', error);
      return false; // Safely return false if error
    }
  },

  discardImport: async (course_id: number, term_id: number): Promise<any> => {
    try {
      const res = await axiosInstance.delete(`/assessments/see_import/discard-import?course_id=${course_id}&term_id=${term_id}`);
      return res.data;
    } catch (error) {
      console.error('Error discarding import:', error);
      throw error;
    }
  }
};