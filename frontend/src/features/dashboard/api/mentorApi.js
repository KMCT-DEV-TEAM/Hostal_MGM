import api from '@/services/axios';

const getPrefix = (role) => {
    return role === 'super_admin' ? '/super-admin' : '/admin';
};

const mentorApi = {
    createMentor: (role, payload) =>
        api.post(`${getPrefix(role)}/mentors`, payload),

    getMentors: (role, params) =>
        api.get(`${getPrefix(role)}/mentors`, { params }),

    getMentorById: (role, id) =>
        api.get(`${getPrefix(role)}/mentors/${id}`),

    updateMentor: (role, id, payload) =>
        api.patch(`${getPrefix(role)}/mentors/${id}`, payload),

    updateMentorStatus: (role, id, payload) =>
        api.patch(`${getPrefix(role)}/mentors/${id}/status`, payload),

    deleteMentor: (role, id) =>
        api.delete(`${getPrefix(role)}/mentors/${id}`),
};

export default mentorApi;
