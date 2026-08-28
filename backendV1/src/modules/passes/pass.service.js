import { prisma } from "../../config/prisma.js";
import { parseISTDateStart, parseISTDateEnd, parseISTDateTime, getISTTimeStr } from "../../utils/date.util.js";

export const createPassDb = async (passData, tx = prisma) => {
  const result = await tx.pass.create({
    data: passData,
  });

  await tx.passTimeline.create({
    data: {
      passId: result.id,
      action: "created",
      actorId: passData.studentId,
      actorRole: "student",
      remarks: "Pass request submitted.",
    }
  });

  return result;
};

export const getStudentPassesUnifiedDb = async (studentId, query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const sortField = ["createdAt", "fromDate"].includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortDir = query.sortOrder === "asc" ? "asc" : "desc";

  const REQUEST_STATUSES = ["pending_parent", "pending_admin", "approved"];
  const HISTORY_STATUSES = ["rejected", "cancelled", "returned", "completed"];

  const where = { studentId };

  if (query.status) {
    where.status = query.status;
  } else {
    const mode = query.mode === "history" ? "history" : "requests";
    where.status = { in: mode === "history" ? HISTORY_STATUSES : REQUEST_STATUSES };
  }

  if (query.passType) where.passType = query.passType;
  if (query.category) where.outPassCategory = query.category;

  if (query.fromDate || query.toDate) {
    const dateFilter = {};
    if (query.fromDate) {
      const s = new Date(query.fromDate);
      s.setUTCHours(0, 0, 0, 0);
      dateFilter.gte = s;
    }
    if (query.toDate) {
      const e = new Date(query.toDate);
      e.setUTCHours(23, 59, 59, 999);
      dateFilter.lte = e;
    }
    where.fromDate = dateFilter;
  }

  if (query.search) {
    where.reason = { contains: query.search, mode: 'insensitive' };
  }

  const [total, approved, pending, totalRecords, passes] = await Promise.all([
    prisma.pass.count({ where: { studentId } }),
    prisma.pass.count({ where: { studentId, status: "approved" } }),
    prisma.pass.count({ where: { studentId, status: { in: ["pending_parent", "pending_admin"] } } }),
    prisma.pass.count({ where }),
    prisma.pass.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { [sortField]: sortDir },
        { createdAt: 'desc' }
      ],
      include: {
        parent: { select: { id: true, parentName: true } },
        hostel: { select: { id: true, name: true } },
      }
    })
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  return {
    mode: query.status ? "filtered" : (query.mode === "history" ? "history" : "requests"),
    summary: {
      total,
      approved,
      pending
    },
    passes,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

export const getPassesDb = async (studentId, query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const where = { studentId };

  if (query.status) where.status = query.status;
  if (query.passType) where.passType = query.passType;
  if (query.outPassCategory || query.category) where.outPassCategory = query.outPassCategory || query.category;

  if (query.startDate || query.fromDate || query.endDate || query.toDate) {
    const fromDateCond = {};
    if (query.startDate || query.fromDate) {
      const s = new Date(query.startDate || query.fromDate);
      s.setUTCHours(0, 0, 0, 0);
      fromDateCond.gte = s;
    }
    if (query.endDate || query.toDate) {
      const e = new Date(query.endDate || query.toDate);
      e.setUTCHours(23, 59, 59, 999);
      fromDateCond.lte = e;
    }
    where.createdAt = fromDateCond;
  }

  const [totalRecords, passes] = await Promise.all([
    prisma.pass.count({ where }),
    prisma.pass.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        passType: true,
        outPassCategory: true,
        reason: true,
        status: true,
        fromDate: true,
        toDate: true,
        expectedReturnAt: true,
        createdAt: true,
        student: {
          select: {
            name: true,
            admissionNo: true
          }
        },
        approvals: {
          select: {
            status: true,
            approvalLevel: true
          }
        }
      }
    })
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  const formattedPasses = passes.map(pass => {
    const parentApproval = pass.approvals?.find(a => a.approvalLevel === 'PARENT');
    const adminApproval = pass.approvals?.find(a => ['ADMIN', 'WARDEN'].includes(a.approvalLevel));

    return {
      id: pass.id,
      passType: pass.passType,
      outPassCategory: pass.outPassCategory,
      reason: pass.reason,
      status: pass.status,
      fromDate: pass.fromDate,
      toDate: pass.toDate,
      date: pass.fromDate,
      outTime: pass.fromDate,
      expectedReturnTime: pass.expectedReturnAt,
      studentName: pass.student?.name,
      admissionNumber: pass.student?.admissionNo,
      parentApprovalStatus: parentApproval?.status || "pending",
      adminApprovalStatus: adminApproval?.status || "pending",
      createdAt: pass.createdAt
    };
  });

  return {
    passes: formattedPasses,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

export const getPassDetails = async ({ passId, actor }) => {
  const role = (actor.role || "").toLowerCase();

  const whereClause = { id: passId };

  if (role === "student") {
    whereClause.studentId = actor.id;
  } else if (role === "parent") {
    whereClause.student = {
      studentParents: {
        some: { parentId: actor.id }
      }
    };
  } else if (role !== "super_admin" && actor.organizationId) {
    whereClause.organizationId = actor.organizationId;
  }

  const pass = await prisma.pass.findFirst({
    where: whereClause,
    include: {
      student: {
        include: {
          course: { select: { name: true } },
          department: { select: { name: true } },
          batch: { select: { name: true } },
          studentHostels: {
            where: { status: "active" },
            select: { roomNumber: true }
          },
          studentParents: true
        }
      },
      parent: true,
      hostel: {
        select: {
          id: true,
          name: true
        }
      },
      approvals: {
        include: {
          actionBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      gateLogs: true,
      timeline: {
        orderBy: {
          timestamp: "asc"
        }
      }
    }
  });

  if (!pass) {
    const error = new Error("We couldn't find the pass you're looking for.");
    error.statusCode = 404;
    throw error;
  }


  // Tenant isolation (except for super admin)
  if (role !== "super_admin") {
    if (role === "student") {
      if (pass.student?.organizationId !== pass.organizationId) {
        const error = new Error("You don't have permission to view this pass.");
        error.statusCode = 403;
        throw error;
      }
    } else if (role !== "parent") {
      if (actor.organizationId && actor.organizationId !== pass.organizationId) {
        const error = new Error("You don't have permission to view this pass.");
        error.statusCode = 403;
        throw error;
      }
    }
  }

  // Role-specific authorization checks
  if (role === "student") {
    if (pass.studentId !== actor.id) {
      const error = new Error("You don't have permission to view this pass.");
      error.statusCode = 403;
      throw error;
    }
  } else if (role === "parent") {
    const isLinked = pass.student?.studentParents?.some(sp => sp.parentId === actor.id);
    if (!isLinked) {
      const error = new Error("Forbidden. You do not have authorization to access this student's records.");
      error.statusCode = 403;
      throw error;
    }
  } else if (role === "warden" || role === "assistant_warden") {
    const wardenLink = await prisma.hostelWarden.findFirst({
      where: {
        userId: actor.id,
        hostelId: pass.hostelId
      }
    });
    if (!wardenLink) {
      const error = new Error("You don't have permission to view this pass.");
      error.statusCode = 403;
      throw error;
    }
  } else if (role === "mentor") {
    const activeAssignments = await prisma.mentorAssignment.findMany({
      where: {
        mentorId: actor.id,
        status: "ACTIVE"
      },
      select: { batchId: true }
    });
    const batchIds = activeAssignments.map(a => a.batchId);
    if (!pass.student?.batchId || !batchIds.includes(pass.student.batchId)) {
      const error = new Error("You don't have permission to view this pass.");
      error.statusCode = 403;
      throw error;
    }
  } else if (role === "admin" || role === "super_admin") {
    // Admin and super admin have general organization-wide/global access.
  } else {
    const error = new Error("Access denied. Unauthorized role.");
    error.statusCode = 403;
    throw error;
  }

  return formatPassResponse(pass);
};

export const formatPassResponse = (pass) => {
  if (!pass) return null;

  const activeAllocation = pass.student?.studentHostels?.find(sh => sh.status === "active");
  const parentRelation = pass.student?.studentParents?.find(sp => sp.parentId === pass.parentId);

  const formattedStudent = pass.student ? {
    id: pass.student.id,
    name: pass.student.name,
    studentId: pass.student.admissionNo,
    admissionNo: pass.student.admissionNo,
    roomNumber: activeAllocation?.roomNumber || null,
    course: pass.student.course?.name || null,
    department: pass.student.department?.name || null,
    batch: pass.student.batch?.name || null,
  } : null;

  const formattedParent = pass.parent ? {
    id: pass.parent.id,
    parentName: pass.parent.parentName,
    phone: pass.parent.phone,
    relationship: parentRelation?.relationship || "guardian",
  } : null;

  const parentApprovalRecord = pass.approvals?.find(a => a.approvalLevel === "PARENT");
  const adminApprovalRecord = pass.approvals?.find(a => a.approvalLevel === "ADMIN" || a.approvalLevel === "WARDEN");

  const parentApproval = parentApprovalRecord ? {
    status: parentApprovalRecord.status.toLowerCase(),
    actionBy: parentApprovalRecord.parentId || parentApprovalRecord.actionById,
    actionAt: parentApprovalRecord.actionAt,
    remarks: parentApprovalRecord.remarks || "",
  } : {
    status: "pending",
    actionBy: null,
    actionAt: null,
    remarks: "",
  };

  const adminApproval = adminApprovalRecord ? {
    status: adminApprovalRecord.status.toLowerCase(),
    actionBy: adminApprovalRecord.actionBy ? {
      id: adminApprovalRecord.actionBy.id,
      name: adminApprovalRecord.actionBy.name,
    } : null,
    actionAt: adminApprovalRecord.actionAt,
    remarks: adminApprovalRecord.remarks || "",
  } : {
    status: "pending",
    actionBy: null,
    actionAt: null,
    remarks: "",
  };

  const leftLog = pass.gateLogs?.filter(g => g.eventType === "LEFT").sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime))[0];
  const returnedLog = pass.gateLogs?.filter(g => g.eventType === "RETURNED").sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime))[0];

  const returnTracking = leftLog ? {
    leftHostelAt: leftLog.eventTime,
    returnedAt: returnedLog?.eventTime || null,
    markedBy: leftLog.recordedById,
    markedAt: leftLog.recordedAt,
    returnStatus: returnedLog ? (returnedLog.eventTime > pass.expectedReturnAt ? "late" : "on_time") : null
  } : {
    leftHostelAt: null,
    returnedAt: null,
    markedBy: null,
    markedAt: null,
    returnStatus: null
  };

  const formattedTimeline = pass.timeline?.map(t => ({
    action: t.action,
    actorId: t.actorId,
    actorRole: t.actorRole,
    remarks: t.remarks || "",
    timestamp: t.timestamp
  })) || [];

  const formattedPass = {
    id: pass.id,
    passType: pass.passType,
    outPassCategory: pass.outPassCategory,
    reason: pass.reason,
    fromDate: pass.fromDate,
    toDate: pass.toDate,
    expectedReturnAt: pass.expectedReturnAt,
    status: pass.status,
    createdAt: pass.createdAt,
    updatedAt: pass.updatedAt,
    studentId: formattedStudent,
    parentId: formattedParent,
    hostelId: pass.hostel ? {
      id: pass.hostel.id,
      name: pass.hostel.name,
    } : null,
    parentApproval,
    adminApproval,
    returnTracking,
    timeline: formattedTimeline,
    gateLogs: pass.gateLogs || []
  };

  return {
    ...formattedPass,
    data: formattedPass
  };
};

