import {
  findExistingOrganization,
  findExistingOrganizationWithExclude,
  createOrganizationDb,
  getAllOrganizationsDb,
  getPaginatedOrganizationsDb,
  getOrganizationByIdDb,
  updateOrganizationDb,
  toggleOrganizationStatusDb
} from "./organization.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";

const createOrganization = asyncHandler(async (req, res) => {
    const { name, code, organisationNumber, email, phone, address } = req.body;

    const existingOrg = await findExistingOrganization(code, organisationNumber);

    if (existingOrg) {
      return sendError(res, 400, "Organization with this code or number already exists");
    }

    const organization = await createOrganizationDb({
      name,
      code,
      organisationNumber,
      email,
      phone,
      address,
    });

    return sendSuccess(res, 201, "Organization created successfully", { data: organization });
});

const getOrganizations = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;

    const { organizations, totalCount } = await getPaginatedOrganizationsDb(page, limit);

    return sendSuccess(res, 200, "Organizations fetched successfully", { 
      count: organizations.length, 
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      data: organizations 
    });
});

const getOrganizationById = asyncHandler(async (req, res) => {
    const organization = await getOrganizationByIdDb(req.params.id);

    if (!organization) {
      return sendError(res, 404, "Organization not found");
    }

    return sendSuccess(res, 200, "Organization fetched successfully", { data: organization });
});

const updateOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, code, organisationNumber, email, phone, address } = req.body;

    const existingOrg = await findExistingOrganizationWithExclude(code, organisationNumber, id);
    if (existingOrg) {
      return sendError(res, 400, "Another organization with this code or number already exists");
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

    return sendSuccess(res, 200, message, { data: organization });
});

export {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  toggleOrganizationStatus
};
