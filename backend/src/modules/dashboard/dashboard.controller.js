import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import User from "../users/user.model.js";
import Organization from "../organizations/organization.model.js";
import Hostel from "../hostels/hostel.model.js";

const getSuperAdminStats = asyncHandler(async (req, res) => {
  const [adminCount, wardenCount, studentCount, organizationCount, hostelCount] = await Promise.all([
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: "warden" }),
    User.countDocuments({ role: "student" }),
    Organization.countDocuments(),
    Hostel.countDocuments(),
  ]);

  return sendSuccess(res, 200, "Dashboard stats fetched successfully", {
    data: {
      organizations: organizationCount,
      admins: adminCount,
      wardens: wardenCount,
      students: studentCount,
      hostels: hostelCount,
    },
  });
});

export { getSuperAdminStats };
