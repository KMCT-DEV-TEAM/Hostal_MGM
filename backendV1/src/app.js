import express from "express";
import cors from "cors";
import morgan from "morgan";
import compression from 'compression';
import helmet from 'helmet';

const app = express();

// Disable ETags and caching to ensure fresh API responses
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(compression());
app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

import authRoutes from './modules/auth/auth.routes.js';
import announcementRoutes from './modules/announcements/announcement.routes.js';
import batchRoutes from './modules/batches/batch.routes.js';
import complaintRoutes from './modules/complaints/complaint.routes.js';
import complaintCategoryRoutes from './modules/complaintCategories/complaintCategory.routes.js';
import courseRoutes from './modules/courses/course.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import logRoutes from './modules/logs/log.routes.js';
import organizationRoutes from './modules/organizations/organization.routes.js';
import otpRoutes from './modules/otps/otp.routes.js';
import hostelRoutes from './modules/hostels/hostel.routes.js';
import passwordRequestRoutes from './modules/passwordRequests/passwordRequest.routes.js';
import userRoutes from './modules/users/user.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';

// Generic Mounts
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/complaint-categories', complaintCategoryRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/otps', otpRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);

// Super Admin Mounts
app.use('/api/super-admin', userRoutes);
app.use('/api/super-admin/hostels', hostelRoutes);
app.use('/api/super-admin/password-requests', passwordRequestRoutes);

// Basic health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running smoothly" });
});

export default app;
