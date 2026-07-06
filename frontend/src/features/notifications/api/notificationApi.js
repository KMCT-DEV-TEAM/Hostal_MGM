import apiClient from '@/services/axios';

const API_BASE_URL = '/notifications';

const getMyNotifications = (params) => apiClient.get(`${API_BASE_URL}`, { params });
const createNotification = (data) => apiClient.post(`${API_BASE_URL}`, data);
const testBroadcast = (data) => apiClient.post(`${API_BASE_URL}/broadcast`, data);
const testNotification = (data) => apiClient.post(`${API_BASE_URL}/test`, data);
const markAllAsRead = () => apiClient.patch(`${API_BASE_URL}/read-all`);
const markAsRead = (id) => apiClient.patch(`${API_BASE_URL}/${id}/read`);
const deleteNotification = (id) => apiClient.delete(`${API_BASE_URL}/${id}`);

const notificationApi = {
    getMyNotifications,
    createNotification,
    testBroadcast,
    testNotification,
    markAllAsRead,
    markAsRead,
    deleteNotification
};

export default notificationApi;
