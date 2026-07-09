import parentApi from '@/features/dashboard/api/parentApi';
import { ROLES } from '@/constants/roles';
import { createRoleResolver } from '@/utils/createRoleResolver';



export async function updateParent(id, payload) {
  const response = await parentApi.updateParent(id, payload);
  return response.data;
}

export async function updateParentByAdmin(id, payload) {
  const response = await parentApi.updateParentByAdmin(id, payload);
  return response.data;
}

export async function updateParentBySuperAdmin(id, payload) {
  const response = await parentApi.updateParentBySuperAdmin(id, payload);
  return response.data;
}

export async function changeParentEmailByAdmin(id, payload) {
  const response = await parentApi.changeParentEmailByAdmin(id, payload);
  return response.data;
}

export async function changeParentEmailBySuperAdmin(id, payload) {
  const response = await parentApi.changeParentEmailBySuperAdmin(id, payload);
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
export const createParentByAdmin = async (payload) => {
  const res = await parentApi.createParentByAdmin(payload);
  return res.data;
};

export const createParentBySuperAdmin = async (payload) => {
  const res = await parentApi.createParentBySuperAdmin(payload);
  return res.data;
};

export const setDefaultGuardianByAdmin = async (payload) => {
  const res = await parentApi.setDefaultGuardianByAdmin(payload);
  return res.data;
}

export const setDefaultGuardianBySuperAdmin = async (payload) => {
  const res = await parentApi.setDefaultGuardianBySuperAdmin(payload);
  return res.data;
}

export async function getParentsByWarden(params) {
  const response = await parentApi.getParentsByWarden(params);
  return response.data;
}

const PARENT_FETCHERS = {
  [ROLES.ADMIN]: getParentsByAdmin,
  [ROLES.SUPER_ADMIN]: getParentsBySuperAdmin,
  [ROLES.WARDEN]: getParentsByWarden,
};

const PARENT_EXPORT_FETCHERS = {
  [ROLES.ADMIN]: exportParentsByAdmin,
  [ROLES.SUPER_ADMIN]: exportParentsBySuperAdmin,
}
const PARENT_UPDATE_FETCHERS = {
  [ROLES.ADMIN]: updateParentByAdmin,
  [ROLES.SUPER_ADMIN]: updateParentBySuperAdmin,
};

const PARENT_EMAIL_CHANGE_FETCHERS = {
  [ROLES.ADMIN]: changeParentEmailByAdmin,
  [ROLES.SUPER_ADMIN]: changeParentEmailBySuperAdmin,
};

const PARENT_STATUS_TOGGLE_FETCHERS = {
  [ROLES.ADMIN]: toggleStatusByAdmin,
  [ROLES.SUPER_ADMIN]: toggleStatusBySuperAdmin,
};

const PARENT_CREATE_FETCHERS = {
  [ROLES.ADMIN]: createParentByAdmin,
  [ROLES.SUPER_ADMIN]: createParentBySuperAdmin,
};


const DEFAULT_GUARDIAN_FETCHERS = {
  [ROLES.ADMIN]: setDefaultGuardianByAdmin,
  [ROLES.SUPER_ADMIN]: setDefaultGuardianBySuperAdmin,
};

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

export const getParents = createRoleResolver(PARENT_FETCHERS, 'parent');

export const updateParentByRole = createRoleResolver(
  PARENT_UPDATE_FETCHERS,
  'parent update'
);

export const changeParentEmail = createRoleResolver(
  PARENT_EMAIL_CHANGE_FETCHERS,
  'parent email change'
);


export const createParent = createRoleResolver(
  PARENT_CREATE_FETCHERS,
  "parent create"
);

export const setDefaultGuardian =
  createRoleResolver(
    DEFAULT_GUARDIAN_FETCHERS,
    "set default guardian"
  );

export async function getParentDashboardStats() {
  const response = await parentApi.getParentDashboardStats();
  return response.data;
}

const parentService = {
  getParentDashboardStats,
  createParent,
  updateParent,
  updateParentByRole,
  changeParentEmail,
  changeParentEmailByAdmin,
  changeParentEmailBySuperAdmin,
  updateParentByAdmin,
  updateParentBySuperAdmin,
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
