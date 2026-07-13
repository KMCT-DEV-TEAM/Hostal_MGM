import express from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import {
    validateCreateVisitor,
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
    validateUpdateVisitorStatus
} from './visitor.validation.js';
import * as visitorController from './visitor.controller.js';

const router = express.Router();

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
router.post(
    '/parent/visitors',
    authMiddleware,
    roleMiddleware('parent'),
    validateCreateVisitor,
    visitorController.createVisitor
);

router.get(
    '/parent/visitors',
    authMiddleware,
    roleMiddleware('parent'),
    validateEndUserListVisitors,
    visitorController.listParentVisitors
);

router.patch(
    '/parent/visitors/:visitorId',
    authMiddleware,
    roleMiddleware('parent'),
    validateUpdateVisitor,
    visitorController.updateVisitor
);

router.get(
    '/student/visitors',
    authMiddleware,
    roleMiddleware('student'),
    validateEndUserListVisitors,
    visitorController.listStudentVisitors
);

// ---------------------------------------------------------
// Management Routes (Admin, Super Admin, Warden)
// ---------------------------------------------------------
router.get(
    '/',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'warden'),
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

// ---------------------------------------------------------
// Common Shared Routes (All Roles)
// ---------------------------------------------------------
router.get(
    '/:visitorId',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'warden', 'parent', 'student'),
    validateGetVisitorDetails,
    visitorController.getVisitorDetails
);
// ---------------------------------------------------------
// Action Routes
// ---------------------------------------------------------
router.patch(
    '/:visitorId/approve',
    authMiddleware,
    roleMiddleware('super_admin', 'admin'),
    validateApproveVisitor,
    visitorController.approveVisitor
);

router.patch(
    '/:visitorId/reject',
    authMiddleware,
    roleMiddleware('super_admin', 'admin'),
    validateRejectVisitor,
    visitorController.rejectVisitor
);

router.patch(
    '/:visitorId/status',
    authMiddleware,
    roleMiddleware('super_admin', 'admin', 'parent'),
    validateUpdateVisitorStatus,
    visitorController.updateVisitorStatus
);

export default router;
