import * as visitorService from './visitor.service.js';

/**
 * Parent Creates a Visitor Profile
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

        const newVisitor = await visitorService.createVisitorProfile(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: "Visitor registered successfully.",
            data: newVisitor
        });

    } catch (error) {
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status 
            ? "An internal server error occurred while registering the visitor." 
            : error.message;

        console.error('[VisitorController] createVisitor error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
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
        const statusCode = error.status || 500;
        const isMongoError = error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError';
        const message = (statusCode === 500 || isMongoError) && !error.status 
            ? "An internal server error occurred while fetching parent visitors." 
            : error.message;

        console.error('[VisitorController] listParentVisitors error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
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
