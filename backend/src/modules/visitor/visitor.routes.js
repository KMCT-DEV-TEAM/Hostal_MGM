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
} from './visitor.validation.js';
import * as visitorController from './visitor.controller.js';

import verifyStudentAccess from '../../middlewares/verifyStudentAccess.middleware.js';

const router = express.Router();
export const parentVisitorRouter = express.Router({ mergeParams: true });

// Apply verification for all parent routes
// NOTE: verifyStudentAccess is removed from the global middleware here because 
// create and confirm endpoints now take an array of studentIds and do their own validation.
parentVisitorRouter.use(authMiddleware, roleMiddleware('parent'));

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
    visitorController.listVisitorVisits
);

parentVisitorRouter.get(
    '/visits/:visitId',
    validateGetVisitDetails,
    visitorController.getVisitDetails
);

parentVisitorRouter.patch(
    '/:visitorId',
    validateUpdateVisitor,
    visitorController.updateVisitor
);

parentVisitorRouter.get(
    '/:visitorId',
    validateGetVisitorDetails,
    visitorController.getVisitorDetails
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
    visitorController.getSuperAdminHostelVisits
);

router.get(
    '/super-admin/visitors/hostels',
    authMiddleware,
    roleMiddleware('super_admin'),
    validateSuperAdminHostelVisits,
    visitorController.getSuperAdminHostelVisitors
);

router.get(
    '/visitor-visits',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'warden', 'parent', 'student'),
    validateListVisits,
    visitorController.listVisitorVisits
);

router.get(
    '/visitor-visits/:visitId',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'warden', 'parent', 'student'),
    validateGetVisitDetails,
    visitorController.getVisitDetails
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
    '/warden/visits/check-in',
    authMiddleware,
    roleMiddleware('warden'),
    validateCheckInVisitor,
    visitorController.checkInVisitor
);

router.patch(
    '/warden/visits/:visitId/students',
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
// Action Routes
// ---------------------------------------------------------
router.patch(
    '/:visitorId/approve',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'mentor'),
    validateApproveVisitor,
    visitorController.approveVisitor
);

router.patch(
    '/:visitorId/reject',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'mentor'),
    validateRejectVisitor,
    visitorController.rejectVisitor
);

router.patch(
    '/:visitorId/status',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'mentor'),
    validateUpdateVisitorStatus,
    visitorController.updateVisitorStatus
);

export default router;
