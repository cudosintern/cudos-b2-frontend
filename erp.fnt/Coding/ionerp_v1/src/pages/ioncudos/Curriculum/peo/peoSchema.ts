import { z } from "zod";

/**
 * Zod validation schema for PEO form
 * Defines validation rules for creating/editing PEO entries
 */
export const Schema = z.object({
  peo_reference: z
    .string()
    .min(1, { message: "PEO Code is required" }),
  peo_statement: z
    .string()
    .min(1, { message: "PEO Statement is required" }),
  academic_batch_id: z
    .coerce.number()
    .min(1, { message: "Curriculum is required" }),
  attendees_name: z
    .string()
    .min(1, { message: "Attendees Name is required" }),
  meeting_notes: z
    .string()
    .optional()
    .or(z.literal("")),
});



/**
 * Column definitions for the AG Grid data table
 * Configures how data is displayed in the table
 */
export const SchemaColumnDefs = [
  {
    headerName: "SL No.",
    field: "sl_no",
    valueGetter: "node.rowIndex + 1",
    sortable: false,
    filter: false,
    editable: false,
    width: 55,
    maxWidth: 80,
    cellStyle: { textAlign: "center", padding: "0 5px" },
  },
  {
    headerName: "PEO Code",
    field: "peo_reference",
    sortable: true,
    filter: true,
    editable: false,
    width: 160,
    maxWidth: 160,
  },
  {
    headerName: "PEO Statement",
    field: "peo_statement",
    sortable: true,
    filter: true,
    editable: false,
    flex: 2,
    minWidth: 400,
    wrapText: true,
    cellStyle: {
      lineHeight: "1.5",
      paddingTop: "10px",
      paddingBottom: "10px",
      whiteSpace: "normal",
      wordBreak: "break-word",
    },
  },
];

export default Schema;
