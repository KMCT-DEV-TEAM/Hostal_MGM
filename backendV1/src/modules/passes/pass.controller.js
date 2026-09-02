import { ROLES } from "../../constants/roles.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { createPassDb, getStudentPassesUnifiedDb, getPassesDb, getPassDetails as getPassDetailsDb, updatePass as updatePassDb, cancelPass as cancelPassDb, approvePassAsParent, approvePassAsMentor, approvePassAsAdmin, getManagementHostelsDb, getManagementHostelPassesDb, getManagementDashboardStatsDb, rejectParentPassDb, rejectMentorPassDb, rejectManagementPassDb, markStudentLeftHostelDb, markStudentReturnedDb } from "./pass.service.js";
import { createLogDb } from "../logs/log.service.js";
import { orchestratorService } from "../notifications/services/orchestrator.service.js";
import { buildSender } from "../notifications/utils/sender.util.js";
import { prisma } from "../../config/prisma.js";
import { parseISTDateStart, parseISTDateEnd, parseISTDateTime } from "../../utils/date.util.js";
import { getMentorDashboardStats } from "../dashboard/dashboard.controller.js";

export const createPass = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const {
    passType,
    reason,
    fromDate,
    toDate,
    totalDays,
    date,
    outTime,
    expectedReturnTime,
    outPassCategory
  } = req.body;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return sendError(res, 404, "We couldn't find your student account.");
  }

  const activeHostelAllocation = await prisma.studentHostel.findFirst({
    where: {
      studentId: studentId,
      status: "active"
    }
  });

  if (!activeHostelAllocation) {
    return sendError(res, 400, "It looks like you haven't been assigned to a hostel yet.");
  }

  const defaultGuardianLink = await prisma.studentParent.findFirst({
    where: {
      studentId,
      status: "active",
      defaultGuardian: true
    }
  });

  if (!defaultGuardianLink) {
    return sendError(
      res,
      400,
      "We couldn't process your request because we couldn't find a default guardian linked to your account. Please ask an admin to assign one."
    );
  }

  const parent = await prisma.parent.findUnique({ where: { id: defaultGuardianLink.parentId } });

  if (!parent || !parent.isActive) {
    return sendError(
      res,
      400,
      "Your default guardian's account is currently inactive. Please contact administration."
    );
  }

  const passData = {
    organizationId: student.organizationId,
    hostelId: activeHostelAllocation.hostelId,
    studentId,
    parentId: parent.id,
    passType,
    reason,
    status: "pending_parent",
  };

  if (passType === "home_pass") {
    passData.fromDate = parseISTDateStart(fromDate);
    passData.toDate = parseISTDateEnd(toDate);
  } else if (passType === "out_pass") {
    passData.fromDate = parseISTDateTime(date, outTime);
    passData.expectedReturnAt = parseISTDateTime(date, expectedReturnTime);
    passData.outPassCategory = outPassCategory;
  }

  let newPass;
  try {
    await prisma.$transaction(async (tx) => {
      if (passType === "home_pass") {
        const overlappingPass = await tx.pass.findFirst({
          where: {
            studentId,
            passType: "home_pass",
            status: { notIn: ["rejected", "cancelled", "completed"] },
            fromDate: { lte: passData.toDate },
            toDate: { gte: passData.fromDate },
          },
        });
        if (overlappingPass) {
          throw new Error("OVERLAPPING_HOME_PASS");
        }
      } else if (passType === "out_pass") {
        const dayStart = parseISTDateStart(date);
        const dayEnd = parseISTDateEnd(date);

        const existingOutPass = await tx.pass.findFirst({
          where: {
            studentId,
            passType: "out_pass",
            status: { notIn: ["rejected", "cancelled", "completed"] },
            fromDate: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        });
        if (existingOutPass) {
          throw new Error("EXISTING_OUT_PASS");
        }
      }

      newPass = await createPassDb(passData, tx);
    }, {
      isolationLevel: "Serializable"
    });

    const passTypeLabel = passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
    const link = "/dashboard/leaves/";

    orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_CREATED',
      target: { type: 'PARENT', filter: { studentId: student.id } },
      data: {
        passTypeLabel,
        studentName: student.name || " ".trim(),
        reason,
        link
      }
    }).catch(err => console.error("Notification Error:", err));
  } catch (error) {
    if (error.message === "OVERLAPPING_HOME_PASS") {
      return sendError(res, 400, "You already have another home pass requested or approved during these dates.");
    }
    if (error.message === "EXISTING_OUT_PASS") {
      return sendError(res, 400, "You already have an Out Pass requested or approved for this date.");
    }
    if (error.code === 'P2034') {
      return sendError(res, 409, "A concurrent request prevented your pass from being created. Please try again.");
    }
    throw error;
  }

  return sendSuccess(res, 201, "Pass created successfully", newPass);

});

