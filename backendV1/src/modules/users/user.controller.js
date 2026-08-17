import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';
import { hashPassword } from '../../utils/hash.js';
import { sendMail } from '../../utils/mailer.js';
import { getIo } from '../../config/socket.js';

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
        organization: true,
        hostelWardens: {
          select: {
            hostel: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
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
    name: user.fullName,
    hostel: user.hostelWardens && user.hostelWardens.length > 0 ? user.hostelWardens[0].hostel : null
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

export const createWarden = asyncHandler(async (req, res) => {
  const { name, email, phone, hostelId } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
      return sendError(res, 400, "Email already exists");
  }

  if (hostelId && hostelId !== 'Not Assigned') {
      const hostelExists = await prisma.hostel.findUnique({ where: { id: hostelId } });
      if (!hostelExists) {
          return sendError(res, 404, "Hostel not found");
      }
  }

  const temporaryPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await hashPassword(temporaryPassword);

  const warden = await prisma.$transaction(async (tx) => {
      const newWarden = await tx.user.create({
          data: {
              fullName: name,
              email,
              phone,
              passwordHash: hashedPassword,
              tempPassword: true,
              role: "WARDEN",
              createdBy: req.user?.id || req.user?._id
          }
      });

      if (hostelId && hostelId !== 'Not Assigned') {
          await tx.hostelWarden.create({
              data: {
                  hostelId: hostelId,
                  userId: newWarden.id
              }
          });
      }

      if (req.user?.id || req.user?._id) {
          const userId = req.user.id || req.user._id;
          await tx.auditLog.create({
              data: {
                  action: "Created Warden",
                  module: "User",
                  entityId: newWarden.id,
                  userId: userId,
                  newData: { name, email, phone, hostelId }
              }
          });
      }

      return newWarden;
  });

  const subject = "Your Warden Account Details";
  const text = `Hello ${name}\n\nYour warden account has been created. Your temporary password is: ${temporaryPassword}\n\nPlease log in and change your password immediately.`;
  const html = `<p>Hello ${name},</p><p>Your warden account has been created.</p><p>Your temporary password is: <strong>${temporaryPassword}</strong></p><p>Please log in and change your password immediately.</p>`;

  try {
      await sendMail(email, subject, text, html);
  } catch (error) {
      console.error("Failed to send temporary password email:", error);
  }

  const io = getIo();
  if (io) {
      io.emit('userCreated', { role: 'warden', data: warden });
  }

  return sendSuccess(res, 201, "Warden created and assigned to hostel successfully", { data: warden });
});

export const updateWarden = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      fullName: name,
      phone
    }
  });

  return sendSuccess(res, 200, "Warden updated successfully", { data: updatedUser });
});

export const updateEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { oldEmail, newEmail, password } = req.body;
  
  const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existingUser) {
    return sendError(res, 400, "Email already exists");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { email: newEmail }
  });

  return sendSuccess(res, 200, "Email updated successfully", { data: updatedUser });
});

export const updateWardenHostel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hostelId } = req.body;

  if (!hostelId || hostelId === 'Not Assigned') {
    await prisma.hostelWarden.deleteMany({
      where: { userId: id }
    });
    return sendSuccess(res, 200, "Hostel unassigned successfully");
  }

  const existingHostelWarden = await prisma.hostelWarden.findFirst({
    where: { userId: id }
  });

  if (existingHostelWarden) {
    await prisma.hostelWarden.update({
      where: { id: existingHostelWarden.id },
      data: { hostelId }
    });
  } else {
    await prisma.hostelWarden.create({
      data: {
        userId: id,
        hostelId
      }
    });
  }

  return sendSuccess(res, 200, "Hostel assigned successfully");
});

export const toggleWardenStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive }
  });

  return sendSuccess(res, 200, "Status toggled successfully", { data: updatedUser });
});

export const bulkToggleWardenStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;
  
  await prisma.user.updateMany({
    where: { id: { in: ids } },
    data: { isActive }
  });

  return sendSuccess(res, 200, "Bulk status updated successfully");
});
