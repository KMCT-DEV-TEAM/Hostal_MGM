import mongoose from "mongoose";
import { getOrganizationByIdDb, updateOrganizationDb } from "../organizations/organization.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import { sendMail } from "../../utils/mailer.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  findExistingUserByEmail,
  createUserDb,
  getAllUsersByRoleDb,
  getPaginatedUsersByRoleDb,
  getUserByIdAndRoleDb,
  getUserByIdDb,
  getUserWithPasswordByIdDb,
  updateUserByRoleDb,
  updateUserDb,
  toggleUserActiveStatusByRoleDb,
  bulkToggleUserStatusByRoleDb
} from "./user.service.js";
import { getHostelByIdDb, updateHostelDb } from "../hostels/hostel.service.js";
import Hostel from "../hostels/hostel.model.js";
import { createLogDb } from "../logs/log.service.js";
import Complaint from "../complaints/complaint.model.js";
import { getIo } from "../../config/socket.js";

// --- ADMIN CONTROLLERS ---

const createAdmin = asyncHandler(async (req, res) => {
    const { name, email, phone, organizationId } = req.body;

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
        phone,
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

    if (req.user) {
        await createLogDb({
            action: "Created Admin",
            entityType: "User",
            entityId: admin._id,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Created new admin account for ${admin.name} (${admin.email})`,
            status: "success"
        });
    }

    getIo()?.emit('userCreated', { role: 'admin', data: admin });

    return sendSuccess(res, 201, "Admin created successfully and email sent", admin);
});

const getAdmins = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;
    
    const { users, totalCount } = await getPaginatedUsersByRoleDb("admin", page, limit, status, search);

    return sendSuccess(res, 200, "Admins fetched successfully", { 
      count: users.length, 
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      data: users 
    });
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

    if (req.user) {
        await createLogDb({
            action: "Updated Admin",
            entityType: "User",
            entityId: admin._id,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Updated details for admin ${admin.name}`,
            status: "success"
        });
    }

    getIo()?.emit('userUpdated', { role: 'admin', id: admin._id });

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

const updateUserEmail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { oldEmail, newEmail, password } = req.body;

    if (!password) {
      return sendError(res, 400, "Password is required to change email");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid User ID");
    }

    const currentUser = await getUserWithPasswordByIdDb(req.user.id || req.user._id);
    if (!currentUser) {
      return sendError(res, 404, "Logged in user not found");
    }

    const isMatch = await comparePassword(password, currentUser.password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid password");
    }

    const user = await getUserByIdDb(id);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (user.email !== oldEmail) {
      return sendError(res, 400, "Old email does not match");
    }

    const existingNewEmail = await findExistingUserByEmail(newEmail);
    if (existingNewEmail && existingNewEmail._id.toString() !== id) {
      return sendError(res, 400, "New email already in use");
    }

    const updatedUser = await updateUserDb(id, { email: newEmail });

    getIo()?.emit('userUpdated', { role: updatedUser.role, id: updatedUser._id });

    return sendSuccess(res, 200, "User email updated successfully", {
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
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

    if (req.user) {
        await createLogDb({
            action: "Updated Admin Organization",
            entityType: "User",
            entityId: updatedAdmin._id,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Updated organization for admin ${updatedAdmin.name}`,
            status: "success"
        });
    }

    getIo()?.emit('userUpdated', { role: 'admin', id: updatedAdmin._id });

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

    if (req.user) {
        await createLogDb({
            action: admin.isActive ? "Activated Admin" : "Deactivated Admin",
            entityType: "User",
            entityId: admin._id,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Changed status of admin ${admin.name} to ${admin.isActive ? 'Active' : 'Inactive'}`,
            status: "success"
        });
    }

    getIo()?.emit('userUpdated', { role: 'admin', id: admin._id });

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

const bulkToggleAdminStatus = asyncHandler(async (req, res) => {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 400, "Please provide an array of Admin IDs");
    }

    if (typeof isActive !== 'boolean') {
      return sendError(res, 400, "Please provide isActive boolean status");
    }

    await bulkToggleUserStatusByRoleDb(ids, "admin", isActive);

    if (req.user) {
        await createLogDb({
            action: "Bulk Updated Admin Status",
            entityType: "User",
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Bulk updated ${ids.length} admins to ${isActive ? 'Active' : 'Inactive'}`,
            status: "success"
        });
    }

    getIo()?.emit('userUpdated', { role: 'admin', bulk: true });

    return sendSuccess(res, 200, "Bulk admin status updated successfully");
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

    if (req.user) {
        await createLogDb({
            action: "Created Warden",
            entityType: "User",
            entityId: warden._id,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Created new warden account for ${warden.name} (${warden.email})`,
            status: "success"
        });
    }

    getIo()?.emit('userCreated', { role: 'warden', data: warden });

    return sendSuccess(res, 201, "Warden created and assigned to hostel successfully", { data: warden });
});

const getWardens = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;
    
    let additionalQuery = {};

    if (req.user.role === 'admin') {
      if (!req.user.organization) {
        return sendError(res, 400, "Admin is not assigned to any organization");
      }
      // Find all hostels under the admin's organization
      const adminHostels = await Hostel.find({ organizations: req.user.organization }).select("wardens");
      const wardenIds = adminHostels.reduce((acc, hostel) => acc.concat(hostel.wardens), []);
      
      // Additional filter to only fetch these wardens
      additionalQuery = { 
          $or: [
              { _id: { $in: wardenIds } },
              { organization: req.user.organization },
              { organization: { $exists: false } },
              { organization: null }
          ]
      };
    }
    
    const { users, totalCount } = await getPaginatedUsersByRoleDb("warden", page, limit, status, search, additionalQuery);

    const wardenIds = users.map(u => u._id);
    const hostels = await Hostel.find({ wardens: { $in: wardenIds } });
    
    const usersWithHostel = users.map(user => {
        const userObj = user.toObject ? user.toObject() : user;
        const hostel = hostels.find(h => h.wardens.some(w => w.toString() === user._id.toString()));
        if (hostel) {
            userObj.hostel = hostel;
        }
        return userObj;
    });

    return sendSuccess(res, 200, "Wardens fetched successfully", { 
      count: users.length, 
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      data: usersWithHostel 
    });
});

