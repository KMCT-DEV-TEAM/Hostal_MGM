import * as z from 'zod';
import { emailField } from './common';

export const contactSchema = z.object({
    fullName: z.string().min(1, { message: 'Full Name is required' }),
    email: emailField,
    issueType: z.string().min(1, { message: 'Issue Type is required' }),
    message: z.string().min(10, { message: 'Message must be at least 10 characters long' }),
});
