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
  toggleHostelStatusDb
} from "./hostel.service.js";

const createHostel = asyncHandler(async (req, res) => {
  const { code, email } = req.body;
  
  // let finalOrganizations = organizations;
  // if (!finalOrganizations || finalOrganizations.length === 0) {
  //   if (req.user.organization) {
  //     finalOrganizations = [req.user.organization];
  //   } else {
  //     return sendError(res, 400, "At least one Organization ID is required");
  //   }
  // }

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
    // organizations: finalOrganizations,
  });

  return sendSuccess(res, 201, "Hostel created successfully", {
    data: newHostel,
  });
});

const getHostels = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const { hostels, totalCount } = await getPaginatedHostelsDb(organizationId, page, limit);

  return sendSuccess(res, 200, "Hostels fetched successfully", {
    count: hostels.length,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
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
  const { name, code, email, location, capacity, hosteltype } = req.body;

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
  if (location !== undefined) updatePayload.location = location;
  if (capacity !== undefined) updatePayload.capacity = capacity;
  if (hosteltype !== undefined) updatePayload.hosteltype = hosteltype;

  const updatedHostel = await updateHostelDb(id, organizationId, updatePayload);

  if (!updatedHostel) {
    return sendError(res, 404, "Hostel not found");
  }

  return sendSuccess(res, 200, "Hostel updated successfully", {
    data: updatedHostel,
  });
});

const toggleHostelStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organization;

  const hostel = await toggleHostelStatusDb(id, organizationId);

  if (!hostel) {
    return sendError(res, 404, "Hostel not found");
  }

  const message = hostel.isActive
    ? "Hostel activated successfully"
    : "Hostel deactivated successfully";

  return sendSuccess(res, 200, message, {
    data: hostel,
  });
});

export {
  createHostel,
  getHostels,
  getHostelById,
  updateHostel,
  toggleHostelStatus
};
