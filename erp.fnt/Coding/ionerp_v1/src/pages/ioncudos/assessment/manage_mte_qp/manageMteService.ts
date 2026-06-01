import axiosInstance from "../../../../utils/api";
import type { ApiResponse, BloomLevel, CourseOutcome, AssessmentOccasion, MteFramework, MteQuestion, SchoolOption, ProgramOption, CurriculumOption, TermOption, CourseOption } from "./responseInterface";

// Base paths (use `axiosInstance` baseURL from src/utils/api)
// Base paths
const MTE_BASE = "mte";
const SCHOOL_USER_BASE = "school_user";
const ASSESSMENTS_BASE = "assessments/manage_cia_occasion";
const CO_BASE = "course-outcome";

// Helper to normalize backend status (backend returns boolean True/False or 1/0)
function normStatus(raw: any): number {
  if (raw === 1 || raw === '1' || raw === true) return 1;
  if (raw === 0 || raw === '0' || raw === false) return 0;
  return raw ? 1 : 0;
}

export class ManageMteService {
  /**
   * Get Schools (Departments)
   */
  async getSchools(): Promise<ApiResponse<SchoolOption[]>> {
    try {
      const response = await axiosInstance.get<any>(`${SCHOOL_USER_BASE}/school_dropdown`);
      const status = response.data?.status === true ? 1 : (response.data?.status === false ? 0 : (response.data?.status || 0));
      return {
        status: normStatus(status),
        message: response.data?.message || "Success",
        data: response.data?.data || []
      };
    } catch (error: any) {
      console.error("Error fetching schools:", error);
      return { status: 0, message: "Failed to fetch schools", data: [] };
    }
  }

  /**
   * Get Programs filtered by dept_id
   */
  async getPrograms(deptId: number): Promise<ApiResponse<ProgramOption[]>> {
    try {
      const response = await axiosInstance.get<any>(`${ASSESSMENTS_BASE}/programs?dept_id=${deptId}`);
      let programs: ProgramOption[] = [];
      if (response.data.programs) {
        programs = response.data.programs;
      } else if (Array.isArray(response.data.data)) {
        programs = response.data.data;
      } else if (Array.isArray(response.data)) {
        programs = response.data;
      }
      return {
        status: 1,
        message: "Success",
        data: programs
      };
    } catch (error: any) {
      console.error("Error fetching programs:", error);
      return { status: 0, message: "Failed to fetch programs", data: [] };
    }
  }

  /**
   * Get Curriculums filtered by pgm_id
   */
  async getCurriculums(pgmId: number): Promise<ApiResponse<CurriculumOption[]>> {
    try {
      const response = await axiosInstance.get<any>(`${ASSESSMENTS_BASE}/curriculum?pgm_id=${pgmId}`);
      const curriculums = (response.data?.data || []).map((item: Record<string, any>) => ({
        academic_batch_id: item.academic_batch_id,
        academic_batch_code: item.academic_batch_code || item.academic_batch_desc || `Batch ${item.academic_batch_id}`,
        pgm_id: item.pgm_id
      }));
      const status = normStatus(response.data?.status);
      return {
        status,
        message: response.data?.message || "Success",
        data: curriculums
      };
    } catch (error: any) {
      console.error("Error fetching curriculums:", error);
      return { status: 0, message: "Failed to fetch curriculums", data: [] };
    }
  }

  /**
   * Get Terms for curriculum
   */
  async getTerms(academicBatchId: number): Promise<ApiResponse<TermOption[]>> {
    try {
      const response = await axiosInstance.get<any>(`${ASSESSMENTS_BASE}/terms?academic_batch_id=${academicBatchId}`);
      const items = response.data?.terms || response.data?.data || response.data || [];
      const terms = (items || []).map((item: Record<string, any>) => ({
        semester_id: item.si_no || item.semester_id || item.id,
        term_name: item.term_name || item.name || `Term ${item.si_no || item.id}`,
        academic_batch_id: item.academic_batch_id || item.academic_batch || item.batch_id
      }));
      const status = normStatus(response.data?.status);
      return {
        status,
        message: response.data?.message || "Success",
        data: terms
      };
    } catch (error: any) {
      console.error("Error fetching terms:", error);
      return { status: 0, message: "Failed to fetch terms", data: [] };
    }
  }

