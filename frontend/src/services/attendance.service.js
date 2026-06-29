import attendanceApi from '@/features/dashboard/api/attendanceApi';
import { ROLES } from '@/constants/roles';
import { createRoleResolver } from '@/utils/createRoleResolver';

export async function getWindowsByWarden(params) {
    const response = await attendanceApi.getWindowsByWarden(params);
    return response.data;
}

export async function getDashboardStatsByWarden(params) {
    const response = await attendanceApi.getDashboardStatsByWarden(params);
    return response.data;
}

export async function createWindowsByWarden() {
    const response = await attendanceApi.createWindowsByWarden();
    return response.data;
}

export async function getWindowsByAdmin(params) {
    const response = await attendanceApi.getWindowsByAdmin(params);
    return response.data;
}

export async function getDashboardStatsByAdmin(params) {
    const response = await attendanceApi.getDashboardStatsByAdmin(params);
    return response.data;
}

export async function getWindowsBySuperAdmin(params) {
    const response = await attendanceApi.getWindowsBySuperAdmin(params);
    return response.data;
}

export async function getDashboardStatsBySuperAdmin(params) {
    const response = await attendanceApi.getDashboardStatsBySuperAdmin(params);
    return response.data;
}

export async function getStudentDashboard() {
    const response = await attendanceApi.getStudentDashboard();
    return response.data;
}

export async function getParentDashboard() {
    const response = await attendanceApi.getParentDashboard();
    return response.data;
}

const ATTENDANCE_WINDOWS_FETCHERS = {
    [ROLES.WARDEN]: getWindowsByWarden,
    [ROLES.ADMIN]: getWindowsByAdmin,
    [ROLES.SUPER_ADMIN]: getWindowsBySuperAdmin,
};

const ATTENDANCE_DASHBOARD_STATS_FETCHERS = {
    [ROLES.WARDEN]: getDashboardStatsByWarden,
    [ROLES.ADMIN]: getDashboardStatsByAdmin,
    [ROLES.SUPER_ADMIN]: getDashboardStatsBySuperAdmin,
};

const ATTENDANCE_DASHBOARD_FETCHERS = {
    [ROLES.STUDENT]: getStudentDashboard,
    [ROLES.PARENT]: getParentDashboard,
};

const ATTENDANCE_CREATE_WINDOW_FETCHERS = {
    [ROLES.WARDEN]: createWindowsByWarden,
};

export const getWindowsByRole = createRoleResolver(ATTENDANCE_WINDOWS_FETCHERS, 'attendance windows');
export const getAdminWardenDashboardStatsByRole = createRoleResolver(ATTENDANCE_DASHBOARD_STATS_FETCHERS, 'admin warden dashboard stats');
export const getDashboardStatsByRole = createRoleResolver(ATTENDANCE_DASHBOARD_FETCHERS, 'attendance dashboard stats');
export const createWindowByRole = createRoleResolver(ATTENDANCE_CREATE_WINDOW_FETCHERS, 'create attendance window');

const attendanceService = {
    getWindowsByRole,
    getAdminWardenDashboardStatsByRole,
    getDashboardStatsByRole,
    createWindowByRole,
    // Add additional resolved functions below when needed
};

export default attendanceService;
