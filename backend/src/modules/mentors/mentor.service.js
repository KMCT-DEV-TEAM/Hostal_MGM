import User from "../users/user.model.js";
import MentorAssignment from "./mentorAssignment.model.js";
import { hashPassword } from "../../utils/hash.js";
import { sendMail } from "../../utils/mailer.js";
import { createLogDb } from "../logs/log.service.js";
import { getOrCreateOtp, saveOtpDb } from "../otp/otp.service.js";
import mongoose from "mongoose";
import crypto from "crypto";

const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString("hex");
};

/**
 * Creates a new Mentor user inside a MongoDB Transaction
 */
export const createMentorDb = async (mentorData, creatorUser) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, phone, specialization } = mentorData;

    // 1. Check existing email
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      const error = new Error("Email already exists");
      error.statusCode = 400;
      throw error;
    }

    // 2. Determine organization
    let organizationId = mentorData.organizationId || creatorUser.organization;
    if (!organizationId && creatorUser.role === "admin") {
      organizationId = creatorUser.organization;
    }

    if (!organizationId && creatorUser.role !== "super_admin") {
      const error = new Error("Organization selection is required");
      error.statusCode = 400;
      throw error;
    }

    // 3. Password generation & hash
    const temporaryPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // 4. Create User document within session
    const [mentor] = await User.create(
      [
        {
          name,
          email,
          phone,
          specialization,
          password: hashedPassword,
          role: "mentor",
          organization: organizationId || null,
          temppass: true,
          isActive: true,
        },
      ],
      { session }
    );

    // 5. Create Activity / Audit Log within session
    if (creatorUser) {
      await createLogDb(
        {
          action: "Created Mentor",
          entityType: "User",
          entityId: mentor._id,
          user: creatorUser.id || creatorUser._id,
          userRole: creatorUser.role,
          details: `Created new mentor account for ${mentor.name} (${mentor.email})`,
          status: "success",
        },
        session
      );
    }

    // Commit Transaction
    await session.commitTransaction();

    // Side-effects outside transaction (Email & Socket)
    const subject = "Your Mentor Account Details";
    const text = `Hello ${name}\n\nYour mentor account has been created. Your temporary password is: ${temporaryPassword}\n\nPlease log in and update your password.`;
    const html = `<p>Hello <strong>${name}</strong>,</p><p>Your mentor account has been created.</p><p>Your temporary password is: <strong>${temporaryPassword}</strong></p><p>Please log in and change your password immediately.</p>`;

    try {
      await sendMail(email, subject, text, html);
    } catch (err) {
      console.error("Failed to send welcome email to mentor:", err);
    }


    const mentorObj = mentor.toObject();
    delete mentorObj.password;
    delete mentorObj.failedLoginAttempts;
    delete mentorObj.lockUntil;

    return { mentor: mentorObj };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get Paginated Mentors (Read-only operation - No transaction required)
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
  const query = { role: "mentor" };

  if (requesterUser.role === " ") {
    query.organization = requesterUser.organization;
  } else if (organizationId) {
    query.organization = organizationId;
  }

  if (status !== undefined && status !== "All" && status !== "") {
    if (status === "Active" || status === "true" || status === true) {
      query.isActive = true;
    } else if (status === "Inactive" || status === "false" || status === false) {
      query.isActive = false;
    }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { specialization: { $regex: search, $options: "i" } },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
    if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const [mentors, totalCount] = await Promise.all([
    User.find(query, {
      name: 1,
      email: 1,
      phone: 1,
      role: 1,
      isActive: 1,
      specialization: 1,
      organization: 1,
      createdAt: 1,
      updatedAt: 1,
    })
      .populate("organization", "name code email phone")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    mentors,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
  };
};

/**
 * Get Mentor By ID (Read-only operation - No transaction required)
 */
export const getMentorByIdDb = async (mentorId, requesterUser) => {
  const query = { _id: mentorId, role: "mentor" };

  if (requesterUser.role === "admin") {
    query.organization = requesterUser.organization;
  }

  const mentor = await User.findOne(query)
    .select("-password -failedLoginAttempts -lockUntil")
    .populate("organization", "name code email phone")
    .lean();

  if (!mentor) {
    const error = new Error("Mentor not found");
    error.statusCode = 404;
    throw error;
  }

  return mentor;
};

/**
 * Updates Mentor details inside a MongoDB Transaction
 */
export const updateMentorDb = async (mentorId, updateData, requesterUser) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const query = { _id: mentorId, role: "mentor" };
    if (requesterUser.role === "admin") {
      query.organization = requesterUser.organization;
    }

    const mentor = await User.findOne(query).session(session);
    if (!mentor) {
      const error = new Error("Mentor not found");
      error.statusCode = 404;
      throw error;
    }

    let otpRequired = false;
    let targetEmailForOtp = null;

    // Handle Email Update with OTP
    if (updateData.email && updateData.email !== mentor.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: mentorId },
      }).session(session);

      if (existingUser) {
        const error = new Error("Email address already in use");
        error.statusCode = 400;
        throw error;
      }

      otpRequired = true;
      targetEmailForOtp = updateData.email;
      delete updateData.email;
    }

    if (updateData.name !== undefined) mentor.name = updateData.name;
    if (updateData.phone !== undefined) mentor.phone = updateData.phone;
    if (updateData.specialization !== undefined) mentor.specialization = updateData.specialization;
    if (updateData.isActive !== undefined) mentor.isActive = updateData.isActive;

    await mentor.save({ session });

    if (requesterUser) {
      await createLogDb(
        {
          action: "Updated Mentor",
          entityType: "User",
          entityId: mentor._id,
          user: requesterUser.id || requesterUser._id,
          userRole: requesterUser.role,
          details: `Updated mentor details for ${mentor.name}`,
          status: "success",
        },
        session
      );
    }

    await session.commitTransaction();

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


    const sanitized = mentor.toObject();
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
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Updates Mentor status inside a MongoDB Transaction
 */