export const getMyPassesUnified = asyncHandler(async (req, res) => {
  const studentId = req.student?.id || req.user.id;
  const result = await getStudentPassesUnifiedDb(studentId, req.query);

  return sendSuccess(res, 200, "Passes loaded successfully.", {
    mode: result.mode,
    summary: result.summary,
    data: result.passes,
    pagination: result.pagination
  });
});

export const getPasses = asyncHandler(async (req, res) => {
  const { passes, pagination } = await getPassesDb(req.student?.id, req.query);

  return sendSuccess(res, 200, "Passes loaded successfully.", {
    data: passes,
    pagination,
  });
});

export const getPassDetails = asyncHandler(async (req, res) => {
  const pass = await getPassDetailsDb({
    passId: req.params.id,
    actor: req.user,
  });

  return sendSuccess(res, 200, "Pass details loaded successfully.", pass);
});

const getPassApproverRecipients = async (studentId, organizationId) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { batchId: true }
  });

  const admins = await prisma.user.findMany({
    where: {
      role: ROLES.ADMIN,
      organizationId: organizationId,
      isActive: true
    },
    select: { id: true }
  });

  const recipientIds = admins.map((admin) => admin.id);

  if (student?.batchId) {
    const assignment = await prisma.mentorAssignment.findFirst({
      where: {
        batchId: student.batchId,
        status: "ACTIVE",
      },
      select: { mentorId: true }
    });

    if (assignment?.mentorId) {
      recipientIds.push(assignment.mentorId);
    }
  }

  return {
    type: "USER",
    filter: {
      userIds: [...new Set(recipientIds.map(String))],
    },
  };
};

export const updatePass = asyncHandler(async (req, res) => {
  const updatedPass = await updatePassDb({
    passId: req.params.id,
    actor: req.user,
    data: req.body,
  });

  const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
  const link = `/dashboard/leaves/${passTypeSlug}`;

  const studentName = updatedPass.studentId?.name || "";

  if (req.user.role === ROLES.STUDENT) {
    orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_MODIFIED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
      data: { passTypeLabel, studentName, link }
    }).catch(err => console.error("Notification Error:", err));
  } else if (req.user.role === ROLES.PARENT) {
    const studentDoc = await prisma.student.findUnique({
      where: { id: updatedPass.studentId?.id || updatedPass.studentId }
    });
    if (studentDoc) {
      const target = await getPassApproverRecipients(studentDoc.id, studentDoc.organizationId);
      orchestratorService.triggerNotification({
        sender: buildSender(req.user),
        eventName: 'PASS_MODIFIED',
        target,
        data: { passTypeLabel, studentName, link }
      }).catch(err => console.error("Notification Error:", err));
    }
  }

  await createLogDb({
    action: "Updated Pass Request",
    entityType: "Pass",
    entityId: req.params.id,
    user: req.user.id,
    userRole: req.user.role,
    details: `${req.user.role} updated a pass request`,
    status: "success"
  });

  return sendSuccess(res, 200, "Your pass has been updated successfully.", updatedPass);
});

export const cancelPass = asyncHandler(async (req, res) => {
  const updatedPass = await cancelPassDb({
    passId: req.params.id,
    actor: req.user,
    data: req.body
  });

  const reason = req.body?.remarks || req.body?.reason || "Cancelled by admin.";

  orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_ADMIN_CANCELLED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
    data: { reason }
  }).catch(err => console.error("Notification Error:", err));

  if (updatedPass.parentId) {
    orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_CANCELLED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
      data: { reason }
    }).catch(err => console.error("Notification Error:", err));
  }

  await createLogDb({
    action: req.user.role === ROLES.STUDENT || req.user.role === ROLES.PARENT ? "Cancelled Pass" : "Admin Cancelled Pass",
    entityType: "Pass",
    entityId: req.params.id,
    user: req.user.id,
    userRole: req.user.role,
    details: `${req.user.role} cancelled pass. Reason: ${reason}`,
    status: "success"
  });

  return sendSuccess(res, 200, "The pass has been successfully cancelled.", updatedPass);
});

