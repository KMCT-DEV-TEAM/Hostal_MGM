import express from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import attendanceV2Router from '../attendance/attendance.v2.routes.js';
import passV2Router from '../passes/pass.v2.routes.js';
import visitorV2Router from '../visitor/visitor.v2.routes.js';
import dashboardV2Router from '../dashboard/dashboard.v2.routes.js';
import profileV2Router from '../profile/profile.v2.routes.js';
import notificationV2Router from '../notifications/notification.v2.routes.js';

const v2Router = express.Router();

// All V2 routes must be authenticated globally at this entry point
v2Router.use(authMiddleware);

// Example Health Check for V2 Namespace
v2Router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'V2 API Namespace is active and authenticated.',
    user: req.user // Echo back the decoded token data for testing
  });
});

// Future V2 module routers will be mounted here
v2Router.use('/students/:studentId/attendance', attendanceV2Router);
v2Router.use('/students/:studentId/passes', passV2Router);
v2Router.use('/students/:studentId/visitors', visitorV2Router);
v2Router.use('/students/:studentId/dashboard', dashboardV2Router);
v2Router.use('/students/:studentId/profile', profileV2Router);
v2Router.use('/students/:studentId/notifications', notificationV2Router);

export default v2Router;

