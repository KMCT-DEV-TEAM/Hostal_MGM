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

const ComplaintService = {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    updateComplaintStatus,
    updateComplaint,
    assignComplaintStaff,
    deleteComplaint
};

export default ComplaintService;
