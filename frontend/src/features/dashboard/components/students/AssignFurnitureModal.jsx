import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, ChevronDown } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import AsyncDropdown from "@/components/ui/AsyncDropdown";
import furnitureApi from "@/features/furniture/api/furnitureApi";


export default function AssignFurnitureModal({
  isOpen,
  onClose,
  isEdit = false,
  student,
  assignedFurnitures = [],
  onSave
}) {
  const [furnitures, setFurnitures] = useState([]);
  const [furnitureTypes, setFurnitureTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [availableAssets, setAvailableAssets] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && assignedFurnitures.length > 0) {
        setFurnitures(assignedFurnitures.map(f => f._id));
      } else {
        setFurnitures([]);
      }
      setSelectedTypeId("");
    }
  }, [isOpen, isEdit, assignedFurnitures]);

  const fetchFurnitureTypesOptions = async ({ page, search }) => {
    try {
      const res = await furnitureApi.getActiveFurnitureTypesList({ page, search, limit: 10 });
      const types = res.data?.data?.types || res.data?.types || res.data?.data || [];
      const pagination = res.data?.data?.pagination || res.data?.pagination || {};
      
      return {
        options: types.map(t => ({ label: t.name, value: t._id })),
        hasMore: page < (pagination.totalPages || 1)
      };
    } catch (error) {
      console.error(error);
      return { options: [], hasMore: false };
    }
  };

  const fetchFurnitureAssetsOptions = async ({ page, search }) => {
    if (!selectedTypeId) return { options: [], hasMore: false };
    try {
      const res = await furnitureApi.getAvailableFurnitureAssetsList(selectedTypeId, { page, search, limit: 10 });
      const assets = res.data?.data?.assets || res.data?.assets || res.data?.data || [];
      const pagination = res.data?.data?.pagination || res.data?.pagination || {};
      
      return {
        options: assets.map(a => ({
          label: `${a.furnitureTypeId?.name || "Asset"} (${a.furnitureId || a.code})`,
          value: a._id
        })),
        hasMore: page < (pagination.totalPages || 1)
      };
    } catch (error) {
      console.error(error);
      return { options: [], hasMore: false };
    }
  };

  const lookup = useMemo(() => {
    const map = {};
    assignedFurnitures.forEach(f => {
      map[f._id] = { label: `${f.furnitureTypeId?.name || "Asset"} (${f.furnitureId || f.code})`, value: f._id };
    });
    return map;
  }, [assignedFurnitures]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave({ furnitures });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Assigned Furniture" : "Assign Furniture"}
      subtitle={
        isEdit
          ? "Edit the details of assigned furnitures"
          : "Fill the details to assign furniture to student"
      }
      maxWidth="max-w-lg"
      overflowClass="overflow-visible"
    >
      <form onSubmit={handleSubmit} className="p-1 space-y-6">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Furniture Type</label>
          <AsyncDropdown
            fetchOptions={fetchFurnitureTypesOptions}
            value={selectedTypeId}
            onChange={(val) => {
              setSelectedTypeId(val);
            }}
            placeholder="Select type"
            className="w-full"
            triggerClassName="px-3 py-2 text-sm bg-white border-gray-200 focus:border-primary h-[42px]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Furniture Assets</label>
          <AsyncDropdown
            key={selectedTypeId} // Re-mount when type changes to reset options
            isMulti={true}
            fetchOptions={fetchFurnitureAssetsOptions}
            value={furnitures}
            onChange={setFurnitures}
            placeholder={selectedTypeId ? "Select Furnitures" : "Select a type first"}
            lookup={lookup}
            triggerClassName="px-3 py-2 text-sm bg-white border-gray-200 focus:border-primary min-h-[42px]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button
            type="submit"
            className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-md text-sm font-medium w-full sm:w-auto"
          >
            {isEdit ? "Save Changes" : "Assign"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 w-full sm:w-auto order-first sm:order-last"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
