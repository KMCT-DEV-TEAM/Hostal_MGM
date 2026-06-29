import express from "express";
import * as complaintController from "./complaint.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create a new complaint (Student)
router.post("/", complaintController.createComplaint);

// Update a complaint (Student)
router.put("/:id", complaintController.updateComplaint);

// Delete (withdraw) a complaint (Student)
router.delete("/:id", complaintController.deleteComplaint);

// Get student's own complaints
router.get("/my-complaints", complaintController.getMyComplaints);

// DEBUG route to check data without auth
router.get("/debug-data", async (req, res) => {
    try {
        const { default: Complaint } = await import("./complaint.model.js");
        const { default: Hostel } = await import("../hostels/hostel.model.js");
        const { default: User } = await import("../users/user.model.js");
        const { default: Student } = await import("../students/student.model.js");

        const wardens = await User.find({ role: 'warden' }).select('name organization _id');
        const hostels = await Hostel.find({}).select('name wardens organizations _id');
        const students = await Student.find({}).select('name hostelId _id');
        const complaints = await Complaint.find({}).select('hostelId subject studentId _id');
        const { default: Course } = await import("../courses/course.model.js");
        const courses = await Course.find({}).select('name code organizationId _id');
        
        const testWardenId = wardens.length > 0 ? wardens[0]._id.toString() : null;
        let testHostels = [];
        if (testWardenId) {
            testHostels = await Hostel.find({ wardens: testWardenId }).select('name wardens _id');
        }

        res.json({ wardens, hostels, complaints, students, testWardenId, testHostels, courses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all complaints (Admin/Warden scoped)
router.get("/", complaintController.getAllComplaints);

// Get complaint summary (Admin/Warden/SuperAdmin)
router.get("/summary", complaintController.getComplaintSummary);

// Update complaint status (Admin/Warden)
router.patch("/:id/status", complaintController.updateComplaintStatus);

// Assign maintenance staff (Admin/Warden)
router.patch("/:id/assign", complaintController.assignMaintenanceStaff);

// Maintenance Staff endpoints
router.get("/assigned", complaintController.getAssignedComplaints);
router.patch("/:id/resolve-request", complaintController.submitComplaintResolution);
router.patch("/:id/reject-task", complaintController.rejectAssignedTask);

// Warden/Admin resolution approval
router.patch("/:id/approve-resolution", complaintController.approveComplaintResolution);
router.patch("/:id/reject-resolution", complaintController.rejectComplaintResolution);

// Internal Notes
router.post("/:id/internal-notes", complaintController.addInternalNote);

export default router;
