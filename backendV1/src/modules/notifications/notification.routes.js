import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';

const router = express.Router();

router.use(protect);

router.get('/', (req, res) => {
  return sendSuccess(res, 200, 'Notifications retrieved successfully', {
    count: 0,
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    data: []
  });
});

export default router;
