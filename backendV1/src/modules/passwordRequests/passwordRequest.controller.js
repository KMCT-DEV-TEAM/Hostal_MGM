import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import {
  verifyEmailExistsDb,
  submitPasswordRequestDb,
  getPasswordRequestsDb,
  approvePasswordRequestDb,
  rejectPasswordRequestDb,
} from './passwordRequest.service.js';
import { getIo } from '../../config/socket.js';
import { createLog } from '../../utils/log.util.js';

export const verifyEmailForReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 400, "Email is required");
  }

  const exists = await verifyEmailExistsDb(email);

  if (!exists) {
    return sendError(res, 404, "User not found with this email");
  }

  return sendSuccess(res, 200, "Email verified successfully", { email });
});

export const submitPasswordRequest = asyncHandler(async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return sendError(res, 400, "Email, new password, and confirm password are required");
  }

  if (newPassword !== confirmPassword) {
    return sendError(res, 400, "Passwords do not match");
  }

  const result = await submitPasswordRequestDb(email, newPassword);

  getIo()?.emit('passwordRequestCreated', result);

  await createLog(
    { id: result.userId, role: result.user?.role || 'user' },
    "Submitted Password Request",
    "PasswordRequest",
    result.id,
    `Password reset request submitted for ${email}`,
    "success"
  );

  return sendSuccess(res, 201, "Password reset request submitted successfully", result);
});

export const getPasswordRequests = asyncHandler(async (req, res) => {
  const result = await getPasswordRequestsDb(req.query);
  return sendSuccess(res, 200, "Password requests fetched successfully", result);
});

export const approvePasswordRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await approvePasswordRequestDb(id);

  getIo()?.emit('passwordRequestUpdated', { id });

  await createLog(
    req,
    "Approved Password Request",
    "PasswordRequest",
    id,
    `Approved password request (ID: ${id})`,
    "success"
  );

  return sendSuccess(res, 200, "Password request approved and password updated successfully", result);
});

export const rejectPasswordRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await rejectPasswordRequestDb(id);

  getIo()?.emit('passwordRequestUpdated', { id });

  await createLog(
    req,
    "Rejected Password Request",
    "PasswordRequest",
    id,
    `Rejected password request (ID: ${id})`,
    "success"
  );

  return sendSuccess(res, 200, "Password request rejected successfully", result);
});
