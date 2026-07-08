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

/**
 * Visit Management Endpoints
 */
export async function checkInVisitor(payload) {
    const response = await visitorApi.checkInVisitor(payload);
    return response.data;
}

export async function getSuperAdminHostelVisits(params) {
    const response = await visitorApi.getSuperAdminHostelVisits(params);
    return response.data;
}

export async function listVisitorVisits(params) {
    const response = await visitorApi.listVisitorVisits(params);
    return response.data;
}

export async function getVisitDetails(visitId) {
    const response = await visitorApi.getVisitDetails(visitId);
    return response.data;
}
