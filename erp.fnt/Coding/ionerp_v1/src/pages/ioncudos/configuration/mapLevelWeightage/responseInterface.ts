// /**
//  * Response interface for Map Level Weightage
//  * Defines the structure of map level weightage data returned from the API
//  */
// export interface MapLevelWeightage {
//   id: number;
//   map_level_name: string;
//   acronym: number;
//   weightage: number;
//   status: boolean;
// }

// /**
//  * Payload interface for updating Map Level Weightage
//  */
// export interface UpdateMapLevelWeightagePayload {
//   id: number;
//   acronym: number;
//   weightage: number;
//   status: boolean;
// }

export interface MapLevelWeightageItem {
    mlw_id?: number;
    map_level_name: string;
    map_level_short_form: string;
    map_level_name_alias?: string;
    map_level?: number;
    map_level_weightage: number;
    status: number;
    created_by?: number;
    created_date?: string;
    modified_by?: number;
    modified_date?: string;
}