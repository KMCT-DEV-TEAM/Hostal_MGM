import studentApi from '@/features/dashboard/api/studentApi';
import { ROLES } from '@/constants/roles';
import { createRoleResolver } from '@/utils/createRoleResolver';

/**
 * Create a new Student
 * @param {Object} payload 
 */
export async function createStudent(payload) {
  const response = await studentApi.createStudent(payload);
  return response.data;
}

/**
 * Update Student details
 * @param {string} id
 * @param {Object} payload
 */
export async function updateStudent(id, payload) {
  const response = await studentApi.updateStudent(id, payload);
  return response.data;
}

/**
 * Fetch a list of Students for Admin
 * @param {Object} params - e.g. { page: 1, limit: 10 }
 */
export async function getStudentsByAdmin(params) {
  const response = await studentApi.getStudentsByAdmin(params);
  return response.data;
}


//-----super-admin api -----

/**
 * Fetch a list of Students for Super Admin
 * @param {Object} params - e.g. { page: 1, limit: 10 }
 */
export async function getStudentsBySuperAdmin(params) {
  const response = await studentApi.getStudentsBySuperAdmin(params);
  return response.data;
}

export async function getStudentFilterOptionsByAdmin(params) {
  const response = await studentApi.getStudentFilterOptionsByAdmin(params);
  return response.data;
}

export async function getStudentFilterOptionsBySuperAdmin(params) {
  const response = await studentApi.getStudentFilterOptionsBySuperAdmin(params);
  return response.data;
}

export async function getStudentFilterOptionsByWarden(params) {
  const response = await studentApi.getStudentFilterOptionsByWarden(params);
  return response.data;
}

/**
 * Toggle Student active/inactive status for Admin
 * @param {string} id
 */
export async function toggleStatusByAdmin(id) {
  const response = await studentApi.toggleStatusByAdmin(id);
  return response.data;
}

export async function bulkStatusByAdmin({ ids, isActive }) {
  const response = await studentApi.bulkStatusByAdmin({ ids, isActive });
  return response.data;
}

/**
 * Toggle Student active/inactive status for Super Admin
 * @param {string} id
 */
export async function toggleStatusBySuperAdmin(id) {
  const response = await studentApi.toggleStatusBySuperAdmin(id);
  return response.data;
}

export async function bulkStatusBySuperAdmin({ ids, isActive }) {
  const response = await studentApi.bulkStatusBySuperAdmin({ ids, isActive });
  return response.data;
}

const STUDENT_FETCHERS = {
  [ROLES.ADMIN]: getStudentsByAdmin,
  [ROLES.SUPER_ADMIN]: getStudentsBySuperAdmin,
  // warden: getStudentsByWarden,
};

const STUDENT_FILTER_OPTION_FETCHERS = {
  [ROLES.ADMIN]: getStudentFilterOptionsByAdmin,
  [ROLES.SUPER_ADMIN]: getStudentFilterOptionsBySuperAdmin,
  [ROLES.WARDEN]: getStudentFilterOptionsByWarden,
};

const STUDENT_STATUS_TOGGLE_FETCHERS = {
  [ROLES.ADMIN]: toggleStatusByAdmin,
  [ROLES.SUPER_ADMIN]: toggleStatusBySuperAdmin,
};

const STUDENT_BULK_STATUS_FETCHERS = {
  [ROLES.ADMIN]: bulkStatusByAdmin,
  [ROLES.SUPER_ADMIN]: bulkStatusBySuperAdmin,
};

export const getStudents = createRoleResolver(STUDENT_FETCHERS, 'student');

export const getStudentFilterOptions = createRoleResolver(
  STUDENT_FILTER_OPTION_FETCHERS,
  'student filter option'
);

export const toggleStudentStatus = createRoleResolver(
  STUDENT_STATUS_TOGGLE_FETCHERS,
  'student status toggle'
);

export const bulkUpdateStudentStatus = createRoleResolver(
  STUDENT_BULK_STATUS_FETCHERS,
  'student bulk status'
);

const studentService = {
  createStudent,
  updateStudent,
  getStudents,
  getStudentsByAdmin,
  getStudentsBySuperAdmin,
  getStudentFilterOptions,
  getStudentFilterOptionsByAdmin,
  getStudentFilterOptionsBySuperAdmin,
  getStudentFilterOptionsByWarden,
  toggleStudentStatus,
  bulkUpdateStudentStatus,
  toggleStatusByAdmin,
  bulkStatusByAdmin,
  toggleStatusBySuperAdmin,
  bulkStatusBySuperAdmin,
};

export default studentService;
