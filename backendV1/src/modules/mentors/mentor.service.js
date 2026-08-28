import { prisma } from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import { sendMail } from "../../utils/mailer.js";
import { createLogDb } from "../logs/log.service.js";
import { getOrCreateOtp, saveOtpDb } from "../otp/otp.service.js";
import { ROLES } from "../../constants/roles.js";
import { MENTOR_ASSIGNMENT_STATUS } from "../../constants/status.js";
import crypto from "crypto";

const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString("hex");
};

/**
 * Creates a new Mentor user inside a Prisma Transaction
 */
export const createMentorDb = async (mentorData, creatorUser) => {
  const { name, email, phone } = mentorData;

  // 1. Check existing email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error = new Error("Email already exists");
    error.statusCode = 400;
    throw error;
  }

  // 2. Determine organization
  let organizationId = mentorData.organizationId || creatorUser.organizationId || creatorUser.organization;
  if (!organizationId && creatorUser.role === ROLES.ADMIN) {
    organizationId = creatorUser.organizationId || creatorUser.organization;
  }

  if (!organizationId && creatorUser.role !== ROLES.SUPER_ADMIN) {
    const error = new Error("Organization selection is required");
    error.statusCode = 400;
    throw error;
  }

  // 3. Password generation & hash
  const temporaryPassword = generateRandomPassword();
  const hashedPassword = await hashPassword(temporaryPassword);

  // 4. Create User document within transaction
  const mentor = await prisma.$transaction(async (tx) => {
    const newMentor = await tx.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: ROLES.MENTOR,
        organizationId: organizationId || null,
        tempPassword: true,
        isActive: true,
      },
    });

    // 5. Create Activity / Audit Log within transaction
    if (creatorUser) {
      await createLogDb(
        {
          action: "Created Mentor",
          entityType: "User",
          entityId: newMentor.id,
          user: creatorUser.id,
          userRole: creatorUser.role,
          details: `Created new mentor account for ${newMentor.name} (${newMentor.email})`,
          status: "success",
        },
        tx
      );
    }

    return newMentor;
  });

  // Side-effects outside transaction (Email & Socket)
  const subject = "Your Mentor Account Details";
  const text = `Hello ${name}\n\nYour mentor account has been created. Your temporary password is: ${temporaryPassword}\n\nPlease log in and update your password.`;
  const html = `<p>Hello <strong>${name}</strong>,</p><p>Your mentor account has been created.</p><p>Your temporary password is: <strong>${temporaryPassword}</strong></p><p>Please log in and change your password immediately.</p>`;

  try {
    await sendMail(email, subject, text, html);
  } catch (err) {
    console.error("Failed to send welcome email to mentor:", err);
  }

  const mentorObj = { ...mentor };
  delete mentorObj.password;
  delete mentorObj.failedLoginAttempts;
  delete mentorObj.lockUntil;

  return { mentor: mentorObj };
};

/**
 * Get Paginated Mentors (Read-only operation)
 */
