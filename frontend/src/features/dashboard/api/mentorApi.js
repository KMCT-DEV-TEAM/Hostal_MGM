import api from '@/services/axios';

const mentorApi = {
    createMentor: (role, payload) =>
        api.post(`/mentors`, payload),

    getMentors: (role, params) =>
        api.get(`/mentors`, { params }),

    getMentorOrganizations: (role, params) =>
        api.get(`/mentors/organizations`, { params }),

    getMentorById: (role, id) =>
        api.get(`/mentors/${id}`),

    updateMentor: (role, id, payload) =>
        api.patch(`/mentors/${id}`, payload),

    updateMentorStatus: (role, id, payload) =>
        api.patch(`/mentors/${id}/status`, payload),

    deleteMentor: (role, id) =>
        api.delete(`/mentors/${id}`),

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

    endMentorAssignment: (id, payload) =>
        api.patch(`/mentor-assignments/${id}/release`, payload),
};

export default mentorApi;
