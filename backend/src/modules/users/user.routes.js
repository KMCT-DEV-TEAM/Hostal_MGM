import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { activateAdmin, createAdmin, deactivateAdmin, getAdminById, getAdmins, updateAdmin } from "./user.controller.js";

const router = express.Router();

router.post(
  "/admins",
  authMiddleware,
  roleMiddleware("super_admin"),
  createAdmin
);

router.get(
  "/admins",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdmins
);

router.get(
  "/admins/:id",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminById
);

router.patch(
  "/admins/:id",
  authMiddleware,
  roleMiddleware("super_admin"),
  updateAdmin
);

router.patch(
  "/admins/:id/deactivate",
  authMiddleware,
  roleMiddleware("super_admin"),
  deactivateAdmin
);

router.patch(
  "/admins/:id/activate",
  authMiddleware,
  roleMiddleware("super_admin"),
  activateAdmin
);


export default router;