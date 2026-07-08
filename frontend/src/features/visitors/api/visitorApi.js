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
    checkInVisitor: (payload) => api.post(`${BASE_URL}/parent/visitors`, payload), // Temporary placeholder
};

export default visitorApi;