export const updateMentorStatusDb = async (mentorId, isActive, requesterUser) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const query = { _id: mentorId, role: "mentor" };
    if (requesterUser.role === "admin") {
      query.organization = requesterUser.organization;
    }

    const mentor = await User.findOne(query).session(session);
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

    mentor.isActive = isActive;
    await mentor.save({ session });

    if (requesterUser) {
      await createLogDb(
        {
          action: isActive ? "Activated Mentor" : "Deactivated Mentor",
          entityType: "User",
          entityId: mentor._id,
          user: requesterUser.id || requesterUser._id,
          userRole: requesterUser.role,
          details: `${isActive ? "Activated" : "Deactivated"} mentor ${mentor.name}`,
          status: "success",
        },
        session
      );
    }

    await session.commitTransaction();



    const sanitized = mentor.toObject();
    delete sanitized.password;
    delete sanitized.failedLoginAttempts;
    delete sanitized.lockUntil;

    return sanitized;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Soft deletes a Mentor inside a MongoDB Transaction
 */
export const deleteMentorDb = async (mentorId, requesterUser) => {
  const currentUserId = requesterUser.id || requesterUser._id;
  if (currentUserId.toString() === mentorId.toString()) {
    const error = new Error("Mentors/Users cannot delete themselves");
    error.statusCode = 400;
    throw error;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const query = { _id: mentorId, role: "mentor" };
    if (requesterUser.role === "admin") {
      query.organization = requesterUser.organization;
    }

    const mentor = await User.findOne(query).session(session);
    if (!mentor) {
      const error = new Error("Mentor not found");
      error.statusCode = 404;
      throw error;
    }

    // Business Rule Check: Count active batch assignments
    const activeAssignmentsCount = await MentorAssignment.countDocuments({
      mentorId,
      status: "ACTIVE",
    }).session(session);

    if (activeAssignmentsCount > 0) {
      const error = new Error(
        `Cannot delete mentor with ${activeAssignmentsCount} active batch assignment(s). Reassign or deactivate batches first.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Soft delete
    mentor.isActive = false;
    await mentor.save({ session });

    if (requesterUser) {
      await createLogDb(
        {
          action: "Soft Deleted Mentor",
          entityType: "User",
          entityId: mentor._id,
          user: requesterUser.id || requesterUser._id,
          userRole: requesterUser.role,
          details: `Soft deleted mentor ${mentor.name}`,
          status: "success",
        },
        session
      );
    }

    await session.commitTransaction();


    return { message: "Mentor soft deleted successfully" };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
