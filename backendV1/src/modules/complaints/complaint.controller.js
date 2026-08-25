import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import * as complaintService from './complaint.service.js';
import { createLogDb } from '../logs/log.service.js';
import { getIo } from '../../config/socket.js';
import { orchestratorService } from '../notification/services/orchestrator.service.js';
import { buildSender } from '../notifications/utils/sender.util.js';
import { prisma } from '../../config/prisma.js';

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Student)
export const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.createComplaintDb(req.body, req.user);

  const fullComplaint = await prisma.complaint.findUnique({
    where: { id: complaint.id },
    include: {
      student: true,
      hostel: {
        include: {
          wardens: true
        }
      }
    }
  });

  if (fullComplaint && fullComplaint.hostel) {
    const wardenUserIds = (fullComplaint.hostel.wardens || fullComplaint.hostel.hostelWardens || []).map(hw => hw.userId);
    const sName = fullComplaint.student?.name || fullComplaint.student?.fullName || 'Student';

    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'COMPLAINT_CREATED',
      target: [
        { type: 'USER', filter: { userIds: wardenUserIds } },
        { type: 'ROLE', filter: { role: 'super_admin' } },
        { type: 'ROLE', filter: { role: 'admin', organizationId: fullComplaint.organizationId } }
      ],
      data: { title: fullComplaint.subject, studentName: sName }
    }).catch(err => console.error('[Notification Error]:', err));
  }

  getIo()?.emit('complaintCreated', complaint);

  return sendSuccess(res, 201, 'Complaint registered successfully.', complaint);
});

// @desc    Update a complaint
// @route   PUT /api/complaints/:id
// @access  Private (Student)
export const updateComplaint = asyncHandler(async (req, res) => {
  const updatedComplaint = await complaintService.updateComplaintDb(req.params.id, req.user, req.body);
  getIo()?.emit('complaintUpdated', { id: req.params.id });

  return sendSuccess(res, 200, 'Complaint updated successfully.', updatedComplaint);
});

// @desc    Delete (withdraw) a complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Student)
export const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: req.params.id },
    include: {
      student: true,
      hostel: {
        include: {
          wardens: true
        }
      }
    }
  });

  await complaintService.deleteComplaintDb(req.params.id, req.user.id);

  if (complaint && complaint.hostel) {
    const wardenUserIds = (complaint.hostel.wardens || complaint.hostel.hostelWardens || []).map(hw => hw.userId);
    const sName = complaint.student?.name || complaint.student?.fullName || 'Student';

    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'COMPLAINT_DELETED',
      target: [
        { type: 'USER', filter: { userIds: wardenUserIds } },
        { type: 'ROLE', filter: { role: 'super_admin' } },
        { type: 'ROLE', filter: { role: 'admin', organizationId: complaint.organizationId } }
      ],
      data: { title: complaint.subject, studentName: sName }
    }).catch(err => console.error('[Notification Error]:', err));
  }

  getIo()?.emit('complaintDeleted', { id: req.params.id });

  return sendSuccess(res, 200, 'Complaint withdrawn successfully.');
});

// @desc    Get all complaints for a student
// @route   GET /api/complaints/my-complaints
// @access  Private (Student)
export const getMyComplaints = asyncHandler(async (req, res) => {
  let pagination = null;
  if (req.query.page && req.query.limit) {
    pagination = {
      page: parseInt(req.query.page, 10),
      limit: parseInt(req.query.limit, 10),
      skip: (parseInt(req.query.page, 10) - 1) * parseInt(req.query.limit, 10)
    };
  }

  const result = await complaintService.getStudentComplaintsDb(req.user.id, req.query.type, pagination);

  return sendSuccess(res, 200, 'Student complaints fetched successfully', {
    ...result,
    data: result.complaints
  });
});

