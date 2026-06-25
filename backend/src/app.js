import express from "express";
import morgan from "morgan";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import parentRoutes from "./modules/parents/parent.routes.js";
import wardenRoutes from "./modules/wardens/warden.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import hostelRoutes from "./modules/hostels/hostel.routes.js";
import otpRoutes from "./modules/otp/otp.routes.js";
import departmentRoutes from "./modules/departments/department.routes.js";
import courseRoutes from "./modules/courses/course.routes.js";
import batchRoutes from "./modules/batches/batch.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import passwordRequestRoutes from "./modules/passwordRequests/passwordRequest.routes.js";
import complaintCategoryRoutes from "./modules/complaintCategories/complaintCategory.routes.js";
import { studentPassRouter, parentPassRouter, wardenPassRouter } from "./modules/passes/pass.routes.js";
import complaintRoutes from "./modules/complaints/complaint.routes.js";
import logRoutes from "./modules/logs/log.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import cors from 'cors';
import cookieParser from "cookie-parser";
const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000'
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);

app.use("/api/super-admin", userRoutes);
app.use("/api/super-admin/dashboard", dashboardRoutes);
app.use("/api/super-admin/hostels", hostelRoutes);
app.use("/api/super-admin/parents", parentRoutes);
app.use("/api/super-admin/students", studentRoutes);
app.use("/api/super-admin/password-requests", passwordRequestRoutes);

app.use("/api/organizations", organizationRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/complaint-categories", complaintCategoryRoutes);
app.use("/api/complaints", complaintRoutes);

app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/students", studentRoutes);
app.use("/api/admin/parents", parentRoutes);



app.use("/api/warden", wardenRoutes);
app.use("/api/warden/students", studentRoutes);
app.use("/api/warden/parents", parentRoutes);

app.use("/api/notifications", notificationRoutes);
// ---studenbts routes ---
app.use("/api/student/passes", studentPassRouter);


// ---parents routes -------
app.use("/api/parent/passes", parentPassRouter);

// ---warden routes -------
app.use("/api/warden/passes", wardenPassRouter);

app.use("/api/logs", logRoutes);
app.use(errorMiddleware);

export default app;
