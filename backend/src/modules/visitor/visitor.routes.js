import express from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import { validateCreateVisitor, validateListVisitors, validateApproveVisitor, validateRejectVisitor } from './visitor.validation.js';
import * as visitorController from './visitor.controller.js';

const router = express.Router();

router.post(
    '/parent/visitors',
    authMiddleware,
    roleMiddleware('parent'),
    validateCreateVisitor,
    visitorController.createVisitor
);

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