export const approvePass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const role = (req.user?.role || "").toLowerCase();

  let updatedPass;
  if (role === ROLES.PARENT) {
    updatedPass = await approvePassAsParent({ passId: id, actor: req.user, remarks });

    const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
    const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
    const link = `/dashboard/leaves/${passTypeSlug}`;

    const studentName = updatedPass.studentId?.name || "";
    const parentName = req.user.name || "Parent";

    const studentDoc = await prisma.student.findUnique({
      where: { id: updatedPass.studentId?.id || updatedPass.studentId },
      select: { organizationId: true }
    });

    if (studentDoc) {
      const studentId = updatedPass.studentId?.id || updatedPass.studentId;
      const approverTarget = await getPassApproverRecipients(studentId, studentDoc.organizationId);

      orchestratorService.triggerNotification({
        sender: buildSender(req.user),
        eventName: 'PASS_PARENT_APPROVED',
        target: [
          { type: 'STUDENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
          { type: 'PARENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
          approverTarget,
          { type: 'ROLE', filter: { role: ROLES.WARDEN, organizationId: studentDoc.organizationId } }
        ],
        data: { passTypeLabel, studentName, parentName, link }
      }).catch(err => console.error("Notification Error:", err));
    }

    await createLogDb({
      action: "Parent Approved Pass",
      entityType: "Pass",
      entityId: id,
      user: req.user.id,
      userRole: req.user.role,
      details: `Parent approved pass request`,
      status: "success"
    });

  } else if (role === ROLES.MENTOR) {
    updatedPass = await approvePassAsMentor({ passId: id, actor: req.user, remarks });

    const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
    const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
    const link = `/dashboard/leaves/${passTypeSlug}`;

    const approvedBy = req.user.name || 'Mentor';
    const studentName = updatedPass.studentId?.name || "";
    const remarksText = remarks || "Approved";

    orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_APPROVED',
      target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
      data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
    }).catch(err => console.error("Notification Error:", err));

    await createLogDb({
      action: "Mentor Approved Pass",
      entityType: "Pass",
      entityId: id,
      user: req.user.id,
      userRole: req.user.role,
      details: `Mentor approved pass request. Remarks: ${remarksText}`,
      status: "success"
    });

  } else if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
    updatedPass = await approvePassAsAdmin({ passId: id, actor: req.user, remarks });

    const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
    const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
    const link = `/dashboard/leaves/${passTypeSlug}`;

    const approvedBy = req.user.name || 'Admin';
    const studentName = updatedPass.studentId?.name || "";
    const remarksText = remarks || "Approved";

    orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_APPROVED',
      target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
      data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
    }).catch(err => console.error("Notification Error:", err));

    if (updatedPass.parentId) {
      orchestratorService.triggerNotification({
        sender: buildSender(req.user),
        eventName: 'PASS_ADMIN_APPROVED',
        target: { type: 'PARENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
        data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
      }).catch(err => console.error("Notification Error:", err));
    }

    const hostelDoc = await prisma.hostel.findUnique({
      where: { id: updatedPass.hostelId?.id || updatedPass.hostelId },
      include: {
        wardens: {
          select: { userId: true }
        }
      }
    });

    if (hostelDoc && hostelDoc.wardens && hostelDoc.wardens.length > 0) {
      const wardenIds = hostelDoc.wardens.map(w => w.userId);
      orchestratorService.triggerNotification({
        sender: buildSender(req.user),
        eventName: 'PASS_ADMIN_APPROVED',
        target: { type: 'USER', filter: { userIds: wardenIds } },
        data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
      }).catch(err => console.error("Notification Error:", err));
    }

  } else {
    return sendError(res, 403, "You do not have permission to approve this pass.");
  }

  return sendSuccess(res, 200, "The pass has been approved.", updatedPass);
});

// Helpers for scoping
const buildMentorScope = async (req) => {
  const activeAssignments = await prisma.mentorAssignment.findMany({
    where: {
      mentorId: req.user.id,
      status: "ACTIVE"
    },
    select: { batchId: true }
  });

  const batchIds = activeAssignments.map(({ batchId }) => batchId);

  return {
    role: ROLES.MENTOR,
    organizationId: req.user.organizationId,
    batchIds,
    actorId: req.user.id
  };
};

const buildAdminScope = (req) => ({
  role: ROLES.ADMIN,
  organizationId: req.user.organizationId,
  actorId: req.user.id
});

const buildSuperAdminScope = (req) => ({
  role: ROLES.SUPER_ADMIN,
  organizationId: null,
  actorId: req.user.id
});

