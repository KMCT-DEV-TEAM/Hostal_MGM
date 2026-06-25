import * as z from 'zod';

export const leaveSchema = z.object({
    passType: z.enum(['Home Pass', 'Out Pass']),
    fromDate: z.string().min(1, 'Date is required'),
    toDate: z.string().optional(),
    outTime: z.string().optional(),
    returnTime: z.string().optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters')
}).superRefine((data, ctx) => {
    if (data.passType === 'Home Pass') {
        if (!data.toDate) {
            ctx.addIssue({ path: ['toDate'], message: 'To date is required', code: z.ZodIssueCode.custom });
        }
    }
    if (data.passType === 'Out Pass') {
        if (!data.outTime) {
            ctx.addIssue({ path: ['outTime'], message: 'Out time is required', code: z.ZodIssueCode.custom });
        }
        if (!data.returnTime) {
            ctx.addIssue({ path: ['returnTime'], message: 'Return time is required', code: z.ZodIssueCode.custom });
        }
    }
});
