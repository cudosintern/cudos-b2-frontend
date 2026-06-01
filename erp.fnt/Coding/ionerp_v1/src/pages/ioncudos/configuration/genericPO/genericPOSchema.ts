import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { GenericPO, AccreditationType, ApiResponse, PoType, PoCode } from "./genericPOResponseInterface";

// --- ACCREDITATION TYPE APIs ---

export const getAccreditationTypes = async (): Promise<ApiResponse<AccreditationType[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<any>>(ApiEndpoint.cudos.generic_po + "accreditation_types");
    
    if (response.data && response.data.status && Array.isArray(response.data.data)) {
        response.data.data = response.data.data.map((item: any) => ({
            ...item,
            pos: item.details ? item.details.map((d: any) => ({
                po_id: d.atype_details_id,
                po_code: d.po_code,
                po_reference: d.atype_details_name,
                po_statement: d.atype_details_description,
                po_description: "", // Fallback
                po_type_id: d.po_type_id,
                atype_id: d.atype_id
            })) : []
        }));
    }
    
    return response.data;
  } catch (error) {
    console.error("Error fetching accreditation types", error);
    return { status: false, message: "Error fetching data", data: [] };
  }
};

export const createAccreditationType = async (data: any): Promise<ApiResponse<AccreditationType>> => {
    try {
        const payload = { ...data };
        if (payload.pos) {
            payload.details = payload.pos.map((p: any) => ({
                atype_details_id: p.po_id,
                po_code: p.po_code,
                atype_details_name: p.po_reference || p.po_code,
                atype_details_description: p.po_statement || "No description provided",
                po_type_id: p.po_type_id
            }));
            delete payload.pos;
        }
        const response = await axiosInstance.post<ApiResponse<AccreditationType>>(ApiEndpoint.cudos.generic_po + "accreditation_types", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating accreditation type", error);
        throw error;
    }
};

export const updateAccreditationType = async (id: number, data: any): Promise<ApiResponse<AccreditationType>> => {
    try {
        const payload = { ...data };
        if (payload.pos) {
            payload.details = payload.pos.map((p: any) => ({
                atype_details_id: p.po_id,
                po_code: p.po_code,
                atype_details_name: p.po_reference || p.po_code,
                atype_details_description: p.po_statement || "No description provided",
                po_type_id: p.po_type_id
            }));
            delete payload.pos;
        }
        const response = await axiosInstance.put<ApiResponse<AccreditationType>>(`${ApiEndpoint.cudos.generic_po}accreditation_types/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating accreditation type", error);
        throw error;
    }
};

export const deleteAccreditationType = async (id: number): Promise<ApiResponse<null>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<null>>(`${ApiEndpoint.cudos.generic_po}accreditation_types/${id}`);
        return response.data;
    } catch (error) {
         console.error("Error deleting accreditation type", error);
         throw error;
    }
};

// --- PO TYPE APIs ---

export const getPoTypes = async (): Promise<ApiResponse<PoType[]>> => {
    try {
        const response = await axiosInstance.get<ApiResponse<PoType[]>>(ApiEndpoint.cudos.generic_po + "po_types");
        return response.data;
    } catch (error) {
        console.error("Error fetching PO Types", error);
        return { status: false, message: "Error fetching PO Types", data: [] };
    }
};

export const getPoCodes = async (): Promise<ApiResponse<PoCode[]>> => {
    try {
        const response = await axiosInstance.get<ApiResponse<PoCode[]>>(ApiEndpoint.cudos.generic_po + "po_codes");
        return response.data;
    } catch (error) {
        console.error("Error fetching PO Codes", error);
        return { status: false, message: "Error fetching PO Codes", data: [] };
    }
};

// --- GENERIC PO APIs ---
// Note: POs are managed via nested updates in Accreditation Types.
// Indivi
