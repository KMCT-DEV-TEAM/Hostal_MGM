import { z } from 'zod';

export const createComplaintSchema = z.object({
  category: z.string().uuid('Invalid category ID'),
  subject: z.string().trim().min(1, 'Subject is required').max(255),
  description: z.string().trim().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'LOW', 'MEDIUM', 'HIGH']).optional().default('Medium')
});

export const updateComplaintSchema = z.object({
  category: z.string().uuid('Invalid category ID').optional(),
  roomNo: z.string().trim().optional(),
  subject: z.string().trim().min(1, 'Subject is required').max(255).optional(),
  description: z.string().trim().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'LOW', 'MEDIUM', 'HIGH']).optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(['Pending', 'In progress', 'Awaiting', 'Resolved', 'Rejected', 'Incomplete', 'PENDING', 'IN_PROGRESS', 'AWAITING', 'RESOLVED', 'REJECTED', 'INCOMPLETE']),
  message: z.string().trim().optional()
});

export const assignStaffSchema = z.object({
  staffId: z.string().uuid('Invalid staff ID')
});

export const submitResolutionSchema = z.object({
  materialsUsed: z.string().trim().optional().nullable(),
  resolutionNotes: z.string().trim().optional().nullable()
});

export const rejectNoteSchema = z.object({
  rejectNote: z.string().trim().optional().nullable()
});

export const internalNoteSchema = z.object({
  note: z.string().trim().min(1, 'Note content is required')
});
