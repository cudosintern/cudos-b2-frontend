export interface CurriculumOption {
    value: number;
    label: string;
}

export interface TermOption {
    value: number;
    label: string;
}

export interface CourseOption {
    value: number;
    label: string;
}

export interface UnitOption {
    value: number;
    label: string;
}

export interface DeliveryMethodOption {
    value: string;
    label: string;
}

export interface Topic {
    id: number;
    unit: string;
    unit_id: number;
    sl_no?: number;
    topic_code: string;
    title: string;
    content: string;
    hours: number;
    deliveryMethods: string[];
    mappingStatus: "pending" | "mapped";
    // Context IDs preserved from backend for child operations
    academic_batch_id?: number;
    semester_id?: number;
    crs_id?: number;
}

export interface TLO {
    id: number;
    topic_id: number;
    statement: string;
    code: string;
}
