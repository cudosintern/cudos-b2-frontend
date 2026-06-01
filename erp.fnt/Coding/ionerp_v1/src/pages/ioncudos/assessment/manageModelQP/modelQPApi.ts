import axiosInstance from "../../../../utils/api";
import { 
    ModelQPApi, 
    DropdownOption, 
    ModelQPStatus,
    CourseQPRowUI
} from "./types";
import { normalizeCourseRow } from "./utils/qpMappers";

type ApiResponse<T> = {
    success: boolean;
    status: boolean;
    message: string;
    data: T;
};

// Helper: Standardized data extraction from backend response
const extractData = (res: any, fallback: any = []) => {
    const data = res.data;
    if (data?.success && data.data) {
        return data.data;
    }
    return fallback;
};



// ==================== API FUNCTIONS ====================

export const fetchQPList = async ({
    schoolId,
    programId,
    curriculumId,
    semesterId,
}: {
    schoolId: number;
    programId: number;
    curriculumId: number;
    semesterId: number;
}): Promise<CourseQPRowUI[]> => {
    try {
        const res = await axiosInstance.get<ApiResponse<any>>(
            `/tee/model-qp/list?school_id=${schoolId}&program_id=${programId}&academic_batch_id=${curriculumId}&semester_id=${semesterId}`
        );
        console.log("QP LIST RAW RESPONSE:", res.data);
        
        const list = Array.isArray(res.data?.data)
            ? res.data.data
            : res.data?.data?.items || [];
        
        console.log("FINAL EXTRACTED LIST:", list);
        const normalized = list.map((row: any) => normalizeCourseRow(row));
        console.log("QP LIST NORMALIZED:", normalized);
        return normalized;
    } catch (error) {
        console.error("fetchQPList error:", error);
        return [];
    }
};

/**
 * Represents a course row in the list, with an optional linked QP
 */
export const fetchCourseQPList = async (schoolId: number, programId: number, curriculumId: number, termId: number): Promise<CourseQPRowUI[]> => {
    try {
        const res = await axiosInstance.get("tee/model-qp/list", {
            params: {
                school_id: schoolId,
                program_id: programId,
                academic_batch_id: curriculumId,
                semester_id: termId
            }
        });
        const data = extractData(res, { items: [] });
        const items = data.items || [];
        return items.map(normalizeCourseRow);
    } catch (error) {
        console.error("fetchCourseQPList error:", error);
        return [];
    }
};

export const fetchQPDetails = async (qpId: number): Promise<ModelQPApi | null> => {
    try {
        const res = await axiosInstance.get<any>(`tee/model-qp/${qpId}`);
        const outer = (res.data as any)?.data ?? res.data;
        // Backend returns { qp_definition: {...}, sections: [...] }
        const def = outer?.qp_definition ?? outer;
        const sections = outer?.sections ?? outer?.units ?? [];
        if (!def) return null;
        return {
            id: def.qpd_id ?? def.id,
            qpd_id: def.qpd_id ?? def.id,
            crs_id: def.course_id ?? def.crs_id,
            title: def.title ?? def.qpd_title ?? "",
            total_duration: def.total_duration ?? def.qpd_timing ?? "03:00",
            max_marks: def.max_marks ?? def.qpd_max_marks ?? 0,
            grand_total: def.grand_total ?? def.qpd_gt_marks ?? 0,
            note: def.note ?? def.qpd_notes ?? "",
            status: def.status ?? "PENDING",
            curriculum_id: def.curriculum_id ?? def.academic_batch_id,
            semester_id: def.semester_id,
            // Normalize sections into the units shape expected by normalizeSections
            units: sections.map((s: any) => ({
                qp_unitd_id: s.id ?? s.qpd_unitd_id,
                unit_name: s.section_name ?? s.unit_name ?? s.qp_unit_code ?? "",
                module_name: s.section_name ?? s.unit_name ?? "",
                no_of_questions: s.no_of_questions ?? s.qp_total_unitquestion ?? 1,
                max_marks: s.max_marks ?? s.qp_utotal_marks ?? 0,
                questions: (s.questions || []).map((q: any) => ({
                    type: "EITHER_OR",
                    questions: Array.isArray(q.questions) ? q.questions.map((sq: any) => ({
                        question_text: sq.question_text ?? sq.qp_content ?? "",
                        co_id: sq.co_ids?.[0] ?? sq.co_id ?? null,
                        bloom_level: sq.bloom_level ?? "",
                        pi_code: sq.pi_code ?? "",
                        marks: sq.marks ?? 0,
                    })) : [
                        { question_text: q.question_text ?? q.qp_content ?? "", co_id: q.co_ids?.[0] ?? q.co_id ?? null, bloom_level: q.bloom_level ?? "", pi_code: q.pi_code ?? "", marks: q.marks ?? 0 },
                        { question_text: "", co_id: null, bloom_level: "", pi_code: "", marks: q.marks ?? 0 },
                    ]
                }))
            })),
        } as ModelQPApi;
    } catch (error) {
        console.error("fetchQPDetails error:", error);
        return null;
    }
};


