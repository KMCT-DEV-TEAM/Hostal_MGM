

import { prisma } from "../../config/prisma.js";


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
