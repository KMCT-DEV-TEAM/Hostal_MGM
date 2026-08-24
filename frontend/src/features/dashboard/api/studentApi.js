import api from '@/services/axios';

const studentApi = {
  getStudentDashboardStats: (params) => api.get("/student/dashboard/student/stats", { params }),

  createStudent: (payload) =>
    api.post("/students/", payload),

  updateStudent: (id, payload) =>
    api.put(`/students/${id}`, payload),

  updateStudentByAdmin: (id, payload) =>
    api.put(`/students/${id}`, payload),

  updateStudentBySuperAdmin: (id, payload) =>
    api.put(`/students/${id}`, payload),

  changeStudentEmailByAdmin: (id, payload) =>
    api.patch(`/students/${id}/change-email`, payload),

  changeStudentEmailBySuperAdmin: (id, payload) =>
    api.patch(`/students/${id}/change-email`, payload),

  getStudentByIdByAdmin: (id) => api.get(`/students/${id}`),

  getStudentsByAdmin: (params) =>
    api.get("/students/admin", { params }),

  getStudentFilterOptionsByAdmin: (params) =>
    api.get("/students/filters", { params }),

  getStudentFurnituresByAdmin: (id) =>
    api.get(`/students/${id}/furnitures`),

  toggleStatusByAdmin: (id) =>
    api.patch(`/students/${id}/toggle-status`),

  bulkStatusByAdmin: ({ ids, isActive }) =>
    api.patch(`/students/bulk-status`, { ids, isActive }),

  //----super admin 
  getStudentByIdBySuperAdmin: (id) => api.get(`/students/${id}`),

  getStudentsBySuperAdmin: (params) =>
    api.get("/students/super-admin", { params }),

  getStudentFilterOptionsBySuperAdmin: (params) =>
    api.get("/students/filters", { params }),

  getStudentFurnituresBySuperAdmin: (id) =>
    api.get(`/students/${id}/furnitures`),

  toggleStatusBySuperAdmin: (id) =>
    api.patch(`/students/${id}/toggle-status`),

  bulkStatusBySuperAdmin: ({ ids, isActive }) =>
    api.patch(`/students/bulk-status`, { ids, isActive }),

  getStudentByIdByWarden: (id) => api.get(`/students/${id}`),

  getStudentsByWarden: (params) =>
    api.get("/students/warden", { params }),

  getStudentFilterOptionsByWarden: (params) =>
    api.get("/students/filters", { params }),

  getStudentFurnituresByWarden: (id) =>
    api.get(`/students/${id}/furnitures`),

  //---- mentor ----
  getStudentsByMentor: (params) =>
    api.get("/students/mentor", { params }),
  getStudentByIdByMentor: (id) => api.get(`/students/${id}`),

};

export default studentApi;
