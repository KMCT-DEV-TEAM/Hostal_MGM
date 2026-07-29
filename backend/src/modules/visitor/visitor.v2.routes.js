import express from 'express';
import verifyStudentAccess from '../../middlewares/verifyStudentAccess.middleware.js';
import * as visitorController from './visitor.controller.js';
import {
    validateCreateVisitor,
    validateEndUserListVisitors,
    validateGetVisitorDetails,
    validateListVisits,
    validateGetVisitDetails,
    validateUpdateVisitor,
    validateUpdateVisitorStatus,
} from './visitor.validation.js';

const router = express.Router({ mergeParams: true });

// Protect all visitor routes with explicit student access check
router.use(verifyStudentAccess);

// Dashboard
router.get('/dashboard-summary', visitorController.getVisitorDashboardSummaryV2);

// Visitor Management
router.post('/', validateCreateVisitor, visitorController.createVisitorV2);
router.get('/', validateEndUserListVisitors, visitorController.listParentVisitors);
router.patch('/:visitorId', validateUpdateVisitor, visitorController.updateVisitorV2);
router.get('/:visitorId', validateGetVisitorDetails, visitorController.getVisitorDetailsV2);
router.patch('/:visitorId/status', validateUpdateVisitorStatus, visitorController.updateVisitorStatusV2);

// Visitor Visits Management
router.get('/visits', validateListVisits, visitorController.listVisitorVisitsV2);
router.get('/visits/:visitId', validateGetVisitDetails, visitorController.getVisitDetailsV2);

export default router;