  /**
   * Get Course list
   */
  async getCourses(filters: {
    deptId?: number;
    pgmId?: number;
    batchId?: number;
    termId?: number;
  }): Promise<ApiResponse<CourseOption[]>> {
    try {
      const params = new URLSearchParams();
      if (filters.deptId) params.append("iems_department", filters.deptId.toString());
      if (filters.pgmId) params.append("iems_program", filters.pgmId.toString());
      if (filters.batchId) params.append("iems_academic_batch", filters.batchId.toString());
      if (filters.termId) params.append("iems_semester", filters.termId.toString());

      const response = await axiosInstance.get<any>(`${MTE_BASE}/course-detail?${params.toString()}`);
      const ok = response.data?.status === 1 || response.data?.status === true;
      if (!ok) {
        throw new Error(response.data?.message || "No courses found");
      }

      const raw = response.data?.data?.data || response.data?.data || [];
      const courses: CourseOption[] = raw
        .map((item: Record<string, any>): CourseOption => ({
          ...item,
          qpd_id: item.qpd_id || item.ao_id || 0,
          crs_id: item.crs_id || item.id,
          crs_code: item.crs_code || item.code,
          crs_title: item.crs_title || item.title || item.qpd_title,
          course_type: item.course_type || (item.elective_crs_flag === 1 ? "Elective" : "Core"),
          credits: item.credit_hours || item.credits || 0,
          qpd_title: item.crs_title || item.qpd_title,
          qpd_max_marks: item.qpd_max_marks || item.total_marks || 100,
          course_owner: item.course_owner || item.course_owner_name || "TBD",
          qpd_timing: item.qpd_timing || item.crs_mode || "Physical"
        }))
        .filter((course: CourseOption) => Boolean(course.crs_id && course.crs_code));

      return {
        status: 1,
        message: `Found ${courses.length} courses`,
        data: courses
      };
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      return { status: 0, message: error.message || "Failed to fetch courses", data: [] };
    }
  }

