import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createLog,
  getLogs,
  getLogById,
  updateLog,
  deleteLog
} from './log.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createLog)
  .get(getLogs);

router.route('/:id')
  .get(getLogById)
  .put(updateLog)
  .delete(deleteLog);

export default router;
