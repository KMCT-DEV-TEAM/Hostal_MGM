import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';
import { triggerAnnouncementNotifications } from './announcement.service.js';

// Create Announcement
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, targetType, targetOrganizations, targetHostels, scheduledAt, expiresAt } = req.body;
  const user = req.user;

  let actualTargetType = targetType;
  let actualOrganizations = [];
  let actualHostels = [];

  if (user.role === "super_admin") {
    if (!["GENERAL", "ORGANIZATION", "HOSTEL"].includes(targetType)) {
      return sendError(res, 400, "Valid targetType is required for super admin");
    }
    if (targetType === "ORGANIZATION") {
      actualOrganizations = targetOrganizations || [];
    } else if (targetType === "HOSTEL") {
      actualHostels = targetHostels || [];
    }
  } else if (user.role === "admin") {
    actualTargetType = "ORGANIZATION";
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !dbUser.organizationId) {
      return sendError(res, 400, "Admin is not assigned to an organization");
    }
    actualOrganizations = [dbUser.organizationId];
  } else if (user.role === "warden" || user.role === "assistant_warden") {
    actualTargetType = "HOSTEL";
    const hostels = await prisma.hostelWarden.findMany({ where: { userId: user.id } });
    if (!hostels || hostels.length === 0) {
      return sendError(res, 400, "Warden is not assigned to any hostels");
    }
    actualHostels = hostels.map(h => h.hostelId);
  } else {
    return sendError(res, 403, "Unauthorized to create announcements");
  }

  let status = 'ACTIVE';
  let isActive = true;
  if (scheduledAt && new Date(scheduledAt) > new Date()) {
    status = 'SCHEDULED';
    isActive = false;
  }

  const announcement = await prisma.$transaction(async (tx) => {
    const ann = await tx.announcement.create({
      data: {
        title,
        message,
        createdById: user.id,
        creatorRole: user.role,
        targetType: actualTargetType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status,
        isActive,
      }
    });

    if (actualOrganizations.length > 0) {
      await tx.announcementOrganization.createMany({
        data: actualOrganizations.map(orgId => ({
          announcementId: ann.id,
          organizationId: orgId
        }))
      });
    }

    if (actualHostels.length > 0) {
      await tx.announcementHostel.createMany({
        data: actualHostels.map(hostelId => ({
          announcementId: ann.id,
          hostelId: hostelId
        }))
      });
    }

    return ann;
  });

  if (status === 'ACTIVE') {
    triggerAnnouncementNotifications(announcement.id).catch(console.error);
  }

  return sendSuccess(res, 201, status === 'SCHEDULED' ? "Announcement scheduled successfully" : "Announcement created successfully", announcement);
});

// Get Announcements
export const getAnnouncements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = "ACTIVE", search = "" } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const user = req.user;
  const where = {};
  
  const upperStatus = status.toUpperCase();

  if (upperStatus === "HISTORY") {
    where.status = { in: ["EXPIRED", "DELETED"] };
  } else if (upperStatus === "ACTIVE") {
    where.status = "ACTIVE";
  } else if (upperStatus !== "ALL") {
    where.status = upperStatus;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { message: { contains: search, mode: 'insensitive' } }
    ];
  }

  const roleWhere = [];

  if (user.role === "super_admin") {
    // Super admin sees all
  } else if (user.role === "admin") {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    roleWhere.push(
      { targetType: "GENERAL" },
      { createdById: user.id }
    );
    if (dbUser?.organizationId) {
       roleWhere.push({ 
         targetType: "ORGANIZATION",
         organizations: { some: { organizationId: dbUser.organizationId } }
       });
    }
  } else if (user.role === "warden" || user.role === "assistant_warden") {
    const wardenHostels = await prisma.hostelWarden.findMany({ where: { userId: user.id } });
    const hostelIds = wardenHostels.map(h => h.hostelId);
    roleWhere.push(
      { targetType: "GENERAL" },
      { createdById: user.id },
      { targetType: "HOSTEL", hostels: { some: { hostelId: { in: hostelIds } } } }
    );
  } else if (user.role === "student") {
    const dbUser = await prisma.student.findUnique({ where: { id: user.id }, include: { studentHostels: { where: { status: 'active' } } } });
    roleWhere.push({ targetType: "GENERAL" });
    if (dbUser?.organizationId) {
      roleWhere.push({ targetType: "ORGANIZATION", organizations: { some: { organizationId: dbUser.organizationId } } });
    }
    const activeHostel = dbUser?.studentHostels?.[0]?.hostelId;
    if (activeHostel) {
       roleWhere.push({ targetType: "HOSTEL", hostels: { some: { hostelId: activeHostel } } });
    }
  } else if (user.role === "parent") {
    const dbUser = await prisma.parent.findUnique({ where: { id: user.id }, include: { studentParents: { include: { student: { include: { studentHostels: { where: { status: 'active' } } } } } } } });
    roleWhere.push({ targetType: "GENERAL" });
    const students = dbUser?.studentParents?.map(sp => sp.student) || [];
    const orgIds = students.map(s => s.organizationId).filter(Boolean);
    const hostelIds = students.flatMap(s => s.studentHostels.map(sh => sh.hostelId)).filter(Boolean);
    
    if (orgIds.length > 0) {
       roleWhere.push({ targetType: "ORGANIZATION", organizations: { some: { organizationId: { in: orgIds } } } });
    }
    if (hostelIds.length > 0) {
       roleWhere.push({ targetType: "HOSTEL", hostels: { some: { hostelId: { in: hostelIds } } } });
    }
  }

  if (roleWhere.length > 0) {
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        { OR: roleWhere }
      ];
      delete where.OR;
    } else {
      where.OR = roleWhere;
    }
  }

  const [total, announcements] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true, role: true } },
        organizations: { include: { organization: { select: { id: true, name: true } } } },
        hostels: { include: { hostel: { select: { id: true, name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    })
  ]);

  const formattedAnnouncements = announcements.map(ann => ({
    ...ann,
    _id: ann.id,
    createdBy: {
      _id: ann.createdBy.id,
      id: ann.createdBy.id,
      name: ann.createdBy.fullName,
      role: ann.createdBy.role
    },
    targetOrganizations: ann.organizations.map(o => ({ _id: o.organization.id, id: o.organization.id, name: o.organization.name })),
    targetHostels: ann.hostels.map(h => ({ _id: h.hostel.id, id: h.hostel.id, name: h.hostel.name }))
  }));

  return sendSuccess(res, 200, "Announcements retrieved successfully", {
    data: formattedAnnouncements,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: pageNum * limitNum < total
    }
  });
});

