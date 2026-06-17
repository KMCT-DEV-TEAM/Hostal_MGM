import studentApi from '@/features/dashboard/api/studentApi';

/**
 * Create a new Student
 * @param {Object} payload 
 */
export async function createStudent(payload) {
  const response = await studentApi.createStudent(payload);
  return response.data;
}

/**
 * Fetch a list of Students for Admin
 * @param {Object} params - e.g. { page: 1, limit: 10 }
 */
export async function getStudentsByAdmin(params) {
  const response = await studentApi.getStudentsByAdmin(params);
  return response.data;
}

const studentService = {
  createStudent,
  getStudentsByAdmin,
};

export default studentService;
