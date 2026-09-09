import express from 'express';
import * as logController from './log.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { restrictTo } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);

router.get(
  '/',
  restrictTo('super_admin', 'admin'),
  logController.getLogs
);

export default router;
