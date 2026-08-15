import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createPasswordRequest,
  getPasswordRequests,
  getPasswordRequestById,
  updatePasswordRequest,
  deletePasswordRequest
} from './passwordRequest.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createPasswordRequest)
  .get(getPasswordRequests);

router.route('/:id')
  .get(getPasswordRequestById)
  .put(updatePasswordRequest)
  .delete(deletePasswordRequest);

export default router;
