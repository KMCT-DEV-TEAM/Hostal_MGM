import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { getAggregateOrganizationDataDb } from "../organizations/organization.service.js";
import User from "../users/user.model.js";
import Organization from "../organizations/organization.model.js";

const getOrganizationData = asyncHandler(async (req, res) => {
  // Warden gets all organizations according to API 1
  const data = await getAggregateOrganizationDataDb(null);

  if (!data || data.length === 0) {
    return sendError(res, 404, "Organization data not found");
  }

  return sendSuccess(res, 200, "Organization data fetched successfully", {
    data: data
  });
});

const getWardenStats = asyncHandler(async (req, res) => {
  const [organizationCount, studentCount] = await Promise.all([
    Organization.countDocuments(),
    User.countDocuments({ role: "student" }),
  ]);

  return sendSuccess(res, 200, "Warden stats fetched successfully", {
    data: {
      organizations: organizationCount,
      students: studentCount,
    },
  });
});


const getWardenByAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user.id)
    .select("organization")
    .lean();

  if (!admin?.organization) {
    return sendError(
      res,
      400,
      "Admin is not assigned to any organization"
    );
  }

  const wardens = await User.find({
    role: "warden",
    organization: admin.organization,
  })
    .lean();

  return sendSuccess(res, 200, "Warden fetched successfully", {
    data: {
      wardens,
    },
  });


})

export {
  getOrganizationData,
  getWardenStats,
  getWardenByAdmin
};
