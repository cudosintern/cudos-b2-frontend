// services/mteAttainmentApi.ts
import {
    Curriculum,
    Term,
    Course,
    Occasion,
    AttainmentLevel,
    CalculatePayload,
    CalculateResponse,
    MappedQuestion,
    DrilldownResponse,
    FinalizePayload,
    FinalizedRow,
    ExportParams,
    CORow,
    GraphData,
    ReadinessStatus,
} from '../types/mteAttainment.types';

// ---------- Mock Data ----------
const mockCurricula: Curriculum[] = [
    { curriculum_id: 1, curriculum_name: 'Computer Science (2024)' },
    { curriculum_id: 2, curriculum_name: 'Electronics (2024)' },
];

const mockTerms: Record<number, Term[]> = {
    1: [
        { term_id: 101, term_name: 'Semester 1' },
        { term_id: 102, term_name: 'Semester 2' },
    ],
    2: [
        { term_id: 201, term_name: 'Semester 1' },
        { term_id: 202, term_name: 'Semester 2' },
    ],
};

const mockCourses: Record<number, Course[]> = {
    101: [
        { course_id: 301, course_code: 'CS101', course_name: 'Data Structures', total_mte_weightage: 20 },
        { course_id: 302, course_code: 'CS102', course_name: 'Algorithms', total_mte_weightage: 25 },
    ],
    102: [
        { course_id: 303, course_code: 'CS201', course_name: 'Operating Systems', total_mte_weightage: 20 },
    ],
    201: [
        { course_id: 401, course_code: 'EC101', course_name: 'Circuits', total_mte_weightage: 15 },
    ],
    202: [
        { course_id: 402, course_code: 'EC102', course_name: 'Signals', total_mte_weightage: 15 },
    ],
};

const mockOccasions: Record<number, Occasion[]> = {
    301: [
        { ao_id: 501, ao_description: 'MTE 1', is_ready: true },
        { ao_id: 502, ao_description: 'MTE 2', is_ready: false },
    ],
    302: [
        { ao_id: 503, ao_description: 'MTE 1', is_ready: true },
        { ao_id: 504, ao_description: 'MTE 2', is_ready: true },
    ],
    303: [
        { ao_id: 505, ao_description: 'MTE 1', is_ready: true },
    ],
    401: [
        { ao_id: 506, ao_description: 'MTE 1', is_ready: true },
    ],
    402: [
        { ao_id: 507, ao_description: 'MTE 1', is_ready: false },
    ],
};

const mockAttainmentLevels: AttainmentLevel[] = [
    { level_name: 'Excellent', level_value: 3, direct_percentage: 70, operator: '>=', target_percentage: 60 },
    { level_name: 'Good', level_value: 2, direct_percentage: 60, operator: '>=', target_percentage: 50 },
    { level_name: 'Satisfactory', level_value: 1, direct_percentage: 50, operator: '>=', target_percentage: 40 },
];

const getMockCORows = (courseId: number): CORow[] => {
    if (courseId === 301) {
        return [
            {
                clo_id: 701,
                clo_code: 'CO1',
                clo_statement: 'Apply data structure concepts to solve problems',
                threshold_direct_attainment: 82.5,
                threshold_direct_attainment_display: '82.50%',
                average_direct_attainment: 76.2,
                average_direct_attainment_display: '76.20%',
                attainment_level: 3,
                weighted_threshold_attainment: 16.5,
            },
            {
                clo_id: 702,
                clo_code: 'CO2',
                clo_statement: 'Analyze algorithm efficiency',
                threshold_direct_attainment: 74.0,
                threshold_direct_attainment_display: '74.00%',
                average_direct_attainment: 68.5,
                average_direct_attainment_display: '68.50%',
                attainment_level: 2,
                weighted_threshold_attainment: 14.8,
            },
        ];
    }
    return [];
};

const getMockGraphData = (coRows: CORow[]): GraphData => ({
    x: coRows.map((r) => r.clo_code),
    y: coRows.map((r) => r.threshold_direct_attainment),
    tooltips: coRows.map((r) => `${r.clo_code}: ${r.clo_statement}`),
    series_label: 'Threshold Direct Attainment %',
    y_min: 0,
    y_max: 100,
    y_tick_interval: 10,
});

const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export const mteAttainmentApi = {
    getCurricula: async (): Promise<Curriculum[]> => {
        await delay();
        return mockCurricula;
    },

    getTerms: async (curriculumId: number): Promise<Term[]> => {
        await delay();
        return mockTerms[curriculumId] || [];
    },

    getCourses: async (termId: number): Promise<Course[]> => {
        await delay();
        return mockCourses[termId] || [];
    },

    getOccasions: async (courseId: number): Promise<Occasion[]> => {
        await delay();
        return mockOccasions[courseId] || [];
    },

    getCourseLevels: async (courseId: number): Promise<AttainmentLevel[]> => {
        await delay();
        return mockAttainmentLevels;
    },

    calculate: async (payload: CalculatePayload): Promise<CalculateResponse> => {
        await delay(800);
        const coRows = getMockCORows(payload.course_id);
        const readinessStatus: ReadinessStatus = {
            all_ready: true,
            occasion_status: payload.selected_occasion_ids.map((id) => ({
                ao_id: id,
                is_ready: true,
                error_message: null,
            })),
        };
        return {
            readiness_status: readinessStatus,
            co_rows: coRows,
            course_levels: mockAttainmentLevels,
            can_finalize: payload.selected_occasion_ids.length === 2, // mock condition
            graph_data: getMockGraphData(coRows),
        };
    },

    getMappedQuestions: async (
        cloId: number,
        courseId: number,
        occasionIds: number[]
    ): Promise<MappedQuestion[]> => {
        await delay();
        return [
            {
                question_sequence: 1,
                sub_question_no: null,
                marks: 10,
                mapped_marks: 10,
                mapped_percentage: 100,
                co_code: 'CO1',
            },
            {
                question_sequence: 2,
                sub_question_no: 'a',
                marks: 5,
                mapped_marks: 5,
                mapped_percentage: 100,
                co_code: 'CO1',
            },
        ];
    },

    getDrilldown: async (
        cloId: number,
        courseId: number,
        occasionIds: number[]
    ): Promise<DrilldownResponse> => {
        await delay();
        return {
            co_code: 'CO1',
            co_statement: 'Apply data structure concepts to solve problems',
            mte_weightage: 20,
            occasion_data: occasionIds.map((id, idx) => ({
                occasion_name: `MTE ${idx + 1}`,
                attainment_percentage: 80 + idx * 5,
                attainment_level: 3,
            })),
            average_attainment_percentage: 82.5,
            average_attainment_level: 3,
        };
    },

    finalize: async (payload: FinalizePayload): Promise<{ success: boolean; message: string }> => {
        await delay(1000);
        return { success: true, message: 'MTE finalized successfully' };
    },

    getFinalized: async (
        curriculumId: number,
        termId: number,
        courseId: number
    ): Promise<FinalizedRow[]> => {
        await delay();
        if (courseId === 301) {
            return [
                {
                    clo_id: 701,
                    clo_code: 'CO1',
                    threshold_based_attainment: 82.5,
                    attainment_level: 3,
                    average_based_attainment: 76.2,
                    weighted_threshold_attainment: 16.5,
                },
            ];
        }
        return [];
    },

    exportReport: async (params: ExportParams): Promise<Blob> => {
        await delay(1500);
        return new Blob(['Dummy PDF content'], { type: 'application/pdf' });
    },
};