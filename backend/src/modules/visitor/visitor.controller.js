import * as visitorService from './visitor.service.js';

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

        req.body.confirmReuse = false; // Force false for the standard endpoint

        const result = await visitorService.createVisitorProfile(req.body, req.user);

        if (result.requiresConfirmation) {
            return res.status(409).json({
                success: false,
                error: "VISITOR_EXISTS",
                message: "A matching visitor already exists.",
                visitor: result.visitor
            });
        }

        const message = result.isNewProfile
            ? "Visitor registered successfully and visit requests submitted."
            : "Existing visitor profile matched. Visit requests submitted successfully.";

        return res.status(201).json({
            success: true,
            message,
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['MongoError', 'MongoServerError', 'ValidationError', 'CastError'].includes(error.name);
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
 * Parent Confirms Reuse of a Visitor Profile + Visit Requests
 * @route POST /parent/visitors/:visitorId/visit-requests
 */
export const confirmVisitorReuse = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing parent authentication."
            });
        }

        const { visitorId } = req.params;
        if (!visitorId) {
            return res.status(400).json({
                success: false,
                message: "Visitor ID is required in the route."
            });
        }

        req.body.confirmedVisitorId = visitorId;

        const result = await visitorService.createVisitorProfile(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: "Existing visitor profile matched. Visit requests submitted successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isDbError = ['MongoError', 'MongoServerError', 'ValidationError', 'CastError'].includes(error.name);
        const message = (statusCode === 500 || isDbError) && !error.status
            ? "An internal server error occurred while confirming the visitor."
            : error.message;

        console.error('[VisitorController] confirmVisitorReuse error:', error);

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
        const result = await visitorService.listVisitors(req.query, req.user);
        return res.status(200).json({
            success: true,
            message: "Visitors fetched successfully.",
            ...result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while fetching visitors."
            : error.message;

        console.error('[VisitorController] listVisitors error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Lists Visitors for Parent
 * @route GET /parent/visitors
 */
export const listParentVisitors = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing parent authentication."
            });
        }

        const result = await visitorService.listParentVisitors(req.query, req.user);

        return res.status(200).json({
            success: true,
            message: "Parent visitors fetched successfully.",
            ...result
        });

    } catch (error) {
        console.error('[VisitorController] listParentVisitors Error:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to fetch visitors."
        });
    }
};

/**
 * Gets Visitor Details for Parent
 * @route GET /parent/visitors/:visitorId
 */
export const getParentVisitorDetails = async (req, res) => {
    try {
        const { visitorId } = req.params;
        const result = await visitorService.getVisitorDetails(visitorId, req.user);

        return res.status(200).json({
            success: true,
            message: "Visitor details fetched successfully.",
            data: result
        });

    } catch (error) {
        console.error('[VisitorController] getParentVisitorDetails Error:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to fetch visitor details."
        });
    }
};

/**
 * Update visitor status (by parent or admin)
 */
export const updateVisitorStatus = async (req, res) => {
    try {
        const { visitorId } = req.params;
        const { status } = req.body;

        const studentId = req.student?.id;
        const updatedVisitor = await visitorService.updateVisitorStatus(visitorId, status, req.user, studentId);

        return res.status(200).json({
            success: true,
            message: `Visitor status updated to ${status} successfully.`,
            data: updatedVisitor
        });
    } catch (error) {
        console.error('[VisitorController] updateVisitorStatus Error:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to update visitor status."
        });
    }
};

/**
 * Lists Visitors for Student
 * @route GET /student/visitors
 */
