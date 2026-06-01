/**
 * Response interface for Bloom's Domain
 * Defines the structure of Bloom's Domain data returned from the API
 */

export interface getBloomDomainList {
  bld_id: number;
  bld_code: string;
  bld_name: string;
  bld_acronym: string;
  bld_description: string;
  status: number;
  created_by: number;
  modified_by: number;
  create_date: string;
  modify_date: string;
}
