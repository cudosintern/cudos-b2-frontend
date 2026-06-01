import axiosInstance from "../../../../utils/api";
import {
    CurriculumOption,
    TermOption,
    CourseOption,
    UnitOption,
    DeliveryMethodOption,
    Topic,
} from "./types";

export type { DeliveryMethodOption };

// ─── Shared Types (exported for use in components) ────────────────────────────

export interface TLORecord {
    id?: number;
    code: string;
    outcome: string;
    bloom: string;
    deliveryMethod: string;
    deliveryApproach: string;
}

export interface LessonScheduleRecord {
    id?: number;
    lectureNo: number;
    portion: string;
    plannedDate: string;
    actualDate: string;
}

export interface CourseOutcome {
    co_id: number;
    co_code: string;
    co_statement: string;
}

export interface TLOCOMapping {
    tlo_id: number;
    co_id: number;
    justification?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractList = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
};

// ─── Curriculum ───────────────────────────────────────────────────────────────

export const fetchCurriculums = async (): Promise<CurriculumOption[]> => {
    try {
        const res = await axiosInstance.get("co_po_mapping/get_academic_batch_dropdown");
        const data = res.data as any;
        if (data?.status && Array.isArray(data.data)) {
            return data.data.map((d: any) => ({
                value: d.value ?? d.academic_batch_id,
                label: d.label ?? d.academic_batch_desc,
            }));
        }
        return [];
    } catch {
        return [];
    }
};

// ─── Terms (Semesters) ────────────────────────────────────────────────────────

export const fetchTerms = async (_curriculumId: number): Promise<TermOption[]> => {
    try {
        const res = await axiosInstance.get("co_po_mapping/get_semester_dropdown");
        const data = res.data as any;
        if (data?.status && Array.isArray(data.data)) {
            return data.data; // already { value, label }
        }
        return [];
    } catch {
        return [];
    }
};

// ─── Courses ──────────────────────────────────────────────────────────────────

export const fetchCourses = async (curriculumId: number, _termId: number): Promise<CourseOption[]> => {
    if (!Number.isFinite(curriculumId) || curriculumId <= 0) return [];
    try {
        const res = await axiosInstance.get("co_po_mapping/get_course_dropdown", {
            params: { academic_batch_id: curriculumId },
        });
        const data = res.data as any;
        if (data?.status && Array.isArray(data.data)) {
            return data.data
                .filter((c: any) => Number(c.academic_batch_id) === Number(curriculumId))
                .map((c: any) => ({
                    value: c.crs_id,
                    label: c.course || c.crs_code,
                }));
        }
        return [];
    } catch {
        return [];
    }
};

// ─── Units ────────────────────────────────────────────────────────────────────

const FALLBACK_UNITS: UnitOption[] = [
    { value: 1, label: "Unit 1" },
    { value: 2, label: "Unit 2" },
    { value: 3, label: "Unit 3" },
    { value: 4, label: "Unit 4" },
    { value: 5, label: "Unit 5" },
];

export const fetchUnits = async (): Promise<UnitOption[]> => {
    try {
        const res = await axiosInstance.get("cudos/topic/meta/units");
        const list = extractList(res.data);
        if (list.length > 0) return list;
        return FALLBACK_UNITS;
    } catch {
        return FALLBACK_UNITS;
    }
};

// ─── Delivery Methods ─────────────────────────────────────────────────────────

const FALLBACK_DELIVERY_METHODS: DeliveryMethodOption[] = [
    { value: "Brain Stroming", label: "Brain Stroming" },
    { value: "Case Study", label: "Case Study" },
    { value: "Class Room Delivery", label: "Class Room Delivery" },
    { value: "Demonstration", label: "Demonstration" },
    { value: "Flipped Class Room Delivery", label: "Flipped Class Room Delivery" },
    { value: "Guest Lecturers", label: "Guest Lecturers" },
    { value: "Mock Delivery", label: "Mock Delivery" },
    { value: "Workshop or Seminar", label: "Workshop or Seminar" },
];

export const fetchDeliveryMethods = async (): Promise<DeliveryMethodOption[]> => {
    try {
        const res = await axiosInstance.get("cudos/topic/meta/delivery-methods");
        const list = extractList(res.data);
        if (list.length > 0) {
            return list.map((d: any) => ({
                value: d.delivery_mtd_name ?? d.value ?? d.name ?? d.label,
                label: d.delivery_mtd_name ?? d.label ?? d.name ?? d.value,
            }));
        }
        return FALLBACK_DELIVERY_METHODS;
    } catch {
        return FALLBACK_DELIVERY_METHODS;
    }
};

