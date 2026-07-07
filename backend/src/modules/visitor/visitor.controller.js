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
