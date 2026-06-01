import { z } from "zod";

export const StakeholderGroupSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Stakeholder Group Title is required" })
    .max(256, { message: "Title cannot exceed 256 characters" }),
  description: z
    .string()
    .max(2000, { message: "Description cannot exceed 2000 characters" })
    .optional(),
});

export const StakeholderGroupFields = [
  {
    group: "",
    fields: [
      {
        type: "text",
        name: "title",
        label: "Stakeholder Group Title",
        placeholder: "Enter group title (e.g., Alumni, Students)",
        required: true,
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "Enter brief description...",
        required: false,
        rows: 3,
      },
    ],
  },
];