// ─── Topics ───────────────────────────────────────────────────────────────────

/**
 * Map backend CudosTopic fields → frontend Topic shape
 */
const normalizeTopic = (t: any): Topic => ({
    id: t.topic_id ?? t.id,
    unit: t.unit ?? "",
    unit_id: t.t_unit_id ?? t.unit_id ?? 0,
    sl_no: t.sl_no,
    topic_code: t.topic_code ?? "",
    title: t.topic_title ?? t.title ?? "",
    content: t.topic_content ?? t.content ?? "",
    hours: Number(t.topic_hrs) || Number(t.hours) || 0,
    deliveryMethods: t.deliveryMethods ?? t.delivery_methods ?? [],
    mappingStatus: t.mappingStatus ?? t.mapping_status ?? "pending",
    // Preserve context IDs for child operations
    academic_batch_id: t.academic_batch_id,
    semester_id: t.semester_id,
    crs_id: t.crs_id,
});

/**
 * Fetch topics for a given course (crs_id).
 */
export const fetchTopics = async (crsId: number): Promise<Topic[]> => {
    if (!crsId) return [];
    try {
        const res = await axiosInstance.get("cudos/topic", { params: { crs_id: crsId } });
        const list = extractList(res.data);
        return list.map(normalizeTopic).map((topic, index) => ({
            ...topic,
            sl_no: topic.sl_no ?? index + 1,
        }));
    } catch {
        return [];
    }
};

/**
 * Create a topic.
 * Backend requires: topic_title, academic_batch_id, semester_id, crs_id, t_unit_id, topic_content, topic_hrs
 */
export const createTopic = async (payload: {
    topic_title: string;
    academic_batch_id: number;
    semester_id: number;
    crs_id: number;
    t_unit_id: number;
    topic_content?: string;
    topic_hrs?: string;
    delivery_methods?: string[];
}): Promise<Topic> => {
    const res = await axiosInstance.post("cudos/topic/", payload);
    const resData = res.data as any;
    return normalizeTopic(resData?.data ?? resData);
};

/**
 * Update a topic (PATCH-style, all fields optional).
 */
export const updateTopic = async (topicId: number, data: {
    topic_title?: string;
    t_unit_id?: number;
    topic_content?: string;
    topic_hrs?: string;
    academic_batch_id?: number;
    semester_id?: number;
    crs_id?: number;
    delivery_methods?: string[];
}): Promise<Topic> => {
    const res = await axiosInstance.put(`cudos/topic/${topicId}`, data);
    const resData = res.data as any;
    return normalizeTopic(resData?.data ?? resData);
};

export const deleteTopic = async (topicId: number): Promise<boolean> => {
    await axiosInstance.delete(`cudos/topic/${topicId}`);
    return true;
};

// ─── TLOs (Topic Learning Outcome → CO Mappings) ─────────────────────────────

/**
 * Backend `cudos/topic-learning-outcome` stores TLO-CO mapping records.
 * We normalize them to the simpler TLORecord shape that TLOManager UI expects.
 */
const normalizeTLO = (t: any, idx: number): TLORecord & { id: number } => ({
    id: t.tlo_id ?? t.id ?? Date.now() + idx,
    code: t.code ?? t.tlo_code ?? `TLO${idx + 1}`,
    outcome: t.outcome ?? t.tlo_statement ?? t.statement ?? "",
    bloom: t.bloom ?? t.cognitive_domain ?? t.bloom_level ?? "",
    deliveryMethod: t.delivery_method ?? t.deliveryMethod ?? "",
    deliveryApproach: t.delivery_approach ?? t.deliveryApproach ?? "",
});

export const fetchTLOs = async (topicId: number): Promise<(TLORecord & { id: number })[]> => {
    if (!topicId) return [];
    try {
        const res = await axiosInstance.get("cudos/topic-learning-outcome", { params: { topic_id: topicId } });
        const list = extractList(res.data);
        return list.map(normalizeTLO);
    } catch {
        return [];
    }
};

