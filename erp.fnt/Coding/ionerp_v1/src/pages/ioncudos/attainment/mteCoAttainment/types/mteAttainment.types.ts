// types/mteAttainment.types.ts

export interface Curriculum {
    curriculum_id: number;
    curriculum_name: string;
}

export interface Term {
    term_id: number;
    term_name: string;
}

export interface Course {
    course_id: number;
    course_code: string;
    course_name: string;
    total_mte_weightage: number;
}

export interface Occasion {
    ao_id: number;
    ao_description: string;
    is_ready?: boolean; // optional, backend may compute readiness
}

export interface AttainmentLevel {
    level_name: string;
    level_value: number;
    direct_percentage: number;
    operator: string;
    target_percentage: number;
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

export interface GraphData {
    x: string[];
    y: number[];
    tooltips: string[];
    series_label: string;
    y_min: number;
    y_max: number;
    y_tick_interval: number;
}

export interface OccasionStatus {
    ao_id: number;
    is_ready: boolean;
    error_message: string | null;
}

export interface ReadinessStatus {
    all_ready: boolean;
    occasion_status: OccasionStatus[];
}

export interface CalculateResponse {
    readiness_status: ReadinessStatus;
    co_rows: CORow[];
    course_levels: AttainmentLevel[];
    can_finalize: boolean;
    graph_data: GraphData;
}

export interface MappedQuestion {
    question_sequence: number;
    sub_question_no: string | null;
    marks: number;
    mapped_marks: number;
    mapped_percentage: number;
    co_code: string;
}

export interface OccasionDrilldown {
    occasion_name: string;
    attainment_percentage: number;
    attainment_level: number;
}

export interface DrilldownResponse {
    co_code: string;
    co_statement: string;
    mte_weightage: number;
    occasion_data: OccasionDrilldown[];
    average_attainment_percentage: number;
    average_attainment_level: number;
}

export interface FinalizedRow {
    clo_id: number;
    clo_code: string;
    threshold_based_attainment: number;
    attainment_level: number;
    average_based_attainment: number;
    weighted_threshold_attainment: number;
}

export interface CalculatePayload {
    curriculum_id: number;
    term_id: number;
    course_id: number;
    selected_occasion_ids: number[];
}

export interface FinalizePayload extends CalculatePayload { }

export interface ExportParams {
    curriculum_id: number;
    term_id: number;
    course_id: number;
    selected_occasion_ids: number[];
}