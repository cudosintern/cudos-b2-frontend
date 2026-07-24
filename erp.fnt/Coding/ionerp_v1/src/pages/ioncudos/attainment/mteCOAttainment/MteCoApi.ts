import axiosInstance from '../../../../utils/api';
import { z } from 'zod';

// ================= TYPES =================
export interface Curriculum {
    crclm_id: number;
    name: string;
    pgm_title: string | null;
}

export interface Term {
    term_id: number;
    name: string;
}

export interface Course {
    crs_id: number;
    crs_code: string;
    crs_name: string;
    total_mte_weightage: number;
}

export interface MteOccasion {
    ao_id: number;
    ao_description: string;
}

export interface AttainmentLevel {
    sl_no?: number;
    level_name: string;
    level_value: number;
    direct_percentage: number;
    operator: string;
    target_percentage: number;
    target_text: string;
}

export interface CORow {
    clo_id: number;
    clo_code: string;
    clo_statement: string;
    threshold_direct_attainment: number;
    threshold_direct_attainment_display: string;
    average_direct_attainment: number;
    average_direct_attainment_display: string;
    attainment_level: number;
    weighted_threshold_attainment: number;
}

export interface FinalizedRow {
    clo_id: number;
    clo_code: string;
    threshold_based_attainment: number;
    attainment_level: number;
    average_based_attainment: number;
    weighted_threshold_attainment: number;
}

export interface CalculateRequest {
    curriculum_id: number;
    term_id: number;
    course_id: number;
    section_id?: number | null;
    selected_occasion_ids: number[];
}

export interface ValidationFailures {
    missing_marks: string[];
    missing_qp: string[];
    not_rolled_out: string[];
    missing_mapping: string[];
    missing_attainment: string[];
}

export interface CalculateResponse {
    readiness_status: any[];
    co_rows: CORow[];
    course_levels: AttainmentLevel[];
    graph_data: {
        x: string[];
        y: number[];
        tooltips: string[];
    };
    can_finalize: boolean;
    actual_course_attainment: number;
    course_attainment_after_weightage: number;
    validation_failures?: ValidationFailures | null;
}

export interface QuestionMapping {
    qp_mq_code: string;
    qp_subq_code: string;
    qp_subq_marks: number;
    mapped_marks: number;
    mapped_percentage: number;
    clo_code: string;
    ao_name?: string;
    qp_content?: string;
    clo_statement?: string;
    // Keep old fields for backward compatibility
    question_sequence?: string;
    sub_question?: string;
    marks?: number;
}

export interface DrilldownRow {
    occasion_name: string;
    attainment_percentage: number;
    attainment_level: number;
}

// ================= ZOD SCHEMAS =================

const CurriculumSchema = z.object({
    academic_batch_id: z.number(),
    academic_batch: z.string(),
    pgm_title: z.string().nullable().optional(),
}).transform((val) => ({
    crclm_id: val.academic_batch_id,
    name: val.academic_batch,
    pgm_title: val.pgm_title ?? null,
}));

const getTermDisplayLabel = (name: string): string => {
    const match = name.match(/\d+/);
    if (match) {
        return `Semester - ${match[0]}`;
    }
    if (/term/i.test(name)) {
        return name.replace(/term/i, 'Semester -');
    }
    return name;
};

const TermSchema = z.object({
    semester_id: z.number(),
    semester: z.string(),
}).transform((val) => ({
    term_id: val.semester_id,
    name: getTermDisplayLabel(val.semester),
}));

const CourseSchema = z.object({
    course_id: z.number(),
    course_code: z.string(),
    course_name: z.string().nullable().optional().transform((v) => v ?? ''),
    total_mte_weightage: z.number().nullable().optional().transform((v) => v ?? 0),
}).transform((val) => ({
    crs_id: val.course_id,
    crs_code: val.course_code,
    crs_name: val.course_name,
    total_mte_weightage: val.total_mte_weightage,
}));

const OccasionSchema = z.object({
    ao_id: z.number(),
    description: z.string(),
    qpd_id: z.number().nullable(),
    is_rollout: z.boolean(),
}).transform((val) => ({
    ao_id: val.ao_id,
    ao_description: val.description,
}));

const AttainmentLevelSchema = z.object({
    level_name: z.string(),
    level_value: z.number(),
    direct_percentage: z.number().nullable().optional().transform((v) => v ?? 0),
    operator: z.string().nullable().optional().transform((v) => v ?? '>='),
    target_percentage: z.number().nullable().optional().transform((v) => v ?? 0),
}).transform((val) => {
    const op = ['>=', '>', '<=', '<', '='].includes(val.operator) ? val.operator : '>=';
    return {
        level_name: val.level_name,
        level_value: val.level_value,
        direct_percentage: val.direct_percentage,
        operator: op,
        target_percentage: val.target_percentage,
        target_text: `${val.direct_percentage}% students scoring ${op} ${val.target_percentage}% marks out of relevant maximum marks.`,
    };
});

