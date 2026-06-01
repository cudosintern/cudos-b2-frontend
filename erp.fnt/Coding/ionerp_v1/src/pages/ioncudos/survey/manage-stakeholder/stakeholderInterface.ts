export interface StakeholderDetail {
  stakeholder_detail_id: number;
  stakeholder_group_id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact?: number;
  qualification?: string;
  academic_batch_id?: number;
  student_usn?: string;
  dept_id?: number;
  pgm_id?: number;
  status: number;
}
