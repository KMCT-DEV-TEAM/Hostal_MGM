import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

import { getIo } from '../../config/socket.js';

export const createOrganization = asyncHandler(async (req, res) => {
  const { name, code, organisationNumber, email, phone, address } = req.body;

  if (email) {
    const existingEmail = await prisma.organization.findFirst({
      where: { email }
    });
    if (existingEmail) {
      return sendError(res, 400, "Organization email already exists");
    }
  }

  if (code) {
    const existingCode = await prisma.organization.findUnique({
      where: { code }
    });
    if (existingCode) {
      return sendError(res, 400, "Organization code already exists");
    }
  }

  if (organisationNumber) {
    const existingNumber = await prisma.organization.findUnique({
      where: { organisationNumber }
    });
    if (existingNumber) {
      return sendError(res, 400, "Organization number already exists");
    }
  }

  const organization = await prisma.organization.create({
    data: {
      name,
      code,
      organisationNumber,
      email,
      phone,
      address,
    }
  });

  if (req.user?.id || req.user?._id) {
    const userId = req.user.id || req.user._id;
    await prisma.auditLog.create({
      data: {
        action: "Created Organization",
        module: "Organization",
        entityId: organization.id,
        userId: userId,
        newData: { name: organization.name },
      }
    });
  }

  const io = getIo();
  if (io) {
    io.emit('organizationCreated', organization);
  }

  return sendSuccess(res, 201, 'Organization created successfully', { data: organization });
});

export const getOrganizations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;
  const search = req.query.search || "";
  const status = req.query.status || "All";

  const adminOrganizationId = (req.user?.role === 'ADMIN' || req.user?.role === 'admin') ? (req.user.organizationId || req.user.organization) : null;
  if ((req.user?.role === 'ADMIN' || req.user?.role === 'admin') && !adminOrganizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  let whereClause = {};

  if (adminOrganizationId) {
    whereClause.id = adminOrganizationId;
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status !== 'All') {
    whereClause.isActive = status === 'Active';
  }

  const skip = (page - 1) * limit;

  const [organizations, totalCount] = await Promise.all([
    prisma.organization.findMany({
      where: whereClause,
      skip: limit > 0 ? skip : undefined,
      take: limit > 0 ? limit : undefined,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.organization.count({ where: whereClause })
  ]);

  return sendSuccess(res, 200, "Organizations fetched successfully", {
    count: organizations.length,
    totalCount,
    currentPage: page,
    totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
    data: organizations
  });
});

export const getOrganizationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const organization = await prisma.organization.findUnique({
    where: { id }
  });

  if (!organization) {
    return sendError(res, 404, "Organization not found");
  }

  const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'admin';
  if (isAdmin && organization.id !== (req.user.organizationId || req.user.organization)) {
    return sendError(res, 403, "Access denied: You can only view your own organization");
  }

  return sendSuccess(res, 200, "Organization fetched successfully", { data: organization });
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, organisationNumber, email, phone, address } = req.body;

  if (email) {
    const existingEmail = await prisma.organization.findFirst({ where: { email } });
    if (existingEmail && existingEmail.id !== id) {
      return sendError(res, 400, "Organization email already exists");
    }
  }

  if (code) {
    const existingCode = await prisma.organization.findFirst({ where: { code } });
    if (existingCode && existingCode.id !== id) {
      return sendError(res, 400, "Organization code already exists");
    }
  }

  if (organisationNumber) {
    const existingNumber = await prisma.organization.findFirst({ where: { organisationNumber } });
    if (existingNumber && existingNumber.id !== id) {
      return sendError(res, 400, "Organization number already exists");
    }
  }

  const organization = await prisma.organization.update({
    where: { id },
    data: { name, code, organisationNumber, email, phone, address }
  });

  if (req.user?.id || req.user?._id) {
    const userId = req.user.id || req.user._id;
    await prisma.auditLog.create({
      data: {
        action: "Updated Organization",
        module: "Organization",
        entityId: organization.id,
        userId: userId,
        newData: { name: organization.name },
      }
    });
  }

  const io = getIo();
  if (io) {
    io.emit('organizationUpdated', { id: organization.id });
  }

  return sendSuccess(res, 200, "Organization updated successfully", { data: organization });
});

export const deleteOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, status } = req.body || {};
  
  const organization = await prisma.organization.findUnique({ where: { id } });
  if (!organization) {
    return sendError(res, 404, "Organization not found");
  }

  let newIsActive;
  if (typeof isActive === "boolean") {
    newIsActive = isActive;
  } else if (typeof status === "string") {
    newIsActive = status.toLowerCase() === "active";
  } else if (typeof isActive === "string") {
    newIsActive = isActive.toLowerCase() === "active" || isActive === "true";
  } else {
    newIsActive = !organization.isActive;
  }

  // Acting as a toggle status
  const updated = await prisma.organization.update({
    where: { id },
    data: { isActive: newIsActive }
  });

  if (req.user?.id || req.user?._id) {
    const userId = req.user.id || req.user._id;
    await prisma.auditLog.create({
      data: {
        action: updated.isActive ? "Activated Organization" : "Deactivated Organization",
        module: "Organization",
        entityId: updated.id,
        userId: userId,
        newData: { isActive: updated.isActive },
      }
    });
  }

  const io = getIo();
  if (io) {
    io.emit('organizationUpdated', { id });
  }

  const message = updated.isActive ? "Organization activated successfully" : "Organization deactivated successfully";
  return sendSuccess(res, 200, message, { data: updated });
});

export const bulkUpdateOrganizationStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Please provide an array of organization IDs");
  }

  if (typeof isActive !== "boolean") {
    return sendError(res, 400, "Please provide a valid boolean for isActive");
  }

  const result = await prisma.organization.updateMany({
    where: { id: { in: ids } },
    data: { isActive }
  });

  if (req.user?.id || req.user?._id) {
    const userId = req.user.id || req.user._id;
    await prisma.auditLog.create({
      data: {
        action: "Bulk Updated Organizations",
        module: "Organization",
        userId: userId,
        newData: { ids, isActive },
      }
    });
  }

  const io = getIo();
  if (io) {
    io.emit('organizationUpdated', { bulk: true });
  }

  return sendSuccess(res, 200, `Successfully updated ${ids.length} organizations to ${isActive ? 'Active' : 'Inactive'} status`, { result });
});
