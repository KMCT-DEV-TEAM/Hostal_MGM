import apiClient from '@/services/axios';

// --- WARDEN API ---
export const getWindowsByWarden = (params) => apiClient.get('/warden/attendance/windows', { params });
export const getDashboardStatsByWarden = (params) => apiClient.get('/warden/attendance/stats', { params });
export const createWindowsByWarden = () => apiClient.post('/warden/attendance/windows');
export const getWindowDetailsByWarden = (id) => apiClient.get(`/warden/attendance/windows/${id}`);
export const getRecordsByWarden = (id, params) => apiClient.get(`/warden/attendance/windows/${id}/records`, { params });

export const scanStudentByWarden = (id, data) => apiClient.post(`/warden/attendance/windows/${id}/scan`, data);
export const completeWindowByWarden = (id) => apiClient.patch(`/warden/attendance/windows/${id}/complete`);
export const getStudentCalendarByWarden = (params) => apiClient.get('/warden/attendance/student-calendar', { params });
export const correctAttendanceByWarden = (windowId, studentId, data) => apiClient.patch(`/warden/attendance/windows/${windowId}/students/${studentId}`, data);

// --- ADMIN API ---
export const getWindowsByAdmin = (params) => apiClient.get('/admin/attendance/windows', { params });
export const getDashboardStatsByAdmin = (params) => apiClient.get('/admin/attendance/stats', { params });
export const getWindowDetailsByAdmin = (id) => apiClient.get(`/admin/attendance/windows/${id}`);
export const getRecordsByAdmin = (id, params) => apiClient.get(`/admin/attendance/windows/${id}/records`, { params });
export const getStudentCalendarByAdmin = (params) => apiClient.get('/admin/attendance/student-calendar', { params });

// --- SUPER ADMIN API ---
export const getWindowsBySuperAdmin = (params) => apiClient.get('/super-admin/attendance/windows', { params });
export const getDashboardStatsBySuperAdmin = (params) => apiClient.get('/super-admin/attendance/stats', { params });
export const getWindowDetailsBySuperAdmin = (id) => apiClient.get(`/super-admin/attendance/windows/${id}`);
export const getRecordsBySuperAdmin = (id, params) => apiClient.get(`/super-admin/attendance/windows/${id}/records`, { params });
export const getStudentCalendarBySuperAdmin = (params) => apiClient.get('/super-admin/attendance/student-calendar', { params });

// --- STUDENT API ---
export const getStudentDashboard = () => apiClient.get('/student/attendance/dashboard');
export const getStudentHistory = (params) => apiClient.get('/student/attendance', { params });
export const getStudentCalendar = (params) => apiClient.get('/student/attendance/calendar', { params });
export const getStudentDetails = (date) => apiClient.get(`/student/attendance/details/${date}`);

// --- PARENT API ---
export const getParentDashboard = () => apiClient.get('/parent/attendance/dashboard');
export const getParentHistory = (params) => apiClient.get('/parent/attendance', { params });
export const getParentCalendar = (params) => apiClient.get('/parent/attendance/calendar', { params });
export const getParentDetails = (date) => apiClient.get(`/parent/attendance/details/${date}`);

// --- MENTOR API ---
export const getWindowsByMentor = (params) => apiClient.get('/mentor/attendance/windows', { params });
export const getDashboardStatsByMentor = (params) => apiClient.get('/mentor/attendance/stats', { params });
export const getWindowDetailsByMentor = (id) => apiClient.get(`/mentor/attendance/windows/${id}`);
export const getRecordsByMentor = (id, params) => apiClient.get(`/mentor/attendance/windows/${id}/records`, { params });
export const getStudentCalendarByMentor = (params) => apiClient.get('/mentor/attendance/student-calendar', { params });

const attendanceApi = {
    getWindowsByWarden, getDashboardStatsByWarden, createWindowsByWarden, getWindowDetailsByWarden, getRecordsByWarden, scanStudentByWarden, completeWindowByWarden, getStudentCalendarByWarden, correctAttendanceByWarden,
    getWindowsByAdmin, getDashboardStatsByAdmin, getWindowDetailsByAdmin, getRecordsByAdmin, getStudentCalendarByAdmin,
    getWindowsBySuperAdmin, getDashboardStatsBySuperAdmin, getWindowDetailsBySuperAdmin, getRecordsBySuperAdmin, getStudentCalendarBySuperAdmin,
    getStudentDashboard, getStudentHistory, getStudentCalendar, getStudentDetails,
    getParentDashboard, getParentHistory, getParentCalendar, getParentDetails,
    getWindowsByMentor, getDashboardStatsByMentor, getWindowDetailsByMentor, getRecordsByMentor, getStudentCalendarByMentor
};

export default attendanceApi;
