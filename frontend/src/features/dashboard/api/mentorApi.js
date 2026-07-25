import api from '@/services/axios';

const getPrefix = (role) => {
    return role === 'super_admin' ? '/super-admin' : '/admin';
};

const mentorApi = {
    createMentor: (role, payload) =>
        api.post(`${getPrefix(role)}/mentors`, payload),

    getMentors: (role, params) =>
        api.get(`${getPrefix(role)}/mentors`, { params }),

    getMentorOrganizations: (role, params) =>
        api.get(`${getPrefix(role)}/mentors/organizations`, { params }),

    getMentorById: (role, id) =>
        api.get(`${getPrefix(role)}/mentors/${id}`),

    updateMentor: (role, id, payload) =>
        api.patch(`${getPrefix(role)}/mentors/${id}`, payload),

    updateMentorStatus: (role, id, payload) =>
        api.patch(`${getPrefix(role)}/mentors/${id}/status`, payload),

    deleteMentor: (role, id) =>
        api.delete(`${getPrefix(role)}/mentors/${id}`),

    // Mentor Assignments
    assignMentor: (payload) =>
        api.post(`/mentor-assignments`, payload),

    getMentorAssignments: (params) =>
        api.get(`/mentor-assignments`, { params }),

    getMentorAssignmentById: (id) =>
        api.get(`/mentor-assignments/${id}`),

    updateMentorAssignment: (id, payload) =>
        api.patch(`/mentor-assignments/${id}`, payload),

    transferMentor: (id, payload) =>
        api.post(`/mentor-assignments/${id}/transfer`, payload),

    endMentorAssignment: (id) =>
        api.patch(`/mentor-assignments/${id}/release`),
};

export default mentorApi;
