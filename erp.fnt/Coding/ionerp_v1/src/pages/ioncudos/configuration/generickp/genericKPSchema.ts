import { z } from "zod";

export const GenericKPSchemaFields = [
  {
    group: "",
    fields: [
      {
        name: "okp_attr_code",
        label: "Attribute Code",
        type: "text",
        required: true,
        placeholder: "Enter Attribute Code",
      },
      {
        name: "okp_attr_description",
        label: "Attribute Description",
        type: "textarea",
        required: true,
        maxLength: 5000,
        placeholder: "Enter Attribute Description",
      },
    ],
  },
];

export const GenericKPSchema = z.object({
  okp_attr_code: z.string().min(1, "Attribute Code is required"),
  okp_attr_description: z.string().min(1, "Attribute Description is required").max(5000, "Description too long"),
});

export default GenericKPSchema;
