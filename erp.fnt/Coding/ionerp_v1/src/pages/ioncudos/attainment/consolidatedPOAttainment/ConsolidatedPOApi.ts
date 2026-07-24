// src/pages/ioncudos/attainment/consolidatedPOAttainment/ConsolidatedPOApi.ts

import axiosInstance from '../../../../utils/api';
import { z } from 'zod';

// ================= TYPES =================
export interface Curriculum {
    crclm_id: number;
    name: string;
    pgm_title: string | null;
    is_first_year: boolean;
}

export interface Term {
    term_id: number;
    name: string;
}

export interface FirstYearCurriculum {
    fy_crclm_id: number;
    name: string;
}

export interface POConsolidatedAttainmentData {
    po_id: number;
    po_code: string;
    po_statement: string;
    avg_po_attainment: number; // chart bar 1
    po_attainment: number; // chart bar 2
    avg_map_level_weighted_attainment: number; // chart bar 3
    
    // Table values matching reference screenshot
    threshold_pct: number;
    threshold_level: number;
    threshold_status: string;
    
    weighted_pct: number;
    weighted_level: number;
    weighted_status: string;
    
    relative_pct: number;
    relative_level: number;
    relative_status: string;
}

export interface DrilldownRow {
    crclm_name: string;
    crs_code: string;
    crs_title: string;
    po_reference: string;
    po_statement: string;
    direct_attainment?: any;
    attainment_level?: any;
    average_po_direct_attainment?: any;
    average_po_attainment_level?: any;
    threshold_po_direct_attainment?: any;
    threshold_po_attainment_level?: any;
    hml_weighted_average_da?: any;
    hml_wtd_avg_attainment_level?: any;
    hml_weighted_multiply_maplevel_da?: any;
    hml_wtd_avg_mul_attainment_level?: any;
}

export interface PerformanceLevel {
    performance_level_name_alias: string;
    performance_level_value: number;
    start_range: number;
    conditional_opr: string;
    end_range: number;
    description: string;
}

export interface FirstYearDependencyResponse {
    hasFirstYearCurriculum: boolean;
    firstYearCurriculums: FirstYearCurriculum[];
}

// ================= ZOD SCHEMAS =================

const ProgramGroupedSchema = z.object({
    pgm_id: z.number(),
    pgm_title: z.string(),
    curriculums: z.array(z.object({
        academic_batch_id: z.number(),
        academic_batch_code: z.string()
    }))
});

const BootstrapSchema = z.object({
    programs: z.array(z.object({
        pgm_id: z.number(),
        pgm_title: z.string()
    })),
    curriculumsGrouped: z.array(ProgramGroupedSchema),
    poAttainmentType: z.string(),
    labels: z.record(z.string())
});

const FirstYearCurriculumSchema = z.object({
    academic_batch_id: z.number(),
    academic_batch_code: z.string()
}).transform((val) => ({
    fy_crclm_id: val.academic_batch_id,
    name: val.academic_batch_code
}));

const FirstYearDependencySchema = z.object({
    hasFirstYearCurriculum: z.boolean(),
    firstYearCurriculums: z.array(FirstYearCurriculumSchema)
});

const TermSchema = z.object({
    crclm_term_id: z.number(),
    term_name: z.string()
}).transform((val) => ({
    term_id: val.crclm_term_id,
    name: val.term_name
}));

const AttainmentRowSchema = z.object({
    po_id: z.number(),
    po_reference: z.string(),
    po_statement: z.string(),
    po_minthreshhold: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    average_po_direct_attainment: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    average_po_attainment_level: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    threshold_po_direct_attainment: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    threshold_po_attainment_level: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    threshold_po_performance_level: z.string().nullable().optional().transform((v) => v ?? 'View Level'),
    hml_weighted_average_da: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    hml_wtd_avg_attainment_level: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    hml_wtd_avg_performance_level: z.string().nullable().optional().transform((v) => v ?? 'View Level'),
    hml_weighted_multiply_maplevel_da: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    hml_wtd_avg_mul_attainment_level: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    hml_wtd_avg_mul_performance_level: z.string().nullable().optional().transform((v) => v ?? 'View Level')
}).transform((val) => ({
    po_id: val.po_id,
    po_code: val.po_reference,
    po_statement: val.po_statement,
    avg_po_attainment: val.average_po_direct_attainment,
    po_attainment: val.threshold_po_direct_attainment,
    avg_map_level_weighted_attainment: val.hml_weighted_average_da,
    
    threshold_pct: val.threshold_po_direct_attainment,
    threshold_level: val.threshold_po_attainment_level,
    threshold_status: val.threshold_po_performance_level,
    
    weighted_pct: val.hml_weighted_average_da,
    weighted_level: val.hml_wtd_avg_attainment_level,
    weighted_status: val.hml_wtd_avg_performance_level,
    
    relative_pct: val.hml_weighted_multiply_maplevel_da,
    relative_level: val.hml_wtd_avg_mul_attainment_level,
    relative_status: val.hml_wtd_avg_mul_performance_level
}));

const DrilldownRowSchema = z.object({
    crclm_name: z.string(),
    crs_code: z.string(),
    crs_title: z.string(),
    po_reference: z.string(),
    po_statement: z.string(),
    direct_attainment: z.any().nullable().optional().transform((v) => v ?? "-"),
    attainment_level: z.any().nullable().optional().transform((v) => v ?? "-"),
    average_po_direct_attainment: z.any().nullable().optional().transform((v) => v ?? "-"),
    average_po_attainment_level: z.any().nullable().optional().transform((v) => v ?? "-"),
    threshold_po_direct_attainment: z.any().nullable().optional().transform((v) => v ?? "-"),
    threshold_po_attainment_level: z.any().nullable().optional().transform((v) => v ?? "-"),
    hml_weighted_average_da: z.any().nullable().optional().transform((v) => v ?? "-"),
    hml_wtd_avg_attainment_level: z.any().nullable().optional().transform((v) => v ?? "-"),
    hml_weighted_multiply_maplevel_da: z.any().nullable().optional().transform((v) => v ?? "-"),
    hml_wtd_avg_mul_attainment_level: z.any().nullable().optional().transform((v) => v ?? "-")
});

