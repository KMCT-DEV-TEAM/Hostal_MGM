import api from '@/services/axios';

const studentApi = {
  getStudentDashboardStats: (params) => api.get("/student/dashboard/student/stats", { params }),

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

  getStudentByIdByAdmin: (id) => api.get(`/admin/students/${id}`),

  getStudentsByAdmin: (params) =>
    api.get("/admin/students/admin", { params })
  ,

  getStudentFilterOptionsByAdmin: (params) =>
    api.get("/admin/students/filters", { params }),

  getStudentFurnituresByAdmin: (id) =>
    api.get(`/admin/students/${id}/furnitures`),

  toggleStatusByAdmin: (id) =>
    api.patch(`/admin/students/${id}/toggle-status`),

  bulkStatusByAdmin: ({ ids, isActive }) =>
    api.patch(`/admin/students/bulk-status`, { ids, isActive }),

  //----super admin 
  getStudentByIdBySuperAdmin: (id) => api.get(`/students/${id}`),

  getStudentsBySuperAdmin: (params) =>
    api.get("/students/super-admin", { params }),

  getStudentFilterOptionsBySuperAdmin: (params) =>
    api.get("/super-admin/students/filters", { params }),

  getStudentFurnituresBySuperAdmin: (id) =>
    api.get(`/super-admin/students/${id}/furnitures`),

  toggleStatusBySuperAdmin: (id) =>
    api.patch(`/super-admin/students/${id}/toggle-status`),

  bulkStatusBySuperAdmin: ({ ids, isActive }) =>
    api.patch(`/super-admin/students/bulk-status`, { ids, isActive }),

  getStudentByIdByWarden: (id) => api.get(`/warden/students/${id}`),

  getStudentsByWarden: (params) =>
    api.get("/warden/students/warden", { params }),

  getStudentFilterOptionsByWarden: (params) =>
    api.get("/warden/students/filters", { params }),

  getStudentFurnituresByWarden: (id) =>
    api.get(`/warden/students/${id}/furnitures`),

  //---- mentor ----
  getStudentsByMentor: (params) =>
    api.get("/admin/students/mentor", { params }),
  getStudentByIdByMentor: (id) => api.get(`/admin/students/${id}`),

};

export default studentApi;