  /**
   * Get Bloom Levels (single/batch)
   */
  async getBloomLevels(): Promise<ApiResponse<BloomLevel[]>> {
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>(`${CO_BASE}/bloom-levels`);
      const bloomLevels: BloomLevel[] = (response.data.data || []).map((item: Record<string, any>) => ({
        bloom_level_id: item.bloom_id || item.id,
        bloom_level: item.bloom_level_name || item.level || item.name,
        description: item.description || ""
      }));
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Success",
        data: bloomLevels
      };
    } catch (error: any) {
      console.error("Error fetching bloom levels:", error);
      return { status: 0, message: "Failed to fetch bloom levels", data: [] };
    }
  }

  /**
   * Batch get COs by IDs
   */
  async getCOsByIds(coIds: number[]): Promise<ApiResponse<CourseOutcome[]>> {
    if (coIds.length === 0) return { status: 1, data: [] };
    try {
      const response = await axiosInstance.post<ApiResponse<any[]>>(`${CO_BASE}/list-by-ids`, { ids: coIds });
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Success",
        data: (response.data.data || []).map((item: any) => ({
          co_id: item.co_id || item.clo_id,
          co_code: item.co_code || item.clo_code || `CO${item.co_id}`,
          co_statement: item.co_statement
        }))
      };
    } catch (error: any) {
      console.error("Batch CO lookup failed:", error);
      return { status: 0, data: [] };
    }
  }

  /**
   * Batch get Blooms by IDs
   */
  async getBloomsByIds(bloomIds: number[]): Promise<ApiResponse<BloomLevel[]>> {
    if (bloomIds.length === 0) return { status: 1, data: [] };
    try {
      const response = await axiosInstance.post<ApiResponse<any[]>>(`${CO_BASE}/bloom-levels-by-ids`, { ids: bloomIds });
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Success",
        data: (response.data.data || []).map((item: any) => ({
          bloom_level_id: item.bloom_level_id || item.bloom_id,
          bloom_level: item.bloom_level || item.level || `L${item.bloom_id}`,
          description: item.description
        }))
      };
    } catch (error: any) {
      console.error("Batch Bloom lookup failed:", error);
      return { status: 0, data: [] };
    }
  }

  /**
   * Get Course Outcomes
   */
  async getCOs(courseId: number, batchId?: number, termId?: number): Promise<ApiResponse<CourseOutcome[]>> {
    try {
      let url = `${CO_BASE}/list?crs_id=${courseId}`;
      if (batchId) url += `&academic_batch_id=${batchId}`;
      if (termId) url += `&semester_id=${termId}`;

      console.log("🔍 Calling CO API:", url); // 🔍 DEBUG LOG

      const response = await axiosInstance.get<ApiResponse<any[]>>(url);

      console.log("🔍 CO API full response:", response.data); // 🔍 DEBUG LOG

      const cos: CourseOutcome[] = (response.data.data || []).map((item: Record<string, any>) => ({
        co_id: item.id || item.co_id,
        co_code: item.co_code || item.code || `CO${item.id}`,
        co_statement: item.co_statement || item.description || "N/A",
        // also expose clo_* keys for modules that expect them
        clo_id: item.id || item.co_id,
        clo_code: item.co_code || item.code || `CO${item.id}`
      }));
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Success",
        data: cos
      };
    } catch (error: any) {
      console.error("❌ CO API failed:", error.response?.data || error.response?.status || error.message); // 🔍 DETAILED ERROR LOG
      return {
        status: 0,
        message: `Failed to fetch course outcomes: ${error.response?.data?.message || error.message || "Unknown error"}`,
        data: []
      };
    }
  }

  /**
   * Get Assessment Occasions
   */
  async getAssessmentOccasions(filters?: {
    batchId?: number;
    termId?: number;
    courseCode?: string;
  }): Promise<ApiResponse<AssessmentOccasion[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.batchId) params.append("academic_batch_id", String(filters.batchId));
      if (filters?.termId) params.append("semester_id", String(filters.termId));
      if (filters?.courseCode) params.append("course_code", String(filters.courseCode));

      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await axiosInstance.get<any>(`${MTE_BASE}/assessment-occasions${query}`);
      const raw = response.data?.data?.data || response.data?.data || response.data || [];
      const occasions: AssessmentOccasion[] = (Array.isArray(raw) ? raw : []).map((item: Record<string, any>) => ({
        ao_id: item.ao_id,
        ao_name: item.ao_name || item.name,
        ao_description: item.ao_description || item.ao_name,
        qpd_id: item.qpd_id,
        qpf_id: item.qpf_id || item.qpd_id || null,
        qpd_title: item.ao_name, // Map ao_name to qpd_title for the table as requested
        created_date: item.created_date ? new Date(item.created_date).toISOString().split("T")[0] : "",
        created_by_name: item.created_by_name || "N/A"
      }));
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Success",
        data: occasions
      };
    } catch (error: any) {
      console.error("Error fetching occasions:", error);
      return { status: 0, message: "Failed to fetch occasions", data: [] };
    }
  }

  /**
   * Get MTE Framework ID by AO ID
   */
  async getMteFrameworkId(ao_id: number): Promise<ApiResponse<{ qpf_id: number; qpd_id: number }>> {
    try {
      const response = await axiosInstance.get<any>(`${MTE_BASE}/framework_id?ao_id=${ao_id}`);
      return {
        status: response.data?.status === true || response.data?.status === 1 ? 1 : 0,
        message: response.data?.message || "Success",
        data: { 
          qpf_id: response.data?.data?.qpf_id || 0,
          qpd_id: response.data?.data?.qpd_id || 0
        }
      };
    } catch (error: any) {
      console.error("Error fetching framework ID:", error);
      return { status: 0, message: "Failed to fetch framework ID", data: { qpf_id: 0, qpd_id: 0 } };
    }
  }

  /**
   * Get MTE Framework Details
   */
  async getMteFrameworkDetails(qpfId: number): Promise<ApiResponse<MteFramework>> {
    try {
      const response = await axiosInstance.get<any>(`${MTE_BASE}/framework/${qpfId}`);
      if (response.data && response.data.data) {
        const d = response.data.data;
        const framework: MteFramework = {
          qpf_id: d.qpf_id || qpfId,
          qpf_title: d.question_paper_title || d.qpf_title || "",
          total_duration: d.total_duration || "02:00",
          maximum_marks: d.maximum_marks || 100,
          grand_total: d.grand_total || 100,
          note: d.note || "",
          academic_batch_code: d.academic_batch_code || d.pgm_title || "",
          pgm_title: d.pgm_title || "",
          term_name: d.term_name || d.semester_name || "",
          crs_title: d.crs_title || d.crs_name || "",
          units: (d.units || []).map((u: any) => ({
            qpf_unit_id: u.qpf_unit_id,
            unit_name: u.unit_name,
            no_of_questions: u.no_of_questions,
            unit_max_marks: u.unit_max_marks
          }))
        };
        return { status: 1, message: "Success", data: framework };
      }
      throw new Error("No data returned");
    } catch (error: any) {
      console.error("Error fetching framework details:", error);
      return { status: 0, message: "Failed to fetch framework", data: null as any };
    }
  }

  /**
   * Get Questions for Framework
   */
  async getMteQuestions(qpfId: number): Promise<ApiResponse<MteQuestion[]>> {
    try {
      const resp = await axiosInstance.get<any>(`${MTE_BASE}/framework_questions/${qpfId}`);
      if (resp.data && resp.data.data) {
        const questions: MteQuestion[] = (resp.data.data || []).map((q: any) => ({
          qpf_mq_id: q.qpf_mq_id,
          question_text: q.question_text,
          course_outcome_id: q.course_outcome_id,
          bloom_level_id: q.bloom_level_id,
          co_code: q.co_code,
          bloom_code: q.bloom_code,
          marks: q.marks,
          unit_id: q.qpf_unit_id || q.unit_id,
          main_question_no: q.main_question_no ? Number(q.main_question_no) : null,
          sub_question_no: q.sub_question_no,
          is_mandatory: Number(q.is_mandatory ?? q.mandatory ?? q.isMandatory ?? q.is_mandatory_flag ?? 0) === 1 ? 1 : 0
        }));
        return { status: 1, message: "Success", data: questions };
      }
      return { status: 0, message: "Failed to fetch questions", data: [] };
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      return { status: 0, message: "Failed to fetch questions", data: [] };
    }
  }

  /**
   * Create MTE Framework
   */
  async createMteFramework(data: any): Promise<ApiResponse<{ qpf_id: number; ao_id?: number; qpd_id?: number }>> {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(`${MTE_BASE}/add-mte-framework`, data);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Framework created",
        data: response.data?.data || { qpf_id: 0 }
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to create framework", data: { qpf_id: 0 } };
    }
  }

  /**
   * Update MTE Framework
   */
  async updateMteFramework(qpfId: number, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.put<ApiResponse<any>>(`${MTE_BASE}/edit-mte-framework/${qpfId}`, data);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Framework updated",
        data: response.data?.data
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to update framework", data: null };
    }
  }

  /**
   * Add MTE Units
   */
  async addMteUnits(qpfId: number, units: any[]): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(`${MTE_BASE}/add-mte-framework-units/${qpfId}`, units);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Units added",
        data: response.data?.data
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to add units", data: null };
    }
  }

  /**
   * Update MTE Units
   */
  async updateMteUnits(qpfId: number, units: any[]): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.put<ApiResponse<any>>(`${MTE_BASE}/edit-mte-framework-units/${qpfId}`, units);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Units updated",
        data: response.data?.data
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to update units", data: null };
    }
  }

  /**
   * Delete MTE Unit
   */
  async deleteMteUnit(qpfId: number, unitId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.delete<ApiResponse<any>>(`${MTE_BASE}/framework-unit/${qpfId}/${unitId}`);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Unit deleted",
        data: response.data?.data || null
      };
    } catch (error: any) {
      console.error("Delete unit failed:", error);
      return { status: 0, message: error.response?.data?.message || "Failed to delete unit", data: null };
    }
  }

  /**
   * Add Question to Unit
   */
  async addQuestion(qpfId: number, unitId: number, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(`${MTE_BASE}/add-question/${qpfId}/${unitId}`, data);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Question added",
        data: response.data?.data || null
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to add question", data: null };
    }
  }

  /**
   * Edit MTE Question
   */
  async editMteQuestion(qpfId: number, unitId: number, data: any): Promise<ApiResponse<any>> {
    try {
      console.log(`[editMteQuestion] Request: mte/edit-question/${qpfId}/${unitId}`, data);
      const response = await axiosInstance.put<ApiResponse<any>>(`${MTE_BASE}/edit-question/${qpfId}/${unitId}`, data);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Question updated",
        data: response.data?.data || null
      };
    } catch (error: any) {
      console.error("Edit question failed:", error);
      return { status: 0, message: "Failed to update question", data: null };
    }
  }

  /**
   * Delete MTE Question  
   */
  async deleteMteQuestion(qpf_mq_id: number): Promise<ApiResponse<any>> {
    try {
      console.log(`[deleteMteQuestion] Request: mte/framework_questions/${qpf_mq_id}`);
      const response = await axiosInstance.delete<ApiResponse<any>>(`${MTE_BASE}/framework_questions/${qpf_mq_id}`);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Question deleted",
        data: response.data?.data || null
      };
    } catch (error: any) {
      console.error("Delete question failed:", error);
      return { status: 0, message: "Failed to delete question", data: null };
    }
  }

  // /**
  //  * Get Import Questions
  //  */
  // async getImportQuestions(filters: any): Promise<ApiResponse<any>> {
  //   try {
  //     const params: any = { ...filters };
  //     if (params.crs_id && !params.course_id) {
  //       params.course_id = params.crs_id;
  //     }
  //     const response = await axiosInstance.get<any>(`${MTE_BASE}/questions`, { params });
  //     return response.data;
  //   } catch (error: any) {
  //     return { status: 0, message: "Failed to fetch import questions", data: [] };
  //   }
  // }

  /**
 * Get Import Questions
 */
