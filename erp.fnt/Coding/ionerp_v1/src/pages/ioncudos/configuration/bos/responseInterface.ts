export interface BosMember {
    id?: number;
    bos_id: number;
    user_id?: number;

    // Personal Info
    faculty_type?: string;
    title?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;

    organization: string;
    org_id?: number;

    email?: string;
    mobile?: string;
    contact?: string;
    aadhar_number?: string;

    highest_qualification?: string;
    experience?: number | string;

    // Designation
    designation?: string;
    designation_id?: number;

    // School / BoS
    school?: string;
    bos_for?: string;

    // Status
    active?: boolean;
    status?: number;

    // Meta
    create_date?: string;
}

export interface Designation {
    designation_id: number;
    designation_name: string;
    designation_description?: string;
}

export interface UserResponse {
    user_id: number;
    username?: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface BoSShortResponse {
    bos_id: number;
    user_id: number;
}

export interface UsersAndBoSByDeptResponse {
    dept_id: number;
    users: UserResponse[];
    bos_members: BoSShortResponse[];
}
