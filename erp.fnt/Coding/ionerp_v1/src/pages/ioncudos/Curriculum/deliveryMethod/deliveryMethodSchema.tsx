import { z } from "zod";

/**
 * Zod validation schema for Delivery Method form
 */
export const Schema = z.object({
    delivery_mtd_name: z
        .string()
        .min(1, { message: "Delivery Method Name is required" }),
    delivery_mtd_desc: z
        .string()
        .max(2000, { message: "Delivery Method Guidelines cannot exceed 2000 characters" })
        .optional(),
    bloom_levels: z.array(z.union([z.string(), z.number()])).optional().nullable(),
});

/**
 * Form field configuration for the dynamic form builder
 */
export const getSchemaFields = (
    bloomLevelOptions: { label: string; value: string | number }[] = [],
) => [
    {
        group: "",
        fields: [
            {
                type: "text",
                name: "delivery_mtd_name",
                label: "Delivery Method Name",
                placeholder: "Enter Delivery Method Name",
                required: true,
            },
            {
                type: "multiselect",
                name: "bloom_levels",
                label: "Bloom Level",
                placeholder: "Select Bloom Level",
                options: bloomLevelOptions,
                required: false,
                isMulti: true,
            },
            {
                type: "textarea",
                name: "delivery_mtd_desc",
                label: "Delivery Method Guidelines",
                placeholder: "Delivery Method Guidelines",
                required: false,
                maxLength: 2000,
            },
        ],
    },
];

/**
 * Column definitions for the AG Grid data table
 */
export const SchemaColumnDefs = [
    {
        headerName: "SL No.",
        field: "sl_no",
        valueGetter: "node.rowIndex + 1",
        sortable: false,
        filter: false,
        editable: false,
        width: 80,
        maxWidth: 80,
        cellStyle: { textAlign: "center" },
    },
    {
        headerName: "Delivery Method",
        field: "delivery_mtd_name",
        sortable: true,
        filter: true,
        editable: false,
        flex: 1,
        minWidth: 150,
    },
    {
        headerName: "Delivery Method Guidelines",
        field: "delivery_mtd_desc",
        sortable: true,
        filter: true,
        editable: false,
        flex: 2,
        minWidth: 250,
        wrapText: true,
        autoHeight: true,
        cellStyle: {
            lineHeight: "1.5",
            paddingTop: "10px",
            paddingBottom: "10px",
            whiteSpace: "normal",
            wordBreak: "break-word",
        },
    },
];
