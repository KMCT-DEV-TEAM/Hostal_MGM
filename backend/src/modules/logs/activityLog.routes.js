import express from 'express';
import {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  updateActivityLog,
  deleteActivityLog,
} from './activityLog.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createActivityLog)
  .get(protect, getActivityLogs);

router.route('/:id')
  .get(protect, getActivityLogById)
  .put(protect, updateActivityLog)
  .delete(protect, deleteActivityLog);

export default router;
