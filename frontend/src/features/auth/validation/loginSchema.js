import * as z from 'zod';
import { emailField, passwordField } from './common';

export const superAdminSchema = z.object({
    email: emailField,
    password: passwordField,
});

export const userLoginSchema = z.object({
    role: z.enum(['student', 'parent'], {
        errorMap: () => ({ message: 'Please select a valid role' })
    }),
    email: emailField,
    password: passwordField,
});

export const adminLoginSchema = z.object({
    role: z.enum(['admin', 'warden'], {
        errorMap: () => ({ message: 'Please select a valid role' })
    }),
    email: emailField,
    password: passwordField,
});

export const maintenanceStaffLoginSchema = z.object({
    role: z.literal('maintenance_staff'),
    email: emailField,
    password: passwordField,
});
