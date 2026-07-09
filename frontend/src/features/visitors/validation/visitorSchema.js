import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phone: z.string().min(1, 'Phone number is required').regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    email: z.string().email('Valid email is required'),
    address: z.string().min(1, 'Address is required'),
    idProofType: z.string().min(1, 'ID Proof Type is required'),
    idProofNumber: z.string().min(1, 'ID Proof Number is required'),
});
