import axios from "./axios";

export const updateStudentHostel = async (studentId, data) => {
  const response = await axios.patch(`/student-hostels/${studentId}`, data);
  return response.data;
};

export const vacateHostel = async (studentId, data = {}) => {
  const response = await axios.patch(`/student-hostels/${studentId}/vacate`, data);
  return response.data;
};
export const getStudentHostelTimeline = async (studentId) => {
  const response = await axios.get(`/student-hostels/student/${studentId}`);
  return response.data;
};
