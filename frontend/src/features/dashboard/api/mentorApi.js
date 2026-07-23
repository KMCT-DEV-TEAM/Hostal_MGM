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
    assignMentor: (role, payload) =>
        api.post(`${getPrefix(role)}/mentor-assignments`, payload),

    getMentorAssignments: (role, params) =>
        api.get(`${getPrefix(role)}/mentor-assignments`, { params }),

    getMentorAssignmentById: (role, id) =>
        api.get(`${getPrefix(role)}/mentor-assignments/${id}`),

    updateMentorAssignment: (role, id, payload) =>
        api.patch(`${getPrefix(role)}/mentor-assignments/${id}`, payload),

    transferMentor: (role, id, payload) =>
        api.post(`${getPrefix(role)}/mentor-assignments/${id}/transfer`, payload),

    endMentorAssignment: (role, id) =>
        api.patch(`${getPrefix(role)}/mentor-assignments/${id}/end`),
};

export default mentorApi;
