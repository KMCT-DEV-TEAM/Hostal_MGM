import furnitureApi from '@/features/furniture/api/furnitureApi';

class FurnitureService {
  async getFurnitureTypes(params = {}) {
    const response = await furnitureApi.getFurnitureTypes(params);
    return response.data;
  }

  async getFurnitureTypeDetails(typeId, params = {}) {
    const response = await furnitureApi.getFurnitureTypeDetails(typeId, params);
    return response.data;
  }

  async createFurnitureType(data) {
    const response = await furnitureApi.createFurnitureType(data);
    return response.data;
  }

  async updateFurnitureType(typeId, data) {
    const response = await furnitureApi.updateFurnitureType(typeId, data);
    return response.data;
  }

  async deleteFurnitureType(typeId) {
    const response = await furnitureApi.deleteFurnitureType(typeId);
    return response.data;
  }

  async adjustAssetsCount(typeId, count) {
    const response = await furnitureApi.adjustAssetsCount(typeId, { count });
    return response.data;
  }

  async changeAssetStatus(assetId, status) {
    const response = await furnitureApi.changeAssetStatus(assetId, { status });
    return response.data;
  }
}

export const furnitureService = new FurnitureService();
