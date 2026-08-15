import * as visitorHistoryService from './visitorHistory.service.js';

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

        const result = await visitorHistoryService.getSuperAdminHostelVisits(req.query, req.user);

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
        const result = await visitorHistoryService.listVisitorVisits(req.query, req.user, explicitStudentId);

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
        const result = await visitorHistoryService.getVisitDetails(visitId, req.user, explicitStudentId);

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

        console.error('[VisitorHistoryController] getVisitDetails error:', error);

        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }
};
