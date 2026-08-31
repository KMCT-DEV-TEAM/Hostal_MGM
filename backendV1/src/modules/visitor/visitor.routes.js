import express from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import verifyStudentAccess from '../../middlewares/verifyStudentAccess.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
    validateCreateVisitor,
    validateConfirmVisitor,
    validateListVisitors,
    validateEndUserListVisitors,
    validateGetVisitorDetails,
    validateUnassignVisitor,
    validateUpdateVisitorStatus,
    validateListVisits,
    validateGetVisitDetails,
    validateSuperAdminHostelVisits,
    validateApproveVisitRequest,
    validateRejectVisitRequest,
    validateCheckInVisitor,
    validateAddStudentsToVisit,
    validateBlacklistVisitor,
    validateRemoveBlacklistVisitor,
    validateUpdateVisitor
} from './visitor.validation.js';
import * as visitorController from './visitor.controller.js';

const router = express.Router();

// Apply authMiddleware router-wide
router.use(authMiddleware);

// =========================================================
// 1. GET ROUTES (Static & Specific routes come before dynamic params)
// =========================================================

// List Visitors (Super Admin, Admin, Warden, Mentor, Parent, Student)
router.get(
    '/',
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN, ROLES.MENTOR, ROLES.PARENT, ROLES.STUDENT),
    verifyStudentAccess,
    validateListVisitors,
    visitorController.listVisitors
);

// Get Visitor Dashboard Summary
router.get(
    '/dashboard-summary',
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN, ROLES.PARENT, ROLES.STUDENT),
    visitorController.getVisitorDashboardSummary
);

// List Student Visitors (Student)
router.get(
    '/student',
    roleMiddleware(ROLES.STUDENT),
    validateEndUserListVisitors,
    visitorController.listStudentVisitors
);

// List Visitor Visits
router.get(
    '/visitor-visits',
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN, ROLES.PARENT, ROLES.STUDENT, ROLES.MENTOR),
    verifyStudentAccess,
    validateListVisits,
    visitorController.listVisitorVisits
);
// Get Visit Details
router.get(
    '/visitor-visits/:visitId',
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN, ROLES.PARENT, ROLES.STUDENT, ROLES.MENTOR),
    verifyStudentAccess,
    validateGetVisitDetails,
    visitorController.getVisitDetails
);
//////////////

// Super Admin: Hostel Visits Summary
router.get(
    '/super-admin/visitor-visits/hostels',
    roleMiddleware(ROLES.SUPER_ADMIN),
    validateSuperAdminHostelVisits,
    visitorController.getSuperAdminHostelVisits
);

// Super Admin: Hostel Visitors Summary
router.get(
    '/super-admin/visitors/hostels',
    roleMiddleware(ROLES.SUPER_ADMIN),
    validateSuperAdminHostelVisits,
    visitorController.getSuperAdminHostelVisitors
);

// Get Visitor Details by ID (Must be placed after specific GET routes)
router.get(
    '/:visitorId',
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN, ROLES.MENTOR, ROLES.STUDENT, ROLES.PARENT),
    verifyStudentAccess,
    validateGetVisitorDetails,
    visitorController.getVisitorDetails
);

// =========================================================
// 2. POST ROUTES
// =========================================================

// Create Visitor Profile + Visit Request (Parent)
router.post(
    '/',
    roleMiddleware(ROLES.PARENT),
    verifyStudentAccess,
    validateCreateVisitor,
    visitorController.createVisitor
);

// Check-in Visitor (Warden)
router.post(
    '/check-in',
    roleMiddleware(ROLES.WARDEN),
    validateCheckInVisitor,
    visitorController.checkInVisitor
);

// Confirm / Reuse Visitor Profile (Parent)
router.post(
    '/:visitorId/visit-requests',
    roleMiddleware(ROLES.PARENT),
    validateConfirmVisitor,
    visitorController.confirmVisitorReuse
);

// =========================================================
// 3. PATCH ROUTES
// =========================================================

// Approve Visit Request (Super Admin, Admin, Mentor)
router.patch(
    '/visit-requests/:visitRequestId/approve',
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MENTOR),
    validateApproveVisitRequest,
    visitorController.approveVisitRequest
);

// Reject Visit Request (Super Admin, Admin, Mentor)
router.patch(
    '/visit-requests/:visitRequestId/reject',
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MENTOR),
    validateRejectVisitRequest,
    visitorController.rejectVisitRequest
);

// Super Admin: Blacklist Visitor
router.patch(
    '/super-admin/visitors/:visitorId/blacklist',
    roleMiddleware(ROLES.SUPER_ADMIN),
    validateBlacklistVisitor,
    visitorController.blacklistVisitor
);

// Super Admin: Remove Visitor Blacklist
router.patch(
    '/super-admin/visitors/:visitorId/remove-blacklist',
    roleMiddleware(ROLES.SUPER_ADMIN),
    validateRemoveBlacklistVisitor,
    visitorController.removeBlacklistVisitor
);

// Add Students to Visit (Warden)
router.patch(
    '/:visitId/students',
    roleMiddleware(ROLES.WARDEN),
    validateAddStudentsToVisit,
    visitorController.addStudentsToVisit
);

// Update Visitor Status
router.patch(
    '/:visitorId/status',
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MENTOR, ROLES.PARENT),
    verifyStudentAccess,
    validateUpdateVisitorStatus,
    visitorController.updateVisitorStatus
);

// Unassign Visitor from Student (Parent)
router.patch(
    '/:visitorId/unassign',
    roleMiddleware(ROLES.PARENT),
    validateUnassignVisitor,
    visitorController.unassignVisitor
);

// Update Visitor Profile (Parent)
router.patch(
    '/:visitorId',
    roleMiddleware(ROLES.PARENT),
    verifyStudentAccess,
    validateUpdateVisitor,
    visitorController.updateVisitor
);

export default router;
