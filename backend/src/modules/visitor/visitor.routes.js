import express from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import { 
    validateCreateVisitor, 
    validateListVisitors, 
    validateEndUserListVisitors, 
    validateApproveVisitor, 
    validateRejectVisitor 
} from './visitor.validation.js';
import * as visitorController from './visitor.controller.js';

const router = express.Router();

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

export default router;
