/**
 * CiaQpApi.ts
 * API service for the Manage CIA QP & Rubrics module.
 *
 * Backend base (via axios interceptor prefix /api/v1):
 *   /manage-cia-qp-and-rubrics/...
 */
import axiosInstance from '../../../../utils/api';

// ─── Base prefix (matches routes.py: prefix="/manage-cia-qp-and-rubrics") ─────
const BASE = '/manage-cia-qp-and-rubrics';

/** Safely unwrap the nested data payload returned by all backend endpoints. */
const dataOf = (res: any, fallback: any = []) => res?.data?.data ?? fallback;

// ─── 1. Dropdown APIs ─────────────────────────────────────────────────────────

/** GET /manage-cia-qp-and-rubrics/departments */
export const getDepartments = async () => {
    const res = await axiosInstance.get<any>(`${BASE}/departments`);
    return dataOf(res);
};

/** GET /manage-cia-qp-and-rubrics/programs?dept_id=&org_id= */
export const getPrograms = async (deptId?: string | number) => {
    const res = await axiosInstance.get<any>(`${BASE}/programs`, {
        params: { dept_id: deptId || undefined }
    });
    return dataOf(res);
};

/** GET /manage-cia-qp-and-rubrics/curriculums?pgm_id= */
export const getCurriculums = async (pgmId?: string | number) => {
    const res = await axiosInstance.get<any>(`${BASE}/curriculums`, {
        params: { pgm_id: pgmId || undefined }
    });
    return dataOf(res);
};

/** GET /manage-cia-qp-and-rubrics/terms?academic_batch_id= */
export const getTerms = async (academicBatchId?: string | number) => {
    const res = await axiosInstance.get<any>(`${BASE}/terms`, {
        params: { academic_batch_id: academicBatchId || undefined }
    });
    return dataOf(res);
};

/**
 * GET /manage-cia-qp-and-rubrics/course-dropdown?semester_id=
 * Returns courses for the selected term.
 */
export const getCourses = async (semesterId: string | number, _academicBatchId?: string | number) => {
    const res = await axiosInstance.get<any>(`${BASE}/course-dropdown`, {
        params: { semester_id: semesterId }
    });
    return dataOf(res);
};

// ─── 2. Grid Data ─────────────────────────────────────────────────────────────

/**
 * GET /manage-cia-qp-and-rubrics/list-cia-qp?course_id=&semester_id=
 * Returns the full Section → Instructor → CIA grid rows.
 */
export const getAssessmentOccasionGrid = async (filters: {
    crs_id: string | number;
    term_id: string | number;
    [key: string]: any;
}) => {
    const res = await axiosInstance.get<any>(`${BASE}/list-cia-qp`, {
        params: {
            course_id: filters.crs_id,
            semester_id: filters.term_id
        }
    });
    return dataOf(res);
};

// ─── 3. Course & AO Detail ────────────────────────────────────────────────────

/**
 * GET /manage-cia-qp-and-rubrics/course-details?course_id=&semester_id=
 * Returns course info + section/instructor mapping for the Manage CIA form.
 */
export const getCourseDetails = async (filters: {
    crs_id: string | number;
    term_id?: string | number;
    semester_id?: string | number;
    [key: string]: any;
}) => {
    const res = await axiosInstance.get<any>(`${BASE}/course-details`, {
        params: {
            course_id: filters.crs_id,
            semester_id: filters.term_id || filters.semester_id
        }
    });
    return dataOf(res, {});
};

/**
 * GET /manage-cia-qp-and-rubrics/ao-dropdowns?crs_id=&academic_batch_id=
 * Returns AO methods, AO types, COs, Bloom levels.
 */
export const getAoDropdowns = async (crsId: string | number, academicBatchId: string | number) => {
    const res = await axiosInstance.get<any>(`${BASE}/ao-dropdowns`, {
        params: { crs_id: crsId, academic_batch_id: academicBatchId }
    });
    return dataOf(res, {});
};

// ─── 4. Assessment Occasion (AO) CRUD ────────────────────────────────────────

/**
 * POST /manage-cia-qp-and-rubrics/ao
 * Create or update an Assessment Occasion.
 * Pass ao_id in payload to update.
 */
export const saveAo = async (payload: Record<string, any>) => {
    const res = await axiosInstance.post<any>(`${BASE}/ao`, payload);
    return res.data;
};

// ─── 5. QP CRUD ───────────────────────────────────────────────────────────────

/**
 * GET /manage-cia-qp-and-rubrics/view-qp/{qpd_id}
 */
export const getQp = async (qpId: string | number) => {
    const res = await axiosInstance.get<any>(`${BASE}/view-qp/${qpId}`);
    return dataOf(res, null);
};

/**
 * POST /manage-cia-qp-and-rubrics/qp — create new QP
 * PUT  /manage-cia-qp-and-rubrics/qp/{qpd_id} — update existing QP
 */
export const saveQp = async (payload: Record<string, any>) => {
    if (payload.qpd_id) {
        const { qpd_id, crs_id, academic_batch_id, semester_id, qpd_type, cia_model_qp, created_by, ...updatePayload } = payload;
        const res = await axiosInstance.put<any>(`${BASE}/qp/${qpd_id}`, updatePayload);
        return res.data;
    }
    const res = await axiosInstance.post<any>(`${BASE}/qp`, payload);
    return res.data;
};

/**
 * DELETE /manage-cia-qp-and-rubrics/qp/{qpd_id}
 */
export const deleteQp = async (qpId: number) => {
    const res = await axiosInstance.delete<any>(`${BASE}/qp/${qpId}`);
    return res.data;
};

// ─── 6. Import QP ─────────────────────────────────────────────────────────────

/**
 * POST /manage-cia-qp-and-rubrics/import-qp
 * Copies a QP from another curriculum/course and links to target AO.
 */
export const importQp = async (payload: Record<string, any>) => {
    const res = await axiosInstance.post<any>(`${BASE}/import-qp`, payload);
    return res.data;
};

// ─── 7. QP File Upload / View / Delete ───────────────────────────────────────

/**
 * POST /manage-cia-qp-and-rubrics/upload-qp-file
 * Upload an artifact / reference QP file (multipart/form-data).
 */
export const uploadQpFile = async (formData: FormData) => {
    const res = await axiosInstance.post<any>(`${BASE}/upload-qp-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};

/**
 * Returns a direct URL to stream/download an uploaded file.
 * GET /manage-cia-qp-and-rubrics/view-qp-file/{doc_id}
 */
export const getQpFileUrl = (docId: number) =>
    `${axiosInstance.defaults.baseURL}${BASE}/view-qp-file/${docId}`;

/**
 * DELETE /manage-cia-qp-and-rubrics/delete-qp-file/{doc_id}
 */
export const deleteQpFile = async (docId: number) => {
    const res = await axiosInstance.delete<any>(`${BASE}/delete-qp-file/${docId}`);
    return res.data;
};
