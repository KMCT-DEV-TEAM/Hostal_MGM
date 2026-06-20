import api from './api';

export const getNotifications = async (params) => {
    const response = await api.get('/notifications', { params });
    return response.data;
};

export const markAsRead = async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
};

export const markAllAsRead = async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
};

export const deleteNotification = async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
};

export const createNotification = async (payload) => {
    const response = await api.post('/notifications', payload);
    return response.data;
};
