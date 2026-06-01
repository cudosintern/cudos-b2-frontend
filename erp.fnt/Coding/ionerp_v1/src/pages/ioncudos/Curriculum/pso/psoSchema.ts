import { z } from "zod";
import { ColDef } from "ag-grid-community";

/**
 * Zod validation schema for PSO form
 * Uses exact column names from cudos_po database table
 * Backend uses academic_batch_id (not crclm_id)
 * Backend does NOT have atype_id field
 */
export const Schema = z.object({
  po_code: z
    .string()
    .min(1, { message: "PO/PSO Code is required" }),
  po_reference: z
    .string()
    .optional(),
  pso_flag: z
    .coerce.number()
    .default(0),
  po_statement: z
    .string()
    .min(1, { message: "PO/PSO Statement is required" }),
  po_type_id: z
    .coerce.number()
    .optional(),
  academic_batch_id: z
    .coerce.number()
    .min(1, { message: "Academic Batch is required" }),
  state_id: z
    .coerce.number()
    .default(1),
  justify: z
    .string()
    .optional(),
  accreditation_type: z.any().optional(),
  kp_mapping: z.any().optional(),
});

/**
 * Alias for Schema to match import in psoPage
 */
export const PsoSchema = Schema;
export const MultiPsoSchema = z.object({
  pos: z.array(Schema)
});

/**
 * Column definitions for the AG Grid data table
 * Uses exact column names from cudos_po database table
 */
export const SchemaColumnDefs: ColDef[] = [
  {
    headerName: "SL No",
    field: "sl_no",
    valueGetter: "node.rowIndex + 1",
    sortable: false,
    filter: false,
    editable: false,
    width: 55,
    maxWidth: 80,
    cellStyle: { textAlign: "center" as const, padding: "0 5px" },
  },
  {
    headerName: "PO Code",
    field: "po_code",
    sortable: true,
    filter: true,
    editable: false,
    width: 100,
    maxWidth: 120,
  },
  {
    headerName: "PO Reference",
    field: "po_reference",
    sortable: true,
    filter: true,
    editable: false,
    width: 120,
    maxWidth: 140,
  },
  {
    headerName: "PO/PSO Statement",
    field: "po_statement",
    sortable: true,
    filter: true,
    editable: false,
    flex: 2,
    minWidth: 400,
    wrapText: true,
    //wrapText: true,
    autoHeight: true,
    cellStyle: {
      lineHeight: "1.5",
      paddingTop: "10px",
      paddingBottom: "10px",
      whiteSpace: "normal" as const,
      wordBreak: "break-word",
    },
  },
  {
    headerName: "PO Type",
    field: "po_type_id",
    sortable: true,
    filter: true,
    editable: false,
    flex: 1,
    minWidth: 250,
    wrapText: false,
  },
];

export default Schema;
