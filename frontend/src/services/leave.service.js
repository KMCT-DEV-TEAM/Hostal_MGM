import leaveApi from '@/features/leaves/api/leaveApi';
import { ROLES } from '@/constants/roles';
import { createRoleResolver } from '@/utils/createRoleResolver';

/**
 * Student Endpoints
 */
export async function createLeave(payload) {
  const response = await leaveApi.createLeave(payload);
  return response.data;
}

export async function getMyLeaves(params) {
  const response = await leaveApi.getMyLeaves(params);
  return response.data;
}

export async function getLeaveById(id) {
  const response = await leaveApi.getLeaveById(id);
  return response.data;
}

export async function updateLeave(id, payload) {
  const response = await leaveApi.updateLeave(id, payload);
  return response.data;
}

export async function cancelLeave(id, payload) {
  const response = await leaveApi.cancelLeave(id, payload);
  return response.data;
}


/**
 * Admin Endpoints (Placeholders for future backend endpoints)
 */
export async function getLeavesByAdmin(params) {
  const response = await leaveApi.getLeavesByAdmin(params);
  return response.data;
}

export async function updateLeaveStatusByAdmin(id, payload) {
  const response = await leaveApi.updateLeaveStatusByAdmin(id, payload);
  return response.data;
}

/**
 * Parent Endpoints (Placeholders for future backend endpoints)
 */
export async function getLeavesByParent(params) {
  const response = await leaveApi.getLeavesByParent(params);
  return response.data;
}

export async function approveLeaveByParent(id, payload) {
  const response = await leaveApi.approveLeaveByParent(id, payload);
  return response.data;
}

export async function rejectLeaveByParent(id, payload) {
  const response = await leaveApi.rejectLeaveByParent(id, payload);
  return response.data;
}

// Set up Role Resolvers (matching the structure of other services)
const LEAVE_FETCHERS = {
  [ROLES.ADMIN]: getLeavesByAdmin,
  [ROLES.SUPER_ADMIN]: getLeavesByAdmin,
  [ROLES.PARENT]: getLeavesByParent,
  [ROLES.STUDENT]: getMyLeaves,
};

const LEAVE_STATUS_UPDATE_FETCHERS = {
  [ROLES.ADMIN]: updateLeaveStatusByAdmin,
  [ROLES.SUPER_ADMIN]: updateLeaveStatusByAdmin,
};

export const getLeaves = createRoleResolver(LEAVE_FETCHERS, 'leave');

export const updateLeaveStatus = createRoleResolver(
  LEAVE_STATUS_UPDATE_FETCHERS,
  'leave status update'
);

const leaveService = {
  createLeave,
  getMyLeaves,
  getLeaveById,
  updateLeave,
  cancelLeave,
  getLeavesByAdmin,
  updateLeaveStatusByAdmin,
  getLeavesByParent,
  approveLeaveByParent,
  rejectLeaveByParent,
  getLeaves,
  updateLeaveStatus,
};

export default leaveService;
