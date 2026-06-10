import * as z from 'zod';
import { emailField } from './common';

export const forgotPasswordSchema = z.object({
    email: emailField,
});
