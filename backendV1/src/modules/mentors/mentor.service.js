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
