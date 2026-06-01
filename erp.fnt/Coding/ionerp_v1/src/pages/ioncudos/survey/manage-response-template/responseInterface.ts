export interface ScaleOption {
  answer_options_id?: number;
  options: string; // Maps to Answer Option text
  option_val: number; // Maps to Weightage
}

export interface ResponseTemplate {
  answer_template_id: number;
  name: string;
  feedbk_flag: number; // 0: Improvement Survey, 1: Outcome Attainment
  status?: number;
  number_of_options?: number;
  total_weightage?: number;
  options_list: ScaleOption[];
}
