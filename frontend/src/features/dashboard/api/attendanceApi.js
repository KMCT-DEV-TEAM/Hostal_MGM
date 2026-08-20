import apiClient from '@/services/axios';

// --- WARDEN API ---
export const getWindowsByWarden = (params) => apiClient.get('/attendance/windows', { params });
export const getDashboardStatsByWarden = (params) => apiClient.get('/attendance/stats', { params });
export const createWindowsByWarden = () => apiClient.post('/attendance/window');
export const getWindowDetailsByWarden = (id) => apiClient.get(`/attendance/windows/${id}`);
export const getRecordsByWarden = (id, params) => apiClient.get(`/attendance/windows/${id}/records`, { params });

export const scanStudentByWarden = (id, data) => apiClient.post(`/attendance/windows/${id}/scan`, data);
export const completeWindowByWarden = (id) => apiClient.patch(`/attendance/windows/${id}/complete`);
export const getStudentCalendarByWarden = (params) => apiClient.get('/attendance/student-calendar', { params });
export const correctAttendanceByWarden = (windowId, studentId, data) => apiClient.patch(`/attendance/windows/${windowId}/students/${studentId}`, data);

// --- ADMIN API ---
export const getWindowsByAdmin = (params) => apiClient.get('/attendance/windows', { params });
export const getDashboardStatsByAdmin = (params) => apiClient.get('/attendance/stats', { params });
export const getWindowDetailsByAdmin = (id) => apiClient.get(`/attendance/windows/${id}`);
export const getRecordsByAdmin = (id, params) => apiClient.get(`/attendance/windows/${id}/records`, { params });
export const getStudentCalendarByAdmin = (params) => apiClient.get('/attendance/student-calendar', { params });

// --- SUPER ADMIN API ---
export const getWindowsBySuperAdmin = (params) => apiClient.get('/attendance/windows', { params });
export const getDashboardStatsBySuperAdmin = (params) => apiClient.get('/attendance/stats', { params });
export const getWindowDetailsBySuperAdmin = (id) => apiClient.get(`/attendance/windows/${id}`);
export const getRecordsBySuperAdmin = (id, params) => apiClient.get(`/attendance/windows/${id}/records`, { params });
export const getStudentCalendarBySuperAdmin = (params) => apiClient.get('/attendance/student-calendar', { params });

// --- STUDENT API ---
export const getStudentDashboard = () => apiClient.get('/attendance/dashboard/student');
export const getStudentHistory = (params) => apiClient.get('/attendance/history/student', { params });
export const getStudentCalendar = (params) => apiClient.get('/attendance/student-calendar', { params });
export const getStudentDetails = (date) => apiClient.get(`/student/attendance/details/${date}`);

// --- PARENT API ---
export const getParentDashboard = () => apiClient.get('/attendance/dashboard/student');
export const getParentHistory = (params) => apiClient.get('/attendance/history/student', { params });
export const getParentCalendar = (params) => apiClient.get('/attendance/student-calendar', { params });
export const getParentDetails = (date) => apiClient.get(`/parent/attendance/details/${date}`);

// --- MENTOR API ---
export const getWindowsByMentor = (params) => apiClient.get('/attendance/windows', { params });
export const getDashboardStatsByMentor = (params) => apiClient.get('/attendance/stats', { params });
export const getWindowDetailsByMentor = (id) => apiClient.get(`/attendance/windows/${id}`);
export const getRecordsByMentor = (id, params) => apiClient.get(`/attendance/windows/${id}/records`, { params });
export const getStudentCalendarByMentor = (params) => apiClient.get('/attendance/student-calendar', { params });

// ---------------------------
// Parent V2 (Multi Student)
// ---------------------------

export const getParentDashboardV2 = (studentId) =>
    apiClient.get(`/attendance/dashboard/student/${studentId}`);

export const getParentHistoryV2 = (studentId, params) =>
    apiClient.get(`/attendance/history/student/${studentId}`, {
        params,
    });

export const getParentCalendarV2 = (studentId, params) =>
    apiClient.get(`/attendance/student-calendar`, {
        params: { ...params, studentId },
    });

export const getParentDetailsV2 = (studentId, date) =>
    apiClient.get(
        `/parent/students/${studentId}/attendance/details/${date}`
    );

const attendanceApi = {
    getWindowsByWarden, getDashboardStatsByWarden, createWindowsByWarden, getWindowDetailsByWarden, getRecordsByWarden, scanStudentByWarden, completeWindowByWarden, getStudentCalendarByWarden, correctAttendanceByWarden,
    getWindowsByAdmin, getDashboardStatsByAdmin, getWindowDetailsByAdmin, getRecordsByAdmin, getStudentCalendarByAdmin,
    getWindowsBySuperAdmin, getDashboardStatsBySuperAdmin, getWindowDetailsBySuperAdmin, getRecordsBySuperAdmin, getStudentCalendarBySuperAdmin,
    getStudentDashboard, getStudentHistory, getStudentCalendar, getStudentDetails,
    getParentDashboard, getParentHistory, getParentCalendar, getParentDetails,
    getWindowsByMentor, getDashboardStatsByMentor, getWindowDetailsByMentor, getRecordsByMentor, getStudentCalendarByMentor,

    getParentDashboard,
    getParentHistory,
    getParentCalendar,
    getParentDetails,

    getParentDashboardV2,
    getParentHistoryV2,
    getParentCalendarV2,
    getParentDetailsV2,
};

export default attendanceApi;
