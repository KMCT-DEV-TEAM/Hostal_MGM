import * as visitorService from './visitor.service.js';
import { createLogDb } from '../logs/log.service.js';

/**
 * Parent Creates a Visitor Profile + Visit Requests for multiple students
 * @route POST /parent/visitors
 */
export const createVisitor = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing parent authentication."
            });
        }

        req.body.confirmReuse = false;

        const result = await visitorService.createVisitorProfile(req.body, req.user);

        if (result.requiresConfirmation) {
            return res.status(409).json({
                success: false,
                error: "VISITOR_EXISTS",
                message: "We found an existing visitor profile matching these details. Please review the currently assigned students before proceeding.",
                visitor: result.visitor,
            });
        }

        const message = result.isNewProfile
            ? "Your visitor has been registered and the visit request was submitted successfully."
            : "Your visit request was submitted successfully for the existing visitor.";

        await createLogDb({
            action: result.isNewProfile ? "Created Visitor" : "Created Visit Request",
            entityType: "Visitor",
            entityId: result.visitor?.id || "Unknown", // Changed _id to id for PostgreSQL
            user: req.user.id, // Removed fallback to _id
            userRole: req.user.role,
            details: `Parent submitted a visit request`,
            status: "success"
        });

        return res.status(201).json({
            success: true,
            message,
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        // Replaced MongoDB error names with Prisma error names
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while registering the visitor."
            : error.message;

        console.error('[VisitorController] createVisitor error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Lists Visitors (Super Admin, Admin, Warden)
 * @route GET /visitors
 */
export const listVisitors = async (req, res) => {
    try {
        const { studentId } = req.query;
        const result = await visitorService.listVisitors(req.query, req.user, studentId);
        return res.status(200).json({
            success: true,
            message: "Visitors fetched successfully.",
            ...result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while fetching visitors."
            : error.message;

        console.error('[VisitorController] listVisitors error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

export const confirmVisitorReuse = async (req, res) => {
    try {
        req.body.confirmedVisitorId = req.params.visitorId;
        const result = await visitorService.createVisitorProfile(req.body, req.user);

        await createLogDb({
            action: "Created Visit Request",
            entityType: "Visitor",
            entityId: result.visitor?.id || req.params.visitorId,
            user: req.user.id,
            userRole: req.user.role,
            details: `Parent submitted a visit request for reused profile`,
            status: "success"
        });

        return res.status(201).json({
            success: true,
            message: "Your visit request was submitted successfully for the existing visitor.",
            data: result
        });
    } catch (error) {
        const statusCode = error.status || 500;
        const message = (statusCode === 500 && !error.status) ? "An error occurred." : error.message;
        console.error('[VisitorController] confirmVisitorReuse error:', error);
        return res.status(statusCode).json({ success: false, message });
    }
};

export const unassignVisitor = async (req, res) => {
    try {
        const { visitorId } = req.params;
        const { studentId } = req.body;
        
        await visitorService.unassignVisitorFromStudent(visitorId, studentId, req.user);
        
        return res.status(200).json({
            success: true,
            message: "Visitor successfully unassigned from the student."
        });
    } catch (error) {
        const statusCode = error.status || 500;
        const message = (statusCode === 500 && !error.status) ? "An error occurred." : error.message;
        return res.status(statusCode).json({ success: false, message });
    }
};

export const listStudentVisitors = async (req, res) => {
    try {
        const result = await visitorService.listStudentVisitors(req.query, req.user);
        return res.status(200).json({
            success: true,
            message: "Student visitors fetched successfully.",
            ...result
        });
    } catch (error) {
        const statusCode = error.status || 500;
        const message = (statusCode === 500 && !error.status) ? "An error occurred." : error.message;
        return res.status(statusCode).json({ success: false, message });
    }
};

export const getVisitorDetails = async (req, res) => {
    try {
        const { studentId } = req.query;
        const visitor = await visitorService.getVisitorDetails(req.params.visitorId, req.user, studentId);
        return res.status(200).json({
            success: true,
            message: "Visitor details fetched successfully.",
            data: visitor
        });
    } catch (error) {
        const statusCode = error.status || 500;
        const message = (statusCode === 500 && !error.status) ? "An error occurred." : error.message;
        return res.status(statusCode).json({ success: false, message });
    }
};

export const updateVisitorStatus = async (req, res) => {
    try {
        const { studentId } = req.query;
        const visitor = await visitorService.updateVisitorStatus(req.params.visitorId, req.body.status, req.user, studentId);
        
        await createLogDb({
            action: "Update Visitor Status",
            entityType: "Visitor",
            entityId: visitor.id,
            user: req.user.id,
            userRole: req.user.role,
            details: `Status updated to ${req.body.status}`,
            status: "success"
        });

        return res.status(200).json({
            success: true,
            message: "Visitor status updated successfully.",
            data: visitor
        });
    } catch (error) {
        const statusCode = error.status || 500;
        const message = (statusCode === 500 && !error.status) ? "An error occurred." : error.message;
        return res.status(statusCode).json({ success: false, message });
    }
};

/**
 * Get dashboard summary cards based on role
 * @route GET /visitors/dashboard-summary
 */
export const getVisitorDashboardSummary = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User context missing."
            });
        }

        const result = await visitorService.getDashboardSummary(req.user);

        return res.status(200).json({
            success: true,
            message: "Dashboard summary fetched successfully.",
            ...result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while fetching dashboard summary."
            : error.message;

        console.error('[VisitorController] getVisitorDashboardSummary error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Super Admin, Admin, Warden, Mentor, Parent and Student list visitor visits
 * @route GET /visitors/visitor-visits
 */
export const listVisitorVisits = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User context missing."
            });
        }

        const studentId = req.student ? req.student.id : (req.query.studentId || null);
        const result = await visitorService.listVisitorVisits(req.query, req.user, studentId);

        return res.status(200).json({
            success: true,
            message: "Visits fetched successfully.",
            ...result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while fetching visits."
            : error.message;

        console.error('[VisitorController] listVisitorVisits error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Gets complete visit details based on role authorization
 * @route GET /visitors/visitor-visits/:visitId
 */
export const getVisitDetails = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User context missing."
            });
        }

        const { visitId } = req.params;
        const studentId = req.student ? req.student.id : (req.query.studentId || null);
        const result = await visitorService.getVisitDetails(visitId, req.user, studentId);

        return res.status(200).json({
            success: true,
            message: "Visit details fetched successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while fetching visit details."
            : error.message;

        console.error('[VisitorController] getVisitDetails error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Super Admin gets hostel-wise visit summary
 * @route GET /visitors/super-admin/visitor-visits/hostels
 */
export const getSuperAdminHostelVisits = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User context missing."
            });
        }

        const result = await visitorService.getSuperAdminHostelVisits(req.query, req.user);

        return res.status(200).json({
            success: true,
            message: "Hostel visits summary fetched successfully.",
            ...result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while fetching hostel visits."
            : error.message;

        console.error('[VisitorController] getSuperAdminHostelVisits error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Approve a visit request (Super Admin, Admin, Mentor)
 * @route PATCH /visitors/visit-requests/:visitRequestId/approve
 */
export const approveVisitRequest = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user authentication."
            });
        }

        const { visitRequestId } = req.params;
        const result = await visitorService.approveVisitRequest(visitRequestId, req.user);

        return res.status(200).json({
            success: true,
            message: "Visit request approved successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while approving visit request."
            : error.message;

        console.error('[VisitorController] approveVisitRequest error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Reject a visit request (Super Admin, Admin, Mentor)
 * @route PATCH /visitors/visit-requests/:visitRequestId/reject
 */
export const rejectVisitRequest = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user authentication."
            });
        }

        const { visitRequestId } = req.params;
        const { reason } = req.body;
        const result = await visitorService.rejectVisitRequest(visitRequestId, reason, req.user);

        return res.status(200).json({
            success: true,
            message: "Visit request rejected successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while rejecting visit request."
            : error.message;

        console.error('[VisitorController] rejectVisitRequest error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Warden checks in an approved visitor
 * @route POST /visitors/check-in
 */
export const checkInVisitor = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing warden authentication."
            });
        }

        const result = await visitorService.checkInVisitor(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: "Visitor checked in successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while checking in visitor."
            : error.message;

        console.error('[VisitorController] checkInVisitor error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Warden adds students to an active visit
 * @route PATCH /visitors/:visitId/students
 */
export const addStudentsToVisit = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing warden authentication."
            });
        }

        const { visitId } = req.params;
        const result = await visitorService.addStudentsToVisit(visitId, req.body, req.user);

        return res.status(200).json({
            success: true,
            message: "Students added to visit successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while adding students to visit."
            : error.message;

        console.error('[VisitorController] addStudentsToVisit error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Super Admin gets hostel-wise visitor statistics summary
 * @route GET /visitors/super-admin/visitors/hostels
 */
export const getSuperAdminHostelVisitors = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User context missing."
            });
        }

        const result = await visitorService.getSuperAdminHostelVisitors(req.query, req.user);

        return res.status(200).json({
            success: true,
            message: "Hostel visitor summary fetched successfully.",
            ...result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while fetching hostel visitors."
            : error.message;

        console.error('[VisitorController] getSuperAdminHostelVisitors error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Super Admin blacklists a visitor
 * @route PATCH /visitors/super-admin/visitors/:visitorId/blacklist
 */
export const blacklistVisitor = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user authentication."
            });
        }

        const { visitorId } = req.params;
        const { reason } = req.body;

        const result = await visitorService.blacklistVisitor(visitorId, reason, req.user);

        return res.status(200).json({
            success: true,
            message: "Visitor has been blacklisted successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while blacklisting visitor."
            : error.message;

        console.error('[VisitorController] blacklistVisitor error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Super Admin removes a visitor from blacklist
 * @route PATCH /visitors/super-admin/visitors/:visitorId/remove-blacklist
 */
export const removeBlacklistVisitor = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user authentication."
            });
        }

        const { visitorId } = req.params;

        const result = await visitorService.removeBlacklistVisitor(visitorId, req.user);

        return res.status(200).json({
            success: true,
            message: "Visitor blacklist status has been removed successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while removing blacklist status."
            : error.message;

        console.error('[VisitorController] removeBlacklistVisitor error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Parent updates visitor profile
 * @route PATCH /visitors/:visitorId
 */
export const updateVisitor = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user authentication."
            });
        }

        const { visitorId } = req.params;
        const studentId = req.studentId || req.query.studentId || req.body.studentId;

        const result = await visitorService.updateVisitorProfile(visitorId, req.body, req.user, studentId);

        return res.status(200).json({
            success: true,
            message: "Visitor profile updated successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['PrismaClientKnownRequestError', 'PrismaClientValidationError', 'PrismaClientUnknownRequestError', 'PrismaClientInitializationError', 'PrismaClientRustPanicError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while updating visitor profile."
            : error.message;

        console.error('[VisitorController] updateVisitor error:', error);

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};
