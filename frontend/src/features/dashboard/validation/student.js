import * as z from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number");

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const dobSchema = z.string().min(1, "Date of birth is required").refine((dateString) => {
  const dob = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dob < today;
}, { message: "Date of birth cannot be today or in the future" }).refine((dateString) => {
  const dob = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 10;
}, { message: "Student must be at least 10 years old" });

export const createStudentSchema = z.object({
  admissionNo: z.string().min(1, "Admission number is required"),

  name: z.string().min(2, "Name is required").regex(/^[a-zA-Z0-9\s]+$/, "Special characters are not allowed"),

  email: emailSchema,

  parentEmail: emailSchema,

  phone: phoneSchema,

  parentPhone: phoneSchema,

  gender: z.enum(["male", "female", "other"]),

  dob: dobSchema,

  courseId: z.string().min(1, "Course is required"),

  departmentId: z.string().min(1, "Department is required"),

  batchId: z.string().optional(),



  organizationId: z.string().min(1),

  hostelId: z.string().optional(),

  address: z.string().min(1, "Address is required"),

  parentName: z.string().min(2, "Parent name is required").regex(/^[a-zA-Z\s]+$/, "Only alphabets and spaces are allowed"),
  relationship: z.enum(["father", "mother", "guardian"]),

  studentOtp: z.string().length(6),

  parentOtp: z.string().length(6),
});

export const updateStudentSchema = z
  .object({
    name: z.string().min(2, "Name is required").regex(/^[a-zA-Z0-9\s]+$/, "Special characters are not allowed").optional(),
    
    admissionNo: z.string().min(1, "Admission number is required").optional(),

    phone: phoneSchema.optional(),

    gender: z.enum(["male", "female", "other"]).optional(),

    dob: dobSchema.optional(),

    organizationId: z.string().min(1).optional(),

    courseId: z.string().optional(),

    departmentId: z.string().optional(),

    batchId: z.string().optional(),



    hostelId: z.string().optional(),

    address: z.string().min(1, "Address is required").optional(),

    status: z.enum(["active", "inactive"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });