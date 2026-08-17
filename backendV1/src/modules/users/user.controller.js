import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

const getPaginatedUsersByRole = async (role, page, limit, status, search, additionalWhere = {}) => {
  const skip = (page - 1) * limit;

  let whereClause = {
    role,
    ...additionalWhere
  };

  if (status && status !== 'All') {
    whereClause.isActive = status === 'Active';
  }

  if (search) {
    whereClause.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        organization: true, // If we want to include organization object, we need to use `include` inside findMany, but here we just select it
      }
    }),
    prisma.user.count({ where: whereClause })
  ]);

  return { users, totalCount };
};

export const getAdmins = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const search = req.query.search;

  // We are looking for ADMIN role
  const { users, totalCount } = await getPaginatedUsersByRole("ADMIN", page, limit, status, search);

  // Note: The frontend expects 'name' instead of 'fullName' based on old mongoose schema
  const mappedUsers = users.map(user => ({
    ...user,
    _id: user.id, // Support old frontend expecting _id
    name: user.fullName
  }));

  return sendSuccess(res, 200, "Admins fetched successfully", {
    count: mappedUsers.length,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    data: mappedUsers
  });
});

export const getWardens = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const search = req.query.search;

  const { users, totalCount } = await getPaginatedUsersByRole("WARDEN", page, limit, status, search);

  const mappedUsers = users.map(user => ({
    ...user,
    _id: user.id,
    name: user.fullName
  }));

  return sendSuccess(res, 200, "Wardens fetched successfully", {
    count: mappedUsers.length,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    data: mappedUsers
  });
});

export const getAssistantWardens = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const search = req.query.search;

  // Since 'ASSISTANT_WARDEN' is not in Prisma's Role enum, we'll return empty for now
  // unless we add it to the schema.
  return sendSuccess(res, 200, "Assistant Wardens fetched successfully", {
    count: 0,
    totalCount: 0,
    currentPage: page,
    totalPages: 0,
    data: []
  });
});
