export interface KP {
  pkp_id: number;
  pgm_id: number;
  pkp_attr_code: string;
  pkp_attr_description: string;
  created_by?: number;
  modified_by?: number;
  created_date?: string;
  modified_date?: string;
}

export interface Program {
  pgm_id: number;
  pgm_title: string;
}

export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}

export interface FormType {
  pkp_attr_code: string;
  pkp_attr_description: string;
}

