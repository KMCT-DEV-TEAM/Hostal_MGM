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
            studentId: true
          }
        },
        approvals: {
          select: {
            status: true,
            role: true
          }
        }
      }
    })
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  const formattedPasses = passes.map(pass => {
    const parentApproval = pass.approvals?.find(a => a.role === 'parent');
    const adminApproval = pass.approvals?.find(a => ['admin', 'superadmin', 'warden', 'assistant_warden'].includes(a.role));
    
    return {
      _id: pass.id,
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
      admissionNumber: pass.student?.studentId,
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
