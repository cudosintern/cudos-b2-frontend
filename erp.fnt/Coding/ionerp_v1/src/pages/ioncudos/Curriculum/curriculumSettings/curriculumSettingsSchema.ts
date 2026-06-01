import { z } from "zod";

export const curriculumImportSchema = z.object({
    program_id: z.number({
        required_error: "Program is required",
        invalid_type_error: "Program is required"
    }).min(1, "Program is required"),

    regulation_id: z.number({
        required_error: "Regulation is required",
        invalid_type_error: "Regulation is required"
    }).min(1, "Regulation is required"),

    academic_year: z.string().min(1, "Academic Year is required"),

    description: z.string().optional(),

    file: z.instanceof(File, { message: "File is required" })
        .refine((file) => file.size > 0, "File cannot be empty")
    // Add file type validation if needed, e.g. .csv, .xlsx
    // .refine((file) => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(file.type), "Invalid file type")
});

export type CurriculumImportFormValues = z.infer<typeof curriculumImportSchema>;
