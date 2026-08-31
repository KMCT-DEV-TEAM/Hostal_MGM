import { VISITOR_STATUS_VALUES, VISIT_STATUS_VALUES, ID_PROOF_TYPE_VALUES } from "./visitor.constant.js";
import { isUUID } from "../../utils/validators.js";

// Validates PostgreSQL UUIDs using shared validator utility

// Strictly enforces exactly 10 digits, optionally starting with +91 or 91.
const isValidPhone = (phone) => /^(?:\+91|91)?\d{10}$/.test(phone.replace(/[\s-]/g, ''));
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateCreateVisitor = (req, res, next) => {
    const FORBIDDEN_BODY_FIELDS = ['studentId', 'students', 'hostelId'];
    const forbiddenPresent = FORBIDDEN_BODY_FIELDS.filter(f => req.body[f] !== undefined);
    if (forbiddenPresent.length > 0) {
        return res.status(400).json({
            success: false,
            message: `The following fields are not allowed in the request body: ${forbiddenPresent.join(', ')}. Please use 'studentIds' array.`
        });
    }

    const { studentIds, name, relationship, phone, email, address, idProofType, idProofNumber, purpose, remarks, confirmReuse } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ success: false, message: "studentIds must be a non-empty array of valid object IDs." });
    }
    if (studentIds.length > 5) {
        return res.status(400).json({ success: false, message: "You can only select up to 5 students per visit request." });
    }
    for (const id of studentIds) {
        if (!isUUID(id)) {
            return res.status(400).json({ success: false, message: `Invalid student ID in array: ${id}` });
        }
    }

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
        return res.status(400).json({ success: false, message: "name is required and must be at least 3 characters long." });
    }

    if (!relationship || typeof relationship !== 'string' || relationship.trim().length === 0) {
        return res.status(400).json({ success: false, message: "relationship is required." });
    }

    if (!phone || !isValidPhone(phone)) {
        return res.status(400).json({ success: false, message: "A valid phone number is required (10–15 digits)." });
    }

    if (email && !isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "If provided, email must be a valid email address." });
    }

    if (!idProofType || typeof idProofType !== 'string' || idProofType.trim().length === 0) {
        return res.status(400).json({ success: false, message: "idProofType is required." });
    }
    if (!ID_PROOF_TYPE_VALUES.includes(idProofType.trim().toUpperCase())) {
        return res.status(400).json({ success: false, message: `Invalid idProofType. Allowed values: ${ID_PROOF_TYPE_VALUES.join(', ')}.` });
    }

    if (!idProofNumber || typeof idProofNumber !== 'string' || idProofNumber.trim().length === 0) {
        return res.status(400).json({ success: false, message: "idProofNumber is required." });
    }

    if (!purpose || typeof purpose !== 'string' || purpose.trim().length < 3 || purpose.trim().length > 255) {
        return res.status(400).json({ success: false, message: "purpose is required and must be between 3 and 255 characters." });
    }

    if (remarks !== undefined && (typeof remarks !== 'string' || remarks.trim().length > 500)) {
        return res.status(400).json({ success: false, message: "remarks must be a string of at most 500 characters." });
    }

    req.body.studentIds = [...new Set(studentIds)];
    req.body.name = name.trim();
    req.body.relationship = relationship.trim();
    req.body.phone = phone.trim();
    req.body.idProofType = idProofType.trim().toUpperCase();
    req.body.idProofNumber = idProofNumber.trim();
    req.body.purpose = purpose.trim();
    if (email) req.body.email = email.trim().toLowerCase();
    if (address) req.body.address = address.trim();
    if (remarks) req.body.remarks = remarks.trim();
    req.body.confirmReuse = confirmReuse === true || confirmReuse === 'true';

    next();
};