// @desc    Get all complaints (Admin/Warden scoped)
// @route   GET /api/complaints
// @access  Private (Admin/Warden/SuperAdmin)
export const getAllComplaints = asyncHandler(async (req, res) => {
  let pagination = null;
  if (req.query.page && req.query.limit) {
    pagination = {
      page: parseInt(req.query.page, 10),
      limit: parseInt(req.query.limit, 10),
      skip: (parseInt(req.query.page, 10) - 1) * parseInt(req.query.limit, 10)
    };
  }

  const query = {};
  const userRole = (req.user.role || '').toLowerCase();

  // Scope based on role
  if (userRole === 'admin') {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.organizationId) {
      return sendError(res, 403, 'Admin user has no organization associated.');
    }
    query.organizationId = user.organizationId;
  } else if (userRole === 'warden' || userRole === 'assistant_warden') {
    const hostelWardens = await prisma.hostelWarden.findMany({
      where: { userId: req.user.id }
    });
    const hostelIds = hostelWardens.map(hw => hw.hostelId);
    if (hostelIds.length > 0) {
      query.hostelId = { in: hostelIds };
    } else {
      query._id = null; // Forces empty result
    }
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.assignedStaff) {
    query.assignedStaff = req.query.assignedStaff;
  }

  const result = await complaintService.getAllComplaintsDb(query, pagination);

  if (pagination) {
    return sendSuccess(res, 200, 'Complaints retrieved successfully', {
      data: result.data,
      pagination: result.pagination
    });
  }

  return sendSuccess(res, 200, 'Complaints retrieved successfully', {
    data: result
  });
});

// @desc    Get complaint summary (Admin/Warden scoped)
// @route   GET /api/complaints/summary
// @access  Private (Admin/Warden/SuperAdmin)
export const getComplaintSummary = asyncHandler(async (req, res) => {
  const query = {};
  const userRole = (req.user.role || '').toLowerCase();

  if (userRole === 'admin') {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.organizationId) {
      return sendError(res, 403, 'Admin user has no organization associated.');
    }
    query.organizationId = user.organizationId;
  } else if (userRole === 'warden' || userRole === 'assistant_warden') {
    const hostelWardens = await prisma.hostelWarden.findMany({
      where: { userId: req.user.id }
    });
    const hostelIds = hostelWardens.map(hw => hw.hostelId);
    if (hostelIds.length > 0) {
      query.hostelId = { $in: hostelIds };
    } else {
      query._id = null;
    }
  }

  const summary = await complaintService.getComplaintSummaryDb(query);
  return sendSuccess(res, 200, 'Complaint summary retrieved successfully', summary);
});

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id/status
// @access  Private (Admin/Warden)
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body;
  const rawRole = (req.user.role || '').toLowerCase();
  const userRole = rawRole === 'super_admin' ? 'Super Admin' : rawRole === 'admin' ? 'Admin' : (rawRole === 'warden' || rawRole === 'assistant_warden') ? 'Warden' : 'System';

  const updatedComplaint = await complaintService.updateComplaintStatusDb(req.params.id, status, userRole, message);

  const studentId = typeof updatedComplaint.studentId === 'object' ? updatedComplaint.studentId.id || updatedComplaint.studentId._id : updatedComplaint.studentId;

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'COMPLAINT_STATUS_UPDATED',
    target: { type: 'STUDENT', filter: { studentId } },
    data: { title: updatedComplaint.subject, status: updatedComplaint.status }
  }).catch(err => console.error('[Notification Error]:', err));

  await createLogDb({
    action: 'Updated Complaint Status',
    entityType: 'System',
    entityId: null,
    user: req.user.id,
    userRole: req.user.role,
    details: `Updated complaint status to ${status} for complaint ID: ${req.params.id}`,
    status: 'success'
  });

  getIo()?.emit('complaintUpdated', { id: req.params.id });

  return sendSuccess(res, 200, `Complaint status updated to ${status}`, updatedComplaint);
});

