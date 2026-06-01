import { z } from "zod";

export const ScaleOptionSchema = z.object({
  option_label: z.string().min(1, { message: "Label is required" }),
  option_value: z.coerce.number().min(0, { message: "Value must be 0 or greater" }),
  sequence: z.coerce.number().min(1, { message: "Sequence must be 1 or greater" }),
});

export const ResponseTemplateSchema = z.object({
  template_name: z
    .string()
    .min(1, { message: "Template Name is required" })
    .max(100, { message: "Template Name cannot exceed 100 characters" }),
  is_outcome_attainment: z.boolean().optional().default(false), // <-- Added this field
  options: z
    .array(ScaleOptionSchema)
    .min(1, { message: "At least one option is required" }),
});