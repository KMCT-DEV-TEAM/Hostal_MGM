import { z } from 'zod';

export const createComplaintCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(255),
  description: z.string().trim().optional().nullable(),
});

export const updateComplaintCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(255).optional(),
  description: z.string().trim().optional().nullable(),
});

export const bulkToggleStatusSchema = z.object({
  ids: z.array(z.string().uuid('Invalid category ID')).min(1, 'Please provide an array of category IDs'),
  isActive: z.boolean({ required_error: 'isActive boolean value is required' }),
});
