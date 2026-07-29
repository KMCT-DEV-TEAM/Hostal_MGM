import express from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import dashboardV2Router from '../dashboard/dashboard.v2.routes.js';
import profileV2Router from '../profile/profile.v2.routes.js';
import notificationV2Router from '../notifications/notification.v2.routes.js';

const v2Router = express.Router();

v2Router.use(authMiddleware);



// Future V2 module routers will be mounted here
v2Router.use('/students/:studentId/dashboard', dashboardV2Router);
v2Router.use('/students/:studentId/profile', profileV2Router);
v2Router.use('/students/:studentId/notifications', notificationV2Router);

export default v2Router;

