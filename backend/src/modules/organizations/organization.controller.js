import {
  checkExistingOrgCodeDb,
  checkExistingOrgNumberDb,
  checkExistingOrgEmailDb,
  createOrganizationDb,
  getAllOrganizationsDb,
  getPaginatedOrganizationsDb,
  getOrganizationByIdDb,
  updateOrganizationDb,
  toggleOrganizationStatusDb,
  bulkUpdateOrganizationStatusDb
} from "./organization.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { createLogDb } from "../logs/log.service.js";

const createOrganization = asyncHandler(async (req, res) => {
  const { name, code, organisationNumber, email, phone, address } = req.body;

  if (email) {
    const existingEmail = await checkExistingOrgEmailDb(email);
    if (existingEmail) {
      return sendError(res, 400, "Organization email already exists");
    }
  }

  if (code) {
    const existingCode = await checkExistingOrgCodeDb(code);
    if (existingCode) {
      return sendError(res, 400, "Organization code already exists");
    }
  }

  if (organisationNumber) {
    const existingNumber = await checkExistingOrgNumberDb(organisationNumber);
    if (existingNumber) {
      return sendError(res, 400, "Organization number already exists");
    }
  }

  const organization = await createOrganizationDb({
    name,
    code,
    organisationNumber,
    email,
    phone,
    address,
  });

  await createLogDb({
    action: "Created Organization",
    entityType: "Organization",
    entityId: organization._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Created new organization: ${name}`,
    status: "success"
  });

  return sendSuccess(res, 201, "Organization created successfully", { data: organization });
});

const getOrganizations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;
  const search = req.query.search || "";
  const status = req.query.status || "All";

  const adminOrganizationId = req.user.role === 'admin' ? req.user.organization : null;
  if (req.user.role === 'admin' && !adminOrganizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  const { organizations, totalCount } = await getPaginatedOrganizationsDb(page, limit, search, status, adminOrganizationId);
  console.log("DEBUG organizations:", JSON.stringify(organizations[0], null, 2));

  return sendSuccess(res, 200, "Organizations fetched successfully", {
    count: organizations.length,
    totalCount,
    currentPage: page,
    totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
    data: organizations
  });
});

const getOrganizationById = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin' && req.params.id !== req.user.organization?.toString()) {
    return sendError(res, 403, "Access denied: You can only view your own organization");
  }

  const organization = await getOrganizationByIdDb(req.params.id);

  if (!organization) {
    return sendError(res, 404, "Organization not found");
  }

  return sendSuccess(res, 200, "Organization fetched successfully", { data: organization });
});

const updateOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, organisationNumber, email, phone, address } = req.body;

  if (email) {
    const existingEmail = await checkExistingOrgEmailDb(email);
    if (existingEmail && existingEmail._id.toString() !== id) {
      return sendError(res, 400, "Organization email already exists");
    }
  }

  if (code) {
    const existingCode = await checkExistingOrgCodeDb(code);
    if (existingCode && existingCode._id.toString() !== id) {
      return sendError(res, 400, "Organization code already exists");
    }
  }

  if (organisationNumber) {
    const existingNumber = await checkExistingOrgNumberDb(organisationNumber);
    if (existingNumber && existingNumber._id.toString() !== id) {
      return sendError(res, 400, "Organization number already exists");
    }
  }

  const organization = await updateOrganizationDb(id, {
    name,
    code,
    organisationNumber,
    email,
    phone,
    address
  });

  if (!organization) {
    return sendError(res, 404, "Organization not found");
  }

  await createLogDb({
    action: "Updated Organization",
    entityType: "Organization",
    entityId: organization._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Updated organization details for: ${name || organization.name}`,
    status: "success"
  });

  return sendSuccess(res, 200, "Organization updated successfully", { data: organization });
});

const toggleOrganizationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const organization = await toggleOrganizationStatusDb(id);

  if (!organization) {
    return sendError(res, 404, "Organization not found");
  }

  const message = organization.isActive
    ? "Organization activated successfully"
    : "Organization deactivated successfully";

  await createLogDb({
    action: organization.isActive ? "Activated Organization" : "Deactivated Organization",
    entityType: "Organization",
    entityId: organization._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Changed status of organization ${organization.name} to ${organization.isActive ? 'Active' : 'Inactive'}`,
    status: "success"
  });

  return sendSuccess(res, 200, message, { data: organization });
});

const bulkUpdateOrganizationStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Please provide an array of organization IDs");
  }

  if (typeof isActive !== "boolean") {
    return sendError(res, 400, "Please provide a valid boolean for isActive");
  }

  const result = await bulkUpdateOrganizationStatusDb(ids, isActive);

  await createLogDb({
    action: "Bulk Updated Organizations",
    entityType: "Organization",
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Bulk updated ${ids.length} organizations to ${isActive ? 'Active' : 'Inactive'} status`,
    status: "success"
  });

  return sendSuccess(res, 200, `Successfully updated ${ids.length} organizations to ${isActive ? 'Active' : 'Inactive'} status`, { result });
});

export {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  toggleOrganizationStatus,
  bulkUpdateOrganizationStatus
};
