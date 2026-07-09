import api from '@/services/axios';

const BASE_URL = '/visitor'

export const visitorApi = {
    // 1. Create Visitor Profile
    createVisitorProfile: (payload) => api.post(`${BASE_URL}/parent/visitors`, payload),

    // 2. List Parent Visitors
    getParentVisitors: (params) => api.get(`${BASE_URL}/parent/visitors`, { params }),

    // 3. List Student Visitors
    getStudentVisitors: (params) => api.get(`${BASE_URL}/student/visitors`, { params }),

    // 4. List All Visitors (Management)
    getAllVisitors: (params) => api.get(BASE_URL, { params }),

    // 5. Approve Visitor
    approveVisitor: (visitorId) => api.patch(`${BASE_URL}/${visitorId}/approve`),

    // 6. Reject Visitor
    rejectVisitor: (visitorId, payload) => api.patch(`${BASE_URL}/${visitorId}/reject`, payload),

    // Methods mapped for backward compatibility with current UI implementation
    getVisitors: (params) => api.get(BASE_URL, { params }),
    getAggregatedVisitors: (params) => api.get(BASE_URL, { params }),

    // Visit Management
    checkInVisitor: (payload) => api.post(`${BASE_URL}/warden/visits/check-in`, payload),
    getSuperAdminHostelVisits: (params) => api.get(`${BASE_URL}/super-admin/visitor-visits/hostels`, { params }),
    listVisitorVisits: (params) => api.get(`${BASE_URL}/visitor-visits`, { params }),
    getVisitDetails: (visitId) => api.get(`${BASE_URL}/visitor-visits/${visitId}`),
    
    // Get Visitor Profile Details
    getVisitorDetails: (visitorId) => api.get(`${BASE_URL}/${visitorId}`),
};

export default visitorApi;
