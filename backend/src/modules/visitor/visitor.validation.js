import mongoose from "mongoose";
import { VISITOR_STATUS_VALUES, VISITOR_VISIT_STATUS, ID_PROOF_TYPE_VALUES } from "./visitor.constant.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const isValidPhone = (phone) => /^\+?[\d\s-]{10,15}$/.test(phone);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateCreateVisitor = (req, res, next) => {
    // ── Forbidden fields: client must never send these ──────────────────────
    const FORBIDDEN_BODY_FIELDS = ['studentId', 'students', 'hostelId', 'organizationId'];
    const forbiddenPresent = FORBIDDEN_BODY_FIELDS.filter(f => req.body[f] !== undefined);
    if (forbiddenPresent.length > 0) {
        return res.status(400).json({
            success: false,
            message: `The following fields are not allowed in the request body: ${forbiddenPresent.join(', ')}. Please use 'studentIds' array.`
        });
    }

    const {
        studentIds,
        name,
        relationship,
        phone,
        email,
        address,
        idProofType,
        idProofNumber,
        purpose,
        remarks,
        confirmReuse
    } = req.body;

    // ── Student Context ──────────────────────────────────────────────────────
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: "studentIds must be a non-empty array of valid object IDs."
        });
    }
    if (studentIds.length > 5) {
        return res.status(400).json({
            success: false,
            message: "You can only select up to 5 students per visit request."
        });
    }
    for (const id of studentIds) {
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: `Invalid student ID in array: ${id}`
            });
        }
    }

    // ── Visitor identity fields ──────────────────────────────────────────────

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
        return res.status(400).json({
            success: false,
            message: "name is required and must be at least 3 characters long."
        });
    }

    // Validate relationship
    if (!relationship || typeof relationship !== 'string' || relationship.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "relationship is required."
        });
    }

    // Validate phone
    if (!phone || !isValidPhone(phone)) {
        return res.status(400).json({
            success: false,
            message: "A valid phone number is required (10–15 digits)."
        });
    }

    // Validate optional email
    if (email && !isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "If provided, email must be a valid email address."
        });
    }

    // Validate idProofType — required
    if (!idProofType || typeof idProofType !== 'string' || idProofType.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "idProofType is required."
        });
    }
    if (!ID_PROOF_TYPE_VALUES.includes(idProofType.trim())) {
        return res.status(400).json({
            success: false,
            message: `Invalid idProofType. Allowed values: ${ID_PROOF_TYPE_VALUES.join(', ')}.`
        });
    }

    // Validate idProofNumber — required
    if (!idProofNumber || typeof idProofNumber !== 'string' || idProofNumber.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "idProofNumber is required."
        });
    }

    // ── VisitRequest fields ──────────────────────────────────────────────────

    // Validate purpose — required for VisitRequest
    if (!purpose || typeof purpose !== 'string' || purpose.trim().length < 3 || purpose.trim().length > 255) {
        return res.status(400).json({
            success: false,
            message: "purpose is required and must be between 3 and 255 characters."
        });
    }

    // Validate optional remarks
    if (remarks !== undefined && (typeof remarks !== 'string' || remarks.trim().length > 500)) {
        return res.status(400).json({
            success: false,
            message: "remarks must be a string of at most 500 characters."
        });
    }

    // ── Sanitize and attach clean values ────────────────────────────────────
    req.body.studentIds = [...new Set(studentIds)]; // Deduplicate array
    req.body.name = name.trim();
    req.body.relationship = relationship.trim();
    req.body.phone = phone.trim();
    req.body.idProofType = idProofType.trim();
    req.body.idProofNumber = idProofNumber.trim();
    req.body.purpose = purpose.trim();
    if (email) req.body.email = email.trim().toLowerCase();
    if (address) req.body.address = address.trim();
    if (remarks) req.body.remarks = remarks.trim();
    req.body.confirmReuse = confirmReuse === true || confirmReuse === 'true';

    next();
};

