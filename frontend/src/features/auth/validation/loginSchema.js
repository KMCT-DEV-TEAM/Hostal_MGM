import * as z from 'zod';
import { emailField, passwordField } from './common';

export const superAdminSchema = z.object({
    email: emailField,
    password: passwordField,
});

export const userLoginSchema = z.object({
    email: emailField,
    password: passwordField,
});

export const adminLoginSchema = z.object({
    adminId: z.string().min(1, { message: 'Admin ID is required' }),
    password: passwordField,
});
