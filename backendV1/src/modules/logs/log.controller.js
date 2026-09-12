import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

export const getLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, search, startDate, endDate, priority } = req.query;

  const where = {};

  // Scope admin to their org
  if (req.user.role === 'admin') {
    if (!req.user.organizationId) {
      return sendError(res, 403, 'Admin user has no organization ID');
    }
    where.user = { organizationId: req.user.organizationId };
  }

  // Status filter
  if (status && status !== 'all') {
    where.status = status.toUpperCase();
  }

  // Priority filter
  if (priority && priority !== 'all') {
    where.priority = priority.toUpperCase();
  }

  // Date filter — include full end day
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate + 'T00:00:00.000Z');
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }
  }

  // Search filter — must not conflict with admin org user filter
  if (search) {
    const searchCondition = [
      { action: { contains: search, mode: 'insensitive' } },
      { details: { contains: search, mode: 'insensitive' } },
      { userRole: { contains: search, mode: 'insensitive' } },
      { ipAddress: { contains: search, mode: 'insensitive' } },
    ];

    // Only add user-based search if no org filter is already scoping users
    if (!where.user) {
      searchCondition.push({
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      });
    }

    where.OR = searchCondition;
  }

  const [logs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organizationId: true
          }
        }
      }
    }),
    prisma.activityLog.count({ where })
  ]);

  return sendSuccess(res, 200, "Logs fetched successfully", {
    logs,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit)
  });
});
