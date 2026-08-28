import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createComplaint,
  updateComplaint,
  deleteComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintSummary,
  updateComplaintStatus,
  assignMaintenanceStaff,
  getAssignedComplaints,
  submitComplaintResolution,
  rejectAssignedTask,
  approveComplaintResolution,
  rejectComplaintResolution,
  addInternalNote
} from './complaint.controller.js';

const router = express.Router();

// Apply auth protect middleware to all complaint routes
router.use(protect);

// Student routes
router.post('/', createComplaint);
router.get('/my-complaints', getMyComplaints);

// Summary and Assigned routes (must be before /:id)
router.get('/summary', getComplaintSummary);
router.get('/assigned', getAssignedComplaints);
router.get('/', getAllComplaints);

// Specific complaint operations
router.put('/:id', updateComplaint);
router.delete('/:id', deleteComplaint);
router.patch('/:id/status', updateComplaintStatus);
router.patch('/:id/assign', assignMaintenanceStaff);

// Maintenance Staff / Resolution workflows
router.patch('/:id/resolve-request', submitComplaintResolution);
router.patch('/:id/reject-task', rejectAssignedTask);
router.patch('/:id/approve-resolution', approveComplaintResolution);
router.patch('/:id/reject-resolution', rejectComplaintResolution);

// Internal staff notes
router.post('/:id/internal-notes', addInternalNote);

export default router;
