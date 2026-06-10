import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { updateParentDb, toggleParentStatusDb } from "./parent.service.js";

const updateParent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let result;
  try {
    result = await updateParentDb(id, req.body);
  } catch (error) {
    if (error.message === "Parent email already exists") {
      return sendError(res, 400, error.message);
    }
    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  return sendSuccess(res, 200, "Parent updated successfully", {
    data: {
      parentId: result.parentProfile._id,
      name: result.user.name,
      email: result.user.email,
    }
  });
});

const toggleParentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await toggleParentStatusDb(id);

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  const message = result.user.isActive 
    ? "Parent activated successfully" 
    : "Parent deactivated successfully";

  return sendSuccess(res, 200, message, {
    data: {
      parentId: result.parentProfile._id,
      isActive: result.user.isActive,
    }
  });
});

export {
  updateParent,
  toggleParentStatus
};
