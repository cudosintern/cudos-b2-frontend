import { z } from "zod";

export const QuestionTypeSchema = z.object({
  question_type_name: z
    .string()
    .min(1, { message: "Question Type Name is required" })
    .max(250, { message: "Question Type cannot exceed 250 characters" }),
  description: z
    .string()
    .max(2000, { message: "Description cannot exceed 2000 characters" })
    .optional(),
});

export const QuestionTypeFields = [
  {
    group: "",
    fields: [
      {
        type: "text",
        name: "question_type_name",
        label: "Question Type Name",
        placeholder: "Enter Question Type Name",
        required: true,
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "Enter description...",
        required: false,
        rows: 3,
      },
    ],
  },
];
