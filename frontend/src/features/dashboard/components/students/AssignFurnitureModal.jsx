import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, ChevronDown } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import furnitureApi from "@/features/furniture/api/furnitureApi";

// A custom multi-select for the furnitures
function MultiSelectDropdown({ options = [], value = [], onChange, placeholder, lookup = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (optValue) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const removeChip = (e, optValue) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optValue));
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="min-h-[42px] border border-gray-200 rounded-lg px-3 py-1.5 flex flex-wrap items-center gap-1.5 cursor-pointer bg-white transition-colors focus-within:border-secondary"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value.length === 0 && (
          <span className="text-sm text-gray-400 py-1">{placeholder}</span>
        )}
        {value.map((v) => {
          const opt = options.find((o) => o.value === v) || lookup[v] || { label: v };
          return (
            <span
              key={v}
              className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium"
            >
              {opt.label}
              <X
                className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={(e) => removeChip(e, v)}
              />
            </span>
          );
        })}
        <div className="flex-1 min-w-[20px]" />
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400 text-center">
              No options available for this type
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${isSelected
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                  onClick={() => handleToggle(opt.value)}
                >
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

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
      furnitureApi.getFurnitureTypes({ limit: 1000 }).then(res => {
        const types = res.data.data || [];
        console.log('type', res.data.data);
        setFurnitureTypes(types.map(t => ({ label: t.name, value: t._id })));
      }).catch(console.error);

      if (isEdit && assignedFurnitures.length > 0) {
        setFurnitures(assignedFurnitures.map(f => f._id));
      } else {
        setFurnitures([]);
      }
      setSelectedTypeId("");
      setAvailableAssets([]);
    }
  }, [isOpen, isEdit, assignedFurnitures]);

  useEffect(() => {
    if (selectedTypeId) {
      furnitureApi.getAllFurnitureAssets({ status: "Available", furnitureTypeId: selectedTypeId, limit: 1000 })
        .then(res => {
          const assets = res.data?.data?.assets || res.data?.assets || res.data || [];
          setAvailableAssets(assets.map(a => ({
            label: `${a.furnitureTypeId?.name || "Asset"} (${a.furnitureId || a.code})`,
            value: a._id
          })));
        }).catch(console.error);
    } else {
      setAvailableAssets([]);
    }
  }, [selectedTypeId]);

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
    >
      <form onSubmit={handleSubmit} className="p-1 space-y-6">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Furniture Type</label>
          <Dropdown
            options={furnitureTypes}
            value={selectedTypeId}
            onChange={setSelectedTypeId}
            placeholder="Select type"
            className="w-full"
            triggerClassName="px-3 py-2 text-sm bg-white border-gray-200 focus:border-primary h-[42px]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Furniture Assets</label>
          <MultiSelectDropdown
            options={availableAssets}
            value={furnitures}
            onChange={setFurnitures}
            placeholder={selectedTypeId ? "Select Furnitures" : "Select a type first"}
            lookup={lookup}
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
