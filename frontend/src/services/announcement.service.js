import api from './axios';

class AnnouncementService {
    async getAnnouncements(params) {
        try {
            const response = await api.get('/announcements', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }

    async createAnnouncement(data) {
        try {
            const response = await api.post('/announcements', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
}

export default new AnnouncementService();