export const validateConfirmVisitor = (req, res, next) => {
    const {
        studentIds,
        relationship,
        purpose,
        remarks
    } = req.body;

    // ── Student Context ──────────────────────────────────────────────────────
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: "studentIds must be a non-empty array of valid object IDs."
        });
    }
    if (studentIds.length > 5) {
        return res.status(400).json({
            success: false,
            message: "You can only select up to 5 students per visit request."
        });
    }
    for (const id of studentIds) {
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: `Invalid student ID in array: ${id}`
            });
        }
    }

    // Validate relationship
    if (!relationship || typeof relationship !== 'string' || relationship.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "relationship is required."
        });
    }

    // Validate purpose — required for VisitRequest
    if (!purpose || typeof purpose !== 'string' || purpose.trim().length < 3 || purpose.trim().length > 255) {
        return res.status(400).json({
            success: false,
            message: "purpose is required and must be between 3 and 255 characters."
        });
    }

    // Validate optional remarks
    if (remarks !== undefined && (typeof remarks !== 'string' || remarks.trim().length > 500)) {
        return res.status(400).json({
            success: false,
            message: "remarks must be a string of at most 500 characters."
        });
    }

    // ── Sanitize and attach clean values ────────────────────────────────────
    req.body.studentIds = [...new Set(studentIds)]; // Deduplicate array
    req.body.relationship = relationship.trim();
    req.body.purpose = purpose.trim();
    if (remarks) req.body.remarks = remarks.trim();

    next();
};


export const validateListVisitors = (req, res, next) => {
    let { page, limit, status, hostel, organization, sortBy, sortOrder } = req.query;

    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
        return res.status(400).json({ success: false, message: "Invalid page parameter." });
    }
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
        return res.status(400).json({ success: false, message: "Invalid limit parameter (must be 1-100)." });
    }

    if (status && !VISITOR_STATUS_VALUES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status parameter." });
    }

    if (hostel && !isValidObjectId(hostel)) {
        return res.status(400).json({ success: false, message: "Invalid hostel ID format." });
    }

    if (organization && !isValidObjectId(organization)) {
        return res.status(400).json({ success: false, message: "Invalid organization ID format." });
    }

    const allowedSortFields = ['createdAt', 'visitorName', 'status'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
        return res.status(400).json({ success: false, message: "Invalid sortBy parameter." });
    }

    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Invalid sortOrder parameter (must be asc or desc)." });
    }

    next();
};

export const validateEndUserListVisitors = (req, res, next) => {
    let { page, limit, status, sortBy, sortOrder } = req.query;

    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
        return res.status(400).json({ success: false, message: "Invalid page parameter." });
    }
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
        return res.status(400).json({ success: false, message: "Invalid limit parameter (must be 1-100)." });
    }

    if (status && !VISITOR_STATUS_VALUES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status parameter." });
    }

    const allowedSortFields = ['createdAt', 'visitorName', 'status'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
        return res.status(400).json({ success: false, message: "Invalid sortBy parameter." });
    }

    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Invalid sortOrder parameter (must be asc or desc)." });
    }

    next();
};

export const validateGetVisitorDetails = (req, res, next) => {
    const { visitorId } = req.params;

    if (!isValidObjectId(visitorId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid visitor ID."
        });
    }

    next();
};

export const validateApproveVisitor = (req, res, next) => {
    const { visitorId } = req.params;

    if (!isValidObjectId(visitorId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid visitor ID."
        });
    }

    next();
};

export const validateRejectVisitor = (req, res, next) => {
    const { visitorId } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(visitorId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid visitor ID."
        });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 500) {
        return res.status(400).json({
            success: false,
            message: "Rejection reason is required and must be between 3 and 500 characters."
        });
    }

    req.body.reason = reason.trim();
    next();
};

export const validateCheckInVisitor = (req, res, next) => {
    const { visitor, purpose, expectedExitTime, selectedStudentIds } = req.body;

    if (!Array.isArray(selectedStudentIds) || selectedStudentIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: "selectedStudentIds must be a non-empty array of valid object IDs."
        });
    }

    for (const id of selectedStudentIds) {
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: `Invalid student ID: ${id}`
            });
        }
    }

    if (!visitor || !visitor.refId || !isValidObjectId(visitor.refId)) {
        return res.status(400).json({
            success: false,
            message: "A valid visitor.refId is required."
        });
    }

    if (!visitor.refType || !['Parent', 'Visitor'].includes(visitor.refType)) {
        return res.status(400).json({
            success: false,
            message: "visitor.refType must be 'Parent' or 'Visitor'."
        });
    }

    if (!purpose || typeof purpose !== 'string' || purpose.trim().length < 3 || purpose.trim().length > 255) {
        return res.status(400).json({
            success: false,
            message: "Visiting purpose is required and must be between 3 and 255 characters."
        });
    }

    if (!expectedExitTime || typeof expectedExitTime !== 'string') {
        return res.status(400).json({
            success: false,
            message: "A valid expectedExitTime is required."
        });
    }



    req.body.purpose = purpose.trim();
    next();
};

