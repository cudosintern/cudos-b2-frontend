import axiosInstance from "../../../../utils/api";
import { z } from "zod";
import {
  ApiResponse,
  Curriculum,
  Semester,
  Course,
  BloomLevel,
  DeliveryMethod,
  CourseOutcome,
  SaveCourseOutcomePayload
} from "./types";

export const normalize = (s: string) =>
  (s || "").trim().toLowerCase().replace(/\s+/g, " ");

// Schema for Course Outcome
export const getValidationSchema = (coList: any[], currentId?: number) => {
  return z.object({
    co_code_id: z.union([z.string(), z.number()]).refine(val => val !== "" && val !== 0, {
      message: "CO Code is required",
    }),
    co_statement: z.string().min(1, { message: "Course Outcome Statement is required" }),
    bloom_level_ids: z.array(z.number()).min(1, { message: "Bloom's Level is required" }),
    delivery_method_ids: z.array(z.number()).min(1, { message: "Delivery Method is required" }),
  }).superRefine((data, ctx) => {
    const codeStr = String(data.co_code_id); // In this context, the value is the code string itself
    const normalizedCode = normalize(codeStr);
    const normalizedStmt = normalize(data.co_statement);

    const duplicateCode = coList.some(
      co => co.id !== currentId && normalize(co.co_code) === normalizedCode
    );

    const duplicateStmt = coList.some(
      co => co.id !== currentId && normalize(co.co_statement) === normalizedStmt
    );

    if (duplicateCode) {
      ctx.addIssue({
        path: ["co_code_id"],
        code: "custom",
        message: "This CO code is already in use. Please choose a different code."
      });
    }

    if (duplicateStmt) {
      ctx.addIssue({
        path: ["co_statement"],
        code: "custom",
        message: "This outcome statement already exists. Please enter a unique statement."
      });
    }
  });
};

export const Schema = z.object({
  co_code_id: z.union([z.string(), z.number()]).refine(val => val !== "" && val !== 0, {
    message: "CO Code is required",
  }),
  co_statement: z.string().min(1, { message: "Course Outcome Statement is required" }),
  bloom_level_ids: z.array(z.number()).min(1, { message: "Bloom's Level is required" }),
  delivery_method_ids: z.array(z.number()).min(1, { message: "Delivery Method is required" }),
});

export const SchemaFields = [
  {
    group: "",
    fields: [
      {
        type: "multiselect",
        name: "co_code_id",
        label: "CO Code",
        placeholder: "Select CO Code",
        required: true,
        isMulti: false,
        options: [], // To be populated dynamically
      },
      {
        type: "multiselect",
        name: "bloom_level_ids",
        label: "Bloom's Level",
        placeholder: "Select Bloom's Level",
        required: true,
        isMulti: true,
        options: [], // To be populated dynamically
      },
      {
        type: "multiselect",
        name: "delivery_method_ids",
        label: "Delivery Method",
        placeholder: "Select Delivery Method",
        required: true,
        isMulti: true,
        options: [], // To be populated dynamically
      },
      {
        type: "textarea",
        name: "co_statement",
        label: "Course Outcome Statement",
        placeholder: "Enter the specific outcome for this course...",
        required: true,
      },
    ],
  },
];

export const SchemaColumnDefs = [
  {
    headerName: "CO Code",
    field: "co_code",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Course Outcome Statement",
    field: "co_statement",
    sortable: true,
    filter: true,
    flex: 2,
  },
  {
    headerName: "Bloom's Level",
    field: "bloom_levels_names", // We'll pre-process this
    sortable: true,
    filter: true,
  },
  {
    headerName: "Delivery Method",
    field: "delivery_methods_names", // We'll pre-process this
    sortable: true,
    filter: true,
  },
];

const COURSE_OUTCOME_API = `/course-outcome`;
const COMPETENCIES_API = `/competencies_pis`;
const CO_PO_MAPPING_API = `/co_po_mapping`;

