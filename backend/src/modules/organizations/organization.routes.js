import express from 'express';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from './organization.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createOrganization)
  .get(protect, getOrganizations);

router.route('/:id')
  .get(protect, getOrganizationById)
  .put(protect, updateOrganization)
  .delete(protect, deleteOrganization);

export default router;
