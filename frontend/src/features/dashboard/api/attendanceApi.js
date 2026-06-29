import apiClient from '@/services/axios';

// --- WARDEN API ---
export const getWindowsByWarden = (params) => apiClient.get('/warden/attendance/windows', { params });
export const getDashboardStatsByWarden = (params) => apiClient.get('/warden/attendance/stats', { params });
export const createWindowsByWarden = () => apiClient.post('/warden/attendance/windows');
export const getWindowDetailsByWarden = (id) => apiClient.get(`/warden/attendance/windows/${id}`);
export const getRecordsByWarden = (id, params) => apiClient.get(`/warden/attendance/windows/${id}/records`, { params });
export const scanStudentByWarden = (id, data) => apiClient.post(`/warden/attendance/windows/${id}/scan`, data);
export const completeWindowByWarden = (id) => apiClient.patch(`/warden/attendance/windows/${id}/complete`);

// --- ADMIN API ---
export const getWindowsByAdmin = (params) => apiClient.get('/admin/attendance/windows', { params });
export const getDashboardStatsByAdmin = (params) => apiClient.get('/admin/attendance/stats', { params });
export const getWindowDetailsByAdmin = (id) => apiClient.get(`/admin/attendance/windows/${id}`);
export const getRecordsByAdmin = (id, params) => apiClient.get(`/admin/attendance/windows/${id}/records`, { params });

// --- SUPER ADMIN API ---
export const getWindowsBySuperAdmin = (params) => apiClient.get('/super-admin/attendance/windows', { params });
export const getDashboardStatsBySuperAdmin = (params) => apiClient.get('/super-admin/attendance/stats', { params });
export const getWindowDetailsBySuperAdmin = (id) => apiClient.get(`/super-admin/attendance/windows/${id}`);
export const getRecordsBySuperAdmin = (id, params) => apiClient.get(`/super-admin/attendance/windows/${id}/records`, { params });

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

const attendanceApi = {
    getWindowsByWarden, getDashboardStatsByWarden, createWindowsByWarden, getWindowDetailsByWarden, getRecordsByWarden, scanStudentByWarden, completeWindowByWarden,
    getWindowsByAdmin, getDashboardStatsByAdmin, getWindowDetailsByAdmin, getRecordsByAdmin,
    getWindowsBySuperAdmin, getDashboardStatsBySuperAdmin, getWindowDetailsBySuperAdmin, getRecordsBySuperAdmin,
    getStudentDashboard, getStudentHistory, getStudentCalendar, getStudentDetails,
    getParentDashboard, getParentHistory, getParentCalendar, getParentDetails
};

export default attendanceApi;