export const validateConfirmVisitor = (req, res, next) => {
    const { studentIds, relationship, purpose, remarks } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ success: false, message: "studentIds must be a non-empty array of valid object IDs." });
    }
    if (studentIds.length > 5) {
        return res.status(400).json({ success: false, message: "You can only select up to 5 students per visit request." });
    }
    for (const id of studentIds) {
        if (!isUUID(id)) {
            return res.status(400).json({ success: false, message: `Invalid student ID in array: ${id}` });
        }
    }

    if (!relationship || typeof relationship !== 'string' || relationship.trim().length === 0) {
        return res.status(400).json({ success: false, message: "relationship is required." });
    }

    if (!purpose || typeof purpose !== 'string' || purpose.trim().length < 3 || purpose.trim().length > 255) {
        return res.status(400).json({ success: false, message: "purpose is required and must be between 3 and 255 characters." });
    }

    if (remarks !== undefined && (typeof remarks !== 'string' || remarks.trim().length > 500)) {
        return res.status(400).json({ success: false, message: "remarks must be a string of at most 500 characters." });
    }

    req.body.studentIds = [...new Set(studentIds)];
    req.body.relationship = relationship.trim();
    req.body.purpose = purpose.trim();
    if (remarks) req.body.remarks = remarks.trim();

    next();
};

export const validateUnassignVisitor = (req, res, next) => {
    const { visitorId } = req.params;
    const studentId = req.params.studentId || req.body?.studentId;

    if (!isUUID(visitorId)) return res.status(400).json({ success: false, message: "Invalid visitorId." });
    if (!isUUID(studentId)) return res.status(400).json({ success: false, message: "Invalid studentId." });

    next();
};

export const validateListVisitors = (req, res, next) => {
    let { page, limit, status, hostel, organization, sortBy, sortOrder } = req.query;

    if (page && (isNaN(Number(page)) || Number(page) < 1)) return res.status(400).json({ success: false, message: "Invalid page parameter." });
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) return res.status(400).json({ success: false, message: "Invalid limit parameter (must be 1-100)." });

    if (status && !VISITOR_STATUS_VALUES.includes(status.toUpperCase())) {
        return res.status(400).json({ success: false, message: "Invalid status parameter." });
    }

    if (hostel && !isUUID(hostel)) return res.status(400).json({ success: false, message: "Invalid hostel ID format." });
    if (organization && !isUUID(organization)) return res.status(400).json({ success: false, message: "Invalid organization ID format." });

    const allowedSortFields = ['createdAt', 'visitorName', 'status'];
    if (sortBy && !allowedSortFields.includes(sortBy)) return res.status(400).json({ success: false, message: "Invalid sortBy parameter." });
    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) return res.status(400).json({ success: false, message: "Invalid sortOrder parameter (must be asc or desc)." });

    next();
};

export const validateEndUserListVisitors = (req, res, next) => {
    let { page, limit, status, sortBy, sortOrder } = req.query;

    if (page && (isNaN(Number(page)) || Number(page) < 1)) return res.status(400).json({ success: false, message: "Invalid page parameter." });
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) return res.status(400).json({ success: false, message: "Invalid limit parameter (must be 1-100)." });

    if (status && !VISITOR_STATUS_VALUES.includes(status.toUpperCase())) {
        return res.status(400).json({ success: false, message: "Invalid status parameter." });
    }

    const allowedSortFields = ['createdAt', 'visitorName', 'status'];
    if (sortBy && !allowedSortFields.includes(sortBy)) return res.status(400).json({ success: false, message: "Invalid sortBy parameter." });
    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) return res.status(400).json({ success: false, message: "Invalid sortOrder parameter (must be asc or desc)." });

    next();
};

export const validateGetVisitorDetails = (req, res, next) => {
    const { visitorId } = req.params;
    if (!isUUID(visitorId)) return res.status(400).json({ success: false, message: "Invalid visitor ID." });
    next();
};

export const validateApproveVisitor = (req, res, next) => {
    const { visitorId } = req.params;
    if (!isUUID(visitorId)) return res.status(400).json({ success: false, message: "Invalid visitor ID." });
    next();
};

