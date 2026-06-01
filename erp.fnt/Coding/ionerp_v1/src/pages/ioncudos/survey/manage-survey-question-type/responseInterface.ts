export interface SurveyQuestionType {
  question_type_id: number;
  question_type_name: string;
  description?: string;
  status: number;
  modify_date?: string;
  modified_by?: number;
}

export interface QuestionTypeListResponse {
  data: SurveyQuestionType[];
  status: boolean;
}