// @desc    Assign maintenance staff to complaint
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Admin/Warden)
export const assignMaintenanceStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.body;
  const rawRole = (req.user.role || '').toLowerCase();
  const userRole = rawRole === 'super_admin' ? 'Super Admin' : rawRole === 'admin' ? 'Admin' : (rawRole === 'warden' || rawRole === 'assistant_warden') ? 'Warden' : 'System';

  const updatedComplaint = await complaintService.assignStaffToComplaintDb(req.params.id, staffId, userRole);

  const studentId = typeof updatedComplaint.studentId === 'object' ? updatedComplaint.studentId.id || updatedComplaint.studentId._id : updatedComplaint.studentId;

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'COMPLAINT_ASSIGNED',
    target: { type: 'STUDENT', filter: { studentId } },
    data: { title: updatedComplaint.subject }
  }).catch(err => console.error('[Notification Error]:', err));

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'COMPLAINT_ASSIGNED',
    target: { type: 'USER', filter: { userIds: [staffId] } },
    data: { title: updatedComplaint.subject }
  }).catch(err => console.error('[Notification Error]:', err));

  await createLogDb({
    action: 'Assigned Maintenance Staff',
    entityType: 'System',
    entityId: null,
    user: req.user.id,
    userRole: req.user.role,
    details: `Assigned maintenance staff (ID: ${staffId}) to complaint ID: ${req.params.id}`,
    status: 'success'
  });

  getIo()?.emit('complaintUpdated', { id: req.params.id });

  return sendSuccess(res, 200, 'Maintenance staff assigned successfully.', updatedComplaint);
});

// @desc    Get assigned complaints for maintenance staff
// @route   GET /api/complaints/assigned
// @access  Private (Maintenance Staff)
export const getAssignedComplaints = asyncHandler(async (req, res) => {
  const query = { assignedStaff: req.user.id };

  if (req.query.status) {
    query.status = req.query.status;
  }

  const complaints = await complaintService.getAllComplaintsDb(query);
  return sendSuccess(res, 200, 'Assigned complaints retrieved successfully', complaints);
});

// @desc    Maintenance staff submits resolution
// @route   PATCH /api/complaints/:id/resolve-request
// @access  Private (Maintenance Staff / Warden)
export const submitComplaintResolution = asyncHandler(async (req, res) => {
  const { materialsUsed, resolutionNotes } = req.body;
  const staffId = req.user.id;

  const updatedComplaint = await complaintService.submitComplaintResolutionDb(req.params.id, staffId, materialsUsed, resolutionNotes);

  const fullComplaint = await prisma.complaint.findUnique({
    where: { id: updatedComplaint.id },
    include: {
      hostel: {
        include: {
          wardens: true
        }
      }
    }
  });

  if (fullComplaint && fullComplaint.hostel) {
    const wardenUserIds = (fullComplaint.hostel.wardens || fullComplaint.hostel.hostelWardens || []).map(hw => hw.userId);
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'COMPLAINT_RESOLUTION_SUBMITTED',
      target: [
        { type: 'USER', filter: { userIds: wardenUserIds } },
        { type: 'ROLE', filter: { role: 'super_admin' } },
        { type: 'ROLE', filter: { role: 'admin', organizationId: fullComplaint.organizationId } }
      ],
      data: { title: fullComplaint.subject }
    }).catch(err => console.error('[Notification Error]:', err));
  }

  getIo()?.emit('complaintUpdated', { id: req.params.id });

  return sendSuccess(res, 200, 'Resolution submitted and awaiting approval.', updatedComplaint);
});

// @desc    Warden approves resolution
// @route   PATCH /api/complaints/:id/approve-resolution
// @access  Private (Warden/Admin)
export const approveComplaintResolution = asyncHandler(async (req, res) => {
  const rawRole = (req.user.role || '').toLowerCase();
  const userRole = rawRole === 'super_admin' ? 'Super Admin' : rawRole === 'admin' ? 'Admin' : (rawRole === 'warden' || rawRole === 'assistant_warden') ? 'Warden' : 'System';

  const updatedComplaint = await complaintService.approveComplaintResolutionDb(req.params.id, userRole);

  const studentId = typeof updatedComplaint.studentId === 'object' ? updatedComplaint.studentId.id || updatedComplaint.studentId._id : updatedComplaint.studentId;

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'COMPLAINT_RESOLVED',
    target: { type: 'STUDENT', filter: { studentId } },
    data: { title: updatedComplaint.subject }
  }).catch(err => console.error('[Notification Error]:', err));

  await createLogDb({
    action: 'Approved Complaint Resolution',
    entityType: 'System',
    entityId: null,
    user: req.user.id,
    userRole: req.user.role,
    details: `Approved resolution for complaint ID: ${req.params.id}`,
    status: 'success'
  });

  getIo()?.emit('complaintUpdated', { id: req.params.id });

  return sendSuccess(res, 200, 'Resolution approved successfully.', updatedComplaint);
});

