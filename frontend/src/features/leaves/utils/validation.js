import * as z from 'zod';

export const leaveSchema = z.object({
    passType: z.enum(['Home Pass', 'Out Pass']),
    fromDate: z.string().min(1, 'Date is required'),
    toDate: z.string().optional(),
    outTime: z.string().optional(),
    returnTime: z.string().optional(),
    outPassCategory: z.string().optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters')
}).superRefine((data, ctx) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fromDateObj = new Date(data.fromDate);
    if (fromDateObj < today) {
        ctx.addIssue({ path: ['fromDate'], message: 'Date cannot be in the past', code: z.ZodIssueCode.custom });
    }

    if (data.passType === 'Home Pass') {
        if (!data.toDate) {
            ctx.addIssue({ path: ['toDate'], message: 'To date is required', code: z.ZodIssueCode.custom });
        } else {
            const toDateObj = new Date(data.toDate);
            if (toDateObj < fromDateObj) {
                ctx.addIssue({ path: ['toDate'], message: 'To date cannot be before from date', code: z.ZodIssueCode.custom });
            }
        }
    }
    if (data.passType === 'Out Pass') {
        if (!data.outPassCategory) {
            ctx.addIssue({ path: ['outPassCategory'], message: 'Category is required', code: z.ZodIssueCode.custom });
        }
        if (!data.outTime) {
            ctx.addIssue({ path: ['outTime'], message: 'Out time is required', code: z.ZodIssueCode.custom });
        }
        if (!data.returnTime) {
            ctx.addIssue({ path: ['returnTime'], message: 'Return time is required', code: z.ZodIssueCode.custom });
        }
        if (data.outTime && data.returnTime && data.outTime >= data.returnTime) {
            ctx.addIssue({ path: ['returnTime'], message: 'Return time must be after out time', code: z.ZodIssueCode.custom });
        }
    }
});