async getImportQuestions(filters: {
  mode: string;
  crs_id?: number;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<any>> {
  try {
    const params: any = { ...filters };

    if (params.crs_id && !params.course_id) {
      params.course_id = params.crs_id;
    }

    const response = await axiosInstance.get<any>(
      `${MTE_BASE}/questions`,
      { params }
    );

    return {
      status: normStatus(response.data?.status),
      message: response.data?.message || "Success",
      data: response.data?.data || []
    };
  } catch (error: any) {
    console.error("Error fetching import questions:", error);

    return {
      status: 0,
      message: "Failed to fetch import questions",
      data: []
    };
  }
}

  /**
   * Get OR Mappings
   */
  async getOrMappings(qpd_id: number): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.get<any>(`${MTE_BASE}/or-mappings/${qpd_id}`);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Success",
        data: response.data?.data || []
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to fetch OR mappings", data: [] };
    }
  }

  /**
   * Map OR Questions
   */
  async mapOrQuestions(data: { qpd_id: number; mappings: any[] }): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.post<any>(`${MTE_BASE}/or-mapping`, data);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "OR Mapping completed",
        data: response.data?.data || null
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to map OR questions", data: null };
    }
  }

  /**
   * Get QP Analysis
   */
  async getQpAnalysis(id: number, isFramework: boolean = true): Promise<ApiResponse<any>> {
    try {
      const params: any = {};
      if (isFramework) {
        params.qpf_id = id;
      } else {
        params.qpd_id = id;
      }
      const response = await axiosInstance.get<any>(`${MTE_BASE}/qp-analysis`, { params });
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Success",
        data: response.data?.data || null
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to fetch analysis", data: null };
    }
  }

  /**
   * Get Rubrics List
   */
  async getRubrics(academic_batch_id: number, term_id: number, crs_id: number): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.get<any>(`${MTE_BASE}/rubrics/list`, {
        params: { academic_batch_id, term_id, crs_id }
      });
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Success",
        data: response.data?.data || { rubrics: [], ao_method_id: 0 }
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to fetch rubrics", data: { rubrics: [], ao_method_id: 0 } };
    }
  }

  /**
   * Save Rubrics Criteria
   */
  async saveRubricsCriteria(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.post<any>(`${MTE_BASE}/rubrics/criteria`, data);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Rubrics saved",
        data: response.data?.data || null
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to save rubrics", data: null };
    }
  }

  /**
   * Update Rubric Criteria
   */
  async updateRubricCriteria(criteriaId: number, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.put<any>(`${MTE_BASE}/rubrics/criteria/${criteriaId}`, data);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Rubrics updated",
        data: response.data?.data || null
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to update rubrics", data: null };
    }
  }

  /**
   * Delete Rubric Criteria
   */
  async deleteRubricCriteria(criteriaId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.delete<any>(`${MTE_BASE}/rubrics/criteria/${criteriaId}`);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Rubrics deleted",
        data: response.data?.data || null
      };
    } catch (error: any) {
      return { status: 0, message: "Failed to delete rubrics", data: null };
    }
  }

  /**
   * Get Assessment Occasions for Rubrics
   */
  async getRubricAssessmentOccasions(): Promise<ApiResponse<any[]>> {
    try {
      const response = await axiosInstance.get<any>(`${MTE_BASE}/rubrics/assessment-occasions`);
      return response.data;
    } catch (error: any) {
      return { status: 0, message: "Failed to fetch assessment occasions", data: [] };
    }
  }

  /**
   * Import Rubrics from another course
   */
  async importRubrics(data: {
    academic_batch_id: number;
    term_id: number;
    crs_id: number;
    target_ao_method_id: number;
    import_clo: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.post<any>(`${MTE_BASE}/rubrics/import`, data);
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "Rubrics imported successfully",
        data: response.data?.data || null
      };
    } catch (error: any) {
      console.error("Import rubrics failed:", error);
      return { status: 0, message: error.response?.data?.message || "Failed to import rubrics", data: null };
    }
  }

  /**
   * Upload MTE Question Paper
   */
  async uploadMteQp(formData: FormData): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.post<any>(`${MTE_BASE}/upload-qp-file`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return {
        status: normStatus(response.data?.status),
        message: response.data?.message || "File uploaded successfully",
        data: response.data?.data || null
      };
    } catch (error: any) {
      console.error("Upload failed:", error);
      return { 
        status: 0, 
        message: error.response?.data?.message || "Failed to upload file", 
        data: null 
      };
    }
  }

}

export const manageMteService = new ManageMteService();
