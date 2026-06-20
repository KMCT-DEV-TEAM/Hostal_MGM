import api from '@/services/axios';

const studentApi = {
  createStudent: (payload) =>
    api.post("/admin/students", payload),

  updateStudent: (id, payload) =>
    api.put(`/admin/students/${id}`, payload),

  updateStudentByAdmin: (id, payload) =>
    api.put(`/admin/students/${id}`, payload),

  updateStudentBySuperAdmin: (id, payload) =>
    api.put(`/super-admin/students/${id}`, payload),

  changeStudentEmailByAdmin: (id, payload) =>
    api.patch(`/admin/students/${id}/change-email`, payload),

  changeStudentEmailBySuperAdmin: (id, payload) =>
    api.patch(`/super-admin/students/${id}/change-email`, payload),

  getStudentsByAdmin: (params) =>
    api.get("/admin/students/admin", { params })
  ,

  getStudentFilterOptionsByAdmin: (params) =>
    api.get("/admin/students/filters", { params }),

  toggleStatusByAdmin: (id) =>
    api.patch(`/admin/students/${id}/toggle-status`),

  bulkStatusByAdmin: ({ ids, isActive }) =>
    api.patch(`/admin/students/bulk-status`, { ids, isActive }),

  //----super admin 
  getStudentsBySuperAdmin: (params) =>
    api.get("/super-admin/students/super-admin", { params }),

  getStudentFilterOptionsBySuperAdmin: (params) =>
    api.get("/super-admin/students/filters", { params }),

  toggleStatusBySuperAdmin: (id) =>
    api.patch(`/super-admin/students/${id}/toggle-status`),

  bulkStatusBySuperAdmin: ({ ids, isActive }) =>
    api.patch(`/super-admin/students/bulk-status`, { ids, isActive }),

  getStudentsByWarden: (params) =>
    api.get("/warden/students/warden", { params }),

  getStudentFilterOptionsByWarden: (params) =>
    api.get("/warden/students/filters", { params }),

};

export default studentApi;
