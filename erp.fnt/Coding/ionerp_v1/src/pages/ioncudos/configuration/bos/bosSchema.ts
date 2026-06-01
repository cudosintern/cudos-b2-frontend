import { z } from "zod";

export const bosSchema = z.object({
    faculty_type: z.string().min(1, "Faculty Type is required"),
    title: z.string().min(1, "Title is required"),
    first_name: z.string().min(1, "First Name is required").regex(/^[a-zA-Z\s.]*$/, "Special characters are not allowed"),
    middle_name: z.string().regex(/^[a-zA-Z\s.]*$/, "Special characters are not allowed").optional().or(z.literal("")),
    last_name: z.string().regex(/^[a-zA-Z\s.]*$/, "Special characters are not allowed").optional().or(z.literal("")),

    organization: z.string().min(1, "Organization is required").regex(/^[a-zA-Z0-9\s.,&()-]*$/, "Special characters are not allowed"),
    email: z.string().min(1, "Email is required").email("Invalid email format"),

    mobile: z.string().regex(/^[0-9]*$/, "Only numbers are allowed").regex(/^(\d{10})?$/, "Mobile number must be exactly 10 digits").optional().or(z.literal("")),
    aadhar_number: z.string().regex(/^[0-9]*$/, "Only numbers are allowed").regex(/^(\d{12})?$/, "Aadhaar number must be exactly 12 digits").optional().or(z.literal("")),

    highest_qualification: z.string().regex(/^[a-zA-Z0-9\s.,-]*$/, "Special characters are not allowed").optional().or(z.literal("")),
    experience: z.preprocess((val) => Number(val), z.number().min(0, "Experience must be positive")).optional(),

    password: z.string().optional().or(z.literal("")).refine(val => !val || val.length >= 6, {
        message: "Password must be at least 6 characters",
    }),
    designation: z.string().min(1, "Designation is required"),
    bos_for: z.string().min(1, "BoS For is required"),
});

export type BosFormData = z.infer<typeof bosSchema>;

export const bosFormFields = [
    { name: "faculty_type", label: "Faculty Type", type: "select", options: [{ label: "Teaching", value: "Teaching" }, { label: "Non-Teaching", value: "Non-Teaching" }], required: true },
    { name: "title", label: "Title", type: "select", options: [{ label: "Mr.", value: "Mr." }, { label: "Mrs.", value: "Mrs." }, { label: "Ms.", value: "Ms." }, { label: "Dr.", value: "Dr." }, { label: "Prof.", value: "Prof." }], required: true },
    { name: "first_name", label: "First Name", type: "text", required: true },
    { name: "middle_name", label: "Middle Name", type: "text" },
    { name: "last_name", label: "Last Name", type: "text" },
    { name: "organization", label: "Organization", type: "text", required: true },
    { name: "email", label: "Email Id", type: "email", required: true },
    { name: "mobile", label: "Contact Number", type: "text" },
    { name: "aadhar_number", label: "Aadhaar Number", type: "text" },
    { name: "highest_qualification", label: "Highest Qualification", type: "text" },
    { name: "experience", label: "Experience (In Years)", type: "number" },
    { name: "password", label: "Password", type: "password" },
    { name: "designation", label: "Designation", type: "select", options: [{ label: "HoD", value: "HoD" }, { label: "Professor", value: "Professor" }, { label: "Assistant Professor", value: "Assistant Professor" }], required: true },
    {
        name: "bos_for",
        label: "BoS for",
        type: "select",
        options: [
            { label: "Select School", value: "" },
            { label: "Computer Science & Engineering", value: "Computer Science & Engineering" },
            { label: "Electronics & Communication", value: "Electronics & Communication" },
            { label: "Computer Science and Engineering", value: "Computer Science and Engineering" },
            { label: "Information Technology", value: "Information Technology" },
            { label: "Electronics and Communication Engineering", value: "Electronics and Communication Engineering" },
            { label: "Electronics and Electrical Engineering", value: "Electronics and Electrical Engineering" },
            { label: "Mechanical Engineering", value: "Mechanical Engineering" },
            { label: "Civil Engineering", value: "Civil Engineering" },
            { label: "Artificial Intelligence and Data Science", value: "Artificial Intelligence and Data Science" },
            { label: "Computer Science (AI & ML)", value: "Computer Science (AI & ML)" },
            { label: "Computer Science (Cyber Security)", value: "Computer Science (Cyber Security)" },
            { label: "Mathematics", value: "Mathematics" },
            { label: "Physics", value: "Physics" },
            { label: "Chemistry", value: "Chemistry" }
        ],
        required: true
    },
];