export const getCurriculumList = async (): Promise<ApiResponse<Curriculum[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Curriculum[]>>(`${COURSE_OUTCOME_API}/curriculum`);
    return response.data;
  } catch (error) {
    console.error("Error fetching curriculum list", error);
    return { status: false, message: "Error fetching curriculum data", data: [] };
  }
};

export const getSemesterList = async (batchId: number): Promise<ApiResponse<Semester[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Semester[]>>(`${COURSE_OUTCOME_API}/semesters`, {
      params: { academic_batch_id: batchId }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching semester list", error);
    return { status: false, message: "Error fetching semester data", data: [] };
  }
};

export const getCourseList = async (batchId: number, semesterId: number): Promise<ApiResponse<Course[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Course[]>>(`${COURSE_OUTCOME_API}/courses`, {
      params: { semester_id: semesterId }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching course list", error);
    return { status: false, message: "Error fetching course data", data: [] };
  }
};

export const getCoCodes = async (): Promise<ApiResponse<string[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<string[]>>(`${COURSE_OUTCOME_API}/co-codes`);
    return response.data;
  } catch (error) {
    console.error("Error fetching CO codes", error);
    return { status: false, message: "Error fetching CO codes", data: [] };
  }
};

export const getBloomLevels = async (): Promise<ApiResponse<BloomLevel[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<BloomLevel[]>>(`${COURSE_OUTCOME_API}/bloom-levels`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bloom levels", error);
    return { status: false, message: "Error fetching bloom levels", data: [] };
  }
};

export const getDeliveryMethods = async (): Promise<ApiResponse<DeliveryMethod[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<DeliveryMethod[]>>(`${COURSE_OUTCOME_API}/delivery-methods`);
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery methods", error);
    return { status: false, message: "Error fetching delivery methods", data: [] };
  }
};

export const getCourseOutcomeList = async (batchId: number, semesterId: number, courseId: number): Promise<ApiResponse<CourseOutcome[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<CourseOutcome[]>>(`${COURSE_OUTCOME_API}/list`, {
      params: {
        academic_batch_id: batchId,
        semester_id: semesterId,
        crs_id: courseId
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching course outcomes", error);
    return { status: false, message: "Error fetching course outcomes", data: [] };
  }
};

export const saveCourseOutcome = async (payload: SaveCourseOutcomePayload): Promise<ApiResponse<any>> => {
  try {
    const response = await axiosInstance.post<ApiResponse<any>>(`${COURSE_OUTCOME_API}/save-co`, payload);
    return response.data;
  } catch (error) {
    console.error("Error saving course outcome", error);
    return { status: false, message: "Error saving course outcome", data: null };
  }
};

export const editCourseOutcome = async (payload: SaveCourseOutcomePayload): Promise<ApiResponse<any>> => {
  try {
    const response = await axiosInstance.post<ApiResponse<any>>(`${COURSE_OUTCOME_API}/edit-co`, payload);
    return response.data;
  } catch (error) {
    console.error("Error editing course outcome", error);
    return { status: false, message: "Error editing course outcome", data: null };
  }
};

export const deleteCourseOutcome = async (cloId: number, status?: number): Promise<ApiResponse<any>> => {
  try {
    if (status !== undefined) {
      // Activate / Deactivate via soft delete endpoint
      const response = await axiosInstance.post<ApiResponse<any>>("comman_function/soft_delete", {
        flag: "course_outcome",
        record_id: cloId,
        status,
      });
      return response.data;
    }
    // Hard delete
    const response = await axiosInstance.delete<ApiResponse<any>>(`${COURSE_OUTCOME_API}/delete/${cloId}`);
    return response.data;
  } catch (error) {
    console.error("Error updating course outcome", error);
    return { status: false, message: "Error updating course outcome", data: null };
  }
};

export const importCourseData = async (payload: any): Promise<ApiResponse<any>> => {
  try {
    const response = await axiosInstance.post<ApiResponse<any>>(`${COURSE_OUTCOME_API}/import-course-data`, payload);
    return response.data;
  } catch (error) {
    console.error("Error importing course data", error);
    return { status: false, message: "Error importing course data", data: null };
  }
};