export const getPaginatedMentorsDb = async ({
  page = 1,
  limit = 10,
  status,
  search,
  organizationId,
  startDate,
  endDate,
  requesterUser,
}) => {
  const skip = (page - 1) * limit;
  const where = { role: ROLES.MENTOR };

  if (requesterUser.role === ROLES.ADMIN) {
    where.organizationId = requesterUser.organizationId || requesterUser.organization;
  } else if (organizationId) {
    where.organizationId = organizationId;
  }

  if (status !== undefined && status !== "All" && status !== "") {
    if (status === "true" || status === true) {
      where.isActive = true;
    } else if (status === "false" || status === false) {
      where.isActive = false;
    }
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
    if (endDate) where.createdAt.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const [mentors, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    mentors,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
  };
};

export const getMentorByIdDb = async (mentorId, requesterUser) => {
  const where = { id: mentorId, role: ROLES.MENTOR };

  if (requesterUser.role === ROLES.ADMIN) {
    where.organizationId = requesterUser.organizationId || requesterUser.organization;
  }

  const mentor = await prisma.user.findFirst({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
      organization: {
        select: {
          id: true,
          name: true,
          code: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!mentor) {
    const error = new Error("Mentor not found");
    error.statusCode = 404;
    throw error;
  }

  const activeAssignments = await prisma.mentorAssignment.findMany({
    where: { mentorId: mentor.id, status: MENTOR_ASSIGNMENT_STATUS.ACTIVE },
    include: {
      batch: { select: { id: true, name: true, code: true } },
      organization: { select: { id: true, name: true, code: true } },
      assignedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { assignedAt: "desc" },
  });

  const historyAssignments = await prisma.mentorAssignment.findMany({
    where: { mentorId: mentor.id, status: { not: MENTOR_ASSIGNMENT_STATUS.ACTIVE } },
    include: {
      batch: { select: { id: true, name: true, code: true } },
      organization: { select: { id: true, name: true, code: true } },
      assignedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { assignedAt: "desc" },
  });

  mentor.activeAssignments = activeAssignments;
  mentor.historyAssignments = historyAssignments;

  return mentor;
};

/**
 * Updates Mentor details inside a Prisma Transaction
 */
export const updateMentorDb = async (mentorId, updateData, requesterUser) => {
  const where = { id: mentorId, role: ROLES.MENTOR };
  if (requesterUser.role === ROLES.ADMIN) {
    where.organizationId = requesterUser.organizationId || requesterUser.organization;
  }

  // 1. Find Mentor
  const mentor = await prisma.user.findFirst({ where });
  if (!mentor) {
    const error = new Error("Mentor not found");
    error.statusCode = 404;
    throw error;
  }

  let otpRequired = false;
  let targetEmailForOtp = null;

  // Handle Email Update with OTP
  if (updateData.email && updateData.email !== mentor.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: updateData.email,
        id: { not: mentorId },
      },
    });

    if (existingUser) {
      const error = new Error("Email address already in use");
      error.statusCode = 400;
      throw error;
    }

    otpRequired = true;
    targetEmailForOtp = updateData.email;
    delete updateData.email;
  }

  const updatePayload = {};
  if (updateData.name !== undefined) updatePayload.name = updateData.name;
  if (updateData.phone !== undefined) updatePayload.phone = updateData.phone;
  if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;
  // Ignore specialization as it doesn't exist in Prisma User schema

  const updatedMentor = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: mentor.id },
      data: updatePayload,
    });

    if (requesterUser) {
      await createLogDb(
        {
          action: "Updated Mentor",
          entityType: "User",
          entityId: updated.id,
          user: requesterUser.id,
          userRole: requesterUser.role,
          details: `Updated mentor details for ${updated.name}`,
          status: "success",
        },
        tx
      );
    }

    return updated;
  });

  // Handle OTP Generation & Email dispatch outside transaction
  if (otpRequired && targetEmailForOtp) {
    const { otpCode } = await getOrCreateOtp(targetEmailForOtp);
    await saveOtpDb(targetEmailForOtp, otpCode);

    const subject = "Email Update Verification Code";
    const text = `Your OTP code to verify your new email (${targetEmailForOtp}) is: ${otpCode}`;
    const html = `<p>Your OTP code to verify your new email (<strong>${targetEmailForOtp}</strong>) is: <strong>${otpCode}</strong></p>`;

    try {
      await sendMail(targetEmailForOtp, subject, text, html);
    } catch (err) {
      console.error("Failed to send OTP email:", err);
    }
  }

  const sanitized = { ...updatedMentor };
  delete sanitized.password;
  delete sanitized.failedLoginAttempts;
  delete sanitized.lockUntil;

  return {
    mentor: sanitized,
    otpRequired,
    message: otpRequired
      ? "Mentor updated successfully. Verification OTP sent to the new email address."
      : "Mentor updated successfully",
  };
};

/**
 * Updates Mentor status inside a Prisma Transaction
 */