export const getAnnouncementById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, fullName: true, role: true } },
      organizations: { include: { organization: { select: { id: true, name: true } } } },
      hostels: { include: { hostel: { select: { id: true, name: true } } } }
    }
  });

  if (!announcement) {
    return sendError(res, 404, "Announcement not found");
  }

  const formattedAnnouncement = {
    ...announcement,
    _id: announcement.id,
    createdBy: {
      _id: announcement.createdBy.id,
      id: announcement.createdBy.id,
      name: announcement.createdBy.fullName,
      role: announcement.createdBy.role
    },
    targetOrganizations: announcement.organizations.map(o => ({ _id: o.organization.id, id: o.organization.id, name: o.organization.name })),
    targetHostels: announcement.hostels.map(h => ({ _id: h.hostel.id, id: h.hostel.id, name: h.hostel.name }))
  };

  return sendSuccess(res, 200, "Announcement retrieved successfully", formattedAnnouncement);
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, message, targetType, targetOrganizations, targetHostels, scheduledAt, expiresAt } = req.body;
  const user = req.user;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: { organizations: true, hostels: true }
  });

  if (!announcement) {
    return sendError(res, 404, "Announcement not found");
  }

  if (user.role !== "super_admin" && announcement.createdById !== user.id) {
    return sendError(res, 403, "Unauthorized to edit this announcement");
  }

  let actualTargetType = targetType || announcement.targetType;
  let actualOrganizations = targetOrganizations || announcement.organizations.map(o => o.organizationId);
  let actualHostels = targetHostels || announcement.hostels.map(h => h.hostelId);

  if (user.role === "super_admin" && targetType) {
    if (!["GENERAL", "ORGANIZATION", "HOSTEL"].includes(targetType)) {
      return sendError(res, 400, "Valid targetType is required");
    }
    if (targetType === "GENERAL") {
       actualOrganizations = [];
       actualHostels = [];
    } else if (targetType === "ORGANIZATION") {
       actualHostels = [];
    } else if (targetType === "HOSTEL") {
       actualOrganizations = [];
    }
  }

  let status = announcement.status;
  let isActive = announcement.isActive;
  if (scheduledAt) {
    if (new Date(scheduledAt) > new Date()) {
      status = 'SCHEDULED';
      isActive = false;
    } else {
      status = 'ACTIVE';
      isActive = true;
    }
  }

  const updatedAnnouncement = await prisma.$transaction(async (tx) => {
    const ann = await tx.announcement.update({
      where: { id },
      data: {
        title: title || announcement.title,
        message: message || announcement.message,
        targetType: actualTargetType,
        scheduledAt: scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : announcement.scheduledAt,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : announcement.expiresAt,
        status,
        isActive,
      }
    });

    if (targetType || targetOrganizations || targetHostels) {
      await tx.announcementOrganization.deleteMany({ where: { announcementId: id } });
      await tx.announcementHostel.deleteMany({ where: { announcementId: id } });

      if (actualOrganizations.length > 0) {
        await tx.announcementOrganization.createMany({
          data: actualOrganizations.map(orgId => ({
            announcementId: id,
            organizationId: orgId
          }))
        });
      }

      if (actualHostels.length > 0) {
        await tx.announcementHostel.createMany({
          data: actualHostels.map(hostelId => ({
            announcementId: id,
            hostelId: hostelId
          }))
        });
      }
    }

    return ann;
  });

  const formattedAnnouncement = {
    ...updatedAnnouncement,
    _id: updatedAnnouncement.id,
    targetOrganizations: targetOrganizations || [],
    targetHostels: targetHostels || []
  };

  return sendSuccess(res, 200, "Announcement updated successfully", formattedAnnouncement);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) {
    return sendError(res, 404, "Announcement not found");
  }

  if (user.role !== "super_admin" && announcement.createdById !== user.id) {
    return sendError(res, 403, "Unauthorized to delete this announcement");
  }

  await prisma.announcement.update({
    where: { id },
    data: {
      status: 'DELETED',
      isActive: false
    }
  });

  return sendSuccess(res, 200, "Announcement deleted successfully");
});
