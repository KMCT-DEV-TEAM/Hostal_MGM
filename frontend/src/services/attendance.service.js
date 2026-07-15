import attendanceApi, { scanStudentByWarden } from '@/features/dashboard/api/attendanceApi';
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



export async function getRecordsByWarden(id, params) {
    const response = await attendanceApi.getRecordsByWarden(id, params);
    return response.data;
}

export async function getStudentCalendarByWarden(params) {
    const response = await attendanceApi.getStudentCalendarByWarden(params);
    return response.data;
}

export async function correctAttendanceByWarden(windowId, studentId, data) {
    const response = await attendanceApi.correctAttendanceByWarden(windowId, studentId, data);
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

export async function getRecordsByAdmin(id, params) {
    const response = await attendanceApi.getRecordsByAdmin(id, params);
    return response.data;
}

export async function getStudentCalendarByAdmin(params) {
    const response = await attendanceApi.getStudentCalendarByAdmin(params);
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

export async function getRecordsBySuperAdmin(id, params) {
    const response = await attendanceApi.getRecordsBySuperAdmin(id, params);
    return response.data;
}

export async function getStudentCalendarBySuperAdmin(params) {
    const response = await attendanceApi.getStudentCalendarBySuperAdmin(params);
    return response.data;
}

export async function getStudentDashboard() {
    const response = await attendanceApi.getStudentDashboard();
    return response.data;
}

export async function getStudentHistory(params) {
    const response = await attendanceApi.getStudentHistory(params);
    return response.data;
}

export async function getStudentCalendar(params) {
    const response = await attendanceApi.getStudentCalendar(params);
    return response.data;
}

export async function getParentDashboard() {
    const response = await attendanceApi.getParentDashboard();
    return response.data;
}

export async function getParentHistory(params) {
    const response = await attendanceApi.getParentHistory(params);
    return response.data;
}

export async function getParentCalendar(params) {
    const response = await attendanceApi.getParentCalendar(params);
    return response.data;
}

const ATTENDANCE_WINDOWS_FETCHERS = {
    [ROLES.WARDEN]: getWindowsByWarden,
    [ROLES.ADMIN]: getWindowsByAdmin,
    [ROLES.SUPER_ADMIN]: getWindowsBySuperAdmin,
};

const ATTENDANCE_RECORDS_FETCHERS = {
    [ROLES.WARDEN]: getRecordsByWarden,
    [ROLES.ADMIN]: getRecordsByAdmin,
    [ROLES.SUPER_ADMIN]: getRecordsBySuperAdmin,
};

const ATTENDANCE_STUDENT_CALENDAR_FETCHERS = {
    [ROLES.WARDEN]: getStudentCalendarByWarden,
    [ROLES.ADMIN]: getStudentCalendarByAdmin,
    [ROLES.SUPER_ADMIN]: getStudentCalendarBySuperAdmin,
    [ROLES.STUDENT]: getStudentCalendar,
    [ROLES.PARENT]: getParentCalendar,
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

const ATTENDANCE_HISTORY_FETCHERS = {
    [ROLES.STUDENT]: getStudentHistory,
    [ROLES.PARENT]: getParentHistory,
};

const ATTENDANCE_CREATE_WINDOW_FETCHERS = {
    [ROLES.WARDEN]: createWindowsByWarden,
};



const ATTENDANCE_SCAN_STUDENT_FETCHERS = {
    [ROLES.WARDEN]: scanStudentByWarden,
};

const ATTENDANCE_CORRECT_FETCHERS = {
    [ROLES.WARDEN]: correctAttendanceByWarden,
};

export const getWindowsByRole = createRoleResolver(ATTENDANCE_WINDOWS_FETCHERS, 'attendance windows');
export const getRecordsByRole = createRoleResolver(ATTENDANCE_RECORDS_FETCHERS, 'attendance records');
export const getStudentCalendarByRole = createRoleResolver(ATTENDANCE_STUDENT_CALENDAR_FETCHERS, 'student calendar');
export const getAdminWardenDashboardStatsByRole = createRoleResolver(ATTENDANCE_DASHBOARD_STATS_FETCHERS, 'admin warden dashboard stats');
export const getDashboardStatsByRole = createRoleResolver(ATTENDANCE_DASHBOARD_FETCHERS, 'attendance dashboard stats');
export const getAttendanceHistoryByRole = createRoleResolver(ATTENDANCE_HISTORY_FETCHERS, 'attendance history');
export const createWindowByRole = createRoleResolver(ATTENDANCE_CREATE_WINDOW_FETCHERS, 'create attendance window');

export const scanStudentByRole = createRoleResolver(ATTENDANCE_SCAN_STUDENT_FETCHERS, 'scan student attendance');
export const correctAttendanceByRole = createRoleResolver(ATTENDANCE_CORRECT_FETCHERS, 'correct student attendance');

const attendanceService = {
    getWindowsByRole,
    getRecordsByRole,
    getStudentCalendarByRole,
    getAdminWardenDashboardStatsByRole,
    getDashboardStatsByRole,
    getAttendanceHistoryByRole,
    createWindowByRole,
    scanStudentByRole,
    correctAttendanceByRole
};

export default attendanceService;
