import { z } from "zod";

// Outcome schema
export const OutcomeSchema = z.object({
  po_type_name: z.string().min(1, { message: "Program Outcome Name is required" }),
  //po_type_description: z.string().min(1, { message: "Program Outcome Description is required" }),
  po_type_description: z.string().optional(),
});

export const OutcomeSchemaFields = [
  {
    group: "",
    fields: [
      {
        type: "textarea",
        name: "po_type_name",
        label: "Program Outcome Type Name",
        placeholder: "Enter program outcome name",
        required: true,
        rows: 3,
      },
      {
        type: "textarea",
        name: "po_type_description",
        label: "Description",
        placeholder: "Enter description",
        required: false,
        rows: 10,
      },
    ],
  },
];

// Outcome column definitions
export const OutcomeSchemaColumnDefs = [
  {
    headerName: "Program Outcome Name",
    field: "po_type_name",
    sortable: true,
    filter: true,
    editable: false,
  },
  {
    headerName: "Description",
    field: "po_type_description",
    sortable: true,
    filter: true,
    editable: false,
  },
];
