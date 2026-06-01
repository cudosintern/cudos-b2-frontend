import { z } from "zod";

export const ThresholdSchema = z.object({
  assess_level_name: z.string(),
  assess_level_value: z.number(),
  justify: z.string(),
});