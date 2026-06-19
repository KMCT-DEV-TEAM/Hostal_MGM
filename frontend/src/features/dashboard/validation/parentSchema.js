import * as z from 'zod';

export const baseParentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    relation: z.enum(["father", "mother", "guardian"], {
        errorMap: () => ({ message: "Please select a valid relation" })
    }),
});

export const addParentSchema = baseParentSchema.extend({
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    studentId: z.string().min(1, "Please select a linked student"),
});

export const editParentSchema = baseParentSchema;
