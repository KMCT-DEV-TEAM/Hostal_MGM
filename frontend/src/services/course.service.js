import apiClient from "./axios";

const getCourses = async (params) => {
  const response = await apiClient.get('/courses', { params });
  return response.data;
};

const createCourse = async (data) => {
  const response = await apiClient.post('/courses', data);
  return response.data;
};

const updateCourse = async (id, data) => {
  const response = await apiClient.put(`/courses/${id}`, data);
  return response.data;
};

const toggleStatus = async (id) => {
  const response = await apiClient.patch(`/courses/${id}/status`);
  return response.data;
};

const bulkToggleStatus = async (data) => {
  const response = await apiClient.put('/courses/bulk-status', data);
  return response.data;
};

export default {
  getCourses,
  createCourse,
  updateCourse,
  toggleStatus,
  bulkToggleStatus,
};
