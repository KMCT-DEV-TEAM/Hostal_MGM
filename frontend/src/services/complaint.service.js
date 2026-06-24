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

const ComplaintService = {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    updateComplaintStatus
};

export default ComplaintService;
