import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';
import { hashPassword } from '../../utils/hash.js';
import { sendMail } from '../../utils/mailer.js';
import { getIo } from '../../config/socket.js';
import { deleteOtpDb } from '../otps/otp.service.js';

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
                name: true,
                code: true,
                hostelType: true,
                capacity: true,
                location: true,
                isActive: true,
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

  const mappedUsers = users.map(user => {
    const rawHostel = user.hostelWardens && user.hostelWardens.length > 0 ? user.hostelWardens[0].hostel : null;
    const hostel = rawHostel ? {
      ...rawHostel,
      status: rawHostel.isActive ? 'Active' : 'Inactive',
      hosteltype: rawHostel.hostelType ? rawHostel.hostelType.toLowerCase() : rawHostel.hosteltype
    } : null;

    return {
      ...user,
      id: user.id,
      _id: user.id,
      name: user.fullName,
      status: user.isActive ? 'Active' : 'Inactive',
      hostel
    };
  });

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

  const { users, totalCount } = await getPaginatedUsersByRole("ASSISTANT_WARDEN", page, limit, status, search);

  const mappedUsers = users.map(user => {
    const rawHostel = user.hostelWardens && user.hostelWardens.length > 0 ? user.hostelWardens[0].hostel : null;
    const hostel = rawHostel ? {
      ...rawHostel,
      status: rawHostel.isActive ? 'Active' : 'Inactive',
      hosteltype: rawHostel.hostelType ? rawHostel.hostelType.toLowerCase() : rawHostel.hosteltype
    } : null;

    return {
      ...user,
      id: user.id,
      _id: user.id,
      name: user.fullName,
      status: user.isActive ? 'Active' : 'Inactive',
      hostel
    };
  });

  return sendSuccess(res, 200, "Assistant Wardens fetched successfully", {
    count: mappedUsers.length,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    data: mappedUsers
  });
});

export const getAssistantWardenById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      hostelWardens: {
        include: {
          hostel: true
        }
      }
    }
  });

  if (!user || user.role !== 'ASSISTANT_WARDEN') {
    return sendError(res, 404, "Assistant Warden not found");
  }

  return sendSuccess(res, 200, "Assistant Warden fetched successfully", { data: user });
});

export const createAssistantWarden = asyncHandler(async (req, res) => {
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
              role: "ASSISTANT_WARDEN",
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
                  action: "Created Assistant Warden",
                  module: "User",
                  entityId: newWarden.id,
                  userId: userId,
                  newData: { name, email, phone, hostelId }
              }
          });
      }

      return newWarden;
  });

  const subject = "Your Assistant Warden Account Details";
  const text = `Hello ${name}\n\nYour assistant warden account has been created. Your temporary password is: ${temporaryPassword}\n\nPlease log in and change your password immediately.`;
  const html = `<p>Hello ${name},</p><p>Your assistant warden account has been created.</p><p>Your temporary password is: <strong>${temporaryPassword}</strong></p><p>Please log in and change your password immediately.</p>`;

  try {
      await sendMail(email, subject, text, html);
  } catch (error) {
      console.error("Failed to send temporary password email:", error);
  }

  await deleteOtpDb(email);

  const io = getIo();
  if (io) {
      io.emit('userCreated', { role: 'assistantWarden', data: warden });
  }

  return sendSuccess(res, 201, "Assistant Warden created successfully", { data: warden });
});

export const updateAssistantWarden = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      fullName: name,
      phone
    }
  });

  return sendSuccess(res, 200, "Assistant Warden updated successfully", { data: updatedUser });
});

export const updateAssistantWardenHostel = asyncHandler(async (req, res) => {
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

export const toggleAssistantWardenStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive }
  });

  return sendSuccess(res, 200, "Status toggled successfully", { data: updatedUser });
});

export const bulkToggleAssistantWardenStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;
  
  await prisma.user.updateMany({
    where: { id: { in: ids } },
    data: { isActive }
  });

  return sendSuccess(res, 200, "Bulk status updated successfully");
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, organizationId } = req.body;
  if (!organizationId) return sendError(res, 400, "Organization is required");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return sendError(res, 400, "Email already exists");
  const tempPass = Math.random().toString(36).slice(-8);
  const { hashPassword } = await import("../../utils/hash.js");
  const hashed = await hashPassword(tempPass);
  const admin = await prisma.user.create({
    data: {
      fullName: name,
      email,
      phone,
      passwordHash: hashed,
      role: "ADMIN",
      organizationId,
    },
    include: { organization: true },
  });
  await prisma.organization.update({
    where: { id: organizationId },
    data: { adminId: admin.id },
  });
  const { sendMail } = await import("../../utils/mailer.js");
  sendMail(
    email,
    "Your Admin Account Details",
    `Hello ${name}, your temp pass is ${tempPass}`,
    `<p>Hello ${name},</p><p>Your temporary password is: <strong>${tempPass}</strong></p>`
  ).catch(console.error);

  // Cleanup OTP record once admin is created
  await deleteOtpDb(email);

  getIo()?.emit('userCreated', { role: 'admin', id: admin.id });

  return sendSuccess(res, 201, "Admin created successfully", {
    admin: {
      id: admin.id,
      name: admin.fullName,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      isActive: admin.isActive,
      organization: admin.organization,
    },
  });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, status, isActive } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.fullName = name;
  if (phone !== undefined) updateData.phone = phone;
  if (isActive !== undefined) updateData.isActive = isActive;
  else if (status !== undefined) updateData.isActive = status === 'Active';

  const admin = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { organization: true },
  });

  getIo()?.emit('userUpdated', { role: 'admin', id: admin.id });

  return sendSuccess(res, 200, "Admin updated successfully", {
    admin: {
      id: admin.id,
      name: admin.fullName,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      isActive: admin.isActive,
      organization: admin.organization,
    },
  });
});

export const updateAdminOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.body;

  const admin = await prisma.user.findUnique({
    where: { id },
  });

  if (!admin) {
    return sendError(res, 404, "Admin not found");
  }

  const organizationExists = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organizationExists) {
    return sendError(res, 404, "Organization not found");
  }

  // If previous organization was linked to this admin as primary adminId, remove it
  if (admin.organizationId && admin.organizationId !== organizationId) {
    await prisma.organization.updateMany({
      where: { id: admin.organizationId, adminId: id },
      data: { adminId: null },
    });
  }

  // Update new organization adminId
  await prisma.organization.update({
    where: { id: organizationId },
    data: { adminId: id },
  });

  const updatedAdmin = await prisma.user.update({
    where: { id },
    data: { organizationId },
    include: { organization: true },
  });

  getIo()?.emit('userUpdated', { role: 'admin', id: updatedAdmin.id });

  return sendSuccess(res, 200, "Admin organization updated successfully", {
    admin: {
      id: updatedAdmin.id,
      name: updatedAdmin.fullName,
      email: updatedAdmin.email,
      phone: updatedAdmin.phone,
      organization: updatedAdmin.organization,
      role: updatedAdmin.role,
      isActive: updatedAdmin.isActive,
    },
  });
});

export const toggleAdminStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const admin = await prisma.user.findUnique({ where: { id } });
  if (!admin) {
    return sendError(res, 404, "Admin not found");
  }

  const updatedAdmin = await prisma.user.update({
    where: { id },
    data: { isActive: !admin.isActive },
    include: { organization: true },
  });

  getIo()?.emit('userUpdated', { role: 'admin', id: updatedAdmin.id });

  const message = updatedAdmin.isActive
    ? "Admin activated successfully"
    : "Admin deactivated successfully";

  return sendSuccess(res, 200, message, {
    admin: {
      id: updatedAdmin.id,
      name: updatedAdmin.fullName,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      isActive: updatedAdmin.isActive,
      organization: updatedAdmin.organization,
    },
  });
});

export const bulkToggleAdminStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Please provide an array of Admin IDs");
  }

  if (typeof isActive !== "boolean") {
    return sendError(res, 400, "Please provide isActive boolean status");
  }

  await prisma.user.updateMany({
    where: { id: { in: ids }, role: "ADMIN" },
    data: { isActive },
  });

  getIo()?.emit('userUpdated', { role: 'admin', bulk: true });

  return sendSuccess(res, 200, "Bulk admin status updated successfully");
});

export const updateUserEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { oldEmail, newEmail, password } = req.body;

  if (!password) {
    return sendError(res, 400, "Password is required to change email");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!currentUser) {
    return sendError(res, 404, "Logged in user not found");
  }

  const { comparePassword } = await import("../../utils/hash.js");
  const isMatch = await comparePassword(password, currentUser.passwordHash);
  if (!isMatch) {
    return sendError(res, 401, "Invalid password");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  if (user.email !== oldEmail) {
    return sendError(res, 400, "Old email does not match");
  }

  const existingNewEmail = await prisma.user.findUnique({
    where: { email: newEmail },
  });
  if (existingNewEmail && existingNewEmail.id !== id) {
    return sendError(res, 400, "New email already in use");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { email: newEmail },
    include: { organization: true },
  });

  getIo()?.emit('userUpdated', { role: 'admin', id: updatedUser.id });

  return sendSuccess(res, 200, "User email updated successfully", {
    user: {
      id: updatedUser.id,
      name: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      organization: updatedUser.organization,
    },
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

  // Cleanup OTP record once warden is created
  await deleteOtpDb(email);

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
