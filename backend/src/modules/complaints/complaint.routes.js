import express from "express";
import * as complaintController from "./complaint.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create a new complaint (Student)
router.post("/", complaintController.createComplaint);

// Get student's own complaints
router.get("/my-complaints", complaintController.getMyComplaints);

// Get all complaints (Admin/Warden scoped)
router.get("/", complaintController.getAllComplaints);

// Update complaint status (Admin/Warden)
router.patch("/:id/status", complaintController.updateComplaintStatus);

export default router;