export const createTLO = async (data: {
    topic_id: number;
    academic_batch_id: number;
    semester_id: number;
    crs_id: number;
    outcome: string;
    bloom: string;
    delivery_method: string;
    delivery_approach: string;
    code?: string;
}): Promise<TLORecord & { id: number }> => {
    const res = await axiosInstance.post("cudos/topic-learning-outcome/", data);
    const resData = res.data as any;
    return normalizeTLO(resData?.data ?? resData, 0);
};

export const updateTLO = async (id: number, data: {
    topic_id?: number;
    academic_batch_id?: number;
    semester_id?: number;
    crs_id?: number;
    outcome?: string;
    bloom?: string;
    delivery_method?: string;
    delivery_approach?: string;
    code?: string;
}): Promise<TLORecord & { id: number }> => {
    const res = await axiosInstance.put(`cudos/topic-learning-outcome/${id}`, data);
    const resData = res.data as any;
    return normalizeTLO(resData?.data ?? resData, 0);
};

export const deleteTLO = async (id: number): Promise<void> => {
    await axiosInstance.delete(`cudos/topic-learning-outcome/${id}`);
};

// ─── Lesson Schedule ──────────────────────────────────────────────────────────

/**
 * Normalize backend lesson schedule fields to frontend LessonScheduleRecord shape.
 * Backend fields: portion_ref, portion_per_hour, conduction_date, actual_delivery_date, lesson_schedule_id
 */
const normalizeLesson = (l: any): LessonScheduleRecord => ({
    id: l.lesson_schedule_id ?? l.id,
    // Map portion_ref (optional serial) → lectureNo; fall back to computed index
    lectureNo: Number(l.portion_ref) || l.lectureNo || 0,
    // portion_per_hour is the main content field
    portion: l.portion_per_hour ?? l.portion ?? "",
    plannedDate: l.conduction_date ?? l.planned_date ?? l.plannedDate ?? "",
    actualDate: l.actual_delivery_date ?? l.actual_date ?? l.actualDate ?? "",
});

export const fetchLessonSchedules = async (topicId: number): Promise<LessonScheduleRecord[]> => {
    if (!topicId) return [];
    try {
        const res = await axiosInstance.get("cudos/topic-lesson-schedule", { params: { topic_id: topicId } });
        const list = extractList(res.data);
        return list.map(normalizeLesson);
    } catch {
        return [];
    }
};

export const createLessonSchedule = async (data: {
    topic_id: number;
    portion_per_hour: string;
    academic_batch_id: number;
    semester_id: number;
    crs_id: number;
    portion_ref?: string;
    conduction_date?: string;
    actual_delivery_date?: string;
}): Promise<LessonScheduleRecord> => {
    const res = await axiosInstance.post("cudos/topic-lesson-schedule/", data);
    const resData = res.data as any;
    return normalizeLesson(resData?.data ?? resData);
};

export const updateLessonSchedule = async (id: number, data: {
    portion_per_hour?: string;
    academic_batch_id?: number;
    semester_id?: number;
    crs_id?: number;
    portion_ref?: string;
    conduction_date?: string;
    actual_delivery_date?: string;
}): Promise<LessonScheduleRecord> => {
    const res = await axiosInstance.put(`cudos/topic-lesson-schedule/${id}`, data);
    const resData = res.data as any;
    return normalizeLesson(resData?.data ?? resData);
};

export const deleteLessonSchedule = async (id: number): Promise<void> => {
    await axiosInstance.delete(`cudos/topic-lesson-schedule/${id}`);
};

// ─── Assignment Questions ─────────────────────────────────────────────────────

export interface QuestionRecord {
    id: number;
    type: string;
    question: string;
    tlos: string;
    bloom: string;
    piCodes: string;
}

export interface QuestionBankResult {
    id: number;
    question_id: number;
    question: string;
    question_text: string;
    type: string;
    topic_id?: number | null;
    topic_name?: string | null;
    course_name?: string | null;
    tlo_id?: number | null;
    tlo_code?: string | null;
    bloom_level?: string | null;
    pi_code?: string | null;
}

const normalizeQuestion = (q: any): QuestionRecord => ({
    id: q.question_id ?? q.id ?? Date.now(),
    type: q.type ?? "Review",
    question: q.question ?? q.question_text ?? q.review_question ?? q.assignment_question ?? "",
    tlos: q.tlo_code ?? q.tlos ?? "",
    bloom: q.bloom_level ?? q.bloom ?? "",
    piCodes: q.pi_code ?? q.pi_codes ?? q.piCodes ?? "",
});

