import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

export const createHostel = asyncHandler(async (req, res) => {
  const { name, code, email, phone, location, capacity, hostelType, type, hosteltype, adminId } = req.body;
  
  const parsedHostelType = hostelType || type || hosteltype;

  // Basic validation (ideally handled in validation.js)
  if (!name || !code || !parsedHostelType) {
    return sendError(res, 400, 'Name, code, and hostelType are required');
  }

  const existingHostel = await prisma.hostel.findUnique({
    where: { code }
  });

  if (existingHostel) {
    return sendError(res, 400, 'Hostel with this code already exists');
  }

  const newHostel = await prisma.hostel.create({
    data: {
      name,
      code,
      email,
      phone,
      location,
      capacity: capacity ? parseInt(capacity) : null,
      hostelType: parsedHostelType.toUpperCase(),
      adminId: adminId || null,
    }
  });

  return sendSuccess(res, 201, 'Hostel created successfully', {
    ...newHostel,
    _id: newHostel.id
  });
});

export const getHostels = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const search = req.query.search;
  
  const skip = (page - 1) * limit;
  let whereClause = {};

  if (status && status !== 'All') {
    whereClause.isActive = status === 'Active';
  }

  if (search) {
    whereClause.name = { contains: search, mode: 'insensitive' };
  }

  const [hostels, totalCount] = await Promise.all([
    prisma.hostel.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { fullName: true } }
      }
    }),
    prisma.hostel.count({ where: whereClause })
  ]);

  // Map id to _id for frontend compatibility
  const mappedHostels = hostels.map(h => ({
    ...h,
    _id: h.id
  }));

  return sendSuccess(res, 200, 'Hostels retrieved successfully', {
    count: mappedHostels.length,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    data: mappedHostels
  });
});

export const getHostelById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hostel = await prisma.hostel.findUnique({
    where: { id },
    include: {
      admin: { select: { fullName: true, email: true, phone: true } }
    }
  });

  if (!hostel) {
    return sendError(res, 404, 'Hostel not found');
  }

  return sendSuccess(res, 200, 'Hostel retrieved successfully', {
    ...hostel,
    _id: hostel.id
  });
});

export const updateHostel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, email, phone, location, capacity, hostelType, type, hosteltype, adminId, isActive } = req.body;
  
  const parsedHostelType = hostelType || type || hosteltype;

  const existingHostel = await prisma.hostel.findUnique({ where: { id } });

  if (!existingHostel) {
    return sendError(res, 404, 'Hostel not found');
  }

  if (code && code !== existingHostel.code) {
    const codeConflict = await prisma.hostel.findUnique({ where: { code } });
    if (codeConflict) {
      return sendError(res, 400, 'Another hostel with this code already exists');
    }
  }

  const updatedHostel = await prisma.hostel.update({
    where: { id },
    data: {
      name: name !== undefined ? name : existingHostel.name,
      code: code !== undefined ? code : existingHostel.code,
      email: email !== undefined ? email : existingHostel.email,
      phone: phone !== undefined ? phone : existingHostel.phone,
      location: location !== undefined ? location : existingHostel.location,
      capacity: capacity !== undefined ? parseInt(capacity) : existingHostel.capacity,
      hostelType: parsedHostelType !== undefined ? parsedHostelType.toUpperCase() : existingHostel.hostelType,
      adminId: adminId !== undefined ? adminId : existingHostel.adminId,
      isActive: isActive !== undefined ? isActive : existingHostel.isActive,
    }
  });

  return sendSuccess(res, 200, 'Hostel updated successfully', {
    ...updatedHostel,
    _id: updatedHostel.id
  });
});

export const deleteHostel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingHostel = await prisma.hostel.findUnique({ where: { id } });

  if (!existingHostel) {
    return sendError(res, 404, 'Hostel not found');
  }

  // Soft delete logic can be implemented here instead of hard delete
  await prisma.hostel.delete({
    where: { id }
  });

  return sendSuccess(res, 200, 'Hostel deleted successfully');
});

export const toggleHostelStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingHostel = await prisma.hostel.findUnique({ where: { id } });

  if (!existingHostel) {
    return sendError(res, 404, 'Hostel not found');
  }

  const updatedHostel = await prisma.hostel.update({
    where: { id },
    data: {
      isActive: !existingHostel.isActive
    }
  });

  const message = updatedHostel.isActive 
    ? "Hostel activated successfully" 
    : "Hostel deactivated successfully";

  return sendSuccess(res, 200, message, {
    ...updatedHostel,
    _id: updatedHostel.id
  });
});

export const bulkToggleHostelStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Please provide an array of Hostel IDs");
  }

  if (typeof isActive !== 'boolean') {
    return sendError(res, 400, "Please provide isActive boolean status");
  }

  await prisma.hostel.updateMany({
    where: {
      id: { in: ids }
    },
    data: {
      isActive
    }
  });

  return sendSuccess(res, 200, "Bulk hostel status updated successfully");
});
