import { z } from "zod";

export const Schema = z.object({
  crs_domain_name: z
    .string()
    .min(1, { message: "Course Specialization Name is required" }),
  crs_domain_description: z.string().optional().nullable(),
});

export const SchemaFields = [
  {
    group: "",
    fields: [
      {
        type: "text",
        name: "crs_domain_name",
        label: "Course Specialization Name",
        placeholder: "Enter Course Specialization Name",
        required: true,
      },
      {
        type: "textarea",
        name: "crs_domain_description",
        label: "Course Specialization Description (Optional)",
        placeholder: "Enter Description",
        required: false,
      },
    ],
  },
];

export const SchemaColumnDefs = [
  {
    headerName: "SL No.",
    field: "sl_no",
    valueGetter: "node.rowIndex + 1",
    sortable: false,
    filter: false,
    editable: false,
    width: 60,
    maxWidth: 80,
    cellStyle: { textAlign: "center", padding: "0 5px" },
  },
  {
    headerName: "Course Specialization Name",
    field: "crs_domain_name",
    sortable: true,
    filter: true,
    editable: false,
    minWidth: 200,
    wrapHeaderText: true,
    autoHeaderHeight: true,
  },
  {
    headerName: "Course Specialization Description",
    field: "crs_domain_description",
    sortable: true,
    filter: true,
    editable: false,
    flex: 1,
    minWidth: 300,
    wrapText: true,
    autoHeight: true,
  },
];