const PerformanceLevelSchema = z.object({
    performance_level_name_alias: z.string(),
    performance_level_value: z.number(),
    start_range: z.number(),
    conditional_opr: z.string(),
    end_range: z.number(),
    description: z.string()
});

// ================= API FUNCTIONS =================

export const fetchCurricula = async (): Promise<Curriculum[]> => {
    const res = await axiosInstance.get('/tier-ii/consolidated-po-attainment/bootstrap') as any;
    const data = res.data?.data || res.data;
    const parsed = BootstrapSchema.parse(data);
    
    // Flatten curricula grouped by program
    const flatCurricula: Curriculum[] = [];
    parsed.curriculumsGrouped.forEach(grp => {
        grp.curriculums.forEach(crclm => {
            flatCurricula.push({
                crclm_id: crclm.academic_batch_id,
                name: crclm.academic_batch_code,
                pgm_title: grp.pgm_title,
                is_first_year: false
            });
        });
    });
    return flatCurricula;
};

export const fetchFirstYearDependency = async (curriculumId: number): Promise<FirstYearDependencyResponse> => {
    const res = await axiosInstance.get('/tier-ii/consolidated-po-attainment/first-year-dependency', {
        params: { crclm_id: curriculumId }
    }) as any;
    const data = res.data?.data || res.data;
    return FirstYearDependencySchema.parse(data);
};

export const fetchTermsForCurriculum = async (
    curriculumId: number | null,
    firstYearCurriculumId?: number | null
): Promise<Term[]> => {
    if (!curriculumId) return [];
    const res = await axiosInstance.get('/tier-ii/consolidated-po-attainment/terms', {
        params: {
            crclm_id: curriculumId,
            first_year_crclm: firstYearCurriculumId ?? 0
        }
    }) as any;
    const data = res.data?.data || res.data || [];
    return z.array(TermSchema).parse(data);
};

export const fetchFirstYearCurricula = async (curriculumId: number | null): Promise<FirstYearCurriculum[]> => {
    if (!curriculumId) return [];
    const dep = await fetchFirstYearDependency(curriculumId);
    return dep.firstYearCurriculums;
};

export interface EnabledMethod {
    id: string;
    label: string;
    enabled: boolean;
}

export interface FetchPOAttainmentResponse {
    rows: POConsolidatedAttainmentData[];
    enabledMethods: EnabledMethod[];
    orgConfigValue: string;
}

export const fetchPOAttainment = async (
    curriculumId: number,
    termIds: number[],
    firstYearCurriculumId?: number | null
): Promise<FetchPOAttainmentResponse> => {
    const res = await axiosInstance.get('/tier-ii/consolidated-po-attainment/direct', {
        params: {
            crclm_id: curriculumId,
            first_year_crclm: firstYearCurriculumId ?? 0,
            term_ids: termIds.join(','),
            core_crs_id: 0
        }
    }) as any;
    const data = res.data?.data || res.data || {};
    const rows = data.rows || [];
    const enabledMethods = data.enabledMethods || [];
    const orgConfigValue = data.orgConfigValue || "ALL";
    
    return {
        rows: z.array(AttainmentRowSchema).parse(rows),
        enabledMethods,
        orgConfigValue
    };
};

export const fetchDrilldown = async (
    curriculumId: number,
    termIds: number[],
    firstYearCurriculumId: number | null,
    poId: number,
    method: string
): Promise<{ po: { po_reference: string, po_statement: string }, rows: DrilldownRow[] }> => {
    const res = await axiosInstance.get('/tier-ii/consolidated-po-attainment/direct/drilldown', {
        params: {
            crclm_id: curriculumId,
            first_year_crclm: firstYearCurriculumId ?? 0,
            term_ids: termIds.join(','),
            core_crs_id: 0,
            po_id: poId,
            method: method
        }
    }) as any;
    const data = res.data?.data || res.data;
    const poVal = data.po || { po_reference: '', po_statement: '' };
    const rowsVal = data.rows || [];
    return {
        po: poVal,
        rows: z.array(DrilldownRowSchema).parse(rowsVal)
    };
};

export const fetchPerformanceLevels = async (poId: number): Promise<PerformanceLevel[]> => {
    const res = await axiosInstance.get('/tier-ii/consolidated-po-attainment/performance-levels', {
        params: { po_id: poId }
    }) as any;
    const data = res.data?.data || res.data || [];
    return z.array(PerformanceLevelSchema).parse(data);
};

export const exportDirectReport = async (
    curriculumId: number,
    termIds: number[],
    firstYearCurriculumId: number | null,
    chartImage: string | null,
    exportType: 'pdf' | 'docx' = 'pdf',
    activeTab: string = "Direct Attainment"
): Promise<Blob> => {
    const res = await axiosInstance.post('/tier-ii/consolidated-po-attainment/export', {
        crclm_id: curriculumId,
        first_year_crclm: firstYearCurriculumId ?? 0,
        term_ids: termIds,
        core_crs_id: 0,
        chart_image: chartImage,
        export_type: exportType,
        active_tab: activeTab
    }, {
        responseType: 'blob'
    }) as any;
    return res.data as Blob;
};
