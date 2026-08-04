import express from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import {
    validateCreateVisitor,
    validateConfirmVisitor,
    validateListVisitors,
    validateEndUserListVisitors,
    validateGetVisitorDetails,
    validateApproveVisitor,
    validateRejectVisitor,
    validateCheckInVisitor,
    validateSuperAdminHostelVisits,
    validateListVisits,
    validateGetVisitDetails,
    validateUpdateVisitor,
    validateUpdateVisitorStatus,
    validateAddStudentsToVisit,
    validateApproveVisitRequest,
    validateRejectVisitRequest,
    validateUnassignVisitor,
    validateBlacklistVisitor,
    validateRemoveBlacklistVisitor
} from './visitor.validation.js';
import * as visitorController from './visitor.controller.js';
import * as vistHistoryController from './history/visitorHistory.controller.js';
import verifyStudentAccess from '../../middlewares/verifyStudentAccess.middleware.js';

const router = express.Router();
export const parentVisitorRouter = express.Router({ mergeParams: true });

// Apply verification for all parent routes
parentVisitorRouter.use(authMiddleware, roleMiddleware('parent'), verifyStudentAccess);

// ---------------------------------------------------------
// Parent End-User Routes (Mounted at /api/parent/visitors)
// ---------------------------------------------------------
parentVisitorRouter.post(
    '/',
    validateCreateVisitor,
    visitorController.createVisitor
);

parentVisitorRouter.post(
    '/:visitorId/visit-requests',
    validateConfirmVisitor,
    visitorController.confirmVisitorReuse
);

parentVisitorRouter.patch(
    '/:visitorId/unassign',
    validateUnassignVisitor,
    visitorController.unassignVisitor
);

parentVisitorRouter.get(
    '/',
    validateEndUserListVisitors,
    visitorController.listParentVisitors
);

// ---------------------------------------------------------
// Parent Visit Listing Routes
// ---------------------------------------------------------
parentVisitorRouter.get(
    '/visits',
    validateListVisits,
    vistHistoryController.listVisitorVisits
);

parentVisitorRouter.get(
    '/visits/:visitId',
    validateGetVisitDetails,
    vistHistoryController.getVisitDetails
);

parentVisitorRouter.patch(
    '/:visitorId',
    validateUpdateVisitor,
    visitorController.updateVisitor
);

parentVisitorRouter.get(
    '/:visitorId',
    validateGetVisitorDetails,
    visitorController.getParentVisitorDetails
);

parentVisitorRouter.patch(
    '/:visitorId/status',
    validateUpdateVisitorStatus,
    visitorController.updateVisitorStatus
);

// ---------------------------------------------------------
// Dashboard Routes
// ---------------------------------------------------------
router.get(
    '/dashboard-summary',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'warden', 'parent', 'student'),
    visitorController.getVisitorDashboardSummary
);

// ---------------------------------------------------------
// Visitor Visit Listing Routes
// ---------------------------------------------------------
router.get(
    '/super-admin/visitor-visits/hostels',
    authMiddleware,
    roleMiddleware('super_admin'),
    validateSuperAdminHostelVisits,
    vistHistoryController.getSuperAdminHostelVisits
);

router.get(
    '/super-admin/visitors/hostels',
    authMiddleware,
    roleMiddleware('super_admin'),
    validateSuperAdminHostelVisits,
    visitorController.getSuperAdminHostelVisitors
);

router.patch(
    '/super-admin/visitors/:visitorId/blacklist',
    authMiddleware,
    roleMiddleware('super_admin'),
    validateBlacklistVisitor,
    visitorController.blacklistVisitor
);

router.patch(
    '/super-admin/visitors/:visitorId/remove-blacklist',
    authMiddleware,
    roleMiddleware('super_admin'),
    validateRemoveBlacklistVisitor,
    visitorController.removeBlacklistVisitor
);
router.get(
    '/visitor-visits',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'warden', 'parent', 'student'),
    validateListVisits,
    vistHistoryController.listVisitorVisits
);

router.get(
    '/visitor-visits/:visitId',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'warden', 'parent', 'student'),
    validateGetVisitDetails,
    vistHistoryController.getVisitDetails
);

// ---------------------------------------------------------
// End-User Routes (Parent & Student)
// ---------------------------------------------------------
// The parent routes have been moved to parentVisitorRouter

router.get(
    '/student/visitors',
    authMiddleware,
    roleMiddleware('student'),
    validateEndUserListVisitors,
    visitorController.listStudentVisitors
);

// ---------------------------------------------------------
// Management Routes (Admin, Super Admin, Warden, Mentor)
// ---------------------------------------------------------
router.get(
    '/',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'warden', 'mentor'),
    validateListVisitors,
    visitorController.listVisitors
);

// ---------------------------------------------------------
// Visit Management (Warden)
// ---------------------------------------------------------
router.post(
    '/check-in',
    authMiddleware,
    roleMiddleware('warden'),
    validateCheckInVisitor,
    visitorController.checkInVisitor
);

router.patch(
    '/:visitId/students',
    authMiddleware,
    roleMiddleware('warden'),
    validateAddStudentsToVisit,
    visitorController.addStudentsToVisit
);

// ---------------------------------------------------------
// Common Shared Routes (All Roles)
// ---------------------------------------------------------
router.get(
    '/:visitorId',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'warden', 'mentor', 'student'),
    validateGetVisitorDetails,
    visitorController.getVisitorDetails
);
// ---------------------------------------------------------
// VisitRequest Action Routes
// ---------------------------------------------------------
router.patch(
    '/visit-requests/:visitRequestId/approve',
    authMiddleware,
    validateApproveVisitRequest, // To be implemented in validation
    visitorController.approveVisitRequest
);

router.patch(
    '/visit-requests/:visitRequestId/reject',
    authMiddleware,
    validateRejectVisitRequest,
    visitorController.rejectVisitRequest
);

router.patch(
    '/:visitorId/status',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'mentor'),
    validateUpdateVisitorStatus,
    visitorController.updateVisitorStatus
);

export default router;
