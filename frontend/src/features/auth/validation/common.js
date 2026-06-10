import * as z from 'zod';

export const emailField = z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' });
export const passwordField = z.string().min(1, { message: 'Password is required' });
