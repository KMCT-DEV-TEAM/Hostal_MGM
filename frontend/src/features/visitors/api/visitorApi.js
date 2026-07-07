import api from '@/services/axios';

export const visitorApi = {
    // 1. Create Visitor Profile
    createVisitorProfile: (payload) => api.post("/visitors/parent/visitors", payload),
    
    // 2. List Parent Visitors
    getParentVisitors: (params) => api.get("/visitors/parent/visitors", { params }),

    // 3. List Student Visitors
    getStudentVisitors: (params) => api.get("/visitors/student/visitors", { params }),

    // 4. List All Visitors (Management)
    getAllVisitors: (params) => api.get("/visitors", { params }),

    // 5. Approve Visitor
    approveVisitor: (visitorId) => api.patch(`/visitors/${visitorId}/approve`),

    // 6. Reject Visitor
    rejectVisitor: (visitorId, payload) => api.patch(`/visitors/${visitorId}/reject`, payload),
    
    // Methods mapped for backward compatibility with current UI implementation
    getVisitors: (params) => api.get("/visitors", { params }),
    getAggregatedVisitors: (params) => api.get("/visitors", { params }),
    checkInVisitor: (payload) => api.post("/visitors/parent/visitors", payload), // Temporary placeholder
};

export default visitorApi;
