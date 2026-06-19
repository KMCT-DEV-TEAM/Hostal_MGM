import parentApi from '@/features/dashboard/api/parentApi';
import { ROLES } from '@/constants/roles';
import { createRoleResolver } from '@/utils/createRoleResolver';



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

export async function toggleStatusByAdmin(id) {
  const response = await parentApi.toggleStatusByAdmin(id);
  return response.data;
}

export async function toggleStatusBySuperAdmin(id) {
  const response = await parentApi.toggleStatusBySuperAdmin(id);
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

export const setDefaultGuardianByAdmin = async (payload ) => {
  const res = await parentApi.setDefaultGuardianByAdmin(payload);
  return res.data;
}

export const setDefaultGuardianBySuperAdmin = async (payload ) => {
  const res = await parentApi.setDefaultGuardianBySuperAdmin(payload);
  return res.data;
}

const PARENT_FETCHERS = {
  [ROLES.ADMIN]: getParentsByAdmin,
  [ROLES.SUPER_ADMIN]: getParentsBySuperAdmin,
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

export const toggleParentStatus = createRoleResolver(
  PARENT_STATUS_TOGGLE_FETCHERS,
  'parent status toggle'
);

export const getParents = createRoleResolver(PARENT_FETCHERS, 'parent');


export const createParent = createRoleResolver(
  PARENT_CREATE_FETCHERS,
  "parent create"
);

export const setDefaultGuardian =
  createRoleResolver(
    DEFAULT_GUARDIAN_FETCHERS,
    "set default guardian"
  );
const parentService = {
  createParent,
  updateParent,
  getParents,
  getParentsByAdmin,
  getParentsBySuperAdmin,
  toggleParentStatus,
  toggleStatusByAdmin,
  toggleStatusBySuperAdmin,
};

export default parentService;
