import axiosInstance from "../../../../utils/api";
import { BosMember, UserResponse } from "./responseInterface";

const API_URL = process.env.REACT_APP_API_URL || "";
const API = `${process.env.REACT_APP_API_URL}/cudos/board-of-studies`;

// Defined to mirror backend faculty_helper.py FACULTY_TYPE_MAP keys
export const FACULTY_TYPES = [
    "Teaching",
    "Lab",
    "Administration",
    "Supporting",
    "Visiting"
];

export const getAllBos = () => axiosInstance.get<BosMember[]>(`${API}/list`);

export const getBosById = (id: number) => axiosInstance.get<BosMember>(`${API}/${id}`, { withCredentials: false });

export const createBos = (data: BosMember) =>
    axiosInstance.post(`${API}/create`, data, { withCredentials: false });

export const updateBos = (id: number, data: BosMember) =>
    axiosInstance.put(`${API}/${id}`, data, { withCredentials: false });

export const deleteBos = (id: number) =>
    axiosInstance.delete(`${API}/${id}`, { withCredentials: false });

export const toggleBos = (id: number) =>
    axiosInstance.put(`${API}/${id}/toggle-status`, null, { withCredentials: false });

export const getDesignations = () => axiosInstance.get(`${API}/designations`);

export const fetchUsersByDept = (deptId: number) =>
    axiosInstance.post<UserResponse[]>(`${API}/users_by_dept`, { dept_id: deptId });

export const addExistingBosMember = (payload: { user_id: number; bos_dept_id: number; bos_for: string }) =>
    axiosInstance.post(`${API}/add_existing`, payload);

export const fetchDepartments = () =>
    axiosInstance.post(`${process.env.REACT_APP_API_URL}/comman_function/department_list`, {
        dept_id: null,
        show_delete: 1,
        equal_or_not_equal: false
    });
