import { prisma } from "../../config/prisma.js";

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
  const pass = await prisma.pass.findUnique({
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

  if (!pass) {
    const error = new Error("We couldn't find the pass you're looking for.");
    error.statusCode = 404;
    throw error;
  }

  const role = (actor.role || "").toLowerCase();

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
    actionBy: parentApprovalRecord.actionById,
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

  const leftLog = pass.gateLogs?.find(g => g.eventType === "LEFT");
  const returnedLog = pass.gateLogs?.find(g => g.eventType === "RETURNED");

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
    if (fromDate !== undefined) updateData.fromDate = new Date(fromDate);
    if (toDate !== undefined) updateData.toDate = new Date(toDate);
  } else if (pass.passType === "out_pass") {
    const passDate = new Date(date !== undefined ? date : pass.fromDate);

    let outTimeStr = outTime;
    if (outTimeStr === undefined) {
      const d = new Date(pass.fromDate);
      outTimeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    let expectedReturnTimeStr = expectedReturnTime;
    if (expectedReturnTimeStr === undefined) {
      const d = new Date(pass.expectedReturnAt);
      expectedReturnTimeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    const [outHour, outMinute] = outTimeStr.split(":").map(Number);
    const [returnHour, returnMinute] = expectedReturnTimeStr.split(":").map(Number);

    const outDateTime = new Date(passDate);
    outDateTime.setHours(outHour, outMinute, 0, 0);

    const returnDateTime = new Date(passDate);
    returnDateTime.setHours(returnHour, returnMinute, 0, 0);

    updateData.fromDate = outDateTime;
    updateData.expectedReturnAt = returnDateTime;
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

    updatedPass = await tx.pass.update({
      where: { id: passId },
      data: updateData,
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
    await tx.passTimeline.create({
      data: {
        passId,
        action: (userRole === "student" || userRole === "parent") ? "cancelled" : "admin_cancelled",
        actorId: userId,
        actorRole: userRole,
        remarks: (userRole === "student" || userRole === "parent") ? "Cancelled by user." : remarks
      }
    });

    updatedPass = await tx.pass.update({
      where: { id: passId },
      data: { status: "cancelled" },
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
