import {
  findExistingOrganization,
  createOrganizationDb,
  getAllOrganizationsDb,
  getOrganizationByIdDb,
  updateOrganizationDb
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
    const organizations = await getAllOrganizationsDb();

    return sendSuccess(res, 200, "Organizations fetched successfully", { count: organizations.length, data: organizations });
});

const getOrganizationById = asyncHandler(async (req, res) => {
    const organization = await getOrganizationByIdDb(req.params.id);

    if (!organization) {
      return sendError(res, 404, "Organization not found");
    }

    return sendSuccess(res, 200, "Organization fetched successfully", { data: organization });
});

const updateOrganization = asyncHandler(async (req, res) => {
    const organization = await updateOrganizationDb(req.params.id, req.body);

    if (!organization) {
      return sendError(res, 404, "Organization not found");
    }

    return sendSuccess(res, 200, "Organization updated successfully", { data: organization });
});

export {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization
};