export const fetchFramework = async (courseId: number): Promise<ModelQPApi> => {
    try {
        const res = await axiosInstance.get("tee/model-qp/frameworks");
        return extractData(res);
    } catch (error) {
        console.error("fetchFramework error:", error);
        return { units: [] } as any;
    }
};

export const saveDraftQP = async (data: any): Promise<any> => {
    try {
        const qpId = data.qp_definition_id || data.id;
        // Build backend-compatible payload
        const payload = {
            course_id: data.course_id,
            curriculum_id: data.curriculum_id,
            semester_id: data.semester_id,
            title: data.title,
            total_duration: data.total_duration,
            max_marks: data.max_marks,
            grand_total: data.grand_total,
            note: data.note ?? "",
            // Frontend builds `units`, backend expects `sections` with `section_name`
            sections: (data.units || data.sections || []).map((u: any) => ({
                section_name: u.unit_name ?? u.section_name ?? u.name ?? "",
                no_of_questions: u.no_of_questions ?? 1,
                max_marks: u.max_marks ?? 0,
                sort_order: u.sort_order,
            })),
        };
        if (qpId) {
            // Update: backend PUT /{id}/framework updates framework units
            const res = await axiosInstance.put(`tee/model-qp/${qpId}/framework`, payload);
            return extractData(res, null);
        } else {
            const res = await axiosInstance.post("tee/model-qp/create-framework", payload);
            return extractData(res, null);
        }
    } catch (error) {
        console.error("saveDraftQP error:", error);
        return null;
    }
};


export const submitQP = async (data: any): Promise<any> => {
    try {
        // Logic similar to save but potentially with a final status update if separate
        return await saveDraftQP(data);
    } catch (error) {
        console.error("submitQP error:", error);
        return null;
    }
};

export const deleteQP = async (id: number): Promise<boolean> => {
    try {
        const res = await axiosInstance.delete(`tee/model-qp/${id}`);
        return res.status === 200;
    } catch (error) {
        console.error("deleteQP error:", error);
        return false;
    }
};

export const importQP = async ({
    sourceQpId,
    targetCourseId,
    targetCurriculumId,
    targetSemesterId,
}: {
    sourceQpId: number;
    targetCourseId: number;
    targetCurriculumId: number;
    targetSemesterId: number;
}): Promise<ModelQPApi | null> => {
    try {
        const res = await axiosInstance.post("tee/model-qp/import", {
            source_qp_definition_id: sourceQpId,
            target_course_id: targetCourseId,
            target_curriculum_id: targetCurriculumId,
            target_semester_id: targetSemesterId,
        });
        return extractData(res, null);
    } catch (error) {
        console.error("importQP error:", error);
        return null;
    }
};

export const fetchCOs = async (courseId: number): Promise<DropdownOption[]> => {
    try {
        const res = await axiosInstance.get(`course-outcome/list?crs_id=${courseId}`);
        const data = extractData(res);
        return data.map((item: any) => ({
            value: item.id || item.co_id,
            label: item.co_code || item.code || `CO${item.id}`
        }));
    } catch (error) {
        console.error("fetchCOs error:", error);
        return [];
    }
};