export const listStudentVisitors = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing student authentication."
            });
        }

        const result = await visitorService.listStudentVisitors(req.query, req.user);

        return res.status(200).json({
            success: true,
            message: "Student visitors fetched successfully.",
            ...result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while fetching student visitors."
            : error.message;

        console.error('[VisitorController] listStudentVisitors error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Get visitor details by ID
 * @route GET /visitors/:visitorId
 */
export const getVisitorDetails = async (req, res) => {
    try {
        const { visitorId } = req.params;

        const studentId = req.student?.id;
        const result = await visitorService.getVisitorDetails(visitorId, req.user, studentId);

        return res.status(200).json({
            success: true,
            message: "Visitor details fetched successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while fetching visitor details."
            : error.message;

        console.error('[VisitorController] getVisitorDetails error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Admin / Super Admin approves a visitor
 * @route PATCH /visitors/:visitorId/approve
 */
export const approveVisitor = async (req, res) => {
    try {
        const { visitorId } = req.params;

        const result = await visitorService.approveVisitor(visitorId, req.user);

        return res.status(200).json({
            success: true,
            message: "Visitor approved successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while approving the visitor."
            : error.message;

        console.error('[VisitorController] approveVisitor error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Admin / Super Admin rejects a visitor
 * @route PATCH /visitors/:visitorId/reject
 */
export const rejectVisitor = async (req, res) => {
    try {
        const { visitorId } = req.params;
        const { reason } = req.body;

        const result = await visitorService.rejectVisitor(visitorId, reason, req.user);

        return res.status(200).json({
            success: true,
            message: "Visitor rejected successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while rejecting the visitor."
            : error.message;

        console.error('[VisitorController] rejectVisitor error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Get dashboard summary cards based on role
 * @route GET /dashboard-summary
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
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while fetching dashboard summary."
            : error.message;

        console.error('[VisitorController] getVisitorDashboardSummary error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Warden checks in an approved visitor
 * @route POST /warden/visits/check-in
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
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while checking in the visitor."
            : error.message;

        console.error('[VisitorController] checkInVisitor error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Warden adds students to an active visit
 * @route PATCH /warden/visits/:visitId/students
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
            message: "Students added to the active visit successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while adding students to the visit."
            : error.message;

        console.error('[VisitorController] addStudentsToVisit error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Super Admin gets hostel-wise visit summary
 * @route GET /super-admin/visitor-visits/hostels
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
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while fetching hostel visits."
            : error.message;

        console.error('[VisitorController] getSuperAdminHostelVisits error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Super Admin gets hostel-wise visitor summary
 * @route GET /super-admin/visitors/hostels
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
            message: "Hostel visitors summary fetched successfully.",
            ...result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while fetching hostel visitors."
            : error.message;

        console.error('[VisitorController] getSuperAdminHostelVisitors error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};
/**
 * Super Admin, Admin, Warden, Parent and Student list visits
 * @route GET /visitor-visits
 */
export const listVisitorVisits = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User context missing."
            });
        }

        const explicitStudentId = req.student ? req.student.id : null;
        const result = await visitorService.listVisitorVisits(req.query, req.user, explicitStudentId);

        return res.status(200).json({
            success: true,
            message: "Visits fetched successfully.",
            ...result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while fetching visits."
            : error.message;

        console.error('[VisitorController] listVisitorVisits error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Gets complete visit details based on role authorization
 * @route GET /visitor-visits/:visitId
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
        const explicitStudentId = req.student ? req.student.id : null;
        const result = await visitorService.getVisitDetails(visitId, req.user, explicitStudentId);

        return res.status(200).json({
            success: true,
            message: "Visit details fetched successfully.",
            data: result
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while fetching visit details."
            : error.message;

        console.error('[VisitorController] getVisitDetails error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};

/**
 * Parent updates a Visitor Profile
 * @route PATCH /parent/visitors/:visitorId
 */
export const updateVisitor = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing parent authentication."
            });
        }

        const { visitorId } = req.params;
        const studentId = req.student?.id;
        const updatedVisitor = await visitorService.updateVisitorProfile(visitorId, req.body, req.user, studentId);

        return res.status(200).json({
            success: true,
            message: "Visitor updated successfully.",
            data: updatedVisitor
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status
            ? "An internal server error occurred while updating the visitor."
            : error.message;

        console.error('[VisitorController] updateVisitor error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};