export const fetchAssignmentQuestions = async (topicId: number): Promise<QuestionRecord[]> => {
    if (!topicId) return [];
    try {
        const res = await axiosInstance.get("cudos/assignment-question", { params: { topic_id: topicId } });
        const list = extractList(res.data);
        return list.map(normalizeQuestion);
    } catch {
        return [];
    }
};

export const createAssignmentQuestion = async (data: {
    topic_id: number;
    academic_batch_id: number;
    semester_id: number;
    crs_id: number;
    question: string;
    bloom_level: string;
    type: string;
    tlo_id?: number | null;
    pi_code?: string;
}): Promise<any> => {
    const res = await axiosInstance.post("cudos/assignment-question/", data);
    const resData = res.data as any;
    return resData?.data ?? resData;
};

export const deleteAssignmentQuestion = async (id: number): Promise<void> => {
    await axiosInstance.delete(`cudos/assignment-question/${id}`);
};

export const searchQuestionBankQuestions = async (params: {
    course_name: string;
    type?: string;
}): Promise<QuestionBankResult[]> => {
    const searchValue = params.course_name.trim();
    if (searchValue.length < 2) return [];

    try {
        const res = await axiosInstance.get("cudos/assignment-question", {
            params: {
                course_name: searchValue,
                type: params.type,
            },
        });
        return extractList(res.data);
    } catch {
        return [];
    }
};

export const importAssignmentQuestions = async (payload: {
    question_ids: number[];
    target_topic_id: number;
    target_academic_batch_id: number;
    target_semester_id: number;
    target_crs_id: number;
    target_tlo_id?: number | null;
}): Promise<any> => {
    const res = await axiosInstance.post("cudos/assignment-question/import", payload);
    return (res.data as any)?.data ?? res.data;
};

// ─── Course Outcomes ──────────────────────────────────────────────────────────

export const fetchCourseOutcomes = async (courseId: number): Promise<CourseOutcome[]> => {
    if (!courseId) return [];
    try {
        const res = await axiosInstance.post("co_po_mapping/get_co_po", { crs_id: courseId });
        const data = res.data as any;
        if (data?.status && data.data?.cos && Array.isArray(data.data.cos)) {
            return data.data.cos.map((c: any) => ({
                co_id: c.clo_id,
                co_code: c.clo_code,
                co_statement: c.clo_statement ?? "",
            }));
        }
        return [];
    } catch {
        return [];
    }
};

// ─── TLO → CO Mapping ─────────────────────────────────────────────────────────

export interface TLOCoMappingRecord {
    tlo_map_id?: number;
    tlo_id: number;
    clo_id: number;
    justification?: string;
}

export const fetchTLOCoMappings = async (params: {
    topic_id: number;
    academic_batch_id?: number;
    semester_id?: number;
    crs_id?: number;
}): Promise<TLOCoMappingRecord[]> => {
    const res = await axiosInstance.get("cudos/topic-learning-outcome/mappings", { params });
    return extractList(res.data);
};

export const saveTLOCoMapping = async (payload: {
    academic_batch_id: number;
    semester_id: number;
    crs_id: number;
    topic_id: number;
    mappings: (TLOCOMapping & { tlo_map_id?: number })[];
}): Promise<any> => {
    const res = await axiosInstance.post("cudos/topic-learning-outcome/save", {
        academic_batch_id: payload.academic_batch_id,
        semester_id: payload.semester_id,
        crs_id: payload.crs_id,
        topic_id: payload.topic_id,
        items: payload.mappings.map((mapping) => ({
            tlo_map_id: (mapping as any).tlo_map_id,
            tlo_id: mapping.tlo_id,
            clo_id: mapping.co_id,
            justification: mapping.justification,
        })),
    });
    return (res.data as any);
};

// ─── Submit to Publish ────────────────────────────────────────────────────────

export const submitToPublish = async (payload: {
    course_id: number;
    academic_batch_id?: number;
    semester_id?: number;
}): Promise<void> => {
    await axiosInstance.post("cudos/topic-learning-outcome/submit-to-publish", {
        crs_id: payload.course_id,
        academic_batch_id: payload.academic_batch_id,
        semester_id: payload.semester_id,
        topic_id: null,
    });
};