export const validateRejectVisitor = (req, res, next) => {
    const { visitorId } = req.params;
    const { reason } = req.body;

    if (!isUUID(visitorId)) return res.status(400).json({ success: false, message: "Invalid visitor ID." });
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 500) {
        return res.status(400).json({ success: false, message: "Rejection reason is required and must be between 3 and 500 characters." });
    }

    req.body.reason = reason.trim();
    next();
};

export const validateCheckInVisitor = (req, res, next) => {
    const { visitor, purpose, expectedExitTime, selectedStudentIds } = req.body;

    if (!Array.isArray(selectedStudentIds) || selectedStudentIds.length === 0) {
        return res.status(400).json({ success: false, message: "selectedStudentIds must be a non-empty array of valid object IDs." });
    }

    for (const id of selectedStudentIds) {
        if (!isUUID(id)) return res.status(400).json({ success: false, message: `Invalid student ID: ${id}` });
    }

    if (!visitor || !visitor.refId || !isUUID(visitor.refId)) {
        return res.status(400).json({ success: false, message: "A valid visitor.refId is required." });
    }

    if (!visitor.refType || !['Parent', 'Visitor'].includes(visitor.refType)) {
        return res.status(400).json({ success: false, message: "visitor.refType must be 'Parent' or 'Visitor'." });
    }

    if (!purpose || typeof purpose !== 'string' || purpose.trim().length < 3 || purpose.trim().length > 255) {
        return res.status(400).json({ success: false, message: "Visiting purpose is required and must be between 3 and 255 characters." });
    }

    if (!expectedExitTime || typeof expectedExitTime !== 'string') {
        return res.status(400).json({ success: false, message: "A valid expectedExitTime is required." });
    }

    const exitTimeDate = new Date(expectedExitTime);
    if (isNaN(exitTimeDate.getTime())) return res.status(400).json({ success: false, message: "Invalid expectedExitTime format." });
    if (exitTimeDate.getTime() <= Date.now()) return res.status(400).json({ success: false, message: "expectedExitTime must be a future time." });

    const maxExitTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour limit
    if (exitTimeDate > maxExitTime) return res.status(400).json({ success: false, message: "expectedExitTime cannot be more than 1 hour from the current time." });

    req.body.purpose = purpose.trim();
    next();
};

export const validateAddStudentsToVisit = (req, res, next) => {
    const { visitId } = req.params;
    const { selectedStudentIds, expectedExitTime } = req.body;

    if (!isUUID(visitId)) return res.status(400).json({ success: false, message: "Invalid visit ID." });

    if (!Array.isArray(selectedStudentIds) || selectedStudentIds.length === 0) {
        return res.status(400).json({ success: false, message: "selectedStudentIds must be a non-empty array of valid object IDs." });
    }

    for (const id of selectedStudentIds) {
        if (!isUUID(id)) return res.status(400).json({ success: false, message: `Invalid student ID: ${id}` });
    }

    if (!expectedExitTime || typeof expectedExitTime !== 'string') return res.status(400).json({ success: false, message: "A valid expectedExitTime is required." });

    const exitTimeDate = new Date(expectedExitTime);
    if (isNaN(exitTimeDate.getTime())) return res.status(400).json({ success: false, message: "Invalid expectedExitTime format." });
    if (exitTimeDate > new Date(Date.now() + 60 * 60 * 1000)) return res.status(400).json({ success: false, message: "expectedExitTime cannot be more than 1 hour from the current time." });

    next();
};

export const validateSuperAdminHostelVisits = (req, res, next) => {
    let { page, limit } = req.query;
    if (page && (isNaN(Number(page)) || Number(page) < 1)) return res.status(400).json({ success: false, message: "Invalid page parameter." });
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) return res.status(400).json({ success: false, message: "Invalid limit parameter (must be 1-100)." });
    next();
};

