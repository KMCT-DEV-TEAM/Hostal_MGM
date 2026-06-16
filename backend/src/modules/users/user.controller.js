import mongoose from "mongoose";
import { getOrganizationByIdDb, updateOrganizationDb } from "../organizations/organization.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { hashPassword } from "../../utils/hash.js";
import { sendMail } from "../../utils/mailer.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  findExistingUserByEmail,
  createUserDb,
  getAllUsersByRoleDb,
  getUserByIdAndRoleDb,
  updateUserByRoleDb,
  toggleUserActiveStatusByRoleDb
} from "./user.service.js";
import { getHostelByIdDb, updateHostelDb } from "../hostels/hostel.service.js";

// --- ADMIN CONTROLLERS ---

const createAdmin = asyncHandler(async (req, res) => {
    const { name, email, organizationId } = req.body;

    const existingUser = await findExistingUserByEmail(email);

    if (existingUser) {
        return sendError(res, 400, "Email already exists");
    }

    const organizationExists = await getOrganizationByIdDb(organizationId);
    if (!organizationExists) {
        return sendError(res, 404, "Organization not found");
    }

    const temporaryPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(temporaryPassword);

    const admin = await createUserDb({
        name,
        email,
        password: hashedPassword,
        organization: organizationId,
        temppass: true,
    }, "admin");

    await updateOrganizationDb(organizationId, { adminId: admin._id });

    const subject = "Your Admin Account Details";
    const text = `Hello ${name}\n\nYour admin account has been created. Your temporary password is: ${temporaryPassword}\n\nPlease log in and change your password immediately.`;
    const html = `<p>Hello ${name},</p><p>Your admin account has been created.</p><p>Your temporary password is: <strong>${temporaryPassword}</strong></p><p>Please log in and change your password immediately.</p>`;

    try {
        await sendMail(email, subject, text, html);
    } catch (error) {
        console.error("Failed to send temporary password email:", error);
    }

    return sendSuccess(res, 201, "Admin created successfully and email sent");
});

const getAdmins = asyncHandler(async (req, res) => {
    const admins = await getAllUsersByRoleDb("admin");
    return sendSuccess(res, 200, "Admins fetched successfully", { count: admins.length, data: admins });
});

const getAdminById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Admin ID");
    }

    const admin = await getUserByIdAndRoleDb(id, "admin");

    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    return sendSuccess(res, 200, "Admin fetched successfully", { data: admin });
});

const updateAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Admin ID");
    }

    const admin = await updateUserByRoleDb(id, "admin", { name, phone });

    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    return sendSuccess(res, 200, "Admin updated successfully", {
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        isActive: admin.isActive,
      }
    });
});

const updateAdminEmail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { oldEmail, newEmail } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Admin ID");
    }

    const admin = await getUserByIdAndRoleDb(id, "admin");

    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    if (admin.email !== oldEmail) {
      return sendError(res, 400, "Old email does not match");
    }

    const existingNewEmail = await findExistingUserByEmail(newEmail);
    if (existingNewEmail && existingNewEmail._id.toString() !== id) {
      return sendError(res, 400, "New email already in use");
    }

    const updatedAdmin = await updateUserByRoleDb(id, "admin", { email: newEmail });

    return sendSuccess(res, 200, "Admin email updated successfully", {
      data: {
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone,
        role: updatedAdmin.role,
        isActive: updatedAdmin.isActive,
      }
    });
});

const updateAdminOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { organizationId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Admin ID");
    }

    const admin = await getUserByIdAndRoleDb(id, "admin");

    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    const organizationExists = await getOrganizationByIdDb(organizationId);
    if (!organizationExists) {
        return sendError(res, 404, "Organization not found");
    }

    const oldOrganizationId = admin.organization;

    if (oldOrganizationId && oldOrganizationId.toString() !== organizationId) {
      await updateOrganizationDb(oldOrganizationId, { adminId: null });
    }

    await updateOrganizationDb(organizationId, { adminId: admin._id });

    const updatedAdmin = await updateUserByRoleDb(id, "admin", { organization: organizationId });

    return sendSuccess(res, 200, "Admin organization updated successfully", {
      data: {
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone,
        organization: updatedAdmin.organization,
        role: updatedAdmin.role,
        isActive: updatedAdmin.isActive,
      }
    });
});


const toggleAdminStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Admin ID");
    }

    const admin = await toggleUserActiveStatusByRoleDb(id, "admin");

    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    const message = admin.isActive 
      ? "Admin activated successfully" 
      : "Admin deactivated successfully";

    return sendSuccess(res, 200, message, {
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      }
    });
});

// --- WARDEN CONTROLLERS ---

const createWarden = asyncHandler(async (req, res) => {
    const { name, email, phone, hostelId } = req.body;

    const existingUser = await findExistingUserByEmail(email);

    if (existingUser) {
        return sendError(res, 400, "Email already exists");
    }

    const hostelExists = await getHostelByIdDb(hostelId);
    if (!hostelExists) {
        return sendError(res, 404, "Hostel not found");
    }

    

    const temporaryPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(temporaryPassword);

    const warden = await createUserDb({
        name,
        email,
        phone,
        password: hashedPassword,
        temppass: true,
    }, "warden");

    await updateHostelDb(hostelId, null, { $push: { wardens: warden._id } });

    const subject = "Your Warden Account Details";
    const text = `Hello ${name}\n\nYour warden account has been created. Your temporary password is: ${temporaryPassword}\n\nPlease log in and change your password immediately.`;
    const html = `<p>Hello ${name},</p><p>Your warden account has been created.</p><p>Your temporary password is: <strong>${temporaryPassword}</strong></p><p>Please log in and change your password immediately.</p>`;

    try {
        await sendMail(email, subject, text, html);
    } catch (error) {
        console.error("Failed to send temporary password email:", error);
    }

    return sendSuccess(res, 201, "Warden created and assigned to hostel successfully", { data: warden });
});

const getWardens = asyncHandler(async (req, res) => {
    const wardens = await getAllUsersByRoleDb("warden");
    return sendSuccess(res, 200, "Wardens fetched successfully", { count: wardens.length , data: wardens});
});

const getWardenById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Warden ID");
    }

    const warden = await getUserByIdAndRoleDb(id, "warden");

    if (!warden) {
      return sendError(res, 404, "Warden not found");
    }

    return sendSuccess(res, 200, "Warden fetched successfully", { data: warden });
});

const updateWarden = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Warden ID");
    }

    const warden = await updateUserByRoleDb(id, "warden", { name, phone });

    if (!warden) {
      return sendError(res, 404, "Warden not found");
    }

    return sendSuccess(res, 200, "Warden updated successfully", {
      data: {
        _id: warden._id,
        name: warden.name,
        email: warden.email,
        phone: warden.phone,
        role: warden.role,
        isActive: warden.isActive,
      }
    });
});

const toggleWardenStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Warden ID");
    }

    const warden = await toggleUserActiveStatusByRoleDb(id, "warden");

    if (!warden) {
      return sendError(res, 404, "Warden not found");
    }

    const message = warden.isActive 
      ? "Warden activated successfully" 
      : "Warden deactivated successfully";

    return sendSuccess(res, 200, message, {
      data: {
        _id: warden._id,
        name: warden.name,
        email: warden.email,
        role: warden.role,
        isActive: warden.isActive,
      }
    });
});

export {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  updateAdminEmail,
  updateAdminOrganization,
  toggleAdminStatus,
  createWarden,
  getWardens,
  getWardenById,
  updateWarden,
  toggleWardenStatus
}