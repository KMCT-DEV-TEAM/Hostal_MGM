import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { createPassDb, getStudentPassesUnifiedDb, getPassesDb, getPassDetails as getPassDetailsDb, updatePass as updatePassDb, cancelPass as cancelPassDb } from "./pass.service.js";
import { createLogDb } from "../logs/log.service.js";
import { orchestratorService } from "../notifications/services/orchestrator.service.js";
import { buildSender } from "../notifications/utils/sender.util.js";
import { prisma } from "../../config/prisma.js";

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
    passData.fromDate = new Date(fromDate);
    passData.toDate = new Date(toDate);
  } else if (passType === "out_pass") {
    const passDate = new Date(date);
    const [outHour, outMinute] = outTime.split(":").map(Number);
    const [returnHour, returnMinute] = expectedReturnTime.split(":").map(Number);

    const outDateTime = new Date(passDate);
    outDateTime.setHours(outHour, outMinute, 0, 0);

    const returnDateTime = new Date(passDate);
    returnDateTime.setHours(returnHour, returnMinute, 0, 0);

    passData.fromDate = outDateTime;
    passData.expectedReturnAt = returnDateTime;
    passData.outPassCategory = outPassCategory;
  }

  let newPass;
  await prisma.$transaction(async (tx) => {
    newPass = await createPassDb(passData, tx);
  });

  const passTypeLabel = passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const link = "/dashboard/leaves/";

  await orchestratorService.triggerNotification({
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
      role: "admin",
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

  if (req.user.role === "student") {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_MODIFIED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
      data: { passTypeLabel, studentName, link }
    }).catch(err => console.error("Notification Error:", err));
  } else if (req.user.role === "parent") {
    const studentDoc = await prisma.student.findUnique({
      where: { id: updatedPass.studentId?.id || updatedPass.studentId }
    });
    if (studentDoc) {
      const target = await getPassApproverRecipients(studentDoc.id, studentDoc.organizationId);
      await orchestratorService.triggerNotification({
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

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_ADMIN_CANCELLED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
    data: { reason }
  }).catch(err => console.error("Notification Error:", err));

  if (updatedPass.parentId) {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_CANCELLED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId?.id || updatedPass.studentId } },
      data: { reason }
    }).catch(err => console.error("Notification Error:", err));
  }

  await createLogDb({
    action: req.user.role === "student" || req.user.role === "parent" ? "Cancelled Pass" : "Admin Cancelled Pass",
    entityType: "Pass",
    entityId: req.params.id,
    user: req.user.id,
    userRole: req.user.role,
    details: `${req.user.role} cancelled pass. Reason: ${reason}`,
    status: "success"
  });

  return sendSuccess(res, 200, "The pass has been successfully cancelled.", updatedPass);
});
