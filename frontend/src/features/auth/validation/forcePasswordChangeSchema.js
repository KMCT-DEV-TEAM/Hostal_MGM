import * as z from 'zod';
import { passwordField } from './common';

export const forcePasswordChangeSchema = z.object({
    oldPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, { message: 'Please confirm your password' })
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});
