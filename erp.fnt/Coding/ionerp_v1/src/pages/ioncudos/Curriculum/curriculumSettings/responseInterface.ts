export interface ProgramOption {
    label: string;
    value: number;
}

export interface RegulationOption {
    label: string;
    value: number;
}

export interface CurriculumImportPayload {
    program_id: number;
    regulation_id: number;
    academic_year: string;
    description?: string;
    file: File | null;
}

export interface CurriculumImportResponse {
    status: boolean;
    message: string;
    data?: any;
}
