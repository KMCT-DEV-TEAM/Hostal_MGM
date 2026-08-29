import express from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
    validateCreateVisitor,
    validateConfirmVisitor,
    validateListVisitors,
    validateEndUserListVisitors,
    validateGetVisitorDetails,
    validateUnassignVisitor,
    validateUpdateVisitorStatus
} from './visitor.validation.js';
import * as visitorController from './visitor.controller.js';
import verifyStudentAccess from '../../middlewares/verifyStudentAccess.middleware.js';

const router = express.Router();
export const parentVisitorRouter = express.Router({ mergeParams: true });

// Apply verification for all parent routes
parentVisitorRouter.use(authMiddleware, roleMiddleware(ROLES.PARENT), verifyStudentAccess);

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
// Management Routes (Admin, Super Admin, Warden, Mentor)
// ---------------------------------------------------------
router.get(
    '/',
    authMiddleware,
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN, ROLES.MENTOR),
    validateListVisitors,
    visitorController.listVisitors
);

// ---------------------------------------------------------
// Student Routes
// ---------------------------------------------------------
router.get(
    '/student/visitors',
    authMiddleware,
    roleMiddleware(ROLES.STUDENT),
    validateEndUserListVisitors,
    visitorController.listStudentVisitors
);

// ---------------------------------------------------------
// Common Shared Routes (All Roles)
// ---------------------------------------------------------
router.get(
    '/:visitorId',
    authMiddleware,
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN, ROLES.MENTOR, ROLES.STUDENT),
    validateGetVisitorDetails,
    visitorController.getVisitorDetails
);

router.patch(
    '/:visitorId/status',
    authMiddleware,
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MENTOR),
    validateUpdateVisitorStatus,
    visitorController.updateVisitorStatus
);

// Note: Other routes like vistHistoryController (visits), updateVisitor, etc. 
// are commented out/omitted temporarily until their controllers are fully migrated.

export default router;