const ReadinessItemSchema = z.object({
    check_name: z.string(),
    passed: z.boolean(),
    error_message: z.string().nullable().optional(),
    action_message: z.string().nullable().optional(),
    occasion_id: z.number().nullable().optional(),
}).transform((val) => ({
    check_name: val.check_name,
    is_ready: val.passed,
    error_message: val.error_message ?? null,
    action_message: val.action_message ?? null,
    occasion_id: val.occasion_id ?? 0,
}));

const CORowSchema = z.object({
    clo_id: z.number(),
    clo_code: z.string(),
    clo_statement: z.string(),
    threshold_direct_attainment: z.number().nullable().optional().transform((v) => v ?? 0),
    threshold_direct_attainment_display: z.string().nullable().optional().transform((v) => v ?? '0.00%'),
    average_direct_attainment: z.number().nullable().optional().transform((v) => v ?? 0),
    average_direct_attainment_display: z.string().nullable().optional().transform((v) => v ?? '0.00%'),
    attainment_level: z.number().nullable().optional().transform((v) => v ?? 0),
    weighted_threshold_attainment: z.number().nullable().optional().transform((v) => v ?? 0),
});

const GraphDataSchema = z.object({
    x: z.array(z.string()),
    y: z.array(z.number()),
    tooltips: z.array(z.string()),
});

const ValidationFailuresSchema = z.object({
    missing_marks: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
    missing_qp: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
    not_rolled_out: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
    missing_mapping: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
    missing_attainment: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
});

const CalculateResponseSchema = z.object({
    readiness_status: z.array(ReadinessItemSchema),
    co_rows: z.array(CORowSchema),
    course_levels: z.array(AttainmentLevelSchema),
    can_finalize: z.boolean(),
    graph_data: GraphDataSchema.nullable().optional().transform((g) => g ?? { x: [], y: [], tooltips: [] }),
    actual_course_attainment: z.number().nullable().optional().transform((v) => v ?? 0),
    course_attainment_after_weightage: z.number().nullable().optional().transform((v) => v ?? 0),
    validation_failures: ValidationFailuresSchema.nullable().optional(),
});

const FinalizedRowSchema = z.object({
    clo_id: z.number(),
    clo_code: z.string(),
    threshold_based_attainment: z.number(),
    attainment_level: z.number(),
    average_based_attainment: z.number(),
    weighted_threshold_attainment: z.number(),
});

const QuestionMappingSchema = z.object({
    qp_mq_code: z.string(),
    qp_subq_code: z.string().nullable().optional().transform((v) => v ?? ""),
    qp_subq_marks: z.number(),
    mapped_marks: z.number(),
    mapped_percentage: z.number(),
    clo_code: z.string(),
    ao_name: z.string().nullable().optional(),
    qp_content: z.string().nullable().optional(),
    clo_statement: z.string().nullable().optional(),
}).transform((val) => ({
    qp_mq_code: val.qp_mq_code,
    qp_subq_code: val.qp_subq_code,
    qp_subq_marks: val.qp_subq_marks,
    mapped_marks: val.mapped_marks,
    mapped_percentage: val.mapped_percentage,
    clo_code: val.clo_code,
    ao_name: val.ao_name ?? undefined,
    qp_content: val.qp_content ?? undefined,
    clo_statement: val.clo_statement ?? undefined,
    question_sequence: val.qp_mq_code,
    sub_question: val.qp_subq_code,
    marks: val.qp_subq_marks,
}));

const DrilldownRowSchema = z.object({
    ao_name: z.string(),
    mte_weightage: z.number().nullable().optional(),
    clo_code: z.string(),
    clo_statement: z.string(),
    attainment_percentage: z.number(),
    attainment_level: z.number(),
}).transform((val) => ({
    occasion_name: val.ao_name,
    attainment_percentage: val.attainment_percentage,
    attainment_level: val.attainment_level,
}));

// ================= API FUNCTIONS =================

export const getCurricula = async (): Promise<Curriculum[]> => {
    const res = await axiosInstance.get('/mte-co-attainment/curricula');
    return z.array(CurriculumSchema).parse(res.data);
};

export const getTerms = async (curriculumId: number): Promise<Term[]> => {
    const res = await axiosInstance.get('/mte-co-attainment/terms', {
        params: { curriculum_id: curriculumId },
    });
    return z.array(TermSchema).parse(res.data);
};

export const getCourses = async (termId: number): Promise<Course[]> => {
    const res = await axiosInstance.get('/mte-co-attainment/courses', {
        params: { term_id: termId },
    });
    return z.array(CourseSchema).parse(res.data);
};

