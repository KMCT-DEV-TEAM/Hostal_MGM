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

export async function getAdminHostels(params) {
  const response = await leaveApi.getAdminHostels(params);
  return response.data;
}

export async function getLeaveByIdAdmin(id) {
  const response = await leaveApi.getLeaveByIdAdmin(id);
  return response.data;
}

export async function getLeaveByIdSuperAdmin(id) {
  const response = await leaveApi.getLeaveByIdSuperAdmin(id);
  return response.data;
}

export async function getLeavesBySuperAdmin(params) {
  const response = await leaveApi.getLeavesBySuperAdmin(params);
  return response.data;
}

export async function cancelLeaveAdmin(id, payload) {
  const response = await leaveApi.cancelLeaveByAdmin(id, payload);
  return response.data;
}

export async function cancelLeaveSuperAdmin(id, payload) {
  const response = await leaveApi.cancelLeaveBySuperAdmin(id, payload);
  return response.data;
}

export async function getSuperAdminHostels(params) {
  const response = await leaveApi.getSuperAdminHostels(params);
  return response.data;
}

export async function getLeavesByWarden(params) {
  const response = await leaveApi.getLeavesByWarden(params);
  return response.data;
}

export async function markStudentLeft(id) {
  const response = await leaveApi.markStudentLeft(id);
  return response.data;
}

export async function markStudentReturned(id) {
  const response = await leaveApi.markStudentReturned(id);
  return response.data;
}

export async function updateLeaveStatusByAdmin(id, payload) {
  const response = await leaveApi.updateLeaveStatusByAdmin(id, payload);
  return response.data;
}

export async function approveLeaveByAdmin(id, payload) {
  const response = await leaveApi.approveLeaveByAdmin(id, payload);
  return response.data;
}

export async function rejectLeaveByAdmin(id, payload) {
  const response = await leaveApi.rejectLeaveByAdmin(id, payload);
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

export async function getLeaveByIdParent(id) {
  const response = await leaveApi.getLeaveByIdParent(id);
  return response.data;
}

// export async function getLeaveByIdAdmin(id) {
//   const response = await leaveApi.getLeaveByIdAdmin(id);
//   return response.data;
// }

export async function getLeaveByIdWarden(id) {
  const response = await leaveApi.getLeaveByIdWarden(id);
  return response.data;
}

// Set up Role Resolvers (matching the structure of other services)
const LEAVE_FETCHERS = {
  [ROLES.ADMIN]: getLeavesByAdmin,
  [ROLES.SUPER_ADMIN]: getLeavesBySuperAdmin,
  [ROLES.PARENT]: getLeavesByParent,
  [ROLES.WARDEN]: getLeavesByWarden,
  [ROLES.STUDENT]: getMyLeaves,
};

const LEAVE_HOSTELS_FETCHERS = {
  [ROLES.ADMIN]: getAdminHostels,
  [ROLES.SUPER_ADMIN]: getSuperAdminHostels,
};

const LEAVE_STATUS_UPDATE_FETCHERS = {
  [ROLES.ADMIN]: updateLeaveStatusByAdmin,
  [ROLES.SUPER_ADMIN]: updateLeaveStatusByAdmin,
};

const LEAVE_DETAILS_FETCHERS = {
  [ROLES.STUDENT]: getLeaveById,
  [ROLES.PARENT]: getLeaveByIdParent,
  [ROLES.WARDEN]: getLeaveByIdWarden,
  [ROLES.ADMIN]: getLeaveByIdAdmin,
  [ROLES.SUPER_ADMIN]: getLeaveByIdSuperAdmin,
};

export const getLeaves = createRoleResolver(LEAVE_FETCHERS, 'leave');

export const getLeaveHostels = createRoleResolver(LEAVE_HOSTELS_FETCHERS, 'leave hostels');

export const updateLeaveStatus = createRoleResolver(
  LEAVE_STATUS_UPDATE_FETCHERS,
  'leave status update'
);

export const getLeaveDetails = createRoleResolver(LEAVE_DETAILS_FETCHERS, 'leave details');

const APPROVE_FETCHERS = {
  [ROLES.ADMIN]: approveLeaveByAdmin,
};

const REJECT_FETCHERS = {
  [ROLES.ADMIN]: rejectLeaveByAdmin,
};

export const approvePass = createRoleResolver(APPROVE_FETCHERS, 'approve pass');
export const rejectPass = createRoleResolver(REJECT_FETCHERS, 'reject pass');

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
  approveLeaveByAdmin,
  rejectLeaveByAdmin,
  markStudentLeft,
  markStudentReturned,
  getLeaves,
  getLeaveHostels,
  updateLeaveStatus,
  getLeaveDetails,
  approvePass,
  rejectPass,
};

export default leaveService;
