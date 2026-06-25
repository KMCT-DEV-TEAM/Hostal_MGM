import axiosInstance from "@/services/axios";

export const logApi = {
    getLogs: async (params) => {
        return await axiosInstance.get('/logs', { params });
    },
};
