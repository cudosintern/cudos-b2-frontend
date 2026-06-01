import { z } from "zod";

export const StakeholderSchema = z.object({
  stakeholder_group_id: z.coerce
    .number()
    .min(1, { message: "Stakeholder Group is required" }),
  dept_id: z.coerce.number().min(1, { message: "School is required" }),
  pgm_id: z.coerce.number().min(1, { message: "Program is required" }),
  academic_batch_id: z.coerce
    .number()
    .min(1, { message: "Curriculum is required" }),
  first_name: z.string().min(1, { message: "First Name is required" }).max(50),
  last_name: z.string().max(50).optional().default(""),
  email: z.string().email({ message: "Invalid email address" }).max(200),
  contact: z.coerce.number().optional(),
});
