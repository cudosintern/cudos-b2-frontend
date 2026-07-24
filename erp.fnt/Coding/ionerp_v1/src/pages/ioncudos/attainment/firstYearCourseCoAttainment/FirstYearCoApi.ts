// src/pages/ioncudos/attainment/firstYearCourseCoAttainment/FirstYearCoApi.ts

import axiosInstance from '../../../../utils/api';

export interface Curriculum {
    crclm_id: number;
    name: string;
    terms?: Term[];
}

export interface Term {
    term_id: number;
    name: string;
}

export interface Course {
    crs_id: number;
    crs_code: string;
    crs_name: string;
}

export interface Section {
    section_id: number;
    name: string;
}

export interface CceOccasion {
    ao_id: number;
    ao_description: string;
    max_marks: number;
}

export interface StudentDetailRow {
    siNo: number;
    usn: string;
    studentName: string;
    studentSchool: string;
    section: string;
    marks: { [occasionId: number]: number };
    attainmentPct: number;
    department: string;
    email: string;
}

export interface CourseAttainmentRow {
    clo_id: number;
    clo_code: string;
    clo_statement: string;
    cce_attainment: number | null;
    mte_attainment: number | null;
    see_attainment: number | null;
    direct_attainment: number | null;
    attainment_level: number | null;
}

export interface CceAttainmentGraphRow {
    co_code: string;
    co_statement: string;
    threshold_attainment: number;
    average_attainment: number;
}

// Helper to serialize arrays in query parameters: e.g. occasion_ids=1&occasion_ids=2
const buildQuery = (params: any): string => {
    const parts: string[] = [];
    Object.keys(params).forEach(key => {
        const val = params[key];
        if (Array.isArray(val)) {
            val.forEach(item => {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
            });
        } else if (val !== undefined && val !== null) {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
        }
    });
    return parts.join('&');
};

const BASE = '/first-year-course-attainment';

// ---- API IMPLEMENTATIONS ----

export const fetchPageContext = async () => {
    const res = await axiosInstance.get<any>(`${BASE}/page-context`);
    const data = res.data;
    // Map curriculums
    const curriculums = (data.curriculums || []).map((c: any) => ({
        crclm_id: c.academic_batch_id,
        name: c.academic_batch_code || c.academic_batch_desc || String(c.academic_batch_id),
        terms: (c.terms || []).map((t: any) => ({
            term_id: t.crclm_term_id,
            name: t.term_name
        }))
    }));
    return {
        ...data,
        curriculums
    };
};

export const fetchCoursesForTerm = async (crclmId: number, termId: number) => {
    const res = await axiosInstance.get<any>(`${BASE}/courses`, {
        params: { crclm_id: crclmId, term_id: termId }
    });
    const courses = (res.data.courses || []).map((c: any) => ({
        crs_id: c.crs_id,
        crs_code: c.crs_code,
        crs_name: c.crs_title
    }));
    return courses;
};

export const fetchCourseContext = async (crclmId: number, termId: number, courseId: number) => {
    const res = await axiosInstance.get<any>(`${BASE}/course-context`, {
        params: { crclm_id: crclmId, term_id: termId, course_id: courseId }
    });
    const sections = (res.data.sections || []).map((s: any) => ({
        section_id: s.section_id,
        name: s.section_name
    }));
    return {
        ...res.data,
        sections
    };
};

export const fetchSectionContext = async (crclmId: number, termId: number, courseId: number, sectionId: number) => {
    const res = await axiosInstance.get<any>(`${BASE}/section-context`, {
        params: { crclm_id: crclmId, term_id: termId, course_id: courseId, section_id: sectionId }
    });
    return res.data;
};

export const fetchDirectAttainment = async (params: {
    crclm_id: number;
    term_id: number;
    course_id: number;
    section_id: number;
    occasion_ids: number[];
    department_ids: string[];
    occasion_not_selected: number;
    tier: string;
}) => {
    const qStr = buildQuery(params);
    const res = await axiosInstance.get<any>(`${BASE}/direct?${qStr}`);
    return res.data;
};

export const fetchCourseAttainment = async (params: {
    crclm_id: number;
    term_id: number;
    course_id: number;
    type_values: string[];
    type_not_selected: number;
    department_ids: string[];
    tier: string;
}) => {
    const qStr = buildQuery(params);
    const res = await axiosInstance.get<any>(`${BASE}/course?${qStr}`);
    return res.data;
};

export const fetchCloQuestions = async (params: {
    clo_id: number;
    occasion_id?: number | null;
    section_id?: number | null;
    occasion_not_selected: number;
}) => {
    const res = await axiosInstance.get<any>(`${BASE}/clo-questions`, {
        params: {
            clo_id: params.clo_id,
            occasion_id: params.occasion_id || undefined,
            section_id: params.section_id || undefined,
            occasion_not_selected: params.occasion_not_selected
        }
    });
    return res.data;
};

export const exportAttainmentReport = async (body: {
    export_type: 'pdf' | 'docx' | 'doc';
    tab_name: 'direct_attainment' | 'course';
    crclm_id: number;
    term_id: number;
    course_id: number;
    section_id?: number | null;
    occasion_ids?: number[];
    department_ids?: string[];
    type_values?: string[];
    type_not_selected?: number;
    occasion_not_selected?: number;
    chart_image?: string | null;
    tier: string;
}) => {
    const res = await axiosInstance.post<Blob>(`${BASE}/export`, body, {
        responseType: 'blob'
    });
    return res.data;
};