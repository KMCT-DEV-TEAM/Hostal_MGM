import express from 'express';
import {
  createPasswordRequest,
  getPasswordRequests,
  getPasswordRequestById,
  updatePasswordRequest,
  deletePasswordRequest,
} from './passwordRequest.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createPasswordRequest)
  .get(protect, getPasswordRequests);

router.route('/:id')
  .get(protect, getPasswordRequestById)
  .put(protect, updatePasswordRequest)
  .delete(protect, deletePasswordRequest);

export default router;
