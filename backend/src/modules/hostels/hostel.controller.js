import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  checkExistingHostelCodeDb,
  createHostelDb,
  getHostelsDb,
  updateHostelDb,
  toggleHostelStatusDb
} from "./hostel.service.js";

const createHostel = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const organizationId = req.user.organization;

  if (!organizationId) {
    return sendError(res, 400, "Admin must be associated with an organization");
  }

  const existingHostel = await checkExistingHostelCodeDb(code);
  if (existingHostel) {
    return sendError(res, 400, "Hostel code already exists");
  }

  const newHostel = await createHostelDb({
    ...req.body,
    organizationId,
  });

  return sendSuccess(res, 201, "Hostel created successfully", {
    data: newHostel,
  });
});

const getHostels = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;
  const hostels = await getHostelsDb(organizationId);

  return sendSuccess(res, 200, "Hostels fetched successfully", {
    data: hostels,
  });
});

const updateHostel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organization;

  if (req.body.code) {
    const existingHostel = await checkExistingHostelCodeDb(req.body.code);
    if (existingHostel && existingHostel._id.toString() !== id) {
      return sendError(res, 400, "Hostel code already exists");
    }
  }

  const updatedHostel = await updateHostelDb(id, organizationId, req.body);

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
  updateHostel,
  toggleHostelStatus
};