export const fetchBloomLevels = async (): Promise<DropdownOption[]> => {
    try {
        const res = await axiosInstance.get("course-outcome/bloom-levels");
        const data = extractData(res);
        return data.map((item: any) => ({
            value: item.bloom_level_name || item.level || item.name,
            label: item.bloom_level_name || item.level || item.name
        }));
    } catch (error) {
        console.error("fetchBloomLevels error:", error);
        return [];
    }
};

export const fetchPIByCO = async (coId: number): Promise<DropdownOption[]> => {
    try {
        const res = await axiosInstance.get(`course-outcome/pi-list?co_id=${coId}`);
        const data = extractData(res);
        return data.map((item: any) => ({
            value: item.pi_id || item.id,
            label: item.pi_code || item.code
        }));
    } catch (error) {
        return [];
    }
};

export const fetchQPContext = async (_courseId: number, _curriculumId: number, _termId: number): Promise<null> => {
    // Endpoint does not exist on the backend — return null so CREATE mode starts with empty sections
    return null;
};


// ==================== SHARED DROPDOWN FETCHERS ====================

export const fetchSchools = async (): Promise<any[]> => {
    try {
        const res = await axiosInstance.get<any>("assessments/manage_cia_occasion/schools");
        return res.data?.data || [];
    } catch (error) {
        console.error("fetchSchools error:", error);
        return [];
    }
};


export const fetchDepartments = async (): Promise<any[]> => {
    try {
        const res = await axiosInstance.get<any>("assessments/manage_cia_occasion/departments");
        return res.data?.data || res.data?.departments || res.data || [];
    } catch (error) {
        console.error("fetchDepartments error:", error);
        return [];
    }
};

export const fetchPrograms = async (deptId: number): Promise<any[]> => {
    try {
        const res = await axiosInstance.get<any>(`assessments/manage_cia_occasion/programs?dept_id=${deptId}`);
        return res.data?.data || [];
    } catch (error) {
        console.error("fetchPrograms error:", error);
        return [];
    }
};

export const fetchCurriculums = async (progId: number): Promise<any[]> => {
    try {
        const res = await axiosInstance.get<any>("tee/model-qp/filters/curriculums", {
            params: { program_id: progId }
        });
        return res.data?.data || res.data?.curriculums || res.data || [];
    } catch (error) {
        console.error("fetchCurriculums error:", error);
        return [];
    }
};

export const fetchTerms = async (curriculumId: number): Promise<any[]> => {
    try {
        const res = await axiosInstance.get<any>("tee/model-qp/filters/terms", {
            params: { academic_batch_id: curriculumId }
        });
        return res.data?.data || res.data?.terms || res.data || [];
    } catch (error) {
        console.error("fetchTerms error:", error);
        return [];
    }
};

export const fetchCourses = async (
    curriculumId: number,
    termId: number,
    schoolId?: number,
    programId?: number,
): Promise<DropdownOption[]> => {
    try {
        if (schoolId && programId) {
            const res = await axiosInstance.get("tee/model-qp/list", {
                params: {
                    school_id: schoolId,
                    program_id: programId,
                    academic_batch_id: curriculumId,
                    semester_id: termId,
                }
            });
            const data = extractData(res, { items: [] });
            const uniqueCourses = new Map<number, DropdownOption>();
            for (const course of data.items || []) {
                if (!course.crs_id) continue;
                uniqueCourses.set(course.crs_id, {
                    value: course.crs_id,
                    label: `${course.course_title} (${course.course_code})`,
                });
            }
            return Array.from(uniqueCourses.values());
        }

        const res = await axiosInstance.get("co_po_mapping/get_course_dropdown", {
            params: { academic_batch_id: curriculumId },
        });
        const data = res.data as any;
        if (data?.status && Array.isArray(data.data)) {
            return data.data
                .filter((course: any) => Number(course.academic_batch_id) === Number(curriculumId))
                .filter((course: any) => !termId || Number(course.semester_id ?? termId) === Number(termId))
                .map((course: any) => ({
                    value: course.crs_id,
                    label: course.course || course.course_title || course.crs_code,
                }));
        }
        return [];
    } catch (error) {
        console.error("fetchCourses error:", error);
        return [];
    }
};