const getWardenById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Warden ID");
    }

    let additionalQuery = {};

    if (req.user.role === 'admin') {
      if (!req.user.organization) {
        return sendError(res, 400, "Admin is not assigned to any organization");
      }
      const adminHostels = await Hostel.find({ organizationId: req.user.organization }).select("wardens");
      const wardenIds = adminHostels.reduce((acc, hostel) => acc.concat(hostel.wardens), []);
      additionalQuery = { _id: { $in: wardenIds } };
    }

    const warden = await getUserByIdAndRoleDb(id, "warden", additionalQuery);

    if (!warden) {
      return sendError(res, 404, "Warden not found");
    }

    return sendSuccess(res, 200, "Warden fetched successfully", { data: warden });
});

const updateWarden = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, phone, hostelId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Warden ID");
    }

    const warden = await updateUserByRoleDb(id, "warden", { name, phone });

    if (hostelId) {
        // Remove warden from previous hostels
        await Hostel.updateMany({ wardens: id }, { $pull: { wardens: id } });
        // Add warden to new hostel
        await Hostel.findByIdAndUpdate(hostelId, { $push: { wardens: id } });
    }

    if (!warden) {
      return sendError(res, 404, "Warden not found");
    }

    if (req.user) {
        await createLogDb({
            action: "Updated Warden",
            entityType: "User",
            entityId: warden._id,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Updated details for warden ${warden.name}`,
            status: "success"
        });
    }

    getIo()?.emit('userUpdated', { role: 'warden', id: warden._id });

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

const updateWardenHostel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { hostelId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendError(res, 400, "Invalid Warden ID");
    }

    const hostelExists = await getHostelByIdDb(hostelId);
    if (!hostelExists) {
        return sendError(res, 404, "Hostel not found");
    }

    const warden = await getUserByIdAndRoleDb(id, "warden");

    if (!warden) {
        return sendError(res, 404, "Warden not found");
    }

    // Remove warden from previous hostel
    await Hostel.updateMany({ wardens: id }, { $pull: { wardens: id } });

    // Add warden to new hostel
    await Hostel.findByIdAndUpdate(hostelId, { $push: { wardens: id } });

    if (req.user) {
        await createLogDb({
            action: "Updated Warden Hostel",
            entityType: "User",
            entityId: warden._id,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Reassigned warden ${warden.name} to new hostel`,
            status: "success"
        });
    }

    getIo()?.emit('userUpdated', { role: 'warden', id: warden._id });

    return sendSuccess(res, 200, "Warden hostel updated successfully", {
        data: warden
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

    if (req.user) {
        await createLogDb({
            action: warden.isActive ? "Activated Warden" : "Deactivated Warden",
            entityType: "User",
            entityId: warden._id,
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Changed status of warden ${warden.name} to ${warden.isActive ? 'Active' : 'Inactive'}`,
            status: "success"
        });
    }

    getIo()?.emit('userUpdated', { role: 'warden', id: warden._id });

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

const bulkToggleWardenStatus = asyncHandler(async (req, res) => {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 400, "Please provide an array of Warden IDs");
    }

    if (typeof isActive !== 'boolean') {
      return sendError(res, 400, "Please provide isActive boolean status");
    }

    await bulkToggleUserStatusByRoleDb(ids, "warden", isActive);

    if (req.user) {
        await createLogDb({
            action: "Bulk Updated Warden Status",
            entityType: "User",
            user: req.user.id || req.user._id,
            userRole: req.user.role,
            details: `Bulk updated ${ids.length} wardens to ${isActive ? 'Active' : 'Inactive'}`,
            status: "success"
        });
    }

    getIo()?.emit('userUpdated', { role: 'warden', bulk: true });

    return sendSuccess(res, 200, "Bulk warden status updated successfully");
});

// --- MAINTENANCE STAFF CONTROLLERS ---

const createMaintenanceStaff = asyncHandler(async (req, res) => {
    let { name, email, phone, specialization, assignedTask, organizationId } = req.body;

    if (req.user.role === 'admin' && req.user.organization) {
        organizationId = req.user.organization;
    }

    const existingUser = await findExistingUserByEmail(email);

    if (existingUser) {
        return sendError(res, 400, "Email already exists");
    }

    if (organizationId) {
        const organizationExists = await getOrganizationByIdDb(organizationId);
        if (!organizationExists) {
            return sendError(res, 404, "Organization not found");
        }
    }

    const temporaryPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(temporaryPassword);

    const maintenanceStaff = await createUserDb({
        name,
        email,
        phone,
        specialization,
        assignedTask,
        password: hashedPassword,
        organization: organizationId,
        temppass: true,
    }, "maintenance_staff");

    const subject = "Your Maintenance Staff Account Details";
    const text = `Hello ${name}\n\nYour maintenance staff account has been created. Your temporary password is: ${temporaryPassword}\n\nPlease log in and change your password immediately.`;
    const html = `<p>Hello ${name},</p><p>Your maintenance staff account has been created.</p><p>Your temporary password is: <strong>${temporaryPassword}</strong></p><p>Please log in and change your password immediately.</p>`;

    try {
        await sendMail(email, subject, text, html);
    } catch (error) {
        console.error("Failed to send temporary password email:", error);
    }

    getIo()?.emit('userCreated', { role: 'maintenance_staff', data: maintenanceStaff });

    return sendSuccess(res, 201, "Maintenance Staff created successfully and email sent", { data: maintenanceStaff });
});

const getMaintenanceStaff = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;
    
    let additionalQuery = {};

    if (req.user.role === 'admin') {
      if (!req.user.organization) {
        return sendError(res, 400, `Admin is not assigned to any organization`);
      }
      additionalQuery = { 
          $or: [
              { organization: req.user.organization },
              { organization: { $exists: false } },
              { organization: null }
          ]
      };
    } else if (req.user.role === 'warden') {
      const { default: Hostel } = await import('../hostels/hostel.model.js');
      const hostel = await Hostel.findOne({ wardens: req.user.id });
      if (!hostel || !hostel.organizations || hostel.organizations.length === 0) {
        // Return global maintenance staff if warden has no organization
        additionalQuery = { 
            $or: [
                { organization: { $exists: false } },
                { organization: null }
            ]
        };
      } else {
        additionalQuery = { 
            $or: [
                { organization: { $in: hostel.organizations } },
                { organization: { $exists: false } },
                { organization: null }
            ]
        };
      }
    }
    
    const { users, totalCount } = await getPaginatedUsersByRoleDb("maintenance_staff", page, limit, status, search, additionalQuery);

    const usersWithCounts = await Promise.all(users.map(async (user) => {
        const userObj = user.toObject ? user.toObject() : user;
        userObj.taskAssignedCount = await Complaint.countDocuments({ assignedStaff: user._id });
        userObj.taskResolvedCount = await Complaint.countDocuments({ assignedStaff: user._id, status: 'Resolved' });
        userObj.taskPendingCount = await Complaint.countDocuments({ assignedStaff: user._id, status: { $ne: 'Resolved' } });
        return userObj;
    }));

    return sendSuccess(res, 200, "Maintenance staff fetched successfully", { 
      count: usersWithCounts.length, 
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      data: usersWithCounts 
    });
});

const getMaintenanceStaffById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Maintenance Staff ID");
    }

    let additionalQuery = {};

    if (req.user.role === 'admin') {
      if (!req.user.organization) {
        return sendError(res, 400, "Admin is not assigned to any organization");
      }
      additionalQuery = { organization: req.user.organization };
    }

    const staff = await getUserByIdAndRoleDb(id, "maintenance_staff", additionalQuery);

    if (!staff) {
      return sendError(res, 404, "Maintenance Staff not found");
    }

    const staffObj = staff.toObject ? staff.toObject() : staff;
    staffObj.taskAssignedCount = await Complaint.countDocuments({ assignedStaff: staff._id });
    staffObj.taskResolvedCount = await Complaint.countDocuments({ assignedStaff: staff._id, status: 'Resolved' });
    staffObj.taskPendingCount = await Complaint.countDocuments({ assignedStaff: staff._id, status: { $ne: 'Resolved' } });

    return sendSuccess(res, 200, "Maintenance Staff fetched successfully", { data: staffObj });
});

const updateMaintenanceStaff = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, phone, specialization, assignedTask } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Maintenance Staff ID");
    }

    const staff = await updateUserByRoleDb(id, "maintenance_staff", { name, phone, specialization, assignedTask });

    if (!staff) {
      return sendError(res, 404, "Maintenance Staff not found");
    }

    getIo()?.emit('userUpdated', { role: 'maintenance_staff', id: staff._id });

    return sendSuccess(res, 200, "Maintenance Staff updated successfully", {
      data: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        specialization: staff.specialization,
        assignedTask: staff.assignedTask,
        role: staff.role,
        isActive: staff.isActive,
      }
    });
});

const toggleMaintenanceStaffStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid Maintenance Staff ID");
    }

    const staff = await toggleUserActiveStatusByRoleDb(id, "maintenance_staff");

    if (!staff) {
      return sendError(res, 404, "Maintenance Staff not found");
    }

    const message = staff.isActive 
      ? "Maintenance Staff activated successfully" 
      : "Maintenance Staff deactivated successfully";

    getIo()?.emit('userUpdated', { role: 'maintenance_staff', id: staff._id });

    return sendSuccess(res, 200, message, {
      data: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
      }
    });
});

const bulkToggleMaintenanceStaffStatus = asyncHandler(async (req, res) => {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 400, "Please provide an array of Maintenance Staff IDs");
    }

    if (typeof isActive !== 'boolean') {
      return sendError(res, 400, "Please provide isActive boolean status");
    }

    await bulkToggleUserStatusByRoleDb(ids, "maintenance_staff", isActive);

    getIo()?.emit('userUpdated', { role: 'maintenance_staff', bulk: true });

    return sendSuccess(res, 200, "Bulk maintenance staff status updated successfully");
});

export {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  updateUserEmail,
  updateAdminOrganization,
  toggleAdminStatus,
  bulkToggleAdminStatus,
  createWarden,
  getWardens,
  getWardenById,
  updateWarden,
  updateWardenHostel,
  toggleWardenStatus,
  bulkToggleWardenStatus,
  createMaintenanceStaff,
  getMaintenanceStaff,
  getMaintenanceStaffById,
  updateMaintenanceStaff,
  toggleMaintenanceStaffStatus,
  bulkToggleMaintenanceStaffStatus
}