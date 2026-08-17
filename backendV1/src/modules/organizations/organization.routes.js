import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  bulkUpdateOrganizationStatus
} from './organization.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createOrganization)
  .get(getOrganizations);

router.patch('/bulk-status', bulkUpdateOrganizationStatus);
router.patch('/:id/toggle-status', deleteOrganization);

router.route('/:id')
  .get(getOrganizationById)
  .patch(updateOrganization)
  .delete(deleteOrganization);

export default router;
