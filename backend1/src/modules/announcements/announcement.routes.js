import express from "express";
import { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } from "./announcement.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createAnnouncement);
router.get("/", getAnnouncements);
router.put("/:id", updateAnnouncement);
router.delete("/:id", deleteAnnouncement);

export default router;
