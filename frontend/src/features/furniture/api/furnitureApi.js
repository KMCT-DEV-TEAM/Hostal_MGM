import apiClient from '@/services/axios';

const API_BASE_URL = '/furniture';

const getFurnitureTypes = (params) => apiClient.get(`${API_BASE_URL}/types`, { params });
const getFurnitureTypeDetails = (typeId, params) => apiClient.get(`${API_BASE_URL}/types/${typeId}`, { params });
const getFurnitureTypeAssets = (typeId, params) => apiClient.get(`${API_BASE_URL}/types/${typeId}/assets`, { params });
const getAllFurnitureAssets = (params) => apiClient.get(`${API_BASE_URL}/assets`, { params });
const getFurnitureAssetDetails = (assetId) => apiClient.get(`${API_BASE_URL}/assets/${assetId}`);
const createFurnitureType = (data) => apiClient.post(`${API_BASE_URL}/types`, data);
const updateFurnitureType = (typeId, data) => apiClient.put(`${API_BASE_URL}/types/${typeId}`, data);
const deleteFurnitureType = (typeId) => apiClient.delete(`${API_BASE_URL}/types/${typeId}`);
const adjustAssetsCount = (typeId, data) => apiClient.patch(`${API_BASE_URL}/types/${typeId}/assets-count`, data);
const getActiveFurnitureTypesList = (params) => apiClient.get(`${API_BASE_URL}/types/active`, { params });
const getAvailableFurnitureAssetsList = (typeId, params) => apiClient.get(`${API_BASE_URL}/types/${typeId}/assets/active`, { params });

const allocateAsset = (studentId, assetId) => apiClient.post(`${API_BASE_URL}/students/${studentId}/assets/${assetId}/allocate`);
const returnAsset = (studentId, assetId) => apiClient.post(`${API_BASE_URL}/students/${studentId}/assets/${assetId}/return`);
const assignFurnitures = (studentId, data) => apiClient.post(`${API_BASE_URL}/students/${studentId}/assets/assign`, data); // No backend

const changeAssetStatus = (assetId, data) => apiClient.patch(`${API_BASE_URL}/assets/${assetId}/status`, data);
const startMaintenance = (assetId) => apiClient.post(`${API_BASE_URL}/assets/${assetId}/maintenance/start`);
const completeMaintenance = (assetId) => apiClient.post(`${API_BASE_URL}/assets/${assetId}/maintenance/complete`);

const getDashboardStats = () => apiClient.get(`${API_BASE_URL}/dashboard`);

const furnitureApi = {
    getFurnitureTypes,
    getFurnitureTypeDetails,
    getFurnitureTypeAssets,
    getAllFurnitureAssets,
    getFurnitureAssetDetails,
    createFurnitureType,
    updateFurnitureType,
    deleteFurnitureType,
    adjustAssetsCount,
    allocateAsset,
    returnAsset,
    changeAssetStatus,
    startMaintenance,
    completeMaintenance,
    getDashboardStats,
    getActiveFurnitureTypesList,
    getAvailableFurnitureAssetsList,
    assignFurnitures
};

export default furnitureApi;
