import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { initSocket } from './config/socket.js';
import authRoutes from './modules/auth/auth.routes.js';
import organizationRoutes from './modules/organizations/organization.routes.js';
import courseRoutes from './modules/courses/course.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import batchRoutes from './modules/batches/batch.routes.js';
import hostelRoutes from './modules/hostels/hostel.routes.js';
import announcementRoutes from './modules/announcements/announcement.routes.js';
import complaintRoutes from './modules/complaints/complaint.routes.js';
import complaintCategoryRoutes from './modules/complaintCategories/complaintCategory.routes.js';
import activityLogRoutes from './modules/logs/activityLog.routes.js';
import otpRoutes from './modules/otp/otp.routes.js';
import passwordRequestRoutes from './modules/passwordRequests/passwordRequest.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Vite frontend default port
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/complaint-categories', complaintCategoryRoutes);
app.use('/api/logs', activityLogRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/password-requests', passwordRequestRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