export const updateMentorStatusDb = async (mentorId, isActive, requesterUser) => {
  const where = { id: mentorId, role: ROLES.MENTOR };
  if (requesterUser.role === ROLES.ADMIN) {
    where.organizationId = requesterUser.organizationId || requesterUser.organization;
  }

  const mentor = await prisma.user.findFirst({ where });
  if (!mentor) {
    const error = new Error("Mentor not found");
    error.statusCode = 404;
    throw error;
  }

  if (mentor.isActive === isActive) {
    const error = new Error(
      `Mentor is already ${isActive ? "active" : "inactive"}`
    );
    error.statusCode = 400;
    throw error;
  }

  if (!isActive) {
    const activeAssignments = await prisma.mentorAssignment.findMany({
      where: {
        mentorId: mentor.id,
        status: MENTOR_ASSIGNMENT_STATUS.ACTIVE,
      },
      include: {
        batch: { select: { name: true } },
      },
    });

    if (activeAssignments.length > 0) {
      const batchNames = activeAssignments
        .map((a) => a.batch?.name || "Unknown Batch")
        .join(", ");
      const error = new Error(
        `Cannot deactivate mentor. This mentor is currently assigned to batch(es): ${batchNames}. Please transfer or end their active assignments first.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const updatedMentor = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: mentor.id },
      data: { isActive },
    });

    if (requesterUser) {
      await createLogDb(
        {
          action: isActive ? "Activated Mentor" : "Deactivated Mentor",
          entityType: "User",
          entityId: mentor.id,
          user: requesterUser.id,
          userRole: requesterUser.role,
          details: `${isActive ? "Activated" : "Deactivated"} mentor ${mentor.name}`,
          status: "success",
        },
        tx
      );
    }

    return updated;
  });

  const sanitized = { ...updatedMentor };
  delete sanitized.password;
  delete sanitized.failedLoginAttempts;
  delete sanitized.lockUntil;

  return sanitized;
};

/**
 * Soft deletes a Mentor inside a Prisma Transaction
 */
export const deleteMentorDb = async (mentorId, requesterUser) => {
  const currentUserId = requesterUser.id;
  if (currentUserId === mentorId) {
    const error = new Error("Mentors/Users cannot delete themselves");
    error.statusCode = 400;
    throw error;
  }

  const where = { id: mentorId, role: ROLES.MENTOR };
  if (requesterUser.role === ROLES.ADMIN) {
    where.organizationId = requesterUser.organizationId || requesterUser.organization;
  }

  const mentor = await prisma.user.findFirst({ where });
  if (!mentor) {
    const error = new Error("Mentor not found");
    error.statusCode = 404;
    throw error;
  }

  // Business Rule Check: Count active batch assignments
  const activeAssignmentsCount = await prisma.mentorAssignment.count({
    where: {
      mentorId,
      status: MENTOR_ASSIGNMENT_STATUS.ACTIVE,
    },
  });

  if (activeAssignmentsCount > 0) {
    const error = new Error(
      `Cannot delete mentor with ${activeAssignmentsCount} active batch assignment(s). Reassign or deactivate batches first.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Soft delete
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: mentor.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    if (requesterUser) {
      await createLogDb(
        {
          action: "Soft Deleted Mentor",
          entityType: "User",
          entityId: mentor.id,
          user: requesterUser.id,
          userRole: requesterUser.role,
          details: `Soft deleted mentor ${mentor.name}`,
          status: "success",
        },
        tx
      );
    }
  });

  return { message: "Mentor soft deleted successfully" };
};

/**
 * Gets organizations that have at least one mentor
 */
export const getOrganizationsWithMentorsDb = async ({ page = 1, limit = 10, search }) => {
  const skip = (page - 1) * limit;

  const where = {
    users: {
      some: { role: ROLES.MENTOR },
    },
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const [organizations, totalCount] = await Promise.all([
    prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        _count: {
          select: { users: { where: { role: ROLES.MENTOR } } },
        },
      },
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.organization.count({ where }),
  ]);

  const formattedData = organizations.map((org) => ({
    _id: org.id,
    name: org.name,
    code: org.code,
    email: org.email,
    mentorCount: org._count.users,
  }));

  return {
    data: formattedData,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
  };
};
