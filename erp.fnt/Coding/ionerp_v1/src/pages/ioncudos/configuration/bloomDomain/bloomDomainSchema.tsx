import { z } from "zod";

/**
 * Zod validation schema for Bloom's Domain form
 * Defines validation rules for creating/editing Bloom's Domain entries
 */
export const Schema = z.object({
  bld_name: z
    .string()
    .min(1, { message: "Bloom's Domain Name is required" }),
  // bld_acronym: z
  //   .string()
  //   .min(1, { message: "Bloom's Domain Acronym is required" }),

  bld_acronym: z
  .string()
  .min(1, { message: "Bloom's Domain Acronym is required" })
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\s-]+$/,
    {
      message:
        "Bloom's Domain Acronym must contain both letters and numbers",
    }
  ),
  bld_description: z
    .string()
    //.min(1, { message: "Description is required" }),
    .nullable()
    .optional(),
});

/**
 * Form field configuration for the dynamic form builder
 * Defines the structure and properties of form inputs
 */
export const SchemaFields = [
  {
    group: "",
    fields: [
      {
        type: "text",
        name: "bld_name",
        label: "Bloom's Domain Name",
        placeholder: "Enter Bloom's Domain Name (e.g., Cognitive domain)",
        required: true,
      },
      {
        type: "text",
        name: "bld_acronym",
        label: "Bloom's Domain Acronym",
        placeholder: "Enter Acronym (e.g., L1 - L5)",
        required: true,
      },
      {
        type: "textarea",
        name: "bld_description",
        label: "Description",
        placeholder: "Enter detailed description of the domain",
        required: false,
      },
    ],
  },
];

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
  headerName: "Bloom's Domain",
  field: "bld_name",
  sortable: true,
  filter: true,
  editable: false,
  flex: 1,
  minWidth: 120,
  wrapText: true,
  autoHeight: true,
  cellStyle: {
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
},
  {
    headerName: "Bloom's Domain Acronym",
    field: "bld_acronym",
    sortable: true,
    filter: true,
    editable: false,
    width: 200,
    maxWidth: 200,
  },
  {
    headerName: "Description",
    field: "bld_description",
    sortable: true,
    filter: true,
    editable: false,
    flex: 2,
    minWidth: 500,
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
