import { z } from "zod";

/**
 * Zod validation schema for a single Map Level Weightage item.
 * This is not used for form validation directly, but as a part of the main schema.
 */
export const mapLevelWeightageItemSchema = z.object({
  id: z.number(),
  map_level_name: z.string(),
  acronym: z.coerce
    .number({
      required_error: "Acronym is required.",
      invalid_type_error: "Acronym must be a number.",
    })
    .min(1, { message: "Acronym is required" }),
  weightage: z.coerce
    .number({
      required_error: "Weightage is required.",
      invalid_type_error: "Weightage must be a number.",
    })
    .min(0, { message: "Weightage must be non-negative" })
    .max(100, { message: "Weightage cannot exceed 100" }),
  status: z.boolean(),
});

/**
 * Zod validation schema for the Map Level Weightage form.
 * It validates an array of weightage items and the total weightage.
 */
export const mapLevelWeightageSchema = z.object({
  weightages: z.array(mapLevelWeightageItemSchema),
}).refine(
    (data) => {
        const activeItems = data.weightages.filter((item) => item.status);
        if (activeItems.length === 0) return true; // Pass validation if no items are active, another rule will catch it
        const totalWeightage = activeItems.reduce((acc, item) => acc + item.weightage, 0);
        return Math.abs(totalWeightage - 100) < 0.01; // Use tolerance for floating point comparison
    },
    {
        message: "Total weightage for active levels must be exactly 100%",
        path: ["root"], // Associate error with a specific field if needed
    }
).refine(
    (data) => {
        return data.weightages.some((item) => item.status);
    },
    {
        message: "At least one map level must be active.",
        path: ["root"], // Global error
    }
);

/**
 * Type definition for the form values, inferred from the Zod schema.
 */
export type MapLevelWeightageFormValues = z.infer<typeof mapLevelWeightageSchema>;



