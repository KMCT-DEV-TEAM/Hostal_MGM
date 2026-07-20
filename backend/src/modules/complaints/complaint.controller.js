import * as complaintService from "./complaint.service.js";
import { createLogDb } from "../logs/log.service.js";
import { getIo } from "../../config/socket.js";

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Student)
export const createComplaint = async (req, res) => {
    try {
        const complaint = await complaintService.createComplaintDb(req.body, req.user);
        getIo()?.emit('complaintCreated', complaint);
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

// @desc    Update a complaint
// @route   PUT /api/complaints/:id
// @access  Private (Student)
export const updateComplaint = async (req, res) => {
    try {
        const updatedComplaint = await complaintService.updateComplaintDb(req.params.id, req.user, req.body);
        getIo()?.emit('complaintUpdated', { id: req.params.id });
        res.status(200).json({
            success: true,
            data: updatedComplaint,
            message: "Complaint updated successfully."
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update complaint."
        });
    }
};

// @desc    Delete (withdraw) a complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Student)
export const deleteComplaint = async (req, res) => {
    try {
        await complaintService.deleteComplaintDb(req.params.id, req.user.id);
        getIo()?.emit('complaintDeleted', { id: req.params.id });
        res.status(200).json({
            success: true,
            message: "Complaint withdrawn successfully."
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to withdraw complaint."
        });
    }
};

// @desc    Get all complaints for a student
// @route   GET /api/complaints/my-complaints
// @access  Private (Student)
export const getMyComplaints = async (req, res) => {
    try {
        const complaints = await complaintService.getStudentComplaintsDb(req.user.id, req.query.type);
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
        if (req.user.role === 'admin') {
            if (!req.user.organization) {
                return res.status(403).json({ success: false, message: "Admin user has no organization associated." });
            }
            query.organizationId = req.user.organization;
        } else if (req.user.role === 'warden') {
            const { default: Hostel } = await import('../hostels/hostel.model.js');
            const hostels = await Hostel.find({ wardens: req.user.id });
            console.log("Warden ID:", req.user.id);
            console.log("Found Hostels:", hostels.map(h => h._id));
            if (hostels.length > 0) {
                query.hostelId = { $in: hostels.map(h => h._id) };
            } else {
                // If warden is not assigned to any hostel, they shouldn't see any complaints
                query._id = null; // Forces empty result
            }
        }

        if (req.query.status) {
            query.status = req.query.status;
        }
        
        if (req.query.assignedStaff) {
            query.assignedStaff = req.query.assignedStaff;
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

// @desc    Get complaint summary (Admin/Warden scoped)
// @route   GET /api/complaints/summary
// @access  Private (Admin/Warden/SuperAdmin)
export const getComplaintSummary = async (req, res) => {
    try {
        const query = {};
        
        // Scope based on role
        if (req.user.role === 'admin') {
            if (!req.user.organization) {
                return res.status(403).json({ success: false, message: "Admin user has no organization associated." });
            }
            query.organizationId = req.user.organization;
        } else if (req.user.role === 'warden') {
            const { default: Hostel } = await import('../hostels/hostel.model.js');
            const hostels = await Hostel.find({ wardens: req.user.id });
            if (hostels.length > 0) {
                query.hostelId = { $in: hostels.map(h => h._id) };
            } else {
                query._id = null;
            }
        }

        const summary = await complaintService.getComplaintSummaryDb(query);
        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to fetch complaint summary."
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
        
        await createLogDb({
            action: `Updated Complaint Status`,
            entityType: "System",
            entityId: null,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Updated complaint status to ${status} for complaint ID: ${req.params.id}`,
            status: "success"
        });

        getIo()?.emit('complaintUpdated', { id: req.params.id });

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

// @desc    Assign maintenance staff to complaint
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Admin/Warden)
export const assignMaintenanceStaff = async (req, res) => {
    try {
        const { staffId } = req.body;
        const userRole = req.user.role === 'super_admin' ? 'Super Admin' : req.user.role === 'org_admin' ? 'Admin' : req.user.role === 'warden' ? 'Warden' : 'System';

        const updatedComplaint = await complaintService.assignStaffToComplaintDb(req.params.id, staffId, userRole);
        
        await createLogDb({
            action: `Assigned Maintenance Staff`,
            entityType: "System",
            entityId: null,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Assigned maintenance staff (ID: ${staffId}) to complaint ID: ${req.params.id}`,
            status: "success"
        });

        getIo()?.emit('complaintUpdated', { id: req.params.id });

        res.status(200).json({
            success: true,
            data: updatedComplaint,
            message: "Maintenance staff assigned successfully."
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to assign maintenance staff."
        });
    }
};

// @desc    Get assigned complaints for maintenance staff
// @route   GET /api/complaints/assigned
// @access  Private (Maintenance Staff)
export const getAssignedComplaints = async (req, res) => {
    try {
        const query = { assignedStaff: req.user.id };
        
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
            message: error.message || "Failed to fetch assigned complaints."
        });
    }
};

// @desc    Maintenance staff submits resolution
// @route   PATCH /api/complaints/:id/resolve-request
// @access  Private (Maintenance Staff)
export const submitComplaintResolution = async (req, res) => {
    try {
        const { materialsUsed, resolutionNotes } = req.body;
        const staffId = req.user.id;

        const updatedComplaint = await complaintService.submitComplaintResolutionDb(req.params.id, staffId, materialsUsed, resolutionNotes);
        getIo()?.emit('complaintUpdated', { id: req.params.id });
        res.status(200).json({
            success: true,
            data: updatedComplaint,
            message: "Resolution submitted and awaiting approval."
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to submit resolution."
        });
    }
};

// @desc    Warden approves resolution
// @route   PATCH /api/complaints/:id/approve-resolution
// @access  Private (Warden/Admin)
export const approveComplaintResolution = async (req, res) => {
    try {
        const userRole = req.user.role === 'super_admin' ? 'Super Admin' : req.user.role === 'admin' ? 'Admin' : req.user.role === 'warden' ? 'Warden' : 'System';
        
        const updatedComplaint = await complaintService.approveComplaintResolutionDb(req.params.id, userRole);
        
        await createLogDb({
            action: `Approved Complaint Resolution`,
            entityType: "System",
            entityId: null,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Approved resolution for complaint ID: ${req.params.id}`,
            status: "success"
        });

        getIo()?.emit('complaintUpdated', { id: req.params.id });

        res.status(200).json({
            success: true,
            data: updatedComplaint,
            message: "Resolution approved successfully."
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to approve resolution."
        });
    }
};

// @desc    Warden rejects resolution
// @route   PATCH /api/complaints/:id/reject-resolution
// @access  Private (Warden/Admin)
export const rejectComplaintResolution = async (req, res) => {
    try {
        const { rejectNote } = req.body;
        const userRole = req.user.role === 'super_admin' ? 'Super Admin' : req.user.role === 'admin' ? 'Admin' : req.user.role === 'warden' ? 'Warden' : 'System';

        const updatedComplaint = await complaintService.rejectComplaintResolutionDb(req.params.id, userRole, rejectNote);
        
        await createLogDb({
            action: `Rejected Complaint Resolution`,
            entityType: "System",
            entityId: null,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Rejected resolution for complaint ID: ${req.params.id}. Reason: ${rejectNote}`,
            status: "success"
        });

        getIo()?.emit('complaintUpdated', { id: req.params.id });

        res.status(200).json({
            success: true,
            data: updatedComplaint,
            message: "Resolution rejected successfully."
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to reject resolution."
        });
    }
};

// @desc    Maintenance staff rejects assigned task
// @route   PATCH /api/complaints/:id/reject-task
// @access  Private (Maintenance Staff)
export const rejectAssignedTask = async (req, res) => {
    try {
        const { rejectNote } = req.body;
        const staffId = req.user.id;

        const updatedComplaint = await complaintService.rejectAssignedTaskDb(req.params.id, staffId, rejectNote);
        getIo()?.emit('complaintUpdated', { id: req.params.id });
        res.status(200).json({
            success: true,
            data: updatedComplaint,
            message: "Task rejected successfully."
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to reject task."
        });
    }
};

// @desc    Add an internal note to a complaint
// @route   POST /api/complaints/:id/internal-notes
// @access  Private (Admin/Warden/SuperAdmin)
export const addInternalNote = async (req, res) => {
    try {
        const { note } = req.body;
        if (!note || note.trim() === '') {
            return res.status(400).json({ success: false, message: "Note text is required." });
        }
        
        const userRole = req.user.role === 'super_admin' ? 'Super Admin' : req.user.role === 'org_admin' || req.user.role === 'admin' ? 'Admin' : req.user.role === 'warden' ? 'Warden' : 'System';
        
        const { default: User } = await import("../users/user.model.js");
        const currentUser = await User.findById(req.user.id || req.user._id).select('name email');
        const addedBy = currentUser?.name || currentUser?.email || 'Unknown';

        const updatedComplaint = await complaintService.addInternalNoteDb(req.params.id, userRole, addedBy, note);
        
        await createLogDb({
            action: `Added Internal Note`,
            entityType: "System",
            entityId: null,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Added internal note to complaint ID: ${req.params.id}`,
            status: "success"
        });

        getIo()?.emit('complaintUpdated', { id: req.params.id });

        res.status(200).json({
            success: true,
            data: updatedComplaint,
            message: "Internal note added successfully."
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to add internal note."
        });
    }
};
