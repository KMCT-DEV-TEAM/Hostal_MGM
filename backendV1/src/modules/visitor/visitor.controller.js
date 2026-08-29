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
        const result = await visitorService.listVisitors(req.query, req.user);
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

export const listParentVisitors = async (req, res) => {
    try {
        const { explicitStudentId } = req.query;
        const result = await visitorService.listParentVisitors(req.query, req.user, explicitStudentId);
        return res.status(200).json({
            success: true,
            message: "Parent visitors fetched successfully.",
            ...result
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
        const visitor = await visitorService.getVisitorDetails(req.params.visitorId, req.user);
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

export const getParentVisitorDetails = async (req, res) => {
    try {
        const { explicitStudentId } = req.query;
        const visitor = await visitorService.getVisitorDetails(req.params.visitorId, req.user, explicitStudentId);
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
        const { explicitStudentId } = req.query;
        const visitor = await visitorService.updateVisitorStatus(req.params.visitorId, req.body.status, req.user, explicitStudentId);
        
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
