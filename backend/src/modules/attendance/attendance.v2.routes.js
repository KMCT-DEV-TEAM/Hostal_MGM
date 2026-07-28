import express from 'express';
import {
  getAttendanceDashboardV2,
  getAttendanceHistoryV2,
  getAttendanceCalendarV2,
  getAttendanceDetailsV2
} from './attendance.controller.js';
import verifyStudentAccess from '../../middlewares/verifyStudentAccess.middleware.js';

const router = express.Router({ mergeParams: true });

// All V2 attendance routes require the user to be an explicitly linked parent
router.use(verifyStudentAccess);

router.get('/dashboard', getAttendanceDashboardV2);
router.get('/history', getAttendanceHistoryV2);
router.get('/calendar', getAttendanceCalendarV2);
router.get('/details/:date', getAttendanceDetailsV2);

export default router;
