import api from '@/services/axios';

const BASE_URL = '/visitor'

export const visitorApi = {
    // 1. Create Visitor Profile
    createVisitorProfile: (payload) => api.post(`${BASE_URL}/parent/visitors`, payload),

    // Update Visitor Profile
    updateVisitorProfile: (visitorId, payload) => api.patch(`${BASE_URL}/parent/visitors/${visitorId}`, payload),

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

    // 7. Update Visitor Status (used for soft delete)
    updateVisitorStatus: (visitorId, status) => api.patch(`${BASE_URL}/${visitorId}/status`, { status }),

    // Methods mapped for backward compatibility with current UI implementation
    getVisitors: (params) => api.get(BASE_URL, { params }),
    getAggregatedVisitors: (params) => api.get(BASE_URL, { params }),

    // Visit Management
    checkInVisitor: (payload) => api.post(`${BASE_URL}/check-in`, payload),
    addStudentsToVisit: (visitId, payload) => api.patch(`${BASE_URL}/${visitId}/students`, payload),
    getSuperAdminHostelVisits: (params) => api.get(`${BASE_URL}/super-admin/visitor-visits/hostels`, { params }),
    getSuperAdminHostelVisitors: (params) => api.get(`${BASE_URL}/super-admin/visitors/hostels`, { params }),
    listVisitorVisits: (params) => api.get(`${BASE_URL}/visitor-visits`, { params }),
    getVisitDetails: (visitId) => api.get(`${BASE_URL}/visitor-visits/${visitId}`),

    // Get Visitor Profile Details
    getVisitorDetails: (visitorId) => api.get(`${BASE_URL}/${visitorId}`),

    // Dashboard Summary
    getDashboardSummary: () => api.get(`${BASE_URL}/dashboard-summary`),

    // V2 Parent Endpoints
    createVisitorProfileV2: (studentId, payload) => api.post(`/parent/students/${studentId}/visitors`, payload),
    updateVisitorProfileV2: (studentId, visitorId, payload) => api.patch(`/parent/students/${studentId}/visitors/${visitorId}`, payload),
    getParentVisitorsV2: (studentId, params) => api.get(`/parent/students/${studentId}/visitors`, { params }),
    getVisitorDetailsParentV2: (studentId, visitorId) => api.get(`/parent/students/${studentId}/visitors/${visitorId}`),
    reuseVisitorProfileV2: (studentId, visitorId, payload) => api.post(`/parent/students/${studentId}/visitors/${visitorId}/visit-requests`, payload),
    unassignVisitorV2: (studentId, visitorId) => api.patch(`/parent/students/${studentId}/visitors/${visitorId}/unassign`),

    // VisitRequest Granular Approvals
    approveVisitRequest: (visitRequestId) => api.patch(`${BASE_URL}/visit-requests/${visitRequestId}/approve`),
    rejectVisitRequest: (visitRequestId, payload) => api.patch(`${BASE_URL}/visit-requests/${visitRequestId}/reject`, payload),

    // Blacklist (Super Admin)
    blacklistVisitor: (visitorId, payload) => api.patch(`${BASE_URL}/super-admin/visitors/${visitorId}/blacklist`, payload),
    removeBlacklistVisitor: (visitorId, payload) => api.patch(`${BASE_URL}/super-admin/visitors/${visitorId}/remove-blacklist`, payload),
};

export default visitorApi;
