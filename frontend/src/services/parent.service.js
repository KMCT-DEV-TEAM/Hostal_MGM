import parentApi from '@/features/dashboard/api/parentApi';
import { ROLES } from '@/constants/roles';
import { createRoleResolver } from '@/utils/createRoleResolver';

export async function createParent(payload) {
  const response = await parentApi.createParent(payload);
  return response.data;
}

export async function updateParent(id, payload) {
  const response = await parentApi.updateParent(id, payload);
  return response.data;
}

export async function getParentsByAdmin(params) {
  const response = await parentApi.getParentsByAdmin(params);
  return response.data;
}

export async function getParentsBySuperAdmin(params) {
  const response = await parentApi.getParentsBySuperAdmin(params);
  return response.data;
}

export async function exportParentsByAdmin(params) {
  const response = await parentApi.exportParentsByAdmin(params);
  return response.data;
}

export async function exportParentsBySuperAdmin(params) {
  const response = await parentApi.exportParentsBySuperAdmin(params);
  return response.data;
}

export async function toggleStatusByAdmin(id) {
  const response = await parentApi.toggleStatusByAdmin(id);
  return response.data;
}

export async function toggleStatusBySuperAdmin(id) {
  const response = await parentApi.toggleStatusBySuperAdmin(id);
  return response.data;
}

export async function bulkStatusByAdmin(payload) {
  const response = await parentApi.bulkStatusByAdmin(payload);
  return response.data;
}

export async function bulkStatusBySuperAdmin(payload) {
  const response = await parentApi.bulkStatusBySuperAdmin(payload);
  return response.data;
}

const PARENT_FETCHERS = {
  [ROLES.ADMIN]: getParentsByAdmin,
  [ROLES.SUPER_ADMIN]: getParentsBySuperAdmin,
};

const PARENT_EXPORT_FETCHERS = {
  [ROLES.ADMIN]: exportParentsByAdmin,
  [ROLES.SUPER_ADMIN]: exportParentsBySuperAdmin,
};

const PARENT_STATUS_TOGGLE_FETCHERS = {
  [ROLES.ADMIN]: toggleStatusByAdmin,
  [ROLES.SUPER_ADMIN]: toggleStatusBySuperAdmin,
};

export const getParents = createRoleResolver(PARENT_FETCHERS, 'parent');

export const exportParents = createRoleResolver(PARENT_EXPORT_FETCHERS, 'parent export');

export const toggleParentStatus = createRoleResolver(
  PARENT_STATUS_TOGGLE_FETCHERS,
  'parent status toggle'
);

const PARENT_BULK_STATUS_FETCHERS = {
  [ROLES.ADMIN]: bulkStatusByAdmin,
  [ROLES.SUPER_ADMIN]: bulkStatusBySuperAdmin,
};

export const bulkUpdateParentStatus = createRoleResolver(
  PARENT_BULK_STATUS_FETCHERS,
  'parent bulk status'
);

const parentService = {
  createParent,
  updateParent,
  getParents,
  getParentsByAdmin,
  getParentsBySuperAdmin,
  toggleParentStatus,
  bulkUpdateParentStatus,
  toggleStatusByAdmin,
  toggleStatusBySuperAdmin,
  bulkStatusByAdmin,
  bulkStatusBySuperAdmin,
};

export default parentService;
