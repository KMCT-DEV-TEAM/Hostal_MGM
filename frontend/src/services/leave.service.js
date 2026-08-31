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
  const response = await leaveApi.getLeaves(params);
  return response.data;
}

export async function getUnifiedPasses(params) {
  const response = await leaveApi.getLeaves(params);
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
 * Management Endpoints (Admin, Super Admin, Mentor)
 */
export async function getLeavesByAdmin(params) {
  const { hostelId, ...rest } = params;
  const response = await leaveApi.getManagementHostelLeaves(hostelId, rest);
  return response.data;
}

export async function getAdminHostels(params) {
  const response = await leaveApi.getManagementHostels(params);
  return response.data;
}

export async function getAdminDashboardStats(params) {
  const response = await leaveApi.getDashboardStats(params);
  return response.data;
}

export async function getLeaveByIdAdmin(id) {
  const response = await leaveApi.getLeaveById(id);
  return response.data;
}

export async function getSuperAdminDashboardStats(params) {
  const response = await leaveApi.getDashboardStats(params);
  return response.data;
}

export async function getLeaveByIdSuperAdmin(id) {
  const response = await leaveApi.getLeaveById(id);
  return response.data;
}

export async function getLeavesBySuperAdmin(params) {
  const { hostelId, ...rest } = params;
  const response = await leaveApi.getManagementHostelLeaves(hostelId, rest);
  return response.data;
}

export async function cancelLeaveAdmin(id, payload) {
  const response = await leaveApi.cancelLeave(id, payload);
  return response.data;
}

export async function cancelLeaveSuperAdmin(id, payload) {
  const response = await leaveApi.cancelLeave(id, payload);
  return response.data;
}

export async function getSuperAdminHostels(params) {
  const response = await leaveApi.getManagementHostels(params);
  return response.data;
}

export async function updateLeaveStatusByAdmin(id, payload) {
  // Using approve as the default patch status endpoint
  const response = await leaveApi.approveLeave(id, payload);
  return response.data;
}

export async function approveLeaveByAdmin(id, payload) {
  const response = await leaveApi.approveLeave(id, payload);
  return response.data;
}

export async function rejectLeaveByAdmin(id, payload) {
  const response = await leaveApi.rejectLeave(id, payload);
  return response.data;
}

export async function getLeavesByMentor(params) {
  const { hostelId, ...rest } = params;
  const response = await leaveApi.getManagementHostelLeaves(hostelId, rest);
  return response.data;
}

export async function getMentorDashboardStats(params) {
  const response = await leaveApi.getDashboardStats(params);
  return response.data;
}

export async function getMentorHostels(params) {
  const response = await leaveApi.getManagementHostels(params);
  return response.data;
}

export async function getLeaveByIdMentor(id) {
  const response = await leaveApi.getLeaveById(id);
  return response.data;
}

export async function approveLeaveByMentor(id, payload) {
  const response = await leaveApi.approveLeave(id, payload);
  return response.data;
}

export async function rejectLeaveByMentor(id, payload) {
  const response = await leaveApi.rejectLeave(id, payload);
  return response.data;
}

export async function cancelLeaveByMentor(id, payload) {
  const response = await leaveApi.cancelLeave(id, payload);
  return response.data;
}

/**
 * Warden Endpoints
 */
export async function getLeavesByWarden(params) {
  const response = await leaveApi.getWardenList(params);
  return response.data;
}

export async function getLeaveByIdWarden(id) {
  const response = await leaveApi.getLeaveById(id);
  return response.data;
}

export async function getWardenDashboardStats(params) {
  const response = await leaveApi.getDashboardStats(params);
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

/**
 * Parent Endpoints
 */
export async function getLeavesByParent(params) {
  const { studentId, ...restParams } = params;
  const response = await leaveApi.getParentList({ ...restParams, studentId });
  return response.data;
}

export async function getUnifiedPassesParent(params) {
  const { studentId, ...restParams } = params;
  const response = await leaveApi.getLeaves({ ...restParams, studentId });
  return response.data;
}

export async function approveLeaveByParent(id, payload) {
  const response = await leaveApi.approveLeave(id, payload);
  return response.data;
}

export async function rejectLeaveByParent(id, payload) {
  const response = await leaveApi.rejectLeave(id, payload);
  return response.data;
}

export async function getLeaveByIdParent(id, studentId) {
  // studentId is no longer strictly required for the API path since we use /passes/:id
  const response = await leaveApi.getLeaveById(id);
  return response.data;
}

// Set up Role Resolvers
const LEAVE_FETCHERS = {
  [ROLES.ADMIN]: getLeavesByAdmin,
  [ROLES.SUPER_ADMIN]: getLeavesBySuperAdmin,
  [ROLES.PARENT]: getLeavesByParent,
  [ROLES.WARDEN]: getLeavesByWarden,
  [ROLES.ASSISTANT_WARDEN]: getLeavesByWarden,
  [ROLES.STUDENT]: getMyLeaves,
  [ROLES.MENTOR]: getLeavesByMentor,
};

const LEAVE_HOSTELS_FETCHERS = {
  [ROLES.ADMIN]: getAdminHostels,
  [ROLES.SUPER_ADMIN]: getSuperAdminHostels,
  [ROLES.MENTOR]: getMentorHostels,
};

const LEAVE_STATUS_UPDATE_FETCHERS = {
  [ROLES.ADMIN]: updateLeaveStatusByAdmin,
  [ROLES.SUPER_ADMIN]: updateLeaveStatusByAdmin,
};

const LEAVE_DETAILS_FETCHERS = {
  [ROLES.STUDENT]: getLeaveById,
  [ROLES.PARENT]: getLeaveByIdParent,
  [ROLES.WARDEN]: getLeaveByIdWarden,
  [ROLES.ASSISTANT_WARDEN]: getLeaveByIdWarden,
  [ROLES.ADMIN]: getLeaveByIdAdmin,
  [ROLES.SUPER_ADMIN]: getLeaveByIdSuperAdmin,
  [ROLES.MENTOR]: getLeaveByIdMentor,
};

export const getLeaves = createRoleResolver(LEAVE_FETCHERS, 'leave');
export const getLeaveHostels = createRoleResolver(LEAVE_HOSTELS_FETCHERS, 'leave hostels');
export const updateLeaveStatus = createRoleResolver(LEAVE_STATUS_UPDATE_FETCHERS, 'leave status update');
export const getLeaveDetails = createRoleResolver(LEAVE_DETAILS_FETCHERS, 'leave details');

const APPROVE_FETCHERS = {
  [ROLES.ADMIN]: approveLeaveByAdmin,
  [ROLES.MENTOR]: approveLeaveByMentor,
};

const REJECT_FETCHERS = {
  [ROLES.ADMIN]: rejectLeaveByAdmin,
  [ROLES.MENTOR]: rejectLeaveByMentor,
};

export const approvePass = createRoleResolver(APPROVE_FETCHERS, 'approve pass');
export const rejectPass = createRoleResolver(REJECT_FETCHERS, 'reject pass');

const leaveService = {
  createLeave,
  getMyLeaves,
  getUnifiedPasses,
  getLeaveById,
  updateLeave,
  cancelLeave,
  getLeavesByAdmin,
  updateLeaveStatusByAdmin,
  getLeavesByParent,
  getUnifiedPassesParent,
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
  getLeavesByMentor,
  getMentorDashboardStats,
  getMentorHostels,
  getLeaveByIdMentor,
  approveLeaveByMentor,
  rejectLeaveByMentor,
  cancelLeaveByMentor,
  getSuperAdminDashboardStats,
};

export default leaveService;
