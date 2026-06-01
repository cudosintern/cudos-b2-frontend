import { z } from "zod";

/**
 * Zod schema strictly following cudos_qp_definition table
 */
export const AssessmentSchema = z.object({
  qpd_id: z.number().optional(),

  qpf_id: z.number().optional(),
  qpd_type: z.number().optional(),
  cia_model_qp: z.number().optional(),

  qp_rollout: z.number().optional(),

  academic_batch_id: z.number().optional(),
  semester_id: z.number().optional(),
  crs_id: z.number().optional(),

  lms_ciatee_stud_avg_score: z.number().optional(),

  qpd_title: z.string().max(100).optional(),
  qpd_timing: z.string().max(20).optional(),

  qpd_gt_marks: z.number().optional(),
  qpd_max_marks: z.number().optional(),

  qpd_notes: z.string().optional(),
  qpd_num_units: z.number().optional(),

  rubrics_flag: z.number().optional(),
  ao_method_id: z.number().optional(),

  created_by: z.number().optional(),
  modified_by: z.number().optional(),
});