export const getManagementHostels = asyncHandler(async (req, res) => {
  let scope;
  if (req.user.role === ROLES.MENTOR) {
    scope = await buildMentorScope(req);
  } else if (req.user.role === ROLES.ADMIN) {
    scope = buildAdminScope(req);
  } else {
    scope = buildSuperAdminScope(req);
  }

  const { hostels, pagination } = await getManagementHostelsDb(scope, req.query);
  return sendSuccess(res, 200, "Hostels loaded successfully.", { data: hostels, pagination });
});

export const getAllManagementPasses = asyncHandler(async (req, res) => {
  let scope;
  if (req.user.role === ROLES.MENTOR) {
    scope = await buildMentorScope(req);
  } else if (req.user.role === ROLES.ADMIN) {
    scope = buildAdminScope(req);
  } else {
    scope = buildSuperAdminScope(req);
  }

  const { passes, pagination } = await getManagementHostelPassesDb(req.query, scope, null);
  return sendSuccess(res, 200, "All passes loaded successfully.", { data: passes, pagination });
});

export const getManagementHostelPasses = asyncHandler(async (req, res) => {
  let scope;
  if (req.user.role === ROLES.MENTOR) {
    scope = await buildMentorScope(req);
  } else if (req.user.role === ROLES.ADMIN) {
    scope = buildAdminScope(req);
  } else {
    scope = buildSuperAdminScope(req);
  }

  const { hostelId } = req.params;

  let hostelQuery = { id: hostelId, isActive: true };
  if (scope.role === ROLES.ADMIN) {
    hostelQuery.organizations = {
      some: { organizationId: scope.organizationId }
    };
  } else if (scope.role === ROLES.MENTOR) {
    const studentsInBatches = await prisma.student.findMany({
      where: {
        batchId: { in: scope.batchIds },
        isActive: true
      },
      select: { id: true }
    });
    const studentIds = studentsInBatches.map(s => s.id);

    const allocations = await prisma.studentHostel.findMany({
      where: {
        studentId: { in: studentIds },
        status: "active"
      },
      select: { hostelId: true }
    });
    const validHostelIds = allocations.map(a => a.hostelId);

    if (!validHostelIds.includes(hostelId)) {
      return sendError(res, 403, "We couldn't find this hostel, or you might not have permission to view it.");
    }
  }

  const hostel = await prisma.hostel.findFirst({ where: hostelQuery });
  if (!hostel) {
    return sendError(res, 403, "We couldn't find this hostel, or you might not have permission to view it.");
  }

  const { passes, pagination } = await getManagementHostelPassesDb(req.query, scope, hostelId);
  return sendSuccess(res, 200, "Passes loaded successfully.", { data: passes, pagination });
});

export const getManagementDashboardStats = asyncHandler(async (req, res, next) => {
  const { role } = req.user;

  if (role === ROLES.MENTOR) {
    // Delegate to the dashboard service for mentors
    return getMentorDashboardStats(req, res, next);
  }

  let scope;
  if (role === ROLES.ADMIN) {
    scope = buildAdminScope(req);
  } else if (role === ROLES.SUPER_ADMIN) {
    scope = buildSuperAdminScope(req);
  } else {
    return sendError(res, 403, "Access denied");
  }

  // Delegate to pass.service.js for admin/super_admin pass stats
  scope.query = req.query;
  const stats = await getManagementDashboardStatsDb(scope);
  return sendSuccess(res, 200, "Dashboard stats fetched successfully", { data: stats });
});

