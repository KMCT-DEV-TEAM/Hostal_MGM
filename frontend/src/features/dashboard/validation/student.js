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

export const createStudentSchema = z.object({
  studentId: z.string().min(1, "Admission number is required"),
  name: z.string().min(2, "Name is required"),
  email: emailSchema,
  parentEmail: emailSchema,
  phone: phoneSchema,
  parentPhone: phoneSchema,
  gender: z.enum(["male", "female", "other"]),
  dob: z.string().min(1, "Date of birth is required"),
  courseId: z.string().min(1, "Course is required"),
  departmentId: z.string().min(1, "Department is required"),
  batchId: z.string().optional(),
  academicYear: z.string().optional(),
  organizationId: z.string().min(1),
  hostelId: z.string().optional(),
  address: z.string().min(1),
  parentName: z.string().min(1),
  relationship: z.enum(["father", "mother", "guardian"]),
  studentOtp: z.string().length(6),
  parentOtp: z.string().length(6),
});

// Plain object schema, kept separate so it can be safely .pick()-ed from
// in StudentFormModal's field-level live validation.
export const updateStudentObjectSchema = z.object({
  name: z.string().min(2).optional(),
  phone: phoneSchema.optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dob: z.string().optional(),
  courseId: z.string().optional(),
  departmentId: z.string().optional(),
  batchId: z.string().optional(),
  academicYear: z.string().optional(),
  hostelId: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateStudentSchema = updateStudentObjectSchema.refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);