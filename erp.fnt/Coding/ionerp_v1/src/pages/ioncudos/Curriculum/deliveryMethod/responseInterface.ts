/**
 * Response interface for Delivery Method
 * Defines the structure of Delivery Method data returned from the API
 */

export interface DeliveryMethodResponse {
    delivery_mtd_id: number;
    delivery_mtd_name: string;
    delivery_mtd_desc?: string;
    bloom_levels?: number[];
    status?: number;
    org_id?: number;
    created_date?: string | null;
    created_by?: number | null;
    modified_date?: string | null;
    modified_by?: number | null;
}
