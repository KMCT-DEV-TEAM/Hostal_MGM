

import { prisma } from "../../config/prisma.js";

/**
 * Fetches a student record for hostel allocation logic.
 */
export const getStudentById = (studentId) =>
  prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      fullName: true, // MongoDB field: student.name
      organizationId: true,
      isActive: true,
    },
  });

/**
 * Fetches a hostel record for hostel allocation logic.
 */
export const getHostelById = (hostelId) =>
  prisma.hostel.findUnique({
    where: { id: hostelId },
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
    },
  });
/**
 * Retrieves paginated, sorted, and filtered hostel allocation history.
 */
export const getHostelHistoryDb = async (query) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    hostelId,
    organizationId,
    status,
    sortBy = "joinedAt",
    sortOrder = "desc",
  } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const where = {};

  if (organizationId) {
    where.organizationId = organizationId;
  }
  if (hostelId) {
    where.hostelId = hostelId;
  }
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { student: { fullName: { contains: search, mode: "insensitive" } } },
      { student: { studentCode: { contains: search, mode: "insensitive" } } },
      { hostel: { name: { contains: search, mode: "insensitive" } } },
      { roomNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy = {
    [sortBy]: sortOrder === "asc" ? "asc" : "desc",
  };

  const [history, total] = await prisma.$transaction([
    prisma.studentHostel.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentCode: true,
            email: true,
          }
        },
        hostel: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        allocatedBy: {
          select: {
            id: true,
            fullName: true,
          }
        },
        vacatedBy: {
          select: {
            id: true,
            fullName: true,
          }
        }
      }
    }),
    prisma.studentHostel.count({ where }),
  ]);

  return { history, total, limitNumber, pageNumber };
};

/**
 * Retrieves the complete chronological allocation timeline for a specific student.
 */
export const getStudentHostelTimelineDb = async (studentId) => {
  return await prisma.studentHostel.findMany({
    where: { studentId },
    orderBy: { joinedAt: "desc" },
    include: {
      hostel: {
        select: {
          id: true,
          name: true,
          code: true,
        }
      },
      allocatedBy: {
        select: {
          id: true,
          fullName: true,
        }
      },
      vacatedBy: {
        select: {
          id: true,
          fullName: true,
        }
      }
    }
  });
};


/**
 * Finds the currently active hostel allocation for a student.
 */
export const findActiveAllocation = (studentId) =>
  prisma.studentHostel.findFirst({
    where: {
      studentId,
      status: "active", // DB enum value matching MongoDB exactly
    },
    select: {
      id: true,
      hostelId: true,
      roomNumber: true,
      status: true,
    },
  });


/**
 * Creates a new student hostel allocation record within a transaction.
 */
export const createAllocation = (tx, data) =>
  tx.studentHostel.create({
    data: {
      studentId: data.studentId,
      organizationId: data.organizationId,
      hostelId: data.hostelId,
      roomNumber: data.roomNumber,
      status: "active",
      joinedAt: data.joinedAt,
      allocatedById: data.allocatedById,
      reason: data.reason ?? null,
      remarks: data.remarks ?? null,
    },
    select: {
      id: true,
      studentId: true,
      hostelId: true,
      roomNumber: true,
      status: true,
      joinedAt: true,
      allocatedById: true,
      reason: true,
      remarks: true,
      createdAt: true,
      updatedAt: true,
    },
  });


/**
 * Updates an allocation's status (e.g. to "vacated" or "transferred") within a transaction.
 */
export const updateAllocationStatus = (
  tx,
  allocationId,
  status,
  vacatedById,
  reason,
) =>
  tx.studentHostel.update({
    where: { id: allocationId },
    data: {
      status,
      vacatedAt: new Date(),
      vacatedById,
      reason,
    },
  });

/**
 * Synchronizes the HostelOrganization join table based on currently active allocations.
 * Must run within the allocation transaction.
 */
export const syncHostelOrganizations = async (tx, hostelId) => {
  // 1. Find all distinct organizations of students currently occupying this hostel
  // (Using StudentHostel as the source of truth)
  const activeAllocations = await tx.studentHostel.findMany({
    where: {
      hostelId: hostelId,
      status: "active",
    },
    select: { organizationId: true },
    distinct: ["organizationId"],
  });

  const activeOrgIds = activeAllocations.map((a) => a.organizationId);

  // 2. Delete any join records for organizations that no longer have students here
  await tx.hostelOrganization.deleteMany({
    where: {
      hostelId,
      organizationId: { notIn: activeOrgIds },
    },
  });

  // 3. Ensure a join record exists for every currently active organization
  for (const orgId of activeOrgIds) {
    await tx.hostelOrganization.upsert({
      where: {
        hostelId_organizationId: { hostelId, organizationId: orgId },
      },
      create: { hostelId, organizationId: orgId },
      update: {}, // row already exists — no change needed
    });
  }
};
