import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { createPassDb } from "./pass.service.js";
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

  if (!student.hostelId) {
    return sendError(res, 400, "It looks like you haven't been assigned to a hostel yet.");
  }

  const defaultGuardianLink = await prisma.studentParent.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
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
    hostelId: student.hostelId,
    studentId,
    parentId: parent.id,
    passType,
    reason,
    timeline: [
      {
        action: "created",
        actorId: studentId,
        actorRole: "student",
        remarks: "Pass request submitted.",
      },
    ],
  };

  if (passType === "home_pass") {
    passData.fromDate = fromDate;
    passData.toDate = toDate;
    passData.totalDays = totalDays;
  } else if (passType === "out_pass") {
    passData.date = date;
    passData.outTime = outTime;
    passData.expectedReturnTime = expectedReturnTime;
    passData.outPassCategory = outPassCategory;
  }

  let newPass;
  await prisma.$transaction(async (tx) => {
    newPass = await createPassDb(passData, tx);
  });

  const passTypeLabel = passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlug = passType === 'home_pass' ? 'home-pass' : 'out-pass';
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

  await createLogDb({
    action: "PASS_CREATED",
    entityType: "PASS",
    entityId: newPass.id,
    actorId: req.user.id,
    actorRole: req.user.role,
    metadata: { passType, reason },
  });

  return sendSuccess(res, 201, "Pass created successfully", newPass);
});
