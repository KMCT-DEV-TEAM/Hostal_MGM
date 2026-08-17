import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization
} from './organization.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createOrganization)
  .get(getOrganizations);

router.route('/:id')
  .get(getOrganizationById)
  .put(updateOrganization)
  .delete(deleteOrganization);

export default router;