export const getOccasions = async (
    curriculumId: number,
    termId: number,
    courseId: number,
    sectionId?: number | null
): Promise<MteOccasion[]> => {
    const res = await axiosInstance.get('/mte-co-attainment/occasions', {
        params: {
            curriculum_id: curriculumId,
            term_id: termId,
            course_id: courseId,
            section_id: sectionId ?? undefined,
        },
    });
    return z.array(OccasionSchema).parse(res.data);
};

export const getCourseLevels = async (courseId: number): Promise<AttainmentLevel[]> => {
    const res = await axiosInstance.get('/mte-co-attainment/course-levels', {
        params: { course_id: courseId },
    });
    return z.array(AttainmentLevelSchema).parse(res.data);
};

export const calculateCOAttainment = async (data: CalculateRequest): Promise<CalculateResponse> => {
    const res = await axiosInstance.post('/mte-co-attainment/calculate', {
        curriculum_id: data.curriculum_id,
        term_id: data.term_id,
        course_id: data.course_id,
        section_id: data.section_id ?? null,
        selected_occasion_ids: data.selected_occasion_ids,
    });
    return CalculateResponseSchema.parse(res.data);
};

export const finalizeMTE = async (data: CalculateRequest): Promise<{ message: string }> => {
    const res = await axiosInstance.post('/mte-co-attainment/finalize', {
        curriculum_id: data.curriculum_id,
        term_id: data.term_id,
        course_id: data.course_id,
        section_id: data.section_id ?? null,
        selected_occasion_ids: data.selected_occasion_ids,
    });
    const parsed = z.object({ success: z.boolean(), message: z.string() }).parse(res.data);
    return { message: parsed.message };
};

export const getFinalizedData = async (
    curriculumId: number,
    termId: number,
    courseId: number,
    sectionId?: number | null
): Promise<FinalizedRow[]> => {
    const res = await axiosInstance.get('/mte-co-attainment/finalized', {
        params: {
            curriculum_id: curriculumId,
            term_id: termId,
            course_id: courseId,
            section_id: sectionId ?? undefined,
        },
    });
    return z.array(FinalizedRowSchema).parse(res.data);
};

export const getMappedQuestions = async (
    cloId: number,
    courseId: number,
    occasionIds: number[],
    sectionId?: number | null
): Promise<QuestionMapping[]> => {
    const res = await axiosInstance.get(`/mte-co-attainment/co/${cloId}/questions`, {
        params: {
            course_id: courseId,
            selected_occasion_ids: occasionIds.join(','),
            section_id: sectionId ?? undefined,
        },
    });
    return z.array(QuestionMappingSchema).parse(res.data);
};

export const getDrilldown = async (
    cloId: number,
    courseId: number,
    occasionIds: number[],
    sectionId?: number | null
): Promise<DrilldownRow[]> => {
    const res = await axiosInstance.get(`/mte-co-attainment/co/${cloId}/drilldown`, {
        params: {
            course_id: courseId,
            selected_occasion_ids: occasionIds.join(','),
            section_id: sectionId ?? undefined,
        },
    });
    return z.array(DrilldownRowSchema).parse(res.data);
};

export const exportReport = async (
    curriculumId: number,
    termId: number,
    courseId: number,
    occasionIds: number[],
    calculatedData: CalculateResponse | null,
    finalizedData: FinalizedRow[],
    courseLevels: AttainmentLevel[],
    sectionId?: number | null
): Promise<Blob> => {
    const res = await axiosInstance.get('/mte-co-attainment/export', {
        params: {
            curriculum_id: curriculumId,
            term_id: termId,
            course_id: courseId,
            selected_occasion_ids: occasionIds.join(','),
            section_id: sectionId ?? undefined,
        },
        responseType: 'blob',
    });
    return res.data as Blob;
};

export interface Section {
    section_id: number;
    section_name: string;
}

const SectionSchema = z.object({
    section_id: z.number(),
    section_name: z.string(),
});

export const getSections = async (semesterId: number, courseId: number): Promise<Section[]> => {
    const res = await axiosInstance.get('/assessments/manage_cia_occasion/sections', {
        params: { semester_id: semesterId, course_id: courseId },
    });
    const data = (res.data as any)?.data || res.data || [];
    return z.array(SectionSchema).parse(data);
};

export interface MTEExportRequest {
    curriculum_id: number;
    term_id: number;
    course_id: number;
    selected_occasion_ids: number[];
    section_id?: number | null;
    format: string;
    chart_image?: string | null;
}

export const exportReportNew = async (data: MTEExportRequest): Promise<Blob> => {
    const res = await axiosInstance.post('/mte-co-attainment/export', data, {
        responseType: 'blob',
    });
    return res.data as Blob;
};