export const updatePass = async ({ passId, actor, data }) => {
  const userId = actor.id;
  const userRole = (actor.role || "").toLowerCase();

  const pass = await prisma.pass.findUnique({
    where: { id: passId },
    include: {
      student: true
    }
  });

  if (!pass) {
    const error = new Error("We couldn't find the pass you're looking for.");
    error.statusCode = 404;
    throw error;
  }

  if (userRole === "student" && pass.studentId !== userId) {
    const error = new Error("You do not have permission to modify this pass.");
    error.statusCode = 403;
    throw error;
  }
  if (userRole === "parent" && pass.parentId !== userId) {
    const error = new Error("You do not have permission to modify this pass.");
    error.statusCode = 403;
    throw error;
  }

  const leftLog = await prisma.passGateLog.findFirst({
    where: { passId, eventType: "LEFT" }
  });
  if (leftLog) {
    const error = new Error("You cannot edit this pass because the student has already left the hostel.");
    error.statusCode = 422;
    throw error;
  }

  if (["cancelled", "rejected", "completed", "returned"].includes(pass.status)) {
    const error = new Error("You cannot edit this pass because of its current status.");
    error.statusCode = 422;
    throw error;
  }

  const {
    reason,
    fromDate,
    toDate,
    date,
    outTime,
    expectedReturnTime,
    outPassCategory
  } = data;

  const updateData = {};

  if (reason !== undefined) updateData.reason = reason;

  if (pass.passType === "home_pass") {
    if (fromDate !== undefined) updateData.fromDate = parseISTDateStart(fromDate);
    if (toDate !== undefined) updateData.toDate = parseISTDateEnd(toDate);
  } else if (pass.passType === "out_pass") {
    let passDateStr = date;
    if (!passDateStr) {
      passDateStr = pass.fromDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    }

    let outTimeStr = outTime;
    if (outTimeStr === undefined) {
      outTimeStr = getISTTimeStr(pass.fromDate);
    }

    let expectedReturnTimeStr = expectedReturnTime;
    if (expectedReturnTimeStr === undefined) {
      expectedReturnTimeStr = getISTTimeStr(pass.expectedReturnAt);
    }

    updateData.fromDate = parseISTDateTime(passDateStr, outTimeStr);
    updateData.expectedReturnAt = parseISTDateTime(passDateStr, expectedReturnTimeStr);
    if (outPassCategory !== undefined) updateData.outPassCategory = outPassCategory;
  }

  let newStatus = pass.status;
  let resetParent = false;
  let resetAdmin = false;

  if (userRole === "student") {
    if (pass.status === "pending_admin" || pass.status === "approved") {
      resetParent = true;
      resetAdmin = true;
      newStatus = "pending_parent";
    }
  } else if (userRole === "parent") {
    if (pass.status === "approved" || pass.status === "pending_admin") {
      resetAdmin = true;
      newStatus = "pending_admin";
    }
  }

  updateData.status = newStatus;

  let updatedPass;
  await prisma.$transaction(async (tx) => {
    const updateResult = await tx.pass.updateMany({
      where: { id: passId, status: pass.status },
      data: updateData,
    });

    if (updateResult.count === 0) {
      const error = new Error("The pass could not be updated. Its status may have changed concurrently.");
      error.statusCode = 409;
      throw error;
    }

    if (resetParent) {
      await tx.passApproval.deleteMany({
        where: { passId, approvalLevel: "PARENT" }
      });
    }
    if (resetAdmin) {
      await tx.passApproval.deleteMany({
        where: { passId, approvalLevel: { in: ["ADMIN", "WARDEN"] } }
      });
    }

    await tx.passTimeline.create({
      data: {
        passId,
        action: userRole === "student" ? "student_edited_leave" : "parent_edited_leave",
        actorId: userId,
        actorRole: userRole,
        remarks: "Leave request modified."
      }
    });

    if (resetParent) {
      await tx.passTimeline.create({
        data: {
          passId,
          action: "approval_reset",
          actorId: userId,
          actorRole: "system",
          remarks: "Approvals reset due to leave modification."
        }
      });
    }

    updatedPass = await tx.pass.findUnique({
      where: { id: passId },
      include: {
        student: {
          include: {
            course: { select: { name: true } },
            department: { select: { name: true } },
            batch: { select: { name: true } },
            studentHostels: {
              where: { status: "active" },
              select: { roomNumber: true }
            },
            studentParents: true
          }
        },
        parent: true,
        hostel: {
          select: {
            id: true,
            name: true
          }
        },
        approvals: {
          include: {
            actionBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        gateLogs: true,
        timeline: {
          orderBy: {
            timestamp: "asc"
          }
        }
      }
    });
  });

  return formatPassResponse(updatedPass);
};

export const cancelPass = async ({ passId, actor, data }) => {
  const userId = actor.id;
  const userRole = (actor.role || "").toLowerCase();
  const remarks = data?.remarks || data?.reason || "Cancelled by admin.";

  const pass = await prisma.pass.findUnique({
    where: { id: passId },
    include: {
      student: true
    }
  });

  if (!pass) {
    const error = new Error("We couldn't find the pass you're looking for.");
    error.statusCode = 404;
    throw error;
  }

  const leftLog = await prisma.passGateLog.findFirst({
    where: { passId, eventType: "LEFT" }
  });
  if (leftLog) {
    const error = new Error("You cannot cancel this pass because the student has already left the hostel.");
    error.statusCode = 422;
    throw error;
  }

  if (["completed", "cancelled", "rejected", "returned"].includes(pass.status)) {
    const error = new Error("This pass can't be cancelled because of its current status.");
    error.statusCode = 422;
    throw error;
  }

  if (userRole === "student" && pass.studentId !== userId) {
    const error = new Error("You do not have permission to cancel this pass.");
    error.statusCode = 403;
    throw error;
  }
  if (userRole === "parent") {
    const parentLink = await prisma.studentParent.findFirst({
      where: { parentId: userId, studentId: pass.studentId }
    });
    if (!parentLink) {
      const error = new Error("You do not have permission to cancel this pass.");
      error.statusCode = 403;
      throw error;
    }
  }
  if (userRole === "warden" || userRole === "assistant_warden") {
    const wardenLink = await prisma.hostelWarden.findFirst({
      where: { userId: userId, hostelId: pass.hostelId }
    });
    if (!wardenLink) {
      const error = new Error("You don't have permission to cancel passes for this hostel.");
      error.statusCode = 403;
      throw error;
    }
  }
  if (userRole === "mentor") {
    const activeAssignments = await prisma.mentorAssignment.findMany({
      where: { mentorId: userId, status: "ACTIVE" },
      select: { batchId: true }
    });
    const batchIds = activeAssignments.map(a => a.batchId);
    if (!pass.student?.batchId || !batchIds.includes(pass.student.batchId)) {
      const error = new Error("You don't have permission to cancel passes for this student.");
      error.statusCode = 403;
      throw error;
    }
  }
  if (userRole === "admin") {
    if (actor.organizationId !== pass.organizationId) {
      const error = new Error("You don't have permission to cancel this pass.");
      error.statusCode = 403;
      throw error;
    }
  }

  let updatedPass;
  await prisma.$transaction(async (tx) => {
    const updateResult = await tx.pass.updateMany({
      where: { id: passId, status: pass.status },
      data: { status: "cancelled" },
    });

    if (updateResult.count === 0) {
      const error = new Error("The pass could not be cancelled. Its status may have changed concurrently.");
      error.statusCode = 409;
      throw error;
    }

    await tx.passTimeline.create({
      data: {
        passId,
        action: (userRole === "student" || userRole === "parent") ? "cancelled" : "admin_cancelled",
        actorId: userId,
        actorRole: userRole,
        remarks: (userRole === "student" || userRole === "parent") ? "Cancelled by user." : remarks
      }
    });

    updatedPass = await tx.pass.findUnique({
      where: { id: passId },
      include: {
        student: {
          include: {
            course: { select: { name: true } },
            department: { select: { name: true } },
            batch: { select: { name: true } },
            studentHostels: {
              where: { status: "active" },
              select: { roomNumber: true }
            },
            studentParents: true
          }
        },
        parent: true,
        hostel: {
          select: {
            id: true,
            name: true
          }
        },
        approvals: {
          include: {
            actionBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        gateLogs: true,
        timeline: {
          orderBy: {
            timestamp: "asc"
          }
        }
      }
    });
  });

  return formatPassResponse(updatedPass);
};

export const approvePassAsParent = async ({ passId, actor, remarks }) => {
  const parentId = actor.id;

  const pass = await prisma.pass.findUnique({
    where: { id: passId },
    include: {
      student: {
        include: {
          studentParents: {
            where: { parentId }
          }
        }
      }
    }
  });

  if (!pass) {
    const error = new Error("We couldn't find the pass you're looking for.");
    error.statusCode = 404;
    throw error;
  }

  const parentLink = pass.student?.studentParents?.[0];
  if (!parentLink) {
    const error = new Error("Forbidden. You do not have authorization to access this student's records.");
    error.statusCode = 403;
    throw error;
  }

  if (!parentLink.defaultGuardian) {
    const error = new Error("Only the default guardian has permission to approve passes.");
    error.statusCode = 403;
    throw error;
  }

  if (pass.status !== "pending_parent") {
    const error = new Error("This pass is not waiting for your approval.");
    error.statusCode = 400;
    throw error;
  }

  let updatedPass;
  await prisma.$transaction(async (tx) => {
    const updated = await tx.pass.updateMany({
      where: { id: passId, status: "pending_parent" },
      data: { status: "pending_admin" }
    });

    if (updated.count === 0) {
      const error = new Error("The pass could not be approved. Its status may have changed.");
      error.statusCode = 409;
      throw error;
    }

    await tx.passApproval.create({
      data: {
        passId,
        approvalLevel: "PARENT",
        status: "APPROVED",
        parentId: parentId,
        remarks: remarks || "",
        actionAt: new Date()
      }
    });

    const isCancellation = pass.cancellationRequest && pass.cancellationRequest.requested;
    let defaultRemark = "Approved by parent";

    if (isCancellation) {
      defaultRemark = "Cancellation request approved by parent";
    }

    await tx.passTimeline.create({
      data: {
        passId,
        action: "parent_approved",
        actorId: parentId,
        actorRole: "parent",
        remarks: remarks || defaultRemark
      }
    });

    updatedPass = await tx.pass.update({
      where: { id: passId },
      data: {},
      include: {
        student: {
          include: {
            course: { select: { name: true } },
            department: { select: { name: true } },
            batch: { select: { name: true } },
            studentHostels: {
              where: { status: "active" },
              select: { roomNumber: true }
            },
            studentParents: true
          }
        },
        parent: true,
        hostel: {
          select: {
            id: true,
            name: true
          }
        },
        approvals: {
          include: {
            actionBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        gateLogs: true,
        timeline: {
          orderBy: {
            timestamp: "asc"
          }
        }
      }
    });
  });

  return formatPassResponse(updatedPass);
};

export const approvePassAsMentor = async ({ passId, actor, remarks }) => {
  const mentorId = actor.id;

  const pass = await prisma.pass.findUnique({
    where: { id: passId },
    include: {
      student: true
    }
  });

  if (!pass) {
    const error = new Error("We couldn't find the pass you're looking for.");
    error.statusCode = 404;
    throw error;
  }

  const activeAssignments = await prisma.mentorAssignment.findMany({
    where: { mentorId, status: "ACTIVE" },
    select: { batchId: true }
  });
  const batchIds = activeAssignments.map(a => a.batchId);

  if (!pass.student?.batchId || !batchIds.includes(pass.student.batchId)) {
    const error = new Error("You don't have permission to approve passes for this student.");
    error.statusCode = 403;
    throw error;
  }

  if (pass.status !== "pending_admin") {
    const error = new Error("This pass can't be approved right now because of its current status.");
    error.statusCode = 422;
    throw error;
  }

  let updatedPass;
  await prisma.$transaction(async (tx) => {
    const updated = await tx.pass.updateMany({
      where: { id: passId, status: "pending_admin" },
      data: { status: "approved" }
    });

    if (updated.count === 0) {
      const error = new Error("The pass could not be approved. Its status may have changed.");
      error.statusCode = 409;
      throw error;
    }

    await tx.passApproval.create({
      data: {
        passId,
        approvalLevel: "ADMIN",
        status: "APPROVED",
        actionById: mentorId,
        remarks: remarks || "Approved by mentor",
        actionAt: new Date()
      }
    });

    await tx.passTimeline.create({
      data: {
        passId,
        action: "admin_approved",
        actorId: mentorId,
        actorRole: "mentor",
        remarks: remarks || "Approved by mentor"
      }
    });

    updatedPass = await tx.pass.update({
      where: { id: passId },
      data: {},
      include: {
        student: {
          include: {
            course: { select: { name: true } },
            department: { select: { name: true } },
            batch: { select: { name: true } },
            studentHostels: {
              where: { status: "active" },
              select: { roomNumber: true }
            },
            studentParents: true
          }
        },
        parent: true,
        hostel: {
          select: {
            id: true,
            name: true
          }
        },
        approvals: {
          include: {
            actionBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        gateLogs: true,
        timeline: {
          orderBy: {
            timestamp: "asc"
          }
        }
      }
    });
  });

  return formatPassResponse(updatedPass);
};

export const approvePassAsAdmin = async ({ passId, actor, remarks }) => {
  const adminId = actor.id;
  const role = (actor.role || "").toLowerCase();

  const pass = await prisma.pass.findUnique({
    where: { id: passId },
    include: {
      student: true
    }
  });

  if (!pass) {
    const error = new Error("We couldn't find the pass you're looking for.");
    error.statusCode = 404;
    throw error;
  }

  // Admin scope check
  if (role !== "super_admin") {
    if (pass.organizationId !== actor.organizationId) {
      const error = new Error("You don't have permission to approve passes for this hostel.");
      error.statusCode = 403;
      throw error;
    }
  }

  if (pass.status !== "pending_admin") {
    const error = new Error("This pass can't be approved right now because of its current status.");
    error.statusCode = 422;
    throw error;
  }

  let updatedPass;
  await prisma.$transaction(async (tx) => {
    const updated = await tx.pass.updateMany({
      where: { id: passId, status: "pending_admin" },
      data: { status: "approved" }
    });

    if (updated.count === 0) {
      const error = new Error("The pass could not be approved. Its status may have changed.");
      error.statusCode = 409;
      throw error;
    }

    await tx.passApproval.create({
      data: {
        passId,
        approvalLevel: "ADMIN",
        status: "APPROVED",
        actionById: adminId,
        remarks: remarks || "Approved by admin",
        actionAt: new Date()
      }
    });

    await tx.passTimeline.create({
      data: {
        passId,
        action: "admin_approved",
        actorId: adminId,
        actorRole: role === "super_admin" ? "super_admin" : "admin",
        remarks: remarks || "Approved by admin"
      }
    });

    updatedPass = await tx.pass.update({
      where: { id: passId },
      data: {},
      include: {
        student: {
          include: {
            course: { select: { name: true } },
            department: { select: { name: true } },
            batch: { select: { name: true } },
            studentHostels: {
              where: { status: "active" },
              select: { roomNumber: true }
            },
            studentParents: true
          }
        },
        parent: true,
        hostel: {
          select: {
            id: true,
            name: true
          }
        },
        approvals: {
          include: {
            actionBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        gateLogs: true,
        timeline: {
          orderBy: {
            timestamp: "asc"
          }
        }
      }
    });
  });

  return formatPassResponse(updatedPass);
};
