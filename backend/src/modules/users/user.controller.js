import mongoose from "mongoose";
import { getOrganizationByIdDb, updateOrganizationDb } from "../organizations/organization.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { hashPassword } from "../../utils/hash.js";
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
    const { name, email, password, organizationId } = req.body;

    const existingUser = await findExistingUserByEmail(email);

    if (existingUser) {
        return sendError(res, 400, "Email already exists");
    }

    const organizationExists = await getOrganizationByIdDb(organizationId);
    if (!organizationExists) {
        return sendError(res, 404, "Organization not found");
    }

    const hashedPassword = await hashPassword(password);

    const admin = await createUserDb({
        name,
        email,
        password: hashedPassword,
        organization: organizationId,
    }, "admin");

    await updateOrganizationDb(organizationId, { adminId: admin._id });

    return sendSuccess(res, 201, "Admin created successfully", { data: admin });
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
    const { name, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Admin ID");
    }

    if (email) {
      const existingEmail = await findExistingUserByEmail(email);
      if (existingEmail && existingEmail._id.toString() !== id) {
        return sendError(res, 400, "Email already exists");
      }
    }

    const admin = await updateUserByRoleDb(id, "admin", { name, email });

    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    return sendSuccess(res, 200, "Admin updated successfully", {
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
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
    const { name, email, password, organizationId, hostelId } = req.body;

    const existingUser = await findExistingUserByEmail(email);

    if (existingUser) {
        return sendError(res, 400, "Email already exists");
    }

    const organizationExists = await getOrganizationByIdDb(organizationId);
    if (!organizationExists) {
        return sendError(res, 404, "Organization not found");
    }

    const hostelExists = await getHostelByIdDb(hostelId, organizationId);
    if (!hostelExists) {
        return sendError(res, 404, "Hostel not found in this organization");
    }

    if (hostelExists.wardenId) {
        return sendError(res, 400, "Hostel already has a warden assigned");
    }

    const hashedPassword = await hashPassword(password);

    const warden = await createUserDb({
        name,
        email,
        password: hashedPassword,
        organization: organizationId,
    }, "warden");

    await updateHostelDb(hostelId, organizationId, { wardenId: warden._id });

    return sendSuccess(res, 201, "Warden created and assigned to hostel successfully", { data: warden });
});

const getWardens = asyncHandler(async (req, res) => {
    const wardens = await getAllUsersByRoleDb("warden");
    return sendSuccess(res, 200, "Wardens fetched successfully", { count: wardens.length, data: wardens });
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
    const { name, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Warden ID");
    }

    if (email) {
      const existingEmail = await findExistingUserByEmail(email);
      if (existingEmail && existingEmail._id.toString() !== id) {
        return sendError(res, 400, "Email already exists");
      }
    }

    const warden = await updateUserByRoleDb(id, "warden", { name, email });

    if (!warden) {
      return sendError(res, 404, "Warden not found");
    }

    return sendSuccess(res, 200, "Warden updated successfully", {
      data: {
        _id: warden._id,
        name: warden.name,
        email: warden.email,
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
  toggleAdminStatus,
  createWarden,
  getWardens,
  getWardenById,
  updateWarden,
  toggleWardenStatus
}