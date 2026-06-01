import axiosInstance from '../../../../utils/api';

// ==================== TYPES ====================

export interface SchoolOption {
    value: number;   // dept_id
    label: string;   // dept_name
}

export interface UserOption {
    value: number;   // user_id
    label: string;   // name
    email: string;
    designation_id: number;
    designation_name: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Fetch list of departments/schools from backend
 * GET /school_user/school_dropdown
 * Response: { status: boolean, data: { dept_id, dept_name }[] }
 */
export const fetchSchools = async (): Promise<SchoolOption[]> => {
    const res = await axiosInstance.get<{ status: boolean; data: { dept_id: number; dept_name: string }[] }>(
        "/school_user/school_dropdown"
    );
    const raw = res.data?.data ?? [];
    return raw.map((s) => ({ value: s.dept_id, label: s.dept_name }));
};

/**
 * Fetch users for a given department from backend
 * GET /school_user/users_dropdown?dept_id=<deptId>
 * Response: { status: boolean, data: { user_id, name, email }[] }
 */
/**
 * Fetch users for a given department from backend
 * POST /cudos/board-of-studies/users_by_dept
 * Payload: { dept_id: number }
 * Response: { user_id, username, email, first_name, last_name, designation }[]
 */
export const fetchUsersBySchool = async (deptId: number): Promise<UserOption[]> => {
    const res = await axiosInstance.post<
        { user_id: number; username: string; email: string; first_name: string; last_name: string, designation_name: string, designation_id: number }[]
    >("/cudos/board-of-studies/users_by_dept", { dept_id: deptId });

    // The backend returns the list directly, not wrapped in { data: ... }
    const raw = Array.isArray(res.data) ? res.data : [];

    return raw.map((u) => ({
        value: u.user_id,
        label: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username,
        email: u.email,
        designation_id: u.designation_id,
        designation_name: u.designation_name,
    }));
};
