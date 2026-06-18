import api from '@/services/axios';

const studentApi = {
  createStudent: (payload) =>
    api.post("/admin/students", payload),

  updateStudent: (id, payload) =>
    api.put(`/admin/students/${id}`, payload),

  getStudentsByAdmin: (params) =>
    api.get("/admin/students/admin", { params })
  ,

  getStudentFilterOptionsByAdmin: (params) =>
    api.get("/admin/students/filters", { params }),

  toggleStatusByAdmin: (id) =>
    api.patch(`/admin/students/${id}/toggle-status`),

  //----super admin 
  getStudentsBySuperAdmin: (params) =>
    api.get("/super-admin/students/super-admin", { params }),

  getStudentFilterOptionsBySuperAdmin: (params) =>
    api.get("/super-admin/students/filters", { params }),

  toggleStatusBySuperAdmin: (id) =>
    api.patch(`/super-admin/students/${id}/toggle-status`),

  getStudentFilterOptionsByWarden: (params) =>
    api.get("/warden/students/filters", { params }),

};

export default studentApi;
