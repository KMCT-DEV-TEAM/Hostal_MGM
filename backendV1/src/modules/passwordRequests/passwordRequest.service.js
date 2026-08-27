import { prisma } from '../../config/prisma.js';
import { hashPassword } from '../../utils/hash.js';

export const verifyEmailExistsDb = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  return Boolean(user);
};

export const submitPasswordRequestDb = async (email, plainNewPassword) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await hashPassword(plainNewPassword);

  const request = await prisma.passwordRequest.create({
    data: {
      userId: user.id,
      newPassword: hashedPassword,
      status: "pending",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        }
      }
    }
  });

  return request;
};

export const getPasswordRequestsDb = async (query = {}) => {
  const { page = 1, limit = 10, status = "pending", search = "" } = query;

  const where = {};
  if (status && status !== "all") {
    where.status = status;
  }

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    };
  }

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const [requests, totalRecords] = await Promise.all([
    prisma.passwordRequest.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.passwordRequest.count({ where })
  ]);

  // Format requests to match expected UI structure
  const formattedRequests = requests.map(r => ({
    _id: r.id,
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    user: r.user ? {
      _id: r.user.id,
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
      role: (r.user.role || '').toLowerCase(),
      organization: r.user.organization?.name || 'N/A'
    } : null
  }));

  return {
    requests: formattedRequests,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNumber) || 1,
      hasNextPage: pageNumber < Math.ceil(totalRecords / limitNumber),
      hasPreviousPage: pageNumber > 1,
    }
  };
};

export const approvePasswordRequestDb = async (requestId) => {
  const request = await prisma.passwordRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new Error("Password request not found");
  }

  if (request.status !== "pending") {
    throw new Error(`Request is already ${request.status}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: request.userId }
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: request.newPassword,
        tempPassword: false,
        failedLoginAttempts: 0,
        lockUntil: null
      }
    }),
    prisma.passwordRequest.update({
      where: { id: requestId },
      data: { status: "approved" }
    })
  ]);

  return { ...request, status: "approved" };
};

export const rejectPasswordRequestDb = async (requestId) => {
  const request = await prisma.passwordRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new Error("Password request not found");
  }

  const updated = await prisma.passwordRequest.update({
    where: { id: requestId },
    data: { status: "rejected" }
  });

  return updated;
};
