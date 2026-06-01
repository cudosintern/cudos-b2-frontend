import axiosInstance from "../../../../utils/api";
import {
    CurriculumOption,
    Po,
    Peo,
    PoPeoSavePayload,
    PoPeoDeletePayload,
    ExistingMapping
} from "./types";

// ── Base URLs ─────────────────────────────────────────────────────────────────
// axiosInstance already has baseURL set to http://localhost:8000/
const CURRICULUM_BASE = "curriculum_list";
const PO_PEO_BASE = "po_peo_mapping";

// ── Curriculum ────────────────────────────────────────────────────────────────

export const fetchCurriculumOptions = async (): Promise<CurriculumOption[]> => {
    try {
        const res = await axiosInstance.get<any>(`${CURRICULUM_BASE}/curriculum`);
        const raw: any = res.data;
        // Backend uses returnSuccess → { status: 1, data: [...] }
        const list: any[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        return list.map((item: any) => ({
            value: item.academic_batch_id as number,
            label: item.academic_batch_code
                ? `${item.academic_batch_code}${item.academic_batch_desc ? " – " + item.academic_batch_desc : ""}`
                : (item.crclm_name || `Batch ${item.academic_batch_id}`),
        }));
    } catch (error) {
        console.error("Error fetching curriculum options", error);
        return [];
    }
};

// ── PO List ───────────────────────────────────────────────────────────────────

export const fetchPoList = async (crclm_id: number): Promise<Po[]> => {
    try {
        const res = await axiosInstance.get<any>(`${PO_PEO_BASE}/po_list`, {
            params: { crclm_id },
        });
        const raw: any = res.data;
        const list: any[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        return list.map((item: any) => ({
            po_id: item.po_id as number,
            po_code: item.po_code as string,
            po_statement: item.po_statement as string,
        }));
    } catch (error) {
        console.error("Error fetching PO list", error);
        throw error;
    }
};

// ── PEO List ──────────────────────────────────────────────────────────────────

export const fetchPeoList = async (crclm_id: number): Promise<Peo[]> => {
    try {
        const res = await axiosInstance.get<any>(`${PO_PEO_BASE}/peo_list`, {
            params: { crclm_id },
        });
        const raw: any = res.data;
        const list: any[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        return list.map((item: any) => ({
            peo_id: item.peo_id as number,
            peo_reference: item.peo_reference as string,
            peo_statement: item.peo_statement as string,
        }));
    } catch (error) {
        console.error("Error fetching PEO list", error);
        throw error;
    }
};

// ── Save Mapping ──────────────────────────────────────────────────────────────
// Backend expects a flat ARRAY of PoPeoSavePayload items

export const saveMapping = async (payload: PoPeoSavePayload[]): Promise<boolean> => {
    try {
        const res = await axiosInstance.post<any>(`${PO_PEO_BASE}/save_po_peo_map`, payload);
        const data: any = res.data;
        return data?.status === 1 || data?.status === true;
    } catch (error) {
        console.error("Error saving PO-PEO mapping", error);
        throw error;
    }
};

// ── Delete Mapping ────────────────────────────────────────────────────────────

export const deleteMapping = async (payload: PoPeoDeletePayload): Promise<boolean> => {
    try {
        const res = await axiosInstance.post<any>(`${PO_PEO_BASE}/delete_po_peo_map`, payload);
        const data: any = res.data;
        return data?.status === 1 || data?.status === true;
    } catch (error) {
        console.error("Error deleting PO-PEO mapping", error);
        throw error;
    }
};

// ── Fetch Existing Mappings ───────────────────────────────────────────────────

export const fetchExistingMappings = async (crclm_id: number): Promise<ExistingMapping[]> => {
    try {
        const res = await axiosInstance.get<any>(`${PO_PEO_BASE}/get_po_peo_map`, {
            params: { crclm_id },
        });
        const raw: any = res.data;
        const list: any[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        return list.map((item: any) => ({
            pp_id: item.pp_id as number,
            po_id: item.po_id as number,
            peo_id: item.peo_id as number,
            map_level: item.map_level as string,
            justification: item.justification as string,
        }));
    } catch (error) {
        console.error("Error fetching existing mappings", error);
        return [];
    }
};
