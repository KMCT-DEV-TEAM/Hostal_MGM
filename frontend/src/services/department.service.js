import apiClient from "./axios";

const getDepartments = async (params) => {
  const response = await apiClient.get('/Departments', { params });
  return response.data;
};

const createDepartment = async (data) => {
  const response = await apiClient.post('/Departments', data);
  return response.data;
};

const updateDepartment = async (id, data) => {
  const response = await apiClient.put(`/Departments/${id}`, data);
  return response.data;
};

const toggleStatus = async (id) => {
  const response = await apiClient.patch(`/Departments/${id}/status`);
  return response.data;
};

const bulkToggleStatus = async (data) => {
  const response = await apiClient.put('/Departments/bulk-status', data);
  return response.data;
};

export default {
  getDepartments,
  createDepartment,
  updateDepartment,
  toggleStatus,
  bulkToggleStatus,
};

