import { z } from "zod";

// Program Mode schema
export const ProgramModeSchema = z.object({
    program_mode_name: z.string().min(1, { message: "Program Mode Name is required" }),
    program_mode_description: z.string().max(2000, { message: "Description must be less than 2000 characters" }).optional().or(z.literal("")),
});

export const ProgramModeSchemaFields = [
    {
        group: "",
        fields: [
            {
                type: "textarea",
                name: "program_mode_name",
                label: "Program Mode Name",
                placeholder: "Enter Program Mode Name",
                required: true,
                rows: 3,
            },
            {
                type: "textarea",
                name: "program_mode_description",
                label: "Description",
                placeholder: "Enter description",
                required: false,
                rows: 10,
            },
        ],
    },
];

// Program Mode column definitions
export const ProgramModeColumnDefs = [
    {
        headerName: "Program Mode Name",
        field: "program_mode_name",
        sortable: true,
        filter: true,
        editable: false,
    },
    {
        headerName: "Description",
        field: "program_mode_description",
        sortable: true,
        filter: true,
        editable: false,
    },
];
