import apiClient from "./axios";

const createComplaint = async (data) => {
    const response = await apiClient.post('/complaints', data);
    return response.data;
};

const getMyComplaints = async () => {
    const response = await apiClient.get('/complaints/my-complaints');
    return response.data;
};

const getAllComplaints = async (params = {}) => {
    const response = await apiClient.get('/complaints', { params });
    return response.data;
};

const updateComplaintStatus = async (id, status, message) => {
    const response = await apiClient.patch(`/complaints/${id}/status`, { status, message });
    return response.data;
};

const updateComplaint = async (id, data) => {
    const response = await apiClient.put(`/complaints/${id}`, data);
    return response.data;
};

const assignComplaintStaff = async (id, staffId) => {
    const response = await apiClient.patch(`/complaints/${id}/assign`, { staffId });
    return response.data;
};

const deleteComplaint = async (id) => {
    const response = await apiClient.delete(`/complaints/${id}`);
    return response.data;
};

const getAssignedComplaints = async (params = {}) => {
    const response = await apiClient.get('/complaints/assigned', { params });
    return response.data;
};

const submitComplaintResolution = async (id, data) => {
    const response = await apiClient.patch(`/complaints/${id}/resolve-request`, data);
    return response.data;
};

const approveComplaintResolution = async (id) => {
    const response = await apiClient.patch(`/complaints/${id}/approve-resolution`);
    return response.data;
};

const rejectComplaintResolution = async (id, rejectNote) => {
    const response = await apiClient.patch(`/complaints/${id}/reject-resolution`, { rejectNote });
    return response.data;
};

const ComplaintService = {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    updateComplaintStatus,
    updateComplaint,
    assignComplaintStaff,
    deleteComplaint,
    getAssignedComplaints,
    submitComplaintResolution,
    approveComplaintResolution,
    rejectComplaintResolution
};

export default ComplaintService;
