import express from "express";
import { createAnnouncement, getAnnouncements } from "./announcement.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createAnnouncement);
router.get("/", getAnnouncements);

export default router;
