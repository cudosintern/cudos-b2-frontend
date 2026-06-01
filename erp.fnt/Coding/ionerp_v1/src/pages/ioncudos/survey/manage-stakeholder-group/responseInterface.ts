export interface StakeholderGroup {
  stakeholder_group_id: number;
  title: string;
  description?: string;
  status: number;
  created_on?: string;
  created_by?: number;
  modified_on?: string;
  modified_by?: number;
  student_group?: number;
}

export interface StakeholderGroupListResponse {
  data: StakeholderGroup[];
  status: boolean;
}
