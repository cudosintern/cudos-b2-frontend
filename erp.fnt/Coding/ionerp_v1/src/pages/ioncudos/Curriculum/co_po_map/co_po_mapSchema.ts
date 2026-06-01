import { z } from "zod";

/**
 * Zod schema strictly following cudos_clo_po_map table
 */

export const CoPoMapSchema = z.object({
  clo_id: z.number().min(1, "CLO is required"),
  po_id: z.number().min(1, "PO is required"),
  academic_batch_id: z.number().optional(),
  crs_id: z.number().optional(),
  pi_id: z.number().optional(),
  msr_id: z.number().optional(),
  map_level: z.string().optional(),
  justification: z.string().optional(),
  created_by: z.number().optional(),
  modified_by: z.number().optional(),
});

/**
 * Matrix Column Definitions for CO-PO Mapping
 * Note: These are not used for DataTable but for reference
 */
export const SchemaColumnDefs = [
  {
    headerName: "SL No",
    field: "sl_no",
    valueGetter: "node.rowIndex + 1",
    width: 80,
  },
  {
    headerName: "CLO ID",
    field: "clo_id",
    sortable: true,
    filter: true,
  },
  {
    headerName: "PO ID",
    field: "po_id",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Map Level",
    field: "map_level",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Justification",
    field: "justification",
    flex: 2,
  },
];

/**
 * Map Level Options
 */
export const MAP_LEVEL_OPTIONS = [
  { value: 0, label: "-" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
];
