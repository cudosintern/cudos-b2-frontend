import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";

export const programModeApi = {
    list: ApiEndpoint.program_mode.list,
    create: ApiEndpoint.program_mode.create,
    update: ApiEndpoint.program_mode.update,
    delete: ApiEndpoint.program_mode.delete,
    get: ApiEndpoint.program_mode.get,
};

export interface ProgramMode {
    prg_mode_id: number;
    prg_mode_name: string;
    prg_mode_desc: string;
    prg_mode_code: string;
    status: number;
    is_mapped?: boolean;
    program_count?: number;
}

export interface ProgramModePayload {
    program_mode_name: string;
    description: string;
}
