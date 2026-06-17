import api from '@/services/axios';

const studentApi = {
  createStudent: (payload) =>
    api.post("/admin/students", payload),

  getStudentsByAdmin: (params) =>
    api.get("/admin/students/admin", { params }),
};

export default studentApi;
