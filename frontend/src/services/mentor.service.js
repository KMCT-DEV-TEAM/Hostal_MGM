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

const mentorService = {
  createMentor,
  getMentors,
  getMentorOrganizations,
  getMentorById,
  updateMentor,
  updateMentorStatus,
  deleteMentor,
};

export default mentorService;