export const validateAddStudentsToVisit = (req, res, next) => {
    const { visitId } = req.params;
    const { selectedStudentIds } = req.body;

    if (!isValidObjectId(visitId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid visit ID."
        });
    }

    if (!Array.isArray(selectedStudentIds) || selectedStudentIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: "selectedStudentIds must be a non-empty array of valid object IDs."
        });
    }

    for (const id of selectedStudentIds) {
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: `Invalid student ID: ${id}`
            });
        }
    }

    next();
};

export const validateSuperAdminHostelVisits = (req, res, next) => {
    let { page, limit } = req.query;

    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
        return res.status(400).json({ success: false, message: "Invalid page parameter." });
    }
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
        return res.status(400).json({ success: false, message: "Invalid limit parameter (must be 1-100)." });
    }

    // search is string, no validation needed

    next();
};

export const validateListVisits = (req, res, next) => {
    let { page, limit, status, hostel, date, sortBy, sortOrder } = req.query;

    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
        return res.status(400).json({ success: false, message: "Invalid page parameter." });
    }
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
        return res.status(400).json({ success: false, message: "Invalid limit parameter (must be 1-100)." });
    }

    const allowedStatuses = Object.values(VISITOR_VISIT_STATUS);
    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status parameter." });
    }

    if (hostel && !isValidObjectId(hostel)) {
        return res.status(400).json({ success: false, message: "Invalid hostel ID format." });
    }

    if (date && isNaN(Date.parse(date))) {
        return res.status(400).json({ success: false, message: "Invalid date format." });
    }

    const allowedSortFields = ['checkInTime', 'visitorName', 'status'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
        return res.status(400).json({ success: false, message: "Invalid sortBy parameter." });
    }

    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Invalid sortOrder parameter (must be asc or desc)." });
    }

    next();
};

export const validateGetVisitDetails = (req, res, next) => {
    const { visitId } = req.params;

    if (!isValidObjectId(visitId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid visit ID."
        });
    }

    next();
};

export const validateUpdateVisitor = (req, res, next) => {
    const { visitorId } = req.params;

    if (!isValidObjectId(visitorId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid visitor ID."
        });
    }

    const allowedFields = ['name', 'idProofType', 'idProofNumber', 'address', 'email', 'phone'];
    const updateKeys = Object.keys(req.body);

    if (updateKeys.length === 0) {
        return res.status(400).json({
            success: false,
            message: "At least one field is required to update."
        });
    }

    const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Only the following fields can be updated: ${allowedFields.join(', ')}. Invalid fields provided: ${invalidFields.join(', ')}`
        });
    }

    const { name, email, phone } = req.body;

    if (name && (typeof name !== 'string' || name.trim().length < 3)) {
        return res.status(400).json({ success: false, message: "name must be at least 3 characters long." });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    if (phone && !/^\+?[\d\s-]{10,15}$/.test(phone)) {
        return res.status(400).json({ success: false, message: "Invalid phone number format." });
    }

    const { idProofType } = req.body;
    if (idProofType && !ID_PROOF_TYPE_VALUES.includes(idProofType)) {
        return res.status(400).json({ success: false, message: "Invalid idProofType." });
    }

    next();
};

export const validateUpdateVisitorStatus = (req, res, next) => {
    const { visitorId } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(visitorId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid visitor ID."
        });
    }

    if (!status || !VISITOR_STATUS_VALUES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid or missing status. Allowed values: ${VISITOR_STATUS_VALUES.join(', ')}`
        });
    }

    next();
};


export const validateApproveVisitRequest = (req, res, next) => {
    const { visitRequestId } = req.params;
    if (!isValidObjectId(visitRequestId)) {
        return res.status(400).json({ success: false, message: 'Invalid visitRequestId.' });
    }
    next();
};

export const validateRejectVisitRequest = (req, res, next) => {
    const { visitRequestId } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(visitRequestId)) {
        return res.status(400).json({ success: false, message: 'Invalid visitRequestId.' });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    req.body.reason = reason.trim();
    next();
};