export const validateListVisits = (req, res, next) => {
    let { page, limit, status, hostel, date, sortBy, sortOrder } = req.query;

    if (page && (isNaN(Number(page)) || Number(page) < 1)) return res.status(400).json({ success: false, message: "Invalid page parameter." });
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) return res.status(400).json({ success: false, message: "Invalid limit parameter (must be 1-100)." });

    if (status && !VISIT_STATUS_VALUES.includes(status.toUpperCase())) return res.status(400).json({ success: false, message: "Invalid status parameter." });

    if (hostel && !isUUID(hostel)) return res.status(400).json({ success: false, message: "Invalid hostel ID format." });
    if (date && isNaN(Date.parse(date))) return res.status(400).json({ success: false, message: "Invalid date format." });

    const allowedSortFields = ['checkInTime', 'visitorName', 'status'];
    if (sortBy && !allowedSortFields.includes(sortBy)) return res.status(400).json({ success: false, message: "Invalid sortBy parameter." });
    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) return res.status(400).json({ success: false, message: "Invalid sortOrder parameter (must be asc or desc)." });

    next();
};

export const validateGetVisitDetails = (req, res, next) => {
    const { visitId } = req.params;
    if (!isUUID(visitId)) return res.status(400).json({ success: false, message: "Invalid visit ID." });
    next();
};

export const validateUpdateVisitor = (req, res, next) => {
    const { visitorId } = req.params;
    if (!isUUID(visitorId)) return res.status(400).json({ success: false, message: "Invalid visitor ID." });

    const allowedFields = ['name', 'address', 'email'];
    const updateKeys = Object.keys(req.body);

    if (updateKeys.length === 0) return res.status(400).json({ success: false, message: "At least one field is required to update." });

    const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));
    if (invalidFields.length > 0) return res.status(400).json({ success: false, message: `Only the following fields can be updated: ${allowedFields.join(', ')}. Invalid fields provided: ${invalidFields.join(', ')}` });

    const { name, email } = req.body;
    if (name && (typeof name !== 'string' || name.trim().length < 3)) return res.status(400).json({ success: false, message: "name must be at least 3 characters long." });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: "Invalid email format." });

    next();
};

export const validateUpdateVisitorStatus = (req, res, next) => {
    const { visitorId } = req.params;
    const { status } = req.body;

    if (!isUUID(visitorId)) return res.status(400).json({ success: false, message: "Invalid visitor ID." });
    if (!status || !VISITOR_STATUS_VALUES.includes(status.toUpperCase())) return res.status(400).json({ success: false, message: `Invalid or missing status. Allowed values: ${VISITOR_STATUS_VALUES.join(', ')}` });

    next();
};

export const validateApproveVisitRequest = (req, res, next) => {
    const { visitRequestId } = req.params;
    if (!isUUID(visitRequestId)) return res.status(400).json({ success: false, message: 'Invalid visitRequestId.' });
    next();
};

export const validateRejectVisitRequest = (req, res, next) => {
    const { visitRequestId } = req.params;
    const { reason } = req.body;

    if (!isUUID(visitRequestId)) return res.status(400).json({ success: false, message: 'Invalid visitRequestId.' });
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) return res.status(400).json({ success: false, message: 'Rejection reason is required.' });

    req.body.reason = reason.trim();
    next();
};

export const validateBlacklistVisitor = (req, res, next) => {
    const { visitorId } = req.params;
    const { reason } = req.body;

    if (!isUUID(visitorId)) return res.status(400).json({ success: false, message: 'Invalid visitorId.' });
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) return res.status(400).json({ success: false, message: 'Reason is required and must be at least 3 characters.' });

    req.body.reason = reason.trim();
    next();
};

export const validateRemoveBlacklistVisitor = (req, res, next) => {
    const { visitorId } = req.params;
    if (!isUUID(visitorId)) return res.status(400).json({ success: false, message: 'Invalid visitorId.' });

    if (req.body.reason && typeof req.body.reason === 'string') req.body.reason = req.body.reason.trim();
    next();
};
