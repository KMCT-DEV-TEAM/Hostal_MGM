import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  checkExistingHostelCodeDb,
  checkExistingHostelEmailDb,
  createHostelDb,
  getHostelsDb,
  updateHostelDb,
  toggleHostelStatusDb
} from "./hostel.service.js";

const createHostel = asyncHandler(async (req, res) => {
  const { code, email, organizations } = req.body;
  
  let finalOrganizations = organizations;
  if (!finalOrganizations || finalOrganizations.length === 0) {
    if (req.user.organization) {
      finalOrganizations = [req.user.organization];
    } else {
      return sendError(res, 400, "At least one Organization ID is required");
    }
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

  if (req.body.email) {
    const existingEmail = await checkExistingHostelEmailDb(req.body.email);
    if (existingEmail && existingEmail._id.toString() !== id) {
      return sendError(res, 400, "Hostel email already exists");
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