export const rejectPass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const role = req.user.role;
  let updatedPass;

  if (role === ROLES.PARENT) {
    // Basic verification since we didn't add the verifyStudentAccess middleware to this specific route.
    // Parent should only reject passes for students linked to them.
    const parentId = req.user.id;
    const pass = await prisma.pass.findUnique({
      where: { id },
      include: { student: { include: { studentParents: true } } }
    });
    if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

    const isLinked = pass.student.studentParents.some(sp => sp.parentId === parentId);
    if (!isLinked) {
      return sendError(res, 403, "Only the default guardian has permission to reject passes.");
    }

    updatedPass = await rejectParentPassDb(id, parentId, remarks);

  } else if (role === ROLES.MENTOR) {
    const scope = await buildMentorScope(req);
    updatedPass = await rejectMentorPassDb(id, scope.actorId, scope.batchIds, remarks);

  } else if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
    let scope;
    if (role === ROLES.ADMIN) scope = buildAdminScope(req);
    else scope = buildSuperAdminScope(req);

    updatedPass = await rejectManagementPassDb(id, scope, remarks);
  } else {
    return sendError(res, 403, "You do not have permission to perform this action.");
  }

  // Notifications
  const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
  const link = `/dashboard/leaves/${passTypeSlug}`;

  const studentName = updatedPass.student.name;
  const remarksText = remarks || (role === ROLES.PARENT ? "Parent rejected the pass request." : "Rejected");

  if (role === ROLES.PARENT) {
    const parentName = req.user.name;
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_PARENT_REJECTED',
      target: { type: 'STUDENT', filter: { studentId: updatedPass.student.id } },
      data: { passTypeLabel, studentName, parentName, remarks: remarksText, link }
    }).catch(err => console.error("Notification Error:", err));

    await createLogDb({
      action: "Parent Rejected Pass",
      entityType: "Pass",
      entityId: id,
      user: req.user.id || req.user._id,
      userRole: role,
      details: `Parent rejected pass request. Remarks: ${remarksText}`,
      status: "success"
    });
  } else {
    // Mentor, Admin, Super Admin
    const approvedBy = req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Management';

    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_REJECTED',
      target: { type: 'STUDENT', filter: { studentId: updatedPass.student.id } },
      data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
    }).catch(err => console.error("Notification Error:", err));

    if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
      if (updatedPass.parentId) {
        await orchestratorService.triggerNotification({
          sender: buildSender(req.user),
          eventName: 'PASS_ADMIN_REJECTED',
          target: { type: 'PARENT', filter: { studentId: updatedPass.student.id } },
          data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
        }).catch(err => console.error("Notification Error:", err));
      }
    }

    await createLogDb({
      action: role === ROLES.MENTOR ? "Mentor Rejected Pass" : "Admin/Super Admin Rejected Pass",
      entityType: "Pass",
      entityId: id,
      user: req.user.id || req.user._id,
      userRole: role,
      details: `${role} rejected pass request. Remarks: ${remarksText}`,
      status: "success"
    });
  }

  return sendSuccess(res, 200, "The pass has been rejected.", updatedPass);
});

export const markStudentLeftHostel = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;

  const wardenLink = await prisma.hostelWarden.findFirst({
    where: { userId: wardenId },
    select: { hostelId: true }
  });

  if (!wardenLink) return sendError(res, 403, "It looks like you aren't assigned to any active hostel right now.");

  const updatedPass = await markStudentLeftHostelDb(id, wardenId, wardenLink.hostelId);

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'WARDEN_MARKED_OUT',
    target: [
      { type: 'STUDENT', filter: { studentId: updatedPass.student.id } },
      { type: 'PARENT', filter: { studentId: updatedPass.student.id } }
    ],
    data: { message: "The student has been marked as left the hostel. Have a safe trip!" }
  }).catch(err => console.error("Notification Error:", err));

  await createLogDb({
    action: "Marked Student Left Hostel",
    entityType: "Pass",
    entityId: id,
    user: req.user.id,
    userRole: req.user.role,
    details: `Warden marked student as left hostel`,
    status: "success"
  });

  return sendSuccess(res, 200, "The student has been marked as left.", updatedPass);
});

export const markStudentReturned = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;

  const wardenLink = await prisma.hostelWarden.findFirst({
    where: { userId: wardenId },
    select: { hostelId: true }
  });

  if (!wardenLink) return sendError(res, 403, "It looks like you aren't assigned to any active hostel right now.");

  const updatedPass = await markStudentReturnedDb(id, wardenId, wardenLink.hostelId);

  const returnStatus = updatedPass._returnStatus;
  
  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'WARDEN_MARKED_RETURNED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.student.id } },
    data: { message: `You have been marked as returned to the hostel. Status: ${returnStatus.replace("_", " ")}` }
  }).catch(err => console.error("Notification Error:", err));

  await createLogDb({
    action: "Marked Student Returned to Hostel",
    entityType: "Pass",
    entityId: id,
    user: req.user.id,
    userRole: req.user.role,
    details: `Warden marked student as returned. Status: ${returnStatus}`,
    status: "success"
  });

  return sendSuccess(res, 200, "The student has been marked as returned.", updatedPass);
});

export const getWardenPasses = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  
  const wardenLink = await prisma.hostelWarden.findFirst({
    where: { userId: wardenId },
    select: { hostelId: true }
  });

  if (!wardenLink) return sendError(res, 403, "It looks like you aren't assigned to any active hostel right now.");

  const { passes, pagination } = await getManagementHostelPassesDb(req.query, { role: ROLES.WARDEN }, wardenLink.hostelId);
  return sendSuccess(res, 200, "Passes loaded successfully.", { data: passes, pagination });
});
