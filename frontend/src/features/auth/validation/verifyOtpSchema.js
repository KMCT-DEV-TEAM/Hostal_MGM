import * as z from 'zod';

export const verifyOtpSchema = z.object({
    otp: z.string().length(6, { message: 'OTP must be exactly 6 digits' }),
});
