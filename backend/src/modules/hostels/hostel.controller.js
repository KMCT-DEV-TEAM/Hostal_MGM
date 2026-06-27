import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  checkExistingHostelCodeDb,
  checkExistingHostelEmailDb,
  createHostelDb,
  getHostelsDb,
  getPaginatedHostelsDb,
  getHostelByIdDb,
  updateHostelDb,
  toggleHostelStatusDb,
  bulkUpdateHostelStatusDb
} from "./hostel.service.js";
import { createLogDb } from "../logs/log.service.js";
import { getIo } from "../../config/socket.js";

const createHostel = asyncHandler(async (req, res) => {
  const { code, email, organization } = req.body;
  let finalOrganizations = [];
  if (organization) {
    finalOrganizations = [organization];
  } else if (req.user && req.user.organization) {
    finalOrganizations = [req.user.organization];
  }

  const existingEmail = await checkExistingHostelEmailDb(email);
  if (existingEmail) {
    return sendError(res, 400, "Hostel email already exists");
  }

  const existingHostel = await checkExistingHostelCodeDb(code);
  if (existingHostel) {
    return sendError(res, 400, "Hostel code already exists");
  }

  const newHostel = await createHostelDb({
    ...req.body,
    organizations: finalOrganizations,
  });

  if (req.user) {
    await createLogDb({
      action: "Created Hostel",
      entityType: "Hostel",
      entityId: newHostel._id,
      user: req.user.id || req.user._id,
      userRole: req.user.role,
      details: `Created new hostel: ${newHostel.name} (${newHostel.code})`,
      status: "success"
    });
  }

  getIo()?.emit('hostelCreated', newHostel);

  return sendSuccess(res, 201, "Hostel created successfully", {
    data: newHostel,
  });
});

const getHostels = asyncHandler(async (req, res) => {
  // let organizationId = req.user.organization;
  // if (req.user.role === "super_admin" && req.query.organizationId) {
  //   organizationId = req.query.organizationId;
  // }
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;
  const search = req.query.search || "";
  const status = req.query.status || "";

  const { hostels, totalCount } = await getPaginatedHostelsDb(page, limit, search, status);

  return sendSuccess(res, 200, "Hostels fetched successfully", {
    count: hostels.length,
    totalCount,
    currentPage: page,
    totalPages: limit === 0 ? 1 : Math.ceil(totalCount / limit),
    data: hostels,
  });
});

const getHostelById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organization;

  const hostel = await getHostelByIdDb(id, organizationId);

  if (!hostel) {
    return sendError(res, 404, "Hostel not found");
  }

  return sendSuccess(res, 200, "Hostel fetched successfully", {
    data: hostel,
  });
});

const updateHostel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.role === "admin" ? req.user.organization : null;
  const { name, code, email, phone, location, capacity, hosteltype } = req.body;

  if (code) {
    const existingHostel = await checkExistingHostelCodeDb(code);
    if (existingHostel && existingHostel._id.toString() !== id) {
      return sendError(res, 400, "Hostel code already exists");
    }
  }

  if (email) {
    const existingEmail = await checkExistingHostelEmailDb(email);
    if (existingEmail && existingEmail._id.toString() !== id) {
      return sendError(res, 400, "Hostel email already exists");
    }
  }

  // Build the update payload dynamically to avoid overwriting undefined fields with null
  const updatePayload = {};
  if (name !== undefined) updatePayload.name = name;
  if (code !== undefined) updatePayload.code = code;
  if (email !== undefined) updatePayload.email = email;
  if (phone !== undefined) updatePayload.phone = phone;
  if (location !== undefined) updatePayload.location = location;
  if (capacity !== undefined) updatePayload.capacity = capacity;
  if (hosteltype !== undefined) updatePayload.hosteltype = hosteltype;

  const updatedHostel = await updateHostelDb(id, organizationId, updatePayload);

  if (!updatedHostel) {
    return sendError(res, 404, "Hostel not found");
  }

  if (req.user) {
    await createLogDb({
      action: "Updated Hostel",
      entityType: "Hostel",
      entityId: updatedHostel._id,
      user: req.user.id || req.user._id,
      userRole: req.user.role,
      details: `Updated hostel details for: ${updatedHostel.name} (${updatedHostel.code})`,
      status: "success"
    });
  }

  getIo()?.emit('hostelUpdated', { id: updatedHostel._id });

  return sendSuccess(res, 200, "Hostel updated successfully", {
    data: updatedHostel,
  });
});

const toggleHostelStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.role === "admin" ? req.user.organization : null;

  const hostel = await toggleHostelStatusDb(id, organizationId);

  if (!hostel) {
    return sendError(res, 404, "Hostel not found");
  }

  if (req.user) {
    await createLogDb({
      action: hostel.isActive ? "Activated Hostel" : "Deactivated Hostel",
      entityType: "Hostel",
      entityId: hostel._id,
      user: req.user.id || req.user._id,
      userRole: req.user.role,
      details: `Changed status of hostel ${hostel.name} to ${hostel.isActive ? 'Active' : 'Inactive'}`,
      status: "success"
    });
  }

  getIo()?.emit('hostelUpdated', { id: hostel._id });

  return sendSuccess(res, 200, `Hostel status updated to ${hostel.isActive ? 'Active' : 'Inactive'}`, {
    data: hostel,
  });
});

const bulkUpdateHostelStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;
  console.log("Active Status", req.body);

  const organizationId = req.user.role === "admin" ? req.user.organization : null;
  console.log("Organization ID", organizationId);
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Please provide an array of hostel IDs");
  }

  if (typeof isActive !== "boolean") {
    return sendError(res, 400, "Please provide a valid boolean for isActive");
  }

  const result = await bulkUpdateHostelStatusDb(ids, isActive, organizationId);
  console.log("bulkUpdateHostelStatus result:", result);

  if (req.user) {
    await createLogDb({
      action: "Bulk Updated Hostel Status",
      entityType: "Hostel",
      user: req.user.id || req.user._id,
      userRole: req.user.role,
      details: `Bulk updated ${ids.length} hostels to ${isActive ? 'Active' : 'Inactive'}`,
      status: "success"
    });
  }

  getIo()?.emit('hostelUpdated', { bulk: true });

  return sendSuccess(res, 200, `Successfully updated ${ids.length} hostels to ${isActive ? 'Active' : 'Inactive'} status`, { result });
});

export {
  createHostel,
  getHostels,
  getHostelById,
  updateHostel,
  toggleHostelStatus,
  bulkUpdateHostelStatus,
};
