export interface GenericKP {
  okp_id: number;
  okp_attr_code: string;
  okp_attr_description: string;
  created_by?: number;
  modified_by?: number;
  created_date?: string;
  modified_date?: string;
}

export interface GenericKPListResponse {
  data: GenericKP[];
  total?: number;
}
