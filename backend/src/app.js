import express from "express";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/super-admin", userRoutes);

export default app;