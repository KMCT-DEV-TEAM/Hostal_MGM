import mentorApi from '@/features/dashboard/api/mentorApi';

export async function createMentor(role, payload) {
  const response = await mentorApi.createMentor(role, payload);
  return response.data;
}

export async function getMentors(role, params) {
  const response = await mentorApi.getMentors(role, params);
  return response.data;
}

export async function getMentorOrganizations(role, params) {
  const response = await mentorApi.getMentorOrganizations(role, params);
  return response.data;
}

export async function getMentorById(role, id) {
  const response = await mentorApi.getMentorById(role, id);
  return response.data;
}

export async function updateMentor(role, id, payload) {
  const response = await mentorApi.updateMentor(role, id, payload);
  return response.data;
}

export async function updateMentorStatus(role, id, payload) {
  const response = await mentorApi.updateMentorStatus(role, id, payload);
  return response.data;
}

export async function deleteMentor(role, id) {
  const response = await mentorApi.deleteMentor(role, id);
  return response.data;
}

// Mentor Assignments
export async function assignMentor(role, payload) {
  const response = await mentorApi.assignMentor(role, payload);
  return response.data;
}

export async function getMentorAssignments(role, params) {
  const response = await mentorApi.getMentorAssignments(role, params);
  return response.data;
}

export async function getMentorAssignmentById(role, id) {
  const response = await mentorApi.getMentorAssignmentById(role, id);
  return response.data;
}

export async function updateMentorAssignment(role, id, payload) {
  const response = await mentorApi.updateMentorAssignment(role, id, payload);
  return response.data;
}

export async function transferMentor(role, id, payload) {
  const response = await mentorApi.transferMentor(role, id, payload);
  return response.data;
}

export async function endMentorAssignment(role, id) {
  const response = await mentorApi.endMentorAssignment(role, id);
  return response.data;
}

const mentorService = {
  createMentor,
  getMentors,
  getMentorOrganizations,
  getMentorById,
  updateMentor,
  updateMentorStatus,
  deleteMentor,
  // Mentor Assignments
  assignMentor,
  getMentorAssignments,
  getMentorAssignmentById,
  updateMentorAssignment,
  transferMentor,
  endMentorAssignment,
};

export default mentorService;
