import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  getPasswordRequests,
  approvePasswordRequest,
  rejectPasswordRequest,
} from './passwordRequest.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getPasswordRequests);
router.patch('/:id/approve', approvePasswordRequest);
router.patch('/:id/reject', rejectPasswordRequest);

export default router;
