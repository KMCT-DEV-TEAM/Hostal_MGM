import { prisma } from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import { sendMail } from "../../utils/mailer.js";
import { createLogDb } from "../logs/log.service.js";
import { ROLES } from "../../constants/roles.js";
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
        role: "MENTOR",
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
  const where = { role: "MENTOR" };

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
  const where = { id: mentorId, role: "MENTOR" };

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
    where: { mentorId: mentor.id, status: "ACTIVE" },
    include: {
      batch: { select: { id: true, name: true, code: true } },
      organization: { select: { id: true, name: true, code: true } },
      assignedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { assignedAt: "desc" },
  });

  const historyAssignments = await prisma.mentorAssignment.findMany({
    where: { mentorId: mentor.id, status: { not: "ACTIVE" } },
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
