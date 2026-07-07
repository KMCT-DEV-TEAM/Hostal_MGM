import visitorApi from '@/features/visitors/api/visitorApi';

/**
 * Parent Endpoints
 */
export async function createVisitorProfile(payload) {
    const response = await visitorApi.createVisitorProfile(payload);
    return response.data;
}

export async function getParentVisitors(params) {
    const response = await visitorApi.getParentVisitors(params);
    return response.data;
}

/**
 * Student Endpoints
 */
export async function getStudentVisitors(params) {
    const response = await visitorApi.getStudentVisitors(params);
    return response.data;
}

/**
 * Management Endpoints (Super Admin, Admin, Warden)
 */
export async function getAllVisitors(params) {
    const response = await visitorApi.getAllVisitors(params);
    return response.data;
}

export async function approveVisitor(visitorId) {
    const response = await visitorApi.approveVisitor(visitorId);
    return response.data;
}

export async function rejectVisitor(visitorId, payload) {
    const response = await visitorApi.rejectVisitor(visitorId, payload);
    return response.data;
}
