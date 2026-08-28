import { sendSuccess, sendError } from "../../utils/response.js";
import { getProfile } from "./profile.service.js";

const getProfileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (!userId || !role) {
      return sendError(res, 400, "User ID or role missing in request");
    }

    const profileData = await getProfile(userId, role);

    return sendSuccess(res, 200, "Profile fetched successfully", profileData);
  } catch (error) {
    if (error.message.includes("User not found") || error.message.includes("Parent profile not found")) {
      return sendError(res, 404, error.message || "User not found");
    }
    console.error("Profile fetch error:", error);
    return sendError(res, 500, "Failed to fetch profile");
  }
};

export default {
  getProfile: getProfileHandler,
};
