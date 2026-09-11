import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

export const getLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, search, startDate, endDate } = req.query;

  const where = {};

  if (req.user.role === 'admin') {
    if (!req.user.organizationId) {
      return sendError(res, 403, 'Admin user has no organization ID');
    }
    where.user = { organizationId: req.user.organizationId };
  }

  if (status && status !== 'all') {
    where.status = status.toUpperCase();
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else if (startDate) {
    where.createdAt = {
      gte: new Date(startDate)
    };
  } else if (endDate) {
    where.createdAt = {
      lte: new Date(endDate)
    };
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { details: { contains: search, mode: 'insensitive' } },
      { userRole: { contains: search, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      }
    ];
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
