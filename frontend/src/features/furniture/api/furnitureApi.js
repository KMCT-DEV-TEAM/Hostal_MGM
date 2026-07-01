import apiClient from '@/services/axios';

const getFurnitureTypes = (params) => apiClient.get('/furniture', { params });
const getFurnitureTypeDetails = (typeId, params) => apiClient.get(`/furniture/${typeId}`, { params });
const createFurnitureType = (data) => apiClient.post('/furniture', data);
const updateFurnitureType = (typeId, data) => apiClient.put(`/furniture/${typeId}`, data);
const deleteFurnitureType = (typeId) => apiClient.delete(`/furniture/${typeId}`);
const adjustAssetsCount = (typeId, data) => apiClient.patch(`/furniture/${typeId}/assets-count`, data);
const changeAssetStatus = (assetId, data) => apiClient.patch(`/furniture/assets/${assetId}/status`, data);

const furnitureApi = {
    getFurnitureTypes,
    getFurnitureTypeDetails,
    createFurnitureType,
    updateFurnitureType,
    deleteFurnitureType,
    adjustAssetsCount,
    changeAssetStatus
};

export default furnitureApi;
