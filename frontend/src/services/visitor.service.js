import visitorApi from '@/features/visitors/api/visitorApi';

/**
 * Parent Endpoints
 */
export async function createVisitorProfile(payload) {
    const { studentId, ...restPayload } = payload;
    const response = await visitorApi.createVisitorProfileV2(studentId, restPayload);
    return response.data;
}

export async function reuseVisitorProfile(payload) {
    const { studentId, visitorId, ...restPayload } = payload;
    const response = await visitorApi.reuseVisitorProfileV2(studentId, visitorId, restPayload);
    return response.data;
}

export async function updateVisitorProfile(visitorId, payload) {
    const { studentId, ...restPayload } = payload;
    const response = await visitorApi.updateVisitorProfileV2(studentId, visitorId, restPayload);
    return response.data;
}

export async function getParentVisitors(params) {
    const { studentId, ...restParams } = params;
    const response = await visitorApi.getParentVisitorsV2(studentId, restParams);
    return response.data;
}

export async function unassignVisitor(studentId, visitorId) {
    const response = await visitorApi.unassignVisitorV2(studentId, visitorId);
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

export async function approveVisitRequest(visitRequestId) {
    const response = await visitorApi.approveVisitRequest(visitRequestId);
    return response.data;
}

export async function rejectVisitRequest(visitRequestId, reason) {
    const response = await visitorApi.rejectVisitRequest(visitRequestId, { reason });
    return response.data;
}

export async function updateVisitorStatus(visitorId, status) {
    const response = await visitorApi.updateVisitorStatus(visitorId, status);
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

export async function getSuperAdminHostelVisitors(params) {
    const response = await visitorApi.getSuperAdminHostelVisitors(params);
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

export async function getVisitorDetails(visitorId) {
    const response = await visitorApi.getVisitorDetails(visitorId);
    return response.data;
}

export async function getVisitorDetailsParent(visitorId, studentId) {
    const response = await visitorApi.getVisitorDetailsParentV2(studentId, visitorId);
    return response.data;
}

export async function getDashboardSummary() {
    const response = await visitorApi.getDashboardSummary();
    return response.data;
}

export async function blacklistVisitor(visitorId, reason) {
    const response = await visitorApi.blacklistVisitor(visitorId, { reason });
    return response.data;
}

export async function removeBlacklistVisitor(visitorId, reason) {
    const response = await visitorApi.removeBlacklistVisitor(visitorId, { reason });
    return response.data;
}
