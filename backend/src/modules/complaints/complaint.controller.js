import * as complaintService from "./complaint.service.js";

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Student)
export const createComplaint = async (req, res) => {
    try {
        const complaint = await complaintService.createComplaintDb(req.body, req.user);
        res.status(201).json({
            success: true,
            data: complaint,
            message: "Complaint registered successfully."
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to create complaint."
        });
    }
};

// @desc    Get all complaints for a student
// @route   GET /api/complaints/my-complaints
// @access  Private (Student)
export const getMyComplaints = async (req, res) => {
    try {
        const complaints = await complaintService.getStudentComplaintsDb(req.user.id);
        res.status(200).json({
            success: true,
            data: complaints
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to fetch complaints."
        });
    }
};

// @desc    Get all complaints (Admin/Warden scoped)
// @route   GET /api/complaints
// @access  Private (Admin/Warden/SuperAdmin)
export const getAllComplaints = async (req, res) => {
    try {
        const query = {};
        
        // Scope based on role
        if (req.user.role === 'org_admin') {
            query.organizationId = req.user.organizationId;
        } else if (req.user.role === 'warden') {
            query.hostelId = req.user.hostelId;
        }

        if (req.query.status) {
            query.status = req.query.status;
        }

        const complaints = await complaintService.getAllComplaintsDb(query);
        res.status(200).json({
            success: true,
            data: complaints
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to fetch complaints."
        });
    }
};

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id/status
// @access  Private (Admin/Warden)
export const updateComplaintStatus = async (req, res) => {
    try {
        const { status, message } = req.body;
        // The updater's role
        const userRole = req.user.role === 'super_admin' ? 'Super Admin' : req.user.role === 'org_admin' ? 'Admin' : req.user.role === 'warden' ? 'Warden' : 'System';

        const updatedComplaint = await complaintService.updateComplaintStatusDb(req.params.id, status, userRole, message);
        res.status(200).json({
            success: true,
            data: updatedComplaint,
            message: `Complaint status updated to ${status}`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update complaint status."
        });
    }
};