// @desc    Warden rejects resolution
// @route   PATCH /api/complaints/:id/reject-resolution
// @access  Private (Warden/Admin)
export const rejectComplaintResolution = asyncHandler(async (req, res) => {
  const { rejectNote } = req.body;
  const rawRole = (req.user.role || '').toLowerCase();
  const userRole = rawRole === 'super_admin' ? 'Super Admin' : rawRole === 'admin' ? 'Admin' : (rawRole === 'warden' || rawRole === 'assistant_warden') ? 'Warden' : 'System';

  const updatedComplaint = await complaintService.rejectComplaintResolutionDb(req.params.id, userRole, rejectNote);

  const assignedStaffId = typeof updatedComplaint.assignedStaff === 'object' ? updatedComplaint.assignedStaff?.id || updatedComplaint.assignedStaff?._id : updatedComplaint.assignedStaff;

  if (assignedStaffId) {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'COMPLAINT_RESOLUTION_REJECTED',
      target: { type: 'USER', filter: { userIds: [assignedStaffId] } },
      data: { title: updatedComplaint.subject, remarks: rejectNote }
    }).catch(err => console.error('[Notification Error]:', err));
  }

  await createLogDb({
    action: 'Rejected Complaint Resolution',
    entityType: 'System',
    entityId: null,
    user: req.user.id,
    userRole: req.user.role,
    details: `Rejected resolution for complaint ID: ${req.params.id}. Reason: ${rejectNote || 'None'}`,
    status: 'success'
  });

  getIo()?.emit('complaintUpdated', { id: req.params.id });

  return sendSuccess(res, 200, 'Resolution rejected successfully.', updatedComplaint);
});

// @desc    Maintenance staff rejects assigned task
// @route   PATCH /api/complaints/:id/reject-task
// @access  Private (Maintenance Staff)
export const rejectAssignedTask = asyncHandler(async (req, res) => {
  const { rejectNote } = req.body;
  const staffId = req.user.id;

  const updatedComplaint = await complaintService.rejectAssignedTaskDb(req.params.id, staffId, rejectNote);

  const fullComplaint = await prisma.complaint.findUnique({
    where: { id: updatedComplaint.id },
    include: {
      hostel: {
        include: {
          wardens: true
        }
      }
    }
  });

  if (fullComplaint && fullComplaint.hostel) {
    const wardenUserIds = (fullComplaint.hostel.wardens || fullComplaint.hostel.hostelWardens || []).map(hw => hw.userId);
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'COMPLAINT_TASK_REJECTED',
      target: [
        { type: 'USER', filter: { userIds: wardenUserIds } },
        { type: 'ROLE', filter: { role: 'super_admin' } },
        { type: 'ROLE', filter: { role: 'admin', organizationId: fullComplaint.organizationId } }
      ],
      data: { title: fullComplaint.subject, remarks: rejectNote }
    }).catch(err => console.error('[Notification Error]:', err));
  }

  getIo()?.emit('complaintUpdated', { id: req.params.id });

  return sendSuccess(res, 200, 'Task rejected successfully.', updatedComplaint);
});

// @desc    Add an internal note to a complaint
// @route   POST /api/complaints/:id/internal-notes
// @access  Private (Admin/Warden/SuperAdmin)
export const addInternalNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  if (!note || note.trim() === '') {
    return sendError(res, 400, 'Note text is required.');
  }

  const rawRole = (req.user.role || '').toLowerCase();
  const userRole = rawRole === 'super_admin' ? 'Super Admin' : rawRole === 'admin' ? 'Admin' : (rawRole === 'warden' || rawRole === 'assistant_warden') ? 'Warden' : 'System';

  const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
  const addedBy = currentUser?.name || currentUser?.fullName || currentUser?.email || 'Unknown';

  const updatedComplaint = await complaintService.addInternalNoteDb(req.params.id, userRole, addedBy, note);

  await createLogDb({
    action: 'Added Internal Note',
    entityType: 'System',
    entityId: null,
    user: req.user.id,
    userRole: req.user.role,
    details: `Added internal note to complaint ID: ${req.params.id}`,
    status: 'success'
  });

  getIo()?.emit('complaintUpdated', { id: req.params.id });

  return sendSuccess(res, 200, 'Internal note added successfully.', updatedComplaint);
});
