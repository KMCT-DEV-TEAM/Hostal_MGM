import express from "express";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import parentRoutes from "./modules/parents/parent.routes.js";
import wardenRoutes from "./modules/wardens/warden.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/super-admin", userRoutes);
app.use("/api/super-admin/dashboard", dashboardRoutes);

app.use("/api/organizations", organizationRoutes);

app.use("/api/admin/students", studentRoutes);
app.use("/api/admin/parents", parentRoutes);

app.use("/api/warden", wardenRoutes);

app.use(errorMiddleware);

export default app